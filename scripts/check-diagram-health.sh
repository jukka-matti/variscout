#!/usr/bin/env bash
# Diagram Health Check
# Verifies that Mermaid diagrams in docs/ stay in sync with code.
# Run: pnpm docs:check  (or: bash scripts/check-diagram-health.sh)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
green() { printf '\033[0;32m%s\033[0m\n' "$1"; }

# Extract number from pattern like '@variscout/ui (72 components)'
extract_diagram_count() {
  local pkg="$1"
  grep -o "${pkg} ([0-9]*" "$COMPONENT_MAP" | head -1 | grep -o '[0-9]*'
}

# ---------------------------------------------------------------------------
# 1. Check export counts vs component-map.md
# ---------------------------------------------------------------------------

COMPONENT_MAP="$ROOT/docs/05-technical/architecture/component-map.md"

echo "=== Export Count Checks ==="

# UI components
UI_INDEX="$ROOT/packages/ui/src/index.ts"
UI_COUNT=$(grep -cE '^\s*export\s+' "$UI_INDEX" 2>/dev/null || echo 0)
MAP_UI_COUNT=$(extract_diagram_count '@variscout/ui')
if [ -n "$MAP_UI_COUNT" ] && (( UI_COUNT < MAP_UI_COUNT - 10 )); then
  red "DRIFT: @variscout/ui — $UI_COUNT exports in code, $MAP_UI_COUNT claimed in component-map.md"
  ERRORS=$((ERRORS + 1))
else
  green "OK: @variscout/ui — $UI_COUNT exports in code, $MAP_UI_COUNT in diagram"
fi

# Hooks
HOOKS_INDEX="$ROOT/packages/hooks/src/index.ts"
HOOKS_COUNT=$(grep -cE 'use[A-Z]' "$HOOKS_INDEX" 2>/dev/null || echo 0)
MAP_HOOKS_COUNT=$(extract_diagram_count '@variscout/hooks')
if [ -n "$MAP_HOOKS_COUNT" ] && (( HOOKS_COUNT < MAP_HOOKS_COUNT - 5 )); then
  red "DRIFT: @variscout/hooks — $HOOKS_COUNT hook exports in code, $MAP_HOOKS_COUNT claimed in component-map.md"
  ERRORS=$((ERRORS + 1))
else
  green "OK: @variscout/hooks — $HOOKS_COUNT hook exports, $MAP_HOOKS_COUNT in diagram"
fi

# Charts
CHARTS_INDEX="$ROOT/packages/charts/src/index.ts"
CHARTS_COUNT=$(grep -cE '^\s*export\s+.*(Chart|Boxplot|Pareto|IChart|Capability|Probability|Performance|Scatter|Legend|Signature|SourceBar|StatsTable)' "$CHARTS_INDEX" 2>/dev/null || echo 0)
MAP_CHARTS_COUNT=$(extract_diagram_count '@variscout/charts')
if [ -n "$MAP_CHARTS_COUNT" ] && (( CHARTS_COUNT < MAP_CHARTS_COUNT - 3 )); then
  red "DRIFT: @variscout/charts — $CHARTS_COUNT chart exports in code, $MAP_CHARTS_COUNT claimed in component-map.md"
  ERRORS=$((ERRORS + 1))
else
  green "OK: @variscout/charts — $CHARTS_COUNT chart exports, $MAP_CHARTS_COUNT in diagram"
fi

echo ""
echo "=== Type Value Checks ==="

# ---------------------------------------------------------------------------
# 2. Check that type values appear in diagrams
# ---------------------------------------------------------------------------

LIFECYCLE_MAP="$ROOT/docs/03-features/workflows/investigation-lifecycle-map.md"
JOURNEY_MAP="$ROOT/docs/03-features/workflows/analysis-journey-map.md"
FINDINGS_TS="$ROOT/packages/core/src/findings.ts"

# FindingStatus values → investigation-lifecycle-map.md
for status in observed investigating analyzed improving resolved; do
  if ! grep -q "$status" "$LIFECYCLE_MAP" 2>/dev/null; then
    red "DRIFT: FindingStatus '$status' not found in investigation-lifecycle-map.md"
    ERRORS=$((ERRORS + 1))
  else
    green "OK: FindingStatus '$status' in lifecycle map"
  fi
done

# InvestigationPhase values → investigation-lifecycle-map.md
for phase in initial diverging validating converging improving; do
  if ! grep -qi "$phase" "$LIFECYCLE_MAP" 2>/dev/null; then
    red "DRIFT: InvestigationPhase '$phase' not found in investigation-lifecycle-map.md"
    ERRORS=$((ERRORS + 1))
  else
    green "OK: InvestigationPhase '$phase' in lifecycle map"
  fi
done

# JourneyPhase values → analysis-journey-map.md
for phase in frame scout investigate improve; do
  if ! grep -qi "$phase" "$JOURNEY_MAP" 2>/dev/null; then
    red "DRIFT: JourneyPhase '$phase' not found in analysis-journey-map.md"
    ERRORS=$((ERRORS + 1))
  else
    green "OK: JourneyPhase '$phase' in journey map"
  fi
done

