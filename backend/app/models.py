from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)  # パスワードハッシュ
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # リレーションシップ
    posts = relationship("Post", back_populates="user")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    # 既存のauthor_*フィールド（段階的移行のため残す）
    author_name = Column(String(100), nullable=True)  # NULL可に変更
    author_avatar = Column(String(255), nullable=True)
    # 新しいuser_idフィールド
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    line1 = Column(String(100), nullable=False)
    line2 = Column(String(100), nullable=False)
    line3 = Column(String(100), nullable=False)
    image = Column(String(1024), nullable=True)
    reply_to_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    quoted_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    sense_count = Column(Integer, nullable=False, server_default="0")
    fukai_count = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # リレーションシップ
    user = relationship("User", back_populates="posts")
