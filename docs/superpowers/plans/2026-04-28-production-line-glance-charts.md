---
title: Production-Line-Glance — Chart Components Layer (Plan B)
audience: [engineer, architect]
category: implementation
status: delivered
related: [production-line-glance-design, production-line-glance-engine]
date: 2026-04-28
---

# Production-Line-Glance — Chart Components Layer (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the chart-components layer for the production-line-glance dashboard — `CapabilityBoxplot` (per-node Cpk distribution with sample-confidence badges + per-node target ticks), `StepErrorPareto` (per-step ranked errors), `CapabilityGapTrendChart` (Δ(Cp-Cpk)-over-time), plus the 2×2 dashboard composition (`ProductionLineGlanceDashboard`) and its `FilterStrip` in `@variscout/ui`. No surface wiring (LayeredProcessView / Process Hub / FRAME) — that is Plan C.

**Architecture:** Three new chart primitives in `@variscout/charts` consume the engine outputs from PR #103 (`NodeCapabilityResult`, `IChartDataPoint`, `ParetoDataPoint`). The dashboard in `@variscout/ui` composes them in a 2×2 grid plus a filter strip, with the top-left slot reusing the existing `IChart` component for Cpk-vs-target trending. Components are pure props-based per ADR-005 — no fetching, no store reads, no context. Per-category target ticks and n-confidence badges are drawn as overlays inside `CapabilityBoxplotBase`, not by extending `BoxplotBase`'s prop surface (keeping the general `Boxplot` API unchanged).

**Tech Stack:** TypeScript, React, visx, `@variscout/charts`, `@variscout/ui`, Vitest, React Testing Library. Skills: `editing-charts`, `writing-tests`. Hard rules per `packages/charts/CLAUDE.md`: no hardcoded hex colors (use `chartColors` / `chromeColors` from `colors.ts`); no manual `React.memo()`; export both responsive wrapper (`Foo`) and `FooBase`; props interfaces named `{ComponentName}Props`; theme via `useChartTheme()`.

**Spec reference:** `docs/superpowers/specs/2026-04-28-production-line-glance-design.md` — sections "Single-hub production-line-glance dashboard" (lines 239–287) and "Verification" (lines 352–361) define what Plan B must deliver.

**Engine reference (already merged on main, PR #103):**

- `packages/core/src/stats/nodeCapability.ts` — `calculateNodeCapability()`, `NodeCapabilityResult`, `CalculateNodeCapabilitySource`
- `packages/core/src/stats/sampleConfidence.ts` — `sampleConfidenceFor()`, `SampleConfidence` (`'trust' | 'review' | 'insufficient'`), `SAMPLE_CONFIDENCE_THRESHOLDS`
- `packages/core/src/stats/specRuleLookup.ts` — `lookupSpecRule()`, `ruleMatches()`, `ruleSpecificity()`
- `packages/core/src/types.ts` — `SpecRule`, `SpecLookupContext`, `SpecLimits`
- All re-exported from `@variscout/core/stats`

**Critical existing chart files (read before adding new ones):**

- `packages/charts/src/Boxplot.tsx` — `BoxplotBase`, `MIN_BOXPLOT_VALUES = 7`, dot-plot fallback
- `packages/charts/src/ParetoChart.tsx` — `ParetoChartBase`, Top-N + Others handling
- `packages/charts/src/IChart.tsx` — `IChartBase`, `secondaryData`/`secondaryStats`/`primaryLabel` props
- `packages/charts/src/PerformanceBoxplot.tsx`, `packages/charts/src/PerformancePareto.tsx`, `packages/charts/src/PerformanceIChart.tsx` — patterns for capability-aware variants
- `packages/charts/src/colors.ts` — `chartColors`, `chromeColors` (no hex literals anywhere else)
- `packages/charts/src/useChartTheme.ts` — theme hook
- `packages/charts/src/index.ts` — barrel exports
- `packages/charts/src/types.ts` — props interfaces

**Critical UI patterns:**

- `packages/ui/src/components/DashboardBase/` — existing dashboard layout primitive
- Tailwind v4 `@source` directive must include any new component path used by an app (per `editing-monorepo-structure` skill); UI package classes are auto-discovered when imported.

**Out of scope for this plan (deferred):**

- **Plan C** — wiring the dashboard into LayeredProcessView Operations band, Process Hub view, and FRAME workspace; data hooks that build `CapabilityBoxplotNode[]` / `StepErrorParetoStep[]` / `gapSeries` from a hub + investigations.
- **Plan D** — cross-hub context-filtered view at Org Hub-of-Hubs (multi-child rendering, "context dimension absent" treatment).
- **W4–W7** — terminology drift, governance docs, ADR amendments, observed-vs-expected paragraph (already merged separately).
- **Mobile responsive specifics** — covered by Layered Process View V2 implementation in Plan C.
- **Live-preview pane in FRAME workspace** — Plan C feature; the chart components support it via props but the wiring is out of scope.

**Rules of engagement:**

- Each task is one PR-worthy commit. TDD: failing test first, then minimal implementation, then green.
- No back-compat shims for internal package APIs (per `feedback_no_backcompat_clean_architecture.md`). Required props by default; refactor consumers in the same task.
- Float assertions use `toBeCloseTo(expected, precision)`.
- Tests use deterministic data fixtures, never `Math.random`.
- Pre-package builds: `pnpm --filter @variscout/charts test` and `pnpm --filter @variscout/ui test` after each task; full workspace build (`pnpm build`) before final commit.
- `feedback_ui_build_before_merge.md` — `@variscout/ui` `tsc --noEmit` runs in pr-ready-check before merge.

---

## File structure (lock decisions before tasks)

### `packages/charts/src/` — new files

- `CapabilityBoxplot.tsx` — `CapabilityBoxplotBase` + responsive `CapabilityBoxplot`. Wraps `BoxplotBase` and overlays per-node target ticks + n-confidence badges. Accepts `nodes: CapabilityBoxplotNode[]`.
- `StepErrorPareto.tsx` — `StepErrorParetoBase` + responsive `StepErrorPareto`. Wraps `ParetoChartBase` with step-name X-axis. Accepts `steps: StepErrorParetoStep[]`.
- `CapabilityGapTrendChart.tsx` — `CapabilityGapTrendChartBase` + responsive `CapabilityGapTrendChart`. Thin wrapper around `IChartBase` configured for Δ(Cp-Cpk) gap-as-series. Accepts `gapSeries`, `gapStats`.

### `packages/charts/src/__tests__/` — new test files

- `CapabilityBoxplot.test.tsx`
- `StepErrorPareto.test.tsx`
- `CapabilityGapTrendChart.test.tsx`

### `packages/charts/src/` — modified files

- `types.ts` — append `CapabilityBoxplotProps`, `CapabilityBoxplotNode`, `StepErrorParetoProps`, `StepErrorParetoStep`, `CapabilityGapTrendChartProps`.
- `index.ts` — export the three new components + their base variants + their prop types.

### `packages/ui/src/components/ProductionLineGlanceDashboard/` — new directory

- `ProductionLineGlanceDashboard.tsx` — 2×2 layout container.
- `ProductionLineGlanceFilterStrip.tsx` — hub-level + tributary-grouped context-value chips.
- `types.ts` — local prop types (re-exports for convenience).
- `index.ts` — barrel.

### `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/` — new test files

- `ProductionLineGlanceDashboard.test.tsx`
- `ProductionLineGlanceFilterStrip.test.tsx`

### `packages/ui/src/index.ts` — modified

- Export `ProductionLineGlanceDashboard`, `ProductionLineGlanceFilterStrip`, and their prop types.

---

## Task 1: Add chart prop types to `@variscout/charts/types`

**Files:**

- Modify: `packages/charts/src/types.ts` (append after the existing `PerformanceParetoProps` block)

- [ ] **Step 1: Read existing types**

Run: `cat packages/charts/src/types.ts | head -240`
Note the import line at top: `from '@variscout/core'`. We need to import `NodeCapabilityResult`, `SampleConfidence`, `SpecLookupContext` here.

- [ ] **Step 2: Add the imports and types**

Open `packages/charts/src/types.ts` and:

(a) Add to the existing import from `@variscout/core` (the import block near the top):

```typescript
import type {
  // ...existing imports stay
  NodeCapabilityResult,
  SampleConfidence,
  SpecLookupContext,
} from '@variscout/core';
```

If those aren't yet exported from the core barrel, add a separate sub-path import:

```typescript
import type { NodeCapabilityResult, SampleConfidence } from '@variscout/core/stats';
import type { SpecLookupContext } from '@variscout/core';
```

(Verify by running `pnpm --filter @variscout/charts tsc --noEmit` after step 4 — fix the import path if TS complains.)

(b) Append at the end of `types.ts`:

```typescript
// ============================================================================
// Production-Line-Glance chart props (Plan B)
// ============================================================================

/**
 * Per-node input for `CapabilityBoxplot`. One entry → one box (or jittered
 * dot cluster when n<7) on the chart's X-axis.
 */
export interface CapabilityBoxplotNode {
  /** Stable node identifier from the canonical ProcessMap. */
  nodeId: string;
  /** Display label (the node's `label`). */
  label: string;
  /**
   * Target Cpk to draw as a per-node tick line. Resolved upstream by Plan C
   * data wiring (e.g., dominant context's `targetCpk` or filtered context).
   * Optional — when undefined, no tick is drawn for that node.
   */
  targetCpk?: number;
  /** Engine output for this node. */
  result: NodeCapabilityResult;
}

export interface CapabilityBoxplotProps extends BaseChartProps {
  /** Nodes to render, in display order (left → right). */
  nodes: ReadonlyArray<CapabilityBoxplotNode>;
  /**
   * Hide the per-node target ticks. Defaults to `false` (ticks visible).
   * Useful for cross-hub overlays where targets vary per child hub.
   */
  hideTargetTicks?: boolean;
  /** Override the Y-axis label. Defaults to "Cpk". */
  yAxisLabel?: string;
}

/**
 * Per-step input for `StepErrorPareto`. Bars rank by `errorCount` descending.
 */
export interface StepErrorParetoStep {
  /** Stable node identifier from the canonical ProcessMap. */
  nodeId: string;
  /** Display label (the node's `label`). */
  label: string;
  /** Total errors observed at this step within the active filter. */
  errorCount: number;
  /**
   * Optional per-step error breakdown for tooltips. Categories are not
   * required to be sorted; the chart sorts them internally.
   */
  errorCategories?: ReadonlyArray<{ category: string; count: number }>;
}

export interface StepErrorParetoProps extends BaseChartProps {
  /** Steps to rank. The chart sorts them by `errorCount` descending. */
  steps: ReadonlyArray<StepErrorParetoStep>;
  /** Override the Y-axis label. Defaults to "Errors". */
  yAxisLabel?: string;
  /**
   * Maximum bars to render before aggregating into "Others". Defaults to
   * `PARETO_MAX_CATEGORIES` (20) — same default as `ParetoChartBase`.
   */
  maxBars?: number;
  /** Click handler — called with the step's `nodeId`. */
  onStepClick?: (nodeId: string) => void;
}

export interface CapabilityGapTrendChartProps extends BaseChartProps {
  /**
   * The Δ(Cp-Cpk) series, one point per snapshot. Plan C builds this from
   * per-snapshot `cp - cpk` arithmetic.
   */
  gapSeries: ReadonlyArray<IChartDataPoint>;
  /** Stats (mean, sd, ucl, lcl) computed on the gap series. */
  gapStats: StatsResult | null;
  /** Override the Y-axis label. Defaults to "Δ(Cp-Cpk)". */
  yAxisLabel?: string;
  /** Override the target line label. Defaults to "0" (perfect centering). */
  targetLabel?: string;
}
```

(c) Make sure `StatsResult` is in scope. If the file already imports it from `@variscout/core`, no change. Otherwise add it to the existing import group.

- [ ] **Step 3: Run typecheck (no test yet — these are pure types)**

Run: `pnpm --filter @variscout/charts tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Re-export the new types from `index.ts`**

Open `packages/charts/src/index.ts`. In the `export type { ... } from './types';` block (the first block, near the top), add:

```typescript
  CapabilityBoxplotProps,
  CapabilityBoxplotNode,
  StepErrorParetoProps,
  StepErrorParetoStep,
  CapabilityGapTrendChartProps,
```

- [ ] **Step 5: Verify exports**

Run: `pnpm --filter @variscout/charts tsc --noEmit`
Expected: PASS (still — no consumers yet).

- [ ] **Step 6: Commit**

```bash
git add packages/charts/src/types.ts packages/charts/src/index.ts
git commit -m "feat(charts): add prop types for production-line-glance charts (Plan B)

CapabilityBoxplotProps + CapabilityBoxplotNode for per-node Cpk distribution.
StepErrorParetoProps + StepErrorParetoStep for per-step error ranking.
CapabilityGapTrendChartProps for the Δ(Cp-Cpk)-as-series I-Chart variant.

No components yet — types only, foundation for the next three tasks.
See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
section 'Single-hub production-line-glance dashboard'."
```

---

## Task 2: Implement `CapabilityGapTrendChart`

The simplest of the three new charts — a thin wrapper around `IChartBase` configured for Δ(Cp-Cpk). Doing this first proves the pattern and shakes out any prop-type bugs before the more complex `CapabilityBoxplot`.

**Files:**

- Create: `packages/charts/src/CapabilityGapTrendChart.tsx`
- Create: `packages/charts/src/__tests__/CapabilityGapTrendChart.test.tsx`
- Modify: `packages/charts/src/index.ts` (add component exports)

- [ ] **Step 1: Write failing tests**

Create `packages/charts/src/__tests__/CapabilityGapTrendChart.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityGapTrendChartBase } from '../CapabilityGapTrendChart';
import type { IChartDataPoint } from '../types';

