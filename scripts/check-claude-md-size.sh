#!/usr/bin/env bash
# check-claude-md-size.sh — enforce CLAUDE.md size budgets per spec Layer 2.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Parallel arrays (portable to bash 3.2 on macOS)
FILES=(
  "CLAUDE.md"
  "packages/core/CLAUDE.md"
  "packages/charts/CLAUDE.md"
  "packages/hooks/CLAUDE.md"
  "packages/ui/CLAUDE.md"
  "packages/stores/CLAUDE.md"
  "packages/data/CLAUDE.md"
  "apps/azure/CLAUDE.md"
  "apps/pwa/CLAUDE.md"
)
LIMITS=(50 80 50 40 50 40 20 70 30)

FAILED=0
WARNED=0

for i in "${!FILES[@]}"; do
  file="${FILES[$i]}"
  budget="${LIMITS[$i]}"
  path="$ROOT/$file"
  if [ ! -f "$path" ]; then
    echo "⚠ Missing: $file" >&2
    WARNED=$((WARNED + 1))
    continue
  fi
  lines=$(wc -l < "$path" | tr -d ' ')
  warn=$((budget * 80 / 100))
  fail=$((budget * 120 / 100))

  if [ "$lines" -gt "$fail" ]; then
    echo "✗ $file: $lines lines exceeds fail threshold ($fail, 120% of $budget)" >&2
    FAILED=$((FAILED + 1))
  elif [ "$lines" -gt "$warn" ]; then
    echo "⚠ $file: $lines lines exceeds warn threshold ($warn, 80% of $budget). Budget: $budget." >&2
    WARNED=$((WARNED + 1))
  fi
done

if [ "$FAILED" -gt 0 ]; then
  echo "" >&2
  echo "CLAUDE.md size fail: $FAILED file(s) exceed 120% of budget. Tighten or split into skills/reference files." >&2
  exit 1
fi

if [ "$WARNED" -gt 0 ]; then
  echo "" >&2
  echo "CLAUDE.md size warn: $WARNED file(s) exceed 80% of budget. Consider tightening before Phase 4." >&2
fi

echo "✓ CLAUDE.md size check OK."
