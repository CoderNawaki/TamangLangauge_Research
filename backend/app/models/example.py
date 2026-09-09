from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Example(Base):
    """A usage sentence linked to a sense, with translations."""

    __tablename__ = "examples"

    id: Mapped[int] = mapped_column(primary_key=True)
    sense_id: Mapped[int] = mapped_column(ForeignKey("senses.id"))
    text_devanagari: Mapped[str | None] = mapped_column(String, nullable=True)
    text_roman: Mapped[str | None] = mapped_column(String, nullable=True)
    translation_devanagari: Mapped[str | None] = mapped_column(String, nullable=True)
    translation_english: Mapped[str | None] = mapped_column(String, nullable=True)

    sense: Mapped["Sense"] = relationship(back_populates="examples")
    glosses: Mapped[list["ExampleGloss"]] = relationship(
        back_populates="example", cascade="all, delete-orphan", lazy="selectin"
    )


from ..models.example_gloss import ExampleGloss  # noqa: E402
from ..models.sense import Sense  # noqa: E402
