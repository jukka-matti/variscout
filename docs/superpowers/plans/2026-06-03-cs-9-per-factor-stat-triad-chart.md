---
tier: ephemeral
purpose: build
title: 'PR-CS-9 — per-factor stat triad: see-the-chart (sub-plan)'
status: draft
date: 2026-06-03
layer: spec
implements: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-9 — The analytical flow: render the chart in the reasoning flow (sub-plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is the bite-sized sub-plan for **PR-CS-9** of the connective-surface master plan.

**Goal:** Render the per-factor stat chart inline in the Analyze Wall's test-plan triad (spec §4.0's "SEES THE ACTUAL CHART" step) — a scatter+regression mini-chart for continuous factors, the existing boxplot for categorical — gated on the focused hypothesis so it is not always-on.

**Architecture:** The triad engine, the regression/two-sample routing, the full "try to break it" disconfirmation, and the run-and-attach-as-typed-Finding wiring **already ship** (grounded 2026-06-03 — see master-plan PR-CS-9 build record). The only spec-§4.0 gap is the chart itself. We add a pure core data-derivation (`deriveScatterFitData` / `groupOutcomeByFactor`, reusing the existing `getBestSingleFactor` → `predictFromUnifiedModel` OLS engine — **no new stats math**), a fixed-dimension `MiniScatterFit` SVG (parallel to `MiniIChart`/`MiniBoxplot`), enrich the card's `TestPlanFactorView` with an optional precomputed `chart` payload (keeping the card presentational), and populate that payload in `WallCanvas` **only for the focused hub**. The focus-gate and the render compose: a hub renders a chart iff `tp.chart` is present, and `WallCanvas` only computes `tp.chart` for `hub.id === focusedWallEntityId`.

**Tech Stack:** TypeScript monorepo (pnpm/turbo). `@variscout/core` (pure TS — no React, no `Math.random`, stats return `number | undefined`). `@variscout/ui` (React + visx + Tailwind v4 + inline SVG). Vitest + happy-dom. Float assertions via `toBeCloseTo`.

## Scope decisions (locked with the owner, 2026-06-03)

- **Cp/Cpk DEFERRED** to a follow-up. CS-9 ships the boxplot+2-sample and scatter+regression charts the engine already supports. There is no spread-question trigger in code; real per-group Cp/Cpk + its trigger are out of scope.
- **CS-9 keeps the existing run-and-attach** (the inline chart is the "see"); the explicit analyst-owned support/counts-against call is **CS-10's** job (de-automated scoring). Do not pull CS-10 forward.
- **No new `FindingSource` variant.** Evaluate-sourced findings stay source-less (works today). Out of scope.
- **No new i18n keys.** `MiniScatterFit` uses a hardcoded `aria-label` like its siblings (`MiniIChart` = "mini i-chart", `MiniBoxplot` = "mini boxplot"). This deliberately avoids the closed-`MessageCatalog` 33-file change (see `packages/core/CLAUDE.md` §i18n).
- The **4-chart-slot invariant** governs the Analyze _dashboard mode-strategy grid_, NOT the triad's inline card-extension chart — confirmed against `packages/core/CLAUDE.md`. The triad chart does not touch slot count.

---

## Before you start (pre-branch, direct to main — per CLAUDE.md "push doc commits before branching")

These are NOT subagent tasks. The controller does them on `main`, pushes, THEN branches for the code tasks.

1. **Verify + fix the stale `FindingSource` count in `packages/core/CLAUDE.md`.** Grounding found the domain-modeling invariant says "5 variants" but `packages/core/src/findings/types.ts` has **4 structural union members** (the first being `{ chart: 'boxplot' | 'pareto' }`, so 5 distinct discriminant strings). **First** read `packages/core/src/findings/types.ts` around the `FindingSource` union and confirm the count. Then edit `packages/core/CLAUDE.md` line ~25: `FindingSource` is a discriminated union (`src/findings/types.ts`) with **4 variants (5 chart-discriminant values)** — discriminant is `chart`. Commit `docs(core): correct FindingSource variant count (4 structural / 5 chart values)` to main and push.
2. **Commit this sub-plan** to main and push (`docs(cs-9): sub-plan — per-factor stat triad see-the-chart`).
3. Branch `feat/cs-9-per-factor-stat-triad` off the updated main, in its own `.worktrees/<branch>/`.

---

## File Structure

