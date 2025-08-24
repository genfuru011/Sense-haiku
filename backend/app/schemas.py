from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# 認証関連スキーマ
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class UserOut(BaseModel):
    id: int
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# 投稿関連スキーマ
class PostIn(BaseModel):
    author_name: Optional[str] = None  # 段階的移行のため
    author_avatar: Optional[str] = None
    user_id: Optional[int] = None  # 新しいフィールド
    line1: str
    line2: str
    line3: str
    image: Optional[str] = None
    reply_to_id: Optional[int] = None
    quoted_post_id: Optional[int] = None

class PostOut(PostIn):
    id: int
    sense_count: int = 0
    fukai_count: int = 0
    created_at: Optional[datetime] = None
    user: Optional[UserOut] = None  # ユーザー情報を含める

    class Config:
        from_attributes = True

# AIプロキシ関連
class HaikuGenerationRequest(BaseModel):
    text: str

class HaikuGenerationResponse(BaseModel):
    line1: str
    line2: str
    line3: str


