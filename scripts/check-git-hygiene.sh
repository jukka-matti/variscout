#!/usr/bin/env bash
# check-git-hygiene.sh — surface orphaned worktrees, stashes, and unmerged
# branches at session start. Non-blocking; warnings only.
#
# Wired from .claude/settings.json SessionStart hook.
# Exit 0 always. Runs in ~<100ms on a clean tree.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" 2>/dev/null || exit 0

CURRENT_WT="$ROOT"
STALE_THRESHOLD_MIN=30
WARNINGS=0

warn() { echo "  ⚠ $1" >&2; WARNINGS=$((WARNINGS + 1)); }

# --- Worktrees other than current ---
while IFS= read -r line; do
  path=$(echo "$line" | awk '{print $1}')
  [ -z "$path" ] && continue
  [ "$path" = "$CURRENT_WT" ] && continue
  [ ! -d "$path" ] && continue

  # Count uncommitted files in that worktree
  uncommitted=$(git -C "$path" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  [ "$uncommitted" = "0" ] && continue

  # Find most-recently-modified file inside the worktree (excluding .git)
  latest=$(find "$path" -type f -not -path '*/.git/*' -not -path '*/node_modules/*' \
    -printf '%T@\n' 2>/dev/null | sort -nr | head -1)
  now=$(date +%s)
  last=${latest%.*}

  if [ -n "$last" ] && [ "$last" -gt 0 ]; then
    age_min=$(( (now - last) / 60 ))
    if [ "$age_min" -lt "$STALE_THRESHOLD_MIN" ]; then
      # Likely another agent is active here; stay silent.
      continue
    fi
    warn "Worktree $path has $uncommitted uncommitted file(s), last touched ${age_min}m ago"
  else
    warn "Worktree $path has $uncommitted uncommitted file(s)"
  fi
done < <(git worktree list --porcelain 2>/dev/null | grep '^worktree ' | cut -d' ' -f2-)

# --- Unmerged branches not currently checked out ---
# Skip intentional safety branches (archive-preserved*) — those are backups,
# not drift.
unmerged=$(git branch --no-merged 2>/dev/null \
  | grep -v '^\*' \
  | grep -v -E '^\s*main$' \
  | grep -v -E '^\s*archive-preserved' \
  | sed 's/^[[:space:]]*//')
if [ -n "$unmerged" ]; then
  count=$(echo "$unmerged" | wc -l | tr -d ' ')
  first=$(echo "$unmerged" | head -3 | tr '\n' ',' | sed 's/,$//; s/,/, /g')
  warn "Unmerged branches: $count ($first$([ "$count" -gt 3 ] && echo ', …'))"
fi

# --- Stashes ---
stash_count=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
if [ "$stash_count" -gt 0 ]; then
  warn "$stash_count stash(es) present — review: git stash list"
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo "⚠ Git hygiene: $WARNINGS issue(s) above. Resolve before starting new work to avoid drift." >&2
fi
exit 0