const makeGapSeries = (n: number): IChartDataPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    x: i,
    y: 0.05 + (i % 3) * 0.02 - 0.04, // small gap oscillations around 0
    originalIndex: i,
  }));

const STATS = { mean: 0.02, stdDev: 0.04, ucl: 0.14, lcl: -0.10, sigma: 0.04 } as const;

describe('CapabilityGapTrendChartBase', () => {
  it('renders an SVG with the gap series', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(20)}
        gapStats={STATS as unknown as Parameters<typeof CapabilityGapTrendChartBase>[0]['gapStats']}
      />
    );
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('uses "Δ(Cp-Cpk)" as default Y-axis label', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(10)}
        gapStats={STATS as never}
      />
    );
    // The Y-axis label is rendered as text inside the SVG
    expect(screen.getByText(/Δ\(Cp-Cpk\)/)).toBeInTheDocument();
  });

  it('honors yAxisLabel prop override', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(10)}
        gapStats={STATS as never}
        yAxisLabel="Centering gap"
      />
    );
    expect(screen.getByText('Centering gap')).toBeInTheDocument();
  });

  it('renders the target=0 line label as "0" by default', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(10)}
        gapStats={STATS as never}
      />
    );
    // IChartBase renders the target label next to the target line. Default "0".
    const labels = screen.getAllByText('0');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders empty state cleanly with zero data points', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={[]}
        gapStats={null}
      />
    );
    // Should still render an SVG without throwing
    expect(document.querySelector('svg')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/charts test CapabilityGapTrendChart`
Expected: FAIL — `Cannot find module '../CapabilityGapTrendChart'`.

- [ ] **Step 3: Implement `CapabilityGapTrendChart.tsx`**

Create `packages/charts/src/CapabilityGapTrendChart.tsx`:

```typescript
/**
 * CapabilityGapTrendChart — Δ(Cp-Cpk) gap as a time series.
 *
 * Answers "is centering loss trending over snapshots?" by plotting the
 * per-snapshot gap (Cp − Cpk) as its own series. Target line at zero
 * represents perfect centering.
 *
 * Wraps IChartBase with capability-specific defaults (target=0, label
 * "Δ(Cp-Cpk)"). See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * top-right slot.
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import IChart, { IChartBase } from './IChart';
import type { CapabilityGapTrendChartProps } from './types';

export const CapabilityGapTrendChartBase: React.FC<CapabilityGapTrendChartProps> = ({
  parentWidth,
  parentHeight,
  gapSeries,
  gapStats,
  yAxisLabel = 'Δ(Cp-Cpk)',
  targetLabel = '0',
  showBranding,
  brandingText,
}) => {
  return (
    <IChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={[...gapSeries]}
      stats={gapStats}
      specs={{ usl: undefined, lsl: undefined, target: 0 }}
      yAxisLabel={yAxisLabel}
      targetLabel={targetLabel}
      showBranding={showBranding}
      brandingText={brandingText}
    />
  );
};

const CapabilityGapTrendChart = withParentSize(CapabilityGapTrendChartBase);
export default CapabilityGapTrendChart;
export { CapabilityGapTrendChart };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/charts test CapabilityGapTrendChart`
Expected: PASS — all 5 cases.

- [ ] **Step 5: Wire exports in `packages/charts/src/index.ts`**

Add to the chart-components section:

```typescript
export {
  default as CapabilityGapTrendChart,
  CapabilityGapTrendChartBase,
} from './CapabilityGapTrendChart';
```

- [ ] **Step 6: Run full charts test suite + typecheck**

Run: `pnpm --filter @variscout/charts test`
Expected: PASS (no regressions).
Run: `pnpm --filter @variscout/charts tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/charts/src/CapabilityGapTrendChart.tsx \
        packages/charts/src/__tests__/CapabilityGapTrendChart.test.tsx \
        packages/charts/src/index.ts
git commit -m "feat(charts): add CapabilityGapTrendChart for Δ(Cp-Cpk)-as-series

Top-right slot of the production-line-glance 2×2 dashboard. Thin wrapper
around IChartBase with target=0 (perfect centering) and 'Δ(Cp-Cpk)'
Y-axis label.

Answers 'is centering loss trending over snapshots?' as a complement to
the existing static dual-series Cp+Cpk capability mode.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
section 'Top-right: Δ(Cp-Cpk) trend i-chart (W3)'."
```

---

## Task 3: Implement `CapabilityBoxplot`

Most complex chart in this plan. Wraps `BoxplotBase` (auto-handles dot fallback at n<7) and overlays per-node target ticks + n-confidence badges. Works against `NodeCapabilityResult.perContextResults`.

**Files:**

- Create: `packages/charts/src/CapabilityBoxplot.tsx`
- Create: `packages/charts/src/__tests__/CapabilityBoxplot.test.tsx`
- Modify: `packages/charts/src/index.ts` (add component exports)

### 3a — Write the test fixtures helper

- [ ] **Step 1: Write failing tests**

Create `packages/charts/src/__tests__/CapabilityBoxplot.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityBoxplotBase } from '../CapabilityBoxplot';
import type { CapabilityBoxplotNode } from '../types';
import type { NodeCapabilityResult } from '@variscout/core/stats';

/**
 * Build a NodeCapabilityResult with N synthetic per-context Cpks.
 * Deterministic: same seed → same values.
 */
function makeNode(opts: {
  nodeId: string;
  label: string;
  cpks: number[];
  totalN: number;
  confidence?: 'trust' | 'review' | 'insufficient';
  targetCpk?: number;
}): CapabilityBoxplotNode {
  const { nodeId, label, cpks, totalN, confidence = 'trust', targetCpk } = opts;
  const result: NodeCapabilityResult = {
    nodeId,
    cpk: cpks.length ? cpks.reduce((a, b) => a + b, 0) / cpks.length : undefined,
    cp: undefined,
    n: totalN,
    sampleConfidence: confidence,
    source: 'column',
    perContextResults: cpks.map((cpk, i) => ({
      contextTuple: { product: `P${i}` },
      cpk,
      cp: undefined,
      n: Math.floor(totalN / cpks.length),
      sampleConfidence: confidence,
    })),
  };
  return { nodeId, label, targetCpk, result };
}

describe('CapabilityBoxplotBase', () => {
  it('renders one X-axis category per node', () => {
    const nodes: CapabilityBoxplotNode[] = [
      makeNode({ nodeId: 'n1', label: 'Mix', cpks: [1.1, 1.3, 1.5, 1.0, 1.4, 1.2, 1.6], totalN: 700 }),
      makeNode({ nodeId: 'n2', label: 'Fill', cpks: [0.9, 1.0, 1.1, 1.2, 0.8, 1.3, 1.0], totalN: 700 }),
      makeNode({ nodeId: 'n3', label: 'Cap', cpks: [1.4, 1.6, 1.5, 1.7, 1.3, 1.6, 1.5], totalN: 700 }),
    ];
    render(<CapabilityBoxplotBase parentWidth={800} parentHeight={400} nodes={nodes} />);
    expect(screen.getByText('Mix')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
    expect(screen.getByText('Cap')).toBeInTheDocument();
  });

  it('uses default "Cpk" Y-axis label', () => {
    const nodes = [
      makeNode({ nodeId: 'n1', label: 'A', cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3], totalN: 700 }),
    ];
    render(<CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />);
    expect(screen.getByText('Cpk')).toBeInTheDocument();
  });

  it('renders a target tick for nodes with targetCpk set', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Mix',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
        targetCpk: 1.33,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="target-tick-n1"]')).toBeTruthy();
  });

  it('omits target tick for nodes without targetCpk', () => {
    const nodes = [
      makeNode({ nodeId: 'n1', label: 'Mix', cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3], totalN: 700 }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="target-tick-n1"]')).toBeFalsy();
  });

  it('hides all target ticks when hideTargetTicks=true', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Mix',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
        targetCpk: 1.33,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase
        parentWidth={600}
        parentHeight={300}
        nodes={nodes}
        hideTargetTicks
      />
    );
    expect(container.querySelector('[data-testid="target-tick-n1"]')).toBeFalsy();
  });

  it('shows a sample-confidence badge on boxes with confidence != trust', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Trust',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
        confidence: 'trust',
      }),
      makeNode({
        nodeId: 'n2',
        label: 'Review',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 25,
        confidence: 'review',
      }),
      makeNode({
        nodeId: 'n3',
        label: 'Insufficient',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 8,
        confidence: 'insufficient',
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={800} parentHeight={400} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="confidence-badge-n1"]')).toBeFalsy();
    expect(container.querySelector('[data-testid="confidence-badge-n2"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="confidence-badge-n3"]')).toBeTruthy();
  });

  it('renders boxes for nodes with n>=7 distinct context Cpks', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Boxed',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    // BoxplotBase renders <rect>s for boxes (per visx implementation)
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
  });

  it('falls back to dot plot for nodes with fewer than 7 context Cpks', () => {
    // Per `editing-charts` skill: BoxplotBase auto-uses jittered dots when
    // a category has < MIN_BOXPLOT_VALUES (7) data points. CapabilityBoxplot
    // inherits this behavior for free.
    const nodes = [
      makeNode({ nodeId: 'n1', label: 'Sparse', cpks: [1.0, 1.2, 1.4], totalN: 300 }),
    ];
    render(<CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />);
    expect(screen.getByText('Sparse')).toBeInTheDocument();
  });

  it('skips nodes with no usable per-context Cpks (all undefined)', () => {
    const node: CapabilityBoxplotNode = {
      nodeId: 'empty',
      label: 'Empty',
      result: {
        nodeId: 'empty',
        n: 0,
        sampleConfidence: 'insufficient',
        source: 'column',
        perContextResults: [],
      },
    };
    const filled = makeNode({
      nodeId: 'n1',
      label: 'Fill',
      cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
      totalN: 700,
    });
    render(
      <CapabilityBoxplotBase parentWidth={800} parentHeight={400} nodes={[node, filled]} />
    );
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
  });

  it('renders empty SVG with zero nodes (no crash)', () => {
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={[]} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/charts test CapabilityBoxplot`
Expected: FAIL — `Cannot find module '../CapabilityBoxplot'`.

### 3b — Implement the component

- [ ] **Step 3: Read `BoxplotBase`'s prop signature**

Run: `grep -n "BoxplotBaseProps\|export const BoxplotBase\|interface BoxplotBaseProps" packages/charts/src/Boxplot.tsx | head -10`

Expected: shows `BoxplotBase`'s props. We feed it `data: BoxplotGroupInput[]` where each group has `{ name, values, ... }`.

- [ ] **Step 4: Implement `CapabilityBoxplot.tsx`**

Create `packages/charts/src/CapabilityBoxplot.tsx`:

```typescript
/**
 * CapabilityBoxplot — per-canonical-node Cpk distribution.
 *
 * Each node renders as one boxplot category (or a jittered dot cluster when
 * the node has fewer than 7 per-context Cpks — BoxplotBase fallback). Adds
 * per-node target Cpk ticks and sample-confidence badges over the box layer.
 *
 * Bottom-left slot of the production-line-glance 2×2 dashboard. See spec
 * docs/superpowers/specs/2026-04-28-production-line-glance-design.md.
 */
import React, { useMemo } from 'react';
import { withParentSize } from '@visx/responsive';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import BoxplotComponent, { BoxplotBase, MIN_BOXPLOT_VALUES } from './Boxplot';
import { useChartTheme } from './useChartTheme';
import { getResponsiveMargins } from './responsive';
import type {
  CapabilityBoxplotProps,
  CapabilityBoxplotNode,
  BoxplotGroupInput,
} from './types';

interface UsableNode {
  node: CapabilityBoxplotNode;
  cpks: number[];
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function extractUsableNodes(nodes: ReadonlyArray<CapabilityBoxplotNode>): UsableNode[] {
  return nodes
    .map((node) => ({
      node,
      cpks: (node.result.perContextResults ?? [])
        .map((r) => r.cpk)
        .filter(isFiniteNumber),
    }))
    .filter((u) => u.cpks.length > 0);
}

function toBoxplotGroups(usable: UsableNode[]): BoxplotGroupInput[] {
  return usable.map(({ node, cpks }) => ({
    name: node.label,
    values: cpks,
  }));
}

function yDomainFor(usable: UsableNode[], targetCpks: number[]): [number, number] {
  const all: number[] = [];
  usable.forEach((u) => all.push(...u.cpks));
  all.push(...targetCpks);
  if (all.length === 0) return [0, 2];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = Math.max((max - min) * 0.1, 0.1);
  return [Math.min(0, min - pad), max + pad];
}

export const CapabilityBoxplotBase: React.FC<CapabilityBoxplotProps> = ({
  parentWidth,
  parentHeight,
  nodes,
  hideTargetTicks = false,
  yAxisLabel = 'Cpk',
  showBranding,
  brandingText,
}) => {
  const theme = useChartTheme();
  const usable = useMemo(() => extractUsableNodes(nodes), [nodes]);
  const groups = useMemo(() => toBoxplotGroups(usable), [usable]);

  const margins = useMemo(
    () => getResponsiveMargins(parentWidth, 'boxplot'),
    [parentWidth]
  );

  const innerWidth = Math.max(parentWidth - margins.left - margins.right, 0);
  const innerHeight = Math.max(parentHeight - margins.top - margins.bottom, 0);

  const targetCpks = useMemo(
    () =>
      usable
        .map((u) => u.node.targetCpk)
        .filter(isFiniteNumber),
    [usable]
  );

  const [yMin, yMax] = useMemo(() => yDomainFor(usable, targetCpks), [usable, targetCpks]);

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: usable.map((u) => u.node.label),
        range: [0, innerWidth],
        paddingInner: 0.4,
        paddingOuter: 0.2,
      }),
    [usable, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [yMin, yMax],
        range: [innerHeight, 0],
        nice: true,
      }),
    [yMin, yMax, innerHeight]
  );

  const bandWidth = xScale.bandwidth();

  return (
    <div style={{ position: 'relative', width: parentWidth, height: parentHeight }}>
      <BoxplotBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        data={groups}
        yAxisLabel={yAxisLabel}
        yDomainOverride={{ min: yMin, max: yMax }}
        showBranding={showBranding}
        brandingText={brandingText}
      />

      {/* Overlay: per-node target ticks + confidence badges */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={parentWidth}
        height={parentHeight}
        aria-hidden="true"
      >
        <Group left={margins.left} top={margins.top}>
          {usable.map(({ node }) => {
            const cx = (xScale(node.label) ?? 0) + bandWidth / 2;
            return (
              <Group key={node.nodeId}>
                {!hideTargetTicks && isFiniteNumber(node.targetCpk) ? (
                  <line
                    data-testid={`target-tick-${node.nodeId}`}
                    x1={cx - bandWidth * 0.45}
                    x2={cx + bandWidth * 0.45}
                    y1={yScale(node.targetCpk!)}
                    y2={yScale(node.targetCpk!)}
                    stroke={theme.colors.target}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                ) : null}

                {node.result.sampleConfidence !== 'trust' ? (
                  <g data-testid={`confidence-badge-${node.nodeId}`}>
                    <circle
                      cx={cx + bandWidth * 0.4}
                      cy={innerHeight + 4}
                      r={6}
                      fill={
                        node.result.sampleConfidence === 'insufficient'
                          ? theme.colors.fail
                          : theme.colors.warn
                      }
                    />
                    <text
                      x={cx + bandWidth * 0.4}
                      y={innerHeight + 7}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill={theme.chrome.background}
                    >
                      n
                    </text>
                  </g>
                ) : null}
              </Group>
            );
          })}
        </Group>
      </svg>
    </div>
  );
};

