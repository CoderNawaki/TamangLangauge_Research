from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dialect
from ..schemas.entry import DialectOut

router = APIRouter(prefix="/api/dialects", tags=["dialects"])


@router.get("", response_model=list[DialectOut])
def list_dialects(db: Session = Depends(get_db)) -> list[Dialect]:
    return list(db.scalars(select(Dialect).order_by(Dialect.name)).all())