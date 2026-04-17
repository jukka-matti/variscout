#!/usr/bin/env bash
# check-ssot.sh — detect section duplication across CLAUDE.md files.
# Warn mode: prints duplicates but exits 0. Upgrade to fail mode in Phase 4.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Collect all CLAUDE.md files (root + packages + apps, exclude .bak)
FILES=$(find "$ROOT" -maxdepth 4 -name 'CLAUDE.md' -not -path '*/node_modules/*' -not -name 'CLAUDE.md.bak')

# For each file, extract (file, section-heading, fingerprint) tuples
# Fingerprint = first 500 chars of section body, lowercased, whitespace-collapsed
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

for f in $FILES; do
  awk -v file="$f" '
    /^## / {
      if (heading) print file "\t" heading "\t" tolower(substr(body, 1, 500))
      heading = $0; body = ""; next
    }
    heading { body = body " " $0 }
    END {
      if (heading) print file "\t" heading "\t" tolower(substr(body, 1, 500))
    }
  ' "$f" >> "$TMP" || true
done

# Find fingerprints appearing in >1 file (skip empty fingerprints)
DUPES=$(awk -F'\t' '
  $3 != "" && length($3) >= 50 {
    count[$3]++
    lines[$3] = lines[$3] "\n  " $1 ": " $2
  }
  END {
    for (k in count) if (count[k] > 1) print lines[k] "\n---"
  }
' "$TMP")

if [ -n "$DUPES" ]; then
  echo "⚠ SSOT check: duplicate CLAUDE.md sections detected:" >&2
  echo "$DUPES" >&2
  echo "" >&2
  echo "Each fact should live in exactly one CLAUDE.md. Move shared content to the owner per spec Layer 1-5 ownership table." >&2
  # Warn mode: exit 0. Upgrade to exit 1 in Phase 4.
  exit 0
fi

echo "✓ SSOT check: no duplicate CLAUDE.md sections."