const CapabilityBoxplot = withParentSize(CapabilityBoxplotBase);
export default CapabilityBoxplot;
export { CapabilityBoxplot, BoxplotComponent, MIN_BOXPLOT_VALUES };
```

**Note:** verify that `theme.colors.target`, `theme.colors.warn`, `theme.colors.fail`, and `theme.chrome.background` exist on the `useChartTheme()` return shape. If a key is missing, swap to whatever the closest semantic color is (read `packages/charts/src/useChartTheme.ts` and `packages/charts/src/colors.ts`). Do NOT add hex literals — only use existing keys.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/charts test CapabilityBoxplot`
Expected: PASS — all 9 cases.

If any test fails because the badge/tick render position is off-screen due to overlay-margin math, adjust the overlay's `Group left/top` to match exactly what `BoxplotBase` uses internally. Read `Boxplot.tsx` for its margin computation if needed.

- [ ] **Step 6: Wire exports in `packages/charts/src/index.ts`**

Add to the chart-components section:

```typescript
export { default as CapabilityBoxplot, CapabilityBoxplotBase } from './CapabilityBoxplot';
```

- [ ] **Step 7: Run full test suite + typecheck**

Run: `pnpm --filter @variscout/charts test`
Expected: PASS.
Run: `pnpm --filter @variscout/charts tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/charts/src/CapabilityBoxplot.tsx \
        packages/charts/src/__tests__/CapabilityBoxplot.test.tsx \
        packages/charts/src/index.ts
git commit -m "feat(charts): add CapabilityBoxplot for per-node Cpk distribution

Bottom-left slot of the production-line-glance 2×2 dashboard. Each node
renders as one boxplot category (or jittered dots when n<7 contexts —
BoxplotBase auto-fallback). Overlay layer adds per-node target Cpk ticks
and sample-confidence badges over the box layer.

Watson 'Cpks aren't additive across heterogeneous local processes' is
preserved structurally: the chart visualizes the distribution without
ever collapsing per-context Cpks to a single aggregate.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
section 'Bottom-left: Per-step Cpk boxplot (W1\\')'."
```

