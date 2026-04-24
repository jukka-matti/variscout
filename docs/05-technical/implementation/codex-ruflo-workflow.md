---
title: 'Codex + Ruflo Workflow'
audience: [developer]
category: implementation
status: stable
---

# Codex + Ruflo Workflow

How to use Codex with the shared ruflo tooling in this repo.

## What Is Shared vs Client-Specific

- Shared: `.mcp.json` pins the repo-owned `ruflo` launch command and version.
- Shared: ruflo memory, workers, diff analysis, and CLI commands.
- Claude-only: `.claude/settings.json` hooks, statusline, and path-scoped rule loading.
- Codex-specific: `AGENTS.md` is the repo entrypoint, and active MCP registration is managed through Codex config plus `codex mcp`.

## Startup Checklist

1. Read `AGENTS.md` and `docs/llms.txt`.
2. Run `pnpm codex:ruflo-check` to verify Codex registration and print the recovery command if needed.
3. If `ruflo` is missing, run `codex mcp add ruflo -- npx ruflo@3.5.80 mcp start`.

The practical Codex source of truth is `codex mcp get ruflo`, which reads the active Codex MCP configuration on your machine. The repo still keeps `.mcp.json` as the pinned shared Ruflo definition.

## Recommended Codex Workflow

### Before Starting Non-Trivial Work

Use ruflo memory explicitly:

```text
mcp__ruflo__memory_search(query: "Azure authentication", namespace: "domain")
mcp__ruflo__memory_search(query: "Cpk calculation stats", namespace: "architecture")
mcp__ruflo__memory_search(query: "similar feature patterns", namespace: "decisions")
```

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

### After Major Refactors

```bash
npx ruflo@3.5.80 hooks pretrain
```

## Failure Modes

- If `pnpm codex:ruflo-check` reports missing registration, add Ruflo manually with `codex mcp add ruflo -- npx ruflo@3.5.80 mcp start`.
- If `.mcp.json` and Codex registration drift, trust the repo-pinned command/version and re-register Ruflo from the repo instructions.
- If MCP is unavailable, the CLI still works for `memory search`, `security scan`, `daemon status`, and `hooks pretrain`.
- If a doc mentions Claude hooks or statusline behavior, assume that behavior is not available in Codex unless separately configured.
