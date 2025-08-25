# Changelog
All notable changes to this project will be documented in this file.
This project adheres to Keep a Changelog and uses SemVer.

## [Unreleased]
- Doc: ER図とシーケンス図の拡充（usersテーブル、返信/引用、認証、AI生成）
- UX: エラー通知システム（トースト/再試行機能）の実装
- Security: CORS設定を環境変数化（本番環境でのセキュリティ向上）
- Add: More reaction icons (Suki/Iki/Naki/Wara)
- Doc: Add Architecture, Troubleshooting, env example
- Change: TS light configuration (strict off)
- Feat: Backend FastAPI + SQLite scaffold
- Feat: Posts schema extended (author/image/reply/quote)
- Feat: Reactions API (sense/fukai) with toggle and trending sort
- Feat: Frontend wired to backend (fetch/create/react)
- Chore: CORS restricted to localhost:5173/5174; unified dev scripts

## [0.1.0] - 2025-08-24
- Initial public structure, mock auth, haiku posting, AI stub

## [2024-08-24] - AIプロキシ・モーラ計算実装

### 追加
- AIプロキシ機能（Gemini/OpenAI両対応）
  - `POST /api/ai/haiku` エンドポイント
  - 環境変数によるプロバイダ切替（`AI_PROVIDER=gemini|openai`）
  - レート制限・タイムアウト・自動フォールバック機能
  - フロントエンドのAI生成UI（バックエンド経由）

- モーラ計算API
  - `POST /api/mora/count` エンドポイント
  - fugashi + unidic-lite による形態素解析
  - リアルタイムモーラ数表示（3/5, 6/7, 4/5形式）

### 改善
- エラーハンドリング強化
  - AI失敗時のユーザーフレンドリーなメッセージ
  - サーバーログの詳細化（成功/失敗/レート超過）
- フロントエンドの計算負荷をバックエンドに移譲

### 技術的変更
- 依存関係追加: `httpx`, `python-dotenv`, `fugashi`, `unidic-lite`
- 環境変数設定例の更新（AI関連設定追加）

## [2024-08-23] - 認証・投稿機能実装

### 追加
- JWT認証システム
  - バックエンド連携による完全な認証
  - ユーザー情報管理・永続化
  - ログイン/サインアップ機能

- 投稿・返信・引用機能
  - 返信投稿（`POST /api/posts/{id}/reply`）
  - 引用投稿（`POST /api/posts/{id}/quote`）
  - 階層表示（返信・引用の表示）

- リアクション機能（sense/fukai）
  - サーバーサイドでのリアクション管理

- SNSライクなUI/UX
  - デバイス判定（PC/モバイル）
  - プルダウン更新（モバイル）
  - 無限スクロール（PC）
  - 最新投稿読み込みボタン（PC）
  - ページネーション・ローディング状態

- 人気/新着タブのサーバ連動
  - ソート機能（新着/人気）
  - ページネーション対応

### 技術的変更
- フロントエンド: `useDeviceDetection`, `usePullToRefresh` カスタムフック
- バックエンド: ユーザーテーブル追加、JWT認証実装
- 依存関係追加: `python-jose`, `passlib`, `python-multipart`, `email-validator`


