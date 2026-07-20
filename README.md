<div align="center">

<br />

<h1>Socra</h1>

<p><em>Socratic AI — Learn by Thinking</em></p>

<br />

![Status](https://img.shields.io/badge/status-prototype-orange?style=flat-square)
![Funded](https://img.shields.io/badge/ELN_Funded-University_at_Buffalo-005bbb?style=flat-square)
![Stack](https://img.shields.io/badge/stack-Python_%7C_React_%7C_Gemma-111111?style=flat-square)

<br />

</div>

---

ChatGPT gives students the answer. Socra asks them a question.

That difference is the whole product.

---

## The Problem

Modern AI tools make it trivially easy to get answers without understanding. Students paste in homework, hit enter, and move on. Nothing sticks.

The result:

- Shallow, surface-level learning
- Collapsed critical thinking
- AI dependency where there should be skill
- Academic integrity quietly eroding

---

## The Solution

Socra enforces a **guided reasoning approach** rooted in the Socratic method — the same technique that's been the gold standard for teaching for 2,500 years.

Instead of:
> *"Here's the answer to your recursion problem."*

Socra says:
> *"What's your base case, and why does it matter?"*

No direct answers. Ever.

---

## How It Works

### 🧑‍🏫 Faculty Configuration
- Upload course materials and problem sets
- Socra builds a reasoning map using RAG (Retrieval-Augmented Generation)
- Each topic gets a structured hint ladder — broad nudges down to targeted clues

### 🧑‍🎓 Student Environment
- Students work inside a sandboxed interface (no copy-paste, no tab switching)
- The AI asks guiding questions — it never gives the solution
- Students must articulate their reasoning before unlocking the next step

### 📊 Instructor Analytics
- Tracks where students consistently get stuck
- Surfaces conceptual gaps across the class
- Helps instructors improve content and teaching focus

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React / Next.js |
| Backend | Python (FastAPI) |
| Database & Vector Store | Supabase PostgreSQL + `pgvector` |
| AI / LLM | self-hosted Gemma 4 (via vLLM) |
| Sandboxing | Browser-level constraints |

---

## Privacy First

- No raw student answers stored
- Only aggregated learning patterns tracked
- No individual surveillance — the goal is understanding, not catching cheaters
- Data scoped per course, per instructor

---

## Current Status

| Milestone | Status |
|---|---|
| Core concept validated | ✅ Done |
| ELN funding secured (University at Buffalo) | ✅ Done |
| Faculty feedback sessions | 🔄 In progress |
| Prototype (MVP) | 🔄 In development |
| Pilot deployment | 🎯 Planned |

---

## Roadmap

- [ ] MVP with single-course pilot
- [ ] Adaptive hint generation based on student response quality
- [ ] LMS integration (Canvas, Blackboard)
- [ ] Multi-course faculty dashboard
- [ ] Published research findings from pilot data

---

## Development Setup

> This section covers the Phase 1 development scaffold. Full technical details
> live in [`docs/`](docs/).

### Prerequisites

- Git
- Node.js **22** (see `apps/web/.nvmrc`) + npm
- Python **3.12** (3.11+ supported; see `services/api/.python-version`)
- Docker Desktop
- A Supabase project
- Access to the Gemma model weights (Hugging Face) and a GPU for training/inference

### Repository layout

```text
apps/web/              Next.js + TypeScript frontend
services/api/          FastAPI backend
services/model-training/  Gemma QLoRA fine-tuning
services/model-server/    vLLM inference service
packages/shared-types/    shared TS contract types
database/              migrations, policies, seed
docs/                  architecture, workflow, secrets, deployment
```

### Environment files

```bash
cp .env.example .env                       # root (Docker Compose)
cp .env.example apps/web/.env.local        # frontend-safe vars only
cp .env.example services/api/.env          # backend-only secrets
```

Never copy backend-only secrets into `apps/web/.env.local`. See
[docs/secrets-and-environments.md](docs/secrets-and-environments.md).

### Frontend

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

### Backend

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000 (docs at /docs)
```

### Docker (all services)

```bash
docker compose up --build
```

### Tests

```bash
# Frontend
cd apps/web && npm run lint && npm run typecheck && npm run test

# Backend
cd services/api && ruff check . && pytest
```

See [docs/development-workflow.md](docs/development-workflow.md) for branching
and PR conventions.

---

## Contributing

Early-stage project. If you're interested in AI, education technology, or systems design — open an issue or reach out directly.

---

## Contact

**Atshal Ahmed Khan**  
B.S. Computer Science (Mathematics minor) — University at Buffalo  
📧 atshalah@buffalo.edu & tejasgov@buffalo.edu

---

<div align="center">
<sub><i>Socra isn't trying to replace learning. It's trying to bring it back.</i></sub>
</div>
