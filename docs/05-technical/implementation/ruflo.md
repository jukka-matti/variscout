---
title: 'Ruflo Development Tooling'
---

# Ruflo Development Tooling

## What It Is

ruflo is an MCP-integrated AI development tooling layer for VariScout. It provides semantic codebase search, persistent cross-session memory, automated security scanning, and background workers. It is **not** a runtime dependency -- it only runs during development sessions.

## Quick Commands

```bash
# System status
npx ruflo@latest daemon status

# Semantic search
npx ruflo@latest memory search --query "Cpk calculation"
npx ruflo@latest memory search --query "Azure authentication"

# Memory operations
npx ruflo@latest memory stats
npx ruflo@latest memory list --namespace architecture
npx ruflo@latest memory store -k "key" --namespace ns --value "data"

# Security scanning
npx ruflo@latest security scan --depth full   # OWASP Top 10
npx ruflo@latest security cve --check          # CVE database

# Daemon control
npx ruflo@latest daemon start
npx ruflo@latest daemon stop
npx ruflo@latest daemon trigger -w audit       # Run worker manually

# Reindex codebase
npx ruflo@latest hooks pretrain
npx ruflo@latest hooks build-agents
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
| `.claude/settings.json`    | Hooks, model preferences, worker list              |

### Memory Namespaces

| Namespace      | Contents                                            |
| -------------- | --------------------------------------------------- |
| `architecture` | Monorepo structure, product model, key files        |
| `conventions`  | Coding standards, import rules, color usage         |
| `decisions`    | Removed features, Azure architecture, system limits |
| `testing`      | Test counts, runner commands                        |

### Background Workers

| Worker        | Interval | Purpose                    |
| ------------- | -------- | -------------------------- |
| `map`         | 15min    | Codebase structure mapping |
| `audit`       | 10min    | Security analysis (OWASP)  |
| `optimize`    | 15min    | Performance hints          |
| `consolidate` | 30min    | Memory dedup and cleanup   |
| `testgaps`    | 20min    | Test coverage analysis     |

Workers are resource-throttled: max 2 concurrent, CPU load < 2, free memory > 20%.

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
