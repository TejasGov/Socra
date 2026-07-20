# ACP Integration (Bring-Your-Own-Subscription)

Status: draft — branch `feat/acp-integration`

## Goal

Let students use their own Claude (Claude Code) or OpenAI (Codex) subscription
instead of Socra-provisioned model tokens. Socra collects the resulting chat
transcripts (with consent) as training data for fine-tuning the self-hosted
Gemma model later.

## Why ACP

The [Agent Client Protocol](https://agentclientprotocol.com) (ACP) is a
JSON-RPC-over-stdio protocol for talking to coding agents. Both vendors ship
ACP adapters that authenticate with the user's own subscription:

- `@zed-industries/claude-code-acp` — Claude Code (Anthropic subscription)
- `codex-acp` — Codex (OpenAI subscription)

These agents run **on the student's machine** (that's where the subscription
login lives), so the web app cannot spawn them directly. We bridge them.

## Architecture

```text
┌──────────────┐  WebSocket (localhost:8137)  ┌────────────────────┐
│  apps/web    │ ───────────────────────────▶ │  packages/acp-bridge│
│  chat UI     │                              │  (Node CLI on the   │
└──────┬───────┘                              │   student machine)  │
       │                                      └─────────┬──────────┘
       │ HTTPS: mirror transcript                       │ stdio JSON-RPC (ACP)
       ▼                                                ▼
┌──────────────┐                              ┌────────────────────┐
│ services/api │ ──▶ Supabase (acp_sessions,  │ claude-code-acp or │
│  FastAPI     │      acp_messages tables)    │ codex-acp process  │
└──────────────┘                              └────────────────────┘
```

- **Bridge** (`packages/acp-bridge`): small Node CLI students run once
  (`npx socra-bridge`). Spawns the chosen ACP agent as a child process, speaks
  ACP over stdio, exposes a localhost WebSocket the browser connects to.
  Localhost-only listener + per-launch pairing token so other sites can't
  connect.
- **Frontend** (`apps/web`): provider picker (Socra-hosted Gemma | Claude |
  Codex), chat UI streams via the bridge when a BYO provider is selected,
  falls back to the backend `tutor/ask` path for the hosted model. The
  Socratic system prompt is injected into the ACP session so BYO providers
  still tutor instead of answering.
- **Backend** (`services/api`): `POST /api/v1/acp/sessions` and
  `POST /api/v1/acp/sessions/{id}/messages` ingest transcripts, authenticated
  with the student's Supabase JWT. Stores provider, prompts, responses,
  timestamps for the fine-tuning corpus.
- **Database** (`database/migrations`): `acp_sessions` and `acp_messages`
  tables with RLS (students see only their own rows), plus a
  `data_collection_consent` flag on the session.

## Consent / privacy

The public README currently promises "no raw student answers stored".
Collecting transcripts for fine-tuning requires:

1. Explicit opt-in consent captured in the UI before the first BYO session.
2. `data_collection_consent` recorded per session; no ingestion without it.
3. Docs updated to describe what is collected and why.

Do not launch the pilot before resolving this with the team.

## Non-goals (this branch)

- No server-side spawning of vendor agents (ToS + credential risk).
- No change to the hosted Gemma path.
- No fine-tuning pipeline changes; this branch only lands the data.

## Work breakdown

| # | Area | Deliverable |
|---|------|-------------|
| 1 | `packages/acp-bridge` | Node/TS CLI: spawn agent, ACP handshake (`initialize`, `session/new`, `session/prompt`), WS server, pairing token, transcript events |
| 2 | `services/api` + `database` | Pydantic schemas, routes, repository, migration `0002_acp_sessions.sql` with RLS, pytest coverage |
| 3 | `apps/web` | Provider selector, `lib/acp.ts` WS client, chat page streaming, consent modal, vitest coverage |
| 4 | Docs | This file, README pointer, `.env.example` additions (`ACP_BRIDGE_PORT`, `NEXT_PUBLIC_ACP_BRIDGE_URL`) |
