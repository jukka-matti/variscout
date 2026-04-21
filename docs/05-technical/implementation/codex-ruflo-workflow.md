---
title: 'Codex + Ruflo Workflow'
audience: [developer]
category: implementation
status: stable
---

# Codex + Ruflo Workflow

How to use Codex with the shared ruflo tooling in this repo.

## What Is Shared vs Client-Specific

- Shared: `.mcp.json` starts the `ruflo` MCP server for this repo.
- Shared: ruflo memory, workers, diff analysis, and CLI commands.
- Claude-only: `.claude/settings.json` hooks, statusline, and path-scoped rule loading.
- Codex-specific: `AGENTS.md` is the repo entrypoint and Codex MCP registration may need manual verification.

## Startup Checklist

1. Read `AGENTS.md` and `docs/llms.txt`.
2. Verify MCP registration with `codex mcp list`.
3. If `ruflo` is missing, run `codex mcp add ruflo -- npx ruflo@3.5.42 mcp start`.

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

### Before Opening A PR

Use the same shared ruflo checks:

```text
mcp__ruflo__analyze_diff(ref: "main..HEAD")
mcp__ruflo__hooks_worker-dispatch(trigger: "testgaps", context: "Pre-PR audit", priority: "high")
mcp__ruflo__hooks_worker-dispatch(trigger: "audit", context: "Pre-PR security", priority: "critical")
```

### After Major Refactors

```bash
npx ruflo@3.5.42 hooks pretrain
```

## Failure Modes

- If `codex mcp list` does not show `ruflo`, add it manually.
- If MCP is unavailable, the CLI still works for `memory search`, `security scan`, `daemon status`, and `hooks pretrain`.
- If a doc mentions Claude hooks or statusline behavior, assume that behavior is not available in Codex unless separately configured.
