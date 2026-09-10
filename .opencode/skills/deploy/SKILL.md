---
name: deploy
description: Deploy the app via Docker Compose. Build, run, and verify the container starts correctly.
---

## Deploy

- This is a Python FastAPI app deployed via Docker.
- `docker compose up --build` builds and starts the app + PostgreSQL.
- `alembic upgrade head` runs database migrations.
- Verify health at `http://localhost:8000/api/v1/health`.
- Preview deploys are not applicable — this is a backend service.
