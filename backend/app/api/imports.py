from __future__ import annotations

import csv
import io
import json
import re
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entry, Sense

router = APIRouter(prefix="/api/import", tags=["imports"])

TOKEN_RE = re.compile(r"[\u0900-\u097F]+|[A-Za-z][A-Za-z']*")


class Candidate(BaseModel):
    token: str
    frequency: int


class CorpusAnalysisIn(BaseModel):
    text: str
    max_candidates: int = 100
    min_frequency: int = 2


class CorpusAnalysisOut(BaseModel):
    total_tokens: int
    candidates: list[Candidate]


class CorpusEntriesIn(BaseModel):
    tokens: list[Candidate]


class ImportSummary(BaseModel):
    created: int
    skipped: int
    duplicates: list[str]


@router.post("/corpus/analyze", response_model=CorpusAnalysisOut)
def analyze_corpus(
    payload: CorpusAnalysisIn, db: Session = Depends(get_db)
) -> CorpusAnalysisOut:
    tokens = [m.group(0) for m in TOKEN_RE.finditer(payload.text or "")]
    counts = Counter(tokens)
    existing = set(db.scalars(select(Entry.headword_devanagari)).all())
    candidates = [
        Candidate(token=token, frequency=count)
        for token, count in counts.most_common()
        if count >= payload.min_frequency and token not in existing
    ][: payload.max_candidates]
    return CorpusAnalysisOut(total_tokens=len(tokens), candidates=candidates)


@router.post("/corpus/entries", response_model=ImportSummary)
def create_corpus_entries(
    payload: CorpusEntriesIn, db: Session = Depends(get_db)
) -> ImportSummary:
    created = 0
    skipped = 0
    duplicates: list[str] = []
    for candidate in payload.tokens:
        token = candidate.token.strip()
        if not token:
            continue
        if (
            db.scalars(
                select(Entry.id).where(Entry.headword_devanagari == token)
            ).first()
            is not None
        ):
            skipped += 1
            duplicates.append(token)
            continue
        db.add(
            Entry(
                headword_devanagari=token,
                frequency=candidate.frequency,
                status="draft",
            )
        )
        created += 1
    db.commit()
    return ImportSummary(created=created, skipped=skipped, duplicates=duplicates)


def _clean(record: dict, key: str) -> str | None:
    value = record.get(key)
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _clean_int(record: dict, key: str) -> int | None:
    value = _clean(record, key)
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _import_records(records: list[dict], db: Session) -> ImportSummary:
    created = 0
    skipped = 0
    duplicates: list[str] = []
    for record in records:
        headword = _clean(record, "headword_devanagari")
        if not headword:
            skipped += 1
            continue
        existing = db.scalars(
            select(Entry.id).where(Entry.headword_devanagari == headword)
        ).first()
        if existing is not None:
            skipped += 1
            duplicates.append(headword)
            continue

        entry = Entry(
            headword_devanagari=headword,
            headword_roman=_clean(record, "headword_roman"),
            headword_ipa=_clean(record, "headword_ipa"),
            headword_tamyig=_clean(record, "headword_tamyig"),
            tone=_clean(record, "tone"),
            pos=_clean(record, "pos"),
            status=_clean(record, "status") or "draft",
            frequency=_clean_int(record, "frequency"),
        )

        senses_data = record.get("senses")
        if isinstance(senses_data, list):
            for index, sense_data in enumerate(senses_data):
                if not isinstance(sense_data, dict):
                    continue
                raw_order = sense_data.get("order")
                entry.senses.append(
                    Sense(
                        definition_devanagari=(
                            _clean(sense_data, "definition_devanagari") or ""
                        ),
                        definition_roman=_clean(sense_data, "definition_roman"),
                        gloss=_clean(sense_data, "gloss"),
                        order=index if raw_order is None else int(raw_order),
                    )
                )
        else:
            definition = _clean(record, "definition_devanagari")
            if definition:
                entry.senses.append(
                    Sense(
                        definition_devanagari=definition,
                        definition_roman=_clean(record, "definition_roman"),
                        gloss=_clean(record, "gloss"),
                        order=0,
                    )
                )

        db.add(entry)
        created += 1
    db.commit()
    return ImportSummary(created=created, skipped=skipped, duplicates=duplicates)


@router.post("/wordlist", response_model=ImportSummary)
async def import_wordlist(
    file: UploadFile, db: Session = Depends(get_db)
) -> ImportSummary:
    raw = await file.read()
    text = raw.decode("utf-8-sig")
    if not text.strip():
        raise HTTPException(status_code=400, detail="File is empty")

    filename = (file.filename or "").lower()
    if filename.endswith(".json") or text.lstrip().startswith("["):
        try:
            records = json.loads(text)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON") from exc
        if not isinstance(records, list):
            raise HTTPException(
                status_code=400, detail="JSON must be an array of entries"
            )
        return _import_records([r for r in records if isinstance(r, dict)], db)

    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []
    if "headword_devanagari" not in fields:
        raise HTTPException(
            status_code=400,
            detail='CSV must include a "headword_devanagari" column',
        )
    return _import_records(list(reader), db)