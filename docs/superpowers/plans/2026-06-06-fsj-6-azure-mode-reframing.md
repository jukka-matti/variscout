---
tier: ephemeral
purpose: build
title: 'FSJ-6 — Azure mode re-framing'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# FSJ-6: Azure Mode Re-Framing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Azure mirrors FSJ-4/5: detection-shaped fresh pastes land at b0 with quiet time chips and loud re-framing banners, accept actions re-frame b0, and old Azure detection modal mounts retire.

**Architecture:** Reuse shared FSJ-4/5 infrastructure (`detectStepTimestampPairs`, `deriveB0ModeCandidates`, `CanvasWorkspace` b0 slots, `FrameViewB0` slot props). Azure owns app-shell state and banner rendering in `useEditorDataFlow`, `FrameView`, and `Editor`; no PWA edits.

**Tech Stack:** React + Zustand, `@variscout/core` detection/defect helpers, shared `@variscout/ui` b0 composition, Azure Vitest/RTL, scoped Azure Playwright.

**Branch:** `feat/fsj-6-azure-mode-reframing` in `.worktrees/feat-fsj-6-azure-mode-reframing/`.

---

## Grounded Decisions

1. Azure routing currently excludes defect and wide pastes from b0: `landsAtB0 = !reingest && !isDefectFormat && !isWideFormat && confidence !== 'low'` in `apps/azure/src/features/data-flow/useEditorDataFlow.ts`.
2. Shared step-timestamp behavior already exists: `CanvasWorkspace` detects `detectStepTimestampPairs`, renders the loud banner, creates steps, opens `StepTimingsModal`, and lands L2. Azure must not duplicate it.
3. Shared b0 candidate derivation already exists: `deriveB0ModeCandidates` handles defect derived metrics and performance sibling exclusion. Azure must pass `analysisMode`, `defectMapping`, and `measureColumns` into `CanvasWorkspace`.
4. Azure still mounts `DefectDetectedModal` and `CapabilitySuggestionModal` through `EditorModals`. FSJ-6 retires those Azure mounts only; shared UI component cleanup is deferred.
5. Azure-specific behavior change: wide detections no longer silently auto-apply performance mode at paste time. The b0 performance banner replaces that mutation; accept writes `analysisMode='performance'`.
6. Fences: no `apps/pwa`, no match-summary cascade beyond preserving `reingest` flags, no existing-project landing change, no manual entry change, no capture grammar.

## Tasks

### Task 1: Azure paste-flow detection state and routing

**Files:**

- Modify: `apps/azure/src/features/data-flow/useEditorDataFlow.ts`
- Test: `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.landing.test.ts`
- Test: `apps/azure/src/hooks/__tests__/useEditorDataFlow.test.ts`

- [ ] Write failing tests that defect-shaped and wide-shaped fresh pastes land at b0, keep detection state, call `onFreshPasteLanded`, and do not open mapping.
- [ ] Write/update failing tests that wide paste does not call `setAnalysisMode('performance')` or `setMeasureColumns` until banner accept.
- [ ] Write failing test that quiet time extraction auto-applies Month + DayOfWeek only, excludes Year, exposes chip metadata, and Undo removes derived columns/factors.
- [ ] Verify red with `pnpm --filter @variscout/azure-app test -- --run src/features/data-flow/__tests__/useEditorDataFlow.landing.test.ts src/hooks/__tests__/useEditorDataFlow.test.ts`.
- [ ] Add Azure `wideFormatDetection`, dismiss handler, quiet-time chip state, dismiss, and undo handlers to `UseEditorDataFlowReturn`.
- [ ] Change fresh routing to `!opts?.reingest && (detected.confidence !== 'low' || defectResult.isDefectFormat || wideFormat.isWideFormat)`.
- [ ] On b0 landing, set defect/wide detection state before `PASTE_LANDED`, auto-apply quiet time columns with `extractYear: false`, and never auto-set performance mode.
- [ ] Preserve low-confidence no-detection wizard path and match-summary `{ reingest: true }` fencing.
- [ ] Verify green with the same command.
- [ ] Branch guard, then commit: `feat(azure): land mode detections on b0`.

### Task 2: Azure b0 mode banners and quiet time chip

**Files:**

- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Test: Azure FrameView component/integration test file found during implementation.

