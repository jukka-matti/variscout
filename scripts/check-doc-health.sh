#!/usr/bin/env bash
# Documentation Health Check
# Verifies that documentation stays in sync with code exports and file paths.
# Run: bash scripts/check-doc-health.sh  (included in pnpm docs:check)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WARNINGS=0

green()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }
warn()   { yellow "  ⚠ $1"; WARNINGS=$((WARNINGS + 1)); }

echo "=== Documentation Health Check ==="
echo ""

# ---------------------------------------------------------------------------
# 1. Hook count in CLAUDE.md vs actual exports
# ---------------------------------------------------------------------------
echo "--- Hook count ---"
HOOKS_INDEX="$ROOT/packages/hooks/src/index.ts"
# Count unique use* function names (exclude type-only exports like UseXxxOptions/UseXxxReturn)
ACTUAL_HOOKS=$(grep -oE 'use[A-Z][a-zA-Z]+' "$HOOKS_INDEX" | grep -v '^Use' | sort -u | wc -l | tr -d ' ')
CLAIMED_HOOKS=$({ grep -oE '\| [0-9]+\+? hooks ' "$ROOT/CLAUDE.md" || echo ''; } | grep -oE '[0-9]+' | head -1 || echo 0)
CLAIMED_HOOKS=${CLAIMED_HOOKS:-0}

echo "  Actual hook exports: $ACTUAL_HOOKS"
echo "  CLAUDE.md claims: ${CLAIMED_HOOKS}+"
if [ "$CLAIMED_HOOKS" -gt "$ACTUAL_HOOKS" ]; then
  warn "CLAUDE.md overstates hook count ($CLAIMED_HOOKS > $ACTUAL_HOOKS)"
elif [ $((ACTUAL_HOOKS - CLAIMED_HOOKS)) -gt 5 ]; then
  warn "CLAUDE.md understates hook count by $((ACTUAL_HOOKS - CLAIMED_HOOKS)) (claimed ${CLAIMED_HOOKS}+, actual $ACTUAL_HOOKS)"
else
  green "  ✓ Hook count within tolerance"
fi

# ---------------------------------------------------------------------------
# 2. Component count in CLAUDE.md vs actual exports
# ---------------------------------------------------------------------------
echo ""
echo "--- Component count ---"
UI_INDEX="$ROOT/packages/ui/src/index.ts"
# Count unique module sources (each from './Component' is one module)
ACTUAL_COMPONENTS=$(grep -oE "from '\\./[^']+'" "$UI_INDEX" | sort -u | wc -l | tr -d ' ')
CLAIMED_COMPONENTS=$({ grep -oE '\| [0-9]+\+? component modules' "$ROOT/CLAUDE.md" || echo ''; } | grep -oE '[0-9]+' | head -1 || echo 0)
CLAIMED_COMPONENTS=${CLAIMED_COMPONENTS:-0}

echo "  Actual UI exports: $ACTUAL_COMPONENTS"
echo "  CLAUDE.md claims: ${CLAIMED_COMPONENTS}+"
if [ "$CLAIMED_COMPONENTS" -gt "$ACTUAL_COMPONENTS" ]; then
  warn "CLAUDE.md overstates component count ($CLAIMED_COMPONENTS > $ACTUAL_COMPONENTS)"
elif [ $((ACTUAL_COMPONENTS - CLAIMED_COMPONENTS)) -gt 10 ]; then
  warn "CLAUDE.md understates component count by $((ACTUAL_COMPONENTS - CLAIMED_COMPONENTS)) (claimed ${CLAIMED_COMPONENTS}+, actual $ACTUAL_COMPONENTS)"
else
  green "  ✓ Component count within tolerance"
fi

