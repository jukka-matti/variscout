---
tier: living
purpose: build
title: 'CC-3 phase I-Chart sub-plan'
audience: agent
status: active
date: 2026-06-10
layer: spec
topic: [control, chart, ichart, phase-split, sustainment]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
implements:
  - docs/03-features/workflows/control.md
---

- [x] Ground in CC-3 plan/spec and charts package conventions.
- [x] Add failing `IChartRender.test.tsx` coverage for phase marker placement, phase-limit segments, clipped event flags, y-domain inclusion, and unchanged no-new-props control-line labels.
- [x] Implement additive I-Chart props/types without changing existing callers.
- [x] Render phase split marker, before/after phase-limit segments, and clipped event flags from ISO/index mapping independent of displayed tick text.
- [x] Include phase limits in I-Chart auto y-domain while preserving overrides/manual axis settings.
- [x] Run scoped charts tests/builds, branch guard, and commit from the CC-3 worktree.
