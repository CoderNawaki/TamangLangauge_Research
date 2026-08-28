from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entry, Example, Sense
from ..schemas.entry import EntryCreate, EntryOut, EntryUpdate

router = APIRouter(prefix="/api/entries", tags=["entries"])


def _get_entry_or_404(db: Session, entry_id: int) -> Entry:
    entry = db.get(Entry, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.get("", response_model=list[EntryOut])
def list_entries(
    q: str | None = Query(default=None, description="Search Devanagari or romanized headword"),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Entry]:
    stmt = select(Entry)
    if status is not None:
        stmt = stmt.where(Entry.status == status)
    if q is not None and q.strip():
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Entry.headword_devanagari.ilike(pattern),
                Entry.headword_roman.ilike(pattern),
                Entry.headword_ipa.ilike(pattern),
            )
        )
    stmt = stmt.order_by(Entry.headword_devanagari)
    return list(db.scalars(stmt).all())


@router.get("/{entry_id}", response_model=EntryOut)
def get_entry(entry_id: int, db: Session = Depends(get_db)) -> Entry:
    return _get_entry_or_404(db, entry_id)


@router.post("", response_model=EntryOut, status_code=201)
def create_entry(payload: EntryCreate, db: Session = Depends(get_db)) -> Entry:
    entry = Entry(**payload.model_dump(exclude={"senses"}))
    for sense_data in payload.senses:
        sense = Sense(
            **sense_data.model_dump(exclude={"examples"}), entry=entry
        )
        for ex_data in sense_data.examples:
            sense.examples.append(Example(**ex_data.model_dump()))
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=EntryOut)
def update_entry(
    entry_id: int, payload: EntryUpdate, db: Session = Depends(get_db)
) -> Entry:
    entry = _get_entry_or_404(db, entry_id)
    data = payload.model_dump(exclude_unset=True, exclude={"senses"})
    for key, value in data.items():
        setattr(entry, key, value)
    if payload.senses is not None:
        entry.senses.clear()
        for sense_data in payload.senses:
            sense = Sense(
                **sense_data.model_dump(exclude={"examples"}), entry=entry
            )
            for ex_data in sense_data.examples:
                sense.examples.append(Example(**ex_data.model_dump()))
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, db: Session = Depends(get_db)) -> None:
    entry = _get_entry_or_404(db, entry_id)
    db.delete(entry)
    db.commit()
