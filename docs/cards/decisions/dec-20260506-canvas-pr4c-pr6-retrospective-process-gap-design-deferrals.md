---
title: 'Canvas PR4c-PR6 retrospective: process gap + design deferrals'
purpose: decide
tier: card
status: active
date: 2026-05-06
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas PR4c-PR6 retrospective: process gap + design deferrals

Codex shipped PR1+PR2+PR3 (#126), PR4a (#127), PR4b (#128) through the proper PR workflow with subagent code review, then bypassed the workflow for PR4c (`a2f88d60`), PR5 (`2c010f29` + `36727ad0` + `2820afb1`), and PR6 (`8b4aad68`) — five direct-to-main commits without brainstorming Spec 3 (cards / drill-down / mode lenses) or Spec 4 (canvas overlays + Wall sync). Three retrospective reviewers (architecture / design / code-quality) ran 2026-05-06: **architecture intact** (three-layer state, ADR-073/074/078 honored, CRDT readiness, Wall destination preserved), **one critical bug** (`onUngroupSubStep` wired through `CanvasWorkspace` but silently dropped at `Canvas` boundary; users can group sub-steps but cannot ungroup), **11 hardcoded palette colors** in `@variscout/ui` (violates "no per-component palette colors" hard rule + `feedback_green_400_light_contrast`), **`<article role="button">` semantic mismatch**, **`useCanvasStore.getState()` in useEffect** (quasi-render-path violation), **6 unmet vision-spec commitments** (time-series mini-chart §5.2, drift indicator §5.2, mode-aware CTAs §5.3+§2.4, hypothesis-arrow drawing §3.4, Wall mirror §5.6, levels-as-pan/zoom §5.4), **no retroactive Spec 3 / Spec 4 docs**, **`packages/stores/CLAUDE.md` + root `CLAUDE.md` + `apps/pwa/CLAUDE.md` say "4 domain Zustand stores"** but `canvasStore` shipped as the 5th. **Decision: Tier 1 + Tier 3 land as a focused followup PR per `docs/superpowers/plans/2026-05-06-canvas-pr4c-pr6-followup.md`** (critical bug fix + palette replacements + role=button + getState→selector + retroactive Spec 3/4 design docs + CLAUDE.md sync). **Tier 2 vision-spec gaps tracked as 6 entries in `docs/investigations.md`; bundled into a new PR8 — Vision Alignment phase** (multi-sub-PR 8a-8f) inserted between PR7 (Spec 5 persistence) and PR9 (legacy cleanup, renumbered from PR8). The canvas migration sequence becomes 9 phases. **Process commitment going forward:** PR7 (Spec 5 PWA persistence) and PR8 sub-phases honor the brainstorm-first + branch → PR → review → squash-merge workflow per CLAUDE.md root rules. Direct-to-main on product code is acknowledged as a process drift, not retroactively re-branched. _Pinned 2026-05-06._
