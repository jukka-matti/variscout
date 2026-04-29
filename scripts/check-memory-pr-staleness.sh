#!/usr/bin/env bash
# check-memory-pr-staleness.sh — warn when memory entries reference open PRs that have actually merged.
# Per docs/decision-log.md memory-hygiene rule: ephemeral PR state belongs in git/gh, not memory.
# Warning-only; never fails the calling hook.

set -u

MEMORY_DIR="${HOME}/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory"

# Bail silently if memory dir or gh CLI is unavailable.
if [ ! -d "$MEMORY_DIR" ]; then
  exit 0
fi
if ! command -v gh >/dev/null 2>&1; then
  exit 0
fi

# Simple file-based cache to avoid hitting gh twice for the same PR in one run.
# Compatible with bash 3.2 (no associative arrays).
CACHE_DIR=$(mktemp -d 2>/dev/null || echo "/tmp/pr-stale-$$")
trap 'rm -rf "$CACHE_DIR" 2>/dev/null || true' EXIT

# Collect matches: lines where memory claims a PR is OPEN / in-flight / pending.
matches=$(grep -nHE "PR #[0-9]+ (OPEN|in-flight|in flight|pending)" "$MEMORY_DIR"/*.md 2>/dev/null || true)

if [ -z "$matches" ]; then
  exit 0
fi

while IFS= read -r line; do
  [ -z "$line" ] && continue
  # Parse file:lineno:content
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  content="${rest#*:}"

  # Extract first PR number from the matched content.
  pr_num=$(printf '%s\n' "$content" | grep -oE "PR #[0-9]+" | head -n 1 | grep -oE "[0-9]+")
  [ -z "$pr_num" ] && continue

  cache_file="$CACHE_DIR/pr-$pr_num"
  if [ -f "$cache_file" ]; then
    state=$(cat "$cache_file")
  else
    pr_json=$(gh pr view "$pr_num" --json state 2>/dev/null || true)
    if [ -z "$pr_json" ]; then
      echo "UNKNOWN" > "$cache_file"
      continue
    fi
    state=$(printf '%s' "$pr_json" | grep -oE '"state":"[^"]+"' | head -n 1 | sed 's/.*:"//;s/"$//')
    [ -z "$state" ] && state="UNKNOWN"
    echo "$state" > "$cache_file"
  fi

  case "$state" in
    MERGED|CLOSED)
      printf 'memory-staleness: %s:%s — PR #%s is %s on GitHub but memory says open\n' \
        "$file" "$lineno" "$pr_num" "$state" >&2
      ;;
    *)
      ;;
  esac
done <<< "$matches"

exit 0