- [ ] Write failing tests that the defect banner renders in `frame-view-b0-top-bar`, expands inline, accepts mapping, and dismisses.
- [ ] Write failing tests that the performance banner renders, accepts channels with label `Channel`, dismisses, and secondary stack action opens `Fix data...`.
- [ ] Write failing test that quiet time chip renders, dismisses, and calls Undo.
- [ ] Verify red with the targeted FrameView test command.
- [ ] Add Azure-local `B0DefectModeBanner` and `B0PerformanceModeBanner`, modeled on PWA but kept in Azure.
- [ ] Extend `FrameViewProps` with defect/wide detection props, accept/dismiss callbacks, quiet chip props, and mode props.
- [ ] Render banners and quiet chip inside existing `b0Slots.topBar`, preserving provenance and `Fix data...`.
- [ ] Pass `analysisMode`, `defectMapping`, and `measureColumns` into `CanvasWorkspace`.
- [ ] Verify green with targeted tests.
- [ ] Branch guard, then commit: `feat(azure): render b0 mode re-framing banners`.

### Task 3: Editor wiring and modal mount retirement

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify/Delete: `apps/azure/src/components/editor/EditorModals.tsx` only if it becomes unused.
- Test: `apps/azure/src/pages/__tests__/Editor.test.tsx`
- Test: relevant editor modal/component tests if present.

- [ ] Write failing tests that defect accept computes defect rates, writes `defectMapping`, pins outcome to the derived defect metric, sets `analysisMode='defect'`, and clears detection.
- [ ] Write failing tests that wide accept writes `measureColumns`, `measureLabel`, `analysisMode='performance'`, and clears detection.
- [ ] Write failing test that no `DefectDetectedModal` or `CapabilitySuggestionModal` mount appears over b0.
- [ ] Verify red with `pnpm --filter @variscout/azure-app test -- --run src/pages/__tests__/Editor.test.tsx`.
- [ ] Thread `dataFlow.defectDetection`, `dataFlow.wideFormatDetection`, quiet chip props, and accept/dismiss callbacks into `FrameView`.
- [ ] Wire defect accept with `computeDefectRates(rawData, mapping)`, `setDefectMapping`, `setOutcome(result.outcomeColumn)`, `setAnalysisMode('defect')`, and dismiss.
- [ ] Wire wide accept with detected columns, `setMeasureColumns`, `setMeasureLabel('Channel')`, `setAnalysisMode('performance')`, and dismiss.
- [ ] Remove Azure `EditorModals` mount/import usage for defect and capability suggestions; leave shared modal components untouched.
- [ ] Verify green with targeted tests.
- [ ] Branch guard, then commit: `feat(azure): retire detection modal mounts`.

### Task 4: Scoped Azure e2e update

**Files:**

- Modify: `apps/azure/e2e/modeB-framing.spec.ts`
- Modify helpers only if the directly broken test requires it.

- [ ] Update only the detection-fixture test so it expects b0 loud banner behavior instead of defect modal/wizard behavior.
- [ ] Do not rewrite the e2e spine; FSJ-10 owns broad helper cleanup.
- [ ] Run touched spec via the Azure e2e command used in the repo.
- [ ] Branch guard, then commit: `test(azure-e2e): expect detection banners on b0`.

### Task 5: Final verification, adversarial review, PR, merge

- [ ] Confirm `git diff --name-only origin/main...HEAD` contains no `apps/pwa` files.
- [ ] Run targeted suites:
  - `pnpm --filter @variscout/azure-app test -- --run src/features/data-flow`
  - `pnpm --filter @variscout/azure-app test -- --run src/components/editor src/pages/__tests__/Editor`
  - `pnpm --filter @variscout/core test -- --run deriveB0ModeCandidates detectStepTimestampPairs`
  - `pnpm --filter @variscout/ui test -- --run CanvasWorkspace`
- [ ] Run `bash scripts/pr-ready-check.sh` and require green.
- [ ] Spawn adversarial-review subagent over `origin/main...HEAD`: find missed behavior, vacuous tests, fenced zones touched, spec contradictions, Azure/PWA divergence gaps.
- [ ] Fix findings, rerun affected tests and final gate.
- [ ] Push branch, create PR. PR body must include grounding corrections, task list, test counts, OWNER-CALL-PENDING, behavior change note for wide confirm-not-auto, and live-verification checklist including defect-confirm wireframe walk.
- [ ] Merge with `gh pr merge --merge --delete-branch`; never squash.
- [ ] Leave the worktree in place for end-of-plan audit.

## Self-Review Notes

- P5 vocabulary: avoid forbidden terminology in code, comments, tests, and UI copy.
- OWNER-CALL-PENDING default: defect confirm remains inline under the b0 banner, per `docs/02-journeys/wireframes/defect-confirm.md`.
- Step-timestamps require no Azure-specific implementation beyond letting shared `CanvasWorkspace` receive the same data and b0 props.
