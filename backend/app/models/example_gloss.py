from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class ExampleGloss(Base):
    """A word-level gloss (interlinear) for an example sentence."""

    __tablename__ = "example_glosses"

    id: Mapped[int] = mapped_column(primary_key=True)
    example_id: Mapped[int] = mapped_column(ForeignKey("examples.id"))
    word: Mapped[str] = mapped_column(String(200), nullable=False)
    gloss: Mapped[str | None] = mapped_column(String(200), nullable=True)
    order: Mapped[int] = mapped_column(default=0)

    example: Mapped["Example"] = relationship(back_populates="glosses")


from ..models.example import Example  # noqa: E402