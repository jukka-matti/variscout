---
title: 'Codex + Ruflo Workflow'
audience: [developer]
category: implementation
status: stable
---

# Codex + Ruflo Workflow

How to use Codex with the shared ruflo tooling in this repo.

## What Is Shared vs Client-Specific

- Tracked: `scripts/check-codex-ruflo.sh` pins the expected `ruflo` version and repair command.
- Local: `.mcp.json` and Codex MCP registration can mirror that command, but they are machine-local and may drift.
- Shared: ruflo memory, workers, diff analysis, and status through the MCP tool surface.
- Claude-only: `.claude/settings.json` hooks, statusline, and path-scoped rule loading.
- Codex-specific: `AGENTS.md` is the repo entrypoint, and active MCP registration is managed through Codex config plus `codex mcp`.

## Startup Checklist

1. Read `AGENTS.md` and `docs/llms.txt`.
2. Run `pnpm codex:ruflo-check` to verify Codex MCP registration and expected version.
3. If `ruflo` is missing, disabled, or stale, run the remove/add repair commands printed by the check.

The practical Codex source of truth is `codex mcp get ruflo`, which reads the active Codex MCP configuration on your machine. The tracked repo source of truth for the expected version is `scripts/check-codex-ruflo.sh`; `pnpm docs:check` includes a drift guard so current docs and scripts reference the same version.

`pnpm codex:ruflo-check` may include best-effort direct CLI probes. Those probes are diagnostics only. If they time out but `mcp__ruflo__mcp_status`, `mcp__ruflo__memory_stats`, or a memory search works, continue with MCP and record the CLI path as degraded.

## Recommended Codex Workflow

### Before Starting Non-Trivial Work

Use Ruflo MCP memory explicitly:

```text
mcp__ruflo__memory_search_unified(query: "Azure authentication", namespace: "domain", limit: 5)
mcp__ruflo__memory_search_unified(query: "Cpk calculation stats", namespace: "architecture", limit: 5)
mcp__ruflo__memory_search_unified(query: "similar feature patterns", namespace: "decisions", limit: 5)
```

If Ruflo tools do not appear in the initially visible tool list, search the tool registry for Ruflo. Codex can lazy-load additional MCP tool definitions.

Codex does not receive the passive Claude hook guidance, so retrieval should be intentional at task start.

### During Implementation

- Use repo docs and package `CLAUDE.md` files for local context.
- Treat `.claude/rules/` and `.claude/skills/` as Claude-oriented assets unless a task explicitly requires reading them as reference.
- Use standard repo commands for validation: `pnpm test`, `pnpm build`, and `bash scripts/pr-ready-check.sh`.
- If you want Claude-like startup context, rely on `AGENTS.md` plus `pnpm codex:ruflo-check`; do not assume Claude hooks or statusline behavior exists in Codex.

### Before Opening A PR

Use the same shared ruflo checks:

```text
mcp__ruflo__analyze_diff(ref: "<base-sha-or-simple-ref>")
mcp__ruflo__hooks_worker_list(includeActive: true, status: "all")
# Dispatch audit/test-gap workers through MCP when the worker-dispatch tool is available.
```

Use the MCP tool shape that is actually available in the current Codex session. Some Ruflo MCP versions reject complex refs like `origin/main` or `main..HEAD`; use the base commit SHA or another simple accepted ref. If `analyze_diff` returns an MCP runtime/safety error, treat Ruflo diff analysis as degraded for that session and fall back to `git diff --stat`, targeted file review, and the normal `bash scripts/pr-ready-check.sh` gate.

### After Major Refactors

Use MCP, not the shell CLI:

```text
mcp__ruflo__memory_stats()
mcp__ruflo__memory_search_unified(query: "new architecture fact", namespace: "architecture", limit: 5)
```

If worker pretrain/store tools are available in the current MCP surface, use those MCP tools for reseeding or updates. Do not run `npx ruflo ...` from Codex for routine memory writes or reindexing.

## Failure Modes

- If `pnpm codex:ruflo-check` reports missing, disabled, or wrong-version registration, run the remove/add repair commands it prints.
- After changing Codex MCP registration, start a fresh Codex session before judging MCP runtime behavior; an already-running MCP server process may keep serving the current session.
- If local `.mcp.json` and Codex registration drift, trust `scripts/check-codex-ruflo.sh` and re-register Ruflo from the check output.
- If CLI probes time out, do not retry with ad hoc `npx ruflo ...` commands during normal Codex work. Check `mcp__ruflo__mcp_status`, `mcp__ruflo__memory_stats`, and `mcp__ruflo__memory_search_unified` instead. If MCP tools work, use MCP and record the CLI path as degraded.
- If MCP is unavailable, repair MCP registration first. Use direct CLI only as an explicit last-resort diagnostic outside the normal Codex workflow.
- If a doc mentions Claude hooks or statusline behavior, assume that behavior is not available in Codex unless separately configured.

## Local Memory Hygiene

Keep Ruflo and AgentDB data local. `.ruflo/`, `.swarm/`, `.claude/memory.db*`, `ruvector.db`, and root `agentdb.rvf*` files are ignored development state. If `agentdb.rvf` or `agentdb.rvf.lock` appears in the repo root, back it up under `.ruflo/data/` and move the live file there before continuing.

When reseeding memory from Codex, use the non-destructive path first:

```text
mcp__ruflo__memory_stats()
mcp__ruflo__memory_search_unified(query: "project invariants", namespace: "architecture", limit: 5)
```

Then store curated entries through MCP memory tools or import current-project Claude memory if those MCP tools are available. Avoid reset commands unless the intent is to throw away the existing local AgentDB contents.
