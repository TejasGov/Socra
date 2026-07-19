#!/usr/bin/env bash
# Verify that a .env file defines every key present in .env.example.
# Usage: scripts/check-env.sh services/api/.env
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLE="$ROOT_DIR/.env.example"
TARGET="${1:-$ROOT_DIR/.env}"

if [[ ! -f "$TARGET" ]]; then
  echo "❌ Env file not found: $TARGET"
  echo "   Create it with: cp .env.example $TARGET"
  exit 1
fi

missing=0
while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  if ! grep -qE "^${key}=" "$TARGET"; then
    echo "⚠️  Missing key in $TARGET: $key"
    missing=1
  fi
done < <(grep -vE '^\s*#' "$EXAMPLE" | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | sed -E 's/=.*//')

if [[ "$missing" -eq 0 ]]; then
  echo "✅ $TARGET defines all keys from .env.example"
else
  echo "❌ $TARGET is missing keys (see above)."
  exit 1
fi
