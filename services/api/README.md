# Socra API (FastAPI)

Backend for the Socra Socratic tutoring platform. It verifies auth, performs
retrieval, and is the **only** service that calls the vLLM model server.

## Setup

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
cp ../../.env.example .env           # backend-only secrets
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API:  http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Test

```bash
pytest
ruff check .
```

## Layout

```text
app/
├── api/v1/        # versioned HTTP routes
├── auth/          # Supabase token verification
├── core/          # config + env validation
├── database/      # engine/session, pgvector access
├── models/        # ORM/data models
├── repositories/  # data-access layer
├── schemas/       # Pydantic request/response models
├── services/      # business logic, model-server client, embeddings
└── main.py        # app entry point
```

## Environment

Required variables are validated at startup (`app/core/config.py`). In
`development` missing values only warn; in `staging`/`production` they raise.
See [../../docs/secrets-and-environments.md](../../docs/secrets-and-environments.md).
The service-role and model-server keys must remain backend-only.
