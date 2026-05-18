---
title: 'Ruflo CLI long-write hangs while MCP server is active'
description: 'Long-content npx ruflo memory writes from a session shell hang at 0% CPU when the MCP server is running. Use mcp__ruflo__* tools in-session; CLI is fallback only.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 0e9dc6bb8c75c293
origin-session-id: 2b19bf38-eb48-4091-80be-723e7510adae
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_ruflo_cli_lock.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Specific failure mode observed 2026-04-26: four `npx ruflo@3.5.80 memory store --namespace architecture --key X --value "<multi-paragraph string>"` invocations dispatched serially from session Bash hung 15+ minutes at 0% CPU. The data did land (verified via `mcp__ruflo__memory_search`), but the processes never returned. After `pkill`, they exited with status 0.

**Why:** the long-running ruflo MCP server (`npx ruflo@3.5.80 mcp start`) holds a connection to `.ruflo/`'s SQLite store. Long-content user-shell writes contend on the same store and block. Per ruflo's own v3.5 release notes, CLI startup target is **<500ms** — so the 15-minute hangs were abnormal and tied to this specific contention pattern, not a general "CLI is broken" failure.

**This is NOT about hooks.** The per-event hooks in `.claude/settings.json` (pre-edit, post-edit, pre-task, etc.) ran fine throughout the same session — they're short, `timeout: 5000` + `continueOnError: true`, and `/tmp/ruflo-hooks.log` stayed at 0 bytes. Ruflo's official design (its own `CLAUDE.md`) explicitly requires CLI for hooks: "Keep MCP for coordination strategy only — Hook Commands run via npx CLI, not MCP tools."

**How to apply:**

- In-session user ops (search, store, pretrain): use `mcp__ruflo__memory_search`, `mcp__ruflo__memory_store`, `mcp__ruflo__hooks_pretrain`. ~200ms typical.
- Long-content writes (multi-paragraph values): always MCP, never CLI from session shell.
- CLI is the documented fallback for **non-MCP environments only** (Codex without MCP registered, scripts, CI). Don't reach for `npx ruflo memory store ...` in an interactive Claude Code session.
- Never dispatch CLI memory writes in parallel from session bash — observed pathology (2026-04-26).
- Don't disable the per-event hooks. They're the learning ingestion path that makes MCP queries useful over time.

**Pointer:** Updated 2026-04-26 after dropping the `Notification` → `memory_store` hook from `.claude/settings.json` (it had no documented read-side consumer and was the same write shape that hung).

**Update 2026-05-13:** VariScout removed all in-session ruflo CLI use. Docs (`.claude/skills/using-ruflo/SKILL.md`, `docs/05-technical/implementation/ruflo*.md`) no longer document a CLI fallback. `scripts/check-codex-ruflo.sh` no longer runs CLI smoke probes. Lifecycle hooks in `.claude/settings.json` (PreToolUse, PostToolUse, UserPromptSubmit, Stop) migrated to Anthropic-native `type: "mcp_tool"` calling `mcp__ruflo__hooks_*` directly. **Sole remaining CLI invocation**: `SessionStart → pnpm exec ruflo daemon start --quiet`, which has to bootstrap the worker daemon before MCP connects (Anthropic docs explicitly warn SessionStart fires before MCP servers finish connecting). Codex asymmetry note: Codex hooks (`developers.openai.com/codex/hooks`) only support `type: "command"`; if a Codex `hooks.json` is ever wired, it MUST shell out — that's an OpenAI-side limitation, not a regression in our policy.
