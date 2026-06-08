---
tier: ephemeral
purpose: build
title: 'L-3 - Activity layer: run-now buttons, in-flight evidence collection, stalled causes'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/superpowers/plans/2026-06-07-demo-readiness-master-plan.md
  - docs/superpowers/plans/2026-06-07-l1-evidence-angle-picker.md
  - docs/02-journeys/wireframes/suspected-cause-card.md
---

# L-3: Activity Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Suspected-cause cards visibly answer "are we actively analyzing this?" without changing hypothesis status semantics or adding stored activity state.

**Architecture:** Add a pure read-model helper in `@variscout/core/findings` that derives run-now, in-flight, and stalled activity from existing `Hypothesis`, `MeasurementPlan`, and `DisconfirmationAttempt` data. Render that read-model in the shared `HypothesisCardWithPlans` extension zone so `WallCanvas`, PWA, and Azure stay in parity through the existing shared card path.

**Tech Stack:** TypeScript, React + Tailwind semantic classes (`@variscout/ui`), core-pure derivation (`@variscout/core`), Vitest + RTL, existing i18n catalogs.

**Worktree/branch:** `feat/l3-activity-layer`. This plan is Task 0 only; implementation starts after plan review.

---

## Constraints

- Run-now checks from `testPlanFactors` stay immediate buttons (`Evaluate` / `+ Measurement Plan`). They are never rendered as planned or in-flight activity rows.
- In flight means evidence is being collected: linked `MeasurementPlan`s with `status === 'planned' | 'in-progress'` plus pending `DisconfirmationAttempt` verdicts.
- Stalled means unsettled, run-now checks exhausted, no open collection plan, no pending verdict, and quiet for `5` working days. The threshold is a V1 constant, not configurable.
- Derivations are pure/render-time. Do not add stored state, migrations, or serializer changes.
- Do not re-automate hypothesis status. CS-10 stays intact: status suggestions remain advisory chips, and analyst-set status remains the write path.
- Do not add a `FindingSource` variant. Activity reads existing plans, attempts, and test-plan readiness only.
- Keep both apps in parity. Prefer shared UI/core changes; app changes are limited to forwarding any new shared callback.
- No implementation task may use banned causality wording in code, comments, tests, or UI copy; use "contribution", "suspected cause", or "mechanism" where needed.

## File Structure

- Create `packages/core/src/findings/hypothesisActivity.ts`: pure activity derivation and working-day helper.
- Modify `packages/core/src/findings/index.ts`: export the read-model helper and types through the existing `@variscout/core/findings` subpath.
- Test `packages/core/src/findings/__tests__/hypothesisActivity.test.ts`: deterministic derivation tests, including the 5-working-day threshold.
- Modify `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`: derive/render the activity layer, filter in-flight rows, show stalled amber escape actions.
- Test `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.activityLayer.test.tsx`: card-level activity rendering and action wiring.
- Modify `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`: add/pass the optional "go look" callback through planning props if needed.
- Modify PWA/Azure Analyze mounts only if the new callback is wired by the shared `WallCanvas` prop.
- Modify `packages/core/src/i18n/types.ts` and all `packages/core/src/i18n/messages/*.ts`: add activity/stalled labels with English placeholder values in non-English catalogs.

## Scope Fence

IN: suspected-cause card activity layer, pure read-model helper, updated tests, i18n keys, shared callback parity.

OUT: causes matrix activity column, Report stalled counts, new persistence, new auto-link behavior, new plan-completion automation, any status automation, any `FindingSource` work.

---

### Task 1: Core activity read-model

**Files:**

