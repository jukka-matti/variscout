#!/usr/bin/env bash
# Diagram Health Check
# Verifies that Mermaid diagrams in docs/ stay in sync with code.
# Run: pnpm docs:check  (or: bash scripts/check-diagram-health.sh)
# Incremental mode: bash scripts/check-diagram-health.sh --incremental <path> [<path>...]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

# ---------------------------------------------------------------------------
# Incremental mode — parse --incremental <paths> flag
# ---------------------------------------------------------------------------
INCREMENTAL=0
INCREMENTAL_PATHS=""
if [ "${1:-}" = "--incremental" ]; then
  INCREMENTAL=1
  shift
  INCREMENTAL_PATHS="$*"
  echo "check-diagram-health: incremental mode ($(echo "$INCREMENTAL_PATHS" | wc -w | tr -d ' ') staged paths)" >&2
fi

red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
green() { printf '\033[0;32m%s\033[0m\n' "$1"; }

# Extract number from pattern like '@variscout/ui (72 components)'
extract_diagram_count() {
  local pkg="$1"
  grep -o "${pkg} ([0-9]*" "$COMPONENT_MAP" | head -1 | grep -o '[0-9]*'
}

# ---------------------------------------------------------------------------
# Helper: check if any of INCREMENTAL_PATHS matches a pattern
# Returns 0 (true) if matched, 1 if not.
# ---------------------------------------------------------------------------
incremental_has_path() {
  local pattern="$1"
  for p in $INCREMENTAL_PATHS; do
    if echo "$p" | grep -qE "$pattern"; then
      return 0
    fi
  done
  return 1
}

# ---------------------------------------------------------------------------
# 1. Check export counts vs component-map.md
# ---------------------------------------------------------------------------

COMPONENT_MAP="$ROOT/docs/05-technical/architecture/component-map.md"

# In incremental mode, skip export-count section unless a packages/*/src/index.ts is staged.
RUN_EXPORT_COUNTS=1
if (( INCREMENTAL )); then
  if incremental_has_path 'packages/[^/]+/src/index\.ts$'; then
    RUN_EXPORT_COUNTS=1
  else
    RUN_EXPORT_COUNTS=0
  fi
fi

if (( RUN_EXPORT_COUNTS )); then
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
fi

# ---------------------------------------------------------------------------
# 2. Check that type values appear in diagrams
# ---------------------------------------------------------------------------

# In incremental mode, skip type-value section unless one of the relevant
# input files is staged.
TYPE_VALUE_INPUTS='(docs/03-features/workflows/investigation-lifecycle-map\.md|docs/03-features/workflows/analysis-journey-map\.md|packages/core/src/findings\.ts)'
RUN_TYPE_VALUES=1
if (( INCREMENTAL )); then
  if incremental_has_path "$TYPE_VALUE_INPUTS"; then
    RUN_TYPE_VALUES=1
  else
    RUN_TYPE_VALUES=0
  fi
fi

if (( RUN_TYPE_VALUES )); then
  echo "=== Type Value Checks ==="

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
fi

echo "=== Stale Reference Checks ==="

# ---------------------------------------------------------------------------
# 3. Check for stale LikeC4 references
# Always run — cheap full-repo grep over a small target set.
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

# Build a single reference index once for the orphan pass.
# We approximate the OLD `grep -rl "$basename"` behavior by capturing EVERY
# .md substring referenced anywhere in any file under docs/, CLAUDE.md, and
# .claude/skills/ — not just markdown-link targets. Prose mentions count
# (e.g. "see foo.md" inline). That matches what shipped on main pre-PR2 and
# keeps the orphan baseline stable; without it, the rewrite is stricter than
# the original and flags ~12 prose-referenced docs as new orphans.
# The cross-ref pass below uses its own per-file outgoing-link extraction
# and does not consume this index.
INDEX_FILE=$(mktemp)
DUP_BASENAMES_FILE=$(mktemp)
trap 'rm -f "$INDEX_FILE" "$DUP_BASENAMES_FILE"' EXIT
grep -rEoh '[A-Za-z0-9._/@+-]+\.md' "$ROOT/docs" "$ROOT/CLAUDE.md" "$ROOT/.claude/skills" 2>/dev/null \
  | sed -E 's|#.*$||; s|\?.*$||' \
  | sort -u > "$INDEX_FILE"

