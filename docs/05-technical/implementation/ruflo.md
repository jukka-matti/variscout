---
title: 'Ruflo Development Tooling'
audience: [developer]
category: implementation
status: stable
---

# Ruflo Development Tooling

## What It Is

ruflo is an MCP-integrated AI development tooling layer for VariScout. It provides semantic codebase search, persistent cross-session memory, hooks intelligence (pattern learning), neural learning (SONA), automated security scanning, and background workers. It is **not** a runtime dependency -- it only runs during development sessions.

**Version**: Expected `ruflo@3.5.80`, pinned in `scripts/check-codex-ruflo.sh` and mirrored by Claude hook automation in `.claude/settings.json`. Local `.mcp.json` and Codex MCP registration should match it, but they are verified rather than trusted. Update monthly.

## Quick Commands

```bash
# System status
npx ruflo@3.5.80 daemon status
npx ruflo@3.5.80 hooks metrics              # Hook intelligence stats

# Semantic search (local AgentDB; check current counts with memory stats)
npx ruflo@3.5.80 memory search --query "Cpk calculation"
npx ruflo@3.5.80 memory search --query "Azure authentication"
npx ruflo@3.5.80 memory search --query "which persona needs admin"

# Memory operations
npx ruflo@3.5.80 memory stats
npx ruflo@3.5.80 memory list --namespace domain
npx ruflo@3.5.80 memory store -k "key" --namespace ns --value "data"

# Security scanning
npx ruflo@3.5.80 security scan --depth full  # OWASP Top 10
npx ruflo@3.5.80 security cve --check         # CVE database

# Daemon control
npx ruflo@3.5.80 daemon start
npx ruflo@3.5.80 daemon stop

# Reindex codebase (run after major changes)
npx ruflo@3.5.80 hooks pretrain

# Neural / pattern learning
npx ruflo@3.5.80 neural status
```

## Architecture

```
Claude Code or Codex ──MCP──▶ ruflo MCP Server (npx, port 3000)
                                  │
                                  ├── Memory (sql.js + HNSW vector index)
                                  ├── Embeddings (all-MiniLM-L6-v2, 384-dim)
                                  ├── Hooks (Claude-specific local automation)
                                  └── Daemon (background workers)
```

### Config Files

| File                         | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `scripts/check-codex-ruflo.sh` | Tracked Codex version pin, health check, repair output |
| `.mcp.json`                  | Local MCP server definition (gitignored)               |
| `.ruflo/config.yaml`         | Local runtime config (topology, memory backend, workers) |
| `.ruflo/daemon-state.json`   | Local worker state and schedules                       |
| `.claude/settings.json`      | Claude hooks, statusline, permissions, attribution     |
| `AGENTS.md`                  | Codex entrypoint for repo workflow                     |

### Memory Namespaces

Ruflo memory is local and changes over time. Use `mcp__ruflo__memory_stats` for current counts. On 2026-04-25, the Codex MCP baseline in this repo reported hundreds of entries with 100% embedding coverage across these namespaces: `architecture`, `domain`, `conventions`, `testing`, `decisions`, `variscout`, `anti-patterns`, `state`, `components`, `features`, `stats`, `pattern`, `documentation`, `project_exploration`, and `ui`.

### Memory + MEMORY.md Complementarity

Both systems are used and serve different purposes:

| Feature           | Agent docs + MEMORY.md               | Ruflo AgentDB                                 |
| ----------------- | ------------------------------------ | --------------------------------------------- |
| Always in context | Yes (`AGENTS.md` or `CLAUDE.md`)     | No (explicit retrieval)                       |
| Capacity          | Small wrapper docs plus local memory | Local AgentDB entries (hundreds possible)     |
| Search            | Scanned by AI during context         | Semantic vector search (HNSW)                 |
| Best for          | High-level project state, routing    | Detailed domain knowledge, semantic discovery |

Use MEMORY.md for "what should I always know." Use ruflo memory for "find me something specific."

### Codex Operational Baseline

The expected Codex health path is:

