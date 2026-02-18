# Claude-Flow Development Tooling

## What It Is

claude-flow is an MCP-integrated AI development tooling layer for VariScout. It provides semantic codebase search, persistent cross-session memory, automated security scanning, and background workers. It is **not** a runtime dependency -- it only runs during development sessions.

## Quick Commands

```bash
# System status
npx claude-flow@v3alpha daemon status

# Semantic search
npx claude-flow@v3alpha memory search --query "Cpk calculation"
npx claude-flow@v3alpha memory search --query "Azure authentication"

# Memory operations
npx claude-flow@v3alpha memory stats
npx claude-flow@v3alpha memory list --namespace architecture
npx claude-flow@v3alpha memory store -k "key" --namespace ns --value "data"

# Security scanning
npx claude-flow@v3alpha security scan --depth full   # OWASP Top 10
npx claude-flow@v3alpha security cve --check          # CVE database

# Daemon control
npx claude-flow@v3alpha daemon start
npx claude-flow@v3alpha daemon stop
npx claude-flow@v3alpha daemon trigger -w audit       # Run worker manually

# Reindex codebase
npx claude-flow@v3alpha hooks pretrain
npx claude-flow@v3alpha hooks build-agents
```

## Architecture

```
Claude Code ──MCP──▶ claude-flow MCP Server (npx, port 3000)
                          │
                          ├── Memory (sql.js + HNSW vector index)
                          ├── Embeddings (all-MiniLM-L6-v2, 384-dim)
                          ├── Hooks (pre/post edit, session start/end)
                          └── Daemon (background workers)
```

### Config Files

| File                             | Purpose                                            |
| -------------------------------- | -------------------------------------------------- |
| `.mcp.json`                      | MCP server definition (autoStart: true)            |
| `.claude-flow/config.yaml`       | Runtime config (topology, memory backend, workers) |
| `.claude-flow/daemon-state.json` | Worker state and schedules                         |
| `.claude/settings.json`          | Hooks, model preferences, worker list              |

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
rm .claude-flow/daemon.pid
npx claude-flow@v3alpha daemon start
```

### Worker stuck in "running" state

Edit `.claude-flow/daemon-state.json` and set `"isRunning": false` for the stuck worker, then restart the daemon.

### Memory empty after session

```bash
npx claude-flow@v3alpha memory init --force
npx claude-flow@v3alpha hooks pretrain
```

Then re-seed memory entries (see seed commands in ADR-011).

### Audit worker scanning .venv

Ensure `.venv/` is in `.gitignore` and `workers.excludePaths` in `.claude-flow/config.yaml` includes `.venv/**`.

## What NOT To Do

- **Don't add claude-flow to package.json** -- It's dev tooling only, runs via npx
- **Don't commit .claude-flow/ data** -- Already gitignored; contains local state
- **Don't rely on daemon for CI/CD** -- Workers are for local dev intelligence only
- **Don't store secrets in memory** -- Memory DB is unencrypted local SQLite

## See Also

- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md)
- [Security Scanning](security-scanning.md)