# ---------------------------------------------------------------------------
# 3. Sub-path export count vs package.json
# ---------------------------------------------------------------------------
echo ""
echo "--- Sub-path exports ---"
CORE_PKG="$ROOT/packages/core/package.json"
ACTUAL_SUBPATHS=$(grep -cE '"\.\/' "$CORE_PKG" 2>/dev/null || echo 0)
# Divide by 2 since each sub-path has import + types entries
ACTUAL_SUBPATHS=$((ACTUAL_SUBPATHS / 2))
echo "  Actual sub-path exports: $ACTUAL_SUBPATHS"

# ---------------------------------------------------------------------------
# 4. Testing.md hooks vs actual test files
# ---------------------------------------------------------------------------
echo ""
echo "--- Test coverage for listed hooks ---"
TESTING_MD="$ROOT/.claude/skills/writing-tests/SKILL.md"
TESTS_DIR="$ROOT/packages/hooks/src/__tests__"

# Extract hook names from the @variscout/hooks row in testing.md only
HOOKS_ROW=$(grep '@variscout/hooks' "$TESTING_MD" 2>/dev/null || echo "")
LISTED_HOOKS=$({ echo "$HOOKS_ROW" | grep -oE 'use[A-Z][a-zA-Z]+' || true; } | { grep -v '^Use' || true; } | sort -u)
MISSING_TESTS=0

for hook in $LISTED_HOOKS; do
  # Check exact name and common variations (e.g., useAnnotations → useAnnotationMode)
  FOUND=0
  for pattern in "$hook" "${hook%s}" "${hook}s" "${hook%s}Mode" "${hook}Mode"; do
    if [ -f "$TESTS_DIR/${pattern}.test.ts" ] || [ -f "$TESTS_DIR/${pattern}.test.tsx" ]; then
      FOUND=1
      break
    fi
  done
  if [ "$FOUND" -eq 0 ]; then
    warn "Hook $hook listed in testing.md but no test file found"
    MISSING_TESTS=$((MISSING_TESTS + 1))
  fi
done

if [ "$MISSING_TESTS" -eq 0 ]; then
  green "  ✓ All listed hooks have test files"
fi

# ---------------------------------------------------------------------------
# 5. Spot-check CLAUDE.md file paths
# ---------------------------------------------------------------------------
echo ""
echo "--- CLAUDE.md path spot-check ---"

PATHS_TO_CHECK=(
  "docs/03-features/analysis/"
  "packages/core/src/stats/"
  "docs/05-technical/statistics-reference.md"
  "docs/05-technical/architecture/dashboard-layout.md"
  "docs/06-design-system/patterns/css-height-chain.md"
  "docs/08-products/azure/"
  "packages/core/src/parser/"
  "packages/core/src/ai/prompts/coScout/"
  "packages/core/src/ai/actionTools.ts"
  "packages/core/src/analysisStrategy.ts"
  "apps/azure/src/services/localDb.ts"
  "apps/azure/src/lib/appInsights.ts"
  "packages/core/src/glossary/"
  "docs/05-technical/architecture/knowledge-model.md"
  "docs/03-features/workflows/investigation-to-action.md"
  "docs/01-vision/eda-mental-model.md"
  "docs/06-design-system/patterns/navigation.md"
  "apps/azure/src/hooks/useEditorDataFlow.ts"
  "docs/05-technical/implementation/deployment.md"
  "docs/01-vision/constitution.md"
)

MISSING_PATHS=0
for p in "${PATHS_TO_CHECK[@]}"; do
  if [ ! -e "$ROOT/$p" ]; then
    warn "Path referenced in CLAUDE.md not found: $p"
    MISSING_PATHS=$((MISSING_PATHS + 1))
  fi
done

if [ "$MISSING_PATHS" -eq 0 ]; then
  green "  ✓ All ${#PATHS_TO_CHECK[@]} spot-checked paths exist"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Summary ==="
if [ "$WARNINGS" -eq 0 ]; then
  green "✓ Documentation health check passed — no issues found"
  exit 0
else
  yellow "⚠ $WARNINGS warning(s) found — run \`pnpm docs:sync\` to auto-fix count drift, or fix paths manually"
  exit 1
fi