---

## Task 4: Implement `StepErrorPareto`

Bottom-right slot. Wraps `ParetoChartBase` with step-as-category semantics. Top-N + Others is delegated to the underlying base.

**Files:**

- Create: `packages/charts/src/StepErrorPareto.tsx`
- Create: `packages/charts/src/__tests__/StepErrorPareto.test.tsx`
- Modify: `packages/charts/src/index.ts` (add component exports)

- [ ] **Step 1: Read `ParetoChartBase` props**

Run: `grep -n "ParetoChartProps\|interface ParetoChartProps\|ParetoChartBase\b" packages/charts/src/types.ts packages/charts/src/ParetoChart.tsx | head -20`

Note: `ParetoDataPoint` is `{ category: string; count: number }` (or similar). Read the existing definition to be sure.

- [ ] **Step 2: Write failing tests**

Create `packages/charts/src/__tests__/StepErrorPareto.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepErrorParetoBase } from '../StepErrorPareto';
import type { StepErrorParetoStep } from '../types';

const steps: StepErrorParetoStep[] = [
  { nodeId: 'n1', label: 'Mix', errorCount: 12 },
  { nodeId: 'n2', label: 'Fill', errorCount: 47 },
  { nodeId: 'n3', label: 'Cap', errorCount: 5 },
  { nodeId: 'n4', label: 'Label', errorCount: 22 },
];

describe('StepErrorParetoBase', () => {
  it('renders one bar per step, sorted by errorCount descending', () => {
    render(<StepErrorParetoBase parentWidth={800} parentHeight={400} steps={steps} />);
    const labels = screen.getAllByText(/^(Mix|Fill|Cap|Label)$/);
    // The first label rendered should be the highest-count step
    expect(labels[0].textContent).toBe('Fill');
  });

  it('uses default "Errors" Y-axis label', () => {
    render(<StepErrorParetoBase parentWidth={800} parentHeight={400} steps={steps} />);
    expect(screen.getByText('Errors')).toBeInTheDocument();
  });

  it('honors yAxisLabel override', () => {
    render(
      <StepErrorParetoBase
        parentWidth={800}
        parentHeight={400}
        steps={steps}
        yAxisLabel="Defects"
      />
    );
    expect(screen.getByText('Defects')).toBeInTheDocument();
  });

  it('aggregates beyond maxBars into "Others"', () => {
    const many: StepErrorParetoStep[] = Array.from({ length: 25 }, (_, i) => ({
      nodeId: `n${i}`,
      label: `Step${i}`,
      errorCount: 100 - i,
    }));
    render(
      <StepErrorParetoBase parentWidth={1000} parentHeight={400} steps={many} maxBars={5} />
    );
    // Pareto base renders an "Others" category when count exceeds maxBars
    expect(screen.getByText(/Others/i)).toBeInTheDocument();
  });

  it('omits "Others" when steps.length <= maxBars', () => {
    render(
      <StepErrorParetoBase parentWidth={800} parentHeight={400} steps={steps} maxBars={20} />
    );
    expect(screen.queryByText(/Others/i)).not.toBeInTheDocument();
  });

  it('fires onStepClick with nodeId when a bar is clicked', () => {
    const onStepClick = vi.fn();
    render(
      <StepErrorParetoBase
        parentWidth={800}
        parentHeight={400}
        steps={steps}
        onStepClick={onStepClick}
      />
    );
    const fillLabel = screen.getByText('Fill');
    fireEvent.click(fillLabel);
    expect(onStepClick).toHaveBeenCalledWith('n2');
  });

  it('renders empty state cleanly with no steps', () => {
    const { container } = render(
      <StepErrorParetoBase parentWidth={600} parentHeight={300} steps={[]} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('drops steps with errorCount=0', () => {
    const mixed: StepErrorParetoStep[] = [
      { nodeId: 'n1', label: 'Has', errorCount: 5 },
      { nodeId: 'n2', label: 'Zero', errorCount: 0 },
    ];
    render(<StepErrorParetoBase parentWidth={600} parentHeight={300} steps={mixed} />);
    expect(screen.getByText('Has')).toBeInTheDocument();
    expect(screen.queryByText('Zero')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @variscout/charts test StepErrorPareto`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `StepErrorPareto.tsx`**

