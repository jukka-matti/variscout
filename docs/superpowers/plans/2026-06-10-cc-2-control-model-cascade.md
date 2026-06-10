---
tier: living
purpose: build
title: 'CC-2 control model cascade sub-plan'
audience: agent
status: delivered
date: 2026-06-10
layer: spec
topic: [control, sustainment, model, persistence, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/superpowers/plans/2026-06-10-cc-1-sustainment-comparison.md
implements:
  - docs/03-features/workflows/control.md
  - docs/03-features/workflows/report.md
---

# CC-2 Control Model Cascade

> **For agentic workers:** execute from `.worktrees/codex/cc-2-control-model-cascade` on branch `codex/cc-2-control-model-cascade`. This is an atomic deletion cascade: keep edits surgical, preserve RPT-1/CC-1/CC-3 changes, and verify every consumer before committing.

**Goal:** Replace the cadence/tick Control model with analyst-owned re-checks, baseline/ladder fields, simplified handoffs, and no automatic verdict/status writes from evidence ingestion.

**Architecture:** Core owns the narrowed model and pure ladder helpers. PWA/Azure reducers persist explicit analyst actions only. Shared hook/UI/app surfaces render an interim status line until CC-4/CC-5 supply the full verification band and editors.

**Tech Stack:** TypeScript, React, Vitest, Dexie, `@variscout/core`, `@variscout/hooks`, `@variscout/ui`, PWA and Azure app persistence.

---

- [x] Grounding: read `AGENTS.md`, `docs/llms.txt`, master plan CC-2, spec §4/§2 D2-D5, package `CLAUDE.md` files, run `pnpm codex:ruflo-check`, run `gh pr list`, and inventory Control references with `rg`.
- [x] TDD red: rewrite `packages/core/src/__tests__/control.test.ts` around `isCheckSuggested`, `advanceLadder`, `resetLadder`, narrowed review verdicts, simplified handoff shape, and new metadata projection shape; run the focused core test and capture the expected failures.
- [x] TDD red: update `packages/core/src/actions/__tests__/controlActions.test.ts` plus action exhaustiveness tests to require `SUSTAINMENT_RECHECK_LOGGED` and reject tick evaluation; run the focused action tests and capture the expected failures.
- [x] TDD red: update Azure/PWA `applyAction.control` suites so snapshot ingestion stores evidence without mutating Control records/reviews and `SUSTAINMENT_RECHECK_LOGGED` writes the analyst record/review pair atomically; run both focused suites and capture the expected failures.
- [x] TDD red: update schema/storage tests for the new Control fields, removed `nextReviewDue`/handoff-status indexes, and `ControlMetadataProjection` ladder/status fields; run focused schema/storage tests and capture the expected failures.
- [x] TDD red: update shared hook/UI/app Control tests for the interim status line, removed cadence/tick controls, simplified handoff editor, and preserved control-readiness negative controls; run focused suites and capture the expected failures.
- [x] Implement core model: reshape `ControlRecord`, `ControlReview`, `ControlHandoff`, `ControlMetadataProjection`; delete cadence/tick/due helpers; add `isCheckSuggested`, `advanceLadder`, and `resetLadder`; update root exports.
- [x] Implement action cascade: replace `SUSTAINMENT_TICK_EVALUATED` with `SUSTAINMENT_RECHECK_LOGGED`, remove handoff acknowledge/operational action kinds, and update exhaustive action tests.
- [x] Implement persistence cascade: update PWA/Azure `applyAction.ts` handlers, remove automatic Control evaluation from evidence snapshot ingestion, update Dexie schemas/index tests, and preserve project metadata merge behavior with the new projection fields.
- [x] Implement consumer cascade: update `useControlPanelModel`, `ControlForm`, Azure `ControlRecordEditor`, `ControlReviewLogger`, `ControlHandoffEditor`, `ProcessHubControlRegion`, both app Control panels, `Editor.tsx` closure inputs, surveys, report labels, and IP detail Control components.
- [x] Verification: run focused core control tests and control readiness negative-control tests, both app `applyAction.control` suites, schema tests, Azure storage/localDb tests, shared hook tests, and Control UI tests.
- [x] Acceptance grep: `rg "consecutiveOnTargetTicks|ControlCadence|applyControlTick|evaluateSustainmentSnapshot|nextDueFromCadence|isControlOverdue|ownerAcknowledgement|retainControlReview|SUSTAINMENT_TICK_EVALUATED" packages apps` returns no hits.
- [x] Final gate: run `bash scripts/pr-ready-check.sh` if focused gates pass and runtime is acceptable; before commit run `pwd` and `git rev-parse --abbrev-ref HEAD`, then commit locally without pushing.