| File                                                                                                        | Responsibility                                                                                                                    | Task |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `packages/core/src/findings/factorChartData.ts` (create)                                                    | Pure data derivation: `deriveScatterFitData` (scatter points + OLS fitted line) + `groupOutcomeByFactor` (boxplot groups). No UI. | 1    |
| `packages/core/src/findings/__tests__/factorChartData.test.ts` (create)                                     | Core tests with positive + negative controls.                                                                                     | 1    |
| `packages/core/src/findings/index.ts` (modify)                                                              | Export the two new functions + `ScatterFitData`.                                                                                  | 1    |
| `packages/ui/src/components/AnalyzeWall/MiniScatterFit.tsx` (create)                                        | Fixed-dimension inline-SVG scatter + regression line (sibling of `MiniIChart`/`MiniBoxplot`).                                     | 2    |
| `packages/ui/src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx` (create)                         | Render tests + negative control (no `fittedLine` → no line element).                                                              | 2    |
| `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx` (modify)                               | Extend `TestPlanFactorView` with optional `chart`; render it; grow the row-height math.                                           | 3    |
| `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.triadChart.test.tsx` (create)     | Card-level render test + negative controls.                                                                                       | 3    |
| `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx` (modify)                                            | Compute the `chart` payload for the focused hub only; merge into its `testPlanFactors`.                                           | 4    |
| `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.triadFocus.seam.test.tsx` (create)             | Two-hub focus-gate seam test (the load-bearing negative control).                                                                 | 4    |
| `docs/superpowers/specs/2026-05-31-factors-evaluation-design.md` (modify) + `docs/decision-log.md` (modify) | In-PR doc amendments.                                                                                                             | 5    |

---

## Task 1: Pure factor chart-data derivation (core)

**Files:**

- Create: `packages/core/src/findings/factorChartData.ts`
- Test: `packages/core/src/findings/__tests__/factorChartData.test.ts`
- Modify: `packages/core/src/findings/index.ts`

**Context:** The triad row needs chart data per `(factor, outcome, tool)`. For a continuous factor (`tool === 'regression'`) we need scatter points + an OLS fitted line; for a categorical factor (`tool === 'two-sample'`) we need outcome values grouped by the factor's levels (the existing `MiniBoxplot` shape). The OLS engine already exists: `getBestSingleFactor(data, outcome, [factor])` returns a `BestSubsetResult` with `intercept` + continuous `predictors[].coefficient`, and `predictFromUnifiedModel(subset, { [factor]: x })` predicts `y` at an `x`. We derive the fitted line as the two endpoints `[minX, maxX]`. A constant factor (zero x-variance) yields **no** fitted line — that is the negative control.

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/findings/__tests__/factorChartData.test.ts
import { describe, it, expect } from 'vitest';
import { deriveScatterFitData, groupOutcomeByFactor } from '../factorChartData';
import type { DataRow } from '../../types';

// Proven fixture (mirrors hypothesisTestPlan.test.ts): Y rises with TEMP
// (continuous — decimals make the engine classify it continuous); SIZE is
// constant (the negative control — a constant factor must get NO fitted line).
const rows: DataRow[] = [
  { SHIFT: 'Day', TEMP: 20.4, SIZE: 5, Y: 10 },
  { SHIFT: 'Day', TEMP: 21.7, SIZE: 5, Y: 11 },
  { SHIFT: 'Day', TEMP: 22.1, SIZE: 5, Y: 12 },
  { SHIFT: 'Day', TEMP: 23.9, SIZE: 5, Y: 13 },
  { SHIFT: 'Day', TEMP: 24.3, SIZE: 5, Y: 14 },
  { SHIFT: 'Night', TEMP: 30.6, SIZE: 5, Y: 30 },
  { SHIFT: 'Night', TEMP: 31.2, SIZE: 5, Y: 31 },
  { SHIFT: 'Night', TEMP: 32.8, SIZE: 5, Y: 32 },
  { SHIFT: 'Night', TEMP: 33.5, SIZE: 5, Y: 33 },
  { SHIFT: 'Night', TEMP: 34.1, SIZE: 5, Y: 34 },
];

describe('deriveScatterFitData', () => {
  it('returns all (x,y) points and a positively-sloped fitted line for a continuous factor', () => {
    const result = deriveScatterFitData(rows, 'TEMP', 'Y');
    expect(result.points).toHaveLength(10);
    expect(result.points[0]).toEqual({ x: 20.4, y: 10 });
    expect(result.fittedLine).not.toBeNull();
    expect(result.fittedLine!).toHaveLength(2);
    // Y rises with TEMP → the fitted line slopes up (endpoints ordered by x).
    expect(result.fittedLine![1].x).toBeGreaterThan(result.fittedLine![0].x);
    expect(result.fittedLine![1].y).toBeGreaterThan(result.fittedLine![0].y);
    expect(result.isSignificant).toBe(true);
  });

  it('NEGATIVE CONTROL: a constant factor yields points but NO fitted line', () => {
    // SIZE is constant (=5) → zero x-variance → a degenerate/always-drawn line
    // would spuriously pass; a data-driven line must be null.
    const result = deriveScatterFitData(rows, 'SIZE', 'Y');
    expect(result.points).toHaveLength(10);
    expect(result.fittedLine).toBeNull();
    expect(result.isSignificant).toBe(false);
  });

  it('skips rows with a non-finite x or y', () => {
    const dirty: DataRow[] = [
      ...rows,
      { SHIFT: 'Day', TEMP: null, SIZE: 5, Y: 99 },
      { SHIFT: 'Day', TEMP: 40, SIZE: 5, Y: null },
    ];
    expect(deriveScatterFitData(dirty, 'TEMP', 'Y').points).toHaveLength(10);
  });
});

