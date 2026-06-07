---
tier: ephemeral
purpose: build
title: 'FSJ-9 Durability UX Implementation Plan'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/02-journeys/wireframes/durability-ux.md
---

# FSJ-9 Durability UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first-capture save/export nudge, dirty-close guards, invite gating, and Report humanization boundary from FSJ-9.

**Architecture:** Own-capture detection stays app-local at the live capture callbacks that return a new `Finding`; restored/imported findings never count. Azure durability keys off `useUnsavedHubsStore` plus the saved document baseline. PWA durability remains export-only: own captures since the last `.vrs` export trigger the nudge and close guard, and export clears that flag. Report composition stays unchanged; only Sponsor/executive display labels are humanized at the Report boundary.

**Tech Stack:** React, TypeScript, Zustand stores, Vitest/Testing Library, pnpm/turbo, GitHub CLI.

---

## Grounded Decisions

- Azure context is `apps/azure/CLAUDE.md`; the older `apps/azure-app/CLAUDE.md` path is no longer present.
- FSJ-8 is merged on `origin/main` through `docs/superpowers/plans/2026-06-07-fsj-8-wall-arrival.md`; reuse its named-promotion seam and `onOpenWall` afterglow wiring.
- "Own capture" is the live callback returning a new `Finding`, not a new persisted author field.
- PWA gets the native `beforeunload` backstop for unexported own captures; `.vrs` export is the only clearing save gesture.
- Invite gates are disabled with explanation, not hidden. PWA leaves invite eligibility ungated because ACL/invite is Azure-owned.
- Do not change `HypothesisStatus`, `groupHypothesesByStatus`, or Report section selection.

## Task 1: Plan + Wireframe + Worktree

**Files:**

- Create: `docs/superpowers/plans/2026-06-06-fsj-9-durability-ux.md`
- Create: `docs/02-journeys/wireframes/durability-ux.md`

- [ ] Create `.worktrees/feat/fsj-9-durability-ux` from `origin/main`, fetch, and fast-forward to the current remote main.
- [ ] Run `pnpm install` in the worktree.
- [ ] Add the FSJ-9 implementation plan and durability UX wireframe.
- [ ] Branch guard, then commit `docs(fsj-9): add durability ux plan and wireframe`.

## Task 2: Report Humanization Boundary

**Files:**

- Create: `packages/core/src/report/reportHumanizer.ts`
- Create: `packages/core/src/report/__tests__/reportHumanizer.test.ts`
- Modify: `packages/core/src/report/index.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/report/ipReport.ts`
- Test: `packages/core/src/report/__tests__/ipReport.test.ts`
- Modify: `apps/pwa/src/components/views/ReportView.tsx`
- Modify: `apps/azure/src/components/views/ReportView.tsx`

- [ ] Write failing tests proving brush-generated text like `Brushed indices 32-58 on Day_of_Week` becomes `Day-of-Week, observations 32-58`, derived factor filters like `obs 32-58=['in']` become `observations 32-58`, and analyst-written labels pass through.
- [ ] Write failing Report/IP tests proving overview/Sponsor paths do not render raw brush text or auto factor names verbatim.
- [ ] Implement `humanizeReportFindingLabel(finding, columnAliases?)` in core report code.
- [ ] Use the helper only on PWA/Azure overview/summary Report labels and IP report narrative/cause-row display text. Keep technical finding text paths unchanged.
- [ ] Run `pnpm --filter @variscout/core test -- --run src/report`.
- [ ] Run focused PWA/Azure ReportView tests.
- [ ] Branch guard, then commit `feat(report): humanize captured conditions for executive reports`.

## Task 3: Invite Gate

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailHeader.tsx`
- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/CharterOverview.tsx`
- Test: `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`
- Test: `packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`

- [ ] Write failing UI tests proving disabled invite buttons remain visible, do not open modals/call handlers, and show the save+rename explanation.
- [ ] Add optional invite disabled/reason props to shared IP detail header and charter overview.
- [ ] Compute Azure eligibility from explicit save and non-default title (`Untitled project`, `Untitled hub`, `Untitled`, `New Analysis`, blank).
- [ ] Thread the gate through `ProjectsTabView` to `IPDetailPage`; leave PWA callers with default enabled behavior.
- [ ] Run `pnpm --filter @variscout/ui test -- --run src/components/IPDetail`.
- [ ] Run focused Azure project page tests.
- [ ] Branch guard, then commit `feat(azure): gate invites on saved named projects`.

## Task 4: Save/Export Nudge + Dirty Close Guard

**Files:**

- Create: `packages/ui/src/components/DurabilityNudge/DurabilityNudge.tsx`
- Create: `packages/ui/src/components/DurabilityNudge/__tests__/DurabilityNudge.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/components/VrsExportButton.tsx`
- Test: `apps/pwa/src/__tests__/App.test.tsx`
- Test: `apps/pwa/src/components/__tests__/VrsExportButton.test.tsx`
- Modify: `apps/azure/src/features/findings/useFindingsOrchestration.ts`
- Modify: `apps/azure/src/pages/Editor.tsx`
- Test: `apps/azure/src/features/findings/__tests__/useFindingsOrchestration.durability.test.ts`
- Test: `apps/azure/src/pages/__tests__/Editor.test.tsx`

- [ ] Write failing UI test for calm one-line nudge with configurable `Save`/`Export` verb and dismiss button.
- [ ] Write failing app tests proving restored/imported findings do not fire the nudge, own captures fire it once, dismiss prevents refire, and PWA export clears the close guard.
- [ ] Write failing Azure Editor tests proving `beforeunload` is attached for an unsaved hub or dirty document and not attached after save baseline clears.
- [ ] Implement shared `DurabilityNudge`.
- [ ] PWA: mark own captures from `handlePinFinding` and `handleAddChartObservation`; render Export nudge; add `beforeunload` while unexported own captures are present; pass `onExported` to `VrsExportButton`.
- [ ] Azure: add optional `onOwnFindingCaptured?: (finding: Finding) => void` to `useFindingsOrchestration`; call it only when a new finding is returned; render Save nudge in `Editor`; add `beforeunload` for unsaved hub or dirty document.
- [ ] Run targeted PWA/Azure tests.
- [ ] Branch guard, then commit `feat(fsj-9): nudge and guard unsaved investigations`.

## Task 5: Final Verification + PR

- [ ] Run targeted commands:

```bash
pnpm --filter @variscout/core test -- --run src/report
pnpm --filter @variscout/ui test -- --run src/components/IPDetail src/components/DurabilityNudge
pnpm --filter @variscout/pwa test -- --run src/__tests__/App.test.tsx src/components/__tests__/VrsExportButton.test.tsx
pnpm --filter @variscout/azure-app test -- --run src/features/findings src/pages/__tests__/Editor.test.tsx
```

- [ ] Run `bash scripts/pr-ready-check.sh`.
- [ ] Browser walk before PR: paste, capture own finding, nudge fires once, dismiss no refire, dirty close native dialog, invite disabled on Untitled then enabled after save+rename, Report overview humanizes a brush-minted finding.
- [ ] Push `feat/fsj-9-durability-ux` and open a draft PR.
- [ ] Stop after PR opened.

## Self-Review Notes

- Vocabulary invariant: never write the forbidden phrase in code, tests, docs, or UI copy.
- Do not touch the invite-to-durable-membership seam; the FSJ-9 gate only sits in front of invite affordances.
- Do not unify Azure and PWA persistence reducers; keep app-local durability flags independent.
