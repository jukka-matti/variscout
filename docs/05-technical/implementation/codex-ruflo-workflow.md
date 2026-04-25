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
- Shared: ruflo memory, workers, diff analysis, and CLI commands.
- Claude-only: `.claude/settings.json` hooks, statusline, and path-scoped rule loading.
- Codex-specific: `AGENTS.md` is the repo entrypoint, and active MCP registration is managed through Codex config plus `codex mcp`.

## Startup Checklist

1. Read `AGENTS.md` and `docs/llms.txt`.
2. Run `pnpm codex:ruflo-check` to verify Codex registration, version, and CLI smoke probes.
3. If `ruflo` is missing, disabled, or stale, run the remove/add repair commands printed by the check.

The practical Codex source of truth is `codex mcp get ruflo`, which reads the active Codex MCP configuration on your machine. The tracked repo source of truth for the expected version is `scripts/check-codex-ruflo.sh`; `pnpm docs:check` includes a drift guard so current docs and scripts reference the same version.

## Recommended Codex Workflow

### Before Starting Non-Trivial Work

Use ruflo memory explicitly:

```text
mcp__ruflo__memory_search(query: "Azure authentication", namespace: "domain")
mcp__ruflo__memory_search(query: "Cpk calculation stats", namespace: "architecture")
mcp__ruflo__memory_search(query: "similar feature patterns", namespace: "decisions")
```

If `memory_search` does not appear in the initially visible tool list, search the tool registry for Ruflo memory tools. Codex can lazy-load additional MCP tool definitions.

Codex does not receive the passive Claude hook guidance, so retrieval should be intentional at task start.

### During Implementation

- Use repo docs and package `CLAUDE.md` files for local context.
- Treat `.claude/rules/` and `.claude/skills/` as Claude-oriented assets unless a task explicitly requires reading them as reference.
- Use standard repo commands for validation: `pnpm test`, `pnpm build`, and `bash scripts/pr-ready-check.sh`.
- If you want Claude-like startup context, rely on `AGENTS.md` plus `pnpm codex:ruflo-check`; do not assume Claude hooks or statusline behavior exists in Codex.

### Before Opening A PR

Use the same shared ruflo checks:

```text
mcp__ruflo__analyze_diff(ref: "main..HEAD")
mcp__ruflo__hooks_worker-dispatch(trigger: "testgaps", context: "Pre-PR audit", priority: "high")
mcp__ruflo__hooks_worker-dispatch(trigger: "audit", context: "Pre-PR security", priority: "critical")
```

If `analyze_diff` returns an MCP runtime error such as `require is not defined`, treat Ruflo diff analysis as degraded for that session and fall back to `git diff --stat`, targeted file review, and the normal `bash scripts/pr-ready-check.sh` gate.

### After Major Refactors

```bash
npx ruflo@3.5.80 hooks pretrain
```

## Failure Modes

- If `pnpm codex:ruflo-check` reports missing, disabled, or wrong-version registration, run the remove/add repair commands it prints.
- After changing Codex MCP registration, start a fresh Codex session before judging MCP runtime behavior; an already-running MCP server process may keep serving the current session.
- If local `.mcp.json` and Codex registration drift, trust `scripts/check-codex-ruflo.sh` and re-register Ruflo from the check output.
- If CLI probes time out but MCP tools work, use MCP memory/search tools and record the CLI path as degraded.
- If MCP is unavailable, try the CLI for `memory search`, `security scan`, `daemon status`, and `hooks pretrain`.
- If a doc mentions Claude hooks or statusline behavior, assume that behavior is not available in Codex unless separately configured.
