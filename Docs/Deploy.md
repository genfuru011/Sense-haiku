# Render デプロイ手順

## 概要
Sense-haikuをRenderでデプロイする手順です。

**最新の機能**
- モバイル最適化（右下固定投稿ボタン、プルダウン更新）
- 投稿詳細ページ（階層的な返信システム）
- AI支援機能（Gemini/OpenAI対応）
- リアルタイムモーラ計算

## 前提条件
- GitHubアカウント
- Renderアカウント
- Gemini API キー（または OpenAI API キー）

## デプロイ手順

### 1. バックエンド（FastAPI）のデプロイ

1. **Renderダッシュボードにアクセス**
   - https://dashboard.render.com/
   - GitHubでログイン

2. **New Web Service を選択**
   - GitHubリポジトリを選択
   - ブランチ: `main`

3. **設定**
   - **Name**: `sense-haiku-api`
   - **Environment**: `Docker`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `backend/Dockerfile`

4. **環境変数の設定**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   AI_PROVIDER=gemini
   AI_MODEL=gemini-1.5-flash
   AI_TIMEOUT_SECONDS=30
   AI_MAX_RPM=60
   AI_MAX_RETRIES=3
   CORS_ORIGINS=https://sense-haiku-frontend.onrender.com
   JWT_SECRET_KEY=your_super_secret_jwt_key_here_change_this_in_production
   ```

5. **データベースの作成**
   - New PostgreSQL を選択
   - **Name**: `sense-haiku-db`
   - 作成後、接続文字列をコピー
   - 環境変数に追加: `DATABASE_URL=postgresql://...`

6. **デプロイ実行**
   - 「Create Web Service」をクリック
   - デプロイ完了まで待機（5-10分）

7. **データベースの初期化**
   - デプロイ完了後、以下のURLにPOSTリクエストを送信:
   ```
   POST https://sense-haiku-api.onrender.com/api/init-db
   ```

### 2. フロントエンド（React）のデプロイ

1. **New Static Site を選択**
   - GitHubリポジトリを選択
   - ブランチ: `main`

2. **設定**
   - **Name**: `sense-haiku-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **環境変数の設定**
   ```
   VITE_API_BASE=https://sense-haiku-api.onrender.com
   ```

4. **デプロイ実行**
   - 「Create Static Site」をクリック
   - デプロイ完了まで待機

### 3. 動作確認

1. **バックエンドの確認**
   ```
   curl -I https://sense-haiku-api.onrender.com/api/health
   ```

2. **フロントエンドの確認**
   - ブラウザでフロントエンドURLにアクセス
   - 投稿一覧の表示確認
   - 新規投稿機能の確認

3. **モバイル対応の確認**
   - レスポンシブデザイン
   - プルダウン更新機能
   - 右下固定投稿ボタン

## コスト

### 無料プラン（90日間）
- **バックエンド**: $0/月
- **フロントエンド**: $0/月
- **データベース**: $0/月（90日間）
- **合計**: $0/月

### 有料プラン（90日後）
- **バックエンド**: $7/月
- **フロントエンド**: $0/月
- **データベース**: $7/月
- **合計**: $14/月

## トラブルシューティング

### よくある問題

1. **バックエンド404エラー**
   - Renderの設定でRoot Directoryが`backend`になっているか確認
   - Dockerfile Pathが`backend/Dockerfile`になっているか確認
   - 環境変数`DATABASE_URL`が設定されているか確認

2. **MeCabインストールエラー**
   - DockerfileでMeCabが正しくインストールされているか確認
   - ビルドログでエラーがないか確認

3. **データベース接続エラー**
   - `DATABASE_URL`の形式を確認
   - 初期化エンドポイント`/api/init-db`を実行

4. **フロントエンド真っ白**
   - 環境変数`VITE_API_BASE`の設定確認
   - バックエンドAPIの動作確認
   - ブラウザの開発者ツールでエラー確認

5. **CORSエラー**
   - `CORS_ORIGINS`にフロントエンドURLが含まれているか確認

## 監視・メンテナンス

### ログの確認
- Renderダッシュボードでログを確認
- エラーログの監視

### パフォーマンス監視
- レスポンス時間の確認
- メモリ使用量の監視

### バックアップ
- データベースの自動バックアップ
- 手動バックアップの定期実行
