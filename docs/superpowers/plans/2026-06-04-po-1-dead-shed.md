---
tier: living
purpose: design
title: 'PO-1 · Dead shed — sub-plan (zero-consumer deletions)'
audience: human
status: delivered
date: 2026-06-04
last-reviewed: 2026-06-04
layer: spec
topic: [process-as-operations, dead-code, sub-plan]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# PO-1 · Dead Shed — Implementation Sub-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Worktree: `.worktrees/po-1-dead-shed` (branch `feat/po-1-dead-shed`). Implementer verification = targeted `<90s` runs only (`pnpm --filter <pkg> test`); the full sweep is controller-level.

**Goal:** Delete every zero-consumer item from spec §3 (Phase A): orphaned cadence components + their exclusive formatters, 4 dead persisted metadata fields, 2 dead hooks, the dead `INVESTIGATION_*` action surface, the vestigial `onPlansChanged` option, the write-only escalation input, the 1:1-violating "New Analyze" buttons, the Editor hub picker, and the phantom Dashboard sort keys. **Zero behavior change** anywhere.

**Architecture:** Pure deletion PR, ordered so tsc stays green per commit: hooks first (they import the core fields), then core fields, then the action surface, then the Azure UI shed. Grounded inventory 2026-06-04 (every item verified zero-consumer; tsc is the safety net for stragglers — any missed consumer is a loud build break, which is the desired failure mode).

**Tech stack:** TypeScript strict, Vitest, pnpm turbo monorepo.

**Conventions for every task:** work ONLY in the worktree · commit per task with the given message · if ANY deletion produces a tsc error revealing a live consumer the inventory missed, STOP and report BLOCKED with the file:line (do not improvise a fix — that item may need to leave PO-1 scope) · never touch `useSessionCanvasFilters` behavior, `ScopeFilter` the type, `formatSustainmentVerdict`/`formatSustainmentDue`/`formatHandoffSurface`/`formatLatestActivity`, `ControlMetadataProjection`, `nodeMappings`, or `migrationDeclinedAt`.

---

### Task 1: Hooks package — inline the result type, delete the dead hooks

**Files:**

- Modify: `packages/hooks/src/useSessionCanvasFilters.ts`
- Delete: `packages/hooks/src/useCanvasFilters.ts`, `packages/hooks/src/useTimelineWindow.ts`
- Delete: `packages/hooks/src/__tests__/useCanvasFilters.test.ts`, `packages/hooks/src/__tests__/useTimelineWindow.test.ts`
- Modify: `packages/hooks/src/index.ts` (barrel)

- [ ] **Step 1: Inline the base type.** In `useSessionCanvasFilters.ts`: remove `import type { UseCanvasFiltersResult } from './useCanvasFilters';` (line 3). Read `useCanvasFilters.ts:29-42` for the exact current shape and define it locally above the existing `UseSessionCanvasFiltersResult`:

```typescript
import type { TimelineWindow } from '@variscout/core/timeline';
import type { ScopeFilter } from '@variscout/core/processHub';

/** Inlined from the retired useCanvasFilters (PO-1) — the session hook's base shape. */
interface UseCanvasFiltersResult {
  timelineWindow: TimelineWindow;
  setTimelineWindow: (window: TimelineWindow) => void;
  scopeFilter: ScopeFilter | undefined;
  setScopeFilter: (filter: ScopeFilter | undefined) => void;
  paretoGroupBy: string | undefined;
  setParetoGroupBy: (factor: string | undefined) => void;
}
```

Match the import specifiers to whatever `useCanvasFilters.ts` actually uses (verify the sub-paths exist in its imports before copying). Keep `UseSessionCanvasFiltersResult = UseCanvasFiltersResult & {...}` (line ~37) compiling unchanged.

