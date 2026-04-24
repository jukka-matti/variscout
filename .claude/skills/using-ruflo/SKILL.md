---
name: using-ruflo
description: Use when running ruflo tools or accessing ruflo memory for VariScout. Semantic memory search via npx ruflo memory search, when to use ruflo memory vs MEMORY.md (routing vs semantic), worker dispatch via mcp__ruflo__hooks_worker-dispatch, hook error logs at /tmp/ruflo-hooks.log, version pinned to 3.5.42 in .mcp.json.
---

# Using Ruflo

## When this skill applies

Use this skill when running ruflo tools or accessing ruflo semantic memory for VariScout domain knowledge, architecture details, and prior decisions.

## Core patterns

### Semantic memory search

Ruflo memory contains 117 indexed entries about VariScout's architecture, domain, conventions, and testing. Search it for deep codebase questions:

```bash
npx ruflo@3.5.80 memory search --query "your question here"
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
- **Ruflo memory**: Deep semantic search — domain knowledge, architecture details, 117 durable entries. Use for codebase questions requiring broad context.

Non-overlapping responsibilities: MEMORY.md is ephemeral session state; Ruflo is persistent knowledge base.

### Workflow

**Before feature work**: Search ruflo memory for domain context and prior decisions via `mcp__ruflo__memory_search`.

**Before creating PR**: Run `mcp__ruflo__analyze_diff` for risk assessment, then dispatch `testgaps` and `audit` workers to catch gaps.

**After major refactoring**: Run `npx ruflo@3.5.80 hooks pretrain` to reindex the codebase and rebuild semantic search. Then add or update specific memory entries:

```bash
npx ruflo@3.5.80 memory store --namespace architecture --key "change-name" --value "description"
```

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

```bash
npx ruflo@3.5.80 memory store --namespace <namespace> --key "<key>" --value "<description>"
```

Example namespaces: `architecture`, `testing`, `domain`, `performance`.

## Gotchas

- **Don't use ruflo for ephemeral task state** — use `TaskCreate` instead. Ruflo memory is for durable knowledge; TaskCreate is for session-scoped work tracking.
- **Re-index after major refactors** — semantic search becomes stale as the codebase evolves. Always run `npx ruflo@3.5.80 hooks pretrain` after large changes to rebuild the index.
- **Version pinning** — Ruflo is pinned to `3.5.42` in `.mcp.json`. Don't upgrade without coordination; MCP tool signatures may change between versions.
- **Hook error logs** — Check `/tmp/ruflo-hooks.log` if hooks fail silently. This file is not persisted across reboots and not tracked in git.
- **Config file confusion** — `.claude/settings.json` contains hooks and statusline configuration only. Ruflo runtime config lives in `.ruflo/config.yaml`. Don't confuse the two.

## Reference

- `.ruflo/config.yaml` — Worker scheduling and intelligence configuration
- `docs/05-technical/implementation/ruflo-workflow.md` — Full workflow guide and best practices
- `.mcp.json` — Pinned version and MCP server configuration
