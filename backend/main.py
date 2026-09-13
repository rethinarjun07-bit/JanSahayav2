import os
import sys
import logging
from contextlib import asynccontextmanager

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure both the workspace root and backend directory are in sys.path
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_backend_dir)
for _p in [_root_dir, _backend_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles

try:
    from backend.app.core.config import settings
    from backend.app.db.session import engine, Base, SessionLocal
    from backend.app.models.entities import User
    from backend.app.api.auth import router as auth_router
    from backend.app.api.challenges import router as challenges_router
    from backend.app.api.solutions import router as solutions_router
    from backend.app.api.admin import router as admin_router
    from backend.app.api.universities import router as universities_router
    from backend.app.api.analytics import router as analytics_router
    from backend.app.api.ai_routes import router as ai_router
    from backend.app.api.upload import router as upload_router
    from backend.app.api.ai_transcribe import router as ai_transcribe_router
except ModuleNotFoundError:
    from app.core.config import settings
    from app.db.session import engine, Base, SessionLocal
    from app.models.entities import User
    from app.api.auth import router as auth_router
    from app.api.challenges import router as challenges_router
    from app.api.solutions import router as solutions_router
    from app.api.admin import router as admin_router
    from app.api.universities import router as universities_router
    from app.api.analytics import router as analytics_router
    from app.api.ai_routes import router as ai_router
    from app.api.upload import router as upload_router
    from app.api.ai_transcribe import router as ai_transcribe_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jansahaya_api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # 2. Check if database needs seeding
    try:
        db = SessionLocal()
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Database is empty. Running automatic seeding...")
            try:
                from backend.seed import run_seed
            except ModuleNotFoundError:
                from seed import run_seed
            run_seed(db)
        db.close()
    except Exception as e:
        logger.warning(f"Could not auto-check seed status: {e}")

    logger.info("JanSahaya API & AI Services ready.")
    yield
    logger.info("Shutting down JanSahaya API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-grade API and AI/NLP services for JanSahaya (SIH26043 - Govt. of Jharkhand)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(challenges_router, prefix=settings.API_V1_STR)
app.include_router(solutions_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(universities_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(ai_transcribe_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)

# Static file serving for uploads
uploads_dir = os.path.join(os.getcwd(), "public", "uploads")
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "JanSahaya Python FastAPI Backend",
        "version": "1.0.0",
        "database": "PostgreSQL (Single Source of Truth)",
        "aiServices": [
            "TF-IDF Duplicate Detection",
            "Disaster Urgency & Severity Scoring",
            "Multi-Factor Solver Matching",
            "Multilingual Report Summarization"
        ]
    }

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
