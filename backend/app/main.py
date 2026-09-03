from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.entries import router as entries_router
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
