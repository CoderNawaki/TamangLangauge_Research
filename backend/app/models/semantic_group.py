from __future__ import annotations

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

entry_groups = Table(
    "entry_groups",
    Base.metadata,
    Column("entry_id", ForeignKey("entries.id"), primary_key=True),
    Column("group_id", ForeignKey("semantic_groups.id"), primary_key=True),
)


class SemanticGroup(Base):
    """A named semantic class that groups entries (e.g. kinship, cooking, tones)."""

    __tablename__ = "semantic_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True, unique=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    entries: Mapped[list["Entry"]] = relationship(
        secondary="entry_groups",
        back_populates="semantic_groups",
        lazy="selectin",
        order_by="Entry.headword_devanagari",
    )


from ..models.entry import Entry  # noqa: E402