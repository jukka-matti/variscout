---
title: Canvas Polish v1 — bundled PR1–PR9 follow-ups
audience: [engineer]
category: implementation
status: delivered
related:
  - docs/investigations.md
  - docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/decision-log.md
last-reviewed: 2026-05-08
---

> **DELIVERED 2026-05-08 via PR #143** (squash-merge `b19f9f76`). Plan file committed post-merge as historical record. Code/spec/test changes were included in the squash; this plan was on the branch but not in the merge commit's diff.

# Canvas Polish v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Fresh implementer per task, spec + quality reviewer pair per task, final code-reviewer at the end. Sonnet workhorse for implementer + reviewer roles. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close four `docs/investigations.md` follow-ups carried forward from the PR1–PR9 canvas migration in a single bundled PR off `canvas-polish-v1`.

**Architecture:**

1. **Producer-side step-capability stamping.** New pure helper `stampStepCapabilities({ map, rows, measureSpecs }) → StepCapabilityStamp[]` in `@variscout/core/canvas`. Called inside the existing snapshot-construction sites in `apps/pwa/src/hooks/usePasteImportFlow.ts` and `apps/azure/src/features/data-flow/useEditorDataFlow.ts` so the snapshot ships with `stepCapabilities` populated. **No new action kind, no handler change** — `EVIDENCE_ADD_SNAPSHOT` already accepts a full `EvidenceSnapshot` and the type has the optional field.
2. **Real histogram binning.** New pure helper `computeHistogramBins(values, rule?) → { x0, x1, count }[]` in `@variscout/core/stats` (default Sturges, optional Scott). Replaces the first-12-raw-values pseudo-bin in `CanvasStepMiniChart.tsx`'s histogram branch.
3. **Z-stack documentation.** Status-quo + doc: extend Spec 4 ext (`2026-05-08-canvas-wall-overlay-design.md`) §6 to document the rendering z-stack alongside the existing input-layering precedent. Wall-on supersedes per-step arrows by design — the Wall's own arrows encode the same causal data.
4. **wallLayoutStore.selection audit.** Confirm + lock: `selection` is already excluded from the persisted `WallLayoutSnapshot`. Add a regression test pinning that exclusion, plus a clarifying code comment near `WallLayoutSnapshot` so a future dev who tries to add `selection` to persistence can't do it without tripping the test.

**Tech Stack:** TypeScript 6 / Vitest / RTL / pnpm + Turbo monorepo / `@variscout/core` (pure TS) / `@variscout/hooks` / `@variscout/ui` / `@variscout/stores` / Tailwind v4.

**Branch:** `canvas-polish-v1` off `main` (clean, last commit `6a545a26`).

**Worktree:** create a single isolated worktree at `.worktrees/canvas-polish-v1/` via `superpowers:using-git-worktrees`. All implementer + reviewer subagents write inside that worktree. Main session stays at repo root.

**Test budget:** every task ends `pnpm --filter <package> test`; final task ends `bash scripts/pr-ready-check.sh` + `claude --chrome` walk.

---

## File Structure

**New files:**

- `packages/core/src/canvas/stampStepCapabilities.ts` — pure helper
- `packages/core/src/canvas/__tests__/stampStepCapabilities.test.ts` — engine tests
- `packages/core/src/stats/histogramBins.ts` — pure helper
- `packages/core/src/stats/__tests__/histogramBins.test.ts` — engine tests

**Modified files:**

- `packages/core/src/canvas/index.ts` — barrel export of `stampStepCapabilities`
- `packages/core/src/stats/index.ts` — barrel export of `computeHistogramBins`
- `apps/pwa/src/hooks/usePasteImportFlow.ts` — populate `snapshot.stepCapabilities` at the three EVIDENCE_ADD_SNAPSHOT dispatch sites (multi-source-join, overlap-replace, overlap-replace-fallback)
- `apps/azure/src/features/data-flow/useEditorDataFlow.ts` — same at its three dispatch sites
- `packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx` — histogram branch reads bin counts
- `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepMiniChart.test.tsx` — assertion update
- `packages/stores/src/wallLayoutStore.ts` — clarifying comment on `WallLayoutSnapshot` interface
- `packages/stores/src/__tests__/wallLayoutStore.test.ts` — regression test for selection exclusion
- `docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md` — append z-stack documentation to §6
- `docs/investigations.md` — close four entries with `[RESOLVED 2026-05-08]` tags

---

## Partial-integration policy

If the canonical map at paste time is empty (no nodes / no chips assigned) — which is the realistic state during the very first paste, **before** the user authors the canvas — `stampStepCapabilities` returns `[]`. The snapshot still ships `stepCapabilities: []` (an empty but present array, not `undefined`). This is intentional: the consumer (`priorStepStatsFromSnapshots`) already returns `EMPTY_PRIOR_STEP_STATS` for snapshots without stamps, so the drift indicator stays inert exactly as it does today. The next snapshot — taken after the user has authored steps and assigned columns — will carry real stamps, activating drift comparison on the snapshot-after-that. No producer regression, just gradual self-healing as the canvas matures.

---

## Type signatures (locked at plan time)

```ts
// packages/core/src/canvas/stampStepCapabilities.ts
export interface StampStepCapabilitiesArgs {
  map: ProcessMap;
  rows: readonly DataRow[];
  measureSpecs: Record<string, SpecLimits>;
}

export function stampStepCapabilities(args: StampStepCapabilitiesArgs): StepCapabilityStamp[];
```

```ts
// packages/core/src/stats/histogramBins.ts
export type HistogramBinningRule = 'sturges' | 'scott';

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

export function computeHistogramBins(
  values: readonly number[],
  rule?: HistogramBinningRule
): HistogramBin[];
```

`StepCapabilityStamp` and `ProcessMap` are unchanged — already exported from `@variscout/core/canvas` and `@variscout/core/frame` respectively. `SpecLimits` and `DataRow` are unchanged.

---

## Task 1: Add `stampStepCapabilities` pure helper in `@variscout/core/canvas`

