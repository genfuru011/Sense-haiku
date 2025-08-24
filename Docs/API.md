## API 仕様

Base URL: `http://127.0.0.1:8000`

### Health
- GET `/health` → `{ status: "ok" }`

### Posts
- GET `/api/posts?sort=new|trending`
  - sort=`new`: 新着順 / `trending`: `(sense_count+fukai_count)`降順→新着
  - 200: `Post[]`

- POST `/api/posts`
  - Body:
    ```json
    {
      "author_name": "string",
      "author_avatar": "string|null",
      "line1": "string",
      "line2": "string",
      "line3": "string",
      "image": "string|null",
      "reply_to_id": 1|null,
      "quoted_post_id": 1|null
    }
    ```
  - 200: `Post`

- POST `/api/posts/{id}/react/{kind}`
  - kind=`sense|fukai`
  - 200: 更新後 `Post`

- DELETE `/api/posts/{id}/react/{kind}`
  - kind=`sense|fukai`
  - 200: 更新後 `Post`

### Post 型
```json
{
  "id": 1,
  "author_name": "string",
  "author_avatar": "string|null",
  "line1": "string",
  "line2": "string",
  "line3": "string",
  "image": "string|null",
  "reply_to_id": 1|null,
  "quoted_post_id": 1|null,
  "sense_count": 0,
  "fukai_count": 0,
  "created_at": "2025-08-24T12:34:56"
}
```

### CORS
- 許可: `http://localhost:5173`, `http://localhost:5174`


