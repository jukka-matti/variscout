#!/usr/bin/env bash
# Pre-edit advisory: warn when editing a spec without YAML frontmatter.
# Non-blocking; intended as a lightweight nudge inside Claude Code hooks.
set -u
file="${TOOL_INPUT_file_path:-}"
[ -z "$file" ] && exit 0
case "$file" in
  *docs/superpowers/specs/*.md)
    if [ -f "$file" ]; then
      if ! head -5 "$file" | grep -q '^---$'; then
        echo "⚠ Spec missing YAML frontmatter. Add title/status at minimum; see scripts/docs-frontmatter-schema.mjs for the full enum." >&2
      elif grep -qE '^status:\s*[A-Z]' "$file"; then
        echo "⚠ Spec status should be lowercase — see scripts/docs-frontmatter-schema.mjs." >&2
      fi
    fi
    ;;
esac
exit 0
