from __future__ import annotations

import csv as csv_module
import io
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entry
from ..schemas.entry import EntryOut

router = APIRouter(prefix="/api/export", tags=["export"])


def _exportable_entries(db: Session, include_all: bool) -> list[Entry]:
    stmt = select(Entry).order_by(Entry.headword_devanagari)
    if not include_all:
        stmt = stmt.where(Entry.status.in_(["published", "reviewed"]))
    return list(db.scalars(stmt).all())


@router.get("")
def export_entries(
    format: str = Query(default="json", pattern="^(json|csv|teilex)$"),
    all: bool = Query(default=False, description="Include draft entries"),
    db: Session = Depends(get_db),
) -> Response:
    entries = _exportable_entries(db, all)
    filename = f"tamang-dictionary-{format}"

    if format == "json":
        data = [EntryOut.model_validate(e).model_dump() for e in entries]
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        media_type = "application/json"

    elif format == "csv":
        buf = io.StringIO()
        writer = csv_module.writer(buf)
        writer.writerow(
            [
                "id",
                "headword_devanagari",
                "headword_roman",
                "headword_ipa",
                "tone",
                "pos",
                "grammar",
                "etymology",
                "dialect",
                "status",
                "frequency",
                "definitions",
                "examples",
                "wordforms",
                "groups",
            ]
        )
        for e in entries:
            defs = "; ".join(
                " — ".join(
                    filter(
                        None,
                        [s.definition_devanagari, s.definition_roman, s.gloss],
                    )
                )
                for s in e.senses
            )
            examples = "; ".join(
                e.text_devanagari or e.text_roman or e.translation_english or ""
                for s in e.senses
                for e in s.examples
            )
            wordforms = "; ".join(
                f"{w.label or ''}: {w.form_devanagari}" for w in e.wordforms
            )
            groups = "; ".join(g.name for g in e.semantic_groups)
            writer.writerow(
                [
                    e.id,
                    e.headword_devanagari,
                    e.headword_roman,
                    e.headword_ipa,
                    e.tone,
                    e.pos,
                    e.grammar,
                    e.etymology,
                    e.dialect.name if e.dialect else "",
                    e.status,
                    e.frequency,
                    defs,
                    examples,
                    wordforms,
                    groups,
                ]
            )
        body = buf.getvalue().encode("utf-8")
        media_type = "text/csv"

    elif format == "teilex":
        from xml.etree import ElementTree as ET

        root = ET.Element("teiCorpus")
        root.set("xmlns", "http://www.tei-c.org/ns/1.0")
        root.set("version", "1.0")
        TEI = ET.SubElement(root, "teiHeader")
        ET.SubElement(TEI, "fileDesc").set("title", "Tamang Language Dictionary")
        body_el = ET.SubElement(root, "entryList")
        for e in entries:
            entry_el = ET.SubElement(body_el, "entry")
            ET.SubElement(entry_el, "form", type="lemma").text = e.headword_devanagari
            if e.headword_roman:
                ET.SubElement(entry_el, "form", type="roman").text = e.headword_roman
            if e.headword_ipa:
                ET.SubElement(entry_el, "form", type="ipa").text = e.headword_ipa
            if e.tone:
                ET.SubElement(entry_el, "gramGrp").text = f"tone {e.tone}"
            if e.pos:
                ET.SubElement(entry_el, "gramGrp").set("pos", e.pos)
            if e.etymology:
                ET.SubElement(entry_el, "etym").text = e.etymology
            for g in e.semantic_groups:
                ET.SubElement(entry_el, "note", type="semantic-group").text = g.name
            senses_el = ET.SubElement(entry_el, "senses")
            for s in e.senses:
                sens = ET.SubElement(senses_el, "sense")
                def_el = ET.SubElement(sens, "def")
                def_el.text = s.definition_devanagari
                if s.definition_roman:
                    ET.SubElement(sens, "def").text = s.definition_roman
                if s.gloss:
                    ET.SubElement(sens, "gloss").text = s.gloss
                for ex in s.examples:
                    cit = ET.SubElement(sens, "cit")
                    ET.SubElement(cit, "quote").text = ex.text_devanagari or ""
                    if ex.translation_english:
                        ET.SubElement(cit, "trans").text = ex.translation_english
        body = ET.tostring(root, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
        media_type = "application/xml"

    else:  # pragma: no cover - guarded by pattern
        raise HTTPException(status_code=400, detail="Unsupported format")

    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}.{format}"'},
    )