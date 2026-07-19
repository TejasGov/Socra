# Database

Supabase PostgreSQL with `pgvector` for embeddings.

```text
database/
├── migrations/   # ordered SQL migrations (0001_init.sql, ...)
├── policies/     # Row Level Security policies
└── seed/         # synthetic seed data — NEVER real student data
```

## Apply locally

Against the local Docker Postgres (`docker compose up db`), the
`migrations/` folder is auto-applied on first boot. To run manually:

```bash
psql "$DATABASE_URL" -f database/migrations/0001_init.sql
psql "$DATABASE_URL" -f database/policies/rls.sql
psql "$DATABASE_URL" -f database/seed/seed.sql   # dev only
```

## Notes

- Embedding dimension in `0001_init.sql` (384) must match `EMBEDDING_DIM`.
- RLS policies are placeholders — harden before any pilot.
