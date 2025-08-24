# API Documentation

## 認証

### POST /api/auth/signup
新規ユーザー登録

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "ユーザー名"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### POST /api/auth/login
ユーザーログイン

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### GET /api/auth/me
現在のユーザー情報取得（認証必須）

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "display_name": "ユーザー名",
  "avatar_url": "https://picsum.photos/seed/user@example.com/200/200",
  "bio": "こんにちは！ユーザー名です。よろしくお願いします。",
  "created_at": "2024-01-01T00:00:00"
}
```

## 投稿

### GET /api/posts
投稿一覧取得

**Query Parameters:**
- `sort`: "new" | "trending" (default: "new")
- `page`: ページ番号 (default: 1)
- `limit`: 1ページあたりの件数 (default: 20, max: 100)

**Response:**
```json
[
  {
    "id": 1,
    "author_name": "ユーザー名",
    "author_avatar": "https://picsum.photos/seed/user@example.com/200/200",
    "line1": "春の風",
    "line2": "桜の花びら",
    "line3": "舞い散る",
    "image": null,
    "reply_to_id": null,
    "quoted_post_id": null,
    "sense_count": 5,
    "fukai_count": 2,
    "created_at": "2024-01-01T00:00:00",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "display_name": "ユーザー名",
      "avatar_url": "https://picsum.photos/seed/user@example.com/200/200",
      "bio": "こんにちは！ユーザー名です。よろしくお願いします。",
      "created_at": "2024-01-01T00:00:00"
    }
  }
]
```

### POST /api/posts
新規投稿作成

**Request Body:**
```json
{
  "line1": "春の風",
  "line2": "桜の花びら",
  "line3": "舞い散る",
  "image": null,
  "reply_to_id": null,
  "quoted_post_id": null
}
```

### POST /api/posts/{post_id}/reply
投稿に返信

**Request Body:**
```json
{
  "line1": "返信の句",
  "line2": "返信の句",
  "line3": "返信の句"
}
```

### POST /api/posts/{post_id}/quote
投稿を引用

**Request Body:**
```json
{
  "line1": "引用の句",
  "line2": "引用の句",
  "line3": "引用の句"
}
```

### GET /api/posts/{post_id}/replies
投稿の返信一覧取得

### GET /api/posts/{post_id}/quotes
投稿の引用一覧取得

### POST /api/posts/{post_id}/react/{kind}
リアクション追加

**Path Parameters:**
- `kind`: "sense" | "fukai"

### DELETE /api/posts/{post_id}/react/{kind}
リアクション削除

## AIプロキシ

### POST /api/ai/haiku
AIによる俳句生成（認証任意）

**Request Body:**
```json
{
  "text": "春の小川"
}
```

**Response:**
```json
{
  "line1": "流れ清き水",
  "line2": "光る小石春の小川",
  "line3": "せせらぎの音"
}
```

**環境変数設定:**
- `AI_PROVIDER`: "gemini" | "openai" (default: "gemini")
- `AI_MODEL`: モデル名 (default: "gemini-1.5-flash" | "gpt-4o-mini")
- `GEMINI_API_KEY`: Gemini APIキー
- `OPENAI_API_KEY`: OpenAI APIキー
- `AI_TIMEOUT_SECONDS`: タイムアウト秒数 (default: 15)
- `AI_MAX_RPM`: 1分あたり最大リクエスト数 (default: 10)
- `AI_MAX_RETRIES`: 最大リトライ回数 (default: 1)

**機能:**
- プロバイダ間自動フォールバック（混雑時）
- レート制限（ユーザーID/IPベース）
- タイムアウト制御
- エラーハンドリング

## モーラ計算

### POST /api/mora/count
俳句のモーラ数計算

**Request Body:**
```json
{
  "line1": "冬の雷",
  "line2": "空裂く音に",
  "line3": "震える夜"
}
```

**Response:**
```json
{
  "line1": 3,
  "line2": 5,
  "line3": 4
}
```

**技術仕様:**
- fugashi + unidic-lite による形態素解析
- 読み（かな）ベースのモーラ概算
- 漢字・記号のフォールバック処理

## エラーレスポンス

### 400 Bad Request
```json
{
  "detail": "エラーメッセージ"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Post not found"
}
```

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded"
}
```

### 503 Service Unavailable
```json
{
  "detail": "AI service is not configured"
}
```


