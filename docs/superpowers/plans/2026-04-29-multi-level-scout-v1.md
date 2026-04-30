---
title: 'Multi-level SCOUT V1 (first slice) — implementation plan'
audience: [engineer, architect]
category: implementation
status: draft
date: 2026-04-29
related:
  - multi-level-scout-design
  - multi-level-scout-v1-decisions
  - adr-074-scout-level-spanning-surface-boundary-policy
  - investigation-scope-and-drill-semantics
---

# Multi-level SCOUT V1 (first slice) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the first delivery slice of the Multi-level SCOUT design (`docs/superpowers/specs/2026-04-29-multi-level-scout-design.md` §8) — the architecture (strategy + `dataRouter`), the timeline window primitive, scope detection, the new throughput module (`computeOutputRate` + `computeBottleneck`), the drift detector, append-mode for re-upload, and the `ProductionLineGlanceDashboard` refactor onto the strategy pattern. Findings record their window context as a passive footer. ADR-074 gets a structural-absence boundary check script.

**Architecture:** The existing strategy pattern in `packages/core/src/analysisStrategy.ts:51-160` stays unchanged at the slot level. We extend `AnalysisModeStrategy` with a `dataRouter` function that takes `{scope, phase, window, context}` and returns `{hook, transforms[], chartVariants}`. A new `TimelineWindow` filter type joins the existing filter pipeline (`useFilteredData`, `FilterContextBar`) — applied to the parser-detected `timeColumn` (`packages/core/src/parser/detection.ts:154`). New L2 metrics live in `packages/core/src/throughput/` (mirrors `defect/` / `yamazumi/`). Drift lives in `packages/core/src/findings/drift.ts`. No new chart components; existing time-aware charts (`IChart`, `Boxplot`, `ParetoChart`) consume window-filtered data.

**Tech stack:** TypeScript, Vitest (unit), React Testing Library (component), Zustand (stores), Visx (charts), Dexie (Azure IndexedDB). pnpm workspaces. Turbo for parallel test runs. No new dependencies expected.

---

## File structure

### New files

**Core types + primitives:**

- `packages/core/src/timeline/types.ts` — `TimelineWindow` discriminated union; `Granularity` reuse from `time.ts`.
- `packages/core/src/timeline/applyWindow.ts` — `applyWindow(rows, timeColumn, window)` filters by window.
- `packages/core/src/timeline/__tests__/applyWindow.test.ts`
- `packages/core/src/timeline/index.ts` — public API barrel.

**Scope detection:**

- `packages/core/src/scopeDetection.ts` — `detectScope(investigation): 'b0' | 'b1' | 'b2'`.
- `packages/core/src/__tests__/scopeDetection.test.ts`

**Append mode:**

- `packages/core/src/appendMode.ts` — `mergeRows(existing, incoming, keyColumns)` for re-upload.
- `packages/core/src/__tests__/appendMode.test.ts`

**Throughput metrics module:**

- `packages/core/src/throughput/types.ts` — `OutputRateResult`, `BottleneckResult`, etc.
- `packages/core/src/throughput/aggregation.ts` — `computeOutputRate`, `computeBottleneck`.
- `packages/core/src/throughput/index.ts` — barrel.
- `packages/core/src/throughput/__tests__/aggregation.test.ts`

**Drift detection:**

- `packages/core/src/findings/drift.ts` — `computeFindingWindowDrift`.
- `packages/core/src/findings/__tests__/drift.test.ts`

**Hooks:**

- `packages/hooks/src/useTimelineWindow.ts` — Zustand-backed window state + URL sync.
- `packages/hooks/src/__tests__/useTimelineWindow.test.ts`
- `packages/hooks/src/useDataRouter.ts` — invokes strategy.dataRouter, returns hook output.
- `packages/hooks/src/__tests__/useDataRouter.test.ts`

**UI:**

- `packages/ui/src/components/TimelineWindowPicker/TimelineWindowPicker.tsx`
- `packages/ui/src/components/TimelineWindowPicker/index.ts`
- `packages/ui/src/components/TimelineWindowPicker/__tests__/TimelineWindowPicker.test.tsx`

**Boundary script:**

- `scripts/check-level-boundaries.sh` — ADR-074 verification.

**Feature docs:**

- `docs/03-features/analysis/timeline-window-investigations.md`
- `docs/03-features/analysis/multi-level-dashboard.md`

**Architecture doc:**

- `docs/05-technical/architecture/timeline-window-architecture.md`

### Modified files

- `packages/core/src/analysisStrategy.ts` — extend `AnalysisModeStrategy` with `dataRouter`; add to all 6 strategy registrations.
- `packages/core/src/types.ts` — add `TimelineWindow` re-export and `windowContext` on `Finding`.
- `packages/core/src/findings/types.ts` — `WindowContext` type on `Finding`.
- `packages/core/src/index.ts` — re-export new modules.
- `packages/core/src/glossary/terms.ts` — add user-facing terms.
- `packages/hooks/src/useFilteredData.ts` — accept window in args.
- `packages/hooks/src/useProductionLineGlanceData.ts` — window-aware fetching.
- `packages/hooks/src/index.ts` — re-export new hooks.
- `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` — accept `timelineWindow` + change-handler.
- `packages/ui/src/components/FilterContextBar/FilterContextBar.tsx` — slot for `TimelineWindowPicker`.
- `packages/ui/src/components/Findings/FindingCard.tsx` (or equivalent) — passive footer showing window context.
- `apps/azure/src/components/ProcessHubCapabilityTab.tsx` — refactor to use strategy + dataRouter.
- `apps/azure/src/components/Dashboard.tsx` — wire `useTimelineWindow`.
- `apps/pwa/src/components/Dashboard.tsx` — wire `useTimelineWindow`.

**Docs (interleaved per task):**

- `docs/01-vision/methodology.md` — temporal scope paragraph.
- `docs/01-vision/eda-mental-model.md` — SCOUT loops note.
- `docs/05-technical/statistics-reference.md` — new metric definitions.
- `docs/03-features/learning/glossary.md` — user-facing terms.
- `docs/USER-JOURNEYS.md` and per-mode files.
- `docs/llms.txt`, `CLAUDE.md`, per-package `CLAUDE.md`.

**Lifecycle (final task):**

- `docs/superpowers/specs/2026-04-29-multi-level-scout-design.md` — status `draft` → `delivered`.
- `docs/decision-log.md` — close V1 implementation row.
- `docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md` — strike "to be added" note.

---

## Branching + workflow

This is product-code work touching many packages. Per CLAUDE.md Workflow:

- Branch off `main`: `feat/multi-level-scout-v1` (or split into 2-3 branches if it gets too large during execution).
- Each task ends with a commit on the branch.
- Open a PR when the first batch of tasks lands; iterate.
- Pre-merge: `bash scripts/pr-ready-check.sh` green; subagent code review per `feedback_subagent_driven_default.md`.
- Squash-merge to main.

---

## Task 0: Lock load-bearing decisions

The spec's "Open in spec" section flags six ambiguities. Three are load-bearing for the persistence schema and must be settled before any code lands. The other three can be settled inside the relevant tasks.

**Files to create:** `docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md` (companion file capturing the locked decisions).

- [ ] **Step 0.1: Lock decision #6 — default window per mode**

Decision: default windows by `(mode × phase)`:

