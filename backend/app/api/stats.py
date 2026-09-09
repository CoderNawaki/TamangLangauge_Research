from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Audio, Dialect, Entry, Example, ExampleGloss, Sense, SemanticGroup, WordForm

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def stats(db: Session = Depends(get_db)) -> dict:
    def _count(model, column, condition=None):
        stmt = select(func.count(column)).select_from(model)
        if condition is not None:
            stmt = stmt.where(condition)
        return db.scalar(stmt) or 0

    def _by(model, column):
        return {
            key: val
            for key, val in db.execute(
                select(column, func.count(column))
                .select_from(model)
                .where(column.isnot(None))
                .group_by(column)
                .order_by(func.count(column).desc())
            ).all()
        }

    def _dialect_name(dialect_id):
        d = db.get(Dialect, dialect_id)
        return d.name if d else "—"

    total = _count(Entry, Entry.id)

    return {
        "entries": {
            "total": total,
            "published": _count(Entry, Entry.id, Entry.status == "published"),
        },
        "by_status": _by(Entry, Entry.status),
        "by_tone": _by(Entry, Entry.tone),
        "by_pos": _by(Entry, Entry.pos),
        "by_dialect": {
            _dialect_name(k): v for k, v in _by(Entry, Entry.dialect_id).items()
        },
        "senses": _count(Sense, Sense.id),
        "examples": _count(Example, Example.id),
        "glosses": _count(ExampleGloss, ExampleGloss.id),
        "wordforms": _count(WordForm, WordForm.id),
        "audio": _count(Audio, Audio.id),
        "semantic_groups": _count(SemanticGroup, SemanticGroup.id),
    }