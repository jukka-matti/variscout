---
tier: living
purpose: build
title: 'CC-4 verification band sub-plan'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, sustainment, verification-band, ui, hooks]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/superpowers/plans/2026-06-10-cc-1-sustainment-comparison.md
  - docs/superpowers/plans/2026-06-10-cc-2-control-model-cascade.md
  - docs/superpowers/plans/2026-06-10-cc-3-phase-ichart.md
implements:
  - docs/03-features/workflows/control.md
---

# CC-4 Verification Band

> Execute from `.worktrees/codex/cc-4-verification-band` on branch `codex/cc-4-verification-band`. Keep the band props-based; apps own raw data, spec lookup, and modal routing.

**Goal:** Add the Control verification band from spec §6, backed by `computeSustainmentComparison`, and mount it in Azure and PWA Control surfaces.

**Architecture:** `@variscout/hooks` computes comparisons from current rows and record inputs. `@variscout/ui` renders the presentational band and chart annotations from props. Apps pass `rawData`, `timeColumn`, optional specs, records, and reviews; app callbacks open the existing CC-2 review logger.

---

- [x] Grounding: read master plan CC-4, spec §6, CC-1/CC-2/CC-3 outputs, package `CLAUDE.md`, current `ProcessHubControlRegion`, app `ControlPanel`, `useControlPanelModel`, and current chart exports.
- [x] TDD red: add hook tests for live comparison, no-record/null rows, specs passthrough, and memoized recompute on raw data/record changes.
- [x] TDD red: add `ControlVerificationBand` RTL tests for continuous band, no-after rows empty state, frozen baseline label, re-check flags, and ladder-walked soft close hint.
- [x] TDD red: update Azure `ProcessHubControlRegion` tests and Azure/PWA `ControlPanel` tests to expect the band and log-recheck wiring.
- [x] Implement `useSustainmentComparison` in `packages/hooks`, exported from `@variscout/hooks`.
- [x] Implement `ControlVerificationBand` in `packages/ui`, exported from `@variscout/ui`; use existing chart primitives when available and keep fallback summary states deterministic.
- [x] Mount the band in Azure `ProcessHubControlRegion`, Azure Control panel, and PWA Control panel with app-provided `rawData`, `timeColumn`, specs, record, and reviews.
- [x] Verification: run hooks band tests, UI band tests, Azure/PWA control panel tests, Azure `ProcessHubControlRegion` tests, then `pnpm build`.
- [x] Final gate: run `bash scripts/pr-ready-check.sh`, commit from this worktree after branch guard, open PR, wait for checks, merge with `gh pr merge --merge --delete-branch`.
