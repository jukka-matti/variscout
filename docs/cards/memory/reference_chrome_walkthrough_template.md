---
title: 'Chrome walkthrough template'
description: 'Reusable Claude-in-Chrome bug-hunt walkthrough — syringe-barrel sample as canonical vehicle, 5-stage script covering FRAME→SCOUT→INVESTIGATE→IMPROVE'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, reference]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: e542af96-dc36-4a4e-8b24-bc9e16a30a87
---

> 🤖 **Generated mirror** of `~/.claude/memory/reference_chrome_walkthrough_template.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When the user asks for a chrome E2E walkthrough / spine bug-hunt:

- Drive via the **official Claude for Chrome extension** (`claude --chrome` or `/chrome` → Enabled), NOT `mcp__ruflo__browser_*`. Per `feedback_browser_e2e_use_official_extension.md`.
- Canonical seed dataset: `?sample=syringe-barrel-weight`. Pre-seeds 8 questions, 7 findings, 1 SuspectedCause hub (`hub-sbw-lot3-pressure`), 4 causal links — covers every spine surface in one load. IDs in `packages/data/src/samples/syringe-barrel-weight.ts:30`.
- 5-stage script template lives at `~/.claude/plans/lets-plan-a-test-graceful-creek.md` (created 2026-05-03):
  1. Boot & FRAME (2 min) — SW prompt loop, header chrome adapt
  2. SCOUT (3-5 min) — phase tabs in top bar, Time lens, NaN/Cpk/contrast checks
  3. INVESTIGATE (5-7 min) — Evidence Map seeded hub, edge interactions, EvidenceSheet, contribution language
  4. IMPROVE / Hub Capability (2-3 min) — 3 seeded ideas, structural-absence rendering, LayeredProcessView Operations band
  5. Persistence + reload (1 min) — session-only PWA, deterministic re-seed
- Output destination: punch-list goes into `docs/investigations.md` under a dated heading per CLAUDE.md (UX follow-ups not yet decisions).
- Severity tags used in punch list: `BLOCK` / `BUG` / `UX` / `POLISH`.

Reuse the plan file as a starting template; update Stage 2/3 surface-area bullets to match whichever recent PRs you're stress-testing.
