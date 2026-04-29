#!/usr/bin/env bash
# decision-log-reminder.sh — gentle pre-commit reminder when feature work might warrant a decision-log update.
# Heuristic, never blocks. Override by ignoring.

set -u

# Read commit message best-effort. Pre-commit hooks don't always have COMMIT_EDITMSG populated yet,
# so this is a soft signal — empty message just means we skip the message-pattern check.
commit_msg=""
if [ -f ".git/COMMIT_EDITMSG" ]; then
  commit_msg=$(cat .git/COMMIT_EDITMSG 2>/dev/null || true)
fi

# Get staged file list. If we're not in a git repo or nothing is staged, exit silently.
staged=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$staged" ]; then
  exit 0
fi

# Pattern matching is case-insensitive.
msg_lower=$(printf '%s' "$commit_msg" | tr '[:upper:]' '[:lower:]')

msg_hits=0
case "$msg_lower" in
  *"feat:"*|*"superseded"*|*"deprecat"*|*"remove"*|*"defer"*)
    msg_hits=1
    ;;
esac

# Only warn if the commit message hints at decision-worthy changes.
if [ "$msg_hits" -eq 0 ]; then
  exit 0
fi

# Check whether staged files include apps/ or packages/.
product_hits=0
if printf '%s\n' "$staged" | grep -qE "^(apps|packages)/"; then
  product_hits=1
fi
if [ "$product_hits" -eq 0 ]; then
  exit 0
fi

# Check whether docs/decision-log.md is in the staged set.
if printf '%s\n' "$staged" | grep -qx "docs/decision-log.md"; then
  exit 0
fi

# All conditions met — emit the gentle warning.
{
  echo "decision-log-reminder: this commit touches apps/ or packages/ and the message"
  echo "  mentions feat/superseded/deprecat/remove/defer, but docs/decision-log.md is not staged."
  echo "  Consider whether a Replayed Decision / Open Question / Named-Future entry is warranted."
  echo "  (warning-only; ignore if not applicable)"
} >&2

exit 0