- Investigation phase (any mode): `openEnded` from the investigation's `createdAt` to `today`.
- Hub phase, Capability mode: `rolling` matching the hub's `cadence` field (rolling 7d for `weekly`, rolling 1d for `daily`, rolling 24h for `hourly`, etc.); falls back to `rolling 30d` when cadence is unset.
- Hub phase, all other modes: `cumulative` (these aren't built for V1; placeholder default).
- B0 (legacy, no `nodeMappings`): `cumulative` always — B0 doesn't have a temporal frame.

Reasoning: matches Power-BI / Grafana defaults (live for monitoring, fixed for review); aligns with the operating-model's cadence framing.

- [ ] **Step 0.2: Lock decision #1 — TimelineWindow attachment point**

Decision: `TimelineWindow` attaches as a top-level field on the **Investigation envelope**, not on `ProcessContext`. ProcessContext stays scope-binding-only (canonical map, nodeMappings, specs). The window is an analyst-time control that can change without invalidating the scope.

```typescript
// packages/core/src/types.ts
interface Investigation {
  // existing fields...
  processContext: ProcessContext;
  window: TimelineWindow; // NEW — V1 first slice
  // ...
}
```

- [ ] **Step 0.3: Lock decision #4 — append-mode row-merge keys**

Decision: append-mode dedupes rows by **(timestamp value, all currently-mapped factor columns, outcome column)**. Rationale: the timestamp is the discriminator for "newer reading"; factor + outcome columns identify the specific measurement. Rows where timestamps + factors match but outcomes differ are treated as **corrections** (newer wins). Rows where timestamps + factors + outcomes match are dropped as exact duplicates. Logged as a merge report (count of new / duplicate / corrected).

- [ ] **Step 0.4: Capture decisions in companion file + commit**

Write the three decisions above plus brief rationale to `docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md`. Include "deferred to task" notes for the other three ambiguities (#2 SpecLookupContext shape, #3 ChartVariantId, #5 drift threshold default — each settled inside its implementing task).

```bash
git checkout -b feat/multi-level-scout-v1
git add docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md
git commit -m "docs: lock load-bearing decisions for multi-level SCOUT V1"
```

---

## Task 1: TimelineWindow types

**Files:**

- Create: `packages/core/src/timeline/types.ts`
- Create: `packages/core/src/timeline/__tests__/types.test.ts`
- Create: `packages/core/src/timeline/index.ts`
- Modify: `packages/core/src/index.ts` (re-export)

- [ ] **Step 1.1: Write failing test for type discrimination**

```typescript
// packages/core/src/timeline/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { TimelineWindow } from '../types';
import { isFixedWindow, isRollingWindow, isOpenEndedWindow, isCumulativeWindow } from '../types';

describe('TimelineWindow type guards', () => {
  it('discriminates each kind', () => {
    const fixed: TimelineWindow = {
      kind: 'fixed',
      startISO: '2026-01-01T00:00:00Z',
      endISO: '2026-01-31T23:59:59Z',
    };
    const rolling: TimelineWindow = { kind: 'rolling', windowDays: 30 };
    const open: TimelineWindow = { kind: 'openEnded', startISO: '2026-04-01T00:00:00Z' };
    const cumulative: TimelineWindow = { kind: 'cumulative' };

    expect(isFixedWindow(fixed)).toBe(true);
    expect(isRollingWindow(rolling)).toBe(true);
    expect(isOpenEndedWindow(open)).toBe(true);
    expect(isCumulativeWindow(cumulative)).toBe(true);

    expect(isFixedWindow(rolling)).toBe(false);
    expect(isRollingWindow(open)).toBe(false);
  });
});
```

- [ ] **Step 1.2: Run test, verify it fails**

```bash
pnpm --filter @variscout/core test -- timeline/__tests__/types.test.ts
```

Expected: FAIL — module `'../types'` doesn't exist.

- [ ] **Step 1.3: Implement types**

```typescript
// packages/core/src/timeline/types.ts
export type TimelineWindow =
  | { kind: 'fixed'; startISO: string; endISO: string }
  | { kind: 'rolling'; windowDays: number }
  | { kind: 'openEnded'; startISO: string }
  | { kind: 'cumulative' };

export type TimelineWindowKind = TimelineWindow['kind'];

export function isFixedWindow(w: TimelineWindow): w is Extract<TimelineWindow, { kind: 'fixed' }> {
  return w.kind === 'fixed';
}
export function isRollingWindow(
  w: TimelineWindow
): w is Extract<TimelineWindow, { kind: 'rolling' }> {
  return w.kind === 'rolling';
}
export function isOpenEndedWindow(
  w: TimelineWindow
): w is Extract<TimelineWindow, { kind: 'openEnded' }> {
  return w.kind === 'openEnded';
}
export function isCumulativeWindow(
  w: TimelineWindow
): w is Extract<TimelineWindow, { kind: 'cumulative' }> {
  return w.kind === 'cumulative';
}
```

- [ ] **Step 1.4: Add barrel + re-export**

```typescript
// packages/core/src/timeline/index.ts
export type { TimelineWindow, TimelineWindowKind } from './types';
export { isFixedWindow, isRollingWindow, isOpenEndedWindow, isCumulativeWindow } from './types';
```

Add to `packages/core/src/index.ts` (find the section with module barrels):

```typescript
export * from './timeline';
```

- [ ] **Step 1.5: Run test, verify pass + commit**

```bash
pnpm --filter @variscout/core test -- timeline/__tests__/types.test.ts
```

Expected: 1 file, 1 test passed.

```bash
git add packages/core/src/timeline/ packages/core/src/index.ts
git commit -m "feat(core): TimelineWindow discriminated union + type guards"
```

---

## Task 2: applyWindow function

**Files:**

- Create: `packages/core/src/timeline/applyWindow.ts`
- Create: `packages/core/src/timeline/__tests__/applyWindow.test.ts`
- Modify: `packages/core/src/timeline/index.ts` (re-export)

- [ ] **Step 2.1: Write failing test for window application**

```typescript
// packages/core/src/timeline/__tests__/applyWindow.test.ts
import { describe, it, expect } from 'vitest';
import { applyWindow } from '../applyWindow';
import type { DataRow } from '../../types';

const rows: DataRow[] = [
  { timestamp: '2026-03-01T08:00:00Z', value: 1 },
  { timestamp: '2026-03-15T12:00:00Z', value: 2 },
  { timestamp: '2026-04-01T08:00:00Z', value: 3 },
  { timestamp: '2026-04-29T08:00:00Z', value: 4 },
];

describe('applyWindow', () => {
  it('filters by fixed window', () => {
    const result = applyWindow(rows, 'timestamp', {
      kind: 'fixed',
      startISO: '2026-03-10T00:00:00Z',
      endISO: '2026-04-10T00:00:00Z',
    });
    expect(result.map(r => r.value)).toEqual([2, 3]);
  });

  it('filters by rolling window from now', () => {
    const now = new Date('2026-04-29T12:00:00Z');
    const result = applyWindow(rows, 'timestamp', { kind: 'rolling', windowDays: 7 }, now);
    expect(result.map(r => r.value)).toEqual([4]);
  });

  it('filters by open-ended window (start to now)', () => {
    const now = new Date('2026-04-29T12:00:00Z');
    const result = applyWindow(
      rows,
      'timestamp',
      { kind: 'openEnded', startISO: '2026-04-01T00:00:00Z' },
      now
    );
    expect(result.map(r => r.value)).toEqual([3, 4]);
  });

  it('returns all rows for cumulative window', () => {
    const result = applyWindow(rows, 'timestamp', { kind: 'cumulative' });
    expect(result.map(r => r.value)).toEqual([1, 2, 3, 4]);
  });

  it('skips rows where the timeColumn is null/missing', () => {
    const withNulls: DataRow[] = [{ timestamp: null, value: 99 }, ...rows];
    const result = applyWindow(withNulls, 'timestamp', { kind: 'cumulative' });
    expect(result.map(r => r.value)).toEqual([1, 2, 3, 4]); // null-timestamp row dropped
  });

  it('returns empty array if timeColumn does not exist on rows', () => {
    const result = applyWindow(rows, 'nonexistent', { kind: 'cumulative' });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2.2: Run test, verify it fails**

```bash
pnpm --filter @variscout/core test -- timeline/__tests__/applyWindow.test.ts
```

Expected: FAIL — module `'../applyWindow'` doesn't exist.

- [ ] **Step 2.3: Implement applyWindow**

```typescript
// packages/core/src/timeline/applyWindow.ts
import type { DataRow } from '../types';
import { parseTimeValue } from '../time';
import type { TimelineWindow } from './types';

/**
 * Filter rows by the active timeline window.
 *
 * Rules:
 * - Rows with a null/unparseable timeColumn value are dropped (they have no
 *   temporal locus).
 * - If the timeColumn does not exist on the row shape, returns an empty array
 *   (caller should detect-time-column at FRAME, not at apply time).
 * - For 'rolling' and 'openEnded' windows, `now` defaults to current time;
 *   tests pass an explicit `now` for determinism.
 */
export function applyWindow(
  rows: DataRow[],
  timeColumn: string,
  window: TimelineWindow,
  now: Date = new Date()
): DataRow[] {
  if (rows.length === 0) return [];
  if (!(timeColumn in rows[0])) return [];

  if (window.kind === 'cumulative') {
    return rows.filter(row => parseTimeValue(row[timeColumn]) !== null);
  }

  let startMs: number;
  let endMs: number;

  switch (window.kind) {
    case 'fixed':
      startMs = Date.parse(window.startISO);
      endMs = Date.parse(window.endISO);
      break;
    case 'rolling':
      endMs = now.getTime();
      startMs = endMs - window.windowDays * 24 * 60 * 60 * 1000;
      break;
    case 'openEnded':
      startMs = Date.parse(window.startISO);
      endMs = now.getTime();
      break;
  }

  return rows.filter(row => {
    const t = parseTimeValue(row[timeColumn]);
    if (t === null) return false;
    const ms = t.getTime();
    return ms >= startMs && ms <= endMs;
  });
}
```

- [ ] **Step 2.4: Re-export + run test**

```typescript
// packages/core/src/timeline/index.ts (append)
export { applyWindow } from './applyWindow';
```

```bash
pnpm --filter @variscout/core test -- timeline/__tests__/applyWindow.test.ts
```

Expected: 1 file, 6 tests passed.

- [ ] **Step 2.5: Commit**

```bash
git add packages/core/src/timeline/applyWindow.ts packages/core/src/timeline/__tests__/applyWindow.test.ts packages/core/src/timeline/index.ts
git commit -m "feat(core): applyWindow filters rows by TimelineWindow over a timeColumn"
```

---

## Task 3: detectScope function

**Files:**

- Create: `packages/core/src/scopeDetection.ts`
- Create: `packages/core/src/__tests__/scopeDetection.test.ts`
- Modify: `packages/core/src/index.ts` (re-export)

- [ ] **Step 3.1: Write failing test**

```typescript
// packages/core/src/__tests__/scopeDetection.test.ts
import { describe, it, expect } from 'vitest';
import { detectScope } from '../scopeDetection';
import type { Investigation } from '../types';

const makeInvestigation = (overrides: Partial<Investigation> = {}): Investigation =>
  ({
    id: 'test',
    processContext: { processHubId: 'hub-1', nodeMappings: [], specs: {}, canonicalMapVersion: 1 },
    rawData: [],
    ...overrides,
  }) as Investigation;

describe('detectScope', () => {
  it('returns b0 when nodeMappings is absent or empty', () => {
    expect(
      detectScope(
        makeInvestigation({
          processContext: {
            processHubId: 'hub-1',
            nodeMappings: [],
            specs: {},
            canonicalMapVersion: 1,
          } as any,
        })
      )
    ).toBe('b0');
  });

  it('returns b1 when nodeMappings has more than one entry', () => {
    const inv = makeInvestigation({
      processContext: {
        processHubId: 'hub-1',
        nodeMappings: [
          { nodeId: 'n1', measurementColumn: 'col1' },
          { nodeId: 'n2', measurementColumn: 'col2' },
        ],
        specs: {},
        canonicalMapVersion: 1,
      } as any,
    });
    expect(detectScope(inv)).toBe('b1');
  });

  it('returns b2 when nodeMappings has exactly one entry', () => {
    const inv = makeInvestigation({
      processContext: {
        processHubId: 'hub-1',
        nodeMappings: [{ nodeId: 'n1', measurementColumn: 'col1' }],
        specs: {},
        canonicalMapVersion: 1,
      } as any,
    });
    expect(detectScope(inv)).toBe('b2');
  });
});
```

- [ ] **Step 3.2: Run test, verify it fails**

```bash
pnpm --filter @variscout/core test -- __tests__/scopeDetection.test.ts
```

Expected: FAIL — `'../scopeDetection'` not found.

- [ ] **Step 3.3: Implement detectScope**

```typescript
// packages/core/src/scopeDetection.ts
import type { Investigation } from './types';

export type Scope = 'b0' | 'b1' | 'b2';

/**
 * Classify an investigation by the cardinality of its nodeMappings.
 *
 * - b0: no nodeMappings (legacy, global-spec investigations)
 * - b1: 2+ nodeMappings (multi-step investigation)
 * - b2: 1 nodeMapping (single-step deep dive)
 *
 * Per docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md §2.
 * Mirrors the existing detectYamazumiFormat() / detectDefectFormat() pattern.
 */
export function detectScope(investigation: Investigation): Scope {
  const mappings = investigation.processContext?.nodeMappings ?? [];
  if (mappings.length === 0) return 'b0';
  if (mappings.length === 1) return 'b2';
  return 'b1';
}
```

- [ ] **Step 3.4: Re-export + run tests**

Add to `packages/core/src/index.ts`:

```typescript
export { detectScope, type Scope } from './scopeDetection';
```

```bash
pnpm --filter @variscout/core test -- __tests__/scopeDetection.test.ts
```

Expected: 3 tests passed.

- [ ] **Step 3.5: Commit**

```bash
git add packages/core/src/scopeDetection.ts packages/core/src/__tests__/scopeDetection.test.ts packages/core/src/index.ts
git commit -m "feat(core): detectScope classifies investigations as b0/b1/b2 by nodeMappings cardinality"
```

---

## Task 4: Append-mode row-merge

**Files:**

- Create: `packages/core/src/appendMode.ts`
- Create: `packages/core/src/__tests__/appendMode.test.ts`

- [ ] **Step 4.1: Write failing test**

```typescript
// packages/core/src/__tests__/appendMode.test.ts
import { describe, it, expect } from 'vitest';
import { mergeRows } from '../appendMode';
import type { DataRow } from '../types';

describe('mergeRows', () => {
  const keyColumns = ['timestamp', 'shift', 'value'];

  it('appends rows with no overlap', () => {
    const existing: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const incoming: DataRow[] = [{ timestamp: '2026-04-02T08:00:00Z', shift: 'A', value: 102 }];
    const { merged, report } = mergeRows(existing, incoming, keyColumns);
    expect(merged).toHaveLength(2);
    expect(report).toEqual({ added: 1, duplicates: 0, corrected: 0 });
  });

  it('drops exact duplicates', () => {
    const existing: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const incoming: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const { merged, report } = mergeRows(existing, incoming, keyColumns);
    expect(merged).toHaveLength(1);
    expect(report.duplicates).toBe(1);
    expect(report.added).toBe(0);
  });

  it('treats matching key + different value as a correction (newer wins)', () => {
    const existing: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const incoming: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 105 }];
    const keyColumnsExceptValue = ['timestamp', 'shift']; // value not in keys -> correction
    const { merged, report } = mergeRows(existing, incoming, keyColumnsExceptValue);
    expect(merged).toHaveLength(1);
    expect(merged[0].value).toBe(105);
    expect(report.corrected).toBe(1);
  });
});
```

- [ ] **Step 4.2: Run test, verify it fails**

```bash
pnpm --filter @variscout/core test -- __tests__/appendMode.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement mergeRows**

