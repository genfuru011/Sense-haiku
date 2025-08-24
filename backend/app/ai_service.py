import os
import time
import json
import asyncio
from pathlib import Path
from typing import Dict, List

import httpx
from fastapi import HTTPException
from dotenv import load_dotenv
import logging


class AIService:
    """AIプロキシ層（Gemini / OpenAI 両対応）。キー秘匿・タイムアウト・レート制限を実装。

    環境変数（backend/.env）
    - AI_PROVIDER: "gemini" | "openai"（既定: gemini）
    - AI_MODEL:    例 gemini-1.5-flash / gpt-4o-mini（未指定時は各プロバイダ既定）
    - GEMINI_API_KEY / OPENAI_API_KEY
    - AI_TIMEOUT_SECONDS（既定15）
    - AI_MAX_RPM（既定10）
    """

    def __init__(self) -> None:
        # backend/.env を確実に読み込む
        backend_root = Path(__file__).resolve().parents[1]
        load_dotenv(backend_root / ".env")

        # プロバイダ/モデル
        self.provider = os.getenv("AI_PROVIDER", "gemini").lower()
        self.model = os.getenv("AI_MODEL")

        # プロバイダ毎のキーとエンドポイント
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

        # 既定モデル
        if not self.model:
            self.model = "gemini-2.5-flash" if self.provider == "gemini" else "gpt-4o-mini"

        # GeminiのベースURL（モデル埋め込み）
        self.gemini_base_url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )
        # OpenAI Chat Completions
        self.openai_chat_url = "https://api.openai.com/v1/chat/completions"
        self.timeout_seconds = int(os.getenv("AI_TIMEOUT_SECONDS", "15"))
        self.window_seconds = 60
        self.max_requests_per_minute = int(os.getenv("AI_MAX_RPM", "10"))
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "1"))

        # レート制限用: key(ユーザーID or IP) -> request timestamps
        self._rate_log: Dict[str, List[float]] = {}
        self._lock = asyncio.Lock()
        self._logger = logging.getLogger("ai")

    async def _check_rate_limit(self, key: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds
        async with self._lock:
            timestamps = self._rate_log.get(key, [])
            # ウィンドウ外を除去
            timestamps = [ts for ts in timestamps if ts >= window_start]
            if len(timestamps) >= self.max_requests_per_minute:
                # ログにキー種別と現在カウントを記録
                kind = "user" if key.startswith("user:") else "anon"
                self._logger.warning(
                    "AI rate limit exceeded: kind=%s count=%d rpm=%d",
                    kind,
                    len(timestamps),
                    self.max_requests_per_minute,
                )
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            timestamps.append(now)
            self._rate_log[key] = timestamps

    async def check_rate_limit(self, key: str) -> None:
        """外部から呼び出すためのレート制限チェック。"""
        await self._check_rate_limit(key)

    async def generate_haiku(self, text: str) -> Dict[str, str]:
        # 優先プロバイダを試し、混雑/レート超過時はもう一方にフォールバック
        primary = self.provider
        backup = "openai" if primary == "gemini" else "gemini"
        try:
            if primary == "openai":
                if not self.openai_key:
                    raise HTTPException(status_code=503, detail="AI service not configured")
                return await self._generate_via_openai(text)
            else:
                if not self.gemini_key:
                    raise HTTPException(status_code=503, detail="AI service not configured")
                return await self._generate_via_gemini(text)
        except HTTPException as e:
            if e.status_code in (429, 503):
                # フォールバック条件を満たす場合のみ
                try:
                    if backup == "openai" and self.openai_key:
                        self._logger.info("AI fallback -> openai")
                        return await self._generate_via_openai(text)
                    if backup == "gemini" and self.gemini_key:
                        self._logger.info("AI fallback -> gemini")
                        return await self._generate_via_gemini(text)
                except HTTPException:
                    pass
            raise

    async def _post_with_retries(self, client: httpx.AsyncClient, url: str, payload: dict, headers: dict) -> httpx.Response:
        attempt = 0
        last_exc: Exception | None = None
        while attempt <= self.max_retries:
            try:
                return await client.post(url, json=payload, headers=headers)
            except httpx.TimeoutException as exc:
                last_exc = exc
                attempt += 1
                if attempt > self.max_retries:
                    raise
                # 短い指数バックオフ
                await asyncio.sleep(min(2.0, 0.3 * (2 ** (attempt - 1))))

    async def _generate_via_gemini(self, text: str) -> Dict[str, str]:
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "以下の文章から、情景が目に浮かぶような美しい五七五の俳句を生成してください。\n\n"
                                f"テーマ: \"{text}\"\n\n"
                                "必ず、厳密にモーラ数（https://ja.wikipedia.org/wiki/モーラ）で五音、七音、五音のリズムを守ってください。季語を入れるよう努めてください。\n"
                                "JSONで返してください: {\"line1\":...,\"line2\":...,\"line3\":...}"
                            )
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "topK": 40,
                "topP": 0.9,
                "maxOutputTokens": 200,
            },
        }

        headers = {"Content-Type": "application/json"}
        try:
            t0 = time.time()
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                url = f"{self.gemini_base_url}?key={self.gemini_key}"
                resp = await self._post_with_retries(client, url, payload, headers)
                if resp.status_code != 200:
                    try:
                        err = resp.json()
                        msg = err.get("error", {}).get("message") or err
                    except Exception:
                        msg = resp.text
                    self._logger.error("AI upstream error(gemini): %s", str(msg)[:200])
                    raise HTTPException(status_code=503, detail="AI upstream error")

                data = resp.json()
                try:
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                except Exception:
                    self._logger.warning("AI response missing text field (gemini)")
                    return {"line1": "AI生成", "line2": "失敗しました", "line3": "時間を置いて"}

                return self._extract_and_format(content, t0, text)
        except httpx.TimeoutException:
            self._logger.warning("AI timeout after %ds (gemini)", self.timeout_seconds)
            raise HTTPException(status_code=408, detail="AI timeout")

    async def _generate_via_openai(self, text: str) -> Dict[str, str]:
        payload = {
            "model": self.model,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "あなたはプロの俳人です。与えられたテーマから五七五の俳句を生成します。"
                        "厳密に五音/七音/五音を守り、JSONのみを返してください。"
                        "{\"line1\":...,\"line2\":...,\"line3\":...}"
                    ),
                },
                {"role": "user", "content": f"テーマ: {text}"},
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 120,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.openai_key}",
        }
        try:
            t0 = time.time()
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await self._post_with_retries(client, self.openai_chat_url, payload, headers)
                if resp.status_code != 200:
                    try:
                        err = resp.json()
                        msg = err.get("error", {}).get("message") or err
                    except Exception:
                        msg = resp.text
                    self._logger.error("AI upstream error(openai): %s", str(msg)[:200])
                    raise HTTPException(status_code=503, detail="AI upstream error")

                data = resp.json()
                try:
                    content = data["choices"][0]["message"]["content"]
                except Exception:
                    self._logger.warning("AI response missing text field (openai)")
                    return {"line1": "AI生成", "line2": "失敗しました", "line3": "時間を置いて"}

                return self._extract_and_format(content, t0, text)
        except httpx.TimeoutException:
            self._logger.warning("AI timeout after %ds (openai)", self.timeout_seconds)
            raise HTTPException(status_code=408, detail="AI timeout")

    def _extract_and_format(self, content: str, t0: float, original_text: str) -> Dict[str, str]:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            try:
                obj = json.loads(content[start : end + 1])
                self._logger.info(
                    "AI success: len=%d in %.0fms", len(original_text), (time.time() - t0) * 1000
                )
                return {
                    "line1": obj.get("line1", "生成失敗"),
                    "line2": obj.get("line2", "五七五の"),
                    "line3": obj.get("line3", "言葉見つからず"),
                }
            except json.JSONDecodeError:
                pass

        lines = [ln.strip() for ln in content.strip().split("\n") if ln.strip()]
        if len(lines) >= 3:
            self._logger.info(
                "AI success(fallback): len=%d in %.0fms", len(original_text), (time.time() - t0) * 1000
            )
            return {"line1": lines[0], "line2": lines[1], "line3": lines[2]}

        self._logger.warning(
            "AI parsing failed: no lines, len=%d in %.0fms", len(original_text), (time.time() - t0) * 1000
        )
        return {"line1": "AI生成", "line2": "失敗しました", "line3": "手動で入力"}


ai_service = AIService()


