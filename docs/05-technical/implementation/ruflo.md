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

In-session, **MCP is the default path** for Ruflo memory, search, store, and pretrain. Direct `npx ruflo@3.5.80 ...` CLI commands are kept as a fallback for environments without MCP (Codex without MCP registration, scripts, CI). The CLI can also be degraded by sandbox, npm cache, or PATH permissions, and long-content writes have hung in practice while the MCP server held a connection — see `feedback_ruflo_cli_lock.md` in auto-memory.

This split mirrors ruflo's official guidance: hook commands run via CLI from `.claude/settings.json`; user-facing in-session work goes through `mcp__ruflo__*` tools.

## Quick Commands (in-session — prefer MCP)

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

## CLI Fallback (no-MCP environments)

```bash
# System status
npx ruflo@3.5.80 daemon status
npx ruflo@3.5.80 hooks metrics              # Hook intelligence stats

# Semantic search (CLI fallback)
npx ruflo@3.5.80 memory search --query "Cpk calculation"

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

# Reindex codebase (CLI fallback)
npx ruflo@3.5.80 hooks pretrain

# Neural / pattern learning
npx ruflo@3.5.80 neural status
```

Do NOT dispatch CLI memory writes in parallel from a session shell while the MCP server is running — they contend on the same SQLite store and hang at 0% CPU.

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

| File                           | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `scripts/check-codex-ruflo.sh` | Tracked Codex version pin, health check, repair output   |
| `.mcp.json`                    | Local MCP server definition (gitignored)                 |
| `.ruflo/config.yaml`           | Local runtime config (topology, memory backend, workers) |
| `.ruflo/daemon-state.json`     | Local worker state and schedules                         |
| `.ruflo/data/`                 | Ignored local AgentDB/Ruflo data path                    |
| `.claude/settings.json`        | Claude hooks, statusline, permissions, attribution       |
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

`pnpm codex:ruflo-check` also runs best-effort direct CLI diagnostics. CLI warnings do not block Codex work when MCP registration and MCP tools are healthy. Run `RUFLO_DEEP_CLI_PROBES=1 pnpm codex:ruflo-check` only when you need bounded memory CLI diagnostics.

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

Check MCP memory stats/search first. If the memory DB still appears empty, run `npx ruflo@3.5.80 hooks pretrain`.

Then re-seed memory entries with MCP `memory_store` / `agentdb_hierarchical_store`, or import current-project Claude memories with MCP `memory_import_claude`. Avoid `memory init --force` or other reset commands unless you intentionally want to discard the local memory database.

### CLI diagnostics from Codex

If `pnpm codex:ruflo-check` reports a CLI timeout but the MCP registration is correct, first check MCP memory/status/search. Retry direct CLI outside the Codex sandbox only when you specifically need CLI diagnostics:

```bash
npx ruflo@3.5.80 --version
npx ruflo@3.5.80 daemon status
npx ruflo@3.5.80 hooks pretrain
```

For memory CLI probes, use the bounded opt-in health check:

```bash
RUFLO_DEEP_CLI_PROBES=1 pnpm codex:ruflo-check
```

If direct CLI commands are still slow or unavailable, use the Codex MCP tool surface for `hooks_intelligence`, `memory_store`, `memory_retrieve`, `memory_list`, and namespace-scoped `memory_search_unified`. The separate `embeddings_search` endpoint may require its own initialization even when stored memories already have embeddings. Treat the CLI path as degraded only after MCP memory has also been checked.

### Audit worker scanning .venv

Ensure `.venv/` is in `.gitignore` and `workers.excludePaths` in `.ruflo/config.yaml` includes `.venv/**`.

## What NOT To Do

- **Don't add ruflo to package.json** -- It's dev tooling only, runs via npx
- **Don't treat local `.mcp.json` as authoritative** -- Codex registration is checked with `pnpm codex:ruflo-check`
- **Don't commit local memory data** -- `.ruflo/`, `.swarm/`, `.claude/memory.db*`, `ruvector.db`, and `agentdb.rvf*` are local state
- **Don't rely on daemon for CI/CD** -- Workers are for local dev intelligence only
- **Don't store secrets in memory** -- Memory DB is unencrypted local SQLite

## See Also

- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md)
- [Security Scanning](security-scanning.md)
- [Codex + Ruflo Workflow](codex-ruflo-workflow.md)