describe('groupOutcomeByFactor', () => {
  it('groups outcome values by the factor levels, sorted by category', () => {
    const groups = groupOutcomeByFactor(rows, 'SHIFT', 'Y');
    expect(groups.map(g => g.category)).toEqual(['Day', 'Night']);
    expect(groups[0].values).toEqual([10, 11, 12, 13, 14]);
    expect(groups[1].values).toEqual([30, 31, 32, 33, 34]);
  });

  it('NEGATIVE CONTROL: excludes rows with a null category or non-numeric outcome', () => {
    const dirty: DataRow[] = [
      { SHIFT: 'Day', Y: 10 },
      { SHIFT: null, Y: 11 }, // null category → excluded
      { SHIFT: 'Night', Y: 'oops' }, // non-numeric outcome → excluded
    ];
    const groups = groupOutcomeByFactor(dirty, 'SHIFT', 'Y');
    expect(groups.map(g => g.category)).toEqual(['Day']);
    expect(groups[0].values).toEqual([10]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/core test src/findings/__tests__/factorChartData.test.ts`
Expected: FAIL — `deriveScatterFitData`/`groupOutcomeByFactor` are not exported (module not found).

- [ ] **Step 3: Write the minimal implementation**

```ts
// packages/core/src/findings/factorChartData.ts
/**
 * Pure data derivation for the per-factor stat triad's inline mini-charts
 * (PR-CS-9, spec §4.0 "sees the actual chart"). No UI imports — pure TS.
 *
 * Reuses the existing OLS engine (`getBestSingleFactor` → `predictFromUnifiedModel`)
 * for the fitted line — NO new stats math. A factor with zero x-variance yields no
 * fitted line (the engine has nothing to fit).
 *
 * Deterministic: no Date.now / Math.random / argless new Date.
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { getBestSingleFactor, predictFromUnifiedModel } from '../stats/bestSubsets';

/** Scatter + regression mini-chart data for a continuous factor. */
export interface ScatterFitData {
  /** Raw (x = factor, y = outcome) pairs with finite values. */
  points: Array<{ x: number; y: number }>;
  /** The OLS fitted line as two endpoints [minX, maxX], or null when not fittable. */
  fittedLine: Array<{ x: number; y: number }> | null;
  /** Whether the single-factor regression is significant (drives the line colour). */
  isSignificant: boolean;
}

/**
 * Scatter points + an OLS fitted line for `factor` against `outcome`. The fitted
 * line is the model's prediction at the x-range endpoints (a straight segment for
 * a linear single-factor model). Returns `fittedLine: null` (and `isSignificant:
 * false`) when the factor has no usable x-variance or the engine declines to fit.
 */
export function deriveScatterFitData(
  rows: ReadonlyArray<DataRow>,
  factor: string,
  outcome: string
): ScatterFitData {
  const points: Array<{ x: number; y: number }> = [];
  for (const row of rows) {
    const x = toNumericValue(row[factor]);
    const y = toNumericValue(row[outcome]);
    if (x !== undefined && y !== undefined) points.push({ x, y });
  }

  let fittedLine: Array<{ x: number; y: number }> | null = null;
  let isSignificant = false;

  if (points.length >= 2) {
    let minX = points[0].x;
    let maxX = points[0].x;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
    // Zero x-variance → nothing to fit (the negative control).
    if (maxX > minX) {
      const subset = getBestSingleFactor([...rows], outcome, [factor]);
      if (subset && subset.intercept !== undefined && (subset.predictors?.length ?? 0) > 0) {
        const y0 = predictFromUnifiedModel(subset, { [factor]: minX });
        const y1 = predictFromUnifiedModel(subset, { [factor]: maxX });
        if (y0 !== null && y1 !== null && Number.isFinite(y0) && Number.isFinite(y1)) {
          fittedLine = [
            { x: minX, y: y0 },
            { x: maxX, y: y1 },
          ];
          isSignificant = subset.isSignificant;
        }
      }
    }
  }

  return { points, fittedLine, isSignificant };
}

/**
 * Outcome values grouped by the factor's levels — the `MiniBoxplot` group shape.
 * Skips rows with a null/undefined category or a non-numeric outcome. Sorted by
 * category for a stable render.
 */
export function groupOutcomeByFactor(
  rows: ReadonlyArray<DataRow>,
  factor: string,
  outcome: string
): Array<{ category: string; values: number[] }> {
  const map = new Map<string, number[]>();
  for (const row of rows) {
    const cat = row[factor];
    const y = toNumericValue(row[outcome]);
    if (cat === null || cat === undefined || y === undefined) continue;
    const key = String(cat);
    const arr = map.get(key);
    if (arr) arr.push(y);
    else map.set(key, [y]);
  }
  return Array.from(map.entries())
    .map(([category, values]) => ({ category, values }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
```

- [ ] **Step 4: Export from the findings barrel**

In `packages/core/src/findings/index.ts`, add (near the `miniChart` export block, ~line 88):

```ts
export { deriveScatterFitData, groupOutcomeByFactor } from './factorChartData';
export type { ScatterFitData } from './factorChartData';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @variscout/core test src/findings/__tests__/factorChartData.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/findings/factorChartData.ts packages/core/src/findings/__tests__/factorChartData.test.ts packages/core/src/findings/index.ts
git commit -m "feat(core): deriveScatterFitData + groupOutcomeByFactor for the per-factor triad chart"
```

---

## Task 2: MiniScatterFit component (ui)

**Files:**

- Create: `packages/ui/src/components/AnalyzeWall/MiniScatterFit.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx`

**Context:** A fixed-dimension inline SVG, the sibling of `MiniIChart`/`MiniBoxplot` (NOT a wrapper of the full-size `ScatterFit`, which has axes and is illegible at mini scale). It paints point markers + a fitted line. Line colour follows significance, mirroring the full-size `ScatterFit` convention (`chartColors.pass` when significant, a muted token otherwise). These components are package-internal (siblings are not exported from a barrel), so no `index.ts` change.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/ui/src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniScatterFit } from '../MiniScatterFit';

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

describe('MiniScatterFit', () => {
  it('renders one marker per point and a fitted line when provided', () => {
    renderInSvg(
      <MiniScatterFit
        points={[
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 5 },
        ]}
        fittedLine={[
          { x: 1, y: 2 },
          { x: 3, y: 5 },
        ]}
        isSignificant
        width={200}
        height={56}
      />
    );
    expect(screen.getByTestId('mini-scatter-fit')).toBeInTheDocument();
    expect(screen.getAllByTestId('mini-scatter-fit-point')).toHaveLength(3);
    expect(screen.getByTestId('mini-scatter-fit-line')).toBeInTheDocument();
  });

  it('NEGATIVE CONTROL: renders points but NO line element when fittedLine is null', () => {
    renderInSvg(
      <MiniScatterFit
        points={[
          { x: 1, y: 2 },
          { x: 2, y: 4 },
        ]}
        fittedLine={null}
        isSignificant={false}
        width={200}
        height={56}
      />
    );
    expect(screen.getAllByTestId('mini-scatter-fit-point')).toHaveLength(2);
    // Proves the line is data-driven, not always-drawn.
    expect(screen.queryByTestId('mini-scatter-fit-line')).toBeNull();
  });

  it('renders nothing when there are no points', () => {
    renderInSvg(
      <MiniScatterFit points={[]} fittedLine={null} isSignificant={false} width={200} height={56} />
    );
    expect(screen.queryByTestId('mini-scatter-fit')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx`
Expected: FAIL — `MiniScatterFit` module not found.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// packages/ui/src/components/AnalyzeWall/MiniScatterFit.tsx
import { useChartTheme, chartColors } from '@variscout/charts';

export interface MiniScatterFitPoint {
  x: number;
  y: number;
}

export interface MiniScatterFitProps {
  points: MiniScatterFitPoint[];
  /** The OLS fitted line endpoints, or null when not fittable (no line drawn). */
  fittedLine: MiniScatterFitPoint[] | null;
  /** Significant → the fitted line uses the pass colour; else a muted stroke. */
  isSignificant: boolean;
  width: number;
  height: number;
}

/**
 * Fixed-dimension inline-SVG scatter + regression line for the test-plan triad
 * (PR-CS-9). Sibling of MiniIChart / MiniBoxplot — NOT a wrapper of the full-size
 * ScatterFit. Paints point markers + a data-driven fitted line.
 */
export function MiniScatterFit({
  points,
  fittedLine,
  isSignificant,
  width,
  height,
}: MiniScatterFitProps) {
  const theme = useChartTheme();

  const finite = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (finite.length === 0) return null;

  // Domain spans the points AND the fitted-line endpoints so the line never clips.
  const xs = [...finite.map(p => p.x), ...(fittedLine ?? []).map(p => p.x)];
  const ys = [...finite.map(p => p.y), ...(fittedLine ?? []).map(p => p.y)];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const xFor = (x: number) => Math.round(((x - xMin) / xRange) * width * 10) / 10;
  const yFor = (y: number) => Math.round((height - ((y - yMin) / yRange) * height) * 10) / 10;

  const lineColor = isSignificant ? chartColors.pass : theme.chrome.labelMuted;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="mini scatter fit"
      data-testid="mini-scatter-fit"
    >
      {finite.map((p, i) => (
        <circle
          key={i}
          data-testid="mini-scatter-fit-point"
          cx={xFor(p.x)}
          cy={yFor(p.y)}
          r={1.75}
          fill={theme.colors.control}
          opacity={0.7}
        />
      ))}
      {fittedLine && fittedLine.length > 1 && (
        <line
          data-testid="mini-scatter-fit-line"
          x1={xFor(fittedLine[0].x)}
          y1={yFor(fittedLine[0].y)}
          x2={xFor(fittedLine[fittedLine.length - 1].x)}
          y2={yFor(fittedLine[fittedLine.length - 1].y)}
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx`
Expected: PASS (3 tests). If `useChartTheme` requires no provider (it falls back to the default palette, like its use in `MiniIChart`), no wrapper is needed.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/MiniScatterFit.tsx packages/ui/src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx
git commit -m "feat(ui): MiniScatterFit — fixed-dimension inline scatter + regression line"
```

---

## Task 3: Render the chart inline in the triad row (ui)

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.triadChart.test.tsx`

**Context:** The card receives `testPlanFactors: TestPlanFactorView[]` and renders, per factor, the name + tool label + Evaluate button + the FE-2b "try to break it" machinery — but **no chart**. We extend `TestPlanFactorView` with an optional precomputed `chart` payload and render it (scatter → `MiniScatterFit`, boxplot → `MiniBoxplot`) when present, growing the foreignObject row-height math. The card stays presentational: it does NOT compute chart data. `WallCanvas` (Task 4) supplies `chart` only for the focused hub.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.triadChart.test.tsx
vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HypothesisCardWithPlans, type TestPlanFactorView } from '../HypothesisCardWithPlans';
import type { Hypothesis, Finding } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';

const hub: Hypothesis = {
  id: 'h1',
  name: 'Night shift runs hot',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-1',
};
const findings: Finding[] = [];
function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}
const baseProps = {
  hub,
  displayStatus: hub.status,
  x: 100,
  y: 100,
  plans: [],
  members: [] as ProjectMember[],
  currentUserId: null,
  findings,
  onAddPlan: vi.fn(),
  onLinkFinding: vi.fn(),
  onEditPlan: vi.fn(),
};

describe('HypothesisCardWithPlans — triad inline chart (PR-CS-9)', () => {
  it('renders a chart ONLY for ready factors that carry a chart payload', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      {
        factor: 'TEMP',
        readiness: 'ready',
        tool: 'regression',
        chart: {
          kind: 'scatter',
          points: [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 5 },
          ],
          fittedLine: [
            { x: 1, y: 2 },
            { x: 3, y: 5 },
          ],
          isSignificant: true,
        },
      },
      // NEGATIVE CONTROL A: ready but NO chart payload (e.g. hub not focused) → no chart.
      { factor: 'SHIFT', readiness: 'ready', tool: 'two-sample' },
      // NEGATIVE CONTROL B: a gap factor → the plan affordance, never a chart.
      { factor: 'OPERATOR', readiness: 'gap', tool: null },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    expect(screen.getByTestId('triad-chart-TEMP')).toBeInTheDocument();
    expect(screen.getByTestId('mini-scatter-fit')).toBeInTheDocument();
    expect(screen.queryByTestId('triad-chart-SHIFT')).toBeNull();
    expect(screen.queryByTestId('triad-chart-OPERATOR')).toBeNull();
    expect(screen.getByTestId('plan-factor-OPERATOR')).toBeInTheDocument();
  });

  it('renders a boxplot chart for a two-sample factor that carries a boxplot payload', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      {
        factor: 'SHIFT',
        readiness: 'ready',
        tool: 'two-sample',
        chart: {
          kind: 'boxplot',
          groups: [
            { category: 'Day', values: [10, 11, 12, 13, 14, 15, 16] },
            { category: 'Night', values: [30, 31, 32, 33, 34, 35, 36] },
          ],
        },
      },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    const wrap = screen.getByTestId('triad-chart-SHIFT');
    expect(wrap).toBeInTheDocument();
    expect(screen.getByLabelText('mini boxplot')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.triadChart.test.tsx`
Expected: FAIL — `chart` is not a property of `TestPlanFactorView`; `triad-chart-TEMP` not rendered.

- [ ] **Step 3: Extend the type + add the chart type + imports**

In `HypothesisCardWithPlans.tsx`, add the imports near the other AnalyzeWall imports (~line 28):

```tsx
import { MiniBoxplot } from './MiniBoxplot';
import { MiniScatterFit } from './MiniScatterFit';
```

Replace the `TestPlanFactorView` interface (currently ~lines 272-277) with:

```tsx
/** A scatter/boxplot chart payload for a triad row (precomputed by the parent). */
export type TriadFactorChart =
  | {
      kind: 'scatter';
      points: Array<{ x: number; y: number }>;
      fittedLine: Array<{ x: number; y: number }> | null;
      isSignificant: boolean;
    }
  | { kind: 'boxplot'; groups: Array<{ category: string; values: number[] }> };

/** A single test-plan triad row passed to the card (FE-2a). */
export interface TestPlanFactorView {
  factor: string;
  readiness: 'ready' | 'gap';
  tool: 'two-sample' | 'regression' | 'capability' | null;
  /**
   * PR-CS-9 — the precomputed inline chart for this factor (spec §4.0 "see the
   * chart"). Populated by the parent (WallCanvas) ONLY for the focused hub, so the
   * charts are summoned onto a focused hypothesis, not always-on. Undefined → no
   * inline chart for this row.
   */
  chart?: TriadFactorChart;
}
```

- [ ] **Step 4: Add the chart dimension constants + grow the row-height math**

Add these constants near the other triad constants (~line 63, after `TEST_PLAN_ROW_H`):

```tsx
/** PR-CS-9 — inline triad chart dimensions (px). */
const TRIAD_CHART_W = 240;
const TRIAD_CHART_H = 56;
/** PR-CS-9 — extra height a triad row gains when it carries an inline chart (chart + gap). */
const TEST_PLAN_CHART_H = 64;
```

In the `testPlanRowsH` reduce (~lines 394-401), add a chart-height term inside the `ready` branch:

```tsx
const testPlanRowsH = (testPlanFactors ?? []).reduce((sum, tp) => {
  let rowH = TEST_PLAN_ROW_H;
  if (tp.readiness === 'ready') {
    if (tp.chart) rowH += TEST_PLAN_CHART_H;
    if (breakItByFactor[tp.factor]) rowH += BREAK_IT_EXPANSION_H;
    if (confoundByFactor?.[tp.factor]) rowH += CONFOUND_PROMPT_H;
  }
  return sum + rowH;
}, 0);
```

- [ ] **Step 5: Render the chart in the triad row**

In the triad row JSX, immediately AFTER the `<div className="flex items-center gap-2">…</div>` block that holds the factor label + Evaluate/plan buttons (i.e. right after its closing `</div>` at ~line 602, before the "Try to break it" `{tp.readiness === 'ready' && onEvaluateFactor && (` label), insert:

```tsx
{
  /* PR-CS-9 — the inline stat chart (spec §4.0 "sees the
                            actual chart"). Present only for a ready factor whose
                            parent supplied a chart payload (focused hub). */
}
{
  tp.readiness === 'ready' && tp.chart && (
    <div className="mt-1" data-testid={`triad-chart-${tp.factor}`}>
      {tp.chart.kind === 'scatter' ? (
        <MiniScatterFit
          points={tp.chart.points}
          fittedLine={tp.chart.fittedLine}
          isSignificant={tp.chart.isSignificant}
          width={TRIAD_CHART_W}
          height={TRIAD_CHART_H}
        />
      ) : (
        <MiniBoxplot groups={tp.chart.groups} width={TRIAD_CHART_W} height={TRIAD_CHART_H} />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.triadChart.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Guard the existing triad tests still pass**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.testPlan.test.tsx`
Expected: PASS (unchanged — the existing tests pass `testPlanFactors` with no `chart`, so no chart renders).

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.triadChart.test.tsx
git commit -m "feat(ui): render the per-factor stat chart inline in the triad row"
```

---

## Task 4: Compute the chart payload for the focused hub only (ui)

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.triadFocus.seam.test.tsx`

**Context:** `WallCanvas` already builds `testPlanFactors` per hub in the `hubTriadById` memo (~line 413) and has `rows` / `outcomeColumn` / `focusedWallEntityId` (~line 571). We add a focus-gated memo that computes the `chart` payload for the focused hub's ready factors only, and merge it into that hub's `testPlanFactors` in `renderHubAt`. This keeps the expensive per-factor regression off non-focused hubs.

- [ ] **Step 1: Write the failing seam test**

```tsx
// packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.triadFocus.seam.test.tsx
/**
 * PR-CS-9 focus-gate seam: the per-factor stat chart renders ONLY for the focused
 * hub. Two hubs naming distinct factors; focusing one must surface its chart and
 * NOT the other's (the load-bearing negative control — an always-on render fails).
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi, act } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasPlanningProps } from '../WallCanvas';
import {
  getCanvasViewportInitialState,
  useViewStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { DataRow, Hypothesis } from '@variscout/core';

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState({ focusedWallEntityId: null });
});

// Hub A names SHIFT (categorical → boxplot); Hub B names TEMP (continuous → scatter).
function hubA(): Hypothesis {
  const h = createHypothesis('Night shift runs hot', '', []);
  return {
    ...h,
    id: 'hub-A',
    condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
  };
}
function hubB(): Hypothesis {
  const h = createHypothesis('Hotter runs vary', '', []);
  return { ...h, id: 'hub-B', condition: { kind: 'leaf', column: 'TEMP', op: 'gte', value: 30 } };
}
function rows(): DataRow[] {
  return [
    { SHIFT: 'Day', TEMP: 20.4, Y: 10 },
    { SHIFT: 'Day', TEMP: 21.7, Y: 11 },
    { SHIFT: 'Day', TEMP: 22.1, Y: 12 },
    { SHIFT: 'Day', TEMP: 23.9, Y: 13 },
    { SHIFT: 'Day', TEMP: 24.3, Y: 14 },
    { SHIFT: 'Night', TEMP: 30.6, Y: 30 },
    { SHIFT: 'Night', TEMP: 31.2, Y: 31 },
    { SHIFT: 'Night', TEMP: 32.8, Y: 32 },
    { SHIFT: 'Night', TEMP: 33.5, Y: 33 },
    { SHIFT: 'Night', TEMP: 34.1, Y: 34 },
  ];
}
function planningProps(overrides?: Partial<WallCanvasPlanningProps>): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [],
    currentUserId: null,
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

describe('WallCanvas — triad chart focus gate (PR-CS-9)', () => {
  it('renders triad charts ONLY for the focused hub', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hubA(), hubB()]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={planningProps({ onEvaluateFactor: vi.fn() })}
      />
    );
    // No hub focused → no charts anywhere.
    expect(screen.queryByTestId('triad-chart-SHIFT')).toBeNull();
    expect(screen.queryByTestId('triad-chart-TEMP')).toBeNull();

    // Focus hub A → A's SHIFT chart appears; B's TEMP chart does NOT (the gate).
    act(() => {
      useViewStore.setState({ focusedWallEntityId: 'hub-A' });
    });
    expect(screen.getByTestId('triad-chart-SHIFT')).toBeInTheDocument();
    expect(screen.queryByTestId('triad-chart-TEMP')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/WallCanvas.triadFocus.seam.test.tsx`
Expected: FAIL — no `triad-chart-SHIFT` renders even when hub-A is focused (the chart payload is never computed/threaded).

- [ ] **Step 3: Import the core derivations + the chart type**

In `WallCanvas.tsx`, add to the `@variscout/core/findings` value import the two derivations (it currently imports `buildHypothesisTestPlan` ~line 39):

```tsx
import { deriveScatterFitData, groupOutcomeByFactor } from '@variscout/core/findings';
```

And add the chart type to the existing type import from `./HypothesisCardWithPlans` (~line 56, alongside `EvaluateFactorOptions, ConfoundRivalView`):

```tsx
import type {
  EvaluateFactorOptions,
  ConfoundRivalView,
  TriadFactorChart,
} from './HypothesisCardWithPlans';
```

- [ ] **Step 4: Add the focus-gated chart memo**

Immediately AFTER the `focusedWallEntityId` selector (~line 571: `const focusedWallEntityId = useViewStore(s => s.focusedWallEntityId);`), add:

```tsx
// PR-CS-9 — compute the per-factor stat chart for the FOCUSED hub's ready
// factors only (spec §4.0 "summoned onto a focused hypothesis, not always-on").
// The regression fit only runs for the one focused hub, keeping the Wall cheap.
const focusedTriadCharts = useMemo(() => {
  const map = new Map<string, TriadFactorChart>();
  if (!focusedWallEntityId || !outcomeColumn || !rows) return map;
  const triad = hubTriadById.get(focusedWallEntityId);
  if (!triad?.testPlanFactors) return map;
  const chartRows = [...rows] as DataRow[];
  for (const tp of triad.testPlanFactors) {
    if (tp.readiness !== 'ready' || !tp.tool) continue;
    if (tp.tool === 'regression') {
      const sf = deriveScatterFitData(chartRows, tp.factor, outcomeColumn);
      map.set(tp.factor, {
        kind: 'scatter',
        points: sf.points,
        fittedLine: sf.fittedLine,
        isSignificant: sf.isSignificant,
      });
    } else {
      // two-sample (and the reserved capability tool) → boxplot of the outcome
      // grouped by the factor's levels.
      map.set(tp.factor, {
        kind: 'boxplot',
        groups: groupOutcomeByFactor(chartRows, tp.factor, outcomeColumn),
      });
    }
  }
  return map;
}, [focusedWallEntityId, hubTriadById, rows, outcomeColumn]);
```

- [ ] **Step 5: Merge the chart payload into the focused hub's triad in `renderHubAt`**

In `renderHubAt` (~line 907), replace:

```tsx
const hubTriad = hubTriadById.get(hub.id);
const hubTestPlanFactors = hubTriad?.testPlanFactors;
```

with:

```tsx
const hubTriad = hubTriadById.get(hub.id);
// PR-CS-9 — enrich the focused hub's triad rows with their precomputed charts.
const hubTestPlanFactors =
  hub.id === focusedWallEntityId && hubTriad?.testPlanFactors
    ? hubTriad.testPlanFactors.map(tp =>
        focusedTriadCharts.has(tp.factor) ? { ...tp, chart: focusedTriadCharts.get(tp.factor) } : tp
      )
    : hubTriad?.testPlanFactors;
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/WallCanvas.triadFocus.seam.test.tsx`
Expected: PASS.

- [ ] **Step 7: Guard the existing WallCanvas triad seam test still passes**

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/WallCanvas.testPlan.seam.test.tsx`
Expected: PASS (unchanged — those tests never focus a hub, so no chart renders).

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/WallCanvas.tsx packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.triadFocus.seam.test.tsx
git commit -m "feat(ui): summon the per-factor stat chart on the focused hub (focus-gated)"
```

---

## Task 5: In-PR doc amendments

**Files:**

- Modify: `docs/superpowers/specs/2026-05-31-factors-evaluation-design.md`
- Modify: `docs/decision-log.md`

- [ ] **Step 1: Amend the FE-2 spec.** In the section describing the per-factor triad / FE-2 charts, add a short note that the inline "see-the-chart" step is now delivered (PR-CS-9): the triad row renders a scatter+regression `MiniScatterFit` (continuous) or `MiniBoxplot` (categorical), focus-gated to the active hypothesis; Cp/Cpk remains deferred. Mirror the wording style of the existing CS-8 amendment in this file.

- [ ] **Step 2: Add a decision-log entry** (new dated entry at the top of the relevant section):

```markdown
- **2026-06-03 — PR-CS-9 (per-factor triad: see-the-chart) scope, locked with owner.** The triad engine, regression/two-sample routing, the disconfirmation gesture, and run-and-attach all already shipped (grounding); CS-9's only delta was rendering the chart in the reasoning flow, focus-gated. Decisions: (a) **defer Cp/Cpk** + its spread trigger to a follow-up (engine has no spread-detection); (b) **keep the existing run-and-attach** — the explicit analyst-owned call is CS-10's de-automation; (c) **no new `FindingSource` variant** (evaluate findings stay source-less); (d) no new i18n (hardcoded mini-chart aria-labels). Also corrected the stale `core/CLAUDE.md` "5 FindingSource variants" → 4 structural / 5 chart-discriminant values.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-05-31-factors-evaluation-design.md docs/decision-log.md
git commit -m "docs(cs-9): FE-2 see-the-chart delivered + decision-log scope note"
```

---

## After all tasks (controller, not a subagent task)

1. `bash scripts/pr-ready-check.sh` — must be green.
2. Final whole-branch code review (Opus subagent; STEP 0 = check out the PR branch). Adversarial: confirm each new test is load-bearing (negative controls actually discriminate); confirm no `Math.random`/`.toFixed()` on stat outputs in core; confirm the card stays presentational.
3. **Visually verify on a 13–15″ viewport with `--chrome`** (laptop rule): focus a hypothesis, confirm the inline scatter/boxplot renders legibly in the triad row and the card extension grows without clipping (overflow-visible).
4. `gh pr merge --merge --delete-branch` (NOT --squash).
5. Post-merge on main: flip this sub-plan's `status: draft → delivered`; close out the master-plan PR-CS-9 entry (delivered + build record + any corrections); update memory.

---

## Self-Review

**Spec coverage (§4.0 convergent node):**

- "right stat by data type" — already shipped (`suggestToolForFactor`); CS-9 untouched. ✓
- "sees the actual chart" — Tasks 1–4 (the delta). ✓
- "explicit support/counts-against call → typed Finding" — already shipped (run-and-attach); de-automation is CS-10. ✓ (scope-locked)
- "disconfirmation = same gesture" — already shipped (FE-2b). ✓
- "ride the Focus lens / LOD, not always-on" — Task 4 focus-gate. ✓
- "spread → Cp/Cpk" — **deferred** (owner decision). Documented in Task 5. ✓

**Type consistency:** `TestPlanFactorView.chart?: TriadFactorChart` defined in Task 3, imported + populated in Task 4. `ScatterFitData` (core) → mapped to `{kind:'scatter',...}` in Task 4. `groupOutcomeByFactor` returns `{category, values}[]` = `MiniBoxplot`'s `MiniBoxplotGroup[]` = the boxplot payload. `MiniScatterFit` props (`points`, `fittedLine`, `isSignificant`, `width`, `height`) match the scatter payload + the Task 3 call site. ✓

**Placeholder scan:** every code step has complete code; every test has explicit assertions incl. negative controls; exact paths + commands throughout. ✓

**Load-bearing tests (per `feedback_load_bearing_tests`):** Task 1 — constant-factor (`SIZE`) → no fitted line; Task 2 — `fittedLine: null` → no line element; Task 3 — ready-but-no-chart + gap factors render no chart; Task 4 — two-hub gate (focused hub's chart present, other absent). Each is a distractor the correct behaviour must reject. ✓