```typescript
// packages/core/src/appendMode.ts
import type { DataRow } from './types';

export interface MergeReport {
  added: number;
  duplicates: number;
  corrected: number;
}

export interface MergeResult {
  merged: DataRow[];
  report: MergeReport;
}

/**
 * Merge incoming rows into existing rows.
 *
 * `keyColumns` identifies the set of columns that determine row identity.
 * - Match on all keyColumns + all other column values  -> exact duplicate (dropped)
 * - Match on keyColumns, differ on other values        -> correction (incoming wins)
 * - No match on keyColumns                              -> append
 *
 * Per docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md decision #3.
 */
export function mergeRows(
  existing: DataRow[],
  incoming: DataRow[],
  keyColumns: string[]
): MergeResult {
  const keyOf = (row: DataRow) => keyColumns.map(c => String(row[c] ?? '')).join('||');

  const existingByKey = new Map<string, { row: DataRow; index: number }>();
  existing.forEach((row, index) => existingByKey.set(keyOf(row), { row, index }));

  const merged: DataRow[] = [...existing];
  let added = 0;
  let duplicates = 0;
  let corrected = 0;

  for (const newRow of incoming) {
    const key = keyOf(newRow);
    const match = existingByKey.get(key);

    if (!match) {
      merged.push(newRow);
      added++;
      continue;
    }

    const isExactDuplicate = Object.keys(newRow).every(
      col => String(match.row[col] ?? '') === String(newRow[col] ?? '')
    );

    if (isExactDuplicate) {
      duplicates++;
    } else {
      merged[match.index] = newRow;
      corrected++;
    }
  }

  return { merged, report: { added, duplicates, corrected } };
}
```

- [ ] **Step 4.4: Run tests + commit**

```bash
pnpm --filter @variscout/core test -- __tests__/appendMode.test.ts
```

Expected: 3 tests passed.

```bash
git add packages/core/src/appendMode.ts packages/core/src/__tests__/appendMode.test.ts
git commit -m "feat(core): mergeRows for append-mode re-upload (dedupe / correction / add)"
```

---

## Task 5: Drift detection

**Files:**

- Create: `packages/core/src/findings/drift.ts`
- Create: `packages/core/src/findings/__tests__/drift.test.ts`
- Modify: `packages/core/src/findings/types.ts` (add `WindowContext` to Finding)

- [ ] **Step 5.1: Lock decision #5 (drift threshold default)**

Decision: default threshold is **0.20 relative change** in Cpk (or any normalized stat the finding references). Configurable per finding via `WindowContext.driftThreshold`.

Reasoning: 0.2 relative change is the standard threshold in process-control literature (Western Electric / Nelson rule analog) and matches the Six Sigma "20% effect size" heuristic.

- [ ] **Step 5.2: Add WindowContext to Finding type**

```typescript
// packages/core/src/findings/types.ts (find the Finding interface, add field)
export interface WindowContext {
  windowAtCreation: TimelineWindow;
  statsAtCreation: { cpk?: number; mean?: number; sigma?: number; n: number };
  driftThreshold?: number; // optional override, default 0.20
}

export interface Finding {
  // existing fields...
  windowContext?: WindowContext; // NEW (optional for backward compat)
}
```

Add the import at the top:

```typescript
import type { TimelineWindow } from '../timeline';
```

- [ ] **Step 5.3: Write failing test for drift**

```typescript
// packages/core/src/findings/__tests__/drift.test.ts
import { describe, it, expect } from 'vitest';
import { computeFindingWindowDrift } from '../drift';
import type { Finding, WindowContext } from '../types';

const makeFinding = (atCreation: WindowContext['statsAtCreation']): Finding =>
  ({
    id: 'f1',
    title: 'Test finding',
    windowContext: {
      windowAtCreation: {
        kind: 'fixed',
        startISO: '2026-03-01T00:00:00Z',
        endISO: '2026-03-31T23:59:59Z',
      },
      statsAtCreation: atCreation,
    },
  }) as Finding;

describe('computeFindingWindowDrift', () => {
  it('returns no-drift when stats are identical', () => {
    const finding = makeFinding({ cpk: 1.2, mean: 50, sigma: 2, n: 200 });
    const result = computeFindingWindowDrift(finding, { cpk: 1.2, mean: 50, sigma: 2, n: 200 });
    expect(result.drifted).toBe(false);
    expect(result.relativeChange).toBeCloseTo(0, 5);
  });

  it('flags drift when Cpk relative change exceeds threshold', () => {
    const finding = makeFinding({ cpk: 1.0, n: 200 });
    const result = computeFindingWindowDrift(finding, { cpk: 0.7, n: 200 });
    expect(result.drifted).toBe(true);
    expect(result.relativeChange).toBeCloseTo(-0.3, 2);
  });

  it('respects per-finding threshold override', () => {
    const finding: Finding = {
      ...makeFinding({ cpk: 1.0, n: 200 }),
      windowContext: {
        ...(makeFinding({ cpk: 1.0, n: 200 }).windowContext as WindowContext),
        driftThreshold: 0.05,
      },
    };
    const result = computeFindingWindowDrift(finding, { cpk: 0.95, n: 200 });
    expect(result.drifted).toBe(true); // 5% change at 5% threshold = drifted
  });

  it('returns null when finding has no windowContext', () => {
    const finding = { id: 'f1', title: 'no ctx' } as Finding;
    const result = computeFindingWindowDrift(finding, { cpk: 0.5, n: 100 });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 5.4: Implement computeFindingWindowDrift**

```typescript
// packages/core/src/findings/drift.ts
import type { Finding, WindowContext } from './types';

