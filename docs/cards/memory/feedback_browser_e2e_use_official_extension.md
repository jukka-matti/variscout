---
title: 'Browser E2E uses official Claude for Chrome extension'
description: 'For browser-assisted E2E testing in this project, use the official Anthropic Claude for Chrome extension (claude --chrome). Do NOT default to mcp__ruflo__browser_* tools.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: a723549fc440716b
origin-session-id: c0f7e356-bdd1-4ad2-b72d-a58d3eea0d41
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_browser_e2e_use_official_extension.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

For browser-assisted E2E testing in VariScout, use the **official [Claude for Chrome](https://claude.com/claude-for-chrome) extension** (start with `claude --chrome`, or `/chrome` → Enabled by default). This is the canonical browser path — it drives the user's real Chrome with their login state, bookmarks, and devtools console access.

**Why:** Real-Chrome control means the user can react to what they see and the agent inherits real browser context. Per the [official docs](https://code.claude.com/docs/en/chrome): "Connect Claude Code to your Chrome browser to test web apps, debug with console logs, automate form filling, and extract data from web pages."

**How to apply:** When asked to test a UI flow, verify a CSS/layout change, or walk an end-to-end scenario:
1. Check whether `chrome_*` tools are loaded (the official extension exposes those).
2. If not, ask the user to start with `claude --chrome` or run `/chrome` and select "Enabled by default" — don't silently fall back to ruflo browser tools.

**Do NOT use `mcp__ruflo__browser_*` MCP tools for E2E.** Those drive a separate headless-Chromium agent stack (different UX, no real browser state, slower iteration). They are technically functional, but they're the wrong tool for this job.

Reserve the ruflo MCP for non-browser purposes only:
- `mcp__ruflo__memory_*` — semantic memory search/store
- `mcp__ruflo__agentdb_*` — vector DB
- `mcp__ruflo__hooks_*` — hooks coordination
- `mcp__ruflo__autopilot_*`, `mcp__ruflo__claims_*`, etc.

See `.claude/skills/using-ruflo/SKILL.md` for the legitimate ruflo MCP scope.

Origin: 2026-05-03 conversation. I had been driving the PWA at localhost:5173 via `mcp__ruflo__browser_*` for an hour before the user pushed back: *"check from internet info — there is the claude --chrome extension, right? so we should use that for browser testing!"* CLAUDE.md (root) was updated in the same exchange to make the canonical path explicit and to flag the ruflo browser MCP as "don't use for E2E".
