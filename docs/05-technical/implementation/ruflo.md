---
title: 'Ruflo Development Tooling'
audience: [developer]
category: implementation
status: stable
---

# Ruflo Development Tooling

## What It Is

ruflo is a Codex-only MCP-integrated AI development tooling layer for VariScout. It provides semantic codebase search, persistent cross-session memory, hooks intelligence (pattern learning), neural learning (SONA), automated security scanning, and background workers. It is **not** a runtime dependency -- it only runs during Codex development sessions.

**Version**: Expected `ruflo@3.5.80`, pinned in `scripts/check-codex-ruflo.sh`. Codex MCP registration should match it, but it is verified rather than trusted. Update monthly.

In-session, **MCP is the only path** for ruflo memory, search, store, pretrain, and lifecycle hooks. Claude Code must not use Ruflo through project `.mcp.json`, `.claude/settings.json`, permissions, attribution, or project skills.

## Quick Commands (MCP only)

```
# Semantic search
mcp__ruflo__memory_search({ query: "Cpk calculation", namespace: "architecture", limit: 5 })

# Store / update
mcp__ruflo__memory_store({ namespace: "architecture", key: "key-name", value: "...", upsert: true })

# Reindex after major changes (~200ms)
mcp__ruflo__hooks_pretrain({ path: "<repo-root>", depth: "medium" })

# Worker dispatch
mcp__ruflo__hooks_worker-dispatch({ trigger: "audit", priority: "high" })

# Diff analysis
mcp__ruflo__analyze_diff({ ref: "main..HEAD" })
```

## Architecture

```
Codex ──MCP──▶ ruflo MCP Server (npx)
                                  │
                                  ├── Memory (sql.js + HNSW vector index)
                                  ├── Embeddings (all-MiniLM-L6-v2, 384-dim)
                                  ├── Hooks intelligence
                                  └── Background workers
```

### Config Files

| File                           | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `scripts/check-codex-ruflo.sh` | Tracked Codex version pin, health check, repair output   |
| `.ruflo/config.yaml`           | Local runtime config (topology, memory backend, workers) |
| `.ruflo/daemon-state.json`     | Local worker state and schedules                         |
| `.ruflo/data/`                 | Ignored local AgentDB/Ruflo data path                    |
| `.claude/settings.json`        | Claude-only hooks/statusline; must not reference Ruflo   |
| `AGENTS.md`                    | Codex entrypoint for repo workflow                       |

### Local State Files

Ruflo and AgentDB can create local memory files in more than one place, depending on the CLI/MCP path that touched the repo:

| Path                 | Purpose                                      | Git policy |
| -------------------- | -------------------------------------------- | ---------- |
| `.ruflo/`            | Ruflo config, metrics, logs, and local data  | Ignored    |
| `.swarm/memory.db`   | Current shared memory database               | Ignored    |
| `.claude/memory.db*` | Claude-local memory cache                    | Ignored    |
| `ruvector.db`        | Local RuVector/vector index fallback         | Ignored    |
| `agentdb.rvf*`       | Root-level AgentDB files, if recreated there | Ignored    |

If root-level `agentdb.rvf` or `agentdb.rvf.lock` appears, move it under `.ruflo/data/` after copying a backup there. The root ignore rule is a fallback for tools that recreate those files outside `.ruflo/data/`; do not commit the database files.

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

The expected Codex health path is MCP-first:

1. `pnpm codex:ruflo-check` verifies Codex MCP registration and the expected Ruflo version.
2. `mcp__ruflo__mcp_status` confirms an MCP server is running.
3. `mcp__ruflo__memory_stats` confirms local memory is initialized.
4. `mcp__ruflo__memory_search` returns domain or architecture context. If it is not initially visible in Codex, search the tool registry for Ruflo memory tools.
5. `mcp__ruflo__hooks_worker_list` confirms available worker triggers.
6. `mcp__ruflo__analyze_diff` is useful when available; if it returns a runtime error, fall back to Git diff review and `bash scripts/pr-ready-check.sh`.

`pnpm codex:ruflo-check` now verifies MCP registration only — CLI smoke probes were removed 2026-05-13. If MCP registration looks correct but tools still misbehave, restart the Codex session so the new MCP server process is used.

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
- **Metrics**: `mcp__ruflo__hooks_metrics` shows 24h dashboard

Codex benefits from memory, workers, and diff analysis through the Ruflo MCP backend. Do not wire this into Claude Code.

### Neural Learning (SONA)

SONA (Self-Optimizing Neural Architecture) provides deeper pattern recognition:

- Q-learning + neural reinforcement from task execution
- Mixture of Experts (8 networks) for routing decisions
- Elastic Weight Consolidation prevents forgetting older patterns
- Bootstrapped via `mcp__ruflo__hooks_pretrain({ path: "<repo-root>", depth: "medium" })`

Neural learning accumulates passively — runs automatically when daemon is active.

## Troubleshooting

### Stale daemon PID

Delete `.ruflo/daemon.pid`, then restart the Codex session so Codex reconnects to the MCP server. If MCP registration is wrong, run `pnpm codex:ruflo-check` and follow its repair output.

### Worker stuck in "running" state

Edit `.ruflo/daemon-state.json` and set `"isRunning": false` for the stuck worker, then restart the daemon (new session, as above).

### Memory empty after session

Check MCP memory stats/search first via `mcp__ruflo__memory_stats` / `mcp__ruflo__memory_search`. If the memory DB still appears empty, run `mcp__ruflo__hooks_pretrain({ path: "<repo-root>", depth: "medium" })`. Then re-seed memory entries with `mcp__ruflo__memory_store` / `mcp__ruflo__agentdb_hierarchical-store` if available. Avoid `memory init --force` or other reset operations unless you intentionally want to discard the local memory database.

### Audit worker scanning .venv

Ensure `.venv/` is in `.gitignore` and `workers.excludePaths` in `.ruflo/config.yaml` includes `.venv/**`.

## What NOT To Do

- **Don't add ruflo to package.json** -- It's Codex-only dev tooling and runs through versioned Codex MCP registration
- **Don't add project `.mcp.json` for Ruflo** -- Claude Code loads project MCP files; Codex registration is checked with `pnpm codex:ruflo-check`
- **Don't commit local memory data** -- `.ruflo/`, `.swarm/`, `.claude/memory.db*`, `ruvector.db`, and `agentdb.rvf*` are local state
- **Don't rely on daemon for CI/CD** -- Workers are for local dev intelligence only
- **Don't store secrets in memory** -- Memory DB is unencrypted local SQLite

## See Also

- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md)
- [Security Scanning](security-scanning.md)
- [Codex + Ruflo Workflow](codex-ruflo-workflow.md)
