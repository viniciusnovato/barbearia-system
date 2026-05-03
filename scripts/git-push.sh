#!/bin/bash
# ============================================================
# Helper para git push usando o token salvo em .env.local
# Não persiste o token em .git/config — usa inline na URL.
#
# Uso:
#   ./scripts/git-push.sh                # push de main
#   ./scripts/git-push.sh nome-da-branch
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env.local ]; then
  echo "✗ .env.local não encontrado em $ROOT"
  exit 1
fi

# Lê GITHUB_TOKEN e GITHUB_REPO do .env.local sem fazer source (evita execução de scripts)
TOKEN=$(grep -E "^GITHUB_TOKEN=" .env.local | cut -d= -f2)
REPO=$(grep -E "^GITHUB_REPO=" .env.local | cut -d= -f2)

if [ -z "$TOKEN" ] || [ -z "$REPO" ]; then
  echo "✗ Defina GITHUB_TOKEN e GITHUB_REPO no .env.local"
  exit 1
fi

BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
echo "→ Push de $BRANCH para $REPO..."
git push "https://x-access-token:${TOKEN}@github.com/${REPO}.git" "$BRANCH:$BRANCH"
echo "✓ Done."
