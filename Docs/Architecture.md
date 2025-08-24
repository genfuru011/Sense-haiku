## Architecture

### Overview
- Vite + React 18（SPA）
- TSライト運用（型は `types.ts` を中心に共有）
- 状態: `contexts/AuthContext.tsx`（モック認証）
- サービス: `services/geminiService.ts`（Gemini連携、キー未設定時はスタブ）

### Directory
- `pages/`: ルーティングの単位
- `components/`: UIコンポーネント
- `components/icons/`: アイコン
- `services/`: 外部連携
- `contexts/`: グローバル状態
- `Docs/`: ドキュメント

### Data Flow
1. `App.tsx` で投稿配列を保持
2. 子の `HomePage`/`HaikuCard` へ props で受け渡し
3. 返信/リアクションは `App.tsx` のハンドラを呼ぶ

### Routing
- `react-router-dom` で定義
- `ProtectedRoute` で `/new` と `/profile` を保護

### Env/Build
- `vite.config.ts` で `process.env.GEMINI_API_KEY` を定義
- `.env` の `GEMINI_API_KEY` を読み取り（未設定可）


