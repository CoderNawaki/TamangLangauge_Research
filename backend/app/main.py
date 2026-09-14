from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.audio import router as audio_router
from .api.compare import router as compare_router
from .api.dialects import router as dialects_router
from .api.entries import router as entries_router
from .api.imports import router as imports_router
from .api.audio import media_root
from .config import get_settings

settings = get_settings()

app = FastAPI(
    title="Tamang Dictionary API",
    version="0.1.0",
    description="Backend for the Tamang language dictionary",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(entries_router)
app.include_router(audio_router)
app.include_router(dialects_router)
app.include_router(imports_router)
app.include_router(compare_router)
app.mount("/media", StaticFiles(directory=media_root()), name="media")
