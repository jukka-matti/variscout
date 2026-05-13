---
name: using-ruflo
description: Use when running ruflo tools or accessing ruflo memory for VariScout. Always call mcp__ruflo__* tools; never run npx ruflo from a session shell. When to use ruflo memory vs MEMORY.md (routing vs semantic), worker dispatch via mcp__ruflo__hooks_worker-dispatch, hook error logs at /tmp/ruflo-hooks.log, version expected by scripts/check-codex-ruflo.sh.
---

# Using Ruflo

## When this skill applies

Use this skill when running ruflo tools or accessing ruflo semantic memory for VariScout domain knowledge, architecture details, and prior decisions.

## Use MCP for everything in-session

All ruflo work from a Claude Code or Codex session goes through the `mcp__ruflo__*` tool surface. Do not run `npx ruflo …` or `pnpm exec ruflo …` from a session shell — it has historically hung at 0% CPU when MCP holds the SQLite connection (see `feedback_ruflo_cli_lock.md`), and there is no reason to reach for it now that hooks have been migrated off CLI.

Lifecycle hooks in `.claude/settings.json` invoke ruflo via `type: "mcp_tool"` (Anthropic-native MCP hook), so the harness talks to the same MCP server you query manually. The only remaining shell entry is `SessionStart → pnpm exec ruflo daemon start`, which bootstraps the background-worker daemon before MCP is connected — that one is irreducible.

**Codex asymmetry**: OpenAI Codex hooks (`developers.openai.com/codex/hooks`) only support `type: "command"`, not `type: "mcp_tool"`. If we ever wire a Codex `hooks.json` or `.codex/config.toml`, those entries must shell out to `pnpm exec ruflo hooks …`. That is a Codex limitation, not ours — do not try to "fix" it by reintroducing CLI use in Claude Code.

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

**After major refactoring**: Run `mcp__ruflo__hooks_pretrain({ path, depth: "medium" })` to reindex the codebase and rebuild semantic search (~200ms). Then add or update specific memory entries:

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

## Hygiene rule

Same shape as memory hygiene (see CLAUDE.md "Ruflo hygiene"). Ruflo entries hold *durable* architectural facts: patterns, conventions, design decisions, supersession rationales. They should NOT hold ephemeral state — PR status, test counts, in-flight phase, sprint focus all belong elsewhere (MEMORY.md for session state; `git`/`gh` for delivery state). Entries that cite specific file paths, function names, or commit hashes are claims valid *at write time*; verify before recommending. When a referenced entity is renamed or removed, update or delete the entry.

## Gotchas

- **Don't use ruflo for ephemeral task state** — use `TaskCreate` instead. Ruflo memory is for durable knowledge; TaskCreate is for session-scoped work tracking.
- **Re-index after major refactors** — semantic search becomes stale as the codebase evolves. Use `mcp__ruflo__hooks_pretrain({ path: "<repo>", depth: "medium" })` after large changes to rebuild the index.
- **Version pinning** — Ruflo is expected by `scripts/check-codex-ruflo.sh`; local `.mcp.json` and Codex MCP registration should match it. Don't upgrade without coordination; MCP tool signatures may change between versions.
- **Hook error logs** — Check `/tmp/ruflo-hooks.log` if the SessionStart daemon bootstrap fails silently. MCP-typed hooks surface errors through Claude Code's normal hook diagnostics, not the log file. The file is not persisted across reboots and not tracked in git.
- **Config file confusion** — `.claude/settings.json` contains hooks and statusline configuration only. Ruflo runtime config lives in `.ruflo/config.yaml`. Don't confuse the two.

## Reference

- `scripts/check-codex-ruflo.sh` — Codex MCP registration check (CLI probes removed 2026-05-13)
- `.ruflo/config.yaml` — Local worker scheduling and intelligence configuration
- `docs/05-technical/implementation/ruflo-workflow.md` — Full workflow guide and best practices
- `.mcp.json` — Local MCP server configuration
