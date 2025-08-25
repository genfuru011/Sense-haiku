# Render デプロイ手順

## 概要
Sense-haikuをRenderでデプロイする手順です。

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
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **環境変数の設定**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   AI_PROVIDER=gemini
   AI_MODEL=gemini-1.5-flash
   AI_TIMEOUT_SECONDS=30
   AI_MAX_RPM=60
   AI_MAX_RETRIES=3
   CORS_ORIGINS=https://sense-haiku.onrender.com,https://sense-haiku-frontend.onrender.com
   ```

5. **データベースの作成**
   - New PostgreSQL を選択
   - **Name**: `sense-haiku-db`
   - 作成後、接続文字列をコピー
   - 環境変数に追加: `DATABASE_URL=postgresql://...`

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

### 3. カスタムドメインの設定（オプション）

1. **ドメインの購入**
   - Namecheap、Google Domains等で購入

2. **DNS設定**
   - Aレコード: RenderのIPアドレス
   - CNAMEレコード: Renderのドメイン

3. **Renderでドメイン追加**
   - 各サービスでカスタムドメインを追加

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

1. **ビルドエラー**
   - requirements.txtの依存関係を確認
   - Pythonバージョンを確認

2. **データベース接続エラー**
   - DATABASE_URLの形式を確認
   - PostgreSQLの起動を確認

3. **CORSエラー**
   - CORS_ORIGINSの設定を確認
   - フロントエンドのURLを追加

4. **APIキーエラー**
   - 環境変数の設定を確認
   - APIキーの有効性を確認

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
