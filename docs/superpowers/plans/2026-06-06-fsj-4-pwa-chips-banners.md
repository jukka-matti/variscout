---
tier: ephemeral
purpose: build
title: 'FSJ-4 — PWA quiet chips + step-timestamp banner'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
  - docs/02-journeys/wireframes/step-timings.md
---

# FSJ-4: PWA Chips + Step-Timestamp Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA b0 gains the FSJ-4 detection grammar: quiet time chip with undo, step-timestamp loud banner routing into the shipped `StepTimingsModal` and L2 flow landing, no capability modal over b0, plus the b0 expander L1 regression fixed with captured mechanism.

**Architecture:** Reuse FSJ-2's shipped PWA b0 slots and paste callbacks. Lift step-pair detection into pure core so b0 can detect timestamp pairs before steps exist, then let `CanvasWorkspace` render the b0 banner and reuse existing map authoring + `StepTimingsModal` save flow. Quiet time extraction stays PWA-owned: `usePasteImportFlow` records the auto-derived columns and `FrameView` renders a dismissible chip with undo.

**Tech Stack:** React + Zustand, `@variscout/core` parser/derived helpers, shared `@variscout/ui` Canvas/FrameViewB0, PWA hook wiring, Vitest + RTL.

**Branch:** `feat/fsj-4-pwa-chips-banners` in `.worktrees/feat-fsj-4-pwa-chips-banners/`.

---

## Grounded Design Decisions

1. **FSJ-2 landing infra is already present.** PWA paste lands through `usePasteImportFlow` with `onFreshPasteLanded`/`onFreshPasteAnalyzed` (`apps/pwa/src/hooks/usePasteImportFlow.ts:306`, `apps/pwa/src/App.tsx:366`) and b0 slots are already wired through `apps/pwa/src/components/views/FrameView.tsx:444`.
2. **b0 X pollution mechanism:** quiet auto-time extraction defaults `extractYear: true` (`apps/pwa/src/hooks/usePasteImportFlow.ts:259`); b0 X candidates include numeric/categorical columns without `hasVariation` filtering (`packages/ui/src/components/Canvas/CanvasWorkspace.tsx:538`). FSJ-4 fixes the quiet default and undo path rather than changing shared Y ranking or parser semantics.
3. **Step pair detector seam:** `detectPairedTimingColumns` exists only for `ColumnParsingProfile[]` plus existing process steps and only recognizes `_start/_end` (`packages/core/src/derived/detectPairedTimingColumns.ts:19`). FSJ-4 adds a pre-step detector over `ColumnAnalysis[]`, preserving existing modal behavior.
4. **TASK 0 captured mechanism:** default viewports are `l2`, but stale persisted or fit-derived state can hold `zoom: 0.2` and `currentLevel: 'l1'` (`packages/core/src/canvas/viewport.ts:17`, `packages/stores/src/canvasViewportStore.ts:184`). Since b0 renders the canvas children inside `ProcessStepsExpander` (`packages/ui/src/components/FrameViewB0/FrameViewB0.tsx:197`), opening the expander with stale L1 shows `SystemLevelView` instead of L2 authoring.
5. **Modal scope:** `CapabilitySuggestionModal` currently renders over all app surfaces once data/spec criteria match (`apps/pwa/src/App.tsx:593`, `apps/pwa/src/App.tsx:1728`). FSJ-4 suppresses it only while the Process tab is at b0; defect/wide modals stay fenced for FSJ-5.

## Tasks

### Task 0: b0 expander pins L2 before rendering children

**Files:**

- Modify: `packages/ui/src/components/FrameViewB0/FrameViewB0.tsx`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Test: `packages/ui/src/components/FrameViewB0/__tests__/FrameViewB0.test.tsx`
- Test: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

- [x] Write failing `FrameViewB0` test: controlled `ProcessStepsExpander` callback fires with `true` when the user opens "Add process steps".
- [x] Write failing `CanvasWorkspace` regression: seed b0 with viewport `{ currentLevel: 'l1', zoom: 0.2 }`, open the expander, assert L2 authoring content renders instead of L1 system content.
- [x] Implement optional `onProcessStepsOpen?: () => void` on `FrameViewB0`, invoked only on open.
- [x] In `CanvasWorkspace`, pass a handler that sets/fits the viewport to `l2` for the b0 expander hub before children render.
- [x] Run `pnpm --filter @variscout/ui test -- --run FrameViewB0 CanvasWorkspace`.
- [x] Commit: `fix(ui): pin b0 process-step expander to L2 authoring`

### Task 1: core step-timestamp pair detection

**Files:**

- Create: `packages/core/src/derived/detectStepTimestampPairs.ts`
- Modify: `packages/core/src/derived/index.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/derived/__tests__/detectStepTimestampPairs.test.ts`

