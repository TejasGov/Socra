# Architecture

Socra is a web-based Socratic tutoring platform built around a fine-tuned,
self-hosted **Gemma 4 instruction-tuned** model. The platform guides students
through progressive questions and hints instead of giving final answers.

## System overview

```text
┌────────────┐      HTTPS       ┌────────────────┐     internal      ┌──────────────────┐
│  Next.js   │ ───────────────▶ │    FastAPI     │ ────────────────▶ │  vLLM model      │
│  frontend  │  (NEXT_PUBLIC_    │    backend     │  MODEL_SERVER_URL │  server (Gemma)  │
│ apps/web   │   API_BASE_URL)   │ services/api   │  + API key        │ services/model-  │
└─────┬──────┘                  └───────┬────────┘                   │     server       │
      │                                 │                            └──────────────────┘
      │ Supabase Auth (anon key)        │ Supabase (service-role key, server-side only)
      ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Supabase: Auth · PostgreSQL (+ pgvector) · Storage               │
└──────────────────────────────────────────────────────────────────┘
```

## Trust boundaries

- **Frontend** holds only frontend-safe values (`NEXT_PUBLIC_*`, Supabase anon key).
  It never talks to the model server and never holds service-role or model keys.
- **Backend** holds all privileged secrets (Supabase service-role key, model-server
  API key, Hugging Face token, `DATABASE_URL`) and is the only caller of the model server.
- **Model server** (vLLM) is reachable only from the backend, authenticated with
  `MODEL_SERVER_API_KEY`, and network-restricted.

## Components

| Component | Path | Responsibility |
| --- | --- | --- |
| Web frontend | `apps/web` | Next.js UI, Supabase auth session, calls backend REST API |
| API backend | `services/api` | FastAPI, auth verification, RAG, orchestration of model calls |
| Model training | `services/model-training` | QLoRA fine-tuning of Gemma, evaluations |
| Model server | `services/model-server` | vLLM inference serving the fine-tuned model |
| Shared types | `packages/shared-types` | Types shared between frontend and backend contracts |
| Database | `database` | Migrations, seed data, RLS policies |

## Data flow (tutoring request)

1. Student authenticates via Supabase Auth in the frontend.
2. Frontend sends the question + course context to the backend with the user's
   access token.
3. Backend verifies the token, retrieves relevant course chunks from `pgvector`,
   builds a Socratic prompt, and calls the vLLM model server.
4. Backend streams/returns the guiding question or hint to the frontend.

## Retrieval / embeddings

- Course materials (PDFs) are extracted with PyMuPDF, chunked, embedded with a
  local BGE/E5 model, and stored in PostgreSQL via `pgvector`.
- Retrieval happens server-side only.

See also: [development-workflow.md](development-workflow.md),
[secrets-and-environments.md](secrets-and-environments.md),
[model-training.md](model-training.md), [deployment.md](deployment.md).
