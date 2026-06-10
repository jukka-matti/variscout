---
tier: living
purpose: build
title: 'CC-1 sustainment comparison sub-plan'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, sustainment, baseline, capability, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
implements:
  - docs/03-features/workflows/control.md
---

# CC-1 Sustainment Comparison

- [x] Add deterministic core tests for `freezeBaseline` and `computeSustainmentComparison` covering live/frozen baseline choice, no-specs, no-timeColumn, no post-improvement rows, phase limits, and defect breakdown.
- [x] Run the comparison test target and record the expected failing red state.
- [x] Implement `packages/core/src/control/comparison.ts` using `applyWindow` and `calculateStats` only.
- [x] Export the comparison types/helpers from the core root barrel.
- [x] Run scoped comparison tests, core build, and the required grep check.
- [x] Commit from the CC-1 worktree after branch guard passes.
