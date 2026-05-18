---
title: 'Canvas Migration PR9 legacy cleanup SHIPPED + FrameView-preserve deviation'
purpose: decide
tier: card
status: active
date: 2026-05-08
topic: ['decisions', 'canvas', 'wall', 'azure']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas Migration PR9 legacy cleanup SHIPPED + FrameView-preserve deviation

[PR #142](https://github.com/jukka-matti/variscout/pull/142) (merge `fd2e9966`) deletes `packages/ui/src/components/LayeredProcessView/` (orphaned 5 files; 0 production callers post-Canvas migration; @variscout/ui tests 1709 → 1684) + the orphaned `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` deprecation stub (real component lives at `Canvas/internal/ProcessMapBase`; both pre-existing importers already used the canonical path). Sweeps 5 JSDoc references + the `docs/08-products/feature-parity.md` Operations-band row. Zero `LayeredProcessView` references remain in product code. **Deviation from canvas migration spec §6 PR9:** spec listed `apps/pwa/src/components/views/FrameView.tsx` + `apps/azure/src/components/editor/FrameView.tsx` for deletion; post-PR8 both are ~170-line thin route shells mounting `<CanvasWorkspace/>` (sub-PR 8e wired `onOpenWall` through them). PRESERVED both per `feedback_check_shipped_patterns_first` — the strangler-pattern's facade is the right home for store-wiring + tier guards, and inlining ~30 LOC into already-large `App.tsx` + `Editor.tsx` would violate the workflow's slice-size discipline for marginal gain. Vision §6's "delete legacy canvas-rendering surfaces in same PR as Canvas ships" commitment is honored by canvas-rendering having moved to `<CanvasWorkspace/>` — the FrameView shells now hold a different responsibility (route shell) than the original legacy `FrameView` (canvas renderer). **Closes the canvas-migration spec §6 PR9 row + completes the strangler pattern: Canvas is the only canvas-shaped surface in the codebase; LayeredProcessView + ProcessMapBase fully retired.** Plan at [`docs/superpowers/plans/2026-05-08-canvas-pr9-legacy-cleanup.md`](superpowers/plans/2026-05-08-canvas-pr9-legacy-cleanup.md). _Pinned 2026-05-08._