# QuestionStatus values → investigation-lifecycle-map.md
# (Hypothesis was renamed to Question per ADR-053; enum lives in packages/core/src/findings/types.ts)
for status in open investigating answered ruled-out; do
  if ! grep -qi "\`$status\`" "$LIFECYCLE_MAP" 2>/dev/null; then
    red "DRIFT: QuestionStatus '$status' not documented in investigation-lifecycle-map.md"
    ERRORS=$((ERRORS + 1))
  else
    green "OK: QuestionStatus '$status' in lifecycle map"
  fi
done

echo ""
echo "=== Stale Reference Checks ==="

# ---------------------------------------------------------------------------
# 3. Check for stale LikeC4 references
# ---------------------------------------------------------------------------

STALE=$(grep -rlE 'likec4|\.c4[^a-z]|docs:c4' "$ROOT/docs/" "$ROOT/CLAUDE.md" "$ROOT/package.json" 2>/dev/null || true)
if [ -n "$STALE" ]; then
  red "DRIFT: Stale LikeC4 references found in:"
  echo "$STALE"
  ERRORS=$((ERRORS + 1))
else
  green "OK: No stale LikeC4 references"
fi

# ---------------------------------------------------------------------------
# 4. Check for orphaned docs (files not linked from any other .md)
# ---------------------------------------------------------------------------

echo ""
echo "=== Orphaned File Checks ==="

ORPHAN_COUNT=0
while IFS= read -r file; do
  basename=$(basename "$file")
  # Skip index files, archive, and known standalone files
  [[ "$basename" == "index.md" ]] && continue
  [[ "$file" == *"/archive/"* ]] && continue
  [[ "$file" == *"/node_modules/"* ]] && continue

  # Get relative path from docs/
  relpath="${file#$ROOT/docs/}"

  # Check if any other .md file references this file (by filename or relative path)
  refs=$(grep -rl "$basename\|$relpath" "$ROOT/docs/" "$ROOT/CLAUDE.md" "$ROOT/.claude/rules/" 2>/dev/null | grep -v "$file" | head -1 || true)
  if [ -z "$refs" ]; then
    ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
    if (( ORPHAN_COUNT <= 10 )); then
      red "ORPHAN: $relpath — not referenced from any other doc"
    fi
  fi
done < <(find "$ROOT/docs" -name "*.md" -not -path "*/node_modules/*" -not -path "*/archive/*" 2>/dev/null)

if (( ORPHAN_COUNT > 0 )); then
  red "Found $ORPHAN_COUNT orphaned file(s) in docs/"
  ERRORS=$((ERRORS + 1))
else
  green "OK: No orphaned files in docs/"
fi

# ---------------------------------------------------------------------------
# 5. Check for broken cross-references
# ---------------------------------------------------------------------------

echo ""
echo "=== Broken Cross-Reference Checks ==="

BROKEN_COUNT=0
while IFS= read -r file; do
  [[ "$file" == *"/archive/"* ]] && continue
  [[ "$file" == *"/node_modules/"* ]] && continue
  dir=$(dirname "$file")

  # Extract markdown links to .md files
  while IFS= read -r link; do
    # Skip external URLs, anchors-only, and empty
    [[ -z "$link" ]] && continue
    [[ "$link" == http* ]] && continue
    [[ "$link" == "#"* ]] && continue

    # Strip anchor
    target="${link%%#*}"
    [[ -z "$target" ]] && continue

    # Resolve relative path
    resolved=$(cd "$dir" && realpath -q "$target" 2>/dev/null || echo "")
    if [ -z "$resolved" ] || [ ! -f "$resolved" ]; then
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      if (( BROKEN_COUNT <= 10 )); then
        relpath="${file#$ROOT/}"
        red "BROKEN: $relpath → $link"
      fi
    fi
  done < <(grep -oE '\]\([^)]+\.md[^)]*\)' "$file" 2>/dev/null | sed 's/\](//' | sed 's/)//' || true)
done < <(find "$ROOT/docs" -name "*.md" -not -path "*/node_modules/*" 2>/dev/null)

if (( BROKEN_COUNT > 0 )); then
  red "Found $BROKEN_COUNT broken cross-reference(s)"
  ERRORS=$((ERRORS + 1))
else
  green "OK: No broken cross-references"
fi

# ---------------------------------------------------------------------------
# 6. Check for missing frontmatter in section index files
# ---------------------------------------------------------------------------

echo ""
echo "=== Frontmatter Checks ==="

MISSING_FM=0
while IFS= read -r file; do
  [[ "$file" == *"/archive/"* ]] && continue
  if ! head -1 "$file" | grep -q '^---$'; then
    MISSING_FM=$((MISSING_FM + 1))
    if (( MISSING_FM <= 5 )); then
      relpath="${file#$ROOT/}"
      red "NO FRONTMATTER: $relpath"
    fi
  fi
done < <(find "$ROOT/docs" -name "index.md" -not -path "*/node_modules/*" -not -path "*/archive/*" 2>/dev/null)

if (( MISSING_FM > 0 )); then
  red "Found $MISSING_FM index file(s) without frontmatter"
  ERRORS=$((ERRORS + 1))
else
  green "OK: All index files have frontmatter"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
if (( ERRORS > 0 )); then
  red "=== $ERRORS issue(s) found ==="
  exit 1
else
  green "=== All checks passed ==="
  exit 0
fi
