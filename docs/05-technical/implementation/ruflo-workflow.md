---
title: 'Ruflo Development Workflow'
---

# Ruflo Development Workflow

How and when to use ruflo during VariScout development. For tool reference, see [ruflo.md](ruflo.md).

## Architecture: Pull-Based Knowledge

Ruflo is a **pull-based knowledge system**. Hooks passively learn from your operations (edits, commands, prompts), but ruflo does not push insights back unprompted. You must explicitly query memory, dispatch workers, or run analysis to get value.

```
Claude Code ──hooks──▶ ruflo (learns passively)
Claude Code ──MCP────▶ ruflo (query on demand) ──results──▶ Claude Code
Codex      ──────────▶ ruflo (query on demand) ──results──▶ Codex
```

Claude has extra local automation via `.claude/settings.json`. Codex shares the same MCP-backed memory and analysis workflow, but should not assume Claude hooks or statusline behavior.

## Development Lifecycle

### 1. Session Start

Claude sessions start daemon and restore state via hooks.

Codex sessions should confirm MCP availability with `codex mcp list`. If needed, register `ruflo` manually with `codex mcp add ruflo -- npx ruflo@3.5.42 mcp start`.

No additional setup is needed once the MCP server is available.

### 2. Before Starting a Feature

Search ruflo memory for domain context before writing code:

```
mcp__ruflo__memory_search(query: "Azure authentication", namespace: "domain")
mcp__ruflo__memory_search(query: "Cpk calculation stats", namespace: "architecture")
mcp__ruflo__memory_search(query: "similar feature patterns", namespace: "decisions")
```

This surfaces prior decisions, architectural patterns, and domain knowledge that may not be in CLAUDE.md or the immediate code.

### 3. During Coding (passive)

Hooks automatically track:

- Which files are edited together (co-edit patterns)
- Command success/failure rates
- Prompt classification and routing

In Claude, hooks capture this passively. In Codex, use the shared MCP tools directly; intelligence still accumulates in `.ruflo/` metrics once ruflo is running.

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

### 5. After Major Changes

When you've completed a significant refactor or feature:

```bash
# Reindex codebase structure
npx ruflo@3.5.42 hooks pretrain

# Update stale memory entries
mcp__ruflo__memory_store(namespace: "architecture", key: "change-name", value: "description")
```

### 6. Periodic Maintenance (automated)

7 daemon workers run on intervals (configured in `.ruflo/config.yaml`):

| Worker      | Interval | What it does                   |
| ----------- | -------- | ------------------------------ |
| audit       | 10min    | CVE tracking, OWASP scanning   |
| testgaps    | 20min    | Test coverage analysis         |
| map         | 15min    | Codebase structure mapping     |
| optimize    | 15min    | Performance hints              |
| consolidate | 30min    | Memory dedup and cleanup       |
| deepdive    | 30min    | Deep analysis of changed files |
| refactor    | 30min    | Code quality suggestions       |

5 more workers available for manual dispatch: `predict`, `preload`, `ultralearn`, `document`, `benchmark`.

## When to Use Ruflo vs Other Tools

| Need                                              | Use                                                      | Why                                               |
| ------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| Quick file/class lookup                           | Glob, Grep                                               | Faster for exact matches                          |
| Domain knowledge ("how does Cpk work here?")      | `mcp__ruflo__memory_search`                              | Semantic search across 117+ entries               |
| Architecture questions ("where is auth handled?") | `mcp__ruflo__memory_search`                              | Returns contextual knowledge, not just file paths |
| Pre-PR risk assessment                            | `mcp__ruflo__analyze_diff`                               | Classifies changes, suggests reviewers            |
| Security audit                                    | `mcp__ruflo__hooks_worker-dispatch(trigger: "audit")`    | OWASP + CVE scanning                              |
| Test gap detection                                | `mcp__ruflo__hooks_worker-dispatch(trigger: "testgaps")` | Coverage analysis across 9 workspaces             |
| Project state/routing                             | `AGENTS.md`, `CLAUDE.md`, `docs/llms.txt`, MEMORY.md     | Always-available repo guidance                    |

## Keeping Memory Fresh

Ruflo memory is only as good as its last update. After significant work:

1. Check if relevant entries are stale: `mcp__ruflo__memory_retrieve(key: "testing/counts")`
2. Update with current data: `mcp__ruflo__memory_store(namespace: "testing", key: "counts", value: "...")`
3. Reindex if structure changed: `npx ruflo@3.5.42 hooks pretrain`

## See Also

- [Ruflo Technical Reference](ruflo.md) — tools, config, troubleshooting
- [ADR-011: AI Development Tooling](../../07-decisions/adr-011-ai-development-tooling.md) — architectural decision
- [Codex + Ruflo Workflow](codex-ruflo-workflow.md) — Codex-specific setup notes
