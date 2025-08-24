from fastapi import FastAPI, Depends, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Literal

from .db import Base, engine, get_db
from .models import Post as PostModel
from .schemas import PostIn, PostOut

app = FastAPI(title="Sense Haiku Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初回起動時にテーブル作成
Base.metadata.create_all(bind=engine)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/posts", response_model=List[PostOut])
async def list_posts(db: Session = Depends(get_db), sort: Literal["new", "trending"] = "new"):
    q = db.query(PostModel)
    if sort == "trending":
        q = q.order_by((PostModel.sense_count + PostModel.fukai_count).desc(), PostModel.id.desc())
    else:
        q = q.order_by(PostModel.id.desc())
    return q.all()

@app.post("/api/posts", response_model=PostOut)
async def create_post(data: PostIn, db: Session = Depends(get_db)):
    try:
        row = PostModel(
            author_name=data.author_name,
            author_avatar=data.author_avatar,
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
