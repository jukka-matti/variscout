# Phase 6 — Sustainment & Control Handoff Implementation Plan

> ## Session Resumption Status (paused 2026-04-27)
>
> **Branch:** `feat/phase-6-sustainment` — pushed to `origin/feat/phase-6-sustainment`. Last commit: `57196a54`.
>
> **Phase A (Tasks 1–6, core layer): COMPLETE.** 11 commits on the branch:
>
> - `b943d8f4` Task 1 — sustainment types + `nextDueFromCadence` scaffold
> - `7b0c0062` Task 1 fix — calendar-aware arithmetic via `addMonthsClamped` (caught a bug in the plan's `setUTCMonth(+1)` approach)
> - `6313129c` Task 2 — `isSustainmentDue` + `isSustainmentOverdue`
> - `299e9977` Task 2 polish — clamp negative graceDays, tighten exclusive-cutoff JSDoc
> - `11d935b5` Task 3 — `selectSustainmentReviews` + `selectControlHandoffCandidates`
> - `5e1edc9f` Task 3 fix — populate `reasons`, symmetric review-item shape, export `buildReviewItem`
> - `f83dbdb1` Task 4 — `SustainmentMetadataProjection` on metadata + barrel exports
> - `e8d95839` Task 4 fix — reconcile `ProcessParticipantRef` to canonical Azure shape
> - `ba60d9db` Task 4.5 — extract `buildReviewItem` to `processHubReview.ts` leaf (broke a real runtime cycle)
> - `02ac7bf1` Task 5 — wire sustainment lane into `buildProcessHubCadence`
> - `57196a54` Task 6 — extend `ProcessHubContextContract` with sustainment summary
>
> **Tests:** 2783 core tests pass (added ~30 new). No regressions.
>
> **Architecture deltas vs original plan:**
>
> - Added `processHubReview.ts` leaf module (was not in the original plan; needed to break the runtime cycle that emerged in Task 5).
> - Added `'sustainment-due'` and `'control-handoff-missing'` reasons to `ProcessHubAttentionReason`.
> - `selectControlHandoffCandidates` returns `ProcessHubReviewItem[]` (originally planned to return `TInv[]` — symmetry change, simpler downstream).
> - `addMonthsClamped` private helper in `sustainment.ts` handles month-end overflow correctly.
>
> **Next: Phase B (Tasks 7–10, storage layer).** Start with Task 7 (IndexedDB v6 schema + migration test). All subsequent tasks proceed from this state.
>
> **To resume:**
>
> 1. `git fetch && git checkout feat/phase-6-sustainment`
> 2. Confirm at `57196a54` (or later if anyone else added commits).
> 3. Read this plan from "Task 7" onwards. Tasks 0–6 are done; their checkbox state is not individually updated, but the commit chain above is the source of truth.
> 4. Use `superpowers:subagent-driven-development` to dispatch each remaining task. Per-task: implementer → spec compliance review → code quality review → next.
> 5. Plan checkpoints at: end of Task 10 (storage complete), end of Task 14 (UI plumbed), before Task 20 (final review + merge).

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 6 of the Process Hub roadmap — sustainment records, sustainment review log, and control-handoff acknowledgements — extending the existing cadence board without a new top-level workspace.

**Architecture:** Three new types live in `@variscout/core` (`SustainmentRecord`, `SustainmentReview`, `ControlHandoff`) with no `InvestigationStatus` extension; the existing `SUSTAINMENT_STATUSES = {'resolved','controlled'}` set continues to gate sustainment. Records persist via IndexedDB v6 + Blob namespace `process-hubs/{hubId}/sustainment/`. UI extends the existing `ProcessHubCadenceQueues` sustainment region (rather than a sibling panel) and adds a fourth cadence question band. Editing happens via small popovers on the cadence row + a parallel entry in `Editor.tsx` status-override surface.

**Tech Stack:** TypeScript, React, Vitest, Dexie (IndexedDB), Azure Blob Storage, Tailwind v4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md` (status: draft, 2026-04-26).

**Plan-file note:** This plan is in `.claude/plans/` because it was written under plan mode. **Task 0** below moves it to `docs/superpowers/plans/2026-04-26-phase-6-implementation-plan.md` as the canonical project location, then commits.

---

## Resolved decisions (v1 defaults for the 6 open questions in the spec)

The spec leaves 6 open questions. To unblock implementation, this plan adopts these v1 defaults; revisit before Phase 6 GA:

1. **Cadence anchor**: `nextReviewDue` is anchored to `latestReviewAt` when present, else to the investigation's `verifiedAt` (the timestamp at which the investigation entered `verifying`/`resolved`), else to `createdAt` of the `SustainmentRecord`. A `nextDueFromCadence(record, now)` helper centralises the rule.
2. **Reopen semantics**: when an investigation moves out of `SUSTAINMENT_STATUSES`, the `SustainmentRecord` is **archived** (a `tombstoneAt` field set, not deleted) and removed from cadence queues. Reviews remain readable. If the investigation re-enters sustainment, a NEW record is created (no resurrection).
3. **Multi-investigation control**: v1 ships **one `ControlHandoff` per investigation**. Shared handoffs are out of scope; the `ControlHandoff` schema does not include an `investigationIds[]`. Tracked in NICE-TO-HAVE.
4. **CoScout proactivity**: the new question band is fully **passive** — CoScout reads sustainment counts/verdicts via context but does not draft suggested verdicts in v1.
5. **Handoff surfaces**: **closed enum** with `'other'` fallback (matches the spec's 9-value `ControlHandoffSurface`).
6. **Retention/PII**: sustainment records follow the **investigation's lifetime** (no separate retention horizon). ADR-059 customer-tenant invariants apply; no new PII boundary work in Phase 6.

---

## File structure (locked)

### New files

- `packages/core/src/sustainment.ts` — types + helpers + selectors (single file, ~250 LOC).
- `packages/core/src/__tests__/sustainment.test.ts` — core tests.
- `apps/azure/src/components/ProcessHubSustainmentRegion.tsx` — extracted sustainment cadence region (kept out of `ProcessHubCadenceQueues` to keep that file under 400 LOC).
- `apps/azure/src/components/SustainmentRecordEditor.tsx` — popover for cadence/owner/next-due.
- `apps/azure/src/components/SustainmentReviewLogger.tsx` — popover for verdict + observation + snapshot ref.
- `apps/azure/src/components/ControlHandoffEditor.tsx` — popover for surface/system/owner/handoff date.
- `apps/azure/src/components/__tests__/ProcessHubSustainmentRegion.test.tsx` — component tests.
- `apps/azure/src/services/__tests__/sustainmentStorage.test.ts` — IndexedDB + cloud sync round-trip.

### Modified files

- `packages/core/src/processHub.ts` — extend `buildProcessHubCadence` to include sustainment selectors; add `metadata.sustainment` projection support.
- `packages/core/src/projectMetadata.ts` — add `sustainment` to `ProcessHubInvestigationMetadata`.
- `packages/core/src/index.ts` — export new types and helpers.
- `packages/core/src/__tests__/processHub.test.ts` — extend cadence/snapshot tests for new sustainment lane.
- `apps/azure/src/db/schema.ts` — bump v5 → v6 with 3 new stores.
- `apps/azure/src/services/localDb.ts` — CRUD for the 3 new record types.
- `apps/azure/src/services/cloudSync.ts` — Blob round-trip for the 3 new record types.
- `apps/azure/src/services/blobClient.ts` — namespace path helpers.
- `apps/azure/src/services/storage.ts` — expose new ops via `useStorage`.
- `apps/azure/src/components/ProcessHubCadenceQuestions.tsx` — add fourth question band when sustainment exists.
- `apps/azure/src/components/ProcessHubCadenceQueues.tsx` — replace existing inline sustainment block with `<ProcessHubSustainmentRegion />`.
- `apps/azure/src/components/ProcessHubFormat.ts` — add `formatSustainmentVerdict`, `formatSustainmentDue`, `formatHandoffSurface`.
- `apps/azure/src/pages/Editor.tsx` — entry point near investigation-status override.
- `apps/azure/src/pages/Dashboard.tsx` — pass `sustainmentRecords`/`controlHandoffs` to `ProcessHubReviewPanel` (similar to evidence snapshots).

---

## Task 0: Move plan to project canonical location

**Files:**

- Create: `docs/superpowers/plans/2026-04-26-phase-6-implementation-plan.md`
- Delete: `.claude/plans/we-have-done-a-nested-chipmunk.md` (after copy)

- [ ] **Step 1: Copy this plan to project location**

```bash
mkdir -p docs/superpowers/plans
cp /Users/jukka-mattiturtiainen/.claude/plans/we-have-done-a-nested-chipmunk.md \
   docs/superpowers/plans/2026-04-26-phase-6-implementation-plan.md
```

- [ ] **Step 2: Verify and commit**

```bash
git add docs/superpowers/plans/2026-04-26-phase-6-implementation-plan.md
git commit -m "docs(plans): add Phase 6 implementation plan"
```

---

## Task 1: Branch + scaffold sustainment.ts skeleton

**Files:**

- Create: `packages/core/src/sustainment.ts`
- Create: `packages/core/src/__tests__/sustainment.test.ts`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/phase-6-sustainment
```

- [ ] **Step 2: Write the type definitions**

Create `packages/core/src/sustainment.ts`:

```ts
import type { ProcessHub, ProcessHubInvestigation, ProcessHubRollup } from './processHub';

export interface ProcessParticipantRef {
  id: string;
  displayName: string;
  email?: string;
}

export type SustainmentCadence =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'on-demand';

export type SustainmentVerdict = 'holding' | 'drifting' | 'broken' | 'inconclusive';

export type ControlHandoffSurface =
  | 'mes-recipe'
  | 'scada-alarm'
  | 'qms-procedure'
  | 'work-instruction'
  | 'training-record'
  | 'audit-program'
  | 'dashboard-only'
  | 'ticket-queue'
  | 'other';

export interface SustainmentRecord {
  id: string;
  investigationId: string;
  hubId: string;
  cadence: SustainmentCadence;
  nextReviewDue?: string;
  latestVerdict?: SustainmentVerdict;
  latestReviewAt?: string;
  latestReviewId?: string;
  owner?: ProcessParticipantRef;
  openConcerns?: string;
  controlHandoffId?: string;
  /** Set when the investigation has left SUSTAINMENT_STATUSES; record is archived but readable. */
  tombstoneAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SustainmentReview {
  id: string;
  recordId: string;
  investigationId: string;
  hubId: string;
  reviewedAt: string;
  reviewer: ProcessParticipantRef;
  verdict: SustainmentVerdict;
  snapshotId?: string;
  observation?: string;
  escalatedInvestigationId?: string;
}

export interface ControlHandoff {
  id: string;
  investigationId: string;
  hubId: string;
  surface: ControlHandoffSurface;
  systemName: string;
  operationalOwner: ProcessParticipantRef;
  handoffDate: string;
  description: string;
  referenceUri?: string;
  retainSustainmentReview: boolean;
  recordedAt: string;
  recordedBy: ProcessParticipantRef;
}

export interface SustainmentMetadataProjection {
  recordId: string;
  cadence: SustainmentCadence;
  nextReviewDue?: string;
  latestVerdict?: SustainmentVerdict;
  handoffSurface?: ControlHandoffSurface;
}
```

- [ ] **Step 3: Write the cadence-anchor helper test (failing)**

Create `packages/core/src/__tests__/sustainment.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextDueFromCadence } from '../sustainment';

describe('nextDueFromCadence', () => {
  it('adds 7 days for weekly cadence anchored to a known timestamp', () => {
    const result = nextDueFromCadence('weekly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-05-03T00:00:00.000Z');
  });

  it('adds 14 days for biweekly cadence', () => {
    const result = nextDueFromCadence('biweekly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-05-10T00:00:00.000Z');
  });

  it('adds 30 days for monthly cadence', () => {
    const result = nextDueFromCadence('monthly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-05-26T00:00:00.000Z');
  });

  it('returns undefined for on-demand cadence', () => {
    const result = nextDueFromCadence('on-demand', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run test to verify failure**

```bash
pnpm --filter @variscout/core test -- --run sustainment
```

Expected: `nextDueFromCadence is not a function`.

- [ ] **Step 5: Implement nextDueFromCadence**

Append to `packages/core/src/sustainment.ts`:

```ts
const CADENCE_DAYS: Record<SustainmentCadence, number | null> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
  semiannual: 182,
  annual: 365,
  'on-demand': null,
};

