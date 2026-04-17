#!/usr/bin/env bash
# Pre-edit advisory: warn when editing an ADR without 'last-reviewed' frontmatter.
# Non-blocking; intended as a lightweight nudge inside Claude Code hooks.
set -u
file="${TOOL_INPUT_file_path:-}"
[ -z "$file" ] && exit 0
case "$file" in
  *docs/07-decisions/adr-*.md)
    if [ -f "$file" ] && ! grep -q '^last-reviewed:' "$file"; then
      echo "⚠ ADR missing last-reviewed frontmatter. Update when modifying." >&2
    fi
    ;;
esac
exit 0
