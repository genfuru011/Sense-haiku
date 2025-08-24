from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PostIn(BaseModel):
    author_name: str
    author_avatar: Optional[str] = None
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

    class Config:
        from_attributes = True
