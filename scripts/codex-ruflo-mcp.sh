#!/usr/bin/env bash
# Start the repo-scoped Ruflo MCP server for Codex.
#
# This script intentionally lives in the repo so Codex's MCP registration can
# point at VariScout instead of an unbounded global Ruflo process.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUFLO_VERSION="3.7.0-alpha.38"

export RUFLO_HOME="${RUFLO_HOME:-$ROOT/.ruflo}"
export RUFLO_CONFIG="${RUFLO_CONFIG:-$ROOT/.ruflo/config.yaml}"
export RUFLO_DATA_DIR="${RUFLO_DATA_DIR:-$ROOT/.ruflo/data}"
export AGENTDB_PATH="${AGENTDB_PATH:-$ROOT/.ruflo/data/agentdb.rvf}"
export RUVECTOR_DB="${RUVECTOR_DB:-$ROOT/ruvector.db}"

mkdir -p "$RUFLO_HOME" "$RUFLO_DATA_DIR"

exec npx "ruflo@${RUFLO_VERSION}" mcp start
