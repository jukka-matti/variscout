#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VITE_VARISCOUT_CHANNEL=free pnpm --filter @variscout/workspace-app build

if rg -n "buildDocumentSnapshotVrs|parseDocumentSnapshotVrs|DocumentSnapshotVrs|\\.vrs" apps/pwa/dist; then
  echo "Free Workspace bundle contains paid artifact code or UI strings." >&2
  exit 1
fi

echo "Free Workspace bundle excludes paid artifact code."
