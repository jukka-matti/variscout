---
tier: ephemeral
purpose: build
title: 'PR-WV1-3b — MeasurementPlan + Investigation Wall integration (bite-sized plan)'
status: draft
last-reviewed: 2026-05-16
related:
  - docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/plans/2026-05-16-pr-wv1-3a-membership-cleanup.md
  - docs/superpowers/plans/2026-05-16-wedge-implementation.md
layer: spec
---

# PR-WV1-3b — MeasurementPlan + Investigation Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **TDD IS NON-NEGOTIABLE** per the user's standing reminder — every code-touching step follows red → green → commit.

**Goal:** Add `MeasurementPlan` as a real sub-entity per Hypothesis, persist via Dexie + the existing HubAction `applyAction.ts` dispatch, and integrate the UI (chip + form + linking picker + auto-suggest banner) into the Investigation Wall's detail surface so the V1 specialist's hypothesis-first deductive flow ships.

**Architecture:** New `@variscout/core/measurementPlan` sub-path (paired `package.json#exports` + `tsconfig.json#paths`). Reducer + action union follow the existing `MembershipAction` / `ActionItemAction` shape from PR-WV1-3a (4 kinds: ADD / UPDATE / REMOVE / LINK_FINDING). Persistence wires through the existing `HubAction` → `applyAction.ts` path in both PWA + Azure (NOT through the `useImprovementProjectStore.upsertProject` Zustand-direct path used in PR-WV1-3a's `<ImprovementView>` work — the Wall uses HubAction dispatch). The Wall today renders `<HypothesisCard>` as an SVG summary in `<WallCanvas>`; MeasurementPlan UI (forms + pickers) needs a DOM detail surface — Task 5 settles where that surface lives before Tasks 6–8 build the components.

**Tech Stack:** TypeScript + React 18 + Zustand + Dexie + Vitest + React Testing Library.

**Canonical spec:** [`docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md`](../specs/2026-05-16-pr-wv1-3-measurement-plans-design.md) §"PR-WV1-3b — MeasurementPlan + Wall integration".

---

## Branch setup

Worktree at `/Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans`, branch `feat/wedge-pr-wv1-3-measurement-plans`. Top commit `66a3c139` (PR-WV1-3a's docs commit — PR #186 is open, 11 commits ahead of PR-WV1-2). PR-WV1-3b commits stack on the same branch. When PR #186 squash-merges, GitHub auto-rebases.

Verify:

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans branch --show-current
# expect: feat/wedge-pr-wv1-3-measurement-plans

git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans log --oneline -3
# top commit: 66a3c139 docs(wedge): log PR-WV1-3a delivery + invitation persistence V2 follow-up
```

---

## Foundation already in place

**From PR-WV1-3a (just landed on this branch):**

- `MembershipAction` 5-variant union with composite `INVITATION_ACCEPT`.
- `ActionItemAction` 3-variant union + `reduceActionItems` reducer.
- Both apps' `applyAction.ts` exhaustive switches handle `ACTION_ITEM_*` kinds; `assertNever()` at the end of each switch.
- `<PendingInvitesBanner>` at `packages/ui/src/components/Home/`.
- `ImprovementProjectMetadata.actions?: ActionItem[]` field.

**From earlier wedge work (verified by scout):**

- **`Hypothesis` interface** at `packages/core/src/findings/types.ts:753` — extends `EntityBase`, has `findingIds: Finding['id'][]` (line 761). Field to add: `measurementPlanIds?: MeasurementPlan['id'][]` immediately after `findingIds`.
- **`Finding` interface** at `packages/core/src/findings/types.ts:550-602` — has `hypothesisId?` (implicit through `context`) NOT `hypothesisId` directly. The link-picker filters via `findings.filter(f => hypothesis.findingIds.includes(f.id))` (existing pattern), not `f.hypothesisId === plan.hypothesisId`. **Adapt the design spec's filter expression accordingly.**
- **Wall UI surface:** `<HypothesisCard>` (SVG summary) renders inside `<WallCanvas>`. Finding chips render at the `<WallCanvas>` level, NOT inside the hypothesis card. There's no DOM detail panel for hypothesis editing today — Task 5 settles whether to extend an existing surface or add one.
- **HubAction dispatch path:** All Wall mutations go through `dispatch(action: HubAction)` → `applyAction(db, action)` (transactional Dexie write). NOT Zustand direct methods. Both apps have a 600-line `applyAction.ts` switching on 40+ kinds. New `MEASUREMENT_PLAN_*` cases insert before the `INVESTIGATION_*` group at line ~390.
- **Azure Dexie schema:** `apps/azure/src/db/schema.ts` at version 6. PWA equivalent in `apps/pwa/src/persistence/`. Schema version bump to 7 for the new `measurementPlans` table.
- **Repository pattern:** `HubRepository` (from `@variscout/core/persistence`) read APIs follow `entity.listByHub(hubId)` shape. `hypotheses.listByInvestigation(investId)` exists. **Add:** `measurementPlans.listByHypothesis(hypothesisId)`.
- **`useViewStore`** at `packages/stores/src/viewStore.ts` — View-layer transient store. No precedent for per-Hypothesis dismissal state today; Task 8 adds `dismissedMeasurementPlanBannerByHypothesisId: Set<string>`.
- **`<HypothesisCard>` test pattern:** mocks `@variscout/stores` (useInvestigationStore + usePreferencesStore via `Object.assign(vi.fn(), { getState: () => ({ ... }) })`). Mirror for new components.
- **`canAccess` ACL:** reuse `'edit-approach'` (Plans live in Approach stage's Wall). No new `ProjectAction` enum value. Members source: passed as prop from the Wall's parent (e.g., Investigation view) since `<HypothesisCard>` doesn't carry membership context today.

---

## Architecture notes (scout-driven adaptations to spec)

1. **HubAction dispatch, not `upsertProject`.** Design spec §"Persistence + dispatch" says "MeasurementPlanAction flows through the same project-store dispatch pattern as MembershipAction and ActionItemAction." Scout confirms the Wall uses `HubAction` + `applyAction.ts`, NOT the `useImprovementProjectStore.upsertProject` path PR-WV1-3a used for `<ImprovementView>`. PR-WV1-3b matches Wall conventions: `MeasurementPlanAction` becomes part of the `HubAction` discriminated union, and both apps' `applyAction.ts` switches gain `MEASUREMENT_PLAN_*` cases.

2. **DOM detail surface, not SVG chips on canvas.** Spec §3.6.2 ASCII art shows two-half rows inside the Hypothesis card. Scout shows the card is small SVG summary; Finding chips render at canvas level; the form-heavy Plan UX (factor / method / sampleSize / owner picker / Link Finding picker / status banner) doesn't fit in SVG real estate. **Task 5 discovers OR creates a DOM detail panel** that opens when a Hypothesis is selected on the Wall. `<MeasurementPlanChip>` is a DOM component (`<div>` + Tailwind), NOT an SVG `<g>` element. Tasks 6–8 build into that surface.

3. **Finding-to-Plan link filter via `hypothesis.findingIds`, not `finding.hypothesisId`.** Scout shows `Finding` has no `hypothesisId` field; the relationship is stored as IDs on Hypothesis. `<LinkFindingPicker>` lists `findings.filter(f => hypothesis.findingIds.includes(f.id) && !plan.linkedFindingIds?.includes(f.id))`. Adjust spec wording accordingly.

4. **`HypothesisCard` membership context.** Scout: HypothesisCard doesn't currently receive `members[]` or `currentUserId`. Owner picker for Plans needs these. Two options:
   - Add `members` + `currentUserId` props to HypothesisCard and thread from the Wall's parent (e.g., Investigation view that already has active-IP context per `feedback_active_ip_cascade_pattern`).
   - Or thread them only into the new detail-panel surface (Task 5's output), avoiding HypothesisCard changes entirely.

   Plan: thread into the detail-panel surface only. HypothesisCard prop interface stays unchanged.

---

## File structure (after PR-WV1-3b lands)

**Create:**

- `packages/core/src/measurementPlan/types.ts` — `MeasurementPlan`, `MeasurementMethod`, `MeasurementPlanStatus`
- `packages/core/src/measurementPlan/actions.ts` — `MeasurementPlanAction`, `MeasurementPlanPatch`, `reduceMeasurementPlans`
- `packages/core/src/measurementPlan/index.ts` — barrel
- `packages/core/src/measurementPlan/__tests__/types.test.ts`
- `packages/core/src/measurementPlan/__tests__/actions.test.ts`
- `packages/ui/src/components/InvestigationWall/MeasurementPlanChip.tsx`
- `packages/ui/src/components/InvestigationWall/AddPlanForm.tsx`
- `packages/ui/src/components/InvestigationWall/LinkFindingPicker.tsx`
- `packages/ui/src/components/InvestigationWall/HypothesisDetailPanel.tsx` (NEW — Task 5; pending Step 1 discovery)
- `packages/ui/src/components/InvestigationWall/__tests__/MeasurementPlanChip.test.tsx`
- `packages/ui/src/components/InvestigationWall/__tests__/AddPlanForm.test.tsx`
- `packages/ui/src/components/InvestigationWall/__tests__/LinkFindingPicker.test.tsx`
- `packages/ui/src/components/InvestigationWall/__tests__/HypothesisDetailPanel.test.tsx`

**Modify:**

- `packages/core/package.json` — add `./measurementPlan` export entry
- `packages/core/tsconfig.json` — add `@variscout/core/measurementPlan` path
- `packages/core/src/findings/types.ts` — add `measurementPlanIds?` to `Hypothesis`
- `packages/core/src/findings/__tests__/types.test.ts` (or wherever Hypothesis is tested) — add round-trip test for the new field
- `packages/core/src/actions/index.ts` (or wherever `HubAction` union lives) — add `MeasurementPlanAction` to the union
- `apps/azure/src/db/schema.ts` — schema version 6 → 7; add `measurementPlans` table
- `apps/pwa/src/persistence/` schema equivalent
- `apps/azure/src/persistence/AzureHubRepository.ts` — add `measurementPlans.listByHypothesis(hypothesisId)`
- `apps/pwa/src/persistence/PwaHubRepository.ts` — same
- `apps/azure/src/persistence/applyAction.ts` — 3 new `MEASUREMENT_PLAN_*` cases before `INVESTIGATION_*` group
- `apps/pwa/src/persistence/applyAction.ts` — same
- `packages/ui/src/components/InvestigationWall/index.ts` — re-export new components
- `packages/stores/src/viewStore.ts` — add `dismissedMeasurementPlanBannerByHypothesisId: Set<string>` field + action
- `packages/stores/src/__tests__/viewStore.test.ts` — add tests for new state
- `packages/ui/src/components/InvestigationWall/HypothesisCard.tsx` OR `WallCanvas.tsx` — wire HypothesisDetailPanel integration (Task 7's seam, settled by Task 5)

**Sub-path exports paired:** Task 1 adds the new sub-path; BOTH `package.json#exports` AND `tsconfig.json#paths` updated together per root CLAUDE.md invariant.

---

## Repo invariants the implementer must honor

- TDD strictly. Every code-touching step has 5-step rhythm: write failing test → run-to-FAIL → implement → run-to-PASS → commit.
- No `Math.random`. Use `generateDeterministicId` from `@variscout/core/identity`.
- No "root cause" language anywhere (P5 amended).
- No `.toFixed()` on stat outputs (`packages/core/CLAUDE.md` hard rule — not relevant here but enforced).
- No `--no-verify` per `feedback_subagent_no_verify`. Pre-commit hooks must pass naturally.
- `<ENTITY>_UPDATE.patch` types use `Omit<E, 'id'|'createdAt'|'hubId'|'updatedAt'|'deletedAt'>` per `feedback_action_patch_omit_lifecycle`. `MeasurementPlanPatch` additionally omits `hypothesisId` (FK).
- Selectors required for Zustand reads at consumer sites — never bare `useStore()` (`packages/stores/CLAUDE.md`).
- `vi.mock()` BEFORE component imports (`.claude/rules/testing.md`).
- `feedback_no_backcompat_clean_architecture`: required props by default; no optional shims.
- `feedback_implementer_long_bash_pitfall`: targeted `pnpm --filter ... test -- <suite>` only. NO full-workspace `pnpm test`, NO `pnpm build`, NO `bash scripts/pr-ready-check.sh` in implementer tasks. Those belong to the controller's Task 9.
- `feedback_doc_validation_hooks`: plain-text paths in any decision-log entries placed inside HEREDOCs (NOT markdown link syntax — pre-commit dead-link checker reads naively and rejects unresolvable paths).

---

## Task 1 — `MeasurementPlan` type + `@variscout/core/measurementPlan` sub-path

**Goal:** Greenfield TDD types ship in a new `@variscout/core/measurementPlan` sub-path. Paired `package.json#exports` + `tsconfig.json#paths` updated together.

**Files:**

- Create: `packages/core/src/measurementPlan/types.ts`
- Create: `packages/core/src/measurementPlan/index.ts`
- Create: `packages/core/src/measurementPlan/__tests__/types.test.ts`
- Modify: `packages/core/package.json` (add `./measurementPlan` export)
- Modify: `packages/core/tsconfig.json` (add `@variscout/core/measurementPlan` path)

### Steps

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/measurementPlan/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { MeasurementPlan, MeasurementMethod, MeasurementPlanStatus } from '../types';
import type { ProjectMember } from '../../projectMembership/types';

describe('MeasurementMethod', () => {
  it('exhaustively enumerates 5 method values', () => {
    const methods: MeasurementMethod[] = [
      'sensor',
      'manual-count',
      'gemba-walk',
      'expert-assessment',
      'other',
    ];
    expect(methods).toHaveLength(5);
  });
});

describe('MeasurementPlanStatus', () => {
  it('exhaustively enumerates 4 status values', () => {
    const statuses: MeasurementPlanStatus[] = ['planned', 'in-progress', 'complete', 'skipped'];
    expect(statuses).toHaveLength(4);
  });
});

describe('MeasurementPlan', () => {
  it('has the wedge spec §3.6.3 shape', () => {
    const ownerId: ProjectMember['id'] = 'pm-1';
    const plan: MeasurementPlan = {
      id: 'mp-1',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      factor: 'Nozzle temperature',
      method: 'sensor',
      sampleSize: 50,
      owner: ownerId,
      status: 'planned',
    };
    expect(plan.factor).toBe('Nozzle temperature');
    expect(plan.method).toBe('sensor');
    expect(plan.sampleSize).toBe(50);
    expect(plan.status).toBe('planned');
    expect(plan.hypothesisId).toBe('h-1');
  });

  it('supports optional linkedFindingIds + msaRequired', () => {
    const plan: MeasurementPlan = {
      id: 'mp-2',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      factor: 'X',
      method: 'gemba-walk',
      sampleSize: 10,
      owner: 'pm-1',
      status: 'complete',
      linkedFindingIds: ['f-1', 'f-2'],
      msaRequired: true,
    };
    expect(plan.linkedFindingIds).toEqual(['f-1', 'f-2']);
    expect(plan.msaRequired).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/core test -- measurementPlan/__tests__/types
```

Expected: FAIL — "Cannot find module '../types'".

- [ ] **Step 3: Write the types**

```typescript
// packages/core/src/measurementPlan/types.ts
import type { EntityBase } from '../identity';
import type { Finding } from '../findings/types';
import type { Hypothesis } from '../findings/types';
import type { ProjectMember } from '../projectMembership/types';

export type MeasurementMethod =
  | 'sensor'
  | 'manual-count'
  | 'gemba-walk'
  | 'expert-assessment'
  | 'other';

export type MeasurementPlanStatus = 'planned' | 'in-progress' | 'complete' | 'skipped';

export interface MeasurementPlan extends EntityBase {
  hypothesisId: Hypothesis['id'];
  factor: string;
  method: MeasurementMethod;
  sampleSize: number;
  owner: ProjectMember['id'];
  status: MeasurementPlanStatus;
  linkedFindingIds?: Finding['id'][];
  msaRequired?: boolean;
}
```

```typescript
// packages/core/src/measurementPlan/index.ts
export type { MeasurementPlan, MeasurementMethod, MeasurementPlanStatus } from './types';
```

- [ ] **Step 4: Update `packages/core/package.json` exports**

Find the existing `exports` block. Add (matching the existing `./src/...` style — verify by reading other entries):

```json
"./measurementPlan": "./src/measurementPlan/index.ts"
```

- [ ] **Step 5: Update `packages/core/tsconfig.json` paths**

Find the existing `paths` block. Add:

```json
"@variscout/core/measurementPlan": ["./src/measurementPlan/index.ts"]
```

Verify BOTH `package.json#exports` AND `tsconfig.json#paths` are updated. Sub-path export pairs are a root CLAUDE.md invariant.

- [ ] **Step 6: Run to verify PASS**

```bash
pnpm --filter @variscout/core test -- measurementPlan/__tests__/types
```

Expected: 3/3 pass.

- [ ] **Step 7: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add packages/core/src/measurementPlan packages/core/package.json packages/core/tsconfig.json
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(core): add MeasurementPlan type + sub-path export"
```

---

## Task 2 — `MeasurementPlanAction` union + `reduceMeasurementPlans` reducer

**Goal:** 4-variant action union (`ADD | UPDATE | REMOVE | LINK_FINDING`) + pure reducer. `UPDATE.patch` omits lifecycle + identity + `hypothesisId` per `feedback_action_patch_omit_lifecycle`. `REMOVE` is soft-delete (sets `deletedAt`).

**Files:**

- Create: `packages/core/src/measurementPlan/actions.ts`
- Create: `packages/core/src/measurementPlan/__tests__/actions.test.ts`
- Modify: `packages/core/src/measurementPlan/index.ts` (re-export action types + reducer)

### Steps

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/measurementPlan/__tests__/actions.test.ts
import { describe, it, expect } from 'vitest';
import {
  reduceMeasurementPlans,
  type MeasurementPlanAction,
  type MeasurementPlanPatch,
} from '../actions';
import type { MeasurementPlan } from '../types';

const basePlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  factor: 'Nozzle temperature',
  method: 'sensor',
  sampleSize: 50,
  owner: 'pm-1',
  status: 'planned',
};

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_ADD', () => {
  it('appends a new plan', () => {
    const next = reduceMeasurementPlans([], {
      kind: 'MEASUREMENT_PLAN_ADD',
      plan: basePlan,
    });
    expect(next).toEqual([basePlan]);
  });
});

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_UPDATE', () => {
  it('merges patch onto the matched plan', () => {
    const start: MeasurementPlan[] = [basePlan];
    const patch: MeasurementPlanPatch = {
      status: 'in-progress',
      sampleSize: 75,
    };
    const next = reduceMeasurementPlans(start, {
      kind: 'MEASUREMENT_PLAN_UPDATE',
      planId: 'mp-1',
      patch,
    });
    expect(next).toHaveLength(1);
    expect(next[0].status).toBe('in-progress');
    expect(next[0].sampleSize).toBe(75);
    expect(next[0].id).toBe('mp-1');
    expect(next[0].createdAt).toBe(100);
    expect(next[0].hypothesisId).toBe('h-1');
  });

  it('leaves non-matching plans unchanged', () => {
    const otherPlan: MeasurementPlan = { ...basePlan, id: 'mp-2', factor: 'Other' };
    const next = reduceMeasurementPlans([basePlan, otherPlan], {
      kind: 'MEASUREMENT_PLAN_UPDATE',
      planId: 'mp-1',
      patch: { status: 'complete' },
    });
    expect(next[1]).toEqual(otherPlan);
  });
});

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_REMOVE', () => {
  it('soft-deletes the matched plan (sets deletedAt)', () => {
    const next = reduceMeasurementPlans([basePlan], {
      kind: 'MEASUREMENT_PLAN_REMOVE',
      planId: 'mp-1',
      removedAt: 200,
    });
    expect(next).toHaveLength(1);
    expect(next[0].deletedAt).toBe(200);
    expect(next[0].id).toBe('mp-1');
    expect(next[0].factor).toBe(basePlan.factor);
  });

  it('does not mutate input', () => {
    const start: MeasurementPlan[] = [basePlan];
    reduceMeasurementPlans(start, {
      kind: 'MEASUREMENT_PLAN_REMOVE',
      planId: 'mp-1',
      removedAt: 200,
    });
    expect(start[0].deletedAt).toBeNull();
  });
});

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_LINK_FINDING', () => {
  it('appends finding to linkedFindingIds', () => {
    const next = reduceMeasurementPlans([basePlan], {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-1',
      findingId: 'f-1',
    });
    expect(next[0].linkedFindingIds).toEqual(['f-1']);
  });

  it('appends to existing linkedFindingIds array', () => {
    const planWithLink: MeasurementPlan = { ...basePlan, linkedFindingIds: ['f-1'] };
    const next = reduceMeasurementPlans([planWithLink], {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-1',
      findingId: 'f-2',
    });
    expect(next[0].linkedFindingIds).toEqual(['f-1', 'f-2']);
  });

  it('does not duplicate when finding already linked', () => {
    const planWithLink: MeasurementPlan = { ...basePlan, linkedFindingIds: ['f-1'] };
    const next = reduceMeasurementPlans([planWithLink], {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-1',
      findingId: 'f-1',
    });
    expect(next[0].linkedFindingIds).toEqual(['f-1']);
  });
});

describe('MeasurementPlanPatch', () => {
  it('forbids changing lifecycle + identity + hypothesisId at the type level', () => {
    // @ts-expect-error id in Omit list
    const _patch1: MeasurementPlanPatch = { id: 'mp-99' };
    // @ts-expect-error createdAt in Omit list
    const _patch2: MeasurementPlanPatch = { createdAt: 999 };
    // @ts-expect-error deletedAt in Omit list
    const _patch3: MeasurementPlanPatch = { deletedAt: 999 };
    // @ts-expect-error hypothesisId in Omit list
    const _patch4: MeasurementPlanPatch = { hypothesisId: 'h-other' };
    // Allowed: status, factor, sampleSize, owner, method, linkedFindingIds, msaRequired
    const _patch5: MeasurementPlanPatch = { status: 'complete', sampleSize: 100 };
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/core test -- measurementPlan/__tests__/actions
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the reducer + union**

```typescript
// packages/core/src/measurementPlan/actions.ts
import type { Finding } from '../findings/types';
import type { MeasurementPlan } from './types';

export type MeasurementPlanPatch = Partial<
  Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt' | 'hypothesisId'>
>;

export type MeasurementPlanAction =
  | { kind: 'MEASUREMENT_PLAN_ADD'; plan: MeasurementPlan }
  | { kind: 'MEASUREMENT_PLAN_UPDATE'; planId: MeasurementPlan['id']; patch: MeasurementPlanPatch }
  | { kind: 'MEASUREMENT_PLAN_REMOVE'; planId: MeasurementPlan['id']; removedAt: number }
  | {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING';
      planId: MeasurementPlan['id'];
      findingId: Finding['id'];
    };

export function reduceMeasurementPlans(
  state: MeasurementPlan[],
  action: MeasurementPlanAction
): MeasurementPlan[] {
  switch (action.kind) {
    case 'MEASUREMENT_PLAN_ADD':
      return [...state, action.plan];
    case 'MEASUREMENT_PLAN_UPDATE':
      return state.map(p => (p.id === action.planId ? { ...p, ...action.patch } : p));
    case 'MEASUREMENT_PLAN_REMOVE':
      return state.map(p => (p.id === action.planId ? { ...p, deletedAt: action.removedAt } : p));
    case 'MEASUREMENT_PLAN_LINK_FINDING':
      return state.map(p => {
        if (p.id !== action.planId) return p;
        const existing = p.linkedFindingIds ?? [];
        if (existing.includes(action.findingId)) return p;
        return { ...p, linkedFindingIds: [...existing, action.findingId] };
      });
  }
}
```

- [ ] **Step 4: Extend the barrel**

In `packages/core/src/measurementPlan/index.ts`, append:

```typescript
export { reduceMeasurementPlans } from './actions';
export type { MeasurementPlanAction, MeasurementPlanPatch } from './actions';
```

- [ ] **Step 5: Run to verify PASS**

```bash
pnpm --filter @variscout/core test -- measurementPlan
```

Expected: all measurementPlan tests pass (3 from types + 8 from actions = 11).

- [ ] **Step 6: Commit**

```bash
git -C <worktree> add packages/core/src/measurementPlan
git -C <worktree> commit -m "feat(core): add MeasurementPlanAction union + reduceMeasurementPlans"
```

---

## Task 3 — Add `measurementPlanIds?` to `Hypothesis`

**Goal:** Single new optional field on the existing `Hypothesis` interface. Parallel to `findingIds`. No serialization migration needed (optional fields preserve naturally).

**Files:**

- Modify: `packages/core/src/findings/types.ts` (around line 761, after `findingIds`)
- Modify: `packages/core/src/findings/types.ts` — add `MeasurementPlan` import at top
- Test: Add round-trip assertion to whichever Hypothesis test file exists (`packages/core/src/findings/__tests__/types.test.ts` or similar — Step 1 discovers exact path)

### Steps

- [ ] **Step 1: Find the canonical Hypothesis test file**

```bash
find /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans/packages/core/src/findings -name "*.test.ts" 2>&1 | head -5
grep -rln "interface Hypothesis\|Hypothesis = {" /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans/packages/core/src/findings/__tests__ 2>/dev/null | head -3
```

If a Hypothesis-specific test file exists, append. If not, create `packages/core/src/findings/__tests__/hypothesisShape.test.ts`.

- [ ] **Step 2: Write the failing test**

```typescript
// In the located test file:
import type { Hypothesis } from '../types';
import type { MeasurementPlan } from '../../measurementPlan/types';

describe('Hypothesis — measurementPlanIds field', () => {
  it('accepts optional measurementPlanIds parallel to findingIds', () => {
    const planId: MeasurementPlan['id'] = 'mp-1';
    const hyp: Hypothesis = {
      id: 'h-1',
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
      name: 'Test',
      synthesis: '',
      questionIds: [],
      findingIds: ['f-1'],
      measurementPlanIds: [planId],
      status: 'proposed',
      investigationId: 'inv-1',
    };
    expect(hyp.measurementPlanIds).toEqual(['mp-1']);
  });

  it('omits measurementPlanIds without TypeScript error', () => {
    const hyp: Hypothesis = {
      id: 'h-2',
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
      name: 'Test',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'proposed',
      investigationId: 'inv-1',
    };
    expect(hyp.measurementPlanIds).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run to verify FAIL**

```bash
pnpm --filter @variscout/core test -- findings
```

Expected: FAIL — `measurementPlanIds` not a known property on `Hypothesis`.

- [ ] **Step 4: Add the import + field**

At the top of `packages/core/src/findings/types.ts`, find existing imports. Add (if not present):

```typescript
import type { MeasurementPlan } from '../measurementPlan/types';
```

In the `Hypothesis` interface (line 753+), find the `findingIds: Finding['id'][]` line. Add immediately after:

```typescript
  /** IDs of MeasurementPlans designed to gather evidence for this hypothesis. Parallel to findingIds. */
  measurementPlanIds?: MeasurementPlan['id'][];
```

- [ ] **Step 5: Run to verify PASS**

```bash
pnpm --filter @variscout/core test -- findings
```

Expected: all existing Hypothesis tests still green + the 2 new ones pass.

- [ ] **Step 6: Commit**

```bash
git -C <worktree> add packages/core/src/findings/
git -C <worktree> commit -m "feat(core): add measurementPlanIds field to Hypothesis"
```

---

## Task 4 — Persistence: Dexie schema + `applyAction.ts` cases (both apps)

**Goal:** Persistent `MeasurementPlan` table in both apps, with the existing HubAction dispatch path wired to handle the 4 new action kinds. Per scout: PR-WV1-3a's `applyAction.ts` pattern is the model.

**Files:**

- Modify: `apps/azure/src/db/schema.ts` (version 6 → 7; add `measurementPlans` table)
- Modify: `apps/pwa/src/persistence/` schema (find via Step 1 discovery; likely a parallel `schema.ts`)
- Modify: `apps/azure/src/persistence/applyAction.ts` (add 4 cases before INVESTIGATION\_\* group)
- Modify: `apps/pwa/src/persistence/applyAction.ts` (same)
- Modify: `apps/azure/src/persistence/AzureHubRepository.ts` (add `measurementPlans.listByHypothesis`)
- Modify: `apps/pwa/src/persistence/PwaHubRepository.ts` (same)
- Modify: `packages/core/src/actions/index.ts` (or wherever HubAction union lives) — add `MeasurementPlanAction` to the union

### Steps

- [ ] **Step 1: Discovery**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans
grep -rn "HubAction\s*=\|export type HubAction" packages/core/src --include="*.ts" | head -5
find apps/pwa/src/persistence -name "schema*" -o -name "Schema*" 2>&1 | head -5
grep -n "this.version(" apps/azure/src/db/schema.ts | head -5
grep -n "this.version(" apps/pwa/src/persistence/*.ts 2>/dev/null | head -5
grep -rn "listByInvestigation\|listByHypothesis" apps/azure/src/persistence apps/pwa/src/persistence --include="*.ts" | head -10
```

Report:

- Where the `HubAction` union is defined (we'll add `MeasurementPlanAction` to it)
- PWA equivalent of Azure's `apps/azure/src/db/schema.ts`
- Both apps' current Dexie version numbers
- Repository read-API method naming pattern

- [ ] **Step 2: Extend `HubAction` union with `MeasurementPlanAction`**

In the file from Step 1 (likely `packages/core/src/actions/index.ts`), find the union. Add the new action type:

```typescript
import type { MeasurementPlanAction } from '../measurementPlan/actions';
// (preserve existing imports)

export type HubAction =
  | /* ... existing variants ... */
  | MeasurementPlanAction;
```

- [ ] **Step 3: Write the failing test for `applyAction` (Azure first)**

In `apps/azure/src/persistence/__tests__/applyAction.test.ts` (or wherever `applyAction.ts` is tested — find via grep), add:

```typescript
import { reduceMeasurementPlans } from '@variscout/core/measurementPlan';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

describe('applyAction — MEASUREMENT_PLAN_ADD', () => {
  it('persists a new MeasurementPlan via the measurementPlans table', async () => {
    // Setup: fake Dexie DB with version 7 schema
    const db = /* peer fixture for an empty db */;
    const plan: MeasurementPlan = {
      id: 'mp-1',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      factor: 'X',
      method: 'sensor',
      sampleSize: 10,
      owner: 'pm-1',
      status: 'planned',
    };
    await applyAction(db, { kind: 'MEASUREMENT_PLAN_ADD', plan });
    const persisted = await db.measurementPlans.toArray();
    expect(persisted).toEqual([plan]);
  });
});

// Similar tests for UPDATE, REMOVE, LINK_FINDING
```

If existing `applyAction.test.ts` doesn't exist or uses a different scaffolding, mirror whatever peer tests do (e.g., the `HYPOTHESIS_ADD` test pattern if it exists).

- [ ] **Step 4: Run to verify FAIL**

```bash
pnpm --filter @variscout/azure-app test -- applyAction
```

Expected: FAIL — `db.measurementPlans` doesn't exist; or `MEASUREMENT_PLAN_ADD` falls through to `assertNever`.

- [ ] **Step 5: Bump Azure Dexie schema to version 7 + add `measurementPlans` table**

In `apps/azure/src/db/schema.ts`, append a new version block (preserving the version 6 block):

```typescript
this.version(7).stores({
  // (preserve all existing v6 tables verbatim — this block REPLACES the table set on upgrade)
  /* ... existing tables ... */
  measurementPlans: 'id, hypothesisId, status, deletedAt',
});
```

The Dexie schema declaration is cumulative across version() calls but each call defines the full snapshot. Verify the syntax by reading how v6 looks today before editing.

Add the table accessor type if there's a `Dexie.Table<MeasurementPlan, string>` pattern in the class:

```typescript
measurementPlans!: Dexie.Table<MeasurementPlan, string>;
```

- [ ] **Step 6: Add `MEASUREMENT_PLAN_*` cases to Azure `applyAction.ts`**

In `apps/azure/src/persistence/applyAction.ts`, find the `INVESTIGATION_*` group (around line 390). Insert before it:

```typescript
case 'MEASUREMENT_PLAN_ADD':
  await db.measurementPlans.put(action.plan);
  return;
case 'MEASUREMENT_PLAN_UPDATE': {
  const existing = await db.measurementPlans.get(action.planId);
  if (!existing) return;
  const current: MeasurementPlan[] = [existing];
  const next = reduceMeasurementPlans(current, action);
  if (next[0]) await db.measurementPlans.put(next[0]);
  return;
}
case 'MEASUREMENT_PLAN_REMOVE': {
  const existing = await db.measurementPlans.get(action.planId);
  if (!existing) return;
  const next = reduceMeasurementPlans([existing], action);
  if (next[0]) await db.measurementPlans.put(next[0]);
  return;
}
case 'MEASUREMENT_PLAN_LINK_FINDING': {
  const existing = await db.measurementPlans.get(action.planId);
  if (!existing) return;
  const next = reduceMeasurementPlans([existing], action);
  if (next[0]) await db.measurementPlans.put(next[0]);
  return;
}
```

Add the import at top: `import { reduceMeasurementPlans } from '@variscout/core/measurementPlan'; import type { MeasurementPlan } from '@variscout/core/measurementPlan';`.

- [ ] **Step 7: Add `measurementPlans.listByHypothesis` to `AzureHubRepository.ts`**

Follow the existing pattern (e.g., `hypotheses.listByInvestigation` if it exists). Likely:

```typescript
measurementPlans: {
  listByHypothesis: async (hypothesisId: string): Promise<MeasurementPlan[]> => {
    return await db.measurementPlans
      .where('hypothesisId')
      .equals(hypothesisId)
      .filter(p => p.deletedAt === null)
      .toArray();
  },
},
```

Add import + verify the field name on the repository struct.

- [ ] **Step 8: Run Azure tests to verify PASS**

```bash
pnpm --filter @variscout/azure-app test -- applyAction
```

Expected: green.

- [ ] **Step 9: Mirror for PWA (steps 5-7 repeated)**

Apply the same schema bump, applyAction cases, and repository accessor to PWA's persistence layer. The PWA file paths emerged from Step 1's discovery.

- [ ] **Step 10: Run PWA tests**

```bash
pnpm --filter @variscout/pwa test -- applyAction
```

Expected: green.

- [ ] **Step 11: Run core tests to confirm HubAction union exhaustiveness holds**

```bash
pnpm --filter @variscout/core test -- actions
```

Expected: green. If TypeScript complains about exhaustive switches elsewhere consuming `HubAction`, find those switches and add `MEASUREMENT_PLAN_*` cases (likely no-op or document-thrown — check the existing pattern for `HYPOTHESIS_*` cases that are stub no-ops per PR-WV1-3a's scout).

- [ ] **Step 12: Commit**

Split into two commits if the diff is substantial:

```bash
git -C <worktree> add packages/core/src/actions
git -C <worktree> commit -m "feat(core): add MeasurementPlanAction to HubAction union"

git -C <worktree> add apps/
git -C <worktree> commit -m "feat(persistence): wire MeasurementPlan persistence (Dexie + applyAction in both apps)"
```

---

## Task 5 — Wall detail surface discovery + scope settle (NO code yet)

**Goal:** Find OR design the DOM surface where MeasurementPlan UI (forms + pickers + chips) renders when a Hypothesis is selected on the Wall. This task ships ZERO product code; it produces a `docs/investigations.md` entry + a clear directive for Tasks 6–8.

**Reason:** scout found `<HypothesisCard>` is a small SVG summary, not a detail surface. The amendment spec's "rows inside Hypothesis card" doesn't map cleanly to the Wall's actual rendering model. We need to know where Plan UI lives before building it.

### Steps

- [ ] **Step 1: Find existing Wall detail / sidebar / panel surfaces**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans

# Look for detail panels, sidebars, or hypothesis-detail components
grep -rln "HypothesisDetail\|SelectedHypothesis\|HypothesisSidebar\|WallSidebar\|WallDetail\|DetailPanel\|NarratorRail" packages/ui/src apps --include="*.tsx" --include="*.ts" | head -15

# Look for what happens when a hypothesis is clicked on the Wall
grep -rn "onSelect.*hubId\|selectHypothesis\|setSelectedHypothesis\|focusedHypothesisId" packages/ui/src/components/InvestigationWall apps --include="*.tsx" --include="*.ts" | head -15

# Look at WallCanvas top-level
sed -n '1,80p' packages/ui/src/components/InvestigationWall/WallCanvas.tsx 2>/dev/null
```

- [ ] **Step 2: Report findings + decide**

The scout will surface one of three states:

**(a) An existing detail panel** (likely `NarratorRail` or similar) renders when a Hypothesis is selected. PR-WV1-3b extends it with a `<HypothesisDetailPanel>` Plan section.

**(b) No detail surface exists today.** Hypotheses are clicked but no DOM detail renders. PR-WV1-3b creates a new `<HypothesisDetailPanel>` component that mounts when `useViewStore.focusedHypothesisId` is set (or equivalent). The panel is the wrapper Tasks 6-8 build into.

**(c) Mobile-only detail surface** (`MobileCardList` from the scout's earlier file listing) but no desktop. PR-WV1-3b creates the desktop equivalent.

Write the findings + decision into a new `docs/investigations.md` entry:

```markdown
### MeasurementPlan UI surface on the Investigation Wall

**Surfaced by:** PR-WV1-3b Task 5 discovery 2026-05-16.

**Finding:** [verbatim from Step 1 grep results — what exists today, what doesn't]

**Decision:** [chosen path — (a) extend, (b) create new, or (c) extend mobile equivalent to desktop]

**Implication for Tasks 6-8:**

- `<MeasurementPlanChip>` renders inside [the chosen surface].
- `<AddPlanForm>` mounts inline within the panel when "+ Add Plan" clicked.
- `<LinkFindingPicker>` opens as overlay on top of the panel.
- Membership context (`members`, `currentUserId`) threads from [the panel's parent — Investigation view OR app shell].

**Promotion path:** Decision pinned by this PR; relitigate only if the chosen surface proves wrong during Tasks 6-8 execution.
```

- [ ] **Step 3: Commit the discovery + decision**

```bash
git -C <worktree> add docs/investigations.md
git -C <worktree> commit -m "docs(plans): Wall MeasurementPlan UI surface decision (PR-WV1-3b Task 5)"
```

- [ ] **Step 4: If the discovery surfaces a substantial design question** (e.g., no detail surface AND creating one is non-trivial), STOP and report. The controller pivots: pause Tasks 6-8 + brainstorm the surface with the user before continuing.

If the path is clear (most likely case (a) or (b) with a small new component), proceed to Task 6.

---

## Task 6 — `<MeasurementPlanChip>` + `<AddPlanForm>` components

**Goal:** DOM components for displaying a Plan as a compact row + the inline form to add new Plans. Both consume props (no store reads); parent (Task 7) wires data.

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/MeasurementPlanChip.tsx`
- Create: `packages/ui/src/components/InvestigationWall/AddPlanForm.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/MeasurementPlanChip.test.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/AddPlanForm.test.tsx`

### Steps

- [ ] **Step 1: Write failing test for `<MeasurementPlanChip>`**

```typescript
// packages/ui/src/components/InvestigationWall/__tests__/MeasurementPlanChip.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MeasurementPlanChip } from '../MeasurementPlanChip';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

const basePlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  factor: 'Nozzle temperature',
  method: 'sensor',
  sampleSize: 50,
  owner: 'pm-1',
  status: 'planned',
};

describe('MeasurementPlanChip', () => {
  it('renders factor + method + sampleSize', () => {
    render(<MeasurementPlanChip plan={basePlan} canEdit={true} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.getByText(/Nozzle temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/sensor/i)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('shows planned status indicator', () => {
    render(<MeasurementPlanChip plan={basePlan} canEdit={true} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.getByTestId('mp-status-planned')).toBeInTheDocument();
  });

  it('shows complete status indicator for completed plans', () => {
    const completePlan = { ...basePlan, status: 'complete' as const, linkedFindingIds: ['f-1'] };
    render(<MeasurementPlanChip plan={completePlan} canEdit={true} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.getByTestId('mp-status-complete')).toBeInTheDocument();
  });

  it('renders Link Finding button when canEdit + status !== complete', () => {
    render(<MeasurementPlanChip plan={basePlan} canEdit={true} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.getByRole('button', { name: /link finding/i })).toBeInTheDocument();
  });

  it('hides Link Finding button when canEdit = false', () => {
    render(<MeasurementPlanChip plan={basePlan} canEdit={false} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.queryByRole('button', { name: /link finding/i })).not.toBeInTheDocument();
  });

  it('calls onLinkFinding when link button clicked', () => {
    const onLinkFinding = vi.fn();
    render(<MeasurementPlanChip plan={basePlan} canEdit={true} onLinkFinding={onLinkFinding} onMarkComplete={() => {}} onRemove={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /link finding/i }));
    expect(onLinkFinding).toHaveBeenCalledWith('mp-1');
  });

  it('shows Mark complete banner when linkedFindingIds is non-empty AND status !== complete', () => {
    const planWithLink = { ...basePlan, linkedFindingIds: ['f-1'] };
    render(<MeasurementPlanChip plan={planWithLink} canEdit={true} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });

  it('hides Mark complete banner when status === complete', () => {
    const completePlan = { ...basePlan, status: 'complete' as const, linkedFindingIds: ['f-1'] };
    render(<MeasurementPlanChip plan={completePlan} canEdit={true} onLinkFinding={() => {}} onMarkComplete={() => {}} onRemove={() => {}} />);
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument();
  });

  it('calls onMarkComplete when banner button clicked', () => {
    const onMarkComplete = vi.fn();
    const planWithLink = { ...basePlan, linkedFindingIds: ['f-1'] };
    render(<MeasurementPlanChip plan={planWithLink} canEdit={true} onLinkFinding={() => {}} onMarkComplete={onMarkComplete} onRemove={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    expect(onMarkComplete).toHaveBeenCalledWith('mp-1');
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- MeasurementPlanChip
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<MeasurementPlanChip>`**

```tsx
// packages/ui/src/components/InvestigationWall/MeasurementPlanChip.tsx
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

export interface MeasurementPlanChipProps {
  plan: MeasurementPlan;
  canEdit: boolean;
  onLinkFinding: (planId: MeasurementPlan['id']) => void;
  onMarkComplete: (planId: MeasurementPlan['id']) => void;
  onRemove: (planId: MeasurementPlan['id']) => void;
}

const METHOD_LABEL: Record<MeasurementPlan['method'], string> = {
  sensor: 'Sensor',
  'manual-count': 'Manual count',
  'gemba-walk': 'Gemba walk',
  'expert-assessment': 'Expert',
  other: 'Other',
};

const STATUS_TESTID: Record<MeasurementPlan['status'], string> = {
  planned: 'mp-status-planned',
  'in-progress': 'mp-status-in-progress',
  complete: 'mp-status-complete',
  skipped: 'mp-status-skipped',
};

export function MeasurementPlanChip({
  plan,
  canEdit,
  onLinkFinding,
  onMarkComplete,
  onRemove,
}: MeasurementPlanChipProps) {
  const showLinkButton = canEdit && plan.status !== 'complete';
  const hasLinks = (plan.linkedFindingIds?.length ?? 0) > 0;
  const showMarkCompleteBanner = canEdit && hasLinks && plan.status !== 'complete';

  return (
    <li
      className="border border-edge rounded p-2 bg-surface-secondary"
      data-testid={`measurement-plan-${plan.id}`}
    >
      <div className="flex items-center gap-2">
        <span data-testid={STATUS_TESTID[plan.status]} className="text-content-secondary text-xs">
          {plan.status === 'complete' ? '✓' : plan.status === 'skipped' ? '✗' : '⏳'}
        </span>
        <span className="text-content text-sm font-medium">{plan.factor}</span>
        <span className="text-content-secondary text-xs">·</span>
        <span className="text-content-secondary text-xs">{METHOD_LABEL[plan.method]}</span>
        <span className="text-content-secondary text-xs">·</span>
        <span className="text-content-secondary text-xs">n={plan.sampleSize}</span>
      </div>

      {showMarkCompleteBanner && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
          <span className="text-xs text-blue-900">
            {plan.linkedFindingIds?.length} finding{plan.linkedFindingIds?.length === 1 ? '' : 's'}{' '}
            linked.
          </span>
          <button
            type="button"
            onClick={() => onMarkComplete(plan.id)}
            className="ml-auto px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Mark complete
          </button>
        </div>
      )}

      {showLinkButton && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onLinkFinding(plan.id)}
            className="px-3 py-1 rounded text-xs text-content-secondary hover:bg-surface transition-colors"
          >
            Link Finding…
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onRemove(plan.id)}
              className="px-3 py-1 rounded text-xs text-content-secondary hover:text-content transition-colors"
              aria-label={`Remove plan: ${plan.factor}`}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </li>
  );
}
```

- [ ] **Step 4: Run to verify PASS**

```bash
pnpm --filter @variscout/ui test -- MeasurementPlanChip
```

Expected: 9/9 pass.

- [ ] **Step 5: Write failing test for `<AddPlanForm>`**

```typescript
// packages/ui/src/components/InvestigationWall/__tests__/AddPlanForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AddPlanForm } from '../AddPlanForm';
import type { ProjectMember } from '@variscout/core/projectMembership';

const lead: ProjectMember = { id: 'pm-lead', createdAt: 1, deletedAt: null, userId: 'l@org', displayName: 'Lead', role: 'lead', invitedAt: 1 };
const member: ProjectMember = { id: 'pm-member', createdAt: 1, deletedAt: null, userId: 'm@org', displayName: 'Mira', role: 'member', invitedAt: 1 };
const sponsor: ProjectMember = { id: 'pm-sponsor', createdAt: 1, deletedAt: null, userId: 's@org', displayName: 'Sponsor', role: 'sponsor', invitedAt: 1 };

describe('AddPlanForm', () => {
  it('renders fields for factor, method, sample size, owner', () => {
    render(<AddPlanForm hypothesisId="h-1" members={[lead, member]} onCancel={() => {}} onSubmit={() => {}} />);
    expect(screen.getByLabelText(/factor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sample size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
  });

  it('shows 5 method options', () => {
    render(<AddPlanForm hypothesisId="h-1" members={[lead]} onCancel={() => {}} onSubmit={() => {}} />);
    const select = screen.getByLabelText(/method/i) as HTMLSelectElement;
    expect(Array.from(select.options).map(o => o.value)).toEqual([
      'sensor',
      'manual-count',
      'gemba-walk',
      'expert-assessment',
      'other',
    ]);
  });

  it('filters Sponsors out of owner picker', () => {
    render(<AddPlanForm hypothesisId="h-1" members={[lead, member, sponsor]} onCancel={() => {}} onSubmit={() => {}} />);
    const ownerSelect = screen.getByLabelText(/owner/i) as HTMLSelectElement;
    const ownerIds = Array.from(ownerSelect.options).map(o => o.value);
    expect(ownerIds).toContain('pm-lead');
    expect(ownerIds).toContain('pm-member');
    expect(ownerIds).not.toContain('pm-sponsor');
  });

  it('calls onSubmit with typed payload on save', () => {
    const onSubmit = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={[lead, member]} onCancel={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/factor/i), { target: { value: 'Nozzle temp' } });
    fireEvent.change(screen.getByLabelText(/method/i), { target: { value: 'gemba-walk' } });
    fireEvent.change(screen.getByLabelText(/sample size/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/owner/i), { target: { value: 'pm-member' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      hypothesisId: 'h-1',
      factor: 'Nozzle temp',
      method: 'gemba-walk',
      sampleSize: 30,
      owner: 'pm-member',
      msaRequired: false,
    });
  });

  it('includes msaRequired flag when checkbox is checked', () => {
    const onSubmit = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={[lead]} onCancel={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/factor/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/sample size/i), { target: { value: '10' } });
    fireEvent.click(screen.getByLabelText(/msa required/i));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ msaRequired: true })
    );
  });

  it('calls onCancel when Cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={[lead]} onCancel={onCancel} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- AddPlanForm
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement `<AddPlanForm>`**

```tsx
// packages/ui/src/components/InvestigationWall/AddPlanForm.tsx
import { useState } from 'react';
import type { MeasurementMethod, MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import type { Hypothesis } from '@variscout/core/findings';

export interface AddPlanFormSubmitPayload {
  hypothesisId: Hypothesis['id'];
  factor: string;
  method: MeasurementMethod;
  sampleSize: number;
  owner: ProjectMember['id'];
  msaRequired: boolean;
}

export interface AddPlanFormProps {
  hypothesisId: Hypothesis['id'];
  members: ProjectMember[];
  onCancel: () => void;
  onSubmit: (payload: AddPlanFormSubmitPayload) => void;
}

const METHOD_OPTIONS: { value: MeasurementMethod; label: string }[] = [
  { value: 'sensor', label: 'Sensor' },
  { value: 'manual-count', label: 'Manual count' },
  { value: 'gemba-walk', label: 'Gemba walk' },
  { value: 'expert-assessment', label: 'Expert assessment' },
  { value: 'other', label: 'Other' },
];

export function AddPlanForm({ hypothesisId, members, onCancel, onSubmit }: AddPlanFormProps) {
  const ownableMembers = members.filter(m => m.role !== 'sponsor');
  const [factor, setFactor] = useState('');
  const [method, setMethod] = useState<MeasurementMethod>('sensor');
  const [sampleSize, setSampleSize] = useState<number>(0);
  const [owner, setOwner] = useState<ProjectMember['id']>(ownableMembers[0]?.id ?? '');
  const [msaRequired, setMsaRequired] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!factor.trim() || sampleSize < 1 || !owner) return;
    onSubmit({ hypothesisId, factor: factor.trim(), method, sampleSize, owner, msaRequired });
  };

  return (
    <form
      onSubmit={submit}
      className="p-3 border border-edge rounded bg-surface"
      aria-label="Add measurement plan"
    >
      <label className="block text-sm text-content mb-2">
        Factor
        <input
          type="text"
          value={factor}
          onChange={e => setFactor(e.target.value)}
          required
          aria-label="Factor"
          className="block w-full mt-1 px-2 py-1 border border-edge rounded"
        />
      </label>

      <label className="block text-sm text-content mb-2">
        Method
        <select
          value={method}
          onChange={e => setMethod(e.target.value as MeasurementMethod)}
          aria-label="Method"
          className="block w-full mt-1 px-2 py-1 border border-edge rounded"
        >
          {METHOD_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-content mb-2">
        Sample size
        <input
          type="number"
          value={sampleSize || ''}
          onChange={e => setSampleSize(Number(e.target.value))}
          min={1}
          required
          aria-label="Sample size"
          className="block w-full mt-1 px-2 py-1 border border-edge rounded"
        />
      </label>

      <label className="block text-sm text-content mb-2">
        Owner
        <select
          value={owner}
          onChange={e => setOwner(e.target.value)}
          aria-label="Owner"
          required
          className="block w-full mt-1 px-2 py-1 border border-edge rounded"
        >
          {ownableMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.displayName} ({m.role})
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-content mb-3">
        <input
          type="checkbox"
          checked={msaRequired}
          onChange={e => setMsaRequired(e.target.checked)}
          aria-label="MSA required"
        />
        MSA required (informational — Gage R&R workflow deferred to V2)
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 8: Run to verify PASS**

```bash
pnpm --filter @variscout/ui test -- AddPlanForm
```

Expected: 6/6 pass.

- [ ] **Step 9: Commit**

```bash
git -C <worktree> add packages/ui/src/components/InvestigationWall/MeasurementPlanChip.tsx packages/ui/src/components/InvestigationWall/AddPlanForm.tsx packages/ui/src/components/InvestigationWall/__tests__/MeasurementPlanChip.test.tsx packages/ui/src/components/InvestigationWall/__tests__/AddPlanForm.test.tsx
git -C <worktree> commit -m "feat(ui): add MeasurementPlanChip + AddPlanForm components"
```

---

## Task 7 — `<LinkFindingPicker>` component

**Goal:** Modal-style picker that opens from a Plan's "Link Finding…" button. Lists Findings on the same Hypothesis that aren't already linked. Multi-select. Confirm dispatches `MEASUREMENT_PLAN_LINK_FINDING` per pick.

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/LinkFindingPicker.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/LinkFindingPicker.test.tsx`

### Steps

- [ ] **Step 1: Write the failing test**

```typescript
// packages/ui/src/components/InvestigationWall/__tests__/LinkFindingPicker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LinkFindingPicker } from '../LinkFindingPicker';
import type { Finding } from '@variscout/core/findings';

const findingA: Finding = {
  id: 'f-1',
  createdAt: 1,
  deletedAt: null,
  text: 'Spike in Q3 outliers',
  context: { activeFilters: {} },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 1,
  investigationId: 'inv-1',
};

const findingB: Finding = { ...findingA, id: 'f-2', text: 'Gemba walk note' };
const findingC: Finding = { ...findingA, id: 'f-3', text: 'Already linked' };

describe('LinkFindingPicker', () => {
  it('lists candidate findings (excluding already-linked)', () => {
    render(
      <LinkFindingPicker
        candidates={[findingA, findingB, findingC]}
        alreadyLinkedIds={['f-3']}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText(/Spike in Q3/i)).toBeInTheDocument();
    expect(screen.getByText(/Gemba walk note/i)).toBeInTheDocument();
    expect(screen.queryByText(/Already linked/i)).not.toBeInTheDocument();
  });

  it('renders dialog role', () => {
    render(<LinkFindingPicker candidates={[findingA]} alreadyLinkedIds={[]} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('dialog', { name: /link finding/i })).toBeInTheDocument();
  });

  it('confirms with selected finding IDs', () => {
    const onConfirm = vi.fn();
    render(
      <LinkFindingPicker
        candidates={[findingA, findingB]}
        alreadyLinkedIds={[]}
        onCancel={() => {}}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Spike in Q3/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Gemba walk note/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm|link selected/i }));
    expect(onConfirm).toHaveBeenCalledWith(['f-1', 'f-2']);
  });

  it('Confirm button disabled when no selection', () => {
    render(<LinkFindingPicker candidates={[findingA]} alreadyLinkedIds={[]} onCancel={() => {}} onConfirm={() => {}} />);
    const confirmBtn = screen.getByRole('button', { name: /confirm|link selected/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<LinkFindingPicker candidates={[findingA]} alreadyLinkedIds={[]} onCancel={onCancel} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no candidates remain', () => {
    render(<LinkFindingPicker candidates={[findingA]} alreadyLinkedIds={['f-1']} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText(/no findings/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- LinkFindingPicker
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// packages/ui/src/components/InvestigationWall/LinkFindingPicker.tsx
import { useState } from 'react';
import type { Finding } from '@variscout/core/findings';

export interface LinkFindingPickerProps {
  candidates: Finding[];
  alreadyLinkedIds: Finding['id'][];
  onCancel: () => void;
  onConfirm: (selectedIds: Finding['id'][]) => void;
}

export function LinkFindingPicker({
  candidates,
  alreadyLinkedIds,
  onCancel,
  onConfirm,
}: LinkFindingPickerProps) {
  const remaining = candidates.filter(f => !alreadyLinkedIds.includes(f.id));
  const [selected, setSelected] = useState<Set<Finding['id']>>(new Set());

  const toggle = (id: Finding['id']) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      role="dialog"
      aria-label="Link Finding to measurement plan"
      className="p-4 border border-edge rounded bg-surface-secondary"
    >
      <h3 className="text-content text-sm font-semibold mb-3">Link Finding to plan</h3>

      {remaining.length === 0 ? (
        <p className="text-content-muted text-sm">No findings available to link.</p>
      ) : (
        <ul className="mb-3 max-h-64 overflow-y-auto">
          {remaining.map(f => (
            <li key={f.id} className="py-1">
              <label className="flex items-center gap-2 text-sm text-content">
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggle(f.id)}
                  aria-label={f.text}
                />
                <span>{f.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded text-sm text-content-secondary hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm([...selected])}
          disabled={selected.size === 0}
          className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Link selected
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify PASS**

```bash
pnpm --filter @variscout/ui test -- LinkFindingPicker
```

Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git -C <worktree> add packages/ui/src/components/InvestigationWall/LinkFindingPicker.tsx packages/ui/src/components/InvestigationWall/__tests__/LinkFindingPicker.test.tsx
git -C <worktree> commit -m "feat(ui): add LinkFindingPicker component"
```

---

## Task 8 — `<HypothesisDetailPanel>` integration

**Goal:** Mount the chip + form + picker inside the Wall detail surface settled by Task 5. Wire dispatch callbacks. Gate edit affordances via `canAccess(currentUserId, members, 'edit-approach')` from the existing PR-WV1-1 ACL.

**Files (precise paths depend on Task 5's decision):**

- Either modify an existing detail surface OR create `packages/ui/src/components/InvestigationWall/HypothesisDetailPanel.tsx`
- Test file alongside
- Update `packages/ui/src/components/InvestigationWall/index.ts` barrel
- Possibly update `WallCanvas.tsx` to mount the detail panel when a hypothesis is selected

### Steps

- [ ] **Step 1: Read Task 5's `docs/investigations.md` entry** to confirm the surface decision before writing any code.

- [ ] **Step 2: Write the failing integration test**

Adapt to Task 5's surface. Example (assuming new `HypothesisDetailPanel`):

```typescript
// packages/ui/src/components/InvestigationWall/__tests__/HypothesisDetailPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HypothesisDetailPanel } from '../HypothesisDetailPanel';
import type { Hypothesis } from '@variscout/core/findings';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import type { Finding } from '@variscout/core/findings';

const lead: ProjectMember = { id: 'pm-lead', createdAt: 1, deletedAt: null, userId: 'l@org', displayName: 'Lead', role: 'lead', invitedAt: 1 };

const hyp: Hypothesis = {
  id: 'h-1',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  name: 'Test',
  synthesis: '',
  questionIds: [],
  findingIds: [],
  measurementPlanIds: [],
  status: 'proposed',
  investigationId: 'inv-1',
};

describe('HypothesisDetailPanel — Plan section', () => {
  it('renders + Add Plan button when canAccess edit-approach', () => {
    render(
      <HypothesisDetailPanel
        hypothesis={hyp}
        plans={[]}
        findings={[]}
        members={[lead]}
        currentUserId="l@org"
        onAddPlan={() => {}}
        onUpdatePlan={() => {}}
        onRemovePlan={() => {}}
        onLinkFinding={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });

  it('hides Add Plan button when user lacks edit-approach (no membership)', () => {
    render(
      <HypothesisDetailPanel
        hypothesis={hyp}
        plans={[]}
        findings={[]}
        members={[lead]}
        currentUserId="stranger@org"
        onAddPlan={() => {}}
        onUpdatePlan={() => {}}
        onRemovePlan={() => {}}
        onLinkFinding={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /add plan/i })).not.toBeInTheDocument();
  });

  it('renders existing plans as chips', () => {
    const plan: MeasurementPlan = {
      id: 'mp-1',
      createdAt: 1,
      deletedAt: null,
      hypothesisId: 'h-1',
      factor: 'Nozzle temp',
      method: 'sensor',
      sampleSize: 50,
      owner: 'pm-lead',
      status: 'planned',
    };
    render(
      <HypothesisDetailPanel
        hypothesis={{ ...hyp, measurementPlanIds: ['mp-1'] }}
        plans={[plan]}
        findings={[]}
        members={[lead]}
        currentUserId="l@org"
        onAddPlan={() => {}}
        onUpdatePlan={() => {}}
        onRemovePlan={() => {}}
        onLinkFinding={() => {}}
      />
    );
    expect(screen.getByText(/Nozzle temp/i)).toBeInTheDocument();
  });

  it('opens AddPlanForm when "+ Add Plan" clicked', () => {
    render(
      <HypothesisDetailPanel
        hypothesis={hyp}
        plans={[]}
        findings={[]}
        members={[lead]}
        currentUserId="l@org"
        onAddPlan={() => {}}
        onUpdatePlan={() => {}}
        onRemovePlan={() => {}}
        onLinkFinding={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add plan/i }));
    expect(screen.getByRole('form', { name: /add measurement plan/i })).toBeInTheDocument();
  });

  it('calls onAddPlan with form payload when form submits', () => {
    const onAddPlan = vi.fn();
    render(
      <HypothesisDetailPanel
        hypothesis={hyp}
        plans={[]}
        findings={[]}
        members={[lead]}
        currentUserId="l@org"
        onAddPlan={onAddPlan}
        onUpdatePlan={() => {}}
        onRemovePlan={() => {}}
        onLinkFinding={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add plan/i }));
    fireEvent.change(screen.getByLabelText(/factor/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/sample size/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onAddPlan).toHaveBeenCalledWith(
      expect.objectContaining({ factor: 'X', sampleSize: 10, hypothesisId: 'h-1' })
    );
  });
});
```

- [ ] **Step 3: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- HypothesisDetailPanel
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `<HypothesisDetailPanel>`**

```tsx
// packages/ui/src/components/InvestigationWall/HypothesisDetailPanel.tsx
import { useState } from 'react';
import type { Hypothesis, Finding } from '@variscout/core/findings';
import type { MeasurementPlan, MeasurementPlanPatch } from '@variscout/core/measurementPlan';
import { canAccess, type ProjectMember } from '@variscout/core/projectMembership';
import { MeasurementPlanChip } from './MeasurementPlanChip';
import { AddPlanForm, type AddPlanFormSubmitPayload } from './AddPlanForm';
import { LinkFindingPicker } from './LinkFindingPicker';

export interface HypothesisDetailPanelProps {
  hypothesis: Hypothesis;
  plans: MeasurementPlan[];
  findings: Finding[];
  members: ProjectMember[];
  currentUserId?: string;
  onAddPlan: (payload: AddPlanFormSubmitPayload) => void;
  onUpdatePlan: (planId: MeasurementPlan['id'], patch: MeasurementPlanPatch) => void;
  onRemovePlan: (planId: MeasurementPlan['id']) => void;
  onLinkFinding: (planId: MeasurementPlan['id'], findingIds: Finding['id'][]) => void;
}

export function HypothesisDetailPanel({
  hypothesis,
  plans,
  findings,
  members,
  currentUserId,
  onAddPlan,
  onUpdatePlan,
  onRemovePlan,
  onLinkFinding,
}: HypothesisDetailPanelProps) {
  // Empty-members open-access escape, mirroring PR-WV1-1 + PR-WV1-2 pattern
  const canEdit =
    currentUserId !== undefined &&
    (members.length === 0 || canAccess(currentUserId, members, 'edit-approach'));

  const [showAddForm, setShowAddForm] = useState(false);
  const [linkingPlanId, setLinkingPlanId] = useState<MeasurementPlan['id'] | null>(null);

  const scopedPlans = plans.filter(p => p.hypothesisId === hypothesis.id && p.deletedAt === null);
  const scopedFindings = findings.filter(f => hypothesis.findingIds.includes(f.id));

  const linkingPlan = linkingPlanId ? scopedPlans.find(p => p.id === linkingPlanId) : null;

  return (
    <section aria-label="Hypothesis detail" className="p-4 border border-edge rounded">
      <header className="mb-3">
        <h2 className="text-content text-base font-semibold">{hypothesis.name}</h2>
      </header>

      <section aria-label="Measurement plans" className="mb-4">
        <header className="flex items-center justify-between mb-2">
          <h3 className="text-content text-sm font-medium">Measurement plans</h3>
          {canEdit && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              + Add Plan
            </button>
          )}
        </header>

        {showAddForm && (
          <div className="mb-3">
            <AddPlanForm
              hypothesisId={hypothesis.id}
              members={members}
              onCancel={() => setShowAddForm(false)}
              onSubmit={payload => {
                onAddPlan(payload);
                setShowAddForm(false);
              }}
            />
          </div>
        )}

        {scopedPlans.length === 0 ? (
          <p className="text-content-muted text-sm">No measurement plans yet.</p>
        ) : (
          <ul className="space-y-2">
            {scopedPlans.map(plan => (
              <MeasurementPlanChip
                key={plan.id}
                plan={plan}
                canEdit={canEdit}
                onLinkFinding={planId => setLinkingPlanId(planId)}
                onMarkComplete={planId => onUpdatePlan(planId, { status: 'complete' })}
                onRemove={planId => onRemovePlan(planId)}
              />
            ))}
          </ul>
        )}
      </section>

      {linkingPlan && (
        <LinkFindingPicker
          candidates={scopedFindings}
          alreadyLinkedIds={linkingPlan.linkedFindingIds ?? []}
          onCancel={() => setLinkingPlanId(null)}
          onConfirm={findingIds => {
            onLinkFinding(linkingPlan.id, findingIds);
            setLinkingPlanId(null);
          }}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 5: Run to verify PASS**

```bash
pnpm --filter @variscout/ui test -- HypothesisDetailPanel
```

Expected: 5/5 pass.

- [ ] **Step 6: Update barrel**

In `packages/ui/src/components/InvestigationWall/index.ts`, add:

```typescript
export { HypothesisDetailPanel, type HypothesisDetailPanelProps } from './HypothesisDetailPanel';
export { MeasurementPlanChip, type MeasurementPlanChipProps } from './MeasurementPlanChip';
export { AddPlanForm, type AddPlanFormProps, type AddPlanFormSubmitPayload } from './AddPlanForm';
export { LinkFindingPicker, type LinkFindingPickerProps } from './LinkFindingPicker';
```

- [ ] **Step 7: Wire the panel into the Wall surface chosen in Task 5**

Modify whichever Wall component (per Task 5's decision) mounts the detail panel for the selected Hypothesis. This is the most surface-specific step — exact edits depend on what Task 5 settled. If `<NarratorRail>` or similar already shows detail content per selection, extend it. If creating from scratch, attach to `<WallCanvas>` via a `<HypothesisDetailPanel>` that mounts when `useViewStore.focusedHypothesisId` is set.

The repository read APIs from Task 4 supply the data:

- `members`: from active-IP context at the Wall's parent
- `plans`: `repository.measurementPlans.listByHypothesis(hypothesisId)` (cached / store-driven per existing Wall data flow)
- `findings`: existing Wall data path
- Dispatch callbacks: `dispatch({ kind: 'MEASUREMENT_PLAN_ADD', plan: { ...payload, id: generateDeterministicId(), createdAt: Date.now(), deletedAt: null } })` etc.

- [ ] **Step 8: Run all InvestigationWall tests**

```bash
pnpm --filter @variscout/ui test -- InvestigationWall
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git -C <worktree> add packages/ui/src/components/InvestigationWall/HypothesisDetailPanel.tsx packages/ui/src/components/InvestigationWall/__tests__/HypothesisDetailPanel.test.tsx packages/ui/src/components/InvestigationWall/index.ts /* whichever Wall surface file was modified */
git -C <worktree> commit -m "feat(ui): integrate MeasurementPlan UI into Wall detail surface"
```

---

## Task 9 — Verification + decision-log + PR open (CONTROLLER-LEVEL)

**Goal:** Final pre-PR check sweep + decision-log amendment + PR open. Per `feedback_implementer_long_bash_pitfall`, this task belongs to the CONTROLLER — not the implementer subagent. The implementer should NOT run full `pnpm test`, `pnpm build`, or `pr-ready-check.sh`.

If executed by the controller (not an implementer subagent):

- [ ] **Step 1: Targeted test sweep**

```bash
pnpm --filter @variscout/core test -- measurementPlan 2>&1 | tail -5
pnpm --filter @variscout/core test -- findings 2>&1 | tail -5
pnpm --filter @variscout/core test -- actions 2>&1 | tail -5
pnpm --filter @variscout/stores test 2>&1 | tail -5
pnpm --filter @variscout/azure-app test -- "applyAction|measurementPlan" 2>&1 | tail -8
pnpm --filter @variscout/pwa test -- "applyAction|measurementPlan" 2>&1 | tail -8
pnpm --filter @variscout/ui test -- InvestigationWall 2>&1 | tail -10
```

Expected: all green.

- [ ] **Step 2: Full build**

```bash
pnpm build 2>&1 | tail -10
```

Expected: 5/5 packages/apps green.

- [ ] **Step 3: pr-ready-check (optional per session policy — user may skip)**

If running: `bash scripts/pr-ready-check.sh 2>&1 | tail -30`. Otherwise skip per user direction; CI catches the same invariants on push.

- [ ] **Step 4: Decision-log amendment**

Add an amendment block under the existing 2026-05-16 wedge entry, after the PR-WV1-3a amendment block. Use plain-text paths (not markdown link syntax) per `feedback_doc_validation_hooks`.

- [ ] **Step 5: Push + open PR**

```bash
git push -u origin feat/wedge-pr-wv1-3-measurement-plans
gh pr create --base feat/wedge-pr-wv1-3-measurement-plans --title "feat(wedge): PR-WV1-3b MeasurementPlan + Wall integration" --body "..."
```

If PR-WV1-3a (PR #186) is still open, PR-WV1-3b's PR opens against the SAME base branch — both PRs target `feat/wedge-pr-wv1-2-improve-workspace` and GitHub will rebase when prior PRs merge.

---

## Verification

End-to-end criteria for PR-WV1-3b complete:

1. **Data model:** `MeasurementPlan` type exists with full §3.6.3 fields. `MeasurementPlanAction` 4-variant union + `reduceMeasurementPlans` reducer + tests green.
2. **Hypothesis extension:** `measurementPlanIds?: MeasurementPlan['id'][]` field present. Optional; existing IPs without it round-trip cleanly.
3. **Persistence:** Both apps' Dexie schemas have `measurementPlans` table at version 7. `applyAction.ts` handles 4 new `MEASUREMENT_PLAN_*` cases. Repository `listByHypothesis` works.
4. **HubAction:** `MeasurementPlanAction` is part of the `HubAction` union; all exhaustive consumers compile.
5. **UI:** `<MeasurementPlanChip>`, `<AddPlanForm>`, `<LinkFindingPicker>`, `<HypothesisDetailPanel>` all ship + tested. Integrated into the Wall detail surface settled by Task 5.
6. **ACL:** All Plan edit affordances gate via `canAccess('edit-approach')`. Owner picker filters Sponsors.
7. **Tests:** core / stores / azure-app / pwa / ui touched suites all green. Full build green.

---

## Self-review checklist

- [ ] **Spec coverage** — wedge spec §3.6 + PR-WV1-3b acceptance criteria #7-15 all mapped.
- [ ] **Placeholder scan** — no TBD / TODO. Every code block has actual code.
- [ ] **Type consistency** — `MeasurementPlan`, `MeasurementMethod`, `MeasurementPlanStatus`, `MeasurementPlanAction`, `MeasurementPlanPatch`, `MeasurementPlanChipProps`, `AddPlanFormProps`, `LinkFindingPickerProps`, `HypothesisDetailPanelProps` consistent across tasks.
- [ ] **TDD compliance** — every code-touching task has 5-step rhythm.
- [ ] **No `Math.random`** anywhere; `generateDeterministicId` for new entity IDs.
- [ ] **No "root cause"** language.
- [ ] **No `.toFixed()`** on stat values.
- [ ] **`feedback_action_patch_omit_lifecycle`**: `MeasurementPlanPatch` omits `id | createdAt | deletedAt | hypothesisId` (the last is the FK).
- [ ] **Sub-path exports paired** — Task 1 updates BOTH `package.json#exports` AND `tsconfig.json#paths`.
- [ ] **`vi.mock()` BEFORE imports** in all component test files.
- [ ] **`feedback_implementer_long_bash_pitfall`**: NO implementer task instructs full `pnpm test`, full `pnpm build`, or `pr-ready-check.sh`. Targeted `--filter ... -- suite` runs only. Task 9 (verification) is controller-level.

---

## Deferred to later PRs

- **Gage R&R / formal MSA workflow** (wedge spec §3.6.5) — `msaRequired?` field is informational only in V1.
- **Statistical sample-size calculator** — manual entry only.
- **Auto-ingestion / sensor feeds** — paste-only.
- **Multi-source provenance gating** — V2.
- **Auto-match factor + window heuristic** (wedge spec §3.6.4) — V1 ships manual `<LinkFindingPicker>` only.
- **Finding-side "Link to Plan…" picker** — V1 ships Plan-side picker only.
- **In-app Sponsor signoff for Plans** — out-of-band per wedge §4.1.
- **Auto-suggest Hypothesis status banner** (originally Task 9 in the design spec) — descoped from PR-WV1-3b per slice-size cap; revisit if usage shows manual transitions are annoying. The `useViewStore.dismissedMeasurementPlanBannerByHypothesisId` slice this would have needed is also descoped; add when the banner ships.
