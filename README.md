# Sense-haiku

日本語俳句投稿・共有プラットフォーム

## 概要

Sense-haikuは、日本語俳句の創作・投稿・共有を目的としたWebアプリケーションです。AI支援機能により俳句作成をサポートし、ユーザー同士の交流を促進します。

## 主な機能

### 俳句投稿・閲覧
- 5-7-5の音節形式に準拠した俳句投稿
- リアルタイムモーラ（音節）カウンター
- 投稿一覧の表示・ソート機能

### AI支援機能
- テーマに基づく俳句自動生成
- 複数AIプロバイダー対応（Gemini、OpenAI）
- レート制限・タイムアウト機能

### ソーシャル機能
- 投稿への返信・引用機能（階層的な返信システム）
- リアクション機能（センスいいね、深い）
- 投稿詳細ページ（クリックで詳細表示）
- ユーザープロフィール管理
- エラー通知システム（トースト/再試行機能）

### ユーザー認証
- JWT認証システム
- ユーザー登録・ログイン機能
- セキュアなパスワード管理

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router（ルーティング）
- React Context（状態管理）

### バックエンド
- FastAPI
- SQLAlchemy
- SQLite
- Python 3.9+

### AI統合
- Google Gemini API
- OpenAI API
- 日本語形態素解析（fugashi + unidic-lite）

## セットアップ

### 前提条件
- Node.js 18+
- Python 3.9+
- Git

### インストール手順

1. リポジトリのクローン
```bash
git clone <repository-url>
cd Sense-haiku
```

2. フロントエンド依存関係のインストール
```bash
npm install
```

3. バックエンド依存関係のインストール
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

4. 環境変数の設定
```bash
# backend/.env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
AI_TIMEOUT_SECONDS=30
AI_MAX_RPM=60
AI_MAX_RETRIES=3

# CORS設定（開発環境）
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# 本番環境では以下のように設定してください：
# CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

5. アプリケーションの起動
```bash
# プロジェクトルートで
npm run dev:all
```

## 開発環境

### 利用可能なコマンド

```bash
# フロントエンド開発サーバー
npm run dev

# バックエンド開発サーバー
npm run dev:backend

# フロントエンド・バックエンド同時起動
npm run dev:all

# ビルド
npm run build

# プレビュー
npm run preview
```

### データベース

SQLiteデータベースを使用しています。初回起動時に自動的にスキーマが作成されます。

```bash
# データベースのリセット（開発時）
rm backend/app/app.db
```

## API仕様

詳細なAPI仕様は `Docs/API.md` を参照してください。

### 主要エンドポイント

- `POST /api/auth/signup` - ユーザー登録
- `POST /api/auth/login` - ユーザーログイン
- `GET /api/posts` - 投稿一覧取得
- `POST /api/posts` - 投稿作成
- `POST /api/ai/haiku` - AI俳句生成
- `POST /api/mora/count` - モーラ数計算

## アーキテクチャ

### フロントエンド
- React Context APIによる状態管理
- カスタムフックによるロジック分離
- レスポンシブデザイン対応

### バックエンド
- FastAPIによるRESTful API
- SQLAlchemy ORM
- JWT認証
- AIプロキシサービス

詳細なアーキテクチャは `Docs/Architecture.md` を参照してください。

## セキュリティ

- JWT認証によるセッション管理
- パスワードハッシュ化（bcrypt）
- 環境変数によるCORS設定（本番環境でのセキュリティ向上）
- レート制限機能
- APIキーの環境変数管理
- APIキーの環境変数管理

## パフォーマンス

- 無限スクロールによる効率的なデータ読み込み
- デバイス判定による最適化されたUI
- プルダウン更新機能
- ページネーション対応

## ライセンス

本ソフトウェアは商業利用を目的として開発されています。

## サポート

技術的な問題や機能要望については、開発チームまでお問い合わせください。

## 更新履歴

詳細な更新履歴は `Docs/Changelog.md` を参照してください。

---

© 2024 Sense-haiku Development Team
