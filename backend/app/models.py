from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from .db import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_name = Column(String(100), nullable=False)
    author_avatar = Column(String(255), nullable=True)
    line1 = Column(String(100), nullable=False)
    line2 = Column(String(100), nullable=False)
    line3 = Column(String(100), nullable=False)
    image = Column(String(1024), nullable=True)
    reply_to_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    quoted_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    sense_count = Column(Integer, nullable=False, server_default="0")
    fukai_count = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