- [x] Write failing tests for 3 complete date-kind pairs, `_st/_e` suffixes, incomplete pairs ignored, non-date channel columns ignored, deterministic prefix order.
- [x] Implement `detectStepTimestampPairs(columnAnalysis)` returning `{ stepName, startColumn, endColumn }[]`.
- [x] Share suffix handling with `detectPairedTimingColumns` where practical without changing its public return type.
- [x] Export from `@variscout/core` and `@variscout/core/derived`.
- [x] Run `pnpm --filter @variscout/core test -- --run detectStepTimestampPairs`.
- [x] Commit: `feat(core): detect step timestamp pairs before process steps exist`

### Task 2: b0 step-timestamp loud banner routes to StepTimingsModal and L2

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Test: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

- [x] Write failing `CanvasWorkspace` test: b0 with paired timestamp columns renders a banner matching the wireframe, and accepting creates steps, opens `StepTimingsModal`, saves detected bindings, and lands at L2 with derived timing chips.
- [x] Implement b0 banner when `scope === 'b0'` and `detectStepTimestampPairs(columnAnalysis)` returns at least one pair.
- [x] Accept path: create steps from pair names through the existing canonical map authoring path, pin viewport to `l2`, open shipped `StepTimingsModal`; let the modal's own prefill/save path persist timings.
- [x] Ensure no false positive for numeric channel columns or one timestamp plus channel siblings.
- [x] Run `pnpm --filter @variscout/ui test -- --run CanvasWorkspace`.
- [x] Commit: `feat(ui): route b0 step timestamps into step timings flow`

### Task 3: PWA quiet time chip + undo, no default Year

**Files:**

- Modify: `apps/pwa/src/hooks/usePasteImportFlow.ts`
- Modify: `apps/pwa/src/components/views/FrameView.tsx`
- Test: `apps/pwa/src/hooks/__tests__/usePasteImportFlow.landing.test.ts`
- Test: `apps/pwa/src/components/views/__tests__/FrameView.b0.integration.test.tsx`

- [x] Write failing hook test that measurement-shaped paste with `Timestamp` auto-applies Month + DayOfWeek but not Year, and exposes quiet-chip metadata.
- [x] Write failing component test that the b0 chip renders, dismiss hides it, and Undo removes derived time columns/factors while leaving raw source data.
- [x] Change quiet auto-apply default to `extractYear: false`.
- [x] Track derived time columns from auto-apply in `usePasteImportFlow`; expose chip metadata, dismiss, and undo handlers to PWA `FrameView`.
- [x] Render the chip in the existing b0 top bar; `Adjust` opens `onFixData`, `Undo` removes auto-derived columns and factors.
- [x] Run `pnpm --filter @variscout/pwa test -- --run usePasteImportFlow.landing FrameView.b0.integration`.
- [x] Commit: `feat(pwa): show undoable quiet time chip on b0 landing`

### Task 4: suppress capability modal over PWA b0

**Files:**

- Modify: `apps/pwa/src/App.tsx`
- Test: `apps/pwa/src/__tests__/App.test.tsx`

- [x] Write failing App test: with raw data + specs on Process b0, `CapabilitySuggestionModal` is not rendered.
- [x] Write negative-control test: once the user leaves b0/Process landing, capability suggestion can still render under the existing criteria.
- [x] Add a b0 landing guard to the capability suggestion effect/render; do not alter wide/defect modal behavior.
- [x] Run `pnpm --filter @variscout/pwa test -- --run App`.
- [x] Commit: `fix(pwa): keep capability suggestion modal off b0 landing`

### Task 5: self-review and final verification

**Files:**

- Modify: this plan file, only task checkboxes / self-review notes if useful

- [x] Review diff for `apps/azure` absence.
- [x] Run targeted suites:
  - `pnpm --filter @variscout/core test -- --run detectStepTimestampPairs`
  - `pnpm --filter @variscout/ui test -- --run CanvasWorkspace FrameViewB0`
  - `pnpm --filter @variscout/pwa test -- --run usePasteImportFlow FrameView App`
- [x] Run final gate: `bash scripts/pr-ready-check.sh`.
- [x] PR body must include grounding corrections, task list, test counts, OWNER-CALL-PENDING items, and live-browser checklist against `docs/02-journeys/wireframes/step-timings.md`.

## Self-Review Notes

- FSJ-4 is PWA-only; `git diff --name-only origin/main...HEAD` contains no `apps/azure` paths.
- Defect/wide modal retirement remains FSJ-5; FSJ-4 only guards `CapabilitySuggestionModal` while Process is at b0.
- No OWNER-CALL-PENDING items.
- Verification completed before final gate: core `detectStepTimestampPairs` (5 tests), UI `CanvasWorkspace FrameViewB0` (83 tests), PWA `usePasteImportFlow FrameView App` (166 tests).
- Final gate completed green: `bash scripts/pr-ready-check.sh`.
- Live verification checklist for PR: paste a timestamp-pair dataset, confirm banner, accept, verify StepTimingsModal prefill, save, verify L2 flow/timing badges/derived chips; paste ordinary timestamp data, verify quiet chip/dismiss/undo; verify no capability modal over b0.
