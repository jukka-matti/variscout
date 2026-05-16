---
tier: living
purpose: system
title: Codex-Only Ruflo Migration Guide
audience: human
category: implementation
status: active
---

# Codex-Only Ruflo Migration Guide

Use this checklist when another project should keep Ruflo available to Codex while removing all Claude Code exposure. The goal is one active owner: Codex MCP registration. Claude Code may keep its own native rules, skills, hooks, statusline, and local settings, but it must not load or authorize Ruflo.

## Target State

- Codex owns Ruflo through `codex mcp add` and user-level Codex config.
- The repo tracks a Codex health check that pins the expected Ruflo version and prints repair commands.
- Claude Code has no project `.mcp.json` Ruflo server, no Ruflo or Claude Flow hooks, no `mcp__ruflo__*` or `mcp__claude-flow__*` permissions, no Ruflo attribution, and no project skills that route Claude work to Ruflo.
- Ruflo is not a root package dependency unless the application runtime itself imports it.
- Historical docs mention older Claude usage only when clearly marked as superseded.

## Migration Steps

1. Identify every active entry point:
   - Project MCP files: `.mcp.json`, `.cursor/mcp.json`, or equivalent.
   - Claude settings: `.claude/settings.json` and ignored `.claude/settings.local.json`.
   - Claude commands, agents, skills, hooks, and statusline scripts.
   - Package scripts and dependencies that install or run Ruflo.
   - Docs that tell Claude Code to use Ruflo.

2. Move version authority to Codex:
   - Keep a script like `scripts/check-codex-ruflo.sh`.
   - Verify `codex mcp get ruflo` or equivalent user-level Codex config.
   - Print explicit repair commands using a pinned command such as `npx --yes ruflo@<version> mcp start`.
   - Add a package script like `pnpm codex:ruflo-check`.

3. Remove Claude active integration:
   - Delete project `.mcp.json` Ruflo registration.
   - Remove Claude hooks that call Ruflo directly or use `mcp_tool` with the Ruflo server.
   - Remove `mcp__ruflo__*`, `mcp__claude-flow__*`, and direct `npx`/`pnpm exec ruflo` permissions from Claude settings.
   - Remove Ruflo-generated attribution and Claude Flow environment variables.
   - Delete Claude skills, agents, and command packs that exist only to operate Ruflo, Claude Flow, AgentDB, swarm orchestration, or SPARC workflows.

4. Keep Claude-native behavior intact:
   - Preserve project rules, statusline, quality hooks, and local workflow skills that do not expose Ruflo.
   - Document that Claude Code uses its native project assets and does not use Ruflo in this repo.

5. Remove repo/package coupling:
   - Remove `ruflo` from root devDependencies when only Codex MCP needs it.
   - Regenerate the lockfile.
   - Update drift checks to scan Codex docs/scripts, not Claude project config.
   - Rename generic "Ruflo drift" labels to "Codex Ruflo drift" so ownership is explicit.

6. Update docs and decisions:
   - Add an ADR amendment with the migration date and new ownership rule.
   - Update agent entrypoints (`AGENTS.md`, `CLAUDE.md`, `docs/llms.txt`) so Codex and Claude have separate responsibilities.
   - Update implementation docs to say Codex MCP is the only supported Ruflo path.
   - Replace direct shell Ruflo commands in operational docs with MCP tool usage or non-Ruflo alternatives.

7. Clean ignored local state:
   - Remove or empty local ignored `.mcp.json` files so Claude Code does not load project Ruflo.
   - Strip Ruflo and Claude Flow permissions from ignored Claude local settings.
   - Review ignored `.claude/commands` and `.claude/agents`; remove local command packs only when they are clearly Ruflo/Claude Flow specific.

## Search Checks

Run these searches before merging:

```sh
rg -n "mcp__ruflo|mcp__claude-flow|pnpm exec ruflo|CLAUDE_FLOW|Co-Authored-By: ruflo|Generated with \[ruflo\]" .claude CLAUDE.md docs scripts package.json
rg -n "ruflo|Ruflo" AGENTS.md docs/05-technical scripts package.json
rg -n "^\\s+ruflo:|/ruflo@| ruflo@" pnpm-lock.yaml package.json
```

Expected result:

- No Claude-side active integration remains.
- Remaining Ruflo references are Codex-only docs, Codex health checks, or clearly marked historical notes.
- The lockfile and package manifest no longer install Ruflo for the repo unless the app imports it directly.

## Validation

Use the project equivalent of:

```sh
pnpm install --lockfile-only
pnpm codex:ruflo-check
pnpm docs:check
pnpm build
pnpm test
```

If tests require local server binds, run them in an environment that allows the test server to listen on localhost. Treat sandbox bind failures separately from product test failures, but do not merge until the suite has either passed in a suitable environment or the exception is explicitly accepted.
