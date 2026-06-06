---
tier: ephemeral
purpose: build
title: 'FSJ-5 — PWA mode re-framing'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
  - docs/02-journeys/wireframes/defect-confirm.md
---

# FSJ-5: PWA Mode Re-Framing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA defect and wide/multi-channel paste detections land on b0 as loud banners, then re-frame b0 on accept (`defect` derived metric Y picker, `performance` channel-set framing) without any detection modal over the landing surface.

**Architecture:** Keep detection state in `usePasteImportFlow`, but route fresh defect/wide pastes through the same Process b0 landing callback as measurement pastes. PWA `FrameView` renders mode suggestion banners inside the existing FSJ-4 `b0Slots.topBar`. Shared candidate plumbing moves b0 candidate derivation behind a pure core helper so defect mode can rank `DefectRate`/`DefectCount` from transformed rows and performance mode can exclude accepted channel siblings from ordinary Y/X lists. Azure render sites stay compiling through optional props only; Azure behavior waits for FSJ-6.

**Tech Stack:** React + Zustand, `@variscout/core` parser/defect helpers, `@variscout/ui` b0 composition, PWA hook wiring, Vitest + RTL, branch-guarded git commits.

**Branch:** `feat/fsj-5-pwa-mode-reframing` in `.worktrees/feat-fsj-5-pwa-mode-reframing/`.

---

## Grounded Design Decisions

1. **Hard docs gate is complete before product code.** The review contract is `docs/02-journeys/wireframes/defect-confirm.md`; it is linked from the wireframes index and spec §4.2a.
2. **Fresh defect/wide currently do not land on b0.** `_proceedWithParsedData` only lands when not defect, not wide, and not low confidence (`apps/pwa/src/hooks/usePasteImportFlow.ts:361-365`); defect/wide dispatch mapping-path actions at `:384-390`. FSJ-5 changes only fresh paste, not match-summary re-dispatch.
3. **PWA modal retirement seam is App-level.** `App.tsx` imports and renders `PerformanceDetectedModal`, `DefectDetectedModal`, and `CapabilitySuggestionModal` (`apps/pwa/src/App.tsx:18-20`, `:1687-1759`). FSJ-5 removes those PWA render sites and threads banner props to `FrameView`.
4. **b0 slots are already the correct surface.** PWA `FrameView` builds provenance, quiet chip, hatch, and no-Y banner in `b0Slots` (`apps/pwa/src/components/views/FrameView.tsx:451-560`); `CanvasWorkspace` forwards slots into `FrameViewB0` (`packages/ui/src/components/Canvas/CanvasWorkspace.tsx:1379`).
5. **Defect transform is Dashboard-local today.** `Dashboard` computes `effectiveData/effectiveOutcome/effectiveFactors` from `useDefectTransform` (`apps/pwa/src/components/Dashboard.tsx:165-172`), while b0 still ranks `detectColumns(rawData)` (`packages/ui/src/components/Canvas/CanvasWorkspace.tsx:524-541`). FSJ-5 needs shared candidate plumbing.
6. **Performance accept must write channel configuration.** Current PWA modal accept only sets `analysisMode='performance'` (`apps/pwa/src/App.tsx:1691-1694`), but `usePerformanceAnalysis` needs `measureColumns` (`packages/hooks/src/usePerformanceAnalysis.ts:18-25`).
7. **Count vs Rate is a b0 outcome choice, not a Pareto registry rewrite.** Defect strategy `paretoYOptions` is count/time/cost (`packages/core/src/analysisStrategy.ts:187`); b0 should expose `DefectRate`/`DefectCount` as derived metric candidates based on transformed rows.
8. **OWNER-CALL-PENDING default:** defect confirm expands inline directly under the b0 loud banner. It must remain on the landing surface and never render as a modal.

## Tasks

### Task 1: Paste-flow routing for detection-shaped fresh pastes

**Files:**

- Modify: `apps/pwa/src/hooks/usePasteImportFlow.ts`
- Test: `apps/pwa/src/hooks/__tests__/usePasteImportFlow.landing.test.ts`
- Test: `apps/pwa/src/hooks/__tests__/pasteFlowReducer.test.ts`

- [ ] Write failing tests that defect-shaped and wide-shaped fresh pastes call `onFreshPasteLanded`, keep `defectDetection` / `wideFormatDetection`, and do not open mapping.
- [ ] Verify red with `pnpm --filter @variscout/pwa test -- --run usePasteImportFlow.landing pasteFlowReducer`.
- [ ] Change fresh paste routing so `shouldLandAtB0 = !opts?.reingest && detected.confidence !== 'low'`; dispatch the relevant detection action before `PASTE_LANDED`, then call `onFreshPasteLanded`.
- [ ] Preserve low-confidence non-detection mapping and all `{ reingest: true }` paths.
- [ ] Verify green with the same command.
- [ ] Branch guard (`pwd && git rev-parse --abbrev-ref HEAD`), then commit: `feat(pwa): land mode detections on b0`.

