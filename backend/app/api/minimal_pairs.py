from __future__ import annotations

import re

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entry
from ..schemas.entry import DialectOut

router = APIRouter(prefix="/api/minimal-pairs", tags=["minimal-pairs"])


def _stem(entry: Entry) -> str:
    raw = (entry.headword_roman or entry.headword_devanagari or "").strip()
    return re.sub(r"[^a-z0-9]", "", raw.lower())


class PairMember(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    headword_devanagari: str
    headword_roman: str | None = None
    headword_ipa: str | None = None
    tone: str
    pos: str | None = None
    dialect: DialectOut | None = None
    status: str


class MinimalPairGroup(BaseModel):
    stem: str
    tones: list[str]
    entries: list[PairMember]


@router.get("", response_model=list[MinimalPairGroup])
def minimal_pairs(db: Session = Depends(get_db)) -> list[MinimalPairGroup]:
    """Group same-shaped headwords that differ only by tone class (T1–T4)."""
    entries = db.scalars(
        select(Entry)
        .where(Entry.tone.isnot(None), Entry.status.in_(["published", "reviewed"]))
        .order_by(Entry.headword_devanagari)
    ).all()
    buckets: dict[str, list[Entry]] = {}
    for e in entries:
        buckets.setdefault(_stem(e), []).append(e)
    groups: list[MinimalPairGroup] = []
    for stem, members in buckets.items():
        if not stem:  # ignore entries with no usable headword
            continue
        tones = sorted({m.tone for m in members})
        if len(members) >= 2 and len(tones) >= 2:
            groups.append(
                MinimalPairGroup(
                    stem=stem,
                    tones=tones,
                    entries=sorted(
                        (PairMember.model_validate(m) for m in members),
                        key=lambda m: (m.tone or "", m.id),
                    ),
                )
            )
    groups.sort(key=lambda g: g.stem)
    return groups