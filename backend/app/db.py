import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 環境変数からデータベースURLを取得（Render用）
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/app/app.db")

# PostgreSQLの場合の接続設定
if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL)
else:
    # SQLiteの場合（開発環境）
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 依存性注入用
from typing import Generator

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
