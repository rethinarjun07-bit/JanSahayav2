import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from backend.app.api.deps import get_current_user_optional
from backend.app.models.entities import User

router = APIRouter(prefix="/upload", tags=["Media Uploads"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.getcwd(), "public", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".webm", ".wav", ".mp3", ".ogg"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "audio/webm", "audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg"
}

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_optional)
):
    # Require authenticated user in production
    is_demo = os.getenv("DEMO_MODE", "true").lower() == "true"
    if not current_user and not is_demo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to upload media."
        )

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{file.content_type}'."
        )

    # Sanitize base filename and prevent path traversal
    safe_base = "".join(c for c in os.path.splitext(file.filename)[0] if c.isalnum() or c in "_-")[:30]
    unique_filename = f"{uuid.uuid4().hex[:12]}_{safe_base}{ext}"
    dest_path = os.path.abspath(os.path.join(UPLOAD_DIR, unique_filename))

    # Path containment check
    if not dest_path.startswith(UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Invalid file destination path.")

    # Read and enforce file size limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10MB limit (size: {len(content) / (1024 * 1024):.1f}MB)"
        )

    with open(dest_path, "wb") as buffer:
        buffer.write(content)

    return {
        "url": f"/uploads/{unique_filename}",
        "filename": unique_filename,
        "size": len(content),
    }