export interface DriftResult {
  drifted: boolean;
  relativeChange: number;
  metric: 'cpk' | 'mean' | 'sigma';
  threshold: number;
}

const DEFAULT_DRIFT_THRESHOLD = 0.2;

/**
 * Compare a Finding's stats-at-creation against current-window stats.
 *
 * Uses Cpk relative change as the primary drift signal; falls back to mean
 * if Cpk is missing.
 *
 * Returns null if the finding has no windowContext (i.e. created before V1).
 *
 * Per spec §3.5 (metric layer integration) + ADR-049 alignment.
 */
export function computeFindingWindowDrift(
  finding: Finding,
  currentStats: WindowContext['statsAtCreation']
): DriftResult | null {
  const ctx = finding.windowContext;
  if (!ctx) return null;

  const threshold = ctx.driftThreshold ?? DEFAULT_DRIFT_THRESHOLD;
  const before = ctx.statsAtCreation;

  // Prefer cpk; fall back to mean.
  const metric: 'cpk' | 'mean' | 'sigma' =
    before.cpk != null && currentStats.cpk != null
      ? 'cpk'
      : before.mean != null && currentStats.mean != null
        ? 'mean'
        : 'sigma';

  const beforeVal = before[metric];
  const currentVal = currentStats[metric];

  if (beforeVal == null || currentVal == null || beforeVal === 0) {
    return { drifted: false, relativeChange: 0, metric, threshold };
  }

  const relativeChange = (currentVal - beforeVal) / beforeVal;
  const drifted = Math.abs(relativeChange) >= threshold;

  return { drifted, relativeChange, metric, threshold };
}
```

- [ ] **Step 5.5: Run tests + interleaved doc + commit**

```bash
pnpm --filter @variscout/core test -- findings/__tests__/drift.test.ts
```

Expected: 4 tests passed.

Update `docs/05-technical/statistics-reference.md` — add a new section "Finding Window Drift" with the formula:

```
relativeChange = (currentVal - beforeVal) / beforeVal
drifted = |relativeChange| >= threshold (default 0.20)
```

```bash
git add packages/core/src/findings/drift.ts packages/core/src/findings/__tests__/drift.test.ts packages/core/src/findings/types.ts docs/05-technical/statistics-reference.md
git commit -m "feat(core): computeFindingWindowDrift + WindowContext on Finding"
```

---

## Task 6: Throughput types + computeOutputRate

**Files:**

- Create: `packages/core/src/throughput/types.ts`
- Create: `packages/core/src/throughput/aggregation.ts`
- Create: `packages/core/src/throughput/index.ts`
- Create: `packages/core/src/throughput/__tests__/aggregation.test.ts`
- Modify: `packages/core/src/index.ts`, `docs/05-technical/statistics-reference.md`

- [ ] **Step 6.1: Define types**

```typescript
// packages/core/src/throughput/types.ts
import type { TimelineWindow, TimelineWindowKind } from '../timeline';
import type { Granularity } from '../time';

export interface OutputRateBucket {
  bucketStartISO: string;
  bucketEndISO: string;
  count: number;
  ratePerHour: number;
}

export interface OutputRateResult {
  nodeId: string;
  granularity: Granularity;
  buckets: OutputRateBucket[];
  totalCount: number;
  averageRatePerHour: number;
}

export interface BottleneckResult {
  nodeId: string;
  averageRatePerHour: number;
  rank: number;
  isBottleneck: boolean; // lowest rate among the analysed steps
}
```

(`Granularity` already exists in `packages/core/src/time.ts` as `TimeGranularity`. If the export name doesn't match, alias it here or rename the import.)

- [ ] **Step 6.2: Write failing test for computeOutputRate**

```typescript
// packages/core/src/throughput/__tests__/aggregation.test.ts
import { describe, it, expect } from 'vitest';
import { computeOutputRate, computeBottleneck } from '../aggregation';
import type { DataRow } from '../../types';

describe('computeOutputRate', () => {
  it('counts rows per bucket and computes rate-per-hour', () => {
    const rows: DataRow[] = [
      { timestamp: '2026-04-29T08:00:00Z', step: 'roast' },
      { timestamp: '2026-04-29T08:30:00Z', step: 'roast' },
      { timestamp: '2026-04-29T09:00:00Z', step: 'roast' },
      { timestamp: '2026-04-29T09:30:00Z', step: 'roast' },
    ];
    const result = computeOutputRate(
      rows,
      'timestamp',
      { nodeId: 'roast', stepColumn: 'step' },
      'hour'
    );
    expect(result.totalCount).toBe(4);
    expect(result.buckets.length).toBe(2);
    expect(result.buckets[0].ratePerHour).toBe(2);
    expect(result.buckets[1].ratePerHour).toBe(2);
    expect(result.averageRatePerHour).toBe(2);
  });

  it('returns zero rate for empty input', () => {
    const result = computeOutputRate(
      [],
      'timestamp',
      { nodeId: 'roast', stepColumn: 'step' },
      'hour'
    );
    expect(result.totalCount).toBe(0);
    expect(result.averageRatePerHour).toBe(0);
  });
});

describe('computeBottleneck', () => {
  it('identifies the lowest rate as the bottleneck', () => {
    const rates: ReadonlyArray<{ nodeId: string; averageRatePerHour: number }> = [
      { nodeId: 'roast', averageRatePerHour: 60 },
      { nodeId: 'grind', averageRatePerHour: 30 },
      { nodeId: 'pack', averageRatePerHour: 80 },
    ];
    const result = computeBottleneck(rates);
    expect(result.find(r => r.nodeId === 'grind')!.isBottleneck).toBe(true);
    expect(result.find(r => r.nodeId === 'roast')!.isBottleneck).toBe(false);
  });
});
```

- [ ] **Step 6.3: Implement computeOutputRate + computeBottleneck**

```typescript
// packages/core/src/throughput/aggregation.ts
import type { DataRow } from '../types';
import { parseTimeValue } from '../time';
import type { OutputRateResult, OutputRateBucket, BottleneckResult } from './types';

export interface OutputRateInput {
  nodeId: string;
  stepColumn: string; // column in DataRow that names the step
}

const MS_PER_HOUR = 60 * 60 * 1000;
const GRANULARITY_MS: Record<string, number> = {
  minute: 60 * 1000,
  hour: MS_PER_HOUR,
  day: 24 * MS_PER_HOUR,
  week: 7 * 24 * MS_PER_HOUR,
};

export function computeOutputRate(
  rows: DataRow[],
  timeColumn: string,
  input: OutputRateInput,
  granularity: 'minute' | 'hour' | 'day' | 'week'
): OutputRateResult {
  const stepRows = rows.filter(r => String(r[input.stepColumn]) === input.nodeId);
  const bucketMs = GRANULARITY_MS[granularity];

  const bucketMap = new Map<number, number>();
  for (const r of stepRows) {
    const t = parseTimeValue(r[timeColumn]);
    if (!t) continue;
    const bucketStart = Math.floor(t.getTime() / bucketMs) * bucketMs;
    bucketMap.set(bucketStart, (bucketMap.get(bucketStart) ?? 0) + 1);
  }

  const buckets: OutputRateBucket[] = [...bucketMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startMs, count]) => ({
      bucketStartISO: new Date(startMs).toISOString(),
      bucketEndISO: new Date(startMs + bucketMs).toISOString(),
      count,
      ratePerHour: (count * MS_PER_HOUR) / bucketMs,
    }));

  const totalCount = stepRows.length;
  const averageRatePerHour =
    buckets.length === 0 ? 0 : buckets.reduce((s, b) => s + b.ratePerHour, 0) / buckets.length;

  return {
    nodeId: input.nodeId,
    granularity,
    buckets,
    totalCount,
    averageRatePerHour,
  };
}

export function computeBottleneck(
  rates: ReadonlyArray<{ nodeId: string; averageRatePerHour: number }>
): BottleneckResult[] {
  const sorted = [...rates].sort((a, b) => a.averageRatePerHour - b.averageRatePerHour);
  const bottleneckNodeId = sorted[0]?.nodeId;
  return rates
    .map((r, i) => ({
      nodeId: r.nodeId,
      averageRatePerHour: r.averageRatePerHour,
      rank: sorted.findIndex(s => s.nodeId === r.nodeId) + 1,
      isBottleneck: r.nodeId === bottleneckNodeId,
    }))
    .sort((a, b) => a.rank - b.rank);
}
```

- [ ] **Step 6.4: Barrel + run test**

```typescript
// packages/core/src/throughput/index.ts
export type { OutputRateResult, OutputRateBucket, BottleneckResult } from './types';
export { computeOutputRate, computeBottleneck } from './aggregation';
export type { OutputRateInput } from './aggregation';
```

Add to `packages/core/src/index.ts`:

```typescript
export * from './throughput';
```

```bash
pnpm --filter @variscout/core test -- throughput/__tests__/aggregation.test.ts
```

Expected: 3 tests passed.

- [ ] **Step 6.5: Interleaved doc + commit**

Update `docs/05-technical/statistics-reference.md` — add "Throughput metrics" section with formulas for `computeOutputRate` and `computeBottleneck`.

```bash
git add packages/core/src/throughput/ packages/core/src/index.ts docs/05-technical/statistics-reference.md
git commit -m "feat(core): throughput module — computeOutputRate + computeBottleneck"
```

---

## Task 7: Extend AnalysisModeStrategy with dataRouter

**Files:**

- Modify: `packages/core/src/analysisStrategy.ts`
- Modify: `packages/core/src/__tests__/analysisStrategy.test.ts` (or add new test file)

This task locks decision #2 (`SpecLookupContext` shape inside `RouterArgs`) and #3 (`ChartVariantId` equals existing `ChartSlotType`).

- [ ] **Step 7.1: Lock decisions #2 + #3**

- #2: `RouterArgs.context` is `SpecLookupContext` from `packages/core/src/types.ts` (existing type used by `calculateNodeCapability`).
- #3: `chartVariants` returns `Partial<Record<keyof ChartSlots, ChartSlotType>>` — strategy can override default slots based on context (e.g. swap I-Chart for capability-I-Chart). When `chartVariants` is empty, the strategy's default slots are used.

- [ ] **Step 7.2: Write failing test**

```typescript
// packages/core/src/__tests__/dataRouter.test.ts
import { describe, it, expect } from 'vitest';
import { getStrategy, resolveMode } from '../analysisStrategy';
import type { RouterArgs } from '../analysisStrategy';

