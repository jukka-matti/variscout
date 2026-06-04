---
tier: living
purpose: design
title: 'PO-2 · Control re-source + re-homes — sub-plan (facts not labels)'
audience: human
status: active
date: 2026-06-04
last-reviewed: 2026-06-04
layer: spec
topic: [process-as-operations, control, sub-plan]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# PO-2 · Control Re-source + Re-homes — Implementation Sub-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Worktree: `.worktrees/po-2-control-resource` (branch `feat/po-2-control-resource`). Implementer verification = targeted `<90s` runs; full sweep is controller-level. **Spec/master-plan line refs are pre-PO-1 and have drifted — locate by symbol/label, never by cited line number.**

**Goal:** Control reads facts not labels — the Control-readiness predicate replaces the `analyzeStatus` gates; the ControlRegion re-homes to the Project tab's Control stage; the Editor work-item strip retires (its Status select was the predicate's only writer — atomic with the re-source); ProjectCard slims to the §8 interim contract; the `reviewSignal` save-call retires.

**Grounded decisions (2026-06-04, 5-reader workflow — encode, don't re-derive):**
- **The predicate's typed source = NO NEW FIELD.** IP lifecycle is `ImprovementProjectStatus = 'draft'|'active'|'closed'` (`improvementProject/types.ts:15`); the Control stage is *derived* — `deriveStageState` maps `closed` → Control current (`packages/ui/src/components/IPDetail/stageState.ts:25-45`); the live artifact join is **`ControlRecord.improvementProjectId`** (Editor already joins on it). So: `controlEligible(ip, records, handoffs) = ip.status === 'closed' OR ∃ record/handoff with improvementProjectId === ip.id`; `isControlled(ip, records) = ∃ active (non-tombstoned) record for ip.id`. This matches the existing `getIPStageLabel` shape (`activeIPPresentation.ts:21-35`).
- **`ip.sections.outcomeReference.{sustainmentRecordId,controlHandoffId}` have ZERO writers** (3 readers, no writer — another lineage-pattern fossil). NOT wired in PO-2; logged to `investigations.md` for the #12 closure-model brainstorm.
- **The selector join re-points to the live FK**: `selectControlBuckets`/`selectControlReviews` currently key records/handoffs by `investigationId` (`control.ts:329-330,377-378`); the re-signature joins via `improvementProjectId` (honest, already live in Editor.tsx ~:867 + PWA App.tsx ~:1092).
- **Survey dedup MOVED to PO-3** (the panel dies whole; no half-stripped interim).
- **ProjectCard "Your tasks" block (assignedTaskCount/hasOverdueTasks) sheds** with the work-item layer — §3-consistent resolution of the spec's silence.
- **`latestActivity` does not exist in source** — recency = `CloudProject.modified` (already what the card + sort use).
- **TWO reviewSignal concepts**: shed ONLY the analyze-projection one (`localDb.ts:63-71` save-call + `ProjectMetadata.reviewSignal`); the hub-level `processHub.reviewSignal` (live cpkTarget cascade, `Dashboard.tsx` cpk commit + `ProcessHubCapabilityTab` + `documentSnapshot.ts`) MUST NOT be touched.
- **Sanctioned behavior change** (the label-can't-lie semantics): a project with `analyzeStatus='resolved'` but `ip.status='active'` and no record was control-eligible before and is NOT after. This is the designed change; it gets the negative-control test.

**Conventions:** work only in the worktree · commit per task · tsc error revealing an unlisted live consumer → BLOCKED with file:line · never touch `buildProcessHubRollups`/`ProcessHubCard`/the hub-card grid/`processState.ts`/`processHubReview.ts` (PO-3/PO-4 territory) · never touch hub-level `reviewSignal`/cpkTarget/documentSnapshot.

---

### Task 1: Core — the Control-readiness predicate + selector re-signature (Opus)

**Files:**
- Create: `packages/core/src/controlReadiness.ts` (+ barrel export in `packages/core/src/index.ts`)
- Modify: `packages/core/src/control.ts` (selectors), `packages/core/src/processHub.ts` (`ProcessHubReviewItem` re-type, ~:316)
- Test: create `packages/core/src/__tests__/controlReadiness.test.ts`; modify the existing control selector tests

- [ ] **Step 1 (TDD): write the predicate tests first** in `controlReadiness.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { isControlEligible, isControlled } from '../controlReadiness';
// build minimal ImprovementProject + ControlRecord/Handoff fixtures (mirror existing control.ts test fixtures)

describe('isControlEligible', () => {
  it('true when ip.status === "closed" (Control stage reached)', () => { /* status closed, no records */ });
  it('true when a ControlRecord exists for the project (improvementProjectId join)', () => { /* status active + record */ });
  it('true when a ControlHandoff exists for the project', () => { /* status active + handoff */ });
  it('NEGATIVE CONTROL — the label cannot lie: active project, no record/handoff → false', () => { /* even though the old analyzeStatus could have said resolved */ });
  it('ignores records belonging to OTHER projects (join is by improvementProjectId)', () => { /* distractor record with different improvementProjectId → false */ });
});
describe('isControlled', () => {
  it('true only when an active (non-tombstoned) ControlRecord exists for the project', () => {});
  it('NEGATIVE CONTROL — tombstoned/archived record → false', () => {});
});
```

- [ ] **Step 2: run to fail**, then implement `controlReadiness.ts` — pure functions over `(ip: ImprovementProject, records: ControlRecord[], handoffs: ControlHandoff[])`, joining by `record.improvementProjectId === ip.id` (read the actual field name + tombstone/archive convention from `control.ts` — e.g. `deletedAt`). Export `isControlEligible` + `isControlled`. Barrel-export from core root. Run to pass.
- [ ] **Step 3: re-signature.** In `control.ts`: re-constrain `selectControlBuckets` (~:366) + `selectControlReviews` (~:323) from `<TInv extends ProcessHubAnalyze>` to operate over `ImprovementProject[]`; replace the `analyzeStatus !== 'resolved' && !== 'controlled'` gates (~:334-335, ~:385-392) with the new predicates (`isControlEligible` for bucket inclusion; `isControlled` where the old code distinguished 'controlled'); re-key the record/review/handoff Maps from `investigationId` to `improvementProjectId`. Re-type `ProcessHubReviewItem` (`processHub.ts` ~:316) off `ImprovementProject`. Read every existing call-site/test of these selectors FIRST and keep the bucket semantics (Overdue / Control-due / Recently-reviewed / Set-up-control) identical apart from the sanctioned gate change.
- [ ] **Step 4:** update the existing core selector tests to `ImprovementProject`-shaped fixtures; keep every bucket-semantics assertion; the old status-gate tests become predicate tests (don't silently drop coverage).
- [ ] **Step 5: verify** — `pnpm --filter @variscout/core test -- control` + core tsc. **Expected: apps tsc now RED** (ControlRegion + Editor still pass analyze-shaped inputs) — that's the Task 2/3 seam; do NOT fix apps here. Note the exact app errors in your report for Task 2.
- [ ] **Step 6: commit** — `feat(po-2): control-readiness predicate (facts not labels) + selector re-signature to ImprovementProject`

### Task 2: Azure — ControlRegion re-home to the Project tab's Control stage (Opus)

**Files:**
- Modify: `apps/azure/src/components/ProcessHubControlRegion.tsx`, `apps/azure/src/components/ProjectsTabView.tsx`, `packages/ui/src/components/IPDetail/IPDetailPage.tsx` (Control-stage branch, ~:255-279), `apps/azure/src/pages/Editor.tsx` (data plumbing ~:860-884 + the ReviewPanel mount site), `apps/azure/src/components/ProcessHubReviewPanel.tsx` (remove the ControlRegion mount)
- Test: rewrite `apps/azure/src/components/__tests__/ProcessHubControlRegion.test.tsx` (6 cases) + ADD an integration test at the new mount

- [ ] **Step 1:** Re-sign `ProcessHubControlRegion` props: drop the ignored `cadence` prop (~:12-13,76); inputs become project-shaped (`projects: ImprovementProject[]` or the single active project + records/handoffs — match what Task 1's selectors take); re-point the `setupCandidates` filter (~:97-104) to `isControlEligible && !isControlled`.
- [ ] **Step 2:** Mount in the Project tab: render the region in `IPDetailPage`'s `activeStage === 'sustainment'` (labeled "Control") branch — pass through `ProjectsTabView` from Editor's already-plumbed `projectsControlRecord`/`projectsControlHandoff` (~:860-884). Honor the partial-integration policy (spec §8): today's visual language, smallest honest placement, no new interaction patterns. Keep the existing `ControlOverview`/`ControlSections` content — the region renders alongside, not replacing.
- [ ] **Step 3:** Remove the ControlRegion mount from `ProcessHubReviewPanel` (the panel keeps Survey + CurrentState until PO-3).
- [ ] **Step 4:** Re-point the Editor `ControlEntryRow` gate (it rendered on `analyzeStatus resolved|controlled`) to the new predicate — note: Task 3 deletes the whole strip; coordinate so `ControlEntryRow` survives as its own affordance gated by `isControlEligible` (it's the Control-entry path, not work-item UI). Decide its placement with Task 3 (likely stays in the Editor near where the strip was, or moves beside the Project-tab region — smallest honest placement).
- [ ] **Step 5:** Tests — rewrite the 6 `ProcessHubControlRegion.test.tsx` cases to project-shaped inputs + predicate; add the new-mount integration test (Project tab → Control stage renders the region with a due record). Run both files.
- [ ] **Step 6: commit** — `feat(po-2): re-home ControlRegion to the Project tab Control stage; drop the cadence prop`

### Task 3: Azure — the Editor work-item strip retires (Sonnet, after Task 2)

**Files:**
- Modify: `apps/azure/src/pages/Editor.tsx` — the `AnalyzeMetadataPanel` component (def ~:182-272, mount ~:1967-1971) + the auto-set nextMove (~:987)

- [ ] **Step 1:** Delete `AnalyzeMetadataPanel` (Depth select ~:195-205, Status select ~:209-219 — **the only `analyzeStatus` writer**, Owner ~:223, Sponsor ~:233, Contributors ~:241, NextMove ~:256-263) + its mount + props + the `INVESTIGATION_DEPTHS`/`INVESTIGATION_STATUSES`/`formatStatusLabel` helpers if orphaned. The `ControlEntryRow` it hosted survives per Task 2 Step 4 — re-host it before deleting the panel.
- [ ] **Step 2:** Delete the auto-set `nextMove` from recommendation (~:987 — locate by `nextMove`).
- [ ] **Step 3:** Leave `buildProjectMetadata`'s projections alone (PO-4 owns that surgery); the fields simply stop having writers.
- [ ] **Step 4:** i18n guard — grep each removed label string (`Depth`, `Status`, `Owner`, `Sponsor`, `Contributors`, `Next Move`) in `packages/core/src/i18n/messages/en.ts`: if any is a catalog key used ONLY by the strip → STOP, report (interface + 32 locales = controller decision). Expected per grounding: inline literals.
- [ ] **Step 5:** verify — Editor test files (`pnpm --filter @variscout/azure-app test -- Editor`) + azure tsc. **Step 6: commit** — `feat(po-2): retire the Editor work-item strip (Depth/Status/Owner/Sponsor/Contributors/NextMove) — ADR-082 membership is the persona home`

### Task 4: Azure — ProcessHubFormat Control-helper extraction (Sonnet)

**Files:**
- Create: `apps/azure/src/components/controlFormat.ts`
- Modify: `apps/azure/src/components/ProcessHubFormat.ts`, `apps/azure/src/components/ProcessHubControlRegion.tsx` (import re-point)
- Test: re-point `apps/azure/src/components/__tests__/ProcessHubFormat.control.test.ts` (23 cases) → the new module path

- [ ] Move `formatSustainmentVerdict`, `formatSustainmentDue`, `formatHandoffSurface` + `VERDICT_LABELS`/`HANDOFF_LABELS` into `controlFormat.ts` (imports narrowed to `ControlVerdict` + `ControlHandoffSurface`); `formatHandoffSurface` is currently test-only — KEEP with an explicit comment (`// Tested-but-unmounted; the #12 closure-model design decides its surface.`). `ProcessHubFormat.ts` keeps `formatMetric`/`formatStatus`/`formatLatestActivity` (PO-3 deletes them with the panel). Re-point imports + the test file; rename the test to `controlFormat.test.ts`. Verify + commit — `refactor(po-2): extract project-typed Control formatters to controlFormat.ts`

### Task 5: Azure — ProjectCard slim + the §8 interim chips (Sonnet)

**Files:**
- Modify: `apps/azure/src/components/ProjectCard.tsx`
- Test: `apps/azure/src/components/__tests__/ProjectCard.test.tsx` (15 cases — 4 rewrite/delete + 1 net-new)

- [ ] **Step 1:** Delete the work-item reads + renders: `overdueActions` (~:58 — **delete the READ, not just the type**: `.actionCounts` has no optional chain and would throw at runtime) + its amber footer (~:156) · `statusLabel` (~:59) + the chip render (~:108-110) · the depth label · the `hasOverdueTasks` amber border (~:46,:76-78 → static border) · the "Your tasks" block (`assignedTaskCount`/`hasOverdueTasks` — grounded call: work-item layer, sheds).
- [ ] **Step 2:** ADD the due-ness chip (net-new wiring): read `metadata?.sustainment?.nextReviewDue` (mirror the `ProcessHubControlRegion` read) and render a small chip when due/overdue; keep `findingCounts` + the `modified` recency (already rendered via `formatRelativeTime`). Deep-link target = the project (existing card onClick).
- [ ] **Step 3:** Tests: delete/rewrite the two amber-border tests (~:103-120) + the two Your-tasks tests (~:86-95, :122-128); update `makeMetadata` (~:12-23); ADD the negative control: **a project whose metadata still carries `analyzeStatus`/`actionCounts` values renders NO status chip and NO overdue footer** (the fields exist on the type until PO-4 — the card must ignore them). Add a due-ness chip test (due date in the past → chip shows; absent sustainment → no chip).
- [ ] **Step 4:** verify — `pnpm --filter @variscout/azure-app test -- ProjectCard`. **Step 5: commit** — `feat(po-2): ProjectCard slims to the §8 interim contract (findingCounts · recency · control due-ness)`

### Task 6: Azure — retire the reviewSignal save-call (Sonnet)

**Files:**
- Modify: `apps/azure/src/services/localDb.ts` (~:63-71 inside `extractMetadataInputs` ~:46-97), `packages/core/src/projectMetadata.ts` (param ~:138, field ~:80, write ~:227)

- [ ] Remove the `buildHubReviewSignal` call + `reviewSignal` var from `extractMetadataInputs`; drop the `reviewSignal` param/field/write from `buildProjectMetadata` + `ProjectMetadata`. `buildHubReviewSignal` + `HubReviewSignal` STAY in core (engine fn). **Guard:** zero edits to hub-level `processHub.reviewSignal` / the Dashboard cpkTarget commit / `ProcessHubCapabilityTab` / `documentSnapshot.ts`. tsc will surface the remaining analyze-projection readers (`processHubReview.ts`, `processState.ts`, rollup internals, `ProcessHubCard`) — those are PO-3/PO-4 territory: **if tsc reds on them, the field removal from the TYPE moves to PO-4 and this task removes only the save-call + the write** (decide by what tsc says; report which branch you took). Verify core + azure targeted tests; commit — `feat(po-2): retire the analyze-projection reviewSignal save-call (engine fn stays in core)`

---

## Controller-level acceptance

`pr-ready-check` green + both app suites · `--chrome` verify: Project tab → Control stage shows the region; Editor renders without the strip; Home cards show the slimmed chip set · the §13 negative controls present (label-can't-lie predicate test; ProjectCard ignores legacy work-item fields) · master-plan + investigations.md updates ride the PR (Survey-dedup→PO-3 note; outcomeReference zero-writers → logged for #12).
