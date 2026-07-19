# Development Workflow

## Branches

Long-lived branches:

```text
main          # production / pilot-ready, protected
development   # integration branch, protected
```

Work happens on short-lived branches cut from `development`.

### Feature branch naming

```text
feat/<ticket>-<description>     # new feature
fix/<ticket>-<description>      # bug fix
chore/<description>             # tooling, deps, config
docs/<description>              # documentation only
research/<description>          # model training / data / experiments
```

Examples:

```text
feat/SOC-12-socratic-prompt-builder
fix/SOC-31-token-refresh
chore/ci-gitleaks
docs/architecture-diagram
research/qlora-eval-v2
```

## Pull requests

1. Branch from `development`.
2. Keep PRs focused and small.
3. Fill in `.github/pull_request_template.md`, including the security checklist.
4. Ensure CI is green: lint, typecheck, tests, and secret scan.
5. Request review; squash-merge into `development`.
6. `development` → `main` promotions happen via reviewed PRs only.

### Required checks (recommended branch protection)

Both `main` and `development` should require:

- Pull request before merging (no direct pushes).
- Passing status checks: `CI / frontend`, `CI / backend`, `Secret Scan / gitleaks`.
- At least one approving review.
- Up-to-date branches before merge.

> Branch protection is configured in **GitHub → Settings → Branches**. It cannot
> live in the repo; apply it in the GitHub UI (or via `gh api`).

## Local checks before pushing

```bash
# Frontend
cd apps/web
npm run lint
npm run typecheck
npm run test

# Backend
cd services/api
ruff check .
pytest
```

## Commits

- Use clear, imperative commit messages ("Add Socratic prompt builder").
- Never commit `.env` files, secrets, model weights, or real student data.
