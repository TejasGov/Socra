# Infra

Infrastructure-as-code and deployment configuration.

Phase 1 keeps infra minimal — local development runs via the root
`docker-compose.yml`. Add environment-specific infra here as the project grows:

```text
infra/
├── development/
├── staging/
└── production/
```

See [../docs/deployment.md](../docs/deployment.md) for the intended deployment shape.

## Guidelines

- Keep deployment secrets out of the repo (use platform secret managers / GitHub
  secrets).
- One isolated set of resources per environment (Supabase project, storage,
  model endpoint, logs).
