---
tier: living
purpose: system
title: 'Ruflo Development Workflow'
audience: human
category: implementation
status: active
layer: L4
---

# Ruflo Development Workflow

How and when to use ruflo during VariScout development from Codex. For tool reference, see [ruflo.md](ruflo.md).

## Architecture: Pull-Based Knowledge

Ruflo is a **pull-based knowledge system**. Hooks passively learn from your operations (edits, commands, prompts), but ruflo does not push insights back unprompted. You must explicitly query memory, dispatch workers, or run analysis to get value.

```
Codex      ──MCP tools──▶ ruflo (query on demand) ──results──▶ Codex
```

Ruflo is Codex-only in this repo as of 2026-05-15. Claude Code must not use Ruflo through project MCP, hooks, permissions, attribution, or project skills. Codex uses the MCP-backed memory and analysis workflow explicitly through `mcp__ruflo__*` tools.

## Development Lifecycle

### 1. Session Start

Codex sessions should run `pnpm codex:ruflo-check`. That command verifies the active Codex MCP registration and expected version; it does not prove the current Codex session has loaded the live Ruflo tool surface. If Ruflo is missing, disabled, or stale, follow the remove/add repair commands printed by the check, then restart Codex or start a fresh session.

No additional setup is needed once the Codex MCP server is available and the current session exposes Ruflo tools. In-session: use `mcp__ruflo__*` tools only.

### 2. Before Starting a Feature

Search ruflo memory for domain context before writing code. Use the memory search tool name exposed in the current Codex session (`memory_search` or `memory_search_unified`):

```
mcp__ruflo__memory_search_unified(query: "Azure authentication", namespace: "domain", limit: 5)
mcp__ruflo__memory_search_unified(query: "Cpk calculation stats", namespace: "architecture", limit: 5)
mcp__ruflo__memory_search_unified(query: "similar feature patterns", namespace: "decisions", limit: 5)
```

This surfaces prior decisions, architectural patterns, and domain knowledge that may not be in CLAUDE.md or the immediate code.

Codex may lazy-load Ruflo tools. If the Ruflo MCP memory/status tools are not initially visible, search the tool registry for Ruflo before assuming the capability is missing.

If registration is correct but no Ruflo tools appear after tool search, restart Codex or start a fresh session before re-registering. Codex MCP config is managed through `codex mcp add/list`, user-level Codex config, or trusted-project `.codex/config.toml`; VariScout uses a project-scoped wrapper so Ruflo state stays tied to this repo. Already-running sessions may not load changed MCP config.

### 3. During Coding (passive)

Codex Ruflo can track:

- Which files are edited together (co-edit patterns)
- Command success/failure rates
- Prompt classification and routing

Use MCP tools directly from Codex; intelligence accumulates in `.ruflo/` metrics once Ruflo is running. Helpful startup context should come from visible repo guidance and `pnpm codex:ruflo-check`, not from hidden client-specific hook behavior.

Ruflo is optional project intelligence. If it is unavailable after the documented recovery path, continue with `rg`, visible docs, ADRs, and normal validation rather than blocking development.

### 4. Before Creating a PR

Run these checks before opening a pull request:

```
# Risk assessment on your changes
mcp__ruflo__analyze_diff(ref: "main..HEAD")

# Test coverage check
mcp__ruflo__hooks_worker-dispatch(trigger: "testgaps", context: "Pre-PR audit", priority: "high")

# Security scan
mcp__ruflo__hooks_worker-dispatch(trigger: "audit", context: "Pre-PR security", priority: "critical")
```

Use the ref format accepted by the current MCP tool. Some versions accept only simple branch names or commit SHAs and reject slashes/ranges. If `analyze_diff` fails through MCP, use `git diff --stat`, targeted review of changed files, and `bash scripts/pr-ready-check.sh` as the fallback gate. Do not switch to ad hoc Ruflo CLI diff commands or block PR prep solely on a degraded Ruflo diff-analysis tool.

### 5. After Major Changes

When you've completed a significant refactor or feature, use MCP tools:

```
# Reindex codebase structure (~200ms)
mcp__ruflo__hooks_pretrain({ path: "<repo-root>", depth: "medium" })

# Update stale memory entries
mcp__ruflo__memory_store({ namespace: "architecture", key: "change-name", value: "...", upsert: true })
```

### 6. Periodic Maintenance (automated)

8 daemon workers run on intervals when local `.ruflo/config.yaml` is present:

| Worker      | Interval | What it does                   |
| ----------- | -------- | ------------------------------ |
| audit       | 10min    | CVE tracking, OWASP scanning   |
| testgaps    | 20min    | Test coverage analysis         |
| map         | 15min    | Codebase structure mapping     |
| optimize    | 15min    | Performance hints              |
| consolidate | 30min    | Memory dedup and cleanup       |
| deepdive    | 30min    | Deep analysis of changed files |
| refactor    | 30min    | Code quality suggestions       |
| document    | 60min    | Documentation drift checks     |

4 more workers available for manual dispatch: `predict`, `preload`, `ultralearn`, `benchmark`.

## When to Use Ruflo vs Other Tools

| Need                                              | Use                                                      | Why                                               |
| ------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| Quick file/class lookup                           | Glob, Grep                                               | Faster for exact matches                          |
| Domain knowledge ("how does Cpk work here?")      | `mcp__ruflo__memory_search`                              | Semantic search across local AgentDB memory       |
| Architecture questions ("where is auth handled?") | `mcp__ruflo__memory_search`                              | Returns contextual knowledge, not just file paths |
| Pre-PR risk assessment                            | `mcp__ruflo__analyze_diff`                               | Use when available; fall back to git diff review  |
| Security audit                                    | `mcp__ruflo__hooks_worker-dispatch(trigger: "audit")`    | OWASP + CVE scanning                              |
| Test gap detection                                | `mcp__ruflo__hooks_worker-dispatch(trigger: "testgaps")` | Coverage analysis across 9 workspaces             |
| Project state/routing                             | `AGENTS.md`, `CLAUDE.md`, `docs/llms.txt`, MEMORY.md     | Always-available repo guidance                    |

## Keeping Memory Fresh

Ruflo memory is only as good as its last update. After significant work:

1. Check if relevant entries are stale: `mcp__ruflo__memory_retrieve(key: "testing/counts")`
2. Update with current data: `mcp__ruflo__memory_store(namespace: "testing", key: "counts", value: "...")`
3. Reindex if structure changed: `mcp__ruflo__hooks_pretrain({ path: "<repo-root>", depth: "medium" })`

If memory appears empty, prefer a non-destructive reseed first: check MCP memory stats/search, run `hooks pretrain`, and store a small set of curated project invariants. Do not run reset or `memory init --force` unless you explicitly intend to discard the existing local database.

Root-level `agentdb.rvf*` files are local AgentDB state. Keep them out of Git; if they appear in the repo root, first inspect and back up `.swarm/memory.db*`, `.ruflo/data/*`, `.claude/memory.db*`, `ruvector.db`, and root `agentdb.rvf*` under `.ruflo/data/backups/`. Then quarantine the root `agentdb.rvf*` files outside the repo root lookup path. `.swarm/memory.db` may be populated while `.ruflo/data/agentdb.rvf` is only a small shell, so check counts before reseeding or moving data.

When updating docs that mention Ruflo versions, run `pnpm docs:check`; it includes a drift guard against `scripts/check-codex-ruflo.sh`.

## See Also

- [Ruflo Technical Reference](ruflo.md) — tools, config, troubleshooting
- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md) — architectural decision
- [Codex + Ruflo Workflow](codex-ruflo-workflow.md) — Codex-specific setup notes
