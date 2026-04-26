---
name: using-ruflo
description: Use when running ruflo tools or accessing ruflo memory for VariScout. Default to mcp__ruflo__* tools for in-session search/store/pretrain (CLI hangs while the MCP server is running on long writes). When to use ruflo memory vs MEMORY.md (routing vs semantic), worker dispatch via mcp__ruflo__hooks_worker-dispatch, hook error logs at /tmp/ruflo-hooks.log, version expected by scripts/check-codex-ruflo.sh.
---

# Using Ruflo

## When this skill applies

Use this skill when running ruflo tools or accessing ruflo semantic memory for VariScout domain knowledge, architecture details, and prior decisions.

## In-session: use MCP, not the CLI

The ruflo MCP server is the read/write path during a Claude Code session. The CLI (`npx ruflo@3.5.80 ...`) is a fallback for environments without MCP (Codex without MCP, scripts, CI). **Long-content writes via the CLI hang while the MCP server holds a connection** — see `feedback_ruflo_cli_lock.md` in auto-memory for the full failure mode.

This is also ruflo's documented split (ruflo's own `CLAUDE.md`):

> "Keep MCP for coordination strategy only — Hook Commands run via npx CLI, not MCP tools."

So: in-session user ops (search, store, pretrain) → MCP. Per-event hooks in `.claude/settings.json` → CLI. Don't mix the two.

## Core patterns

### Semantic memory search

Ruflo memory contains local indexed entries about VariScout's architecture, domain, conventions, and testing. Search it for deep codebase questions:

```
mcp__ruflo__memory_search({ query: "your question here", namespace: "architecture", limit: 5 })
```

Common queries and what they find:

| Query | Finds |
|-------|-------|
| `"Cpk calculation"` | Stats engine implementation entries |
| `"Azure authentication Teams"` | Auth and Teams architecture |
| `"which persona needs admin"` | Persona requirements and descriptions |
| `"bottleneck analysis use case"` | Use case definitions |
| `"component extraction pattern"` | UI architecture conventions |

### Ruflo memory vs MEMORY.md

- **MEMORY.md**: Always-in-context routing — project state, key decisions, user preferences, active feature context. Use for session-scoped knowledge that changes frequently.
- **Ruflo memory**: Deep semantic search — domain knowledge and architecture details. Use for codebase questions requiring broad context.

Non-overlapping responsibilities: MEMORY.md is ephemeral session state; Ruflo is persistent knowledge base.

### Workflow

**Before feature work**: Search ruflo memory for domain context and prior decisions via `mcp__ruflo__memory_search`.

**Before creating PR**: Run `mcp__ruflo__analyze_diff` for risk assessment when available, then dispatch `testgaps` and `audit` workers to catch gaps. If diff analysis fails through MCP, fall back to Git diff review plus `bash scripts/pr-ready-check.sh`.

**After major refactoring**: Run `mcp__ruflo__hooks_pretrain({ path, depth: "medium" })` to reindex the codebase and rebuild semantic search (~200ms via MCP; the CLI equivalent hung in the 2026-04-26 session). Then add or update specific memory entries:

```
mcp__ruflo__memory_store({ namespace: "architecture", key: "change-name", value: "description" })
```

Use `upsert: true` to update an existing key in place.

**Keep memory fresh**: Update entries when test counts, architecture, or conventions change significantly.

### Background workers

7 workers run periodically via `.ruflo/config.yaml`:
- `audit` (security scanning)
- `testgaps` (coverage analysis)
- `map` (structure analysis)
- `optimize` (performance analysis)
- `consolidate` (memory optimization)
- `deepdive` (detailed analysis)
- `refactor` (code quality)

5 more workers are available for manual dispatch via `mcp__ruflo__hooks_worker-dispatch` (e.g., `document`, `predict`, `benchmark`).

### Storing entries

After major codebase changes, store new knowledge entries for future semantic search:

```
mcp__ruflo__memory_store({
  namespace: "<namespace>",
  key: "<key>",
  value: "<description>",
  upsert: true
})
```

Example namespaces: `architecture`, `testing`, `domain`, `performance`.

### CLI fallback

Use the CLI only when the MCP server is not available (Codex without MCP registered, scripts, CI):

```bash
npx ruflo@3.5.80 memory search --query "..."
npx ruflo@3.5.80 memory store --namespace <ns> --key <k> --value "..."
npx ruflo@3.5.80 hooks pretrain
```

Do NOT dispatch CLI memory writes in parallel from a session shell — they contend with the MCP server's connection and hang at 0% CPU.

## Gotchas

- **Don't use ruflo for ephemeral task state** — use `TaskCreate` instead. Ruflo memory is for durable knowledge; TaskCreate is for session-scoped work tracking.
- **Re-index after major refactors** — semantic search becomes stale as the codebase evolves. Use `mcp__ruflo__hooks_pretrain({ path: "<repo>", depth: "medium" })` after large changes to rebuild the index. (CLI fallback: `npx ruflo@3.5.80 hooks pretrain` — only when no MCP.)
- **Version pinning** — Ruflo is expected by `scripts/check-codex-ruflo.sh`; local `.mcp.json` and Codex MCP registration should match it. Don't upgrade without coordination; MCP tool signatures may change between versions.
- **Hook error logs** — Check `/tmp/ruflo-hooks.log` if hooks fail silently. This file is not persisted across reboots and not tracked in git.
- **Config file confusion** — `.claude/settings.json` contains hooks and statusline configuration only. Ruflo runtime config lives in `.ruflo/config.yaml`. Don't confuse the two.

## Reference

- `scripts/check-codex-ruflo.sh` — Codex version expectation, health check, and repair commands
- `.ruflo/config.yaml` — Local worker scheduling and intelligence configuration
- `docs/05-technical/implementation/ruflo-workflow.md` — Full workflow guide and best practices
- `.mcp.json` — Local MCP server configuration