Create `packages/charts/src/StepErrorPareto.tsx`:

```typescript
/**
 * StepErrorPareto — process steps ranked by error count.
 *
 * Bottom-right slot of the production-line-glance 2×2 dashboard. Bars are
 * one process step each, sorted by `errorCount` descending. Top-N + "Others"
 * aggregation is inherited from ParetoChartBase (ADR-051).
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * section 'Bottom-right: Per-step error Pareto (W1\')'.
 */
import React, { useMemo } from 'react';
import { withParentSize } from '@visx/responsive';
import ParetoChart, { ParetoChartBase } from './ParetoChart';
import type {
  StepErrorParetoProps,
  StepErrorParetoStep,
  ParetoDataPoint,
} from './types';

const PARETO_MAX_CATEGORIES = 20;

interface SortedStep extends StepErrorParetoStep {}

function sortAndFilterSteps(steps: ReadonlyArray<StepErrorParetoStep>): SortedStep[] {
  return [...steps]
    .filter((s) => Number.isFinite(s.errorCount) && s.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount);
}

function toParetoData(
  sorted: SortedStep[],
  maxBars: number
): { points: ParetoDataPoint[]; labelToNodeId: Map<string, string> } {
  const labelToNodeId = new Map<string, string>();
  if (sorted.length <= maxBars) {
    sorted.forEach((s) => labelToNodeId.set(s.label, s.nodeId));
    return {
      points: sorted.map((s) => ({ category: s.label, count: s.errorCount })),
      labelToNodeId,
    };
  }
  const head = sorted.slice(0, maxBars - 1);
  const tail = sorted.slice(maxBars - 1);
  head.forEach((s) => labelToNodeId.set(s.label, s.nodeId));
  const othersCount = tail.reduce((sum, s) => sum + s.errorCount, 0);
  return {
    points: [
      ...head.map((s) => ({ category: s.label, count: s.errorCount })),
      { category: 'Others', count: othersCount },
    ],
    labelToNodeId,
  };
}

export const StepErrorParetoBase: React.FC<StepErrorParetoProps> = ({
  parentWidth,
  parentHeight,
  steps,
  yAxisLabel = 'Errors',
  maxBars = PARETO_MAX_CATEGORIES,
  onStepClick,
  showBranding,
  brandingText,
}) => {
  const sorted = useMemo(() => sortAndFilterSteps(steps), [steps]);
  const { points, labelToNodeId } = useMemo(
    () => toParetoData(sorted, maxBars),
    [sorted, maxBars]
  );

  const handleCategoryClick = (category: string) => {
    if (!onStepClick) return;
    const nodeId = labelToNodeId.get(category);
    if (nodeId) onStepClick(nodeId);
  };

  return (
    <ParetoChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={points}
      yAxisLabel={yAxisLabel}
      othersKey="Others"
      onCategoryClick={handleCategoryClick}
      showBranding={showBranding}
      brandingText={brandingText}
    />
  );
};

const StepErrorPareto = withParentSize(StepErrorParetoBase);
export default StepErrorPareto;
export { StepErrorPareto, ParetoChart };
```

**Note:** verify that `ParetoChartBase` accepts `onCategoryClick` and `othersKey` props. If the prop names differ (e.g., `onBarClick`, `othersLabel`), use the actual names from `packages/charts/src/ParetoChart.tsx`. Do not invent prop names.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/charts test StepErrorPareto`
Expected: PASS — all 8 cases.

If the click test fails because the click target is the bar `<rect>` rather than the label `<text>`, update the test to dispatch on the bar instead. Match the test to the actual base component, not the other way round.

- [ ] **Step 6: Wire exports in `packages/charts/src/index.ts`**

```typescript
export { default as StepErrorPareto, StepErrorParetoBase } from './StepErrorPareto';
```

- [ ] **Step 7: Run full test suite + typecheck**

Run: `pnpm --filter @variscout/charts test`
Expected: PASS.
Run: `pnpm --filter @variscout/charts tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/charts/src/StepErrorPareto.tsx \
        packages/charts/src/__tests__/StepErrorPareto.test.tsx \
        packages/charts/src/index.ts
git commit -m "feat(charts): add StepErrorPareto for per-step error ranking

Bottom-right slot of the production-line-glance 2×2 dashboard. Bars are
process steps ranked descending by error count; Top-N + Others aggregation
is inherited from ParetoChartBase (ADR-051).

Click handler reports the clicked step's nodeId so consumers can drill
into the step in Plan C.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md."
```

---

## Task 5: Implement `ProductionLineGlanceFilterStrip`

Hub-level chips at the top, tributary-grouped chips below. Pure controlled component — Plan C owns the data fetching.

**Files:**

- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceFilterStrip.tsx`
- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceFilterStrip.test.tsx`

- [ ] **Step 1: Confirm UI package test runner**

Run: `cat packages/ui/package.json | grep -A1 '"test"'`
Note the configured test runner. UI package uses Vitest + RTL.

- [ ] **Step 2: Write failing tests**

Create `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceFilterStrip.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceFilterStrip } from '../ProductionLineGlanceFilterStrip';
import type { SpecLookupContext } from '@variscout/core';

