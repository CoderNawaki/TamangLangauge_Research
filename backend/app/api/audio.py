from __future__ import annotations

import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Audio
from ..schemas.entry import AudioOut
from .entries import _get_entry_or_404

router = APIRouter(tags=["audio"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"}


def media_root() -> Path:
    root = Path(get_settings().media_dir)
    if not root.is_absolute():
        root = Path(__file__).resolve().parent.parent.parent / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def _get_audio_or_404(db: Session, audio_id: int) -> Audio:
    audio = db.get(Audio, audio_id)
    if audio is None:
        raise HTTPException(status_code=404, detail="Audio not found")
    return audio


@router.post(
    "/api/entries/{entry_id}/audio",
    response_model=AudioOut,
    status_code=201,
)
def upload_audio(
    entry_id: int,
    file: UploadFile,
    speaker: str | None = Form(default=None),
    dialect_id: int | None = Form(default=None),
    recorded_at: datetime | None = Form(default=None),
    db: Session = Depends(get_db),
) -> Audio:
    _get_entry_or_404(db, entry_id)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext or 'unknown'}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    filename = f"{uuid.uuid4().hex}{ext}"
    root = media_root()
    file_path = root / filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    if file_path.stat().st_size == 0:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    audio = Audio(
        entry_id=entry_id,
        dialect_id=dialect_id,
        speaker=speaker,
        file_path=f"media/{filename}",
        recorded_at=recorded_at,
    )
    db.add(audio)
    db.commit()
    db.refresh(audio)
    return audio


@router.delete("/api/audio/{audio_id}", status_code=204)
def delete_audio(audio_id: int, db: Session = Depends(get_db)) -> None:
    audio = _get_audio_or_404(db, audio_id)
    path = Path(__file__).resolve().parent.parent.parent / audio.file_path
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass
    db.delete(audio)
    db.commit()