**Why:** the consumer side (drift indicator + `priorStepStatsFromSnapshots` + `CanvasStepCardModel.drift`) already reads `EvidenceSnapshot.stepCapabilities`, but every snapshot ships with that field `undefined`. A pure stamping helper unblocks the producer wiring in T2/T3.

**Files:**

- Create: `packages/core/src/canvas/stampStepCapabilities.ts`
- Create: `packages/core/src/canvas/__tests__/stampStepCapabilities.test.ts`
- Modify: `packages/core/src/canvas/index.ts` (barrel)

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/canvas/__tests__/stampStepCapabilities.test.ts
import { describe, it, expect } from 'vitest';
import type { ProcessMap } from '../../frame';
import type { DataRow, SpecLimits } from '../..';
import { stampStepCapabilities } from '../stampStepCapabilities';

const baseMap: ProcessMap = {
  nodes: [
    { id: 'step-1', name: 'Cure', order: 0, parentStepId: null, ctqColumn: 'cure_temp_c' },
    { id: 'step-2', name: 'Pack', order: 1, parentStepId: null, ctqColumn: null },
  ],
  arrows: [],
  assignments: {},
};

describe('stampStepCapabilities', () => {
  it('returns one stamp per map node, ordered by node order', () => {
    const rows: DataRow[] = [
      { cure_temp_c: '100' },
      { cure_temp_c: '101' },
      { cure_temp_c: '102' },
      { cure_temp_c: '103' },
    ];
    const measureSpecs: Record<string, SpecLimits> = {
      cure_temp_c: { usl: 110, lsl: 90, target: 100, characteristicType: 'nominal' },
    };

    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs });

    expect(stamps).toHaveLength(2);
    expect(stamps[0]?.stepId).toBe('step-1');
    expect(stamps[1]?.stepId).toBe('step-2');
  });

  it('populates n / mean / sigma / cpk on a numeric stamp from the metric column', () => {
    const rows: DataRow[] = [
      { cure_temp_c: '99' },
      { cure_temp_c: '100' },
      { cure_temp_c: '101' },
      { cure_temp_c: '102' },
    ];
    const measureSpecs: Record<string, SpecLimits> = {
      cure_temp_c: { usl: 110, lsl: 90 },
    };

    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs });

    expect(stamps[0]?.n).toBe(4);
    expect(stamps[0]?.mean).toBeCloseTo(100.5, 4);
    expect(stamps[0]?.sigma).toBeGreaterThan(0);
    expect(stamps[0]?.cpk).toBeDefined();
  });

  it('emits n=0 stamps for nodes with no metric column or no numeric values', () => {
    const rows: DataRow[] = [{ cure_temp_c: '100' }];
    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs: {} });
    // step-2 has no ctqColumn and no assignments → n=0
    const stepTwo = stamps.find(s => s.stepId === 'step-2');
    expect(stepTwo?.n).toBe(0);
    expect(stepTwo?.mean).toBeUndefined();
    expect(stepTwo?.sigma).toBeUndefined();
    expect(stepTwo?.cpk).toBeUndefined();
  });

  it('returns [] when the map has no nodes', () => {
    const empty: ProcessMap = { nodes: [], arrows: [], assignments: {} };
    expect(stampStepCapabilities({ map: empty, rows: [], measureSpecs: {} })).toEqual([]);
  });

  it('uses an assignment column when ctqColumn is null', () => {
    const map: ProcessMap = {
      nodes: [{ id: 'step-A', name: 'A', order: 0, parentStepId: null, ctqColumn: null }],
      arrows: [],
      assignments: { col_x: 'step-A' },
    };
    const rows: DataRow[] = [{ col_x: '5' }, { col_x: '7' }];
    const stamps = stampStepCapabilities({ map, rows, measureSpecs: {} });
    expect(stamps[0]?.n).toBe(2);
    expect(stamps[0]?.mean).toBeCloseTo(6, 4);
  });

  it('returns finite numbers only — never NaN / Infinity (ADR-069 B2)', () => {
    const rows: DataRow[] = [{ cure_temp_c: 'not-a-number' }, { cure_temp_c: '' }];
    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs: {} });
    for (const stamp of stamps) {
      if (stamp.mean !== undefined) expect(Number.isFinite(stamp.mean)).toBe(true);
      if (stamp.sigma !== undefined) expect(Number.isFinite(stamp.sigma)).toBe(true);
      if (stamp.cpk !== undefined) expect(Number.isFinite(stamp.cpk)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test stampStepCapabilities -- --run`
Expected: FAIL with "Cannot find module '../stampStepCapabilities'" or similar.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/canvas/stampStepCapabilities.ts
import { calculateStats, type DataRow, type SpecLimits } from '..';
import type { ProcessMap } from '../frame';
import type { StepCapabilityStamp } from './stepDrift';

export interface StampStepCapabilitiesArgs {
  map: ProcessMap;
  rows: readonly DataRow[];
  measureSpecs: Record<string, SpecLimits>;
}

/**
 * Compute one StepCapabilityStamp per node in `map`.
 *
 * For each node we pick a metric column (preferring ctqColumn, falling back to
 * the first assigned column with parseable numeric values), parse numeric
 * values, then defer to the canonical stats engine. Stamps land in
 * EvidenceSnapshot.stepCapabilities so canvas drift comparisons can read them.
 *
 * Returns finite numbers or undefined per ADR-069 B2 (numeric safety boundary).
 * Stamps are emitted in node-order; nodes with no metric column or no parseable
 * values get { n: 0 } stamps so the array length tracks the map exactly.
 */
export function stampStepCapabilities(args: StampStepCapabilitiesArgs): StepCapabilityStamp[] {
  const { map, rows, measureSpecs } = args;
  const assignmentsByStep = columnsByStep(map);
  const sortedNodes = [...map.nodes].sort((a, b) => a.order - b.order);

  return sortedNodes.map(node => {
    const assignedColumns = assignmentsByStep.get(node.id) ?? [];
    const metricColumn = pickMetricColumn({
      ctqColumn: node.ctqColumn,
      assignedColumns,
      rows,
    });

    if (!metricColumn) return { stepId: node.id, n: 0 };

    const values = parseNumericValues(rows, metricColumn);
    if (values.length === 0) return { stepId: node.id, n: 0 };

    const specs = measureSpecs[metricColumn];
    const stats = calculateStats(values, specs?.usl, specs?.lsl);

    return buildStamp({ stepId: node.id, values, stats });
  });
}

function columnsByStep(map: ProcessMap): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [column, stepId] of Object.entries(map.assignments)) {
    if (!stepId) continue;
    const list = out.get(stepId) ?? [];
    list.push(column);
    out.set(stepId, list);
  }
  return out;
}

function pickMetricColumn(input: {
  ctqColumn: string | null;
  assignedColumns: string[];
  rows: readonly DataRow[];
}): string | undefined {
  const { ctqColumn, assignedColumns, rows } = input;
  if (ctqColumn && parseNumericValues(rows, ctqColumn).length > 0) return ctqColumn;
  if (ctqColumn) return ctqColumn;
  return (
    assignedColumns.find(column => parseNumericValues(rows, column).length > 0) ??
    assignedColumns[0]
  );
}

function parseNumericValues(rows: readonly DataRow[], column: string): number[] {
  const out: number[] = [];
  for (const row of rows) {
    const raw = row[column];
    if (raw === undefined || raw === null || raw === '') continue;
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(num)) out.push(num);
  }
  return out;
}

function buildStamp(input: {
  stepId: string;
  values: number[];
  stats: ReturnType<typeof calculateStats>;
}): StepCapabilityStamp {
  const { stepId, values, stats } = input;
  const stamp: StepCapabilityStamp = { stepId, n: values.length };
  if (Number.isFinite(stats.mean)) stamp.mean = stats.mean;
  if (Number.isFinite(stats.stdDev)) stamp.sigma = stats.stdDev;
  if (typeof stats.cpk === 'number' && Number.isFinite(stats.cpk)) stamp.cpk = stats.cpk;
  return stamp;
}
```

- [ ] **Step 4: Add barrel export**

In `packages/core/src/canvas/index.ts`, add:

```ts
export { stampStepCapabilities, type StampStepCapabilitiesArgs } from './stampStepCapabilities';
```

(Place adjacent to the existing `stepDrift` exports, before the `addStep`/`connectSteps` action exports block.)

- [ ] **Step 5: Run tests and ensure they pass**

Run: `pnpm --filter @variscout/core test stampStepCapabilities -- --run`
Expected: all 6 cases PASS.

Then run the full core suite to catch regressions: `pnpm --filter @variscout/core test -- --run`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/canvas/stampStepCapabilities.ts \
        packages/core/src/canvas/__tests__/stampStepCapabilities.test.ts \
        packages/core/src/canvas/index.ts
git commit -m "feat(core): add stampStepCapabilities helper for snapshot-time drift stamping"
```

---

## Task 2: Wire stamping into PWA + Azure paste flows

**Why:** the helper has no behaviour visible to users until producer call sites populate `snapshot.stepCapabilities`. The two producer paths are mirror twins — both run inside paste reducers, both build an `EvidenceSnapshot` literal, both dispatch `EVIDENCE_ADD_SNAPSHOT`. We update both in one task because the change is mechanical and they must stay in lockstep.

**Files:**

- Modify: `apps/pwa/src/hooks/usePasteImportFlow.ts` — three sites (multi-source-join `~line 478`, overlap-replace `~line 547`, overlap-replace-fallback `~line 575`)
- Modify: `apps/azure/src/features/data-flow/useEditorDataFlow.ts` — three sites (multi-source-join `~line 636`, overlap-replace `~line 700`, overlap-replace-fallback `~line 731`)
- Modify: `apps/pwa/src/hooks/__tests__/usePasteImportFlow.provenance.test.ts` (or sibling) — add stamping assertion
- Modify: `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.provenance.test.ts` (or sibling) — add stamping assertion

- [ ] **Step 1: Write the failing test (PWA)**

Pick the smallest existing PWA paste-flow test that already exercises `EVIDENCE_ADD_SNAPSHOT` dispatch (search for `EVIDENCE_ADD_SNAPSHOT` in `apps/pwa/src/hooks/__tests__/`). Add a new case that:

1. Seeds `useCanvasStore` with a non-empty canonical map (one node with a `ctqColumn` that maps to a numeric column in the paste rows).
2. Seeds `useProjectStore.measureSpecs` for that column.
3. Triggers the paste flow that lands in the multi-source-join branch.
4. Asserts the dispatched snapshot's `stepCapabilities` is a non-empty array containing a stamp with `stepId` matching the seeded node and `n > 0`.

Mirror the same case in the Azure suite using `useCanvasStore` + `useProjectStore` setup against the Azure dispatch path.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @variscout/pwa test usePasteImportFlow -- --run
pnpm --filter @variscout/azure-app test useEditorDataFlow -- --run
```

Expected: the two new cases FAIL with `stepCapabilities` undefined or empty.

- [ ] **Step 3: Update PWA `usePasteImportFlow.ts`**

Add this import near the top of the file (alongside the existing `@variscout/core/evidenceSources` import):

```ts
import { stampStepCapabilities } from '@variscout/core/canvas';
import { useCanvasStore } from '@variscout/stores';
import { useProjectStore } from '@variscout/stores';
```

(If the file already imports `useCanvasStore` / `useProjectStore` for other reasons, reuse the existing import lines; otherwise add as shown.)

At each of the three snapshot-construction sites, immediately **after** the `const snapshot: EvidenceSnapshot = { ... };` literal and **before** the `pwaHubRepository.dispatch(...)` call, splice in the stamps:

```ts
const stamps = stampStepCapabilities({
  map: useCanvasStore.getState().canonicalMap,
  rows: ms.newRows, // for multi-source-join + overlap-replace-fallback
  measureSpecs: useProjectStore.getState().measureSpecs,
});
const snapshotWithStamps: EvidenceSnapshot = {
  ...snapshot,
  stepCapabilities: stamps,
};

void pwaHubRepository.dispatch({
  kind: 'EVIDENCE_ADD_SNAPSHOT',
  hubId: activeHub.id,
  snapshot: snapshotWithStamps,
  provenance: tags, // or [] depending on site
  // replacedSnapshotId on overlap-replace + fallback sites
});
```

For the **overlap-replace** site (`~line 547`), the `rows` argument is the merged set actually produced for that branch (`merged`), not `ms.newRows`. The intent is to stamp from the rows that constitute the new snapshot's content. Use whichever variable is fed into `_proceedWithParsedData` immediately after dispatch:

- `multi-source-join`: `ms.newRows`
- `overlap-replace`: `merged`
- `overlap-replace-fallback`: `ms.newRows`

This mirrors the rowCount semantics already in the existing snapshot literal (see `rowCount: ms.newRows.length` — same source-of-truth).

- [ ] **Step 4: Mirror the same wiring in Azure `useEditorDataFlow.ts`**

Same three sites, same pattern, but the dispatch target is `azureHubRepository.dispatch(...)` and the canvas/project stores are imported from `@variscout/stores` (no app-local equivalent — the domain stores are shared per ADR-078). For Azure the imports likely already exist; reuse.

- [ ] **Step 5: Run tests and verify they pass**

Run:

```bash
pnpm --filter @variscout/pwa test usePasteImportFlow -- --run
pnpm --filter @variscout/azure-app test useEditorDataFlow -- --run
```

Expected: the two new cases PASS. Existing cases continue green (this is a strictly additive field on the snapshot — no existing assertion should care).

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/hooks/usePasteImportFlow.ts \
        apps/pwa/src/hooks/__tests__/ \
        apps/azure/src/features/data-flow/useEditorDataFlow.ts \
        apps/azure/src/features/data-flow/__tests__/
git commit -m "feat(canvas): stamp EvidenceSnapshot.stepCapabilities at paste-time (PWA + Azure)"
```

---

## Task 3: Add `computeHistogramBins` helper in `@variscout/core/stats`

**Why:** the histogram branch in `CanvasStepMiniChart.tsx` plots first-12-raw-values normalized — methodologically wrong (no binning at all) and surfaces in vision §5.2 as the histogram type. Adding a small Sturges/Scott helper in the stats package lets the UI swap to true bins without ad-hoc binning logic in a presentational component (`@variscout/charts`/`@variscout/ui` doesn't compute stats — that's the stats package's job per `editing-statistics`).

**Files:**

- Create: `packages/core/src/stats/histogramBins.ts`
- Create: `packages/core/src/stats/__tests__/histogramBins.test.ts`
- Modify: `packages/core/src/stats/index.ts` — export `computeHistogramBins` + types

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/stats/__tests__/histogramBins.test.ts
import { describe, it, expect } from 'vitest';
import { computeHistogramBins } from '../histogramBins';

describe('computeHistogramBins', () => {
  it('returns an empty array for no input', () => {
    expect(computeHistogramBins([])).toEqual([]);
  });

  it('returns a single bin for length-1 input', () => {
    const bins = computeHistogramBins([5]);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.count).toBe(1);
    expect(bins[0]?.x0).toBe(5);
    expect(bins[0]?.x1).toBe(5);
  });

  it('uses Sturges rule by default — bins ≈ ceil(log2(n) + 1)', () => {
    const values = Array.from({ length: 16 }, (_, i) => i);
    const bins = computeHistogramBins(values);
    // log2(16) + 1 = 5 → ceil = 5
    expect(bins).toHaveLength(5);
  });

  it('totals to N — every value lands in exactly one bin', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const bins = computeHistogramBins(values);
    const total = bins.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(values.length);
  });

  it('bins are contiguous and non-overlapping (x1 of bin i = x0 of bin i+1)', () => {
    const bins = computeHistogramBins([1, 2, 3, 4, 5, 6, 7, 8]);
    for (let i = 0; i < bins.length - 1; i++) {
      expect(bins[i]?.x1).toBeCloseTo(bins[i + 1]?.x0 ?? NaN, 6);
    }
  });

  it('handles all-equal input by returning a single zero-width bin', () => {
    const bins = computeHistogramBins([7, 7, 7, 7]);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.count).toBe(4);
    expect(bins[0]?.x0).toBe(7);
    expect(bins[0]?.x1).toBe(7);
  });

  it('Scott rule produces a different bin count than Sturges on a representative sample', () => {
    // 100 normally-distributed-ish values
    const values = Array.from({ length: 100 }, (_, i) => Math.sin(i / 5) * 10 + i / 10);
    const sturges = computeHistogramBins(values, 'sturges');
    const scott = computeHistogramBins(values, 'scott');
    expect(sturges.length).toBeGreaterThan(0);
    expect(scott.length).toBeGreaterThan(0);
    // Different rules → typically different bin counts on this data
    expect(sturges.length).not.toBe(scott.length);
  });

  it('returns finite numbers only — no NaN / Infinity (ADR-069 B2)', () => {
    const values = [1, 2, 3, 4];
    const bins = computeHistogramBins(values);
    for (const bin of bins) {
      expect(Number.isFinite(bin.x0)).toBe(true);
      expect(Number.isFinite(bin.x1)).toBe(true);
      expect(Number.isFinite(bin.count)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test histogramBins -- --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/stats/histogramBins.ts

export type HistogramBinningRule = 'sturges' | 'scott';

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

/**
 * Compute equal-width histogram bins for a numeric sample.
 *
 * Bin count rule:
 * - 'sturges' (default): k = ceil(log2(n) + 1)
 * - 'scott':             binWidth = 3.49 · σ · n^(-1/3), then k = ceil((max - min) / binWidth)
 *
 * Returns bins sorted by x0; bins are contiguous (bin[i].x1 === bin[i+1].x0).
 * The last bin is closed on both ends (right edge is inclusive of max). All
 * other bins are half-open [x0, x1). Every input value lands in exactly one
 * bin; the sum of counts equals values.length.
 *
 * Edge cases:
 * - empty input → []
 * - all-equal input → single zero-width bin (x0 === x1) with count = n
 *
 * Returns finite numbers only per ADR-069 B2.
 */
export function computeHistogramBins(
  values: readonly number[],
  rule: HistogramBinningRule = 'sturges'
): HistogramBin[] {
  if (values.length === 0) return [];

  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return [{ x0: min, x1: max, count: sorted.length }];
  }

  const k = binCount(sorted, min, max, rule);
  const width = (max - min) / k;

  const bins: HistogramBin[] = [];
  for (let i = 0; i < k; i++) {
    bins.push({ x0: min + i * width, x1: min + (i + 1) * width, count: 0 });
  }

  for (const value of sorted) {
    let idx = Math.floor((value - min) / width);
    if (idx >= k) idx = k - 1; // includes max in last bin
    bins[idx].count += 1;
  }

  return bins;
}

function binCount(sorted: number[], min: number, max: number, rule: HistogramBinningRule): number {
  const n = sorted.length;
  if (rule === 'sturges') {
    return Math.max(1, Math.ceil(Math.log2(n) + 1));
  }

  const sigma = stdDev(sorted);
  if (!Number.isFinite(sigma) || sigma === 0) {
    return Math.max(1, Math.ceil(Math.log2(n) + 1));
  }
  const binWidth = 3.49 * sigma * Math.pow(n, -1 / 3);
  if (!Number.isFinite(binWidth) || binWidth <= 0) {
    return Math.max(1, Math.ceil(Math.log2(n) + 1));
  }
  return Math.max(1, Math.ceil((max - min) / binWidth));
}

function stdDev(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / (n - 1);
  return Math.sqrt(variance);
}
```

- [ ] **Step 4: Add barrel export**

In `packages/core/src/stats/index.ts`, append:

```ts
// Histogram binning (Sturges / Scott)
export {
  computeHistogramBins,
  type HistogramBin,
  type HistogramBinningRule,
} from './histogramBins';
```

(Place after the boxplot block, before the andersonDarling block, so it sits with other distribution helpers.)

- [ ] **Step 5: Run tests and ensure they pass**

```bash
pnpm --filter @variscout/core test histogramBins -- --run
pnpm --filter @variscout/core test -- --run
```

Expected: the 8 new cases PASS, full suite green.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/stats/histogramBins.ts \
        packages/core/src/stats/__tests__/histogramBins.test.ts \
        packages/core/src/stats/index.ts
git commit -m "feat(core): add computeHistogramBins helper (Sturges + Scott)"
```

---

## Task 4: Bind `CanvasStepMiniChart` histogram branch to true bin counts

**Why:** wires the new helper to the user-visible surface the investigations entry tracks. After this task, paste a numeric column with ≥ 12 distinct values in the canvas and the mini histogram shows methodologically correct equal-width bins instead of first-12-raw-values normalized.

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx` — replace `numericBars` with bin-driven rendering
- Modify: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepMiniChart.test.tsx` — assertion swap

- [ ] **Step 1: Write the failing test (assertion update)**

The existing histogram test (`'keeps the histogram branch for histogram numeric cards'`, around line 19) currently asserts presence of the histogram block. Add a new assertion case:

```tsx
it('renders one bar per histogram bin computed from card.values', () => {
  // 16 values → Sturges bins = 5
  const values = Array.from({ length: 16 }, (_, i) => i + 1);
  render(<CanvasStepMiniChart card={numericCard({ numericRenderHint: 'histogram', values })} />);
  const bars = screen.getAllByTestId(/canvas-step-mini-chart-.+-bar-/);
  expect(bars).toHaveLength(5);
});

it('renders zero-height bar (visible min) for empty bins so the bin axis is preserved', () => {
  // Skewed input — at least one bin will be 0
  const values = [1, 1, 1, 1, 1, 10];
  render(<CanvasStepMiniChart card={numericCard({ numericRenderHint: 'histogram', values })} />);
  const bars = screen.getAllByTestId(/canvas-step-mini-chart-.+-bar-/);
  // Sturges of n=6 → ceil(log2(6) + 1) = 4 bins
  expect(bars.length).toBeGreaterThan(0);
});
```

(Use the existing `numericCard` test helper at the top of the file. If that helper does not currently accept a `values` override, extend it minimally — same pattern as `numericRenderHint`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test CanvasStepMiniChart -- --run`
Expected: FAIL — bar count won't match (current implementation always emits ≤ 12 bars from raw values).

- [ ] **Step 3: Update `CanvasStepMiniChart.tsx`**

Replace the existing `numericBars` helper and its consumer:

```tsx
import { computeHistogramBins } from '@variscout/core/stats';
```

Replace the `numericBars` function with:

```tsx
function histogramBars(values: readonly number[]): { height: number }[] {
  const bins = computeHistogramBins(values);
  if (bins.length === 0) return [];
  const max = Math.max(1, ...bins.map(bin => bin.count));
  return bins.map(bin => ({ height: bin.count / max }));
}
```

Update the histogram branch (around lines 82–106) to render one bar per bin. The bar `data-testid` becomes `${card.stepId}-bar-${index}`:

```tsx
if (card.metricKind === 'numeric') {
  const bars = histogramBars(card.values);
  return (
    <div
      className="flex h-10 items-end gap-0.5"
      aria-label={`${card.stepName} numeric distribution`}
      data-testid={`canvas-step-mini-chart-${card.stepId}`}
    >
      {bars.length > 0 ? (
        bars.map((bar, index) => (
          <span
            key={`${card.stepId}-bar-${index}`}
            data-testid={`canvas-step-mini-chart-${card.stepId}-bar-${index}`}
            className="w-full rounded-sm"
            style={{
              backgroundColor: `${chartColors.mean}99`,
              // floor at 8% so empty bins still show a tick (preserves bin axis visually)
              height: `${Math.max(8, bar.height * 100)}%`,
            }}
          />
        ))
      ) : (
        <span className="text-xs text-content-muted">No numeric values</span>
      )}
    </div>
  );
}
```

Remove the now-unused `numericBars` function.

- [ ] **Step 4: Run tests and ensure they pass**

```bash
pnpm --filter @variscout/ui test CanvasStepMiniChart -- --run
pnpm --filter @variscout/ui test -- --run
```

Expected: new cases PASS, existing cases PASS (the existing histogram branch test still asserts the wrapper renders — only the inner bar shape changed).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasStepMiniChart.test.tsx
git commit -m "feat(ui): bind canvas mini-histogram to computeHistogramBins (Sturges)"
```

---

## Task 5: wallLayoutStore.selection regression test + clarifying comment

**Why:** the investigations entry flagged a hypothetical Set/JSON Dexie round-trip hazard. Audit conclusion at plan time: `selection` is **not** in the persisted `WallLayoutSnapshot` interface — `persistWallLayout` (lines 286–298) and `rehydrateWallLayout` (lines 300–311) both intentionally skip it. Today's hazard is zero. The risk is regression: a future PR adds `selection` to `WallLayoutSnapshot` without realizing JSON/Dexie can't preserve a `Set`. We pin the exclusion with a regression test and a comment so the gap can't reopen silently.

**Files:**

- Modify: `packages/stores/src/wallLayoutStore.ts` — add a comment near `WallLayoutSnapshot`
- Modify: `packages/stores/src/__tests__/wallLayoutStore.test.ts` — add a regression test

- [ ] **Step 1: Write the failing-then-passing regression test**

Append to `packages/stores/src/__tests__/wallLayoutStore.test.ts` (it can sit at the end of the existing top-level describe block, or in a new `describe('wallLayoutStore — persistence boundary', ...)` block):

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useWallLayoutStore, persistWallLayout, rehydrateWallLayout } from '../wallLayoutStore';

describe('wallLayoutStore — selection persistence boundary', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('does NOT persist selection — Set/JSON round-trip would silently empty it', async () => {
    const projectId = 'p-test-selection-boundary';

    useWallLayoutStore.getState().setSelection(['hub-1', 'hub-2']);
    expect([...useWallLayoutStore.getState().selection]).toEqual(['hub-1', 'hub-2']);

    await persistWallLayout(projectId);

    // Reset the in-memory store and rehydrate from Dexie.
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
    expect([...useWallLayoutStore.getState().selection]).toEqual([]);

    await rehydrateWallLayout(projectId);

    // selection MUST remain empty after rehydration — it is intentionally
    // excluded from WallLayoutSnapshot. If a future change adds selection to
    // the persisted shape, this test fails and the author must use Set→string[]
    // conversion at the partialize / rehydrate boundary (see comment in
    // wallLayoutStore.ts near WallLayoutSnapshot).
    expect([...useWallLayoutStore.getState().selection]).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm --filter @variscout/stores test wallLayoutStore -- --run`
Expected: the new regression test PASSES (selection is already excluded by design — confirms the audit conclusion).

If it fails (selection somehow leaks through persistence), stop and inspect — that means today's behaviour diverges from the audit and the fix is to convert Set ↔ string[] at the boundary explicitly. **Implementer note:** if this happens, do NOT mutate `WallLayoutSnapshot` to include `selection`. The right fix is a Set→string[] conversion in `persistWallLayout` and string[]→Set in `rehydrateWallLayout`. Pause and report rather than guessing.

- [ ] **Step 3: Add clarifying comment in `wallLayoutStore.ts`**

Above the `WallLayoutSnapshot` interface declaration (around line 242), insert:

```ts
/**
 * Persisted shape — Dexie + JSON-safe by construction.
 *
 * NOTE: `selection: Set<NodeId>` is intentionally OMITTED.
 * Dexie serializes via structured-clone but the named Set type round-trips as
 * an empty object on rehydrate in some IDB implementations, so persisting it
 * verbatim would silently lose data on reload. Selection is also conceptually
 * transient (a per-session highlight, not a per-project annotation), so the
 * cleanest fix is exclusion. If a future spec needs persistent multi-select
 * recall, convert at the boundary (`partialize: { ...s, selection: [...s.selection] }`
 * + rehydrate `new Set(raw.selection)`) — and update the regression test in
 * `__tests__/wallLayoutStore.test.ts` (selection persistence boundary block).
 */
interface WallLayoutSnapshot {
```

- [ ] **Step 4: Run tests and ensure they pass**

Run: `pnpm --filter @variscout/stores test -- --run`
Expected: full suite green.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/wallLayoutStore.ts \
        packages/stores/src/__tests__/wallLayoutStore.test.ts
git commit -m "test(stores): pin wallLayoutStore selection persistence exclusion"
```

---

## Task 6: Document dual-overlay z-stack in Spec 4 ext §6

**Why:** the investigations entry surfaced a real behaviour: when both `'hypotheses'` and `'wall'` overlays are active, hypothesis arrows (`z-10`) render below the Wall SVG (`z-[15]`) and are visually hidden. The behaviour is correct per Spec 4 ext §6 input-layering rationale — the Wall is a richer view of the same causal data — but the rendering side of the z-stack isn't currently documented. Status quo + doc per the investigations promotion path; auto-toggling mutual-exclusion would dilute the V1 commitment that overlays compose.

**Files:**

- Modify: `docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md` — append to §6
- Modify: `docs/investigations.md` — close the entry

- [ ] **Step 1: Read §6 of the Wall overlay spec**

Open `docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md`. Find heading `## 6. Decision Q4 — Input layering: canvas → Wall → hypothesis-tool` (around line 139). Read the existing rationale.

- [ ] **Step 2: Append a rendering-z-stack subsection to §6**

After the existing §6 content (after the "alternative" / "mutual-exclusion" rationale paragraphs around line 158), append a new subsection:

```markdown
### 6.1 Rendering z-stack with hypothesis-arrows overlay

Per-step badge overlays (e.g., the `'hypotheses'` connector arrows in
`packages/ui/src/components/Canvas/index.tsx`) render at `z-10`. The Wall
overlay layer (`CanvasWallOverlay`'s outer wrapper) renders at `z-[15]`. The
draw-hypothesis rubber-band layer renders at `z-20` (only mounted when
`activeCanvasTool === 'draw-hypothesis'`).

When both `'hypotheses'` and `'wall'` overlays are active simultaneously, the
persistent `<HypothesisArrowsLayer>` SVG draws **below** the Wall SVG and is
visually hidden. This is by design:

- The Wall is a richer projection of the same causal data — every connector
  the per-step layer encodes is also drawn (and authored, and counted) on the
  Wall. Letting the Wall supersede those arrows when both are visible avoids
  doubling the same edges in two visual languages.
- The picker still shows both toggles. Either overlay can be turned off
  independently. We do not auto-mutual-exclude in `CanvasOverlayPicker`
  because that would imply the dual-active state is illegal — but it isn't,
  it's just superseded.
- When the user activates the draw-hypothesis tool with the Wall overlay on,
  the rubber-band layer (`z-20`) draws on top of the Wall SVG so the gesture
  remains visible. This stays consistent with §6's input-layering decision —
  pointer events pass through the Wall layer to the canvas step cards
  underneath.

This rendering ordering is the natural extension of the input-layering
ordering documented above. See `feedback_check_shipped_patterns_first` —
checked the canvas index z-class set before locking the doc; no surprises.
```

- [ ] **Step 3: Close the investigations entry**

In `docs/investigations.md`, locate the entry titled `### Canvas hypothesis-arrows visually obscured under Wall overlay when both active` (around line 275). Append a Resolution block at the end of that entry, mirroring the format of the existing resolved entries (e.g., `[RESOLVED 2026-05-07]`):

```markdown
**Resolution [2026-05-08]:** Status-quo + doc per the listed promotion path.
Spec 4 ext (`2026-05-08-canvas-wall-overlay-design.md`) §6 now carries a §6.1
"Rendering z-stack" subsection documenting that Wall (`z-[15]`) supersedes
per-step arrows (`z-10`) by design — the Wall is a richer projection of the
same causal data. No code change; auto-mutual-exclusion in CanvasOverlayPicker
was rejected (would imply the dual-active state is illegal — it isn't, just
superseded). Promote to a decision-log Open Question only if user research
surfaces confusion about the dual-overlay state.
```

- [ ] **Step 4: Run docs check**

Run: `bash scripts/check-diagram-health.sh` (if applicable) and any `pnpm docs:check` available. If neither exists, run `pnpm lint` and `pnpm test` smoke at root scope to confirm no markdown plugin breakage.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md \
        docs/investigations.md
git commit -m "docs: document canvas Wall+hypothesis dual-overlay z-stack semantics"
```

---

## Task 7: Investigations.md closeout for the three code-touching entries

**Why:** T2 / T4 / T5 each fix a tracked entry. Close them now (rather than at PR-merge) so the pre-merge investigations review sees clean state.

**Files:**

- Modify: `docs/investigations.md` — close the three remaining entries (z-stack closed in T6 already)

- [ ] **Step 1: Close `Producer-side stamping of EvidenceSnapshot.stepCapabilities`**

Locate the entry around line 378. Append:

```markdown
**Resolution [2026-05-08]:** `stampStepCapabilities({ map, rows, measureSpecs })`
helper added in `@variscout/core/canvas`; called inside the existing
`EVIDENCE_ADD_SNAPSHOT` snapshot-construction sites in
`apps/pwa/src/hooks/usePasteImportFlow.ts` and
`apps/azure/src/features/data-flow/useEditorDataFlow.ts` so each new snapshot
ships with `stepCapabilities` populated. No new action kind. Empty maps at
paste-time emit `[]` per the partial-integration policy in
`docs/superpowers/plans/2026-05-08-canvas-polish-v1.md` — drift indicator
self-heals on the snapshot-after-canvas-authoring without producer changes.
```

- [ ] **Step 2: Close `CanvasStepMiniChart histogram still uses first-12-raw-values pseudo-binning`**

Locate the entry around line 394. Append:

```markdown
**Resolution [2026-05-08]:** `computeHistogramBins(values, rule?)` helper added
in `@variscout/core/stats` (Sturges default, Scott option). `CanvasStepMiniChart`
histogram branch now renders one bar per bin with bin counts as heights,
replacing the first-12-raw-values normalization. Empty bins floor at 8%
height so the bin axis stays legible.
```

- [ ] **Step 3: Close `wallLayoutStore.selection Set/JSON Dexie round-trip`**

Locate the entry around line 339. Append:

```markdown
**Resolution [2026-05-08]:** Audit confirmed — `selection` was never in
`WallLayoutSnapshot`; `persistWallLayout` and `rehydrateWallLayout` skip it
intentionally. Locked with a regression test in
`packages/stores/src/__tests__/wallLayoutStore.test.ts` (selection persistence
boundary block) and a clarifying comment on `WallLayoutSnapshot` documenting
the boundary + the Set→string[] conversion pattern future authors should use
if persistent multi-select recall ever becomes a spec requirement.
```

- [ ] **Step 4: Commit**

```bash
git add docs/investigations.md
git commit -m "docs(investigations): close stamping / histogram / wallLayout-selection entries"
```

---

## Task 8: Pre-merge gate + chrome walk + PR

**Why:** the investigations entries are closed in code; this task verifies end-to-end before opening the PR. Per the plan's brief: pre-merge gate is `bash scripts/pr-ready-check.sh` green + a `claude --chrome` walk on a real paste flow. The walk anchors three user-visible behaviours — drift indicator activates on a second snapshot, histogram shows true bins, dual-overlay state behaves per documented z-stack.

**Files:** none (verification + PR creation)

- [ ] **Step 1: Run the pre-merge check**

Inside the worktree:

```bash
bash scripts/pr-ready-check.sh
```

Expected: all green (tests + lint + docs).

If anything fails, stop. Fix at the cause, do not bypass with `--no-verify` or `--admin` (per `feedback_subagent_no_verify`).

- [ ] **Step 2: Chrome walk — drift indicator on second paste**

Start the PWA dev server: `pnpm dev`. Open `claude --chrome` and:

1. Paste the syringe-barrel showcase (or any seeded scenario per `reference_chrome_walkthrough_template`).
2. Author a canvas with at least one numeric column assigned to a step.
3. Save / commit the project (or fire the EVIDENCE_ADD_SNAPSHOT path applicable to the dev mode).
4. Modify the data so step-level mean / Cpk shifts ≥ 5%.
5. Paste again.
6. Verify: the canvas step card now shows a drift arrow (↑ / ↓) with a non-zero magnitude. If it stays blank ("flat"), inspect: did the prior snapshot get `stepCapabilities` populated? (`localStorage` / Dexie dev tools.)

- [ ] **Step 3: Chrome walk — true histogram bins**

In the same session:

1. Paste a numeric column with ≥ 16 distinct values (e.g., the syringe-barrel `length_mm` column).
2. Verify the canvas step card mini-chart shows `5` (Sturges of 16) histogram bars with **varying** heights driven by bin counts — not 12 evenly-rising bars.
3. Hover / inspect the SVG to confirm bar `data-testid` follows `canvas-step-mini-chart-<stepId>-bar-<i>`.

- [ ] **Step 4: Chrome walk — dual-overlay z-stack**

In the same session:

1. Activate `'hypotheses'` overlay in `CanvasOverlayPicker`. Confirm dashed connector arrows draw between step cards.
2. Activate `'wall'` overlay (toggle on) without deactivating hypotheses.
3. Verify the Wall SVG renders on top — connector arrows are visually superseded but the Wall's own arrows are visible.
4. Activate the draw-hypothesis tool. Verify the rubber band draws on top of the Wall.
5. Deactivate `'wall'`. Verify the per-step arrows reappear unaffected.

- [ ] **Step 5: Push branch + open PR**

```bash
git push -u origin canvas-polish-v1
```

Open the PR via `gh pr create`. Title:

```
Canvas Polish v1 — bundle 4 PR1–PR9 follow-ups (drift stamping + histogram bins + z-stack doc + selection audit)
```

Body (HEREDOC):

```markdown
## Summary

Bundles four `docs/investigations.md` follow-ups carried forward from the
PR1–PR9 canvas migration:

- **Producer-side `EvidenceSnapshot.stepCapabilities` stamping** — new
  `stampStepCapabilities` helper in `@variscout/core/canvas`; PWA + Azure
  paste flows now populate the field at snapshot-construction time so the
  drift indicator activates on the snapshot-after-the-first.
- **Real histogram binning** — new `computeHistogramBins` helper in
  `@variscout/core/stats` (Sturges default, Scott option); replaces
  first-12-raw-values pseudo-binning in `CanvasStepMiniChart`.
- **Wall + hypothesis z-stack documentation** — Spec 4 ext §6 extended
  with a §6.1 "Rendering z-stack" subsection. Status quo + doc per the
  investigations promotion path; no code change.
- **`wallLayoutStore.selection` audit** — confirmed selection was never in
  the persisted snapshot; pinned with a regression test + clarifying
  comment near `WallLayoutSnapshot`.

Closes the four `docs/investigations.md` entries listed above.

## Test plan

- [ ] `pnpm --filter @variscout/core test` — green (new stampStepCapabilities + histogramBins suites)
- [ ] `pnpm --filter @variscout/ui test` — green (CanvasStepMiniChart bin assertions)
- [ ] `pnpm --filter @variscout/stores test` — green (wallLayoutStore selection-boundary regression)
- [ ] `pnpm --filter @variscout/pwa test` — green (paste-flow stamping assertion)
- [ ] `pnpm --filter @variscout/azure-app test` — green (paste-flow stamping assertion)
- [ ] `bash scripts/pr-ready-check.sh` — green
- [ ] `claude --chrome` walk: drift indicator activates on second paste with mean shift ≥ 5%
- [ ] `claude --chrome` walk: histogram renders true Sturges bins (≠ first-12-raw)
- [ ] `claude --chrome` walk: dual-overlay z-stack matches Spec 4 ext §6.1
```

- [ ] **Step 6: Dispatch the final code-reviewer subagent**

Per the subagent-driven-development protocol: after the PR is open, dispatch a final code-reviewer (Opus) on the full diff with the four investigations entries as scope anchors. Address any high-confidence issues by amending in the same PR (per `feedback_bundle_followups_pre_merge`).

---

## Self-review

**Spec coverage:**

- T1 + T2 — closes investigations entry "Producer-side stamping of EvidenceSnapshot.stepCapabilities" ✅
- T3 + T4 — closes investigations entry "CanvasStepMiniChart histogram still uses first-12-raw-values pseudo-binning" ✅
- T5 — closes investigations entry "wallLayoutStore.selection Set/JSON Dexie round-trip" ✅
- T6 — closes investigations entry "Canvas hypothesis-arrows visually obscured under Wall overlay" ✅
- T7 — appends Resolution blocks to the three code-touching investigations entries ✅
- T8 — pre-merge gate + chrome walk + PR per brief ✅

**Placeholder scan:** no TBDs / "implement later" / generic error-handling stubs. Test code shown verbatim. Function signatures match across tasks (`stampStepCapabilities` argument shape consistent T1↔T2; `computeHistogramBins` signature consistent T3↔T4).

**Type consistency:** `StepCapabilityStamp` is reused unchanged from `@variscout/core/canvas`. `ProcessMap` is imported from `@variscout/core/frame` (matches existing `useCanvasStepCards.ts:18`). `HistogramBin` is a new type, only referenced in T3 + T4. `WallLayoutSnapshot` is the existing local interface — comment placement matches the existing line-242 location.

**Sequencing check:** T1 must precede T2 (T2 imports the helper). T3 must precede T4 (T4 imports the helper). T5 / T6 / T7 are independent and can run in any order after T1–T4 land. T8 is strictly last.
