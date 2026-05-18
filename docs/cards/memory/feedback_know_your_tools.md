---
title: 'Know available tools before attempting workarounds'
description: 'Check mcp__claude-in-chrome__ tools or --chrome flag before trying playwright/ruflo browser hacks'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_know_your_tools.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When browser interaction is needed, use the correct tool immediately — don't fumble through alternatives.

**Why:** A session wasted ~10 minutes trying ruflo browser MCP, direct playwright require, npx playwright, and sleep-polling before discovering `--chrome` was needed. The user had to intervene.

**How to apply:**
- For browser testing: use `mcp__claude-in-chrome__*` tools (requires `--chrome` flag or `/chrome` command)
- If those aren't available, tell the user immediately rather than trying 4 workarounds
- Never use `sleep` + `cat` polling for background tasks — use `run_in_background` and wait for notification