- Create: `packages/core/src/findings/hypothesisActivity.ts`
- Modify: `packages/core/src/findings/index.ts`
- Test: `packages/core/src/findings/__tests__/hypothesisActivity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/findings/__tests__/hypothesisActivity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { DisconfirmationAttempt, Hypothesis } from '../types';
import type { MeasurementPlan } from '../../measurementPlan/types';
import {
  STALLED_WORKING_DAY_THRESHOLD,
  deriveHypothesisActivity,
  workingDaysBetween,
} from '../hypothesisActivity';

const MONDAY = Date.UTC(2026, 5, 1, 12, 0, 0);
const NEXT_MONDAY = Date.UTC(2026, 5, 8, 12, 0, 0);

function hub(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h1',
    name: 'Night shift staffing gap drives late starts',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: MONDAY,
    updatedAt: MONDAY,
    deletedAt: null,
    ...overrides,
  };
}

function plan(overrides: Partial<MeasurementPlan> = {}): MeasurementPlan {
  return {
    id: 'mp1',
    hypothesisId: 'h1',
    outcome: 'CycleTime',
    primaryFactor: 'Shift',
    neededFactors: [],
    sampleSize: 30,
    method: 'gemba-walk',
    owner: 'm1',
    status: 'planned',
    scope: [],
    processLocation: '',
    linkedFindingIds: [],
    createdAt: MONDAY,
    deletedAt: null,
    ...overrides,
  };
}

function pendingAttempt(overrides: Partial<DisconfirmationAttempt> = {}): DisconfirmationAttempt {
  return {
    id: 'da1',
    attemptedAt: new Date(MONDAY).toISOString(),
    attemptedBy: { id: 'm1', displayName: 'Matti' },
    description: 'Check whether Shift still explains CycleTime this week',
    verdict: 'pending',
    linkedFindingIds: [],
    ...overrides,
  };
}

describe('workingDaysBetween', () => {
  it('counts Monday through Friday and skips weekends', () => {
    expect(workingDaysBetween(MONDAY, NEXT_MONDAY)).toBe(5);
  });
});

describe('deriveHypothesisActivity', () => {
  it('projects ready run-now factors but does not turn them into activity rows', () => {
    const activity = deriveHypothesisActivity({
      hub: hub({ updatedAt: MONDAY }),
      plans: [],
      testPlanFactors: [{ factor: 'Shift', readiness: 'ready', tool: 'two-sample' }],
      now: NEXT_MONDAY,
    });

    expect(activity.runNowFactors.map(f => f.factor)).toEqual(['Shift']);
    expect(activity.inFlightPlans).toEqual([]);
    expect(activity.pendingAttempts).toEqual([]);
    expect(activity.stalled.isStalled).toBe(false);
  });

  it('projects only planned and in-progress measurement plans as in-flight', () => {
    const activity = deriveHypothesisActivity({
      hub: hub(),
      plans: [
        plan({ id: 'planned', status: 'planned' }),
        plan({ id: 'in-progress', status: 'in-progress' }),
        plan({ id: 'complete', status: 'complete' }),
        plan({ id: 'skipped', status: 'skipped' }),
      ],
      testPlanFactors: [],
      now: NEXT_MONDAY,
    });

    expect(activity.inFlightPlans.map(p => p.id)).toEqual(['planned', 'in-progress']);
  });

  it('projects pending disconfirmation attempts as in-flight activity', () => {
    const activity = deriveHypothesisActivity({
      hub: hub({
        disconfirmationAttempts: [
          pendingAttempt({ id: 'pending', verdict: 'pending' }),
          pendingAttempt({ id: 'survived', verdict: 'survived' }),
          pendingAttempt({ id: 'refuted', verdict: 'refuted' }),
        ],
      }),
      plans: [],
      testPlanFactors: [],
      now: NEXT_MONDAY,
    });

    expect(activity.pendingAttempts.map(a => a.id)).toEqual(['pending']);
    expect(activity.stalled.isStalled).toBe(false);
  });

  it('marks a quiet unsettled cause stalled after five working days with no run-now checks or open activity', () => {
    const activity = deriveHypothesisActivity({
      hub: hub({ updatedAt: MONDAY, status: 'needs-disconfirmation' }),
      plans: [plan({ status: 'complete' })],
      testPlanFactors: [{ factor: 'Operator', readiness: 'gap', tool: null }],
      now: NEXT_MONDAY,
    });

    expect(STALLED_WORKING_DAY_THRESHOLD).toBe(5);
    expect(activity.stalled).toEqual({
      isStalled: true,
      quietWorkingDays: 5,
      thresholdWorkingDays: 5,
    });
  });

  it('never marks verified or ruled-out causes stalled', () => {
    for (const status of ['evidence-survived-test', 'refuted'] as const) {
      const activity = deriveHypothesisActivity({
        hub: hub({ updatedAt: MONDAY, status }),
        plans: [],
        testPlanFactors: [],
        now: NEXT_MONDAY,
      });
      expect(activity.stalled.isStalled).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @variscout/core test -- hypothesisActivity.test.ts
```

