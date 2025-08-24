## Troubleshooting

### 1) 画面が真っ白
- 開発者ツールのコンソール確認
- importmap を使わない（`index.html` から削除済）
- `npm install` をやり直す（`node_modules` と `package-lock.json` を削除）
- `npm run dev` を再起動

### 2) Geminiのエラー（API Key 必須）
- `.env` に `GEMINI_API_KEY=...` を設定
- 未設定でもアプリは動作（スタブ応答）。本番時は必須

### 3) Tailwindの警告
- CDNは開発用。将来的にローカル導入

### 4) ルーティングが404
- 直接アクセス時は Vite dev server で解決。`preview` 本番時はSPA設定を確認