### Task 2: PWA b0 mode suggestion banners

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx`
- Test: `apps/pwa/src/components/views/__tests__/FrameView.b0.integration.test.tsx`

- [ ] Write failing tests for the defect banner, expanded confirm controls, performance banner, accept and dismiss callbacks inside `frame-view-b0-top-bar`.
- [ ] Verify red with `pnpm --filter @variscout/pwa test -- --run FrameView.b0.integration`.
- [ ] Add optional `defectDetection`, `wideFormatDetection`, and callback props to `FrameView`; render banners inside the existing `b0Slots.topBar` stack above quiet chips.
- [ ] Use the defect-confirm wireframe copy and keep the exact presentation marked by the `OWNER-CALL-PENDING` doc default.
- [ ] Performance banner defaults to detected channels and label `Channel`; secondary stack disposition opens `onFixData`.
- [ ] Verify green, branch guard, commit: `feat(pwa): render b0 mode suggestion banners`.

### Task 3: App wiring and modal retirement

**Files:**

- Modify: `apps/pwa/src/App.tsx`
- Test: `apps/pwa/src/__tests__/App.test.tsx`

- [ ] Write failing tests that performance accept writes `measureColumns`, `measureLabel`, `analysisMode='performance'`, and clears detection.
- [ ] Write failing tests that defect accept writes `defectMapping`, `analysisMode='defect'`, and clears detection.
- [ ] Write failing tests that no PWA detection/capability modal appears over Process b0.
- [ ] Verify red with `pnpm --filter @variscout/pwa test -- --run App`.
- [ ] Remove PWA render sites/imports for the three detection modals; thread detection state and accept/dismiss callbacks into `FrameView`.
- [ ] Leave shared modal components exported for non-PWA callers.
- [ ] Verify green, branch guard, commit: `feat(pwa): retire mode detection modals on b0`.

### Task 4: Core/shared b0 mode candidate helper

**Files:**

- Create: `packages/core/src/derived/deriveB0ModeCandidates.ts`
- Modify: `packages/core/src/derived/index.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Test: `packages/core/src/derived/__tests__/deriveB0ModeCandidates.test.ts`
- Test: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

- [ ] Write failing core tests: standard falls back to `rankYCandidates`, defect event log exposes `DefectRate` and `DefectCount` when units are mapped, defect without units defaults to `DefectCount`, performance excludes accepted `measureColumns` from ordinary Y/X candidates.
- [ ] Write failing UI tests that b0 candidate lists use the helper for defect/performance modes.
- [ ] Verify red with `pnpm --filter @variscout/core test -- --run deriveB0ModeCandidates` and `pnpm --filter @variscout/ui test -- --run CanvasWorkspace`.
- [ ] Implement pure helper returning `rows`, `columnAnalysis`, `yCandidates`, `xCandidates`, `defaultOutcomeColumn`, and optional `defectResult`.
- [ ] Add optional `analysisMode`, `defectMapping`, and `measureColumns` props to `CanvasWorkspace`; default behavior unchanged for Azure/non-PWA callers.
- [ ] Wire PWA `FrameView` store state into those optional props.
- [ ] Verify green, branch guard, commit: `feat(core): derive b0 candidates for mode framing`.

### Task 5: Self-review, adversarial review, and finish line

**Files:**

- Modify: this plan file if task checkboxes / self-review notes are updated.

- [ ] Review `git diff --name-only origin/main...HEAD` and confirm no `apps/azure` behavior files were changed.
- [ ] Run targeted suites:
  - `pnpm --filter @variscout/pwa test -- --run usePasteImportFlow.landing`
  - `pnpm --filter @variscout/pwa test -- --run FrameView.b0.integration App`
  - `pnpm --filter @variscout/ui test -- --run CanvasWorkspace FrameViewB0`
  - `pnpm --filter @variscout/core test -- --run analysisStrategy yLikelihood defect deriveB0ModeCandidates`
- [ ] Run final gate: `bash scripts/pr-ready-check.sh`.
- [ ] Spawn adversarial-review subagent over `origin/main...HEAD` with mandate: "find what the implementer missed — load-bearing tests that can't fail for the right reason, fenced zones touched, spec contradictions".
- [ ] Fix findings and rerun affected tests plus final gate.
- [ ] Push, create PR with grounding corrections, task list, test counts, `OWNER-CALL-PENDING` items, and live-verification checklist.
- [ ] Merge with `gh pr merge --merge --delete-branch`; leave the worktree for the end-of-plan audit.

## Self-Review Notes

- PWA-only: Azure behavior changes are fenced to FSJ-6; optional shared props only.
- P5 vocabulary: no forbidden wording in new docs/code.
- The defect-confirm wireframe is the built interaction contract.
