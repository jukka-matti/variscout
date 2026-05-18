#!/usr/bin/env bash
# check-dead-links.sh — detect broken relative .md links in docs/.
# Warn mode until 2026-05-01; after that date, exit 1 on failures.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CUTOFF_DATE="2026-05-01"
TODAY=$(date +%Y-%m-%d)

BROKEN=0

# Extract (source_file, link_target) tuples from markdown relative links
while IFS= read -r line; do
  src=$(echo "$line" | cut -d: -f1)
  link=$(echo "$line" | cut -d: -f2- | grep -oE '\]\([^)]+\.md[^)]*\)' | sed 's/^](//;s/)$//' | head -1)
  [ -z "$link" ] && continue

  # Skip docs/archive/ and docs/cards/ as link sources:
  # - Archived docs are frozen historical references; their internal cross-refs
  #   may use paths that were valid at the time of authoring but break after the
  #   file was moved into archive/.
  # - Card directories (Phase 3 decomposition) are an atomic substrate, not a
  #   navigational surface. Cards inherit prose-link refs from their source bulk
  #   files (decision-log, investigations, ~/.claude/memory atoms); validating
  #   those file-relative from each card location would require path-rewriting
  #   in every decompose script. The aggregate (decision-log.md), the ephemeral
  #   queue, and the source atoms are still validated; cards are queryable, not
  #   navigated.
  # Links INTO archive/ or cards/ from live docs are still checked.
  case "$src" in
    */docs/archive/*) continue ;;
    */docs/cards/*) continue ;;
  esac

  # Strip anchor
  path_only="${link%%#*}"

  # Skip absolute URLs
  case "$path_only" in
    http://*|https://*) continue ;;
  esac

  # Resolve relative to source file's directory
  src_dir=$(dirname "$src")
  target="$src_dir/$path_only"

  if [ ! -f "$target" ]; then
    echo "  ✗ $src → $path_only" >&2
    BROKEN=$((BROKEN + 1))
  fi
done < <(grep -rnE '\[[^]]*\]\([^)]+\.md[^)]*\)' "$ROOT/docs" --include='*.md' || true)

if [ "$BROKEN" -gt 0 ]; then
  echo "" >&2
  echo "⚠ Dead-link check: $BROKEN broken relative .md link(s) found." >&2
  echo "Fix or update references. After $CUTOFF_DATE, this hook will fail the commit." >&2

  if [ "$TODAY" \> "$CUTOFF_DATE" ] || [ "$TODAY" = "$CUTOFF_DATE" ]; then
    exit 1
  fi
  exit 0
fi

echo "✓ Dead-link check: no broken .md links."
