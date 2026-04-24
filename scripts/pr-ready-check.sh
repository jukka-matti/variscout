#!/usr/bin/env bash
# pr-ready-check.sh — run before merging a PR.
# Executes the checks that should be green before landing code on main:
# tests, lint, docs:check. Exits non-zero if any step fails.
#
# Usage:
#   bash scripts/pr-ready-check.sh           # standard checks
#   bash scripts/pr-ready-check.sh --review  # also suggest a subagent code review
#
# Designed to be run right before `gh pr merge` (or direct commit to main
# for borderline changes). Not a hook — invoked explicitly.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

REVIEW_FLAG=0
for arg in "$@"; do
  [ "$arg" = "--review" ] && REVIEW_FLAG=1
done

step_pass() { echo "  ✓ $1"; }
step_fail() { echo "  ✗ $1" >&2; }
green()     { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()       { printf '\033[0;31m%s\033[0m\n' "$1"; }
yellow()    { printf '\033[0;33m%s\033[0m\n' "$1"; }

FAILED=0
run_step() {
  local label="$1"; shift
  echo ""
  echo "── $label ──"
  if "$@"; then
    step_pass "$label passed"
  else
    step_fail "$label failed (exit $?)"
    FAILED=$((FAILED + 1))
  fi
}

echo "=== pr-ready-check ==="
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "HEAD:   $(git rev-parse --short HEAD) — $(git log -1 --format='%s')"

# Freshness banner — advisory, non-blocking. A branch ≥10 commits behind main
# is likely to hit conflicts at squash time (lockfile + any parallel work).
# Computed against the cached origin/main — rely on caller to fetch if fresh.
if BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null) && [ "${BEHIND:-0}" -ge 10 ]; then
  echo ""
  yellow "⚠ Branch is $BEHIND commits behind origin/main — rebase/merge first to avoid conflicts."
  echo "    git fetch origin main && git merge origin/main"
fi

run_step "tests (turbo)"       pnpm test
run_step "lint (turbo)"        pnpm lint
run_step "docs:check"          pnpm docs:check

echo ""
echo "=== Summary ==="
if [ "$FAILED" -eq 0 ]; then
  green "✓ All checks passed — PR is ready to merge."
else
  red   "✗ $FAILED step(s) failed — do NOT merge until resolved."
fi

if [ "$REVIEW_FLAG" = "1" ]; then
  echo ""
  yellow "→ Subagent review requested. In your Claude Code session, invoke:"
  echo "    /skill superpowers:requesting-code-review"
  echo "  on the current PR diff before merging."
fi

exit "$FAILED"
