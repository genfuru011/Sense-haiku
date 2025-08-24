## 開発手順（Dev.md）

### セットアップ
- Node.js 20系推奨
- 依存関係のインストール
```
npm install
```

### バックエンドセットアップ
```
npm run setup:api
```

### 開発サーバー
- APIとWebを同時起動
```
npm run dev:all
```
- 片方だけ
```
npm run dev:api
npm run dev:web
```
ブラウザで `http://localhost:5173`（ポート重複時は5174）を開く。

### ビルド/プレビュー
```
npm run build
npm run preview
```

### 環境変数
- フロント: `.env` に `VITE_API_BASE=http://127.0.0.1:8000`
- AI機能（任意）: `GEMINI_API_KEY`

### 技術スタック
- Vite + React 18
- TypeScript（ライト運用: strict無効）
- FastAPI + SQLite（開発）
- Tailwind CDN（開発用）

### ディレクトリ
- `pages/` ルーティングページ
- `components/` UIコンポーネント
- `services/` API/外部連携
- `contexts/` グローバル状態
- `backend/` FastAPIアプリ
- `Docs/` ドキュメント


