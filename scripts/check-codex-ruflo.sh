#!/usr/bin/env bash
# check-codex-ruflo.sh — verify Codex-side Ruflo MCP registration for this repo.
#
# CLI smoke probes were removed 2026-05-13 — in-session ruflo runs via MCP only.
# This script now only checks that Codex has ruflo registered at the expected version.
#
# Usage:
#   bash scripts/check-codex-ruflo.sh
#   pnpm codex:ruflo-check

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

RUFLO_VERSION="3.5.80"
ADD_COMMAND="codex mcp add ruflo -- npx ruflo@${RUFLO_VERSION} mcp start"
REMOVE_COMMAND="codex mcp remove ruflo"
FAILURES=0
WARNINGS=0

green()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()    { printf '\033[0;31m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }
pass()   { green "✓ $1"; }
fail()   { red "✗ $1"; FAILURES=$((FAILURES + 1)); }
warn()   { yellow "! $1"; WARNINGS=$((WARNINGS + 1)); }

print_repair() {
  yellow "Repair:"
  echo "  $REMOVE_COMMAND"
  echo "  $ADD_COMMAND"
  echo "  # Restart Codex after changing MCP registration so the new server process is used."
}

echo "=== codex-ruflo-check ==="
echo "Repo:   $ROOT"
echo "Client: Codex CLI"
echo "Expect: ruflo@${RUFLO_VERSION}"

if ! command -v codex >/dev/null 2>&1; then
  fail "codex CLI is not installed or not on PATH."
  exit 1
fi

echo ""
echo "── MCP registration ──"

MCP_OUTPUT="$(codex mcp get ruflo 2>&1)"
MCP_STATUS=$?

if [ "$MCP_STATUS" -ne 0 ]; then
  fail "Ruflo is not registered for Codex on this machine."
  echo ""
  yellow "Register:"
  echo "  $ADD_COMMAND"
  exit 1
fi

printf '%s\n' "$MCP_OUTPUT"

if printf '%s\n' "$MCP_OUTPUT" | grep -Eq 'enabled:[[:space:]]+false'; then
  fail "Ruflo is configured but disabled."
  echo ""
  print_repair
  exit 1
fi

if printf '%s\n' "$MCP_OUTPUT" | grep -Fq "args: ruflo@${RUFLO_VERSION} mcp start"; then
  pass "Codex registration uses ruflo@${RUFLO_VERSION}"
else
  fail "Codex registration does not use ruflo@${RUFLO_VERSION}."
  echo ""
  print_repair
fi

echo ""
echo "── Codex MCP smoke checks ──"
echo "Run these from the Codex MCP tool surface when investigating Ruflo behavior:"
echo "  mcp__ruflo__mcp_status"
echo "  mcp__ruflo__memory_stats"
echo "  mcp__ruflo__memory_search(query: \"Cpk calculation stats deterministic engine\", namespace: \"domain\")"
echo "  mcp__ruflo__hooks_worker_list(includeActive: true, status: \"all\")"
echo "  mcp__ruflo__analyze_diff(ref: \"HEAD\")"

echo ""
echo "=== Summary ==="
if [ "$FAILURES" -gt 0 ]; then
  red "✗ codex-ruflo-check failed with $FAILURES blocking issue(s)."
  exit 1
fi

green "✓ Codex Ruflo MCP registration verified."
exit 0
