# Secrets & Environments

## Golden rules

- Never commit `.env` files. Only `.env.example` is tracked.
- Never expose the Supabase **service-role** key to the browser.
- Never expose **model-server** credentials to the browser.
- Never log raw access tokens or API keys.
- Never store real student data in seed files or issues.
- Rotate any secret that enters Git history, then purge it.
- Use **GitHub repository secrets** for CI and deployment.
- Secret scanning (Gitleaks) runs in CI on every push and PR.

## Where variables live

| File | Committed? | Contains |
| --- | --- | --- |
| `.env.example` | ✅ yes | Placeholders only, every required variable |
| `.env` (root) | ❌ no | Local root values (Docker Compose) |
| `apps/web/.env.local` | ❌ no | **Frontend-safe** vars only (`NEXT_PUBLIC_*`, anon key) |
| `services/api/.env` | ❌ no | **Backend-only** secrets (service-role, model key, DB URL, HF token) |

Do **not** copy backend-only secrets into `apps/web/.env.local`.
Any variable without the `NEXT_PUBLIC_` prefix is server-side only.

## Frontend-safe vs backend-only

**Frontend-safe** (may appear in the browser bundle):

```env
NEXT_PUBLIC_APP_ENV
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Backend-only** (must never reach the browser):

```env
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
MODEL_SERVER_URL
MODEL_SERVER_API_KEY
HUGGINGFACE_TOKEN
```

## Environment separation

Use fully separate resources per environment — **development**, **staging**,
**production/pilot** — each with its own:

- Supabase database
- Storage bucket
- credentials
- model endpoint
- logs
- environment variables

**Never use real student data in development.**

## Startup validation

The backend validates required environment variables at startup (see
`services/api/app/core/config.py`) and fails fast with a clear message if any
required variable is missing. Verify the frontend bundle contains no backend
secrets before shipping (`npm run build` then inspect output).

## Secret rotation

1. Revoke/rotate the secret in its provider (Supabase, HF, model server).
2. Update the value in every affected `.env` and in GitHub repository secrets.
3. If the secret ever entered Git history, purge history (e.g. `git filter-repo`)
   and force-push, then notify the team.
4. Confirm CI secret scanning passes.
