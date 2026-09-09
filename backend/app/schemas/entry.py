from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------- Nested ----------

class ExampleGlossOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word: str
    gloss: str | None = None
    order: int


class ExampleGlossIn(BaseModel):
    word: str
    gloss: str | None = None
    order: int = 0


class WordFormIn(BaseModel):
    label: str | None = None
    form_devanagari: str
    form_roman: str | None = None
    order: int = 0


class WordFormOut(WordFormIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None = None
    author: str | None = None
    source_type: str


class DialectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    name_local: str | None = None
    region: str | None = None


class ExampleIn(BaseModel):
    text_devanagari: str | None = None
    text_roman: str | None = None
    translation_devanagari: str | None = None
    translation_english: str | None = None
    glosses: list[ExampleGlossIn] = Field(default_factory=list)


class ExampleOut(ExampleIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    glosses: list[ExampleGlossOut] = Field(default_factory=list)


class SenseIn(BaseModel):
    definition_devanagari: str
    definition_roman: str | None = None
    gloss: str | None = None
    order: int = 0
    examples: list[ExampleIn] = Field(default_factory=list)


class SenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    definition_devanagari: str
    definition_roman: str | None = None
    gloss: str | None = None
    order: int
    examples: list[ExampleOut] = Field(default_factory=list)


class AudioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dialect: DialectOut | None = None
    speaker: str | None = None
    file_path: str
    recorded_at: datetime | None = None


# ---------- Entry ----------

class EntryCreate(BaseModel):
    headword_devanagari: str
    headword_roman: str | None = None
    headword_ipa: str | None = None
    headword_tamyig: str | None = None
    tone: str | None = None
    pos: str | None = None
    grammar: str | None = None
    status: str = "draft"
    frequency: int | None = None
    dialect_id: int | None = None
    source_id: int | None = None
    senses: list[SenseIn] = Field(default_factory=list)
    wordforms: list[WordFormIn] = Field(default_factory=list)


class EntryUpdate(BaseModel):
    headword_devanagari: str | None = None
    headword_roman: str | None = None
    headword_ipa: str | None = None
    headword_tamyig: str | None = None
    tone: str | None = None
    pos: str | None = None
    grammar: str | None = None
    status: str | None = None
    frequency: int | None = None
    dialect_id: int | None = None
    source_id: int | None = None
    senses: list[SenseIn] | None = None
    wordforms: list[WordFormIn] | None = None


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    headword_devanagari: str
    headword_roman: str | None = None
    headword_ipa: str | None = None
    headword_tamyig: str | None = None
    tone: str | None = None
    pos: str | None = None
    grammar: str | None = None
    status: str
    frequency: int | None = None
    dialect: DialectOut | None = None
    source: SourceOut | None = None
    senses: list[SenseOut] = Field(default_factory=list)
    audio: list[AudioOut] = Field(default_factory=list)
    wordforms: list[WordFormOut] = Field(default_factory=list)
