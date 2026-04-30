#!/usr/bin/env bash
# check-level-boundaries.sh — enforce ADR-074 boundary policy for the
# multi-level SCOUT design family. Verifies that level-spanning surfaces
# do not reimplement each other's primary views.
#
# Each check pairs a forbidden symbol pattern with the directory in which
# that symbol must NOT appear. If the directory is absent, the boundary is
# preserved by structural absence and the check is logged but does not fail.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

FAILED=0

check() {
  local pattern="$1"
  local target="$2"
  local message="$3"
  if [ -d "$target" ]; then
    # grep -rE: portable POSIX-ish recursive ERE search. -q exits 0 on match.
    if grep -rEq "$pattern" "$target" 2>/dev/null; then
      echo "  ✗ $message" >&2
      echo "    pattern: $pattern" >&2
      echo "    in:      $target" >&2
      FAILED=$((FAILED + 1))
    else
      echo "  ✓ $message"
    fi
  else
    echo "  · $target not yet present (boundary preserved by structural absence)"
  fi
}

echo "=== ADR-074 boundary checks ==="
check "outcomeStats|outcomeBoxplot|outcomeIChart" \
  "packages/ui/src/components/InvestigationWall" \
  "Investigation Wall does not reimplement L1 chart rendering"
check "stratifyByFactor|factorEdge|factorRelationship" \
  "packages/ui/src/components/DashboardBase" \
  "SCOUT does not reimplement Evidence Map's factor-network rendering"
check "hypothesisCanvas|suspectedCauseHub|gateNode" \
  "packages/ui/src/components/Frame" \
  "FRAME does not embed hypothesis canvas surfaces"
check "LayeredProcessView|OperationsBand" \
  "packages/ui/src/components/EvidenceMap" \
  "Evidence Map does not reimplement L2 flow rendering"

if [ "$FAILED" -gt 0 ]; then
  echo "" >&2
  echo "✗ ADR-074 boundary violations: $FAILED" >&2
  echo "See docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md" >&2
  exit 1
fi
echo "✓ ADR-074 boundaries clean"
