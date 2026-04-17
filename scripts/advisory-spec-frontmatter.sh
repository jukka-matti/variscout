#!/usr/bin/env bash
# Pre-edit advisory: warn when editing a spec without YAML frontmatter.
# Non-blocking; intended as a lightweight nudge inside Claude Code hooks.
set -u
file="${TOOL_INPUT_file_path:-}"
[ -z "$file" ] && exit 0
case "$file" in
  *docs/superpowers/specs/*.md)
    if [ -f "$file" ] && ! head -5 "$file" | grep -q '^---$'; then
      echo "⚠ Spec missing YAML frontmatter. Add title/audience/category/status/related." >&2
    fi
    ;;
esac
exit 0
