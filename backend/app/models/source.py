from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Source(Base):
    """Attribution for an entry: corpus import, book, contributor, or audio recording."""

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    author: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_type: Mapped[str] = mapped_column(
        String(50), default="contributor"
    )  # corpus | book | contributor | audio
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
