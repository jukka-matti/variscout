#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

offenders=()
while IFS= read -r path; do
  [ -n "$path" ] || continue

  case "$path" in
    .claude/*)
      continue
      ;;
    vite.config.ts.timestamp-*|*/vite.config.ts.timestamp-*|test-results/*|*/test-results/*|*.tsbuildinfo|dist/*|*/dist/*)
      offenders+=("$path")
      ;;
  esac
done < <(git ls-files -c)

if [ "${#offenders[@]}" -gt 0 ]; then
  echo "Tracked generated artifacts found:" >&2
  printf '  %s\n' "${offenders[@]}" >&2
  echo "" >&2
  echo "Remove these files from git tracking, or update the allowlist if they are intentional." >&2
  exit 1
fi

echo "No tracked generated artifacts found."
