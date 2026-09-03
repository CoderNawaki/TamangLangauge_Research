from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Sense(Base):
    """One meaning of an entry; a word can have multiple ordered senses."""

    __tablename__ = "senses"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("entries.id"))
    definition_devanagari: Mapped[str] = mapped_column(String, nullable=False)
    definition_roman: Mapped[str | None] = mapped_column(String, nullable=True)
    gloss: Mapped[str | None] = mapped_column(String(200), nullable=True)
    order: Mapped[int] = mapped_column(default=0)

    entry: Mapped["Entry"] = relationship(back_populates="senses")
    examples: Mapped[list["Example"]] = relationship(
        back_populates="sense", cascade="all, delete-orphan", lazy="selectin"
    )


from ..models.entry import Entry  # noqa: E402
from ..models.example import Example  # noqa: E402