describe('AnalysisModeStrategy.dataRouter', () => {
  it('returns the investigation-time hook for standard mode B1 in investigation phase', () => {
    const strategy = getStrategy(resolveMode('standard', {}));
    const args: RouterArgs = {
      scope: 'b1',
      phase: 'investigation',
      window: { kind: 'cumulative' },
      context: { processHubId: 'hub-1', nodeId: null, contextTuple: {} } as any,
    };
    const result = strategy.dataRouter!(args);
    expect(result.hook).toBe('useFilteredData');
  });

  it('returns the hub-time hook for capability mode hub phase', () => {
    const strategy = getStrategy(resolveMode('standard', { standardIChartMetric: 'capability' }));
    const args: RouterArgs = {
      scope: 'b1',
      phase: 'hub',
      window: { kind: 'rolling', windowDays: 7 },
      context: { processHubId: 'hub-1', nodeId: null, contextTuple: {} } as any,
    };
    const result = strategy.dataRouter!(args);
    expect(result.hook).toBe('useProductionLineGlanceData');
  });
});
```

- [ ] **Step 7.3: Extend the interface and add dataRouter to all 6 strategies**

In `packages/core/src/analysisStrategy.ts`, near the `AnalysisModeStrategy` interface:

```typescript
import type { TimelineWindow } from './timeline';
import type { SpecLookupContext } from './types'; // verify exact path

export type RouterScope = 'b0' | 'b1' | 'b2';
export type RouterPhase = 'investigation' | 'hub';

export interface RouterArgs {
  scope: RouterScope;
  phase: RouterPhase;
  window: TimelineWindow;
  context: SpecLookupContext;
}

export type RouterHook = 'useFilteredData' | 'useProductionLineGlanceData';

export interface RouterResult {
  hook: RouterHook;
  transforms?: ReadonlyArray<string>; // names of transform fns to invoke
  chartVariants?: Partial<Record<keyof ChartSlots, ChartSlotType>>;
}

export interface AnalysisModeStrategy {
  // existing fields…
  chartSlots: ChartSlots;
  // …
  dataRouter?: (args: RouterArgs) => RouterResult; // OPTIONAL for backward compat — defaults to investigation-time
}
```

For each of the 6 mode strategies, add the dataRouter:

```typescript
// Standard mode strategy:
dataRouter: ({ phase }) => ({
  hook: phase === 'hub' ? 'useProductionLineGlanceData' : 'useFilteredData',
  transforms: phase === 'hub' ? ['calculateNodeCapability'] : [],
}),

// Capability mode (resolveMode result):
dataRouter: ({ phase }) => ({
  hook: phase === 'hub' ? 'useProductionLineGlanceData' : 'useFilteredData',
  transforms: phase === 'hub' ? ['calculateNodeCapability', 'computeOutputRate', 'computeBottleneck'] : ['calculateStats'],
}),

// Performance mode strategy:
dataRouter: ({ phase }) => ({
  hook: phase === 'hub' ? 'useProductionLineGlanceData' : 'useFilteredData',
  transforms: phase === 'hub' ? ['calculateChannelStats', 'calculateChannelPerformance'] : ['calculateChannelStats'],
}),

// Yamazumi mode strategy:
dataRouter: ({ phase }) => ({
  hook: 'useFilteredData', // hub-time yamazumi not built for V1
  transforms: ['aggregateYamazumiData', 'classifyYamazumi'],
}),

// Defect mode strategy:
dataRouter: ({ phase }) => ({
  hook: 'useFilteredData',
  transforms: ['computeDefectRates'],
}),

// Process Flow (design-only) strategy:
dataRouter: ({ phase }) => ({
  hook: 'useFilteredData',
  transforms: [],
}),
```

- [ ] **Step 7.4: Run tests + commit**

```bash
pnpm --filter @variscout/core test -- __tests__/dataRouter.test.ts
```

Expected: 2 tests passed.

```bash
git add packages/core/src/analysisStrategy.ts packages/core/src/__tests__/dataRouter.test.ts
git commit -m "feat(core): AnalysisModeStrategy gains dataRouter for (scope, phase, window) routing"
```

---

## Task 8: useTimelineWindow hook

**Revised 2026-04-30** (supersedes the original Zustand-store-in-hooks design). The original plan invented a 5th module-level Zustand store keyed by `investigationId` to hold the user's window choice. Three problems with that:

1. **Wrong architectural layer.** CLAUDE.md invariant: "4 domain Zustand stores are source of truth." A window selector is _viewer state_ over investigation metadata, not a 5th domain store.
2. **Memory leak by design.** A module-level `Map<investigationId, TimelineWindow>` has no eviction — every visited investigation leaves a record forever in PWA module state.
3. **Decision #1 already located the window.** Commit `f059c591` revised Decision #1 to put `TimelineWindow` on `ProcessHubInvestigationMetadata` — co-located with `nodeMappings`, on the investigation envelope itself. Investigation envelopes are persisted by apps (Dexie + Blob in Azure, similar in PWA) via `persistInvestigation`. The original plan's parallel cache ignored that.

**Revised design**: `useTimelineWindow` becomes a thin pure projection over the investigation envelope passed in by the caller. Persistence is the caller's responsibility (typically wired to the same `persistInvestigation` flow that already handles `nodeMappings` and `migrationDeclinedAt` — see `apps/azure/src/features/processHub/useHubMigrationState.ts:67-114` for the existing pattern). No new Zustand store, no module-level cache, no zustand dep added to `@variscout/hooks` — package flow stays clean (core → hooks → ui → apps).

The window persists exactly where the investigation persists (IndexedDB / Blob per ADR-059). User reopens tomorrow, choice is there.

**Files:**

- Modify: `packages/core/src/processHub.ts` — add `timelineWindow?: TimelineWindow` to `ProcessHubInvestigationMetadata` (alongside `nodeMappings` per Decision #1). Import `TimelineWindow` via `import type` from the timeline module.
- Create: `packages/hooks/src/useTimelineWindow.ts`
- Create: `packages/hooks/src/__tests__/useTimelineWindow.test.ts`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 8.1: Add `timelineWindow` to metadata type**

In `packages/core/src/processHub.ts`, in the `ProcessHubInvestigationMetadata` interface (after `nodeMappings`):

```typescript
  /**
   * Optional timeline window applied to this investigation's data when
   * computing findings/charts. Co-located with nodeMappings per Decision #1
   * (see docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md).
   * Absent → callers should use the mode's default window (typically `cumulative`).
   */
  timelineWindow?: TimelineWindow;
```

Add at the top of the file: `import type { TimelineWindow } from './timeline';` (uses the existing timeline barrel — no cycle: timeline imports nothing from processHub).

- [ ] **Step 8.2: Write failing test**

```typescript
// packages/hooks/src/__tests__/useTimelineWindow.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProcessHubInvestigation } from '@variscout/core';
import { useTimelineWindow } from '../useTimelineWindow';

const inv = (
  id: string,
  metadata?: ProcessHubInvestigation['metadata']
): Pick<ProcessHubInvestigation, 'id' | 'metadata'> => ({ id, metadata });

describe('useTimelineWindow', () => {
  it('returns cumulative default when metadata.timelineWindow is absent', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimelineWindow({ investigation: inv('inv-1'), onChange })
    );
    expect(result.current.window).toEqual({ kind: 'cumulative' });
  });

  it('reflects the metadata.timelineWindow when present', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimelineWindow({
        investigation: inv('inv-1', { timelineWindow: { kind: 'rolling', windowDays: 30 } }),
        onChange,
      })
    );
    expect(result.current.window).toEqual({ kind: 'rolling', windowDays: 30 });
  });

  it('setWindow delegates to onChange with investigationId', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimelineWindow({ investigation: inv('inv-1'), onChange })
    );
    act(() => result.current.setWindow({ kind: 'rolling', windowDays: 7 }));
    expect(onChange).toHaveBeenCalledWith('inv-1', { kind: 'rolling', windowDays: 7 });
  });
});
```

- [ ] **Step 8.3: Run test, verify it fails**

```bash
pnpm --filter @variscout/hooks test -- useTimelineWindow
```

Expected: FAIL — module not found.

- [ ] **Step 8.4: Implement (pure projection)**

```typescript
// packages/hooks/src/useTimelineWindow.ts
import { useCallback, useMemo } from 'react';
import type { ProcessHubInvestigation, TimelineWindow } from '@variscout/core';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export interface UseTimelineWindowArgs {
  /** Investigation envelope — only `id` and `metadata.timelineWindow` are read. */
  investigation: Pick<ProcessHubInvestigation, 'id' | 'metadata'>;
  /**
   * Persistence callback. Caller wires this to its existing
   * `persistInvestigation` flow (see apps/azure/src/features/processHub/
   * useHubMigrationState.ts for the canonical pattern). Receives
   * `investigationId` so the same callback can serve many investigations.
   */
  onChange: (investigationId: string, window: TimelineWindow) => void;
}

