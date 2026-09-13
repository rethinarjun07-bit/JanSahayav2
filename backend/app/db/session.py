import sys
import logging
from pathlib import Path

# Ensure project root and backend directory are in sys.path
_cur_dir = Path(__file__).resolve().parent
_backend_dir = _cur_dir.parent.parent
_root_dir = _backend_dir.parent
for _p in [str(_root_dir), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from backend.app.core.config import settings
except ModuleNotFoundError:
    from app.core.config import settings


logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Normalize postgres:// to postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
elif db_url.startswith("file:"):
    clean_path = db_url[5:]
    if clean_path.startswith("./"):
        clean_path = clean_path[2:]
    if (Path("prisma") / clean_path).exists():
        db_url = f"sqlite:///./prisma/{clean_path}"
    else:
        db_url = f"sqlite:///{clean_path}"

try:
    # Attempt to connect using configured URL (PostgreSQL single source of truth)
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    # Quick probe
    with engine.connect() as conn:
        pass
    logger.info(f"Connected to database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    logger.critical(
        f"FATAL: Database connection failed for {db_url.split('@')[-1] if '@' in db_url else db_url}: {e}. "
        "Silent SQLite fallback is disabled to enforce PostgreSQL as the single source of truth. "
        "Ensure PostgreSQL is running and accessible via DATABASE_URL."
    )
    raise RuntimeError(
        f"Database connection failed: {e}. PostgreSQL single source of truth must be reachable."
    ) from e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