- [ ] **Step 2: Run the surviving hook's tests** — `pnpm --filter @variscout/hooks test -- useSessionCanvasFilters`. Expected: PASS.
- [ ] **Step 3: Delete** `useCanvasFilters.ts`, `useTimelineWindow.ts`, and both test files (`git rm`).
- [ ] **Step 4: Barrel cleanup.** In `packages/hooks/src/index.ts` delete the `useTimelineWindow` export block (~lines 628-632: `useTimelineWindow`, `UseTimelineWindowArgs`, `UseTimelineWindowResult`) and the `useCanvasFilters` export block (~lines 648-652: `useCanvasFilters`, `UseCanvasFiltersArgs`, `UseCanvasFiltersResult`). KEEP the `useSessionCanvasFilters` block.
- [ ] **Step 5: Verify** — `pnpm --filter @variscout/hooks test` + `pnpm --filter @variscout/hooks exec tsc --noEmit` (or the package's typecheck script). Expected: green. A `ProcessHubCapabilityTab.tsx:58` comment mentions `useTimelineWindow` — comments are fine to leave.
- [ ] **Step 6: Commit** — `chore(po-1): inline UseCanvasFiltersResult into the session hook; delete the dead useCanvasFilters/useTimelineWindow`

### Task 2: Core — delete the 4 dead persisted metadata fields

**Files:**

- Modify: `packages/core/src/processHub.ts`

- [ ] **Step 1: Delete fields + their doc comments** from `ProcessHubAnalyzeMetadata`: `canonicalMapVersion` (~:241-246), `timelineWindow` (~:252-258), `scopeFilter` (~:268-272), `paretoGroupBy` (~:273-277). KEEP the `ScopeFilter` interface (~:204) and `AnalyzeNodeMapping` untouched. KEEP `stateNotes`/`sustainment`/`nodeMappings`/`migrationDeclinedAt` untouched.
- [ ] **Step 2: Sweep for stragglers** — `grep -rn "metadata.scopeFilter\|metadata.paretoGroupBy\|metadata.timelineWindow\|metadata\.canonicalMapVersion" packages apps --include="*.ts*"`. Expected: zero non-comment hits (Task 1 removed the only readers). Note: `canonicalMapVersion` WITHOUT the `metadata.` prefix has live canvasStore/`ProcessHub`/`DocumentSnapshot` uses — DO NOT touch those.
- [ ] **Step 3: Verify** — `pnpm --filter @variscout/core test` + core typecheck. Expected: green.
- [ ] **Step 4: Commit** — `chore(po-1): drop the dead persisted analyze-metadata fields (scopeFilter/paretoGroupBy/timelineWindow/canonicalMapVersion)`

### Task 3: The dead INVESTIGATION\_\* action surface

**Files:**

- Delete: `packages/core/src/actions/analyzeActions.ts`
- Modify: `packages/core/src/actions/index.ts` (union + barrel), `apps/azure/src/persistence/applyAction.ts` (~:456-466), `apps/pwa/src/persistence/applyAction.ts` (~:379-381)
- Modify tests: `packages/core/src/actions/__tests__/exhaustiveness.test.ts`, `packages/core/src/actions/__tests__/hypothesisActionItems.test.ts`, `apps/azure/src/persistence/__tests__/applyAction.test.ts`, `apps/pwa/src/persistence/__tests__/applyAction.test.ts`, `apps/azure/src/persistence/__tests__/AzureHubRepository.test.ts`

- [ ] **Step 1:** `git rm packages/core/src/actions/analyzeActions.ts`; remove the `AnalyzeAction` import/union members (`INVESTIGATION_CREATE`/`INVESTIGATION_UPDATE_METADATA`/`INVESTIGATION_ARCHIVE`) + barrel export from `actions/index.ts`.
- [ ] **Step 2:** Delete the three no-op `case` blocks in each app's `applyAction.ts` (azure ~:456-466, pwa ~:379-381 — locate by the `case 'INVESTIGATION_` strings, don't trust line numbers).
- [ ] **Step 3:** Update the tests: remove the `INVESTIGATION_*` case statements from the exhaustiveness + hypothesisActionItems switches; delete the "INVESTIGATION\_\* resolves cleanly" cases in both apps' `applyAction.test.ts`; delete the "INVESTIGATION_ARCHIVE delegates to applyAction (P5.3)" case in `AzureHubRepository.test.ts`. TypeScript's `never` exhaustiveness will confirm the union shrank correctly.
- [ ] **Step 4: Verify** — `pnpm --filter @variscout/core test -- actions` then each app's `applyAction` test file (`pnpm --filter @variscout/azure-app test -- applyAction`, same for pwa). Expected: green.
- [ ] **Step 5: Commit** — `chore(po-1): delete the dead INVESTIGATION_* action surface (no-op reducers, zero dispatchers)`

### Task 4: Azure UI shed (orphans · formatters · escalation input · New Analyze · hub picker · sort)

**Files:**

- Delete: `apps/azure/src/components/ProcessHubCadenceQueues.tsx`, `apps/azure/src/components/ProcessHubCadenceQuestions.tsx`
- Modify: `apps/azure/src/components/ProcessHubFormat.ts`, `apps/azure/src/components/__tests__/ProcessHubFormat.control.test.ts`, `apps/azure/src/components/ControlReviewLogger.tsx`, `apps/azure/src/pages/Dashboard.tsx`, `apps/azure/src/pages/Editor.tsx`

- [ ] **Step 1:** `git rm` the two orphaned components (zero importers verified).
- [ ] **Step 2: ProcessHubFormat split.** Delete ONLY exports whose every importer was one of the two deleted files — verify per symbol with `grep -rn "<symbol>" apps/azure/src --include="*.ts*"` BEFORE each deletion: `formatChangeSignals`, `formatOverdueActions`, `formatTopFocus`, `formatHubTopFocus`, `formatCapability`, `formatHubCapability`, `requirementSummary`, `processQuestionAnswers`, `sustainmentBandAnswer`, + the private `pickLatestSnapshotSignal`/`formatSnapshotContext` helpers if orphaned by those deletions. KEEP: `formatSustainmentVerdict`, `formatSustainmentDue`, `formatHandoffSurface`, `formatLatestActivity`, `formatMetric`, `formatStatus`, `VERDICT_LABELS`, `HANDOFF_LABELS`, the type imports. If a symbol has ANY surviving importer (note: `ProcessHubCard.tsx` defines its own LOCAL `formatTopFocus`/`formatChangeSignals` — those are not imports), keep it and note it in the report.
- [ ] **Step 3:** In `ProcessHubFormat.control.test.ts`: delete the `sustainmentBandAnswer` describe block (~:84-175); keep the `formatSustainmentVerdict`/`formatSustainmentDue`/`formatHandoffSurface` blocks.
- [ ] **Step 4: Escalation input.** In `ControlReviewLogger.tsx`: delete the `escalatedInvestigationId` useState (~:42), the payload line (~:61 `escalatedInvestigationId: escalatedInvestigationId || undefined,`), and the whole input `<div>` block (~:149-162). The `ControlReview.escalatedInvestigationId` TYPE field in core stays (PO-7 strips it).
- [ ] **Step 5: New Analyze buttons.** In `pages/Dashboard.tsx`: delete both button JSX blocks (~:690-696 and ~:768-773 — locate by `New Analyze`). KEEP `onOpenProject` itself (other call sites open existing projects). If a now-empty wrapper div remains, remove it.
- [ ] **Step 6: Hub picker.** In `pages/Editor.tsx`: delete the Process-Hub `<label>`+`<select>` block (~:196-207 — locate by `Process Hub`). Then check whether the `processHubs` state (~:495) + its loader (~:506) have any OTHER consumer in Editor — if the picker was the only one, delete the state + loader too; if others exist, keep them and say so in the report.
- [ ] **Step 7: Sort replacement.** In `pages/Dashboard.tsx` (~:181-187): remove the `hasOverdueTasks`/`assignedTaskCount` sort tiers. Replace with recency. FIRST check whether `ProjectMetadata` carries a `latestActivity` field — if not (likely), sort on the project's own modified timestamp:

```typescript
// Sort by recency — newest activity first (work-item sort keys shed per spec §3)
const aModified = new Date(a.modified).getTime();
const bModified = new Date(b.modified).getTime();
return bModified - aModified;
```

Adapt the field name to the actual `ImprovementProject` shape (verify: `modified` vs `updatedAt`) and preserve any surviving sort tiers that don't read the shed keys (e.g. a name tiebreaker if present).

- [ ] **Step 8: i18n check** — `grep -rn "New Analyze\|Escalated analyze\|Process Hub<" packages/core/src/i18n/messages/en.ts`. Expected: no hits (inventory says all three strings are inline, not catalog keys). If a hit appears, STOP and report (key removal = interface + 32 locales, needs the controller's call).
- [ ] **Step 9: Verify** — `pnpm --filter @variscout/azure-app test -- ProcessHubFormat` + the azure typecheck. Expected: green.
- [ ] **Step 10: Commit** — `chore(po-1): azure UI shed — orphaned cadence components + exclusive formatters, escalation input, New Analyze buttons, hub picker, work-item sort keys`

### Task 5: The vestigial onPlansChanged option

**Files:**

- Modify: `packages/hooks/src/useReingestAutoLink.ts` (~:88-98), `packages/hooks/src/__tests__/useReingestAutoLink.test.ts` (~:127,130,146)

- [ ] **Step 1:** Delete the `onPlansChanged?: () => void;` option + its full doc-comment block (~:88-98). Keep the inline comment near ~:144 noting the hook performs no writes (adjust wording if it references the deleted option).
- [ ] **Step 2:** In the test: remove `const onPlansChanged = vi.fn();` (~:127), the option from the hook call (~:130), and the `expect(onPlansChanged).not.toHaveBeenCalled()` assertion (~:146). If the containing test case becomes assertion-empty, delete the case; if it still asserts the no-write behavior another way, keep it.
- [ ] **Step 3: Verify** — `pnpm --filter @variscout/hooks test -- useReingestAutoLink`. Expected: green.
- [ ] **Step 4: Commit** — `chore(po-1): drop the vestigial onPlansChanged option (uncalled since CS-11)`

---

## Acceptance (controller-level, after all tasks)

Full `bash scripts/pr-ready-check.sh` green + both app test suites · `--chrome` smoke: Dashboard renders (cards sorted by recency, no New Analyze buttons), Editor renders (no hub picker, no Depth/Status changes — those are PO-2), Control review logger renders without the escalation input · zero behavior change beyond the enumerated removals.
