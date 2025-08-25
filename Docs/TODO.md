# TODO

## 直近（優先度高）
- [x] 認証とユーザー導入（usersテーブル、JWTモック）
- [x] `posts.user_id(NULL可)` の追加と段階的移行（author_*併存）
- [x] 返信/引用のAPI化（POST /api/posts reply/quote）とフロント連動
- [x] 人気/新着タブのサーバ連動UI（ローディング/無限スクロール）
- [x] AIプロキシ `POST /api/ai/haiku`（キー秘匿、タイムアウト/レート制限）
- [x] モーラ計算API `POST /api/mora/count`（fugashi+unidic-lite使用）

## 品質・運用
- [x] CORSを環境変数化（本番オリジン）
- [ ] Tailwindローカル導入（CDN脱却）
- [x] エラー通知（トースト/再試行）
- [ ] 開発コマンド: lint/test/format の追加

## データと拡張
- [ ] リアクション種類の追加（好き/粋/泣/笑）
- [ ] 人気スコアの高度化（時間減衰/Wilsonスコア）
- [ ] 推薦初期版（トレンド+類似文面、将来pgvector）

## ドキュメント
- [x] ER図のusers追加版を追記
- [x] 返信/引用のシーケンス図を追記

## 将来改善
- [ ] モーラ計算精度向上（辞書調整・手動補正）
- [ ] 5-7-5厳密性のAI側改善（プロンプト強化・読み指定）

備考: 現状は FastAPI + SQLite（開発）/ フロントはAPI経由で投稿・反応・AI生成・モーラ計算を実装済み。


