---
title: 'text-green-400 fails on light theme'
description: 'Standalone text-green-400 has ~2.8:1 contrast on light bg; always use paired text-green-700 dark:text-green-400 for label text'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 0ae19f95-e263-4761-a944-87c150a32a2f
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_green_400_light_contrast.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Never use `text-green-400` standalone for label text. Pair it: `text-green-700 dark:text-green-400`.

**Why:** `text-green-400` is ~`#4ade80` — inherently light and fails WCAG AA against the light-theme surface (contrast ~2.8:1, needs 4.5). The codebase already has many correct usages pairing it with `text-green-600 dark:text-green-400` or similar. The standalone form was scattered across ReportView, ImprovementPlan, and a couple of modals — fixed in PR #65 for the investigation/improvement path. User saw these as "white headings" during the syringe-demo browser walkthrough.

**How to apply:**
- Label / annotation text: `text-green-700 dark:text-green-400` (or `text-green-600` for slightly lighter label). Matches existing ReportView pattern.
- Icons and SVG strokes: leave `text-green-400` / `fill-green-400` alone — they're usually on dark surfaces or with sufficient tint backdrop.
- Tinted badges with `bg-green-500/15` and green text: text may be OK on the translucent bg; verify in `--chrome` before touching.
- Same logic for `text-red-400`, `text-amber-400` — apply the same paired pattern when used as standalone label text.
- ESLint doesn't catch this today — visual review during `--chrome` verification is the gate.
