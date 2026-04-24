#!/usr/bin/env bash
# check-codex-ruflo.sh — verify Codex-side Ruflo setup for this repo.
#
# Usage:
#   bash scripts/check-codex-ruflo.sh
#   pnpm codex:ruflo-check

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

RUFLO_VERSION="3.5.42"
ADD_COMMAND="codex mcp add ruflo -- npx ruflo@${RUFLO_VERSION} mcp start"

green()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()    { printf '\033[0;31m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }

run_with_timeout() {
  local seconds="$1"
  shift
  perl -e 'alarm shift @ARGV; exec @ARGV' "$seconds" "$@"
}

echo "=== codex-ruflo-check ==="
echo "Repo:   $ROOT"
echo "Client: Codex CLI"

if ! command -v codex >/dev/null 2>&1; then
  red "✗ codex CLI is not installed or not on PATH."
  exit 1
fi

echo ""
echo "── MCP registration ──"

MCP_OUTPUT="$(codex mcp get ruflo 2>&1)"
MCP_STATUS=$?

if [ "$MCP_STATUS" -ne 0 ]; then
  red "✗ Ruflo is not registered for Codex on this machine."
  echo ""
  yellow "Fix:"
  echo "  $ADD_COMMAND"
  exit 1
fi

printf '%s\n' "$MCP_OUTPUT"

if printf '%s\n' "$MCP_OUTPUT" | grep -Eq 'enabled:[[:space:]]+false'; then
  red "✗ Ruflo is configured but disabled."
  echo ""
  yellow "Expected launch command:"
  echo "  $ADD_COMMAND"
  exit 1
fi

if ! printf '%s\n' "$MCP_OUTPUT" | grep -Eq "ruflo@${RUFLO_VERSION}"; then
  yellow "! Registered Ruflo version differs from the repo-pinned ruflo@${RUFLO_VERSION}."
fi

echo ""
echo "── Ruflo CLI health ──"

DAEMON_OUTPUT="$(run_with_timeout 10 npx "ruflo@${RUFLO_VERSION}" daemon status 2>&1)"
DAEMON_STATUS=$?

if [ "$DAEMON_STATUS" -eq 0 ]; then
  printf '%s\n' "$DAEMON_OUTPUT"
  green "✓ Codex can see Ruflo, and the Ruflo CLI responded."
  exit 0
fi

if [ "$DAEMON_STATUS" -eq 142 ]; then
  yellow "! Codex registration is present, but Ruflo CLI health check timed out after 10s."
  echo "  This can still be usable through MCP."
  exit 0
fi

yellow "! Codex registration is present, but Ruflo CLI health check did not complete."
echo "  This can still be usable through MCP."
echo ""
echo "Ruflo CLI output:"
printf '%s\n' "$DAEMON_OUTPUT"
exit 0
