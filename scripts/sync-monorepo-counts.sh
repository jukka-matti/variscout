#!/usr/bin/env bash
# Sync monorepo component/export counts into docs.
#
# Reads actual export counts from each package index.ts and rewrites the
# matching Mermaid subgraph label in docs/05-technical/architecture/component-map.md.
#
# Idempotent: running twice produces no diff.
# Run: pnpm docs:sync  (or: bash scripts/sync-monorepo-counts.sh)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPONENT_MAP="$ROOT/docs/05-technical/architecture/component-map.md"

red()    { printf '\033[0;31m%s\033[0m\n' "$1"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }

if [ ! -f "$COMPONENT_MAP" ]; then
  red "ERROR: $COMPONENT_MAP not found"
  exit 1
fi

CHANGES=0

# Update a Mermaid subgraph label count in component-map.md.
# Pattern matched: subgraph <id>["@variscout/<pkg> (NN <noun>)"]
# where <noun> is preserved (components, modules, hooks, datasets, etc.)
# Arg 1: package short name (ui, hooks, charts, core, stores, data)
# Arg 2: new numeric count
update_label() {
  local pkg="$1"
  local new_count="$2"

  # Find current label; preserve the noun (components, modules, hooks, etc.)
  # Pattern matches e.g. "@variscout/ui (110+ components)" or "(92 components)"
  local pattern="\"@variscout/${pkg} \\([0-9]+\\+? *[a-zA-Z]+\\)\""
  local current
  current=$(grep -oE "$pattern" "$COMPONENT_MAP" | head -1 || true)

  if [ -z "$current" ]; then
    yellow "SKIP: @variscout/$pkg — no label found in component-map.md"
    return 0
  fi

  # Extract current number and noun (e.g. from "(110+ components)")
  local inner
  inner=$(printf '%s' "$current" | sed -E 's/.*\(([0-9]+\+? *[a-zA-Z]+)\).*/\1/')
  local current_num
  current_num=$(printf '%s' "$inner" | grep -oE '^[0-9]+')
  local noun
  noun=$(printf '%s' "$inner" | sed -E 's/^[0-9]+\+?[[:space:]]+//')

  if [ "$current_num" = "$new_count" ]; then
    green "OK: @variscout/$pkg — $new_count $noun (already in sync)"
    return 0
  fi

  # Build replacement literal: "@variscout/<pkg> (N <noun>)"
  local old_literal="\"@variscout/${pkg} (${current_num}"
  # Preserve suffix (+) if present, but drop it when sync'ing exact counts
  local new_literal="\"@variscout/${pkg} (${new_count} ${noun})\""

  # sed in-place; portable between macOS and GNU via -i ''
  # Match the full quoted string up to and including the closing paren+quote
  local old_full
  old_full=$(printf '%s' "$current")
  local new_full="\"@variscout/${pkg} (${new_count} ${noun})\""

  # Escape forward slashes for sed
  local old_esc new_esc
  old_esc=$(printf '%s' "$old_full" | sed 's|[/\]|\\&|g')
  new_esc=$(printf '%s' "$new_full" | sed 's|[/\]|\\&|g')

  # Use | as delimiter since paths contain /
  sed -i '' "s|${old_esc}|${new_esc}|" "$COMPONENT_MAP"

  yellow "UPDATED: @variscout/$pkg — $current_num → $new_count $noun"
  CHANGES=$((CHANGES + 1))
}

echo "=== Sync monorepo counts → component-map.md ==="
echo ""

# UI: simple export count (matches check-diagram-health.sh line 30)
UI_COUNT=$(grep -cE '^\s*export\s+' "$ROOT/packages/ui/src/index.ts" 2>/dev/null || echo 0)
update_label "ui" "$UI_COUNT"

# Hooks: count use[A-Z] exports only (matches check line 41)
HOOKS_COUNT=$(grep -cE 'use[A-Z]' "$ROOT/packages/hooks/src/index.ts" 2>/dev/null || echo 0)
update_label "hooks" "$HOOKS_COUNT"

# Charts: filtered chart-component exports (matches check line 52)
CHARTS_COUNT=$(grep -cE '^\s*export\s+.*(Chart|Boxplot|Pareto|IChart|Capability|Probability|Performance|Scatter|Legend|Signature|SourceBar|StatsTable)' "$ROOT/packages/charts/src/index.ts" 2>/dev/null || echo 0)
update_label "charts" "$CHARTS_COUNT"

echo ""
if [ "$CHANGES" -eq 0 ]; then
  green "No changes. All counts already in sync."
else
  yellow "Made $CHANGES update(s). Review the diff in $COMPONENT_MAP and commit if correct."
fi
