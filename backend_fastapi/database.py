import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DEFAULT_SQLITE_URL = "sqlite:///./swms_local.db"

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_placeholder_neon_url = (
    "neon.tech" in DATABASE_URL and "npg_sample123" in DATABASE_URL
)

if not DATABASE_URL or "postgresql://" not in DATABASE_URL or is_placeholder_neon_url:
    DATABASE_URL = DEFAULT_SQLITE_URL

if DATABASE_URL.startswith("sqlite://"):
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
