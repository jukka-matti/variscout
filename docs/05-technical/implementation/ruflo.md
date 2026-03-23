---
title: 'Ruflo Development Tooling'
---

# Ruflo Development Tooling

## What It Is

ruflo is an MCP-integrated AI development tooling layer for VariScout. It provides semantic codebase search, persistent cross-session memory, hooks intelligence (pattern learning), neural learning (SONA), automated security scanning, and background workers. It is **not** a runtime dependency -- it only runs during development sessions.

**Version**: Pinned to `ruflo@3.5.42` in `.mcp.json` and `.claude/settings.json`. Update monthly.

## Quick Commands

```bash
# System status
npx ruflo@3.5.42 daemon status
npx ruflo@3.5.42 hooks metrics              # Hook intelligence stats

# Semantic search (117 indexed entries, ~80-100ms response)
npx ruflo@3.5.42 memory search --query "Cpk calculation"
npx ruflo@3.5.42 memory search --query "Azure authentication"
npx ruflo@3.5.42 memory search --query "which persona needs admin"

# Memory operations
npx ruflo@3.5.42 memory stats
npx ruflo@3.5.42 memory list --namespace domain
npx ruflo@3.5.42 memory store -k "key" --namespace ns --value "data"

# Security scanning
npx ruflo@3.5.42 security scan --depth full  # OWASP Top 10
npx ruflo@3.5.42 security cve --check         # CVE database

# Daemon control
npx ruflo@3.5.42 daemon start
npx ruflo@3.5.42 daemon stop

# Reindex codebase (run after major changes)
npx ruflo@3.5.42 hooks pretrain

# Neural / pattern learning
npx ruflo@3.5.42 neural status
```

## Architecture

```
Claude Code ──MCP──▶ ruflo MCP Server (npx, port 3000)
                          │
                          ├── Memory (sql.js + HNSW vector index)
                          ├── Embeddings (all-MiniLM-L6-v2, 384-dim)
                          ├── Hooks (pre/post edit, session start/end)
                          └── Daemon (background workers)
```

### Config Files

| File                       | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `.mcp.json`                | MCP server definition (autoStart: true)            |
| `.ruflo/config.yaml`       | Runtime config (topology, memory backend, workers) |
| `.ruflo/daemon-state.json` | Worker state and schedules                         |
| `.claude/settings.json`    | Hooks, statusline, permissions, attribution        |

### Memory Namespaces

| Namespace             | Entries | Contents                                                                         |
| --------------------- | ------- | -------------------------------------------------------------------------------- |
| `domain`              | 51      | Personas (9), use cases (14), flows, methodology, four lenses, two voices        |
| `architecture`        | 20      | Monorepo structure, storage split, sub-path exports, App Insights, key files     |
| `decisions`           | 14      | ADR summaries, removed features, Azure architecture, system limits               |
| `testing`             | 13      | Test counts, patterns, priorities, coverage gaps, e2e selectors                  |
| `conventions`         | 10      | Coding standards, import rules, color usage, token proxy, component patterns     |
| `anti-patterns`       | 6       | Common mistakes: no hardcoded colors, no cross-package imports, removed features |
| `state`               | 2       | Product status, recent changes                                                   |
| `project_exploration` | 1       | Codebase exploration context                                                     |

Total: 117 entries with HNSW vector embeddings. Semantic search returns results in ~80-100ms.

### Memory + MEMORY.md Complementarity

Both systems are used and serve different purposes:

| Feature           | Claude Code MEMORY.md             | Ruflo AgentDB                                 |
| ----------------- | --------------------------------- | --------------------------------------------- |
| Always in context | Yes (auto-loaded)                 | No (explicit retrieval)                       |
| Capacity          | ~200 lines                        | 117 entries (thousands possible)              |
| Search            | Scanned by AI during context      | Semantic vector search (HNSW)                 |
| Best for          | High-level project state, routing | Detailed domain knowledge, semantic discovery |

Use MEMORY.md for "what should I always know." Use ruflo memory for "find me something specific."

### Background Workers

| Worker        | Interval | Purpose                    |
| ------------- | -------- | -------------------------- |
| `map`         | 15min    | Codebase structure mapping |
| `audit`       | 10min    | Security analysis (OWASP)  |
| `optimize`    | 15min    | Performance hints          |
| `consolidate` | 30min    | Memory dedup and cleanup   |
| `testgaps`    | 20min    | Test coverage analysis     |

Workers are resource-throttled: max 2 concurrent, CPU load < 2, free memory > 20%.

### Hooks Intelligence

Hooks automatically learn from development patterns:

- **Pattern learning**: Tracks which files are edited together, command sequences, success/failure rates
- **Routing**: Classifies prompts and routes to appropriate agent types (87% accuracy, 42 routes)
- **Metrics**: `npx ruflo@3.5.42 hooks metrics` shows 24h dashboard

As of Mar 2026: 128 commands tracked, 15 patterns at 85% confidence, 94% success rate.

### Neural Learning (SONA)

SONA (Self-Optimizing Neural Architecture) provides deeper pattern recognition:

- Q-learning + neural reinforcement from task execution
- Mixture of Experts (8 networks) for routing decisions
- Elastic Weight Consolidation prevents forgetting older patterns
- Bootstrapped via `npx ruflo@3.5.42 hooks pretrain`

Neural learning accumulates passively — runs automatically when daemon is active.

## Troubleshooting

### Stale daemon PID

```bash
rm .ruflo/daemon.pid
npx ruflo@latest daemon start
```

### Worker stuck in "running" state

Edit `.ruflo/daemon-state.json` and set `"isRunning": false` for the stuck worker, then restart the daemon.

### Memory empty after session

```bash
npx ruflo@latest memory init --force
npx ruflo@latest hooks pretrain
```

Then re-seed memory entries (see seed commands in ADR-011).

### Audit worker scanning .venv

Ensure `.venv/` is in `.gitignore` and `workers.excludePaths` in `.ruflo/config.yaml` includes `.venv/**`.

## What NOT To Do

- **Don't add ruflo to package.json** -- It's dev tooling only, runs via npx
- **Don't commit .ruflo/ data** -- Already gitignored; contains local state
- **Don't rely on daemon for CI/CD** -- Workers are for local dev intelligence only
- **Don't store secrets in memory** -- Memory DB is unencrypted local SQLite

## See Also

- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md)
- [Security Scanning](security-scanning.md)
