# Architecture

### Overview
- Vite + React 18（SPA）
- TSライト運用（型は `types.ts` を中心に共有）
- 状態: `contexts/AuthContext.tsx`（JWT認証）
- サービス: `services/backendService.ts`（バックエンドAPI連携）
- AI: `services/geminiService.ts`（Gemini連携、キー未設定時はスタブ）

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
4. 認証状態は `AuthContext` で管理

### Routing
- `react-router-dom` で定義
- `ProtectedRoute` で `/new` と `/profile` を保護

### SNSライクな機能
- デバイス判定: `useDeviceDetection` フック
- プルダウン更新: `usePullToRefresh` フック（モバイル）
- 無限スクロール: `IntersectionObserver`（PC）
- ページネーション: バックエンドAPI連携

### 認証システム
- JWT認証（バックエンド連携）
- ユーザー情報の永続化
- ログイン状態の自動復元

### Env/Build
- `vite.config.ts` で `process.env.GEMINI_API_KEY` を定義
- `.env` の `GEMINI_API_KEY` を読み取り（未設定可）
- バックエンド: `backend/.env` でAI設定管理

### Backend
- FastAPI + SQLite
- JWT認証
- AIプロキシ（Gemini/OpenAI）
- モーラ計算API