# Identify basenames that occur in 2+ docs under docs/ (excluding archive +
# node_modules). For these, a bare-basename mention in the index can't tell
# us WHICH sibling is referenced, so the basename fallback is unsafe — we
# require the docs/-relative path to appear in the index instead. Files with
# unique basenames keep the loose fallback (handles bare-basename prose links).
find "$ROOT/docs" -name '*.md' -not -path '*/archive/*' -not -path '*/node_modules/*' 2>/dev/null \
  | xargs -n1 basename \
  | sort \
  | uniq -d > "$DUP_BASENAMES_FILE"

if (( INCREMENTAL )); then
  # Incremental orphan check: only evaluate staged docs paths.
  # Trade-off: we do NOT detect newly-introduced orphans in non-staged files.
  # That's acceptable — full mode on pre-push catches those.
  ORPHAN_COUNT=0
  for staged_path in $INCREMENTAL_PATHS; do
    # Only process paths that look like docs/**/*.md
    echo "$staged_path" | grep -qE '^docs/.*\.md$' || continue

    file="$ROOT/$staged_path"
    [[ ! -f "$file" ]] && continue  # non-existent file — skip cleanly
    [[ "$staged_path" == *"/archive/"* ]] && continue
    [[ "$staged_path" == *"/cards/"* ]] && continue
    [[ "$staged_path" == *"/node_modules/"* ]] && continue

    basename=$(basename "$file")
    [[ "$basename" == "index.md" ]] && continue

    relpath="${file#$ROOT/docs/}"

    if grep -Fxq "$basename" "$DUP_BASENAMES_FILE"; then
      # Duplicate basename — clear ONLY when we can prove the reference points
      # at THIS sibling. Two paths qualify: (a) the full docs/-relative path
      # appears anywhere; (b) a same-directory file links by bare basename
      # (which resolves to us, not a sibling elsewhere).
      file_dir=$(dirname "$file")
      if grep -qF "$relpath" "$INDEX_FILE"; then
        : # disambiguated by full relpath
      elif grep -qF "]($basename" "$file_dir"/*.md 2>/dev/null; then
        : # same-dir bare-basename link unambiguously targets us
      else
        ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
        red "ORPHAN: $relpath — not referenced from any other doc"
      fi
    elif ! grep -qF "$basename" "$INDEX_FILE" && ! grep -qF "$relpath" "$INDEX_FILE"; then
      ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
      red "ORPHAN: $relpath — not referenced from any other doc"
    fi
  done

  if (( ORPHAN_COUNT > 0 )); then
    red "Found $ORPHAN_COUNT orphaned file(s) among staged docs"
    ERRORS=$((ERRORS + 1))
  else
    green "OK: No orphaned files among staged docs"
  fi
else
  # Full mode: iterate all docs
  ORPHAN_COUNT=0
  while IFS= read -r file; do
    basename=$(basename "$file")
    # Skip index files, archive, cards, and known standalone files.
    # Cards (Phase 3 atomic substrate: docs/cards/{decisions,investigations,memory}/)
    # are a queryable hash-map surface, not a tree-shaped navigation graph.
    # They're discovered via `pnpm docs:find / docs:related` (frontmatter
    # `related:` + body `[[wikilinks]]`), not by prose inbound refs.
    [[ "$basename" == "index.md" ]] && continue
    [[ "$file" == *"/archive/"* ]] && continue
    [[ "$file" == *"/cards/"* ]] && continue
    [[ "$file" == *"/node_modules/"* ]] && continue

    # Get relative path from docs/
    relpath="${file#$ROOT/docs/}"

    # Check if any line in the index references this file. For non-unique
    # basenames, a bare-basename mention is ambiguous — clear only when we
    # have either the full relpath OR a same-directory bare-basename link
    # (which unambiguously resolves to this sibling). Unique basenames keep
    # the looser fallback so prose mentions still count.
    if grep -Fxq "$basename" "$DUP_BASENAMES_FILE"; then
      file_dir=$(dirname "$file")
      if grep -qF "$relpath" "$INDEX_FILE"; then
        : # disambiguated by full relpath
      elif grep -qF "]($basename" "$file_dir"/*.md 2>/dev/null; then
        : # same-dir bare-basename link unambiguously targets us
      else
        ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
        if (( ORPHAN_COUNT <= 10 )); then
          red "ORPHAN: $relpath — not referenced from any other doc"
        fi
      fi
    elif ! grep -qF "$basename" "$INDEX_FILE" && ! grep -qF "$relpath" "$INDEX_FILE"; then
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
fi

# ---------------------------------------------------------------------------
# 5. Check for broken cross-references
# ---------------------------------------------------------------------------

echo ""
echo "=== Broken Cross-Reference Checks ==="

# In incremental mode: only check outgoing links from staged docs.
# Trade-off: if a staged doc renames a path that other docs link to, those
# inbound links are now broken but won't be caught here. Full mode on pre-push
# catches inbound breakage. Incremental only guards outgoing links from staged paths.

BROKEN_COUNT=0

if (( INCREMENTAL )); then
  for staged_path in $INCREMENTAL_PATHS; do
    echo "$staged_path" | grep -qE '^docs/.*\.md$' || continue
    file="$ROOT/$staged_path"
    [[ ! -f "$file" ]] && continue  # non-existent — skip cleanly
    [[ "$staged_path" == *"/archive/"* ]] && continue
    [[ "$staged_path" == *"/cards/"* ]] && continue
    [[ "$staged_path" == *"/node_modules/"* ]] && continue

    dir=$(dirname "$file")

    while IFS= read -r link; do
      [[ -z "$link" ]] && continue
      [[ "$link" == http* ]] && continue
      [[ "$link" == "#"* ]] && continue

      target="${link%%#*}"
      [[ -z "$target" ]] && continue

      if [ ! -f "$dir/$target" ]; then
        BROKEN_COUNT=$((BROKEN_COUNT + 1))
        if (( BROKEN_COUNT <= 10 )); then
          red "BROKEN: $staged_path → $link"
        fi
      fi
    done < <(grep -oE '\]\([^)]+\.md[^)]*\)' "$file" 2>/dev/null | sed 's/\](//' | sed 's/)//' || true)
  done
else
  while IFS= read -r file; do
    [[ "$file" == *"/archive/"* ]] && continue
    [[ "$file" == *"/cards/"* ]] && continue
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

      # Resolve relative path (pure shell — avoids per-link realpath subprocess)
      if [ ! -f "$dir/$target" ]; then
        BROKEN_COUNT=$((BROKEN_COUNT + 1))
        if (( BROKEN_COUNT <= 10 )); then
          relpath="${file#$ROOT/}"
          red "BROKEN: $relpath → $link"
        fi
      fi
    done < <(grep -oE '\]\([^)]+\.md[^)]*\)' "$file" 2>/dev/null | sed 's/\](//' | sed 's/)//' || true)
  done < <(find "$ROOT/docs" -name "*.md" -not -path "*/node_modules/*" 2>/dev/null)
fi

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

# In incremental mode: only run on staged paths that match docs/**/index.md
MISSING_FM=0

if (( INCREMENTAL )); then
  for staged_path in $INCREMENTAL_PATHS; do
    echo "$staged_path" | grep -qE '^docs/.*/index\.md$' || continue
    file="$ROOT/$staged_path"
    [[ ! -f "$file" ]] && continue
    [[ "$staged_path" == *"/archive/"* ]] && continue

    if ! head -1 "$file" | grep -q '^---$'; then
      MISSING_FM=$((MISSING_FM + 1))
      red "NO FRONTMATTER: $staged_path"
    fi
  done
else
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
fi

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
