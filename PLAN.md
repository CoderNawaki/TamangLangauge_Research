# Tamang Language Dictionary — Plan

A digital dictionary for the **Tamang language** of Nepal — one of the oldest indigenous
groups in the country. Words in **Devanagari** (primary, with romanized + IPA forms and
Tamyig reserved for future Unicode support), meanings in **Devanagari**, with **tones and
audio** treated as critical features.

## Research context

- **Language**: Tamang (ISO `taj`), Tamangish branch of Tibeto-Burman, ~1.3–1.5M speakers,
  the largest non-Indo-Aryan group in Nepal.
- **Scripts**:
  - **Devanagari** (U+0900–U+097F) — fully in Unicode; used for words and meanings. **Not yet supported.**
  - **Tamyig** — the indigenous Tamang abugida (simplified Uchen/Tibetan-derived, standardized
    ~2002). **NOT yet encoded in Unicode** (on the Unicode "Proposed New Scripts" list). We
    reserve a `headword_tamyig` field but defer implementation until Unicode encoding settles.
- **Tone**: Classically described as a **4-tone system (T1–T4)** in the Risiangku (Eastern)
  variety (Mazaudon). Tones are realized as a *bundle* of pitch height/contour + phonation
  (modal vs. breathy) + initial-consonant voicing, and are **word-tone** (spanning the word,
  not each syllable). Tone varies by dialect, so tone is:
  - **nullable** (not forced on every entry), and
  - **dialect-tagged** (never assumed across dialects).

## Decisions (locked)

| Area | Decision |
|------|----------|
| App type | Web app (public dictionary site later) |
| Backend | Python **FastAPI** + SQLAlchemy + Alembic |
| Storage | **SQLite** for dev; migrates to **Postgres** in prod |
| Frontend | **React / Next.js** separate app |
| Primary scripts | Words in **Devanagari**; meanings in **Devanagari** (roman + IPA also stored) |
| Pronunciation | **Critical** — tones (T1–T4) + audio recordings |
| Entry workflow | **Automated corpus extraction** into drafts → human review → publish |

## Data model

- **entries** — headword record (headword_devanagari, roman, ipa, tamyig[reserved],
  tone, pos, dialect, frequency, status)
- **senses** — a word can have multiple meanings (definition + gloss, ordered)
- **examples** — usage sentences with translations, linked to a sense
- **dialects** — regional variants (Eastern Risiangku, etc.)
- **sources** — attribution for corpus imports / contributors / audio
- **audio** — per-entry recordings (speaker, dialect, file path) for future pronunciation

## Feature roadmap

### Phase 0 — Foundation ✅ (this session)
- Backend scaffold (FastAPI + SQLAlchemy + Alembic, SQLite)
- Frontend scaffold (Next.js)
- Entry schema spanning all scripts + tone + status + source + frequency

### Phase 1 — Core dictionary
- Entry CRUD + search (Devanagari / roman / IPA)
- Word detail view (all scripts side by side)
- Bilingual directionality: Tamang→Nepali and Nepali→Tamang lookup

### Phase 2 — Pronunciation (critical)
- Tone display (T1–T4 markers with pitch + breathiness notes)
- Audio recordings (playable, per dialect)
- IPA transcription with tone diacritics

### Phase 3 — Data entry & automation
- Corpus ingest pipeline (import text, auto-extract candidates, frequency-sort)
- Batch import of existing wordlists (CSV/JSON)
- Draft → review → publish workflow

### Phase 4 — Rich dictionary features
- Part of speech + grammatical info
- Example sentences with word-level glossing
- Inflection / derivation (verb tenses/aspects)
- Dialect comparison (regional variants side by side)

### Phase 5 — Advanced language features
- Tone minimal-pair explorer (e.g. the classic `kuː-pa` T1–T4 quadruplet)
- Related words / semantic groups
- Etymology (Proto-TGTM two-tone split ancestry)
- Export (CSV / JSON / TEILex)
- Statistics & progress dashboard

## Project layout

```
backend/   FastAPI app (app/models, app/schemas, app/api)
frontend/  Next.js app
PLAN.md    this document
```
