# Tamang Language Research

A digital dictionary for the **Tamang language** of Nepal — one of the oldest indigenous
groups in the country.

Words are entered in **Devanagari** (with romanized and IPA forms), meanings are in
**Devanagari**, and **tones (T1–T4) and audio** are treated as critical features.

> **Script note:** The indigenous Tamang abugida (Tamyig) is not yet encoded in Unicode.
> The schema reserves a `headword_tamyig` field, but implementation is deferred until
> Unicode encoding is settled. Primary computable scripts are Devanagari, romanization,
> and IPA.

See [PLAN.md](./PLAN.md) for the full feature roadmap and data model.

## Stack

- **Backend**: Python FastAPI + SQLAlchemy + Alembic (SQLite for dev → Postgres in prod)
- **Frontend**: React / Next.js (TypeScript, Tailwind)

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

- API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://127.0.0.1:3000

The frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://127.0.0.1:8000`) for the API.
