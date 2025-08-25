from fastapi import FastAPI, Depends, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Literal, Optional
from datetime import timedelta
import os

from .db import Base, engine, get_db
from .models import Post as PostModel, User as UserModel
from .schemas import (
    PostIn, PostOut, UserLogin, UserSignup, UserOut, Token,
    HaikuGenerationRequest, HaikuGenerationResponse,
)
from .auth import (
    verify_password, get_password_hash, create_access_token, 
    get_current_user, get_current_user_optional, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .ai_service import ai_service
from fugashi import Tagger

app = FastAPI(title="Sense Haiku Backend", version="0.1.0")

# CORS設定を環境変数から取得
def get_cors_origins():
    """環境変数からCORSオリジンを取得"""
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
    return [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初回起動時にテーブル作成
Base.metadata.create_all(bind=engine)

# 形態素解析器（起動時に一度初期化）
tagger = Tagger()

@app.get("/health")
async def health():
    return {"status": "ok"}

# 認証エンドポイント
@app.post("/api/auth/signup", response_model=Token)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # 既存ユーザーチェック
    existing_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 新規ユーザー作成
    hashed_password = get_password_hash(user_data.password)
    db_user = UserModel(
        email=user_data.email,
        password_hash=hashed_password,
        display_name=user_data.display_name,
        avatar_url=f"https://picsum.photos/seed/{user_data.email}/200/200",
        bio=f"こんにちは！{user_data.display_name}です。よろしくお願いします。"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # トークン作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # ユーザー検索
    user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # パスワード検証
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # トークン作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserOut)
async def get_current_user_info(current_user: UserModel = Depends(get_current_user)):
    return current_user

# 投稿エンドポイント（更新）
@app.get("/api/posts", response_model=List[PostOut])
async def list_posts(
    db: Session = Depends(get_db), 
    sort: Literal["new", "trending"] = "new",
    page: int = 1,
    limit: int = 20,
    current_user: Optional[UserModel] = Depends(get_current_user_optional)
):
    if page < 1:
        raise HTTPException(status_code=400, detail="Page must be 1 or greater")
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
    
    offset = (page - 1) * limit
    
    q = db.query(PostModel)
    if sort == "trending":
        q = q.order_by((PostModel.sense_count + PostModel.fukai_count).desc(), PostModel.id.desc())
    else:
        q = q.order_by(PostModel.id.desc())
    
    # ページネーション適用
    q = q.offset(offset).limit(limit)
    
    return q.all()

@app.post("/api/posts", response_model=PostOut)
async def create_post(
    data: PostIn, 
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user_optional)
):
    try:
        # ユーザーがログインしている場合はuser_idを設定
        user_id = current_user.id if current_user else None
        author_name = current_user.display_name if current_user else data.author_name
        author_avatar = current_user.avatar_url if current_user else data.author_avatar
        
        if not author_name:
            raise HTTPException(status_code=400, detail="Author name is required")
        
        row = PostModel(
            author_name=author_name,
            author_avatar=author_avatar,
            user_id=user_id,
            line1=data.line1,
            line2=data.line2,
            line3=data.line3,
            image=data.image,
            reply_to_id=data.reply_to_id,
            quoted_post_id=data.quoted_post_id,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except Exception as e:
        print("create_post error:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="failed to create post")

@app.post("/api/posts/{post_id}/react/{kind}", response_model=PostOut)
async def react_post(
    post_id: int = Path(..., ge=1),
    kind: Literal["sense", "fukai"] = Path(...),
    db: Session = Depends(get_db)
):
    row = db.get(PostModel, post_id)
    if not row:
        raise HTTPException(status_code=404, detail="post not found")
    if kind == "sense":
        row.sense_count = (row.sense_count or 0) + 1
    else:
        row.fukai_count = (row.fukai_count or 0) + 1
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@app.delete("/api/posts/{post_id}/react/{kind}", response_model=PostOut)
async def unreact_post(
    post_id: int = Path(..., ge=1),
    kind: Literal["sense", "fukai"] = Path(...),
    db: Session = Depends(get_db)
):
    row = db.get(PostModel, post_id)
    if not row:
        raise HTTPException(status_code=404, detail="post not found")
    if kind == "sense":
        row.sense_count = max(0, (row.sense_count or 0) - 1)
    else:
        row.fukai_count = max(0, (row.fukai_count or 0) - 1)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@app.post("/api/posts/{post_id}/reply", response_model=PostOut)
async def reply_to_post(
    data: PostIn,
    post_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user_optional)
):
    """投稿に返信する"""
    try:
        # 元の投稿が存在するかチェック
        original_post = db.get(PostModel, post_id)
        if not original_post:
            raise HTTPException(status_code=404, detail="Original post not found")
        
        # ユーザーがログインしている場合はuser_idを設定
        user_id = current_user.id if current_user else None
        author_name = current_user.display_name if current_user else data.author_name
        author_avatar = current_user.avatar_url if current_user else data.author_avatar
        
        if not author_name:
            raise HTTPException(status_code=400, detail="Author name is required")
        
        # 返信投稿を作成
        reply_post = PostModel(
            author_name=author_name,
            author_avatar=author_avatar,
            user_id=user_id,
            line1=data.line1,
            line2=data.line2,
            line3=data.line3,
            image=data.image,
            reply_to_id=post_id,  # 返信先の投稿ID
            quoted_post_id=None,
        )
        db.add(reply_post)
        db.commit()
        db.refresh(reply_post)
        return reply_post
    except Exception as e:
        print("reply_to_post error:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="failed to create reply")

@app.post("/api/posts/{post_id}/quote", response_model=PostOut)
async def quote_post(
    data: PostIn,
    post_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user_optional)
):
    """投稿を引用して新規投稿する"""
    try:
        # 引用元の投稿が存在するかチェック
        quoted_post = db.get(PostModel, post_id)
        if not quoted_post:
            raise HTTPException(status_code=404, detail="Quoted post not found")
        
        # ユーザーがログインしている場合はuser_idを設定
        user_id = current_user.id if current_user else None
        author_name = current_user.display_name if current_user else data.author_name
        author_avatar = current_user.avatar_url if current_user else data.author_avatar
        
        if not author_name:
            raise HTTPException(status_code=400, detail="Author name is required")
        
        # 引用投稿を作成
        quote_post = PostModel(
            author_name=author_name,
            author_avatar=author_avatar,
            user_id=user_id,
            line1=data.line1,
            line2=data.line2,
            line3=data.line3,
            image=data.image,
            reply_to_id=None,
            quoted_post_id=post_id,  # 引用元の投稿ID
        )
        db.add(quote_post)
        db.commit()
        db.refresh(quote_post)
        return quote_post
    except Exception as e:
        print("quote_post error:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="failed to create quote")

@app.get("/api/posts/{post_id}/replies", response_model=List[PostOut])
async def get_post_replies(
    post_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
):
    """投稿の返信一覧を取得"""
    replies = db.query(PostModel).filter(PostModel.reply_to_id == post_id).order_by(PostModel.created_at.asc()).all()
    return replies

@app.get("/api/posts/{post_id}/quotes", response_model=List[PostOut])
async def get_post_quotes(
    post_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
):
    """投稿を引用した投稿一覧を取得"""
    quotes = db.query(PostModel).filter(PostModel.quoted_post_id == post_id).order_by(PostModel.created_at.desc()).all()
    return quotes

# AIプロキシ: 認証任意（ログイン時はユーザー基準でレート制限、未ログインはIP）
@app.post("/api/ai/haiku", response_model=HaikuGenerationResponse)
async def generate_haiku(
    request: HaikuGenerationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user_optional),
):
    text = (request.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if len(text) > 500:
        raise HTTPException(status_code=400, detail="Text too long (max 500)")

    # レート制限キー: user or anon
    key = f"user:{current_user.id}" if current_user else "anon"
    await ai_service.check_rate_limit(key)

    result = await ai_service.generate_haiku(text)
    return HaikuGenerationResponse(**result)

# モーラ数を返す簡易API
@app.post("/api/mora/count")
async def count_mora(payload: dict):
    def token_reading(tok) -> str:
        # fugashi(unidic-lite)の特徴量から読みを取得
        yomi = None
        feat = getattr(tok, "feature", None)
        if feat is not None:
            try:
                # pron / kana / pronBase / kanaBase を優先的に参照
                yomi = (
                    feat.get("pron")
                    or feat.get("kana")
                    or feat.get("pronBase")
                    or feat.get("kanaBase")
                )
            except Exception:
                try:
                    yomi = getattr(feat, "pron", None) or getattr(feat, "kana", None)
                except Exception:
                    yomi = None
        return yomi if yomi and yomi != "*" else tok.surface

    def count_line(s: str) -> int:
        # 読み（カナ/かな）に正規化してモーラ数を概算
        yomi_text = "".join(token_reading(t) for t in tagger(s))
        if not yomi_text:
            return 0
        cnt = 0
        for ch in yomi_text:
            if ("ぁ" <= ch <= "ゖ") or ("ァ" <= ch <= "ヺ") or ch in ("ー", "ゝ", "ゞ"):
                cnt += 1
        # すべて漢字等でカウントできない場合は非空文字数で代替
        if cnt == 0:
            cnt = sum(1 for ch in s if ch.strip())
        return cnt

    line1 = payload.get("line1", "")
    line2 = payload.get("line2", "")
    line3 = payload.get("line3", "")
    return {
        "line1": count_line(line1),
        "line2": count_line(line2),
        "line3": count_line(line3),
    }


