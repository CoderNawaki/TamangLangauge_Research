from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Audio(Base):
    """A pronunciation recording for an entry.

    Pronunciation is a critical feature: tones (T1-T4) plus audio, tagged by dialect.
    """

    __tablename__ = "audio"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("entries.id"))
    dialect_id: Mapped[int | None] = mapped_column(ForeignKey("dialects.id"), nullable=True)
    speaker: Mapped[str | None] = mapped_column(String(200), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    recorded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    entry: Mapped["Entry"] = relationship(back_populates="audio")
    dialect: Mapped["Dialect | None"] = relationship(
        foreign_keys=[dialect_id], lazy="joined"
    )


from ..models.dialect import Dialect  # noqa: E402
from ..models.entry import Entry  # noqa: E402
