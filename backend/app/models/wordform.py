from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class WordForm(Base):
    """An inflected or derived form of an entry (verb tense/aspect, etc.)."""

    __tablename__ = "wordforms"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("entries.id"))
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    form_devanagari: Mapped[str] = mapped_column(String(200), nullable=False)
    form_roman: Mapped[str | None] = mapped_column(String(200), nullable=True)
    order: Mapped[int] = mapped_column(default=0)

    entry: Mapped["Entry"] = relationship(back_populates="wordforms")


from ..models.entry import Entry  # noqa: E402