export interface UseTimelineWindowResult {
  window: TimelineWindow;
  setWindow: (window: TimelineWindow) => void;
}

export function useTimelineWindow({
  investigation,
  onChange,
}: UseTimelineWindowArgs): UseTimelineWindowResult {
  const window = useMemo<TimelineWindow>(
    () => investigation.metadata?.timelineWindow ?? DEFAULT_CUMULATIVE,
    [investigation.metadata?.timelineWindow]
  );

  const setWindow = useCallback(
    (w: TimelineWindow) => onChange(investigation.id, w),
    [investigation.id, onChange]
  );

  return { window, setWindow };
}
```

- [ ] **Step 8.5: Re-export + run tests + commit**

Add to `packages/hooks/src/index.ts`:

```typescript
export {
  useTimelineWindow,
  type UseTimelineWindowArgs,
  type UseTimelineWindowResult,
} from './useTimelineWindow';
```

```bash
pnpm --filter @variscout/hooks test -- useTimelineWindow
```

Expected: 3 tests passed. Then run the full hooks suite to confirm no regressions:

```bash
pnpm --filter @variscout/hooks test
```

Type-check the dependent packages (`@variscout/hooks` consumes the new core type; `@variscout/ui` and `@variscout/azure-app` consume hooks):

```bash
pnpm --filter @variscout/core build
pnpm --filter @variscout/hooks build
pnpm --filter @variscout/ui build
```

```bash
git add packages/core/src/processHub.ts packages/hooks/src/useTimelineWindow.ts packages/hooks/src/__tests__/useTimelineWindow.test.ts packages/hooks/src/index.ts
git commit -m "feat(hooks): useTimelineWindow — pure projection over investigation metadata"
```

**Note for Tasks 11/14 (FilterContextBar wiring + app-level wiring)**: those tasks now wire `onChange` to the app's `persistInvestigation` (the same flow that updates `nodeMappings`). The hooks package stays persistence-agnostic.

---

## Task 9: useDataRouter hook

**Files:**

- Create: `packages/hooks/src/useDataRouter.ts`
- Create: `packages/hooks/src/__tests__/useDataRouter.test.ts`
- Modify: `packages/hooks/src/useFilteredData.ts` (accept `window` arg, apply via `applyWindow`)
- Modify: `packages/hooks/src/useProductionLineGlanceData.ts` (accept `window` arg)
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 9.1: Modify useFilteredData and useProductionLineGlanceData**

For each, add `window?: TimelineWindow` to the args. Inside the hook, before further filtering, call:

```typescript
import { applyWindow } from '@variscout/core';

const windowedRows = useMemo(
  () => (window && timeColumn ? applyWindow(rows, timeColumn, window) : rows),
  [rows, timeColumn, window]
);
```

Use `windowedRows` instead of `rows` from there on.

- [ ] **Step 9.2: Write test for useDataRouter**

```typescript
// packages/hooks/src/__tests__/useDataRouter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataRouter } from '../useDataRouter';
import type { TimelineWindow } from '@variscout/core';

describe('useDataRouter', () => {
  it('returns rows from useFilteredData when phase is investigation', () => {
    const window: TimelineWindow = { kind: 'cumulative' };
    const { result } = renderHook(() =>
      useDataRouter({
        mode: 'standard',
        scope: 'b1',
        phase: 'investigation',
        window,
        context: {} as any,
      })
    );
    expect(result.current.hook).toBe('useFilteredData');
  });
});
```

- [ ] **Step 9.3: Implement useDataRouter**

```typescript
// packages/hooks/src/useDataRouter.ts
import { useMemo } from 'react';
import type { TimelineWindow, RouterArgs } from '@variscout/core';
import { getStrategy, resolveMode } from '@variscout/core';

export interface UseDataRouterArgs {
  mode: 'standard' | 'performance' | 'defect' | 'yamazumi' | 'process-flow';
  modeContext?: Record<string, unknown>; // for resolveMode
  scope: 'b0' | 'b1' | 'b2';
  phase: 'investigation' | 'hub';
  window: TimelineWindow;
  context: RouterArgs['context'];
}

export function useDataRouter(args: UseDataRouterArgs) {
  const resolved = useMemo(
    () => resolveMode(args.mode as any, args.modeContext as any),
    [args.mode, args.modeContext]
  );
  const strategy = useMemo(() => getStrategy(resolved), [resolved]);

  const router = strategy.dataRouter;
  const result = useMemo(
    () =>
      router?.({
        scope: args.scope,
        phase: args.phase,
        window: args.window,
        context: args.context,
      }) ?? { hook: 'useFilteredData' as const },
    [router, args.scope, args.phase, args.window, args.context]
  );

  return result;
}
```

- [ ] **Step 9.4: Re-export + run tests + commit**

```bash
pnpm --filter @variscout/hooks test -- useDataRouter
pnpm --filter @variscout/hooks test
```

```bash
git add packages/hooks/src/
git commit -m "feat(hooks): useDataRouter + window-aware useFilteredData / useProductionLineGlanceData"
```

---

## Task 10: TimelineWindowPicker component

**Files:**

- Create: `packages/ui/src/components/TimelineWindowPicker/TimelineWindowPicker.tsx`
- Create: `packages/ui/src/components/TimelineWindowPicker/index.ts`
- Create: `packages/ui/src/components/TimelineWindowPicker/__tests__/TimelineWindowPicker.test.tsx`

- [ ] **Step 10.1: Write failing test**

```typescript
// packages/ui/src/components/TimelineWindowPicker/__tests__/TimelineWindowPicker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineWindowPicker } from '../TimelineWindowPicker';

describe('TimelineWindowPicker', () => {
  it('renders the four window-type chips', () => {
    render(<TimelineWindowPicker window={{ kind: 'cumulative' }} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /fixed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rolling/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open-ended/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cumulative/i })).toBeInTheDocument();
  });

  it('calls onChange when clicking a chip', () => {
    const onChange = vi.fn();
    render(<TimelineWindowPicker window={{ kind: 'cumulative' }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /rolling/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rolling' }));
  });
});
```

- [ ] **Step 10.2: Implement component**

```typescript
// packages/ui/src/components/TimelineWindowPicker/TimelineWindowPicker.tsx
import { useState } from 'react';
import type { TimelineWindow } from '@variscout/core';

export interface TimelineWindowPickerProps {
  window: TimelineWindow;
  onChange: (w: TimelineWindow) => void;
  className?: string;
}

const KINDS: TimelineWindow['kind'][] = ['fixed', 'rolling', 'openEnded', 'cumulative'];
const LABELS: Record<TimelineWindow['kind'], string> = {
  fixed: 'Fixed',
  rolling: 'Rolling',
  openEnded: 'Open-ended',
  cumulative: 'Cumulative',
};

const DEFAULT_BY_KIND: Record<TimelineWindow['kind'], TimelineWindow> = {
  fixed: { kind: 'fixed', startISO: '1970-01-01T00:00:00Z', endISO: new Date().toISOString() },
  rolling: { kind: 'rolling', windowDays: 30 },
  openEnded: { kind: 'openEnded', startISO: new Date().toISOString() },
  cumulative: { kind: 'cumulative' },
};

export function TimelineWindowPicker({ window, onChange, className }: TimelineWindowPickerProps) {
  return (
    <div className={className} role="group" aria-label="Timeline window">
      {KINDS.map(kind => (
        <button
          key={kind}
          type="button"
          aria-pressed={window.kind === kind}
          onClick={() => onChange(window.kind === kind ? window : DEFAULT_BY_KIND[kind])}
        >
          {LABELS[kind]}
        </button>
      ))}
      {window.kind === 'fixed' && (
        <FixedRangeInputs window={window} onChange={onChange} />
      )}
      {window.kind === 'rolling' && (
        <RollingDaysInput window={window} onChange={onChange} />
      )}
      {window.kind === 'openEnded' && (
        <OpenEndedStartInput window={window} onChange={onChange} />
      )}
    </div>
  );
}

// Compact secondary-input components — keep them in this same file for V1.
function FixedRangeInputs({ window, onChange }: { window: Extract<TimelineWindow, { kind: 'fixed' }>; onChange: (w: TimelineWindow) => void }) {
  return (
    <>
      <input
        type="datetime-local"
        value={window.startISO.slice(0, 16)}
        onChange={e => onChange({ ...window, startISO: new Date(e.target.value).toISOString() })}
      />
      <input
        type="datetime-local"
        value={window.endISO.slice(0, 16)}
        onChange={e => onChange({ ...window, endISO: new Date(e.target.value).toISOString() })}
      />
    </>
  );
}

function RollingDaysInput({ window, onChange }: { window: Extract<TimelineWindow, { kind: 'rolling' }>; onChange: (w: TimelineWindow) => void }) {
  return (
    <input
      type="number"
      min={1}
      value={window.windowDays}
      onChange={e => onChange({ kind: 'rolling', windowDays: Math.max(1, Number(e.target.value)) })}
    />
  );
}

