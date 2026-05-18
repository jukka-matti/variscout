---
title: 'Constitution amendments (2026-04-16)'
description: 'Post-pivot alignment of Principles 2, 3, 5, 7 — removed stale Teams/OneDrive references, added three question entry points, tier infrastructure distinctions'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 1c65ea9170a0e204
origin-session-id: b7106bf7-e1bf-474a-969a-12214772d5ef
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_constitution_amendments_apr16.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## Amendments applied 2026-04-16

- **Principle 2** — "Same analysis everywhere"; tier differences split (PWA session-only → Azure Standard local+AI → Azure Team cloud+KB)
- **Principle 3** — Data movement: "Blob Storage sync, AI calls" (dropped Teams/OneDrive after ADR-059)
- **Principle 5** — "Questions drive investigation"; three entry points named: upfront hypotheses (FRAME), evidence-ranked (Factor Intelligence), observation-triggered (Four Lenses + new QuestionLinkPrompt)
- **Principle 7** — Dropped "through Teams" task routing; web-first collaboration mechanisms

## Paired implementation

- `QuestionLinkPrompt` component + `sessionStore.skipQuestionLinkPrompt` flag + PWA/Azure wiring (commits 4c5e109d → afdf1dd9)
- Commit: `git log --oneline e7fdfedd..HEAD -- docs/01-vision/constitution.md`

## Why: relevance for future work

- Do NOT reintroduce Teams-specific language in principles (ADR-059 is canonical pivot)
- The three question entry points are now FIRST-CLASS — future AI coaching, UX, and feature decisions must respect all three pathways
- business-bible.md STILL has stale Teams references (deferred; flagged in prior session)