Expected: FAIL because `hypothesisActivity.ts` does not exist.

- [ ] **Step 3: Implement the read-model**

Create `packages/core/src/findings/hypothesisActivity.ts`:

```ts
import type { DisconfirmationAttempt, Hypothesis } from './types';
import type { MeasurementPlan } from '../measurementPlan/types';
import type { HypothesisTestPlanFactor } from './hypothesisTestPlan';

export const STALLED_WORKING_DAY_THRESHOLD = 5;

export interface HypothesisActivityStalledState {
  isStalled: boolean;
  quietWorkingDays: number;
  thresholdWorkingDays: number;
}

export interface HypothesisActivity {
  runNowFactors: HypothesisTestPlanFactor[];
  inFlightPlans: MeasurementPlan[];
  pendingAttempts: DisconfirmationAttempt[];
  stalled: HypothesisActivityStalledState;
}

export interface DeriveHypothesisActivityArgs {
  hub: Hypothesis;
  plans: readonly MeasurementPlan[];
  testPlanFactors?: readonly HypothesisTestPlanFactor[];
  now: number;
}

export function deriveHypothesisActivity({
  hub,
  plans,
  testPlanFactors,
  now,
}: DeriveHypothesisActivityArgs): HypothesisActivity {
  const runNowFactors = (testPlanFactors ?? []).filter(tp => tp.readiness === 'ready');
  const inFlightPlans = plans.filter(
    plan => plan.deletedAt === null && (plan.status === 'planned' || plan.status === 'in-progress')
  );
  const pendingAttempts = (hub.disconfirmationAttempts ?? []).filter(
    attempt => attempt.verdict === 'pending'
  );
  const quietWorkingDays = workingDaysBetween(hub.updatedAt, now);
  const unsettled = hub.status !== 'evidence-survived-test' && hub.status !== 'refuted';
  const stalled =
    unsettled &&
    runNowFactors.length === 0 &&
    inFlightPlans.length === 0 &&
    pendingAttempts.length === 0 &&
    quietWorkingDays >= STALLED_WORKING_DAY_THRESHOLD;

  return {
    runNowFactors,
    inFlightPlans,
    pendingAttempts,
    stalled: {
      isStalled: stalled,
      quietWorkingDays,
      thresholdWorkingDays: STALLED_WORKING_DAY_THRESHOLD,
    },
  };
}

export function workingDaysBetween(startMs: number, endMs: number): number {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;

  let days = 0;
  const cursor = startOfUtcDay(startMs);
  const end = startOfUtcDay(endMs);

  while (cursor < end) {
    const day = new Date(cursor).getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function startOfUtcDay(ms: number): Date {
  const date = new Date(ms);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
```

Modify `packages/core/src/findings/index.ts`:

```ts
export {
  STALLED_WORKING_DAY_THRESHOLD,
  deriveHypothesisActivity,
  workingDaysBetween,
} from './hypothesisActivity';
export type {
  DeriveHypothesisActivityArgs,
  HypothesisActivity,
  HypothesisActivityStalledState,
} from './hypothesisActivity';
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
pnpm --filter @variscout/core test -- hypothesisActivity.test.ts
pnpm --filter @variscout/core build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/hypothesisActivity.ts packages/core/src/findings/index.ts packages/core/src/findings/__tests__/hypothesisActivity.test.ts
git commit -m "feat(core): derive suspected-cause activity state"
```

### Task 2: Card activity rendering

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.activityLayer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.activityLayer.test.tsx`:

```tsx
vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { HypothesisCardWithPlans, type TestPlanFactorView } from '../HypothesisCardWithPlans';