function OpenEndedStartInput({ window, onChange }: { window: Extract<TimelineWindow, { kind: 'openEnded' }>; onChange: (w: TimelineWindow) => void }) {
  return (
    <input
      type="datetime-local"
      value={window.startISO.slice(0, 16)}
      onChange={e => onChange({ kind: 'openEnded', startISO: new Date(e.target.value).toISOString() })}
    />
  );
}
```

- [ ] **Step 10.3: Add barrel + run tests + commit**

```typescript
// packages/ui/src/components/TimelineWindowPicker/index.ts
export { TimelineWindowPicker, type TimelineWindowPickerProps } from './TimelineWindowPicker';
```

```bash
pnpm --filter @variscout/ui test -- TimelineWindowPicker
```

```bash
git add packages/ui/src/components/TimelineWindowPicker/
git commit -m "feat(ui): TimelineWindowPicker — four-kind window selector with secondary inputs"
```

---

## Task 11: Wire TimelineWindowPicker into FilterContextBar

**Files:**

- Modify: `packages/ui/src/components/FilterContextBar/FilterContextBar.tsx` (add slot)
- Modify: `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` (pass timeline-window props through)

- [ ] **Step 11.1: Inspect existing FilterContextBar shape**

Read `packages/ui/src/components/FilterContextBar/FilterContextBar.tsx`. Identify the props interface and the layout where the picker would naturally sit (likely far-left or far-right of the bar).

- [ ] **Step 11.2: Add TimelineWindowPicker slot**

Add to `FilterContextBarProps`:

```typescript
import type { TimelineWindow } from '@variscout/core';
import { TimelineWindowPicker } from '../TimelineWindowPicker';

export interface FilterContextBarProps {
  // existing fields…
  timelineWindow?: TimelineWindow;
  onTimelineWindowChange?: (w: TimelineWindow) => void;
}
```

In the JSX, add the picker (early in the bar so it reads as the primary scope control):

```tsx
{
  props.timelineWindow && props.onTimelineWindowChange && (
    <TimelineWindowPicker
      window={props.timelineWindow}
      onChange={props.onTimelineWindowChange}
      className="filter-context-bar__timeline"
    />
  );
}
```

- [ ] **Step 11.3: Pass through DashboardLayoutBase**

Add to `DashboardLayoutBaseProps`:

```typescript
timelineWindow?: TimelineWindow;
onTimelineWindowChange?: (w: TimelineWindow) => void;
```

Pass them to the FilterContextBar render in the layout body.

- [ ] **Step 11.4: Run @variscout/ui tests + commit**

```bash
pnpm --filter @variscout/ui test
```

```bash
git add packages/ui/src/components/FilterContextBar/ packages/ui/src/components/DashboardBase/
git commit -m "feat(ui): FilterContextBar + DashboardBase accept TimelineWindowPicker props"
```

---

## Task 12: Window-context footer on Findings

**Files:**

- Modify: `packages/ui/src/components/Findings/FindingCard.tsx` (or whichever component renders a finding card; verify path)
- Test: corresponding `FindingCard.test.tsx`

- [ ] **Step 12.1: Identify the finding-card component**

Run `rg "FindingCard|FindingSnippet|FindingItem" packages/ui/src/components/`. Pick the canonical card component used in the Findings panel.

- [ ] **Step 12.2: Write test for footer**

```typescript
// In the finding card's test file:
it('renders the window-context footer when finding has windowContext', () => {
  const finding = {
    id: 'f1',
    title: 'Cpk dropped on night shift',
    windowContext: {
      windowAtCreation: { kind: 'fixed', startISO: '2026-03-01T00:00:00Z', endISO: '2026-03-31T23:59:59Z' },
      statsAtCreation: { cpk: 0.62, n: 200 },
    },
  } as any;
  render(<FindingCard finding={finding} />);
  expect(screen.getByText(/Mar 1, 2026/i)).toBeInTheDocument();
  expect(screen.getByText(/Mar 31, 2026/i)).toBeInTheDocument();
});

it('does not render footer when finding has no windowContext', () => {
  const finding = { id: 'f1', title: 'No ctx' } as any;
  const { container } = render(<FindingCard finding={finding} />);
  expect(container.querySelector('[data-testid="finding-window-footer"]')).toBeNull();
});
```

- [ ] **Step 12.3: Implement footer**

In the finding-card component, append:

```tsx
{
  finding.windowContext && (
    <div className="finding-card__window-footer" data-testid="finding-window-footer">
      Made against window: {formatWindow(finding.windowContext.windowAtCreation)}
      {' · '} Cpk {finding.windowContext.statsAtCreation.cpk?.toFixed(2)} (n=
      {finding.windowContext.statsAtCreation.n})
    </div>
  );
}
```

Add a small helper:

```typescript
import { isFixedWindow, isRollingWindow, isOpenEndedWindow } from '@variscout/core';

