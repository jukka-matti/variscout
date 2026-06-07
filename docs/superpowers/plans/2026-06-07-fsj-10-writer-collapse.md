---
tier: ephemeral
purpose: build
title: 'FSJ-10 — Writer collapse + wizard retirement'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# FSJ-10: Writer Collapse + Wizard Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish FSJ P4 by collapsing active Y/X writes to the b0 picker, retiring ColumnMapping from the primary first-session path, plumbing defect-mode derived outcomes into b0, and rewriting Azure E2E coverage around the landing-era journey.

**Architecture:** The ingestion reducers remain seed writers: they parse rows, seed inferred fields, store data quality and mode proposals, then route to b0. After that seed point, `CanvasWorkspace`/`FrameViewB0` is the only interactive writer of `projectStore.outcome/factors`. `ColumnMapping` stays reachable only through "Fix data..." and "+ track another outcome"; it may update hub metadata and setup-only transforms, but not the active Y/X store fields. Defect-mode candidates extend `deriveB0ModeCandidates` so b0 ranks transformed `defectResult.data` and `defectResult.outcomeColumn`, even when that outcome is not present in raw rows.

**Tech Stack:** React, Zustand, `@variscout/core` parser/derived helpers, shared `@variscout/ui` CanvasWorkspace, Vitest/RTL, Playwright, GitHub PR workflow.

---

## Sequencer

1. **FSJ-10a / PR 1:** PWA writer collapse + shared b0 candidate/default behavior + plan file.
2. **FSJ-10b / PR 2:** Azure mirror after 10a merges.
3. **FSJ-10c / PR 3:** Azure E2E spine rewrite after 10b merges.

Each PR uses its own worktree under `.worktrees/`, runs targeted tests during implementation, runs `bash scripts/pr-ready-check.sh` at the end, performs the scoped chrome walk, then opens a PR and stops.

## Grounded Decisions

- The shared active Y/X writer is already `CanvasWorkspace` b0: `FrameViewB0.onSelectY` calls `setOutcome`, and `onToggleX` calls `setFactors`.
- `deriveB0ModeCandidates` already handles ordinary, defect, and performance candidate sets; extend it in place.
- PWA `usePasteImportFlow` and Azure `useEditorDataFlow` are separate reducer machines; do not ship them in one PR.
- The wizard hatch remains permanent. Its setup/confirm path can persist multi-outcome hub metadata and apply stack/time/spec setup, but must not rewrite `projectStore.outcome/factors`.
- Re-ingest/match-summary is not a first-session flow and remains outside this collapse.
- The known projectStore/ProcessMap seam stays unreconciled.

## FSJ-10a Tasks: PWA Writer Collapse

- [ ] **Task 1: Core negative control.** Add `deriveB0ModeCandidates` coverage proving defect-mode Y candidates come from transformed defect output when `defectResult.outcomeColumn` is absent from raw rows. Run the focused core test and watch it fail before implementation.
- [ ] **Task 2: Shared b0 effective default.** Add CanvasWorkspace coverage proving b0 can display a mode-aware default outcome, and `See the data` commits that outcome through b0 before navigation. Implement the minimal shared b0 default/commit behavior.
- [ ] **Task 3: PWA reducer seed-only path.** Update PWA landing tests so fresh paste routes to b0 rather than opening ColumnMapping, while re-ingest remains excluded. Implement the reducer branch.
- [ ] **Task 4: Wizard non-writer negative control.** Add/update PWA hook tests proving `handleMappingConfirm` no longer calls `setOutcome`/`setFactors`, while still closing mapping and applying setup-only side effects. Implement the change.
- [ ] **Task 5: PWA defect acceptance non-writer.** Update `App.modeReframing` expectations so accepting defect mode writes mapping + mode only. Implement `App.tsx` change.
- [ ] **Task 6: Verification + PR.** Run the targeted test matrix, run `bash scripts/pr-ready-check.sh`, run the scoped chrome walk, branch-guard, commit, push, open PR, stop.

## FSJ-10b Tasks: Azure Mirror

- [ ] Mirror the PWA reducer collapse in `apps/azure/src/features/data-flow/useEditorDataFlow.ts`.
- [ ] Update Azure `Editor.tsx` defect acceptance and mapping confirm behavior so the wizard is no longer an active Y/X writer.
- [ ] Keep hub persistence for outcomes/primaryScopeDimensions through the hatch.
- [ ] Add/update Azure tests mirroring 10a negative controls.
- [ ] Run targeted Azure/UI tests, pr-ready check, chrome walk, commit, push, open PR.

## FSJ-10c Tasks: E2E Spine Rewrite

- [ ] Rewrite `apps/azure/e2e/helpers.ts` around landing-era helpers (`pasteToB0`, b0 Y selection, `See the data`, hatch open).
- [ ] Replace wizard-era `confirmColumnMapping` call sites with b0 spine steps unless the test explicitly covers the hatch.
- [ ] Keep explicit E2E coverage for "Fix data..." cancel, multi-outcome "+ track another outcome", no-Y floor, defect/wide confirm-not-auto, clean paste to charts in <=2 interactions, and change-Y-only-via-b0.
- [ ] Run touched Playwright specs, pr-ready check, chrome walk, commit, push, open PR.

## Acceptance

- Paste autodetect and mapping-confirm cannot interactively mutate `projectStore.outcome/factors` after seed.
- Defect mode b0 can choose transformed Count/Rate candidates even though raw rows do not contain those columns.
- No primary first-session flow reaches `ColumnMapping`.
- The hatch opens `ColumnMapping`, cancel never wipes raw data, and multi-outcome parity survives.
- Vocabulary and enum invariants remain untouched.