const NOW = Date.UTC(2026, 5, 8, 12, 0, 0);
const UPDATED = Date.UTC(2026, 5, 1, 12, 0, 0);

const member: ProjectMember = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Matti Lead',
  role: 'lead',
  invitedAt: UPDATED,
  createdAt: UPDATED,
  deletedAt: null,
};

const hub: Hypothesis = {
  id: 'h1',
  name: 'Night shift staffing gap drives late starts',
  synthesis: '',
  findingIds: [],
  status: 'needs-disconfirmation',
  createdAt: UPDATED,
  updatedAt: UPDATED,
  deletedAt: null,
};

function plan(overrides: Partial<MeasurementPlan> = {}): MeasurementPlan {
  return {
    id: 'mp1',
    hypothesisId: 'h1',
    outcome: 'CycleTime',
    primaryFactor: 'Shift',
    neededFactors: [],
    method: 'gemba-walk',
    sampleSize: 12,
    owner: 'm1',
    status: 'planned',
    scope: [],
    processLocation: '',
    linkedFindingIds: [],
    dueDate: '2026-06-30',
    createdAt: UPDATED,
    deletedAt: null,
    ...overrides,
  };
}

function renderInSvg(
  overrides: Partial<React.ComponentProps<typeof HypothesisCardWithPlans>> = {}
) {
  return render(
    <svg>
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus={hub.status}
        x={0}
        y={0}
        plans={[]}
        members={[member]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
        activityNow={NOW}
        {...overrides}
      />
    </svg>
  );
}

describe('HypothesisCardWithPlans activity layer', () => {
  it('renders planned and in-progress plans in an in-flight activity section with owner and due date', () => {
    renderInSvg({
      plans: [plan({ status: 'planned' }), plan({ id: 'mp2', status: 'in-progress' })],
    });

    const section = screen.getByTestId('activity-in-flight');
    expect(within(section).getByText(/In flight/i)).toBeInTheDocument();
    expect(within(section).getAllByText(/Matti Lead/i).length).toBeGreaterThan(0);
    expect(section.textContent).toMatch(/2026-06-30/);
    expect(section.textContent).toMatch(/gemba-walk/);
  });

  it('does not count complete or skipped plans as in-flight activity', () => {
    renderInSvg({ plans: [plan({ status: 'complete' }), plan({ id: 'mp2', status: 'skipped' })] });

    expect(screen.queryByTestId('activity-in-flight')).toBeNull();
    expect(screen.queryByTestId('data-collection-task')).toBeNull();
  });

  it('renders pending disconfirmation attempts as in-flight break attempts', () => {
    renderInSvg({
      hub: {
        ...hub,
        disconfirmationAttempts: [
          {
            id: 'da1',
            attemptedAt: new Date(UPDATED).toISOString(),
            attemptedBy: { id: 'm1', displayName: 'Matti Lead' },
            description: 'Check whether Shift still explains CycleTime',
            verdict: 'pending',
            linkedFindingIds: [],
          },
        ],
      },
    });

    const section = screen.getByTestId('activity-in-flight');
    expect(section.textContent).toMatch(/break attempt/i);
    expect(section.textContent).toMatch(/Shift still explains CycleTime/i);
  });

  it('keeps run-now checks as buttons and never renders them as in-flight rows', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      { factor: 'Shift', readiness: 'ready', tool: 'two-sample' },
    ];
    renderInSvg({ testPlanFactors, onEvaluateFactor: vi.fn() });

    expect(screen.getByTestId('evaluate-factor-Shift')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-in-flight')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @variscout/ui test -- HypothesisCardWithPlans.activityLayer.test.tsx
```

Expected: FAIL because `activityNow`, `activity-in-flight`, and the filtered activity layer do not exist.

- [ ] **Step 3: Implement card activity rendering**

Modify `HypothesisCardWithPlans.tsx`:

```ts
import { deriveHypothesisActivity } from '@variscout/core/findings';
```

Add prop:

```ts
/** L-3 activity derivation clock. Defaults to Date.now() at render time. */
activityNow?: number;
```

Destructure:

```ts
activityNow,
```

Derive near the existing plan height calculations:

```ts
const activity = deriveHypothesisActivity({
  hub: cardProps.hub,
  plans,
  testPlanFactors,
  now: activityNow ?? Date.now(),
});
const inFlightPlanRows = activity.inFlightPlans;
const pendingAttemptRows = activity.pendingAttempts;
const showInFlightActivity = inFlightPlanRows.length > 0 || pendingAttemptRows.length > 0;
```

Replace `const dataCollectTotalH = plans.length * DATA_COLLECT_ROW_H;` with:

```ts
const dataCollectTotalH = inFlightPlanRows.length * DATA_COLLECT_ROW_H;
const pendingAttemptRowsH = pendingAttemptRows.length * 44;
const activityHeaderH = showInFlightActivity ? 30 : 0;
```

Include `activityHeaderH + pendingAttemptRowsH` in `plansSectionH`.

Change the plan map from `plans.map(plan => {` to `inFlightPlanRows.map(plan => {` and wrap it with:

```tsx
{
  showInFlightActivity && (
    <div data-testid="activity-in-flight" className="border-b border-gray-100">
      <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-gray-500">
        {getMessage(locale, 'wall.activity.inFlightHeading')}
      </div>
      {/* inFlightPlanRows map here */}
      {pendingAttemptRows.map(attempt => (
        <div
          key={`pending-attempt-${attempt.id}`}
          data-testid="activity-pending-attempt"
          className="px-3 py-1.5 text-xs text-amber-800 border-t border-amber-100 bg-amber-50"
        >
          <span className="font-medium">{getMessage(locale, 'wall.activity.pendingAttempt')}</span>
          <span className="ml-1">{attempt.description}</span>
        </div>
      ))}
    </div>
  );
}
```

Move the existing data-collection-task plan rows inside that wrapper and keep `MeasurementPlanChip` unchanged.

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
pnpm --filter @variscout/ui test -- HypothesisCardWithPlans.activityLayer.test.tsx HypothesisCardWithPlans.planCollector.test.tsx
pnpm --filter @variscout/ui build
```

Expected: PASS after updating the existing plan collector expectations so `complete` and `skipped` plans are historical and do not render as active collection rows.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.activityLayer.test.tsx packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.planCollector.test.tsx
git commit -m "feat(ui): render in-flight suspected-cause activity"
```

### Task 3: Stalled state and escape actions

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.activityLayer.test.tsx`

- [ ] **Step 1: Add failing stalled tests**

Append to `HypothesisCardWithPlans.activityLayer.test.tsx`:

```tsx
describe('HypothesisCardWithPlans stalled activity state', () => {
  it('renders amber stalled state with the three escape actions for a quiet unsettled cause', () => {
    renderInSvg({ plans: [], testPlanFactors: [] });

    const stalled = screen.getByTestId('activity-stalled');
    expect(stalled.textContent).toMatch(/Nothing in flight/i);
    expect(stalled.textContent).toMatch(/5 working days/i);
    expect(within(stalled).getByRole('button', { name: /Plan a check/i })).toBeInTheDocument();
    expect(within(stalled).getByRole('button', { name: /Go look/i })).toBeInTheDocument();
    expect(within(stalled).getByRole('button', { name: /Rule it out/i })).toBeInTheDocument();
  });

  it('Plan a check opens AddPlanForm, Go look calls onGoLook, and Rule it out sets refuted', () => {
    const onGoLook = vi.fn();
    const onSetStatus = vi.fn();
    renderInSvg({ plans: [], testPlanFactors: [], onGoLook, onSetStatus });

    screen.getByRole('button', { name: /Plan a check/i }).click();
    expect(screen.getByLabelText('Primary factor')).toBeInTheDocument();

    screen.getByRole('button', { name: /Go look/i }).click();
    expect(onGoLook).toHaveBeenCalledWith('h1');

    screen.getByRole('button', { name: /Rule it out/i }).click();
    expect(onSetStatus).toHaveBeenCalledWith('h1', 'refuted');
  });

  it('does not render stalled when the cause is verified or ruled out', () => {
    for (const status of ['evidence-survived-test', 'refuted'] as const) {
      const { unmount } = renderInSvg({
        hub: { ...hub, status },
        displayStatus: status,
        plans: [],
        testPlanFactors: [],
      });
      expect(screen.queryByTestId('activity-stalled')).toBeNull();
      unmount();
    }
  });

  it('does not render stalled while a ready run-now check exists', () => {
    renderInSvg({
      plans: [],
      testPlanFactors: [{ factor: 'Shift', readiness: 'ready', tool: 'two-sample' }],
      onEvaluateFactor: vi.fn(),
    });

    expect(screen.getByTestId('evaluate-factor-Shift')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-stalled')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @variscout/ui test -- HypothesisCardWithPlans.activityLayer.test.tsx
```

Expected: FAIL because stalled UI and `onGoLook` are missing.

- [ ] **Step 3: Implement stalled UI**

Add prop:

```ts
/** L-3 stalled escape action: take the analyst to qualitative/gemba evidence capture. */
onGoLook?: (hypothesisId: string) => void;
```

Destructure `onGoLook`.

Add heights:

```ts
const stalledH = activity.stalled.isStalled ? 84 : 0;
```

Include `stalledH` in `plansSectionH`.

Render before the add-plan button:

```tsx
{
  activity.stalled.isStalled && (
    <div
      data-testid="activity-stalled"
      className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
    >
      <div className="font-semibold">
        {getMessage(locale, 'wall.activity.stalledHeading').replace(
          '{days}',
          String(activity.stalled.quietWorkingDays)
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-800 hover:bg-amber-100"
          onClick={() => setAddPlanFormOpen(true)}
        >
          {getMessage(locale, 'wall.activity.planCheck')}
        </button>
        <button
          type="button"
          className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          disabled={!onGoLook}
          onClick={() => onGoLook?.(cardProps.hub.id)}
        >
          {getMessage(locale, 'wall.activity.goLook')}
        </button>
        <button
          type="button"
          className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          disabled={!onSetStatus}
          onClick={() => onSetStatus?.(cardProps.hub.id, 'refuted')}
        >
          {getMessage(locale, 'wall.activity.ruleOut')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
pnpm --filter @variscout/ui test -- HypothesisCardWithPlans.activityLayer.test.tsx
pnpm --filter @variscout/ui build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.activityLayer.test.tsx
git commit -m "feat(ui): show stalled suspected-cause activity"
```

### Task 4: i18n keys for activity copy

**Files:**

- Modify: `packages/core/src/i18n/types.ts`
- Modify: `packages/core/src/i18n/messages/*.ts`
- Test: existing i18n/build checks

- [ ] **Step 1: Add failing type usage**

Task 2/3 already references these missing keys:

```ts
'wall.activity.inFlightHeading';
'wall.activity.pendingAttempt';
'wall.activity.stalledHeading';
'wall.activity.planCheck';
'wall.activity.goLook';
'wall.activity.ruleOut';
```

Run:

```bash
pnpm --filter @variscout/ui build
```

Expected: FAIL until `MessageCatalog` and all locale catalogs include the keys.

- [ ] **Step 2: Add keys to `packages/core/src/i18n/types.ts`**

Add near the existing `wall.collect.*` keys:

```ts
'wall.activity.inFlightHeading': string;
'wall.activity.pendingAttempt': string;
'wall.activity.stalledHeading': string;
'wall.activity.planCheck': string;
'wall.activity.goLook': string;
'wall.activity.ruleOut': string;
```

- [ ] **Step 3: Add catalog values**

Add to `packages/core/src/i18n/messages/en.ts`:

```ts
'wall.activity.inFlightHeading': 'In flight - evidence being collected',
'wall.activity.pendingAttempt': 'Break attempt pending:',
'wall.activity.stalledHeading': 'Nothing in flight for {days} working days',
'wall.activity.planCheck': 'Plan a check',
'wall.activity.goLook': 'Go look',
'wall.activity.ruleOut': 'Rule it out',
```

Add the same English placeholder values to every non-English `packages/core/src/i18n/messages/*.ts` catalog, matching the repo convention for untranslated technical labels.

- [ ] **Step 4: Run i18n/build verification**

Run:

```bash
pnpm --filter @variscout/core build
pnpm --filter @variscout/ui build
pnpm check:i18n
```

Expected: PASS. If `pnpm check:i18n` fails because local `tsx` is missing, record the exact failure and rely on the core/ui builds plus `scripts/pr-ready-check.sh` in Task 6.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/i18n/types.ts packages/core/src/i18n/messages
git commit -m "feat(i18n): add suspected-cause activity copy"
```

### Task 5: WallCanvas and app parity

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: PWA Analyze mount if required by the new prop
- Modify: Azure Analyze mount if required by the new prop
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx` or a focused seam test if the callback crosses WallCanvas

- [ ] **Step 1: Write failing seam test if `onGoLook` crosses WallCanvas**

If `onGoLook` is added to `WallPlanningProps`, add a test near existing planning-prop seam tests:

```tsx
it('forwards onGoLook from WallCanvas planning props to the suspected-cause card', () => {
  const onGoLook = vi.fn();
  render(
    <WallCanvas
      hubs={[quietHub]}
      findings={[]}
      planningProps={basePlanningProps({ onGoLook, plans: [], members: [], currentUserId: null })}
      rows={[]}
      outcomeColumn="CycleTime"
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Go look/i }));
  expect(onGoLook).toHaveBeenCalledWith(quietHub.id);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @variscout/ui test -- WallCanvas.test.tsx -t "onGoLook"
```

Expected: FAIL until the prop is defined and forwarded.

- [ ] **Step 3: Implement shared forwarding**

In `WallCanvas.tsx`, add optional callback to the planning props interface:

```ts
onGoLook?: (hypothesisId: string) => void;
```

Forward it into `HypothesisCardWithPlans`:

```ts
onGoLook: planningProps.onGoLook,
```

If app-level mounts already pass `planningProps` object literals, add `onGoLook` in both PWA and Azure. For V1, the callback may focus/open the existing qualitative capture path if present; otherwise wire a no-op omitted prop so the button renders disabled only when no host behavior exists. Both apps must compile either way.

- [ ] **Step 4: Run parity builds**

Run:

```bash
pnpm --filter @variscout/ui test -- WallCanvas.test.tsx -t "onGoLook"
pnpm --filter @variscout/ui build
pnpm --filter @variscout/pwa build
pnpm --filter @variscout/azure-app build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/WallCanvas.tsx packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx apps/pwa/src apps/azure/src
git commit -m "feat(wall): forward suspected-cause go-look activity action"
```

### Task 6: Final gates and browser evidence

**Files:**

- No source edits expected unless verification finds a defect.
- PR body evidence after implementation.

- [ ] **Step 1: Run full self-merge gate**

Run:

```bash
bash scripts/pr-ready-check.sh
```

Expected: PASS.

- [ ] **Step 2: Browser verification**

Start the app:

```bash
pnpm dev
```

Use the browser verification flow to load "The Bottleneck" sample and verify:

- A suspected-cause card with an open measurement plan shows the in-flight activity row with owner and due date.
- A quiet unsettled suspected cause with no open plan shows amber stalled state plus `Plan a check`, `Go look`, `Rule it out`.
- A run-now check appears as an immediate button (`Evaluate` / `Check it`), not a plan row.

Capture screenshots and include their paths or trace evidence in the PR body.

- [ ] **Step 3: Internal adversarial review**

Review the diff against these failure modes:

- `complete` / `skipped` plans accidentally render as active activity.
- Ready run-now checks are duplicated into the in-flight section.
- Any stalled condition writes state or changes status automatically.
- The stalled threshold is configurable or calendar-day based instead of a 5-working-day constant.
- PWA and Azure diverge.

- [ ] **Step 4: Open PR**

Run the repo PR workflow, include test output and browser evidence in the PR body.

- [ ] **Step 5: Merge only after gates are green**

Run:

```bash
gh pr merge --merge --delete-branch
```

Never use `--squash`.