1. `pnpm codex:ruflo-check` verifies registration, version, and CLI smoke probes.
2. `mcp__ruflo__mcp_status` confirms an MCP server is running.
3. `mcp__ruflo__memory_stats` confirms local memory is initialized.
4. `mcp__ruflo__memory_search` returns domain or architecture context. If it is not initially visible in Codex, search the tool registry for Ruflo memory tools.
5. `mcp__ruflo__hooks_worker_list` confirms available worker triggers.
6. `mcp__ruflo__analyze_diff` is useful when available; if it returns a runtime error, fall back to Git diff review and `bash scripts/pr-ready-check.sh`.

After changing Codex MCP registration, restart the Codex session before judging MCP runtime behavior. The current session may keep using the already-started MCP server process.

### Background Workers

| Worker        | Interval | Priority | Purpose                                    |
| ------------- | -------- | -------- | ------------------------------------------ |
| `audit`       | 10min    | critical | CVE tracking, OWASP on auth/storage        |
| `testgaps`    | 20min    | normal   | Coverage gaps across 3,572+ tests          |
| `map`         | 15min    | normal   | Monorepo structure changes (9 workspaces)  |
| `optimize`    | 15min    | high     | Chart rendering, large dataset performance |
| `consolidate` | 30min    | low      | Memory dedup and cleanup                   |
| `deepdive`    | 30min    | normal   | Deep analysis of recently changed files    |
| `refactor`    | 30min    | normal   | Code quality suggestions across packages   |

5 additional workers (`predict`, `preload`, `ultralearn`, `document`, `benchmark`) are disabled by default but available for manual dispatch via `mcp__ruflo__hooks_worker-dispatch`.

Workers are resource-throttled: max 2 concurrent, CPU load < 2, free memory > 20%.

### Hooks Intelligence

Hooks automatically learn from development patterns:

- **Pattern learning**: Tracks which files are edited together, command sequences, success/failure rates
- **Routing**: Classifies prompts and routes to appropriate agent types (87% accuracy, 42 routes)
- **Metrics**: `npx ruflo@3.5.80 hooks metrics` shows 24h dashboard

As of Mar 2026: 128 commands tracked, 15 patterns at 85% confidence, 94% success rate.

Hook capture is strongest in Claude because `.claude/settings.json` is wired there. Codex still benefits from shared memory, workers, diff analysis, and CLI tooling through the same ruflo backend.

### Neural Learning (SONA)

SONA (Self-Optimizing Neural Architecture) provides deeper pattern recognition:

- Q-learning + neural reinforcement from task execution
- Mixture of Experts (8 networks) for routing decisions
- Elastic Weight Consolidation prevents forgetting older patterns
- Bootstrapped via `npx ruflo@3.5.80 hooks pretrain`

Neural learning accumulates passively — runs automatically when daemon is active.

## Troubleshooting

### Stale daemon PID

```bash
rm .ruflo/daemon.pid
npx ruflo@3.5.80 daemon start
```

### Worker stuck in "running" state

Edit `.ruflo/daemon-state.json` and set `"isRunning": false` for the stuck worker, then restart the daemon.

### Memory empty after session

```bash
npx ruflo@3.5.80 memory init --force
npx ruflo@3.5.80 hooks pretrain
```

Then re-seed memory entries (see seed commands in ADR-011).

### Audit worker scanning .venv

Ensure `.venv/` is in `.gitignore` and `workers.excludePaths` in `.ruflo/config.yaml` includes `.venv/**`.

## What NOT To Do

- **Don't add ruflo to package.json** -- It's dev tooling only, runs via npx
- **Don't treat local `.mcp.json` as authoritative** -- Codex registration is checked with `pnpm codex:ruflo-check`
- **Don't commit .ruflo/ data** -- Already gitignored; contains local state
- **Don't rely on daemon for CI/CD** -- Workers are for local dev intelligence only
- **Don't store secrets in memory** -- Memory DB is unencrypted local SQLite

## See Also

- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md)
- [Security Scanning](security-scanning.md)
- [Codex + Ruflo Workflow](codex-ruflo-workflow.md)