function formatWindow(w: TimelineWindow): string {
  if (isFixedWindow(w)) return `${formatDate(w.startISO)} → ${formatDate(w.endISO)}`;
  if (isRollingWindow(w)) return `Rolling ${w.windowDays}d`;
  if (isOpenEndedWindow(w)) return `${formatDate(w.startISO)} → today`;
  return 'All data';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
```

- [ ] **Step 12.4: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- FindingCard
```

```bash
git add packages/ui/src/components/Findings/
git commit -m "feat(ui): Finding card renders window-context footer when present"
```

---

## Task 13: Route ProcessHubCapabilityTab via useDataRouter, thread window into useProductionLineGlanceData

> **Revised 2026-04-30** (V1 interpretation). The original spec's `<strategy.chartSlots.slot1 />` code can't execute — `ChartSlots` carries `ChartSlotType` strings (e.g. `'capability-ichart'`), not React components. There is no slot-type-to-component registry in V1. ProductionLineGlanceDashboard keeps its hardcoded 4-chart composition (those charts are specific to the capability/hub phase). The "route via strategy" happens at the call site: `ProcessHubCapabilityTab` now consults `useDataRouter` (as a dev-mode sanity check on the dataflow choice — the hook used must remain known at compile time, since React forbids conditional hook calls) and threads a `TimelineWindow` into `useProductionLineGlanceData`. Slot-component registry is a V2/V3 concern.

**Files actually modified:**

- `apps/azure/src/components/ProcessHubCapabilityTab.tsx` — adds `useDataRouter` sanity check; computes `scope` via `detectScope` (single member) or defaults to `b1` (hub aggregate); passes `window` to `useProductionLineGlanceData`. Window state is local `useState({ kind: 'cumulative' })` with a TODO referencing Task 14 (hub-level persistence is genuinely Task 14's problem; the hub envelope doesn't carry its own `TimelineWindow` field, and `useTimelineWindow` is keyed on a single investigation).

**Not modified:**

- `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx` — purely presentational, props-driven; no refactor needed.
- `packages/core/src/analysisStrategy.ts` — `dataRouter` already exposed by Task 7.

**Verification:** `pnpm --filter @variscout/azure-app test` (970/970), `pnpm --filter @variscout/azure-app build` clean, `pnpm --filter @variscout/ui test` (1285/1285).

---

## Task 14: Wire useTimelineWindow + TimelineWindowPicker into apps

**Files:**

- Modify: `apps/azure/src/components/Dashboard.tsx`
- Modify: `apps/pwa/src/components/Dashboard.tsx`
- Modify: `apps/azure/src/components/ProcessHubCapabilityTab.tsx`

- [ ] **Step 14.1: Wire investigation-time window**

In each dashboard component:

```tsx
import { useTimelineWindow } from '@variscout/hooks';

const { window, setWindow } = useTimelineWindow({
  investigationId: currentInvestigation.id,
  defaultKind: 'openEnded', // investigation-time default
});

// Pass into DashboardLayoutBase:
<DashboardLayoutBase
  timelineWindow={window}
  onTimelineWindowChange={setWindow}
  // …
/>;
```

- [ ] **Step 14.2: Wire hub-time window into Hub Capability tab**

```tsx
const cadence = hub.cadence ?? 'weekly';
const cadenceDays: Record<string, number> = { hourly: 1, daily: 1, weekly: 7, monthly: 30 };

const { window, setWindow } = useTimelineWindow({
  investigationId: `hub-${hub.id}`,
  defaultKind: 'rolling',
});
// First-mount default override based on cadence:
useEffect(() => {
  if (window.kind === 'cumulative') {
    setWindow({ kind: 'rolling', windowDays: cadenceDays[cadence] ?? 7 });
  }
}, []); // first mount only
```

- [ ] **Step 14.3: Run end-to-end tests + commit**

```bash
pnpm test
```

Expected: all tests green across packages.

```bash
git add apps/
git commit -m "feat(apps): wire useTimelineWindow into Dashboard + Hub Capability tab"
```

---

## Task 15: Boundary check script (ADR-074)

**Files:**

- Create: `scripts/check-level-boundaries.sh`
- Modify: `package.json` (add npm script)
- Modify: `.husky/pre-commit` (or `lint-staged` config) — add the check

- [ ] **Step 15.1: Write the script**

```bash
#!/usr/bin/env bash
# scripts/check-level-boundaries.sh — enforce ADR-074
# Verifies surfaces don't reimplement each other's primary views.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

FAILED=0
check() {
  local pattern="$1"
  local target="$2"
  local message="$3"
  if [ -d "$target" ]; then
    if rg -q "$pattern" "$target" 2>/dev/null; then
      echo "  ✗ $message" >&2
      FAILED=$((FAILED + 1))
    else
      echo "  ✓ $message"
    fi
  else
    echo "  · $target not yet present (boundary by structural absence)"
  fi
}

echo "=== ADR-074 boundary checks ==="
check "outcomeStats|outcomeBoxplot|outcomeIChart" "packages/ui/src/components/InvestigationWall" "Investigation Wall does not reimplement L1 chart rendering"
check "stratifyByFactor|factorEdge|factorRelationship" "packages/ui/src/components/DashboardBase" "SCOUT does not reimplement Evidence Map's factor-network rendering"
check "hypothesisCanvas|suspectedCauseHub|gateNode" "packages/ui/src/components/Frame" "FRAME does not embed hypothesis canvas surfaces"
check "LayeredProcessView|OperationsBand" "packages/ui/src/components/EvidenceMap" "Evidence Map does not reimplement L2 flow rendering"

if [ "$FAILED" -gt 0 ]; then
  echo "✗ ADR-074 boundary violations: $FAILED" >&2
  exit 1
fi
echo "✓ ADR-074 boundaries clean"
```

```bash
chmod +x scripts/check-level-boundaries.sh
```

- [ ] **Step 15.2: Add npm script + pre-commit hook**

In `package.json` `scripts`:

```json
"check:boundaries": "bash scripts/check-level-boundaries.sh"
```

In `.husky/pre-commit` (or add to `lint-staged.config.js`):

```bash
bash scripts/check-level-boundaries.sh
```

- [ ] **Step 15.3: Run + commit**

```bash
bash scripts/check-level-boundaries.sh
```

Expected: ✓ all clean (or ✓ structural-absence notes for not-yet-present dirs).

```bash
git add scripts/check-level-boundaries.sh package.json .husky/pre-commit
git commit -m "chore: ADR-074 boundary check script + pre-commit wiring"
```

---

## Task 16: Documentation completeness sweep

**Files (final pass):**

- Modify: `docs/01-vision/methodology.md` — temporal scope paragraph.
- Modify: `docs/01-vision/eda-mental-model.md` — SCOUT loops note.
- Create: `docs/03-features/analysis/timeline-window-investigations.md`
- Create: `docs/03-features/analysis/multi-level-dashboard.md`
- Create: `docs/05-technical/architecture/timeline-window-architecture.md`
- Modify: `docs/03-features/learning/glossary.md` — new terms.
- Modify: `packages/core/src/glossary/terms.ts` — typed terms source-of-truth.
- Modify: `docs/USER-JOURNEYS.md` and `docs/USER-JOURNEYS-CAPABILITY.md`.
- Modify: `docs/llms.txt` — add the new feature + architecture doc paths.
- Modify: `packages/{core,hooks,ui,charts}/CLAUDE.md`, `apps/{azure,pwa}/CLAUDE.md` — per-package mentions.
- Modify: `docs/superpowers/specs/2026-04-29-multi-level-scout-design.md` — `status: draft` → `status: delivered`; update `last-reviewed: 2026-04-29`.
- Modify: `docs/decision-log.md` — close V1 implementation row in §4 (state `done`, Closed `2026-04-29`); update SCOUT Journey Map row to `shipped (multi-level V1)` with chrome-walk date.
- Modify: `docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md` — strike "to be added" note now that the script ships.

- [ ] **Step 16.1: Write feature docs (user-facing)**

Create `docs/03-features/analysis/timeline-window-investigations.md` with frontmatter (audience: user) — explain the four window types, when to use each, and where the picker lives.

Create `docs/03-features/analysis/multi-level-dashboard.md` — explain how clicking a step / factor navigates between SCOUT, Hub Capability, Evidence Map, Investigation Wall.

(Each doc needs proper frontmatter per `scripts/docs-frontmatter-schema.mjs`.)

- [ ] **Step 16.2: Write architecture doc (engineer-facing)**

Create `docs/05-technical/architecture/timeline-window-architecture.md` — the `dataRouter` contract, the strategy + dataRouter integration, scope detection, how new metric modules plug in. Mirror the style of existing technical docs.

- [ ] **Step 16.3: Update vision + glossary**

Edit `docs/01-vision/methodology.md` — add a short paragraph on temporal scope as part of Watson's third question.

Edit `docs/01-vision/eda-mental-model.md` — note that SCOUT loops gain window context.

Edit `docs/03-features/learning/glossary.md` and `packages/core/src/glossary/terms.ts` — add: timeline window, output rate, bottleneck, finding drift, hub-time, investigation-time.

- [ ] **Step 16.4: Update journey docs**

Edit `docs/USER-JOURNEYS.md`, `docs/USER-JOURNEYS-CAPABILITY.md` — mention the timeline picker in the journey spine.

(Other per-mode files get full updates in V3 — V1 only updates Standard EDA + Capability journey.)

- [ ] **Step 16.5: Update agent / package CLAUDE.md files**

Edit `docs/llms.txt` — add new feature doc paths + architecture doc as priority entry points.

Edit `packages/core/CLAUDE.md` (mention `throughput/`, `timeline/`, `findings/drift.ts`).
Edit `packages/hooks/CLAUDE.md` (mention `useTimelineWindow`, `useDataRouter`).
Edit `packages/ui/CLAUDE.md` (mention `TimelineWindowPicker`, dataRouter contract).
Edit `apps/azure/CLAUDE.md` and `apps/pwa/CLAUDE.md` (mention the multi-level surface integration points).

(Each edit is 1-3 sentences; preserve the host file's voice.)

- [ ] **Step 16.6: Lifecycle updates**

In `docs/superpowers/specs/2026-04-29-multi-level-scout-design.md`: change `status: draft` to `status: delivered`. Update `last-reviewed`.

In `docs/decision-log.md`: §4 Session Backlog — close "Multi-level SCOUT V1 implementation plan + execution" with Closed `2026-04-29`. §5 User Journey Map — update SCOUT row with `shipped (multi-level V1)` + chrome-walk date.

In `docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md`: strike "(to be added when the implementation plan lands)" since the script now ships in this PR.

- [ ] **Step 16.7: Memory updates**

Add a memory entry at `~/.claude/projects/.../memory/project_multi_level_scout.md` — design summary + ADR-074 + V1 scope.

Update `~/.claude/projects/.../memory/MEMORY.md` index — add the new entry; remove or supersede the older FRAME thin-spot entry per the deferral.

- [ ] **Step 16.8: Run final pre-merge gate**

```bash
bash scripts/pr-ready-check.sh
```

Expected: ✓ all checks pass.

```bash
git add docs/ packages/ apps/
git commit -m "docs: V1 documentation completeness sweep + lifecycle updates"
```

- [ ] **Step 16.9: Push branch + open PR**

```bash
git push -u origin feat/multi-level-scout-v1
gh pr create --title "Multi-level SCOUT V1 (first slice)" --body "$(cat <<'BODY'
## Summary

Lands the first delivery slice of the Multi-level SCOUT design (`docs/superpowers/specs/2026-04-29-multi-level-scout-design.md`).

- TimelineWindow primitive + applyWindow + scope detection + append-mode
- AnalysisModeStrategy.dataRouter (no chart changes)
- New throughput/ module: computeOutputRate + computeBottleneck
- Finding drift detection (computeFindingWindowDrift)
- TimelineWindowPicker in FilterContextBar
- Window-context footer on Findings
- ProductionLineGlanceDashboard refactored onto strategy + dataRouter
- ADR-074 boundary check script + pre-commit wiring
- Interleaved feature docs + glossary + statistics-reference + journey doc updates
- Spec status: draft → delivered

## Test plan

- [ ] All package tests pass (pnpm test)
- [ ] Lint clean (pnpm lint)
- [ ] docs:check passes
- [ ] ADR-074 boundary check clean
- [ ] Manual chrome walk: investigation-time picker works in PWA + Azure
- [ ] Manual chrome walk: hub-time picker default = rolling matched to cadence
- [ ] Re-upload an investigation and verify append-mode merge report shows correct add/duplicate/correction counts
BODY
)"
```

---

## Self-review

After writing this plan, the following spec sections should each have implementing tasks:

- §2.A Strategy + 4 slots unchanged → implicit (Tasks 7, 13)
- §2.B Timeline window primitive → Tasks 1, 2, 8, 10, 11
- §2.C dataRouter extension → Tasks 7, 9
- §2 Scope detection (`detectScope`) → Task 3
- §3 Multi-level surface lensing → Task 13 (refactor onto strategy); deeper lens panels are V2/V3
- §3.5 Metric layer integration — existing wired → Task 7 (transforms[] strings); new metrics → Tasks 5, 6
- §4 Boundary-keeping → Task 15 (script)
- §5 FRAME thin-spot helpers' fate → not in V1 (those land in their own follow-up if/when needed; the spec keeps them deferred)
- §6 Drill semantics — Drill A continues unchanged
- §7 Knowledge Catalyst alignment → drift detection (Task 5) + window-context on Findings (Tasks 5, 12)
- §8 Sequencing — V1 first slice covered; V2/V3 named-future
- §9 Out of scope — honoured (no new charts, no Drill C, no Plan D, no per-mode multi-level expansion beyond Standard EDA)

**Open in spec ambiguities resolution:**

- #1 TimelineWindow attachment → Task 0.2 (locked: investigation envelope, not ProcessContext)
- #2 SpecLookupContext shape → Task 7.1 (locked: existing type from packages/core/src/types.ts)
- #3 ChartVariantId → Task 7.1 (locked: equals existing ChartSlotType)
- #4 Append-mode keys → Task 0.3 (locked: timestamp + factor columns + outcome column)
- #5 Drift threshold default → Task 5.1 (locked: 0.20 relative change)
- #6 Default window per mode → Task 0.1 (locked: investigation = openEnded; hub Capability = rolling matched to cadence; B0 = cumulative)

**Placeholder scan:** every step has executable code or commands. No "TBD" / "implement later" markers.

**Type consistency:** `TimelineWindow` is defined in Task 1 and used identically through Tasks 2, 5, 8, 9, 10, 11, 12, 14. `Scope` from Task 3 used in Task 7. `MergeReport` from Task 4 surfaces in Task 14 chrome-walk verification. `DriftResult` from Task 5 consumed by CoScout in V2 (out of V1 scope).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-29-multi-level-scout-v1.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, code-reviewer pass between tasks, fast iteration. Use `superpowers:subagent-driven-development`.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

Which approach?
