# ADR-011: AI Development Tooling (ruflo)

**Status:** Accepted
**Date:** 2026-02-18
**Deciders:** Product team

## Context

VariScout is a 5-package TypeScript monorepo with 1,475 unit tests and 19 Playwright E2E specs. Development uses Claude Code as the primary AI coding assistant.

Recurring friction points:

1. **Cross-session context loss** -- Each Claude Code session starts without knowledge of previous decisions, file locations, or architectural constraints. The same questions about tier system, removed features, and import rules get re-answered.
2. **Codebase navigation overhead** -- Finding the right file in a monorepo with 5 packages and 3 apps requires multiple searches per task.
3. **Security scanning** -- OWASP audits and CVE checks were manual, inconsistent, and easy to forget before releases.

## Decision

Use ruflo (formerly claude-flow) as an MCP-integrated development tooling layer. It runs as a local MCP server that Claude Code connects to on session start, providing:

1. **Vector-indexed codebase search** -- HNSW embeddings (all-MiniLM-L6-v2, 384-dim) for semantic file search. "Find Cpk calculation" returns `stats.ts` without needing exact grep patterns.
2. **Persistent cross-session memory** -- Namespaced key-value store (architecture, conventions, decisions, testing) with semantic search. Survives session restarts.
3. **Automated security scanning** -- OWASP Top 10 audits and CVE checks via CLI commands.
4. **Background daemon workers** -- Periodic codebase mapping, security audits, memory consolidation, and test gap analysis.

### Key choices

1. **Dev tooling only** -- ruflo is never a runtime dependency. It does not appear in any `package.json`. It runs via `npx` and its data files (`.ruflo/`, `.swarm/`) are gitignored.

2. **Hybrid memory backend** -- sql.js for structured storage + HNSW indexing for semantic vector search. 150x-12,500x faster than linear scan for similarity queries.

3. **5 background workers** -- `map` (codebase structure), `audit` (security), `optimize` (performance hints), `consolidate` (memory dedup), `testgaps` (coverage analysis). Workers are staggered and resource-throttled (max 2 concurrent, CPU/memory guards).

4. **autoStart on session open** -- MCP server starts automatically when Claude Code opens via `autoStart: true` in `.mcp.json`. SessionStart hook starts the daemon.

5. **Swarm orchestration available but secondary** -- Multi-agent swarm capabilities exist for large refactors but are not the primary workflow. Most VariScout tasks are sequential monorepo changes.

## Implementation

- MCP server config: `.mcp.json` (autoStart: true)
- Runtime config: `.ruflo/config.yaml`
- Daemon state: `.ruflo/daemon-state.json`
- Memory DB: `.swarm/memory.db`
- Hooks: `.claude/settings.json` (PreToolUse, PostToolUse, SessionStart, UserPromptSubmit)
- Worker exclusions: `.venv/**`, `node_modules/**`, `dist/**`, `site/**`, `*.min.js`, `*.min.css`

## Consequences

### Positive

- Semantic codebase search eliminates multi-step grep workflows
- Persistent memory reduces repeated context-building across sessions
- Automated security audits catch CVEs before releases
- Background workers maintain codebase intelligence passively

### Negative

- Additional dev dependency (npx, ~5s startup on first session)
- Daemon uses background resources (mitigated by CPU/memory guards)
- Learning curve for CLI commands and memory namespaces

### Neutral

- Zero impact on application code, build pipeline, or deployment
- All data files are gitignored -- no repo bloat
- Does not replace manual testing or code review

## See Also

- [ruflo Technical Reference](../05-technical/implementation/ruflo.md)
- [Security Scanning](../05-technical/implementation/security-scanning.md)
- [ADR-007: Azure Marketplace Distribution](adr-007-azure-marketplace-distribution.md)
- [ADR-013: Architecture Evaluation — DDD and Swarms](adr-013-architecture-evaluation-ddd-swarms.md)