export function nextDueFromCadence(cadence: SustainmentCadence, anchor: Date): string | undefined {
  const days = CADENCE_DAYS[cadence];
  if (days === null) return undefined;
  const result = new Date(anchor.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}
```

- [ ] **Step 6: Run test to verify pass**

```bash
pnpm --filter @variscout/core test -- --run sustainment
```

Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/sustainment.ts packages/core/src/__tests__/sustainment.test.ts
git commit -m "feat(core): scaffold Phase 6 sustainment types + nextDueFromCadence"
```

---

## Task 2: isSustainmentDue + isSustainmentOverdue helpers

**Files:**

- Modify: `packages/core/src/sustainment.ts`
- Modify: `packages/core/src/__tests__/sustainment.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `packages/core/src/__tests__/sustainment.test.ts`:

```ts
import { isSustainmentDue, isSustainmentOverdue, type SustainmentRecord } from '../sustainment';

function makeRecord(nextReviewDue?: string): SustainmentRecord {
  return {
    id: 'rec-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    cadence: 'monthly',
    nextReviewDue,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  };
}

describe('isSustainmentDue', () => {
  it('returns false when nextReviewDue is undefined', () => {
    expect(isSustainmentDue(makeRecord(), new Date('2026-04-26T00:00:00.000Z'))).toBe(false);
  });

  it('returns true when nextReviewDue is at or before now', () => {
    expect(
      isSustainmentDue(makeRecord('2026-04-26T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(true);
    expect(
      isSustainmentDue(makeRecord('2026-04-25T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(true);
  });

  it('returns false when nextReviewDue is in the future', () => {
    expect(
      isSustainmentDue(makeRecord('2026-04-27T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(false);
  });

  it('returns false for tombstoned records', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      tombstoneAt: '2026-04-20T00:00:00.000Z',
    };
    expect(isSustainmentDue(record, new Date('2026-04-26T00:00:00.000Z'))).toBe(false);
  });
});

describe('isSustainmentOverdue', () => {
  it('returns false within graceDays of nextReviewDue', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    expect(isSustainmentOverdue(record, new Date('2026-04-26T00:00:00.000Z'), 0)).toBe(false);
    expect(isSustainmentOverdue(record, new Date('2026-05-02T00:00:00.000Z'), 7)).toBe(false);
  });

  it('returns true past graceDays', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    expect(isSustainmentOverdue(record, new Date('2026-04-27T00:00:00.000Z'), 0)).toBe(true);
    expect(isSustainmentOverdue(record, new Date('2026-05-04T00:00:00.000Z'), 7)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm --filter @variscout/core test -- --run sustainment
```

Expected: 6 failures (functions undefined).

- [ ] **Step 3: Implement helpers**

Append to `packages/core/src/sustainment.ts`:

```ts
export function isSustainmentDue(record: SustainmentRecord, now: Date): boolean {
  if (record.tombstoneAt) return false;
  if (!record.nextReviewDue) return false;
  return new Date(record.nextReviewDue).getTime() <= now.getTime();
}

export function isSustainmentOverdue(
  record: SustainmentRecord,
  now: Date,
  graceDays: number = 0
): boolean {
  if (record.tombstoneAt) return false;
  if (!record.nextReviewDue) return false;
  const dueMs = new Date(record.nextReviewDue).getTime();
  const cutoffMs = dueMs + graceDays * 24 * 60 * 60 * 1000;
  return now.getTime() > cutoffMs;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/core test -- --run sustainment
```

Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/sustainment.ts packages/core/src/__tests__/sustainment.test.ts
git commit -m "feat(core): add isSustainmentDue + isSustainmentOverdue helpers"
```

---

## Task 3: Cadence selectors (selectSustainmentReviews, selectControlHandoffCandidates)

**Files:**

- Modify: `packages/core/src/sustainment.ts`
- Modify: `packages/core/src/__tests__/sustainment.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `packages/core/src/__tests__/sustainment.test.ts`:

```ts
import {
  selectSustainmentReviews,
  selectControlHandoffCandidates,
  type ControlHandoff,
} from '../sustainment';
import type { ProcessHubInvestigation } from '../processHub';

function makeInvestigation(
  id: string,
  status: ProcessHubInvestigation['metadata']['investigationStatus'],
  sustainment?: SustainmentRecord
): ProcessHubInvestigation {
  return {
    id,
    name: id,
    modified: '2026-04-26T00:00:00.000Z',
    metadata: {
      phase: 'improve',
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 0, completed: 0, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
      processHubId: 'hub-1',
      investigationStatus: status,
      sustainment: sustainment
        ? {
            recordId: sustainment.id,
            cadence: sustainment.cadence,
            nextReviewDue: sustainment.nextReviewDue,
            latestVerdict: sustainment.latestVerdict,
          }
        : undefined,
    },
  };
}

describe('selectSustainmentReviews', () => {
  it('returns only investigations with a due record', () => {
    const due = makeRecord('2026-04-25T00:00:00.000Z');
    const future = makeRecord('2026-05-25T00:00:00.000Z');
    const investigations = [
      makeInvestigation('inv-1', 'resolved', due),
      makeInvestigation('inv-2', 'controlled', future),
      makeInvestigation('inv-3', 'investigating'),
    ];
    const records = [
      { ...due, investigationId: 'inv-1' },
      { ...future, id: 'rec-2', investigationId: 'inv-2' },
    ];

    const result = selectSustainmentReviews(
      investigations,
      records,
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.investigation.id)).toEqual(['inv-1']);
  });

  it('excludes controlled investigations whose ControlHandoff.retainSustainmentReview is false', () => {
    const due = makeRecord('2026-04-25T00:00:00.000Z');
    const investigations = [makeInvestigation('inv-1', 'controlled', due)];
    const records = [{ ...due, investigationId: 'inv-1' }];
    const handoffs: ControlHandoff[] = [
      {
        id: 'h-1',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        surface: 'mes-recipe',
        systemName: 'MES',
        operationalOwner: { id: 'u-1', displayName: 'Op' },
        handoffDate: '2026-04-26T00:00:00.000Z',
        description: '',
        retainSustainmentReview: false,
        recordedAt: '2026-04-26T00:00:00.000Z',
        recordedBy: { id: 'u-1', displayName: 'Op' },
      },
    ];

    const result = selectSustainmentReviews(
      investigations,
      records,
      handoffs,
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result).toEqual([]);
  });
});

describe('selectControlHandoffCandidates', () => {
  it('returns controlled investigations with no handoff record', () => {
    const investigations = [
      makeInvestigation('inv-1', 'controlled'),
      makeInvestigation('inv-2', 'resolved'),
      makeInvestigation('inv-3', 'controlled'),
    ];
    const handoffs: ControlHandoff[] = [
      {
        id: 'h-3',
        investigationId: 'inv-3',
        hubId: 'hub-1',
        surface: 'qms-procedure',
        systemName: 'QMS',
        operationalOwner: { id: 'u-1', displayName: 'Op' },
        handoffDate: '2026-04-20T00:00:00.000Z',
        description: '',
        retainSustainmentReview: true,
        recordedAt: '2026-04-20T00:00:00.000Z',
        recordedBy: { id: 'u-1', displayName: 'Op' },
      },
    ];

    const result = selectControlHandoffCandidates(investigations, handoffs);

    expect(result.map(i => i.id)).toEqual(['inv-1']);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm --filter @variscout/core test -- --run sustainment
```

Expected: 3 failures.

- [ ] **Step 3: Implement selectors**

Append to `packages/core/src/sustainment.ts`:

```ts
import type { ProcessHubInvestigation, ProcessHubReviewItem } from './processHub';

export function selectSustainmentReviews<TInv extends ProcessHubInvestigation>(
  investigations: TInv[],
  records: SustainmentRecord[],
  handoffs: ControlHandoff[],
  now: Date
): ProcessHubReviewItem<TInv>[] {
  const recordByInvestigation = new Map(records.map(r => [r.investigationId, r]));
  const handoffByInvestigation = new Map(handoffs.map(h => [h.investigationId, h]));

  return investigations
    .filter(inv => {
      const status = inv.metadata?.investigationStatus;
      if (status !== 'resolved' && status !== 'controlled') return false;
      const record = recordByInvestigation.get(inv.id);
      if (!record || !isSustainmentDue(record, now)) return false;
      if (status === 'controlled') {
        const handoff = handoffByInvestigation.get(inv.id);
        if (handoff && handoff.retainSustainmentReview === false) return false;
      }
      return true;
    })
    .map(inv => ({
      investigation: inv,
      reasons: [],
      changeSignalCount: inv.metadata?.reviewSignal?.changeSignals?.total ?? 0,
      overdueActionCount: inv.metadata?.actionCounts?.overdue ?? 0,
      nextMove: inv.metadata?.nextMove,
      readinessReasons: [],
    }));
}

export function selectControlHandoffCandidates<TInv extends ProcessHubInvestigation>(
  investigations: TInv[],
  handoffs: ControlHandoff[]
): TInv[] {
  const handoffByInvestigation = new Set(handoffs.map(h => h.investigationId));
  return investigations.filter(
    inv => inv.metadata?.investigationStatus === 'controlled' && !handoffByInvestigation.has(inv.id)
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/core test -- --run sustainment
```

Expected: 13 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/sustainment.ts packages/core/src/__tests__/sustainment.test.ts
git commit -m "feat(core): add selectSustainmentReviews + selectControlHandoffCandidates"
```

---

## Task 4: Wire sustainment into ProcessHubInvestigationMetadata

**Files:**

- Modify: `packages/core/src/projectMetadata.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Locate ProcessHubInvestigationMetadata**

```bash
grep -n "ProcessHubInvestigationMetadata\b" packages/core/src/projectMetadata.ts
```

- [ ] **Step 2: Add `sustainment` field**

Edit `packages/core/src/projectMetadata.ts`. Inside the `ProcessHubInvestigationMetadata` interface, add the optional projection field:

```ts
import type { SustainmentMetadataProjection } from './sustainment';

export interface ProcessHubInvestigationMetadata {
  // ... existing fields unchanged
  sustainment?: SustainmentMetadataProjection;
}
```

- [ ] **Step 3: Export new types from core barrel**

Edit `packages/core/src/index.ts`. Add:

```ts
export type {
  SustainmentRecord,
  SustainmentReview,
  ControlHandoff,
  SustainmentCadence,
  SustainmentVerdict,
  ControlHandoffSurface,
  SustainmentMetadataProjection,
  ProcessParticipantRef,
} from './sustainment';
export {
  nextDueFromCadence,
  isSustainmentDue,
  isSustainmentOverdue,
  selectSustainmentReviews,
  selectControlHandoffCandidates,
} from './sustainment';
```

- [ ] **Step 4: Verify core build**

```bash
pnpm --filter @variscout/core build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/projectMetadata.ts packages/core/src/index.ts
git commit -m "feat(core): expose Phase 6 types from @variscout/core; wire sustainment metadata projection"
```

---

## Task 5: Extend buildProcessHubCadence with sustainment lane

**Files:**

- Modify: `packages/core/src/processHub.ts`
- Modify: `packages/core/src/__tests__/processHub.test.ts`

- [ ] **Step 1: Add failing test for cadence sustainment integration**

Append to `packages/core/src/__tests__/processHub.test.ts`:

```ts
import type { SustainmentRecord, ControlHandoff } from '../sustainment';

describe('buildProcessHubCadence — sustainment lane', () => {
  it('populates the sustainment queue from due records and excludes future-due ones', () => {
    const hubs: ProcessHub[] = [
      { id: 'hub-1', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const now = new Date('2026-04-26T00:00:00.000Z');
    const investigations = [
      {
        id: 'inv-due',
        name: 'Due review',
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'hub-1',
          investigationStatus: 'resolved',
          sustainment: {
            recordId: 'rec-due',
            cadence: 'monthly' as const,
            nextReviewDue: '2026-04-25T00:00:00.000Z',
          },
        }),
      },
    ];
    const sustainmentRecords: SustainmentRecord[] = [
      {
        id: 'rec-due',
        investigationId: 'inv-due',
        hubId: 'hub-1',
        cadence: 'monthly',
        nextReviewDue: '2026-04-25T00:00:00.000Z',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
    ];

    const [rollup] = buildProcessHubRollups(hubs, investigations, {
      sustainmentRecords,
      controlHandoffs: [],
    });
    const cadence = buildProcessHubCadence(rollup, now);

    expect(cadence.sustainment.totalCount).toBe(1);
    expect(cadence.sustainment.items[0].investigation.id).toBe('inv-due');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/core test -- --run processHub
```

Expected: type error or runtime failure (options field unknown).

- [ ] **Step 3: Extend buildProcessHubRollups options**

Edit `packages/core/src/processHub.ts`. Locate `buildProcessHubRollups` signature (around line 296) and extend the options type:

```ts
export function buildProcessHubRollups<TInvestigation extends ProcessHubInvestigation>(
  hubs: ProcessHub[],
  investigations: TInvestigation[],
  options: {
    evidenceSnapshots?: EvidenceSnapshot[];
    sustainmentRecords?: SustainmentRecord[];
    controlHandoffs?: ControlHandoff[];
  } = {}
): ProcessHubRollup<TInvestigation>[] {
```

Add the corresponding fields to `ProcessHubRollup<T>` interface (locate near line 80–100):

```ts
export interface ProcessHubRollup<TInvestigation = ProcessHubInvestigation> {
  // ... existing fields
  sustainmentRecords: SustainmentRecord[];
  controlHandoffs: ControlHandoff[];
}
```

Inside `buildProcessHubRollups`, group records/handoffs by hub and assign to each rollup (mirror the `evidenceSnapshots` grouping pattern at line ~353).

- [ ] **Step 4: Extend buildProcessHubCadence to accept `now`**

Edit `buildProcessHubCadence` (line ~616). Change signature to accept an optional `now` parameter:

```ts
export function buildProcessHubCadence<TInvestigation extends ProcessHubInvestigation>(
  rollup: ProcessHubRollup<TInvestigation>,
  now: Date = new Date()
): ProcessHubCadenceSummary<TInvestigation> {
```

Inside, build the sustainment queue using `selectSustainmentReviews(rollup.investigations, rollup.sustainmentRecords, rollup.controlHandoffs, now)` and limit via `cadenceQueue()`.

- [ ] **Step 5: Run test to verify pass**

```bash
pnpm --filter @variscout/core test -- --run processHub
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/__tests__/processHub.test.ts
git commit -m "feat(core): wire sustainment lane into buildProcessHubCadence"
```

---

## Task 6: Extend ProcessHubContextContract with sustainment summary

**Files:**

- Modify: `packages/core/src/processHub.ts`
- Modify: `packages/core/src/__tests__/processHub.test.ts`

- [ ] **Step 1: Add failing test**

Append to `processHub.test.ts`:

```ts
describe('buildProcessHubContext — sustainment', () => {
  it('exposes due, overdue, and verdict counts (no PII)', () => {
    const now = new Date('2026-04-26T00:00:00.000Z');
    const hubs = [{ id: 'hub-1', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' }];
    const investigations = [
      {
        id: 'inv-1',
        name: 'A',
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({ processHubId: 'hub-1', investigationStatus: 'resolved' }),
      },
    ];
    const sustainmentRecords: SustainmentRecord[] = [
      {
        id: 'rec-1',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        cadence: 'monthly',
        nextReviewDue: '2026-04-25T00:00:00.000Z',
        latestVerdict: 'holding',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
    ];

    const [rollup] = buildProcessHubRollups(hubs, investigations, {
      sustainmentRecords,
      controlHandoffs: [],
    });
    const context = buildProcessHubContext(rollup, now);

    expect(context.sustainment.due).toBe(1);
    expect(context.sustainment.overdue).toBe(1);
    expect(context.sustainment.verdicts).toEqual({ holding: 1 });
    expect(JSON.stringify(context)).not.toContain('reviewer');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/core test -- --run processHub
```

- [ ] **Step 3: Extend ProcessHubContextContract**

In `processHub.ts`, locate the `ProcessHubContextContract` interface (around line 155). Replace the existing `sustainment: { candidates: number }` with:

```ts
sustainment: {
  candidates: number;
  due: number;
  overdue: number;
  verdicts: Partial<Record<SustainmentVerdict, number>>;
}
```

Update `buildProcessHubContext` (around line 667) to populate the new fields by iterating `rollup.sustainmentRecords` against `now` (use `isSustainmentDue` and `isSustainmentOverdue`).

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm --filter @variscout/core test -- --run processHub
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/__tests__/processHub.test.ts
git commit -m "feat(core): extend ProcessHubContextContract with sustainment summary (due/overdue/verdicts)"
```

---

## Task 7: IndexedDB v6 schema + migration test

**Files:**

- Modify: `apps/azure/src/db/schema.ts`
- Create: `apps/azure/src/db/__tests__/schema.v6.test.ts`

- [ ] **Step 1: Write the failing migration test**

Create `apps/azure/src/db/__tests__/schema.v6.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db, openDb } from '../schema';

describe('IndexedDB schema v6', () => {
  beforeEach(async () => {
    await db.delete();
  });

  it('opens at version 6 from clean state with sustainment stores', async () => {
    await openDb();
    const storeNames = Array.from(db.tables.map(t => t.name));
    expect(storeNames).toContain('sustainmentRecords');
    expect(storeNames).toContain('sustainmentReviews');
    expect(storeNames).toContain('controlHandoffs');
  });

  it('upgrades from v5 to v6 without data loss in pre-existing stores', async () => {
    const v5 = new Dexie('VariScoutDB');
    v5.version(5).stores({
      projects: 'id, name, modified',
      processHubs: 'id, name',
      evidenceSources: 'id, hubId',
    });
    await v5.open();
    await v5.table('processHubs').put({ id: 'hub-1', name: 'Line 4' });
    v5.close();

    await openDb();
    const hub = await db.table('processHubs').get('hub-1');
    expect(hub?.name).toBe('Line 4');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/azure-app test -- --run schema.v6
```

Expected: failure (`sustainmentRecords` not in store names).

- [ ] **Step 3: Bump schema to v6**

Edit `apps/azure/src/db/schema.ts`. After the v5 declaration:

```ts
db.version(6).stores({
  ...allV5Stores,
  sustainmentRecords: 'id, investigationId, hubId, nextReviewDue, updatedAt, tombstoneAt',
  sustainmentReviews: 'id, recordId, investigationId, hubId, reviewedAt',
  controlHandoffs: 'id, investigationId, hubId, handoffDate',
});
```

(Replace `allV5Stores` with the actual v5 stores object literal — read the existing file to copy the names.)

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm --filter @variscout/azure-app test -- --run schema.v6
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/db/schema.ts apps/azure/src/db/__tests__/schema.v6.test.ts
git commit -m "feat(db): bump IndexedDB schema to v6 with Phase 6 sustainment stores"
```

---

## Task 8: localDb CRUD for sustainment record types

**Files:**

- Modify: `apps/azure/src/services/localDb.ts`
- Create: `apps/azure/src/services/__tests__/sustainmentStorage.test.ts`

- [ ] **Step 1: Write failing round-trip tests**

Create `apps/azure/src/services/__tests__/sustainmentStorage.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../db/schema';
import {
  saveSustainmentRecordToIndexedDB,
  listSustainmentRecordsFromIndexedDB,
  saveSustainmentReviewToIndexedDB,
  listSustainmentReviewsFromIndexedDB,
  saveControlHandoffToIndexedDB,
  listControlHandoffsFromIndexedDB,
} from '../localDb';
import type { SustainmentRecord, SustainmentReview, ControlHandoff } from '@variscout/core';

const makeRecord = (overrides: Partial<SustainmentRecord> = {}): SustainmentRecord => ({
  id: 'rec-1',
  investigationId: 'inv-1',
  hubId: 'hub-1',
  cadence: 'monthly',
  nextReviewDue: '2026-05-26T00:00:00.000Z',
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

describe('sustainment storage round-trip', () => {
  beforeEach(async () => {
    await db.delete();
  });

  it('round-trips a SustainmentRecord', async () => {
    await saveSustainmentRecordToIndexedDB(makeRecord());
    const result = await listSustainmentRecordsFromIndexedDB('hub-1');
    expect(result).toHaveLength(1);
    expect(result[0].cadence).toBe('monthly');
  });

  it('appends SustainmentReviews and reads them ordered by reviewedAt desc', async () => {
    const r1: SustainmentReview = {
      id: 'r-1',
      recordId: 'rec-1',
      investigationId: 'inv-1',
      hubId: 'hub-1',
      reviewedAt: '2026-04-20T00:00:00.000Z',
      reviewer: { id: 'u-1', displayName: 'Alice' },
      verdict: 'holding',
    };
    const r2: SustainmentReview = { ...r1, id: 'r-2', reviewedAt: '2026-04-26T00:00:00.000Z' };

    await saveSustainmentReviewToIndexedDB(r1);
    await saveSustainmentReviewToIndexedDB(r2);

    const result = await listSustainmentReviewsFromIndexedDB('rec-1');
    expect(result.map(r => r.id)).toEqual(['r-2', 'r-1']);
  });

  it('round-trips a ControlHandoff', async () => {
    const handoff: ControlHandoff = {
      id: 'h-1',
      investigationId: 'inv-1',
      hubId: 'hub-1',
      surface: 'mes-recipe',
      systemName: 'MES',
      operationalOwner: { id: 'u-1', displayName: 'Op' },
      handoffDate: '2026-04-26T00:00:00.000Z',
      description: 'Recipe lock',
      retainSustainmentReview: false,
      recordedAt: '2026-04-26T00:00:00.000Z',
      recordedBy: { id: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);
    const result = await listControlHandoffsFromIndexedDB('hub-1');
    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe('mes-recipe');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
```

Expected: import errors.

- [ ] **Step 3: Implement CRUD in localDb.ts**

Append to `apps/azure/src/services/localDb.ts`:

```ts
import type { SustainmentRecord, SustainmentReview, ControlHandoff } from '@variscout/core';

export async function saveSustainmentRecordToIndexedDB(record: SustainmentRecord): Promise<void> {
  await db.table('sustainmentRecords').put(record);
}

export async function listSustainmentRecordsFromIndexedDB(
  hubId: string
): Promise<SustainmentRecord[]> {
  return db.table('sustainmentRecords').where('hubId').equals(hubId).toArray();
}

export async function saveSustainmentReviewToIndexedDB(review: SustainmentReview): Promise<void> {
  await db.table('sustainmentReviews').put(review);
}

export async function listSustainmentReviewsFromIndexedDB(
  recordId: string
): Promise<SustainmentReview[]> {
  const rows = await db.table('sustainmentReviews').where('recordId').equals(recordId).toArray();
  return rows.sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));
}

export async function saveControlHandoffToIndexedDB(handoff: ControlHandoff): Promise<void> {
  await db.table('controlHandoffs').put(handoff);
}

export async function listControlHandoffsFromIndexedDB(hubId: string): Promise<ControlHandoff[]> {
  return db.table('controlHandoffs').where('hubId').equals(hubId).toArray();
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/localDb.ts apps/azure/src/services/__tests__/sustainmentStorage.test.ts
git commit -m "feat(azure): localDb CRUD for SustainmentRecord, SustainmentReview, ControlHandoff"
```

---

## Task 9: Blob client paths + cloud sync round-trip

**Files:**

- Modify: `apps/azure/src/services/blobClient.ts`
- Modify: `apps/azure/src/services/cloudSync.ts`
- Modify: `apps/azure/src/services/__tests__/sustainmentStorage.test.ts` (add blob path tests)

- [ ] **Step 1: Write failing path-helper tests**

Append to `sustainmentStorage.test.ts`:

```ts
import {
  sustainmentRecordBlobPath,
  sustainmentReviewBlobPath,
  controlHandoffBlobPath,
  sustainmentCatalogPath,
} from '../cloudSync';

describe('sustainment Blob namespace', () => {
  it('builds record paths under process-hubs/{hubId}/sustainment/records/', () => {
    expect(sustainmentRecordBlobPath('hub-1', 'rec-1')).toBe(
      'process-hubs/hub-1/sustainment/records/rec-1.json'
    );
  });

  it('builds review paths under sustainment/reviews/{recordId}/{reviewId}.json', () => {
    expect(sustainmentReviewBlobPath('hub-1', 'rec-1', 'r-1')).toBe(
      'process-hubs/hub-1/sustainment/reviews/rec-1/r-1.json'
    );
  });

  it('builds handoff paths under sustainment/handoffs/', () => {
    expect(controlHandoffBlobPath('hub-1', 'h-1')).toBe(
      'process-hubs/hub-1/sustainment/handoffs/h-1.json'
    );
  });

  it('builds the catalog path', () => {
    expect(sustainmentCatalogPath('hub-1')).toBe('process-hubs/hub-1/sustainment/_index.json');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
```

- [ ] **Step 3: Implement path helpers + sync functions**

Append to `apps/azure/src/services/cloudSync.ts`:

```ts
export function sustainmentRecordBlobPath(hubId: string, recordId: string): string {
  return `process-hubs/${hubId}/sustainment/records/${recordId}.json`;
}

export function sustainmentReviewBlobPath(
  hubId: string,
  recordId: string,
  reviewId: string
): string {
  return `process-hubs/${hubId}/sustainment/reviews/${recordId}/${reviewId}.json`;
}

export function controlHandoffBlobPath(hubId: string, handoffId: string): string {
  return `process-hubs/${hubId}/sustainment/handoffs/${handoffId}.json`;
}

export function sustainmentCatalogPath(hubId: string): string {
  return `process-hubs/${hubId}/sustainment/_index.json`;
}

// Plus saveSustainmentRecordToCloud, listSustainmentRecordsFromCloud, etc. — mirror the evidence-source pattern in this same file. Each function uses blobClient.* methods and the path helpers above.
```

Add corresponding methods to `blobClient.ts` (`saveBlobSustainmentRecord`, `listBlobSustainmentRecords`, `loadBlobSustainmentReview`, etc.) following the existing `saveBlobEvidenceSource` pattern.

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/cloudSync.ts apps/azure/src/services/blobClient.ts apps/azure/src/services/__tests__/sustainmentStorage.test.ts
git commit -m "feat(azure): Blob namespace helpers + cloud sync for Phase 6 sustainment records"
```

---

## Task 10: Wire useStorage facade for sustainment ops

**Files:**

- Modify: `apps/azure/src/services/storage.ts`

- [ ] **Step 1: Add new methods to useStorage interface**

Edit `apps/azure/src/services/storage.ts`. In the `StorageContextValue` interface (or equivalent), add:

```ts
listSustainmentRecords: (hubId: string) => Promise<SustainmentRecord[]>;
saveSustainmentRecord: (record: SustainmentRecord) => Promise<void>;
listSustainmentReviews: (recordId: string) => Promise<SustainmentReview[]>;
saveSustainmentReview: (review: SustainmentReview) => Promise<void>;
listControlHandoffs: (hubId: string) => Promise<ControlHandoff[]>;
saveControlHandoff: (handoff: ControlHandoff) => Promise<void>;
```

Implement each method following the exact pattern used by `saveEvidenceSource` (offline-first to IndexedDB, then fire-and-forget cloud sync).

- [ ] **Step 2: Run azure tests to verify nothing broke**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
pnpm --filter @variscout/azure-app test -- --run Dashboard.processHub
```

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/services/storage.ts
git commit -m "feat(azure): expose Phase 6 sustainment ops via useStorage facade"
```

---

## Task 11: ProcessHubFormat helpers for Phase 6

**Files:**

- Modify: `apps/azure/src/components/ProcessHubFormat.ts`

- [ ] **Step 1: Add format helpers**

Append to `apps/azure/src/components/ProcessHubFormat.ts`:

```ts
import type { SustainmentVerdict, ControlHandoffSurface } from '@variscout/core';
import { formatPlural } from '@variscout/core/i18n';

const VERDICT_LABELS: Record<SustainmentVerdict, string> = {
  holding: 'Holding',
  drifting: 'Drifting',
  broken: 'Broken',
  inconclusive: 'Inconclusive',
};

export const formatSustainmentVerdict = (v: SustainmentVerdict): string => VERDICT_LABELS[v];

export const formatSustainmentDue = (nextReviewDue: string | undefined, now: Date): string => {
  if (!nextReviewDue) return 'No cadence set';
  const dueMs = new Date(nextReviewDue).getTime();
  const days = Math.round((dueMs - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) {
    const overdue = Math.abs(days);
    return `${overdue} ${formatPlural(overdue, { one: 'day', other: 'days' })} overdue`;
  }
  if (days === 0) return 'Due today';
  return `Due in ${days} ${formatPlural(days, { one: 'day', other: 'days' })}`;
};

const HANDOFF_LABELS: Record<ControlHandoffSurface, string> = {
  'mes-recipe': 'MES recipe',
  'scada-alarm': 'SCADA alarm',
  'qms-procedure': 'QMS procedure',
  'work-instruction': 'Work instruction',
  'training-record': 'Training record',
  'audit-program': 'Audit program',
  'dashboard-only': 'Dashboard only',
  'ticket-queue': 'Ticket queue',
  other: 'Other',
};

export const formatHandoffSurface = (s: ControlHandoffSurface): string => HANDOFF_LABELS[s];
```

- [ ] **Step 2: Commit**

```bash
git add apps/azure/src/components/ProcessHubFormat.ts
git commit -m "feat(azure): add Phase 6 format helpers (verdict, due, handoff surface)"
```

---

## Task 12: ProcessHubSustainmentRegion component

**Files:**

- Create: `apps/azure/src/components/ProcessHubSustainmentRegion.tsx`
- Create: `apps/azure/src/components/__tests__/ProcessHubSustainmentRegion.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `ProcessHubSustainmentRegion.test.tsx` with these cases (mocking useStorage as in `Dashboard.processHub.test.tsx`):

- Renders the "set up sustainment" prompt for a `resolved` investigation with no record.
- Renders the sustainment-due queue when a due record exists.
- Renders the control-handoff candidate section when a `controlled` investigation has no handoff.
- Removes the row from sustainment-due when `ControlHandoff.retainSustainmentReview = false`.

Each test pattern: render with prepared `cadence` + `rollup`, assert by `screen.getByText` / `getByRole`. Reference `Dashboard.processHub.test.tsx` lines 1-90 for mock pattern.

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm --filter @variscout/azure-app test -- --run ProcessHubSustainmentRegion
```

- [ ] **Step 3: Implement the component**

Create `ProcessHubSustainmentRegion.tsx`. Exports a default `ProcessHubSustainmentRegion` component with props:

```tsx
interface ProcessHubSustainmentRegionProps {
  cadence: ProcessHubCadenceSummary<ProcessHubInvestigation>;
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onSetupSustainment: (investigationId: string) => void;
  onLogReview: (recordId: string) => void;
  onRecordHandoff: (investigationId: string) => void;
}
```

Internal sections:

- `<SustainmentDueQueue />` — uses `cadence.sustainment` queue, formats each row with verdict + due-by.
- `<ControlHandoffCandidatesQueue />` — uses `selectControlHandoffCandidates(rollup.investigations, rollup.controlHandoffs)`, prompts to record handoff.
- `<EmptyState />` — when no records exist for any sustainment-eligible investigations, prompts to set up.

Reuse `QueueSection`, `ReviewItemButton`, `MoreCount`, `SectionHeader` from `ProcessHubCadenceQueues.tsx` (extract them if needed; or keep this region self-contained — see Task 14).

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/azure-app test -- --run ProcessHubSustainmentRegion
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/ProcessHubSustainmentRegion.tsx apps/azure/src/components/__tests__/ProcessHubSustainmentRegion.test.tsx
git commit -m "feat(azure): ProcessHubSustainmentRegion component"
```

---

## Task 13: Three editor popovers (record, review, handoff)

**Files:**

- Create: `apps/azure/src/components/SustainmentRecordEditor.tsx`
- Create: `apps/azure/src/components/SustainmentReviewLogger.tsx`
- Create: `apps/azure/src/components/ControlHandoffEditor.tsx`
- Tests: piggyback on `ProcessHubSustainmentRegion.test.tsx`

- [ ] **Step 1: Implement SustainmentRecordEditor**

Props: `{ investigationId, hubId, existingRecord?, onSave: (record) => void, onCancel: () => void }`. Form fields: cadence (select), owner (text), nextReviewDue (date picker), openConcerns (textarea). On submit: build record (UUID + createdAt/updatedAt), call `useStorage().saveSustainmentRecord(record)`, then `onSave`.

- [ ] **Step 2: Implement SustainmentReviewLogger**

Props: `{ recordId, investigationId, hubId, latestSnapshot?, onSave, onCancel }`. Form fields: verdict (radio: holding/drifting/broken/inconclusive), observation (textarea), snapshotId (auto-fill from latestSnapshot, editable), escalatedInvestigationId (optional). On submit: build review, save via `useStorage().saveSustainmentReview`, then update the parent record's `latestVerdict`/`latestReviewAt`/`latestReviewId` + recompute `nextReviewDue` via `nextDueFromCadence(record.cadence, new Date(reviewedAt))`, then save the updated record.

- [ ] **Step 3: Implement ControlHandoffEditor**

Props: `{ investigationId, hubId, existingHandoff?, onSave, onCancel }`. Form fields: surface (select: 9 enum values from `ControlHandoffSurface`), systemName (text), operationalOwner (text), handoffDate (date), description (textarea), referenceUri (text, optional), retainSustainmentReview (checkbox). On submit: build handoff, save, then update the related `SustainmentRecord.controlHandoffId`.

- [ ] **Step 4: Add tests for each popover**

Append to `ProcessHubSustainmentRegion.test.tsx` — exercise each popover via the parent's open/close flow. Assert `mockSaveSustainmentRecord` etc. called with correct payloads.

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @variscout/azure-app test -- --run ProcessHubSustainmentRegion
```

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/SustainmentRecordEditor.tsx \
        apps/azure/src/components/SustainmentReviewLogger.tsx \
        apps/azure/src/components/ControlHandoffEditor.tsx \
        apps/azure/src/components/__tests__/ProcessHubSustainmentRegion.test.tsx
git commit -m "feat(azure): SustainmentRecordEditor + SustainmentReviewLogger + ControlHandoffEditor popovers"
```

---

## Task 14: Wire ProcessHubSustainmentRegion into ProcessHubCadenceQueues

**Files:**

- Modify: `apps/azure/src/components/ProcessHubCadenceQueues.tsx`

- [ ] **Step 1: Replace inline sustainment block**

Locate the existing `Sustainment` `<QueueSection>` block in `ProcessHubCadenceQueues.tsx` (inside the weekly column, around lines 290–320). Replace with `<ProcessHubSustainmentRegion ... />`.

- [ ] **Step 2: Run all process-hub tests to verify nothing broke**

```bash
pnpm --filter @variscout/azure-app test -- --run ProcessHub
```

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/components/ProcessHubCadenceQueues.tsx
git commit -m "feat(azure): wire ProcessHubSustainmentRegion into cadence queues"
```

---

## Task 15: Add fourth cadence question band

**Files:**

- Modify: `apps/azure/src/components/ProcessHubCadenceQuestions.tsx`
- Modify: `apps/azure/src/components/ProcessHubFormat.ts`

- [ ] **Step 1: Add buildSustainmentReviewBand helper**

In `ProcessHubFormat.ts`, add:

```ts
import type { ProcessHubRollup, ProcessHubInvestigation } from '@variscout/core';

export const sustainmentBandAnswer = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>,
  now: Date
): string | null => {
  const records = rollup.sustainmentRecords ?? [];
  const sustainmentEligible = rollup.investigations.some(
    inv =>
      inv.metadata?.investigationStatus === 'resolved' ||
      inv.metadata?.investigationStatus === 'controlled'
  );
  if (!sustainmentEligible) return null;
  const due = records.filter(
    r => r.nextReviewDue && new Date(r.nextReviewDue) <= now && !r.tombstoneAt
  ).length;
  const holdingCount = records.filter(r => r.latestVerdict === 'holding' && !r.tombstoneAt).length;
  if (due === 0 && holdingCount > 0) {
    return `${holdingCount} ${holdingCount === 1 ? 'investigation is' : 'investigations are'} holding; no review due.`;
  }
  if (due > 0) {
    return `${due} sustainment ${due === 1 ? 'review' : 'reviews'} due now.`;
  }
  return 'Set up sustainment cadence to monitor this.';
};
```

- [ ] **Step 2: Render the fourth band conditionally**

Edit `ProcessHubCadenceQuestions.tsx`. Add the band:

```tsx
const sustainmentAnswer = sustainmentBandAnswer(rollup, new Date());
{
  sustainmentAnswer && (
    <QuestionBand question="Is this control still holding?" answer={sustainmentAnswer} />
  );
}
```

Place it in the same grid; the grid drops to 4 columns on lg screens when the band is visible.

- [ ] **Step 3: Add a test**

Append to `Dashboard.processHub.test.tsx`: when the rollup has at least one resolved investigation with a sustainment record, the panel shows "Is this control still holding?" — assert via `getByText`.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/azure-app test -- --run Dashboard.processHub
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/ProcessHubCadenceQuestions.tsx \
        apps/azure/src/components/ProcessHubFormat.ts \
        apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx
git commit -m "feat(azure): add fourth cadence question band ('Is this control still holding?')"
```

---

## Task 16: Dashboard wiring — load sustainment records for selected hub

**Files:**

- Modify: `apps/azure/src/pages/Dashboard.tsx`

- [ ] **Step 1: Extend loadEvidenceForHub to also load sustainment data**

In `Dashboard.tsx`, the existing `loadEvidenceForHub` callback fetches evidence sources/snapshots. Extend it (or add a sibling `loadSustainmentForHub`) to also fetch:

```ts
const records = await listSustainmentRecords(hubId);
const handoffs = await listControlHandoffs(hubId);
setSustainmentRecords(records);
setControlHandoffs(handoffs);
```

Pass these into `buildProcessHubRollups({ ...existing, sustainmentRecords, controlHandoffs })`.

- [ ] **Step 2: Test that sustainment data appears for selected hub only**

Extend `Dashboard.processHub.test.tsx` with a test that mounts with 3 hubs, selects one, and asserts `mockListSustainmentRecords` was called only with the selected hub id (mirroring the existing lazy-load test).

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @variscout/azure-app test -- --run Dashboard.processHub
```

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/pages/Dashboard.tsx apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx
git commit -m "feat(azure): lazy-load sustainment records + control handoffs per selected hub"
```

---

## Task 17: Editor.tsx entry point near status override

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`

- [ ] **Step 1: Locate status override surface**

```bash
grep -n "investigationStatus" apps/azure/src/pages/Editor.tsx | head -10
```

- [ ] **Step 2: Add sustainment entry point**

Near the existing override UI, add a button "Set up sustainment cadence" that opens `<SustainmentRecordEditor />` when the new effective status is `resolved` or `controlled`. Save flows through `useStorage().saveSustainmentRecord`.

- [ ] **Step 3: Add minimal test**

In `Editor.test.tsx` (or sibling), add a test: when status is changed to `resolved` and there's no existing record, the "Set up sustainment cadence" button appears; clicking opens the editor.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/azure-app test -- --run Editor
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx
git commit -m "feat(azure): Editor sustainment entry point at investigation-status override"
```

---

## Task 18: Recompute metadata.sustainment projection on record write

**Files:**

- Modify: `apps/azure/src/services/storage.ts` (or where the projection recompute lives)

- [ ] **Step 1: Add the projection recompute**

When `saveSustainmentRecord` or `saveControlHandoff` runs, also update the corresponding investigation's `metadata.sustainment` projection so cadence rollups remain a pure function of `ProcessHubInvestigation` (per spec line 300-303).

```ts
async function recomputeSustainmentProjection(record: SustainmentRecord, handoff?: ControlHandoff) {
  const project = await loadProject(record.investigationId);
  if (!project) return;
  const projection: SustainmentMetadataProjection = {
    recordId: record.id,
    cadence: record.cadence,
    nextReviewDue: record.nextReviewDue,
    latestVerdict: record.latestVerdict,
    handoffSurface: handoff?.surface,
  };
  await saveProject({ ...project, metadata: { ...project.metadata, sustainment: projection } });
}
```

Wire this call site after both `saveSustainmentRecord` and `saveControlHandoff` (and after the review-driven record update).

- [ ] **Step 2: Add test**

Append to `sustainmentStorage.test.ts`: write a record, then load the project and assert `project.metadata.sustainment.recordId === record.id`.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
```

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/services/storage.ts apps/azure/src/services/__tests__/sustainmentStorage.test.ts
git commit -m "feat(azure): recompute metadata.sustainment projection on record/handoff/review write"
```

---

## Task 19: Handle archive-on-status-change (reopen semantics)

**Files:**

- Modify: `apps/azure/src/services/storage.ts` (or wherever the status transition is handled)

- [ ] **Step 1: Tombstone records when investigation leaves SUSTAINMENT_STATUSES**

When an investigation's status transitions out of `resolved`/`controlled`, set `tombstoneAt = new Date().toISOString()` on the active `SustainmentRecord` (no delete; keep audit trail).

- [ ] **Step 2: Test the transition**

In `sustainmentStorage.test.ts`: create record, then change investigation status to `improving`, assert record's `tombstoneAt` is set.

- [ ] **Step 3: Run tests + commit**

```bash
pnpm --filter @variscout/azure-app test -- --run sustainmentStorage
git add apps/azure/src/services/storage.ts apps/azure/src/services/__tests__/sustainmentStorage.test.ts
git commit -m "feat(azure): tombstone SustainmentRecord on investigation reopen"
```

---

## Task 20: pr-ready-check + subagent review + merge

**Files:** none new

- [ ] **Step 1: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green (tests + lint + docs:check).

- [ ] **Step 2: Dispatch code-review subagent**

Invoke `reviewer` subagent over the diff `main..feat/phase-6-sustainment` with focus areas:

- ADR-069 numeric safety in `nextDueFromCadence` and any rate calculations
- ADR-059 PII boundary: confirm no reviewer free-text leaks into App Insights or CoScout context
- Cross-package type exports (run `pnpm --filter @variscout/ui build` and `pnpm --filter @variscout/core build`)
- Schema migration safety (no data loss in pre-existing stores)
- The 6 spec acceptance criteria each verified

- [ ] **Step 3: Address must-fix items**

If the reviewer flags any must-fix, address in a follow-up commit on the branch. Re-run pr-ready-check.

- [ ] **Step 4: Merge to main**

```bash
git checkout main
git merge --ff-only feat/phase-6-sustainment
git push origin main
git branch -d feat/phase-6-sustainment
```

- [ ] **Step 5: Update memory + spec status**

- Update `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md` frontmatter `status: draft` → `status: in-progress` (or `delivered` if all acceptance criteria met).
- Update `docs/superpowers/specs/index.md` Status Matrix row.
- Update `~/.claude/projects/.../memory/project_process_hub.md` to mark Phase 6 as in-progress.
- Optionally store new architecture entries via `mcp__ruflo__memory_store`.

---

## Verification (end-to-end)

After all 20 tasks land:

1. **Tests**: `pnpm test` — all packages green (~5800 + ~30 new = ~5830 tests).
2. **Build**: `pnpm build` — all packages and apps build clean.
3. **docs:check**: `pnpm docs:check` — green; spec status promoted.
4. **Type exports**: `pnpm --filter @variscout/ui build` AND `pnpm --filter @variscout/azure-app build` both clean (catches sub-path export gaps that vitest misses, per `feedback_ui_build_before_merge`).
5. **Acceptance criteria walk** (per spec section, can be `claude --chrome` post-merge):
   - Move investigation `verifying` → `resolved` → "Set up sustainment" prompt appears → fill cadence/owner/due → row enters sustainment queue.
   - Log a `holding` review against latest Snapshot → cadence snapshot decrements due-count, increments reviewed-count.
   - Log a `drifting` review and escalate to a new investigation → new investigation appears in active depth queue.
   - Record a `ControlHandoff` with `retainSustainmentReview = false` → row leaves sustainment-due queue, handoff shown on investigation row.
6. **CoScout context smoke test**: `mcp__ruflo__memory_search { query: "sustainment" }` returns the new architecture entries; `buildProcessHubContext` output includes `sustainment.due/overdue/verdicts`.

---

## Self-review (per writing-plans skill)

**Spec coverage:** every section of the Phase 6 spec maps to at least one task —

- Types → Task 1
- Helpers (isSustainmentDue/Overdue, nextDueFromCadence) → Tasks 1, 2
- Selectors → Task 3
- Metadata extension → Task 4
- Cadence integration → Tasks 5, 14, 15
- CoScout context → Task 6
- IndexedDB v6 → Task 7
- localDb CRUD → Task 8
- Blob namespace → Task 9
- useStorage facade → Task 10
- Format helpers → Task 11
- Sustainment region UI → Task 12
- Three popover editors → Task 13
- Question band → Task 15
- Dashboard wiring → Task 16
- Editor entry point → Task 17
- Metadata projection recompute → Task 18
- Reopen tombstone → Task 19
- Test coverage → distributed across all tasks (TDD per skill)
- pr-ready-check + review + merge → Task 20

**Type consistency:** all type names taken verbatim from spec — `SustainmentRecord`, `SustainmentReview`, `ControlHandoff`, `SustainmentCadence`, `SustainmentVerdict`, `ControlHandoffSurface`, `SustainmentMetadataProjection`, `ProcessParticipantRef`. Helper names match spec: `isSustainmentDue`, `isSustainmentOverdue`, `selectSustainmentReviews`, `selectControlHandoffCandidates`, `buildSustainmentReviewBand` → renamed to `sustainmentBandAnswer` for compactness; alias if grep-friendly form is preferred.

**Placeholder scan:** no `TBD` / `implement later` / "similar to Task N". Each step has actual code or an exact command. The Task 9 cloud-sync helpers reference "mirror the evidence-source pattern" — that's a real pointer (file:section), not a placeholder.

**Open spec questions:** all 6 resolved at top of plan with v1 defaults; revisit before GA.

---

## Execution handoff

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration via `superpowers:subagent-driven-development`.
2. **Inline Execution** — Execute tasks in this session with checkpoints via `superpowers:executing-plans`.

Recommendation given the volume (20 tasks, ~3-5 days of work for a single engineer): **Subagent-Driven**, with a checkpoint review after Task 6 (core complete), Task 10 (storage complete), Task 14 (UI plumbed), and before Task 20 (final review + merge). The subagent review at Task 20 is a hard gate per CLAUDE.md product-code workflow.