describe('ProductionLineGlanceFilterStrip', () => {
  const baseProps = {
    availableContext: {
      hubColumns: ['product', 'shift'],
      tributaryGroups: [
        { tributaryLabel: 'Steel', columns: ['supplier'] },
        { tributaryLabel: 'Paint', columns: ['paintClass'] },
      ],
    },
    contextValueOptions: {
      product: ['Coke 12oz', 'Coke 16oz', 'Sprite 12oz'],
      shift: ['A', 'B', 'C'],
      supplier: ['TightCorp', 'WideCorp'],
      paintClass: ['Standard', 'Premium'],
    },
    value: {} as SpecLookupContext,
    onChange: vi.fn(),
  };

  it('renders one group per hub-level column', () => {
    render(<ProductionLineGlanceFilterStrip {...baseProps} />);
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('shift')).toBeInTheDocument();
  });

  it('renders tributary groups below hub-level groups, with tributary label header', () => {
    render(<ProductionLineGlanceFilterStrip {...baseProps} />);
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('Paint')).toBeInTheDocument();
    expect(screen.getByText('supplier')).toBeInTheDocument();
    expect(screen.getByText('paintClass')).toBeInTheDocument();
  });

  it('shows the current value as a selected chip', () => {
    render(
      <ProductionLineGlanceFilterStrip
        {...baseProps}
        value={{ product: 'Coke 12oz', supplier: 'TightCorp' }}
      />
    );
    const cokeChip = screen.getByRole('button', { name: /Coke 12oz/ });
    expect(cokeChip).toHaveAttribute('aria-pressed', 'true');
    const tightChip = screen.getByRole('button', { name: /TightCorp/ });
    expect(tightChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange with merged context when a chip is clicked', () => {
    const onChange = vi.fn();
    render(<ProductionLineGlanceFilterStrip {...baseProps} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Coke 12oz/ }));
    expect(onChange).toHaveBeenCalledWith({ product: 'Coke 12oz' });
  });

  it('clears a column when the active chip is clicked again', () => {
    const onChange = vi.fn();
    render(
      <ProductionLineGlanceFilterStrip
        {...baseProps}
        value={{ product: 'Coke 12oz' }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Coke 12oz/ }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('preserves other column selections when changing one column', () => {
    const onChange = vi.fn();
    render(
      <ProductionLineGlanceFilterStrip
        {...baseProps}
        value={{ shift: 'A' }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Coke 12oz/ }));
    expect(onChange).toHaveBeenCalledWith({ shift: 'A', product: 'Coke 12oz' });
  });

  it('renders nothing when no columns and no tributaries are configured', () => {
    const { container } = render(
      <ProductionLineGlanceFilterStrip
        availableContext={{ hubColumns: [] }}
        contextValueOptions={{}}
        value={{}}
        onChange={vi.fn()}
      />
    );
    // The wrapper still exists but has no chip buttons
    expect(container.querySelectorAll('button').length).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceFilterStrip`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `ProductionLineGlanceFilterStrip.tsx`**

Create `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceFilterStrip.tsx`:

```typescript
/**
 * ProductionLineGlanceFilterStrip — context-value chip selector.
 *
 * Hub-level chips render in a top row; tributary-attached chips render
 * below grouped under their tributary label. Pure controlled component;
 * Plan C owns the data fetching that produces `contextValueOptions`.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * section 'Filter strip'.
 */
import React from 'react';
import type { SpecLookupContext } from '@variscout/core';

export interface ProductionLineGlanceFilterStripProps {
  availableContext: {
    hubColumns: string[];
    tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
  };
  /** column name → list of available values for that column */
  contextValueOptions: Record<string, string[]>;
  value: SpecLookupContext;
  onChange: (next: SpecLookupContext) => void;
}

function toggleValue(
  current: SpecLookupContext,
  column: string,
  value: string
): SpecLookupContext {
  const isActive = current[column] === value;
  const next = { ...current };
  if (isActive) {
    delete next[column];
  } else {
    next[column] = value;
  }
  return next;
}

interface ColumnChipsProps {
  column: string;
  options: string[];
  selectedValue: string | null | undefined;
  onSelect: (value: string) => void;
}

const ColumnChips: React.FC<ColumnChipsProps> = ({ column, options, selectedValue, onSelect }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{column}</span>
    {options.map((opt) => {
      const isActive = selectedValue === opt;
      return (
        <button
          key={opt}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(opt)}
          className={
            isActive
              ? 'rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white'
              : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
          }
        >
          {opt}
        </button>
      );
    })}
  </div>
);

export const ProductionLineGlanceFilterStrip: React.FC<ProductionLineGlanceFilterStripProps> = ({
  availableContext,
  contextValueOptions,
  value,
  onChange,
}) => {
  const { hubColumns, tributaryGroups = [] } = availableContext;
  const hubHasContent = hubColumns.length > 0;
  const tribHasContent = tributaryGroups.some((g) => g.columns.length > 0);

  if (!hubHasContent && !tribHasContent) {
    return <div data-testid="filter-strip-empty" className="h-0" />;
  }

  const handleSelect = (column: string, opt: string) => {
    onChange(toggleValue(value, column, opt));
  };

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      {hubHasContent ? (
        <div className="flex flex-wrap gap-4">
          {hubColumns.map((col) => (
            <ColumnChips
              key={col}
              column={col}
              options={contextValueOptions[col] ?? []}
              selectedValue={value[col] ?? null}
              onSelect={(opt) => handleSelect(col, opt)}
            />
          ))}
        </div>
      ) : null}

      {tributaryGroups.map((group) =>
        group.columns.length > 0 ? (
          <div key={group.tributaryLabel} className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {group.tributaryLabel}
            </span>
            <div className="flex flex-wrap gap-4 pl-3">
              {group.columns.map((col) => (
                <ColumnChips
                  key={col}
                  column={col}
                  options={contextValueOptions[col] ?? []}
                  selectedValue={value[col] ?? null}
                  onSelect={(opt) => handleSelect(col, opt)}
                />
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default ProductionLineGlanceFilterStrip;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceFilterStrip`
Expected: PASS — all 7 cases.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceFilterStrip.tsx \
        packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceFilterStrip.test.tsx
git commit -m "feat(ui): add ProductionLineGlanceFilterStrip

Hub-level + tributary-attached context-value chip selector for the
production-line-glance dashboard. Pure controlled component — Plan C
owns the data fetching that produces contextValueOptions.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
section 'Filter strip'."
```

---

## Task 6: Implement `ProductionLineGlanceDashboard` (2×2 composition)

The user-visible surface that composes the four chart slots + filter strip. Pure props-based.

**Files:**

- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx`
- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts`
- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/index.ts`
- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx`
- Modify: `packages/ui/src/index.ts` (add exports)

- [ ] **Step 1: Define the dashboard prop types**

Create `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts`:

```typescript
import type {
  CapabilityBoxplotNode,
  StepErrorParetoStep,
  IChartDataPoint,
} from '@variscout/charts';
import type { StatsResult, SpecLimits, SpecLookupContext } from '@variscout/core';

export interface ProductionLineGlanceDashboardProps {
  /** Top-left slot: line-level Cpk-vs-target time series. */
  cpkTrend: {
    data: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
    specs: SpecLimits;
  };
  /** Top-right slot: Δ(Cp-Cpk) gap over time. */
  cpkGapTrend: {
    series: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
  };
  /** Bottom-left slot: per-node Cpk distribution. */
  capabilityNodes: ReadonlyArray<CapabilityBoxplotNode>;
  /** Bottom-right slot: per-step error ranking. */
  errorSteps: ReadonlyArray<StepErrorParetoStep>;

  /** Filter strip data + state. Optional — strip hidden when omitted. */
  filter?: {
    availableContext: {
      hubColumns: string[];
      tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
    };
    contextValueOptions: Record<string, string[]>;
    value: SpecLookupContext;
    onChange: (next: SpecLookupContext) => void;
  };

  /** Click handler for a step bar in the bottom-right Pareto. */
  onStepClick?: (nodeId: string) => void;

  /** Optional title shown above the dashboard. */
  title?: string;
}
```

- [ ] **Step 2: Write failing tests**

Create `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';

// CRITICAL: vi.mock() BEFORE component imports — see project memory.
// We mock the chart components so this test asserts composition only,
// not visx rendering. Wrap mocked vars in a factory closure (per
// `feedback_vi_mock_hoist_closure.md`) — direct top-level assignment
// breaks at hoist time.
vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    IChart: ({ data }: { data: unknown[] }) =>
      React.createElement('div', { 'data-testid': 'mock-cpk-trend' }, `IChart:${data.length}`),
    CapabilityGapTrendChart: ({ gapSeries }: { gapSeries: unknown[] }) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-gap-trend' },
        `Gap:${gapSeries.length}`
      ),
    CapabilityBoxplot: ({ nodes }: { nodes: unknown[] }) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-capability-boxplot' },
        `Boxplot:${nodes.length}`
      ),
    StepErrorPareto: ({
      steps,
      onStepClick,
    }: {
      steps: { nodeId: string; label: string }[];
      onStepClick?: (id: string) => void;
    }) =>
      React.createElement(
        'div',
        {
          'data-testid': 'mock-step-pareto',
          onClick: () => onStepClick?.(steps[0]?.nodeId ?? 'none'),
        },
        `Pareto:${steps.length}`
      ),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceDashboard } from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../types';

const baseProps: ProductionLineGlanceDashboardProps = {
  cpkTrend: {
    data: [{ x: 0, y: 1.2, originalIndex: 0 }],
    stats: null,
    specs: { target: 1.33 },
  },
  cpkGapTrend: {
    series: [{ x: 0, y: 0.05, originalIndex: 0 }],
    stats: null,
  },
  capabilityNodes: [],
  errorSteps: [{ nodeId: 'n1', label: 'Mix', errorCount: 4 }],
};

describe('ProductionLineGlanceDashboard', () => {
  it('renders all four chart slots', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} />);
    expect(screen.getByTestId('mock-cpk-trend')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gap-trend')).toBeInTheDocument();
    expect(screen.getByTestId('mock-capability-boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-pareto')).toBeInTheDocument();
  });

  it('passes correct data lengths to each slot', () => {
    render(
      <ProductionLineGlanceDashboard
        {...baseProps}
        capabilityNodes={[
          {
            nodeId: 'n1',
            label: 'Mix',
            result: { nodeId: 'n1', n: 100, sampleConfidence: 'trust', source: 'column' },
          },
        ]}
      />
    );
    expect(screen.getByTestId('mock-capability-boxplot').textContent).toBe('Boxplot:1');
    expect(screen.getByTestId('mock-step-pareto').textContent).toBe('Pareto:1');
  });

  it('renders the filter strip when filter prop provided', () => {
    render(
      <ProductionLineGlanceDashboard
        {...baseProps}
        filter={{
          availableContext: { hubColumns: ['product'] },
          contextValueOptions: { product: ['A', 'B'] },
          value: {},
          onChange: vi.fn(),
        }}
      />
    );
    expect(screen.getByText('product')).toBeInTheDocument();
  });

  it('omits the filter strip when filter prop is absent', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} />);
    expect(screen.queryByText('product')).not.toBeInTheDocument();
  });

  it('renders the title when provided', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} title="Plant 1 — Line A" />);
    expect(screen.getByText('Plant 1 — Line A')).toBeInTheDocument();
  });

  it('forwards onStepClick to the Pareto', () => {
    const onStepClick = vi.fn();
    render(<ProductionLineGlanceDashboard {...baseProps} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByTestId('mock-step-pareto'));
    expect(onStepClick).toHaveBeenCalledWith('n1');
  });

  it('shows an empty-state hint when capabilityNodes is empty', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} capabilityNodes={[]} />);
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceDashboard`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `ProductionLineGlanceDashboard.tsx`**

Create `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx`:

```typescript
/**
 * ProductionLineGlanceDashboard — 2×2 composition of capability slots.
 *
 * | Cpk vs target i-chart | Δ(Cp-Cpk) trend       |
 * | Per-step Cpk boxplot  | Per-step error Pareto |
 *
 * Pure props-based composition — Plan C owns the data wiring that produces
 * the four slot inputs. The top-left slot reuses the existing `IChart`
 * component from @variscout/charts; the other three use the new W1'/W3
 * components from this package.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * section 'Single-hub production-line-glance dashboard'.
 */
import React from 'react';
import {
  IChart,
  CapabilityGapTrendChart,
  CapabilityBoxplot,
  StepErrorPareto,
} from '@variscout/charts';
import { ProductionLineGlanceFilterStrip } from './ProductionLineGlanceFilterStrip';
import type { ProductionLineGlanceDashboardProps } from './types';

export const ProductionLineGlanceDashboard: React.FC<ProductionLineGlanceDashboardProps> = ({
  cpkTrend,
  cpkGapTrend,
  capabilityNodes,
  errorSteps,
  filter,
  onStepClick,
  title,
}) => {
  return (
    <div className="flex h-full w-full flex-col">
      {title ? (
        <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        </div>
      ) : null}

      {filter ? (
        <ProductionLineGlanceFilterStrip
          availableContext={filter.availableContext}
          contextValueOptions={filter.contextValueOptions}
          value={filter.value}
          onChange={filter.onChange}
        />
      ) : null}

      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-px bg-slate-200 dark:bg-slate-700">
        <div
          data-testid="slot-cpk-trend"
          className="bg-white p-3 dark:bg-slate-900"
        >
          <IChart
            data={[...cpkTrend.data]}
            stats={cpkTrend.stats}
            specs={cpkTrend.specs}
            yAxisLabel="Cpk"
          />
        </div>

        <div
          data-testid="slot-cpk-gap"
          className="bg-white p-3 dark:bg-slate-900"
        >
          <CapabilityGapTrendChart
            gapSeries={cpkGapTrend.series}
            gapStats={cpkGapTrend.stats}
          />
        </div>

        <div
          data-testid="slot-capability-boxplot"
          className="bg-white p-3 dark:bg-slate-900"
        >
          {capabilityNodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              No mapped nodes — per-step capability unavailable.
            </div>
          ) : (
            <CapabilityBoxplot nodes={capabilityNodes} />
          )}
        </div>

        <div
          data-testid="slot-step-pareto"
          className="bg-white p-3 dark:bg-slate-900"
        >
          <StepErrorPareto steps={errorSteps} onStepClick={onStepClick} />
        </div>
      </div>
    </div>
  );
};

export default ProductionLineGlanceDashboard;
```

- [ ] **Step 5: Create the barrel `index.ts`**

Create `packages/ui/src/components/ProductionLineGlanceDashboard/index.ts`:

```typescript
export { ProductionLineGlanceDashboard, default } from './ProductionLineGlanceDashboard';
export { ProductionLineGlanceFilterStrip } from './ProductionLineGlanceFilterStrip';
export type { ProductionLineGlanceFilterStripProps } from './ProductionLineGlanceFilterStrip';
export type { ProductionLineGlanceDashboardProps } from './types';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceDashboard`
Expected: PASS — all 7 cases.

- [ ] **Step 7: Wire exports in `packages/ui/src/index.ts`**

Append:

```typescript
export {
  ProductionLineGlanceDashboard,
  ProductionLineGlanceFilterStrip,
} from './components/ProductionLineGlanceDashboard';
export type {
  ProductionLineGlanceDashboardProps,
  ProductionLineGlanceFilterStripProps,
} from './components/ProductionLineGlanceDashboard';
```

- [ ] **Step 8: Run full UI tests + typecheck**

Run: `pnpm --filter @variscout/ui test`
Expected: PASS (no regressions).
Run: `pnpm --filter @variscout/ui tsc --noEmit`
Expected: PASS — this is the gate that catches cross-package type-export gaps per `feedback_ui_build_before_merge.md`.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx \
        packages/ui/src/components/ProductionLineGlanceDashboard/types.ts \
        packages/ui/src/components/ProductionLineGlanceDashboard/index.ts \
        packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx \
        packages/ui/src/index.ts
git commit -m "feat(ui): add ProductionLineGlanceDashboard 2×2 composition

User-visible surface for the production-line-glance dashboard. Pure
props-based composition of four chart slots:
- Top-left: IChart (Cpk vs target trend) — reuse
- Top-right: CapabilityGapTrendChart (Δ(Cp-Cpk) gap)
- Bottom-left: CapabilityBoxplot (per-node Cpk distribution)
- Bottom-right: StepErrorPareto (per-step error ranking)

ProductionLineGlanceFilterStrip is composed in when filter prop is provided.
Plan C owns the data wiring that produces the four slot inputs and the
filter context options.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
section 'Single-hub production-line-glance dashboard'."
```

---

## Task 7: Workspace verification

End-to-end check that everything compiles, tests pass, and the new exports are usable from any consumer.

**Files:**

- Create: `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/integration.test.tsx`

- [ ] **Step 1: Write integration test using real chart components**

This test hits the actual chart components (no mocks) to catch any prop-shape drift between Plan B's chart components and the dashboard composition. Use deterministic fixtures.

Create `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/integration.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductionLineGlanceDashboard } from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../types';
import type { NodeCapabilityResult } from '@variscout/core/stats';

const STATS = { mean: 1.2, stdDev: 0.1, ucl: 1.5, lcl: 0.9, sigma: 0.1 } as never;
const GAP_STATS = { mean: 0.02, stdDev: 0.04, ucl: 0.14, lcl: -0.1, sigma: 0.04 } as never;

const cpks = [1.1, 1.3, 1.5, 1.0, 1.4, 1.2, 1.6];
const result: NodeCapabilityResult = {
  nodeId: 'n1',
  cpk: 1.3,
  cp: 1.4,
  n: 700,
  sampleConfidence: 'trust',
  source: 'column',
  perContextResults: cpks.map((cpk, i) => ({
    contextTuple: { product: `P${i}` },
    cpk,
    n: 100,
    sampleConfidence: 'trust',
  })),
};

const props: ProductionLineGlanceDashboardProps = {
  cpkTrend: {
    data: Array.from({ length: 10 }, (_, i) => ({ x: i, y: 1.2 + (i % 3) * 0.05, originalIndex: i })),
    stats: STATS,
    specs: { target: 1.33 },
  },
  cpkGapTrend: {
    series: Array.from({ length: 10 }, (_, i) => ({ x: i, y: 0.05 - (i % 3) * 0.02, originalIndex: i })),
    stats: GAP_STATS,
  },
  capabilityNodes: [
    { nodeId: 'n1', label: 'Mix', targetCpk: 1.33, result },
  ],
  errorSteps: [
    { nodeId: 'n1', label: 'Mix', errorCount: 12 },
    { nodeId: 'n2', label: 'Fill', errorCount: 47 },
  ],
};

describe('ProductionLineGlanceDashboard — integration', () => {
  it('renders all four real chart components without errors', () => {
    // No mocks — real charts. happy-dom resize doesn't fire visx ResizeObserver
    // by default, so we render with explicit sizing on a wrapper.
    const { container } = render(
      <div style={{ width: 1024, height: 768 }}>
        <ProductionLineGlanceDashboard {...props} />
      </div>
    );
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('renders empty-state hint when capabilityNodes is empty', () => {
    render(
      <div style={{ width: 1024, height: 768 }}>
        <ProductionLineGlanceDashboard {...props} capabilityNodes={[]} />
      </div>
    );
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });

  it('renders filter strip with hub-level + tributary chips', () => {
    render(
      <div style={{ width: 1024, height: 768 }}>
        <ProductionLineGlanceDashboard
          {...props}
          filter={{
            availableContext: {
              hubColumns: ['product'],
              tributaryGroups: [{ tributaryLabel: 'Steel', columns: ['supplier'] }],
            },
            contextValueOptions: {
              product: ['Coke 12oz'],
              supplier: ['TightCorp'],
            },
            value: {},
            onChange: vi.fn(),
          }}
        />
      </div>
    );
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('supplier')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `pnpm --filter @variscout/ui test integration`
Expected: PASS — 3 cases.

If a chart component throws under happy-dom because the responsive wrapper sees `parentWidth=0`, switch the test to import the `*Base` variants directly with explicit dimensions, OR set fixed dimensions via `style` on the wrapper div as shown. The dashboard already passes through to `IChart`/`CapabilityBoxplot` etc. (the responsive wrappers); the wrapper-div sizing is what feeds those.

- [ ] **Step 3: Run full workspace tests**

Run: `pnpm test`
Expected: PASS across all packages and apps.

If any test in `apps/pwa` or `apps/azure` fails because they import from `@variscout/charts` or `@variscout/ui` and a barrel mis-exports something, fix the barrel. (Should not happen if Tasks 1, 3, 4, 6 wired exports correctly.)

- [ ] **Step 4: Run full workspace build**

Run: `pnpm build`
Expected: PASS — all 5 packages + 2 apps build.

This catches `tsc` issues that per-package vitest does not (`feedback_ui_build_before_merge.md`).

- [ ] **Step 5: Run pr-ready check**

Run: `bash scripts/pr-ready-check.sh`
Expected: green.

- [ ] **Step 6: Commit (no code changes — just integration test added)**

```bash
git add packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/integration.test.tsx
git commit -m "test(ui): add integration test for ProductionLineGlanceDashboard

Validates the dashboard composition with real chart components (no mocks)
to catch prop-shape drift between Plan B chart components and the
2×2 composition. Closes Plan B verification.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
section 'Verification'."
```

---

## Task 8: PR + subagent code review

- [ ] **Step 1: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "feat: production-line-glance charts (Plan B)" --body "$(cat <<'EOF'
## Summary

- Adds `CapabilityBoxplot`, `StepErrorPareto`, `CapabilityGapTrendChart` to `@variscout/charts`
- Adds `ProductionLineGlanceDashboard` (2×2) and `ProductionLineGlanceFilterStrip` to `@variscout/ui`
- Pure props-based composition; no surface wiring (Plan C) and no cross-hub view (Plan D)

Implements the chart components layer of the production-line-glance dashboard. Engine layer landed in PR #103. Plan C will wire these surfaces into LayeredProcessView, Process Hub view, and FRAME workspace.

## Test plan

- [ ] `pnpm --filter @variscout/charts test` green (3 new chart suites)
- [ ] `pnpm --filter @variscout/ui test` green (2 new UI suites + integration)
- [ ] `pnpm build` green across all packages and apps
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] Independent code review from feature-dev:code-reviewer subagent (per `feedback_subagent_driven_default.md`)

## Spec

`docs/superpowers/specs/2026-04-28-production-line-glance-design.md` — section 'Single-hub production-line-glance dashboard'.

EOF
)"
```

- [ ] **Step 2: Dispatch subagent code review**

Per `feedback_subagent_driven_default.md`, run a `feature-dev:code-reviewer` subagent against this PR before merge. The subagent should focus on:

- Hard-rule conformance: no hex literals in chart code; no manual `React.memo()`; both responsive + Base exports; theme via `useChartTheme()`.
- Watson aggregation safety: no path in this PR introduces a cross-investigation Cp/Cpk arithmetic primitive (per `feedback_aggregation_heterogeneous_specs.md`).
- TDD discipline: tests are written, not asserted-after.
- Prop-type coherence between `@variscout/charts` exports and `@variscout/ui` consumers.
- Empty-state and zero-data crash safety on every chart.
- No `Math.random` anywhere in code or tests.
- Accessibility: filter chips have `aria-pressed`; the dashboard composition reaches keyboard users.
- The dashboard 2×2 keeps the integration test green even when one slot has zero data.

- [ ] **Step 3: Address review findings** in follow-up commits on the same branch (per `feedback_bundle_followups_pre_merge.md` — bundle non-blocking concerns into the open PR).

- [ ] **Step 4: Verify drift before merge**

Run: `git fetch && git log HEAD..origin/main` — if ≥10 commits drift, merge `main` into the branch first per CLAUDE.md.

- [ ] **Step 5: Squash-merge** the PR after green CI + addressed review.

```bash
gh pr merge --squash
```

Don't `--admin` unless an emergency.

---

## Self-review (run before claiming the plan is done)

**Spec coverage check:**

- ✅ "Top-left: Cpk vs target i-chart (reuse)" — Task 6, dashboard reuses existing `IChart`.
- ✅ "Top-right: Δ(Cp-Cpk) trend i-chart (W3)" — Task 2 (`CapabilityGapTrendChart`).
- ✅ "Bottom-left: Per-step Cpk boxplot (W1')" — Task 3 (`CapabilityBoxplot`) with target ticks + n-confidence badges.
- ✅ "Bottom-right: Per-step error Pareto (W1')" — Task 4 (`StepErrorPareto`) with Top-N + Others.
- ✅ "Filter strip" — Task 5 (`ProductionLineGlanceFilterStrip`) with hub-level + tributary-grouped chips.
- ✅ "Sample-size confidence badges (W2)" — Task 3 includes badge for non-trust confidence.
- ✅ "Δ(Cp-Cpk) trend chart renders independently of dual-series chart" — Task 2 is its own thin wrapper.
- ✅ "Single-hub dashboard renders all four charts" — Task 6 + Task 7 integration test.
- ⚠️ "Cross-hub context-filtered view at Org Hub-of-Hubs" — explicitly DEFERRED to Plan D.
- ⚠️ "Migration: existing investigations work with global investigation-level specs" — engine PR #103 already handles this; Plan C wires it into the dashboard's data path.
- ⚠️ Surface wiring (LayeredProcessView Operations band, Process Hub view, FRAME workspace) — DEFERRED to Plan C.

No spec gaps inside Plan B's stated scope. Deferred items are explicitly named in this plan's "Out of scope" section and in the engine plan's follow-up enumeration.

**Placeholder scan:** No `TODO`, `TBD`, "implement later", "add appropriate handling", or "similar to Task N" without code. Each step shows the actual code or command.

**Type consistency check:**

- `CapabilityBoxplotNode.targetCpk` (optional) — used in Task 1 type, Task 3 implementation, Task 7 integration test. Consistent.
- `StepErrorParetoStep.errorCount` (required) — used in Task 1 type, Task 4 implementation, Task 6 dashboard, Task 7 integration test. Consistent.
- `NodeCapabilityResult` shape — imported from `@variscout/core/stats`, matches PR #103 engine output. Consistent.
- `SpecLookupContext` — imported from `@variscout/core`, matches engine type. Consistent.
- `IChartDataPoint`, `StatsResult`, `SpecLimits` — re-exported from `@variscout/core` via `@variscout/charts` types. Consistent.
- `ProductionLineGlanceFilterStripProps` (Task 5) and `ProductionLineGlanceDashboardProps.filter` (Task 6) — the dashboard's `filter` prop carries the same four fields as `ProductionLineGlanceFilterStripProps` minus the strip's own export naming. Consistent.

**Risk reminders for the executor:**

- Verify `useChartTheme()` color keys exist (`target`, `warn`, `fail`, `chrome.background`) before using them in `CapabilityBoxplot`. Read `packages/charts/src/colors.ts` and `useChartTheme.ts` if a key is missing — swap to the closest existing semantic key. NEVER add hex literals.
- Verify `ParetoChartBase` prop names (`onCategoryClick`, `othersKey`) before relying on them. Read `packages/charts/src/ParetoChart.tsx` if uncertain.
- The `CapabilityBoxplot` overlay coordinates assume the same margins as `BoxplotBase`. If the overlay drifts (target tick or badge in the wrong position), align by reading `BoxplotBase`'s margin computation rather than guessing.
- `vi.mock()` calls in Task 6's test must come BEFORE component imports and wrap shared variables in a closure (per `feedback_vi_mock_hoist_closure.md`).
- `pnpm --filter @variscout/ui tsc --noEmit` is the gate that catches cross-package type-export gaps. Run it after every UI task, not just at the end.
- Don't bypass pre-commit hooks (`--no-verify`) per `feedback_subagent_no_verify.md`.
