from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entry, SemanticGroup, entry_groups
from ..schemas.entry import EntryOut, SemanticGroupOut

router = APIRouter(prefix="/api/groups", tags=["groups"])


class GroupCreate(BaseModel):
    name: str
    description: str | None = None


class GroupWithCount(SemanticGroupOut):
    entry_count: int = 0


def _get_group_or_404(db: Session, group_id: int) -> SemanticGroup:
    group = db.get(SemanticGroup, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("", response_model=list[GroupWithCount])
def list_groups(db: Session = Depends(get_db)) -> list[SemanticGroup]:
    counts = dict(
        db.execute(
            select(entry_groups.c.group_id, func.count(entry_groups.c.entry_id)).group_by(
                entry_groups.c.group_id
            )
        ).all()
    )
    groups = db.scalars(select(SemanticGroup).order_by(SemanticGroup.name)).all()
    for g in groups:
        g.entry_count = counts.get(g.id, 0)
    return list(groups)


@router.post("", response_model=SemanticGroupOut, status_code=201)
def create_group(payload: GroupCreate, db: Session = Depends(get_db)) -> SemanticGroup:
    if db.scalar(
        select(SemanticGroup).where(SemanticGroup.name == payload.name)
    ) is not None:
        raise HTTPException(status_code=409, detail="Group already exists")
    group = SemanticGroup(**payload.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/{group_id}/entries", response_model=list[EntryOut])
def group_entries(group_id: int, db: Session = Depends(get_db)) -> list[Entry]:
    group = _get_group_or_404(db, group_id)
    return group.entries


@router.post("/{group_id}/entries/{entry_id}", response_model=SemanticGroupOut, status_code=201)
def add_entry_to_group(
    group_id: int, entry_id: int, db: Session = Depends(get_db)
) -> SemanticGroup:
    group = _get_group_or_404(db, group_id)
    entry = db.get(Entry, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry not in group.entries:
        group.entries.append(entry)
        db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}/entries/{entry_id}", status_code=204)
def remove_entry_from_group(
    group_id: int, entry_id: int, db: Session = Depends(get_db)
) -> None:
    group = _get_group_or_404(db, group_id)
    entry = db.get(Entry, entry_id)
    if entry is not None and entry in group.entries:
        group.entries.remove(entry)
        db.commit()