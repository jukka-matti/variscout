---
title: 'Verify visual changes before pushing'
description: 'Always verify CSS/layout fixes visually before committing — theoretical correctness is not enough'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3b407ce59553e95a
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_verify_before_push.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Never push CSS or layout fixes without visual verification first.

**Why:** In a previous session, h-dvh + absolute inset-0 fixes were committed and pushed based on theoretical correctness, but the dashboard was still broken when the user checked. This wasted time and eroded trust.

**How to apply:**
- Before committing any visual/layout change: use `--chrome` browser tools or ask the user to verify on localhost
- If browser tools aren't available, at minimum inject a diagnostic script to read computed styles
- "The CSS is correct in theory" is never sufficient — verify the actual rendered DOM
