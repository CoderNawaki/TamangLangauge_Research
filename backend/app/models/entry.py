from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Entry(Base):
    """A headword record.

    Tone is nullable and dialect-dependent: Tamang employs a word-tone system (pitch +
    phonation + initial voicing) that varies by dialect, so tone is never assumed across
    dialects and may be unknown for a given entry.
    """

    __tablename__ = "entries"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Primary computable script
    headword_devanagari: Mapped[str] = mapped_column(
        String(200), index=True, nullable=False
    )
    headword_roman: Mapped[str | None] = mapped_column(String(200), index=True, nullable=True)
    headword_ipa: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # Reserved for Tamyig — NOT yet in Unicode; stays null until encoding settles.
    headword_tamyig: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Tone class (T1-T4) — nullable, dialect-tagged, not forced.
    tone: Mapped[str | None] = mapped_column(String(10), nullable=True)
    pos: Mapped[str | None] = mapped_column(String(50), nullable=True)
    grammar: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="draft", index=True
    )  # draft | reviewed | published
    frequency: Mapped[int | None] = mapped_column(nullable=True)

    dialect_id: Mapped[int | None] = mapped_column(
        ForeignKey("dialects.id"), nullable=True
    )
    source_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"), nullable=True)

    dialect: Mapped["Dialect | None"] = relationship(
        foreign_keys=[dialect_id], lazy="joined"
    )
    source: Mapped["Source | None"] = relationship(
        foreign_keys=[source_id], lazy="joined"
    )
    senses: Mapped[list["Sense"]] = relationship(
        back_populates="entry", cascade="all, delete-orphan", lazy="selectin"
    )
    audio: Mapped[list["Audio"]] = relationship(
        back_populates="entry", cascade="all, delete-orphan", lazy="selectin"
    )
    wordforms: Mapped[list["WordForm"]] = relationship(
        back_populates="entry", cascade="all, delete-orphan", lazy="selectin"
    )


from ..models.audio import Audio  # noqa: E402
from ..models.dialect import Dialect  # noqa: E402
from ..models.source import Source  # noqa: E402
from ..models.sense import Sense  # noqa: E402
from ..models.wordform import WordForm  # noqa: E402
