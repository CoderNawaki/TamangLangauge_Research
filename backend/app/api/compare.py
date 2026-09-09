from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entry
from ..schemas.entry import EntryOut

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.get("", response_model=list[EntryOut])
def compare_dialects(
    headword: str = Query(description="Headword to compare across dialect entries"),
    db: Session = Depends(get_db),
) -> list[Entry]:
    hw = headword.strip()
    if not hw:
        raise HTTPException(status_code=400, detail="headword is required")
    stmt = (
        select(Entry)
        .where(
            or_(
                Entry.headword_devanagari == hw,
                Entry.headword_roman.ilike(hw),
            )
        )
        .order_by(Entry.dialect_id, Entry.id)
    )
    return list(db.scalars(stmt).all())