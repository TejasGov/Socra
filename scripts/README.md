# Scripts

Repo-wide helper scripts.

| Script | Purpose |
| --- | --- |
| `check-env.sh` | Verify a `.env` file defines every key in `.env.example`. |

```bash
chmod +x scripts/check-env.sh
scripts/check-env.sh services/api/.env
```
