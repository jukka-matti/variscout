# Mobile Performance & Async Computation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make VariScout performant on mobile devices by adding I-Chart point decimation (LTTB), moving stats computation to a Web Worker, adding React.memo to chart components, and enforcing mobile-specific row limits.

**Architecture:** Stats computation moves from synchronous `useMemo` in `useDataComputation.ts` to an async Web Worker via Comlink. LTTB decimation runs inside the Worker, producing both full stats and display-ready I-Chart data. Charts use stale-while-revalidate pattern — always showing last-known stats with an opacity overlay during recomputation. A generation counter discards stale results from rapid filter clicks.

**Tech Stack:** Comlink (Web Worker RPC), LTTB algorithm, React.memo, Vite ESM workers

**Spec:** `docs/superpowers/specs/2026-03-21-mobile-performance-design.md` (recreated in Task 1)

---

## File Structure

### New Files

| File                                                           | Responsibility                                            |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/core/src/stats/lttb.ts`                              | Pure LTTB decimation algorithm                            |
| `packages/core/src/stats/__tests__/lttb.test.ts`               | LTTB unit tests                                           |
| `packages/core/src/workers/statsWorkerApi.ts`                  | Worker computation — stats, ANOVA, KDE (Comlink-exposed)  |
| `packages/core/src/workers/types.ts`                           | Shared types for Worker API                               |
| `packages/hooks/src/useAsyncStats.ts`                          | Hook replacing sync useMemo stats with async Worker calls |
| `packages/hooks/src/__tests__/useAsyncStats.test.ts`           | Hook tests (mocked Worker)                                |
| `apps/pwa/src/workers/stats.worker.ts`                         | Vite worker entry point (PWA)                             |
| `apps/azure/src/workers/stats.worker.ts`                       | Vite worker entry point (Azure)                           |
| `docs/07-decisions/adr-039-mobile-performance-architecture.md` | ADR document                                              |

### Modified Files

| File                                       | Change                                            |
| ------------------------------------------ | ------------------------------------------------- |
| `packages/core/src/stats/index.ts`         | Export `lttb`                                     |
| `packages/core/src/index.ts`               | Export `lttb` and worker types                    |
| `packages/hooks/src/useDataComputation.ts` | Replace sync stats `useMemo` with `useAsyncStats` |
| `packages/hooks/src/useIChartData.ts`      | Accept optional `decimatedData` override          |
| `packages/charts/src/IChart.tsx`           | Add `React.memo`                                  |
| `packages/charts/src/Boxplot.tsx`          | Add `React.memo`                                  |
| `packages/charts/src/Pareto.tsx`           | Add `React.memo`                                  |
| `packages/charts/src/YamazumiChart.tsx`    | Add `React.memo`                                  |
| `apps/pwa/src/hooks/useDataIngestion.ts`   | Mobile-aware row limits                           |
| `apps/azure/src/hooks/useDataIngestion.ts` | Mobile-aware row limits                           |
| `apps/pwa/vite.config.ts`                  | Worker chunk config                               |
| `apps/azure/vite.config.ts`                | Worker chunk config (if needed)                   |
| Various docs (10 files)                    | See Task 10                                       |

---

## Task 1: Recreate Spec + Create ADR-039

The spec doc was lost during a branch merge. Recreate it, then create the ADR.

**Files:**

- Create: `docs/superpowers/specs/2026-03-21-mobile-performance-design.md`
- Create: `docs/07-decisions/adr-039-mobile-performance-architecture.md`
- Modify: `docs/07-decisions/index.md`

- [ ] **Step 1: Recreate spec document**

Copy the spec content from the plan file at `~/.claude/plans/swift-percolating-bee.md` — the full spec is documented there under the "Original Evaluation" section and the implementation plan section. The spec should contain: Problem statement, 4 Decisions (LTTB, Web Worker, React.memo, Mobile Row Limits), Technical Design, Files to Create/Modify, Documentation Updates, Prerequisites, Verification.

- [ ] **Step 2: Create ADR-039**

Create `docs/07-decisions/adr-039-mobile-performance-architecture.md` with standard ADR format:

```markdown
---
title: 'ADR-039: Mobile Performance & Async Computation Architecture'
---

# ADR-039: Mobile Performance & Async Computation Architecture

**Status**: Accepted

**Date**: 2026-03-21

## Context

VariScout's all-in-browser architecture means the browser is the computation server. On mobile, two problems emerge:

1. I-Chart renders one SVG element per data point. 50K rows = 50K+ DOM nodes, freezing mobile browsers. The industry threshold for smooth interactive SVG is ~1,000-2,000 elements.
2. Stats computation (calculateStats, calculateANOVA, calculateKDE) runs synchronously on the main thread. 50K rows takes <500ms on desktop but 1-2s on mid-tier mobile, freezing all UI interaction.

Desktop multi-window workflows (editor + findings popout + improvement workspace) also benefit from non-blocking computation, and rapid filter clicks currently queue sequential computations when only the final result matters.

## Decision

### 1. LTTB Point Decimation for I-Chart Display

Implement Largest-Triangle-Three-Buckets downsampling. Stats computed from full dataset; rendering uses decimated data. Violation points (UCL/LCL breaches) force-included — never hidden.

### 2. Web Worker for Stats via Comlink

Move statistical computation to a dedicated Web Worker. Singleton lifecycle, structured clone transfer, generation counter cancellation. Stale-while-revalidate UI — charts always show last-known stats.

### 3. React.memo on Chart Base Components

Wrap IChartBase, BoxplotBase, ParetoBase, YamazumiChartBase in React.memo() with custom shallow comparators.

### 4. Mobile-Specific Row Limits

| Platform | Desktop         | Mobile (<640px) |
| -------- | --------------- | --------------- |
| PWA      | 50K (warn 5K)   | 10K (warn 2K)   |
| Azure    | 100K (warn 10K) | 25K (warn 5K)   |

Mobile detection in app-level wrappers via useIsMobile(640), passed as limits parameter to shared useDataIngestion hook.

## Consequences

- Stats consumers must handle async results (stats may be null while computing)
- Charts show stale-while-revalidate overlay during recomputation
- AI context builder already handles null stats — minimal change needed
- Comlink added as dependency (~1.4 KB gzipped)
- Mobile users get lower row limits with clear messaging
```

- [ ] **Step 3: Update ADR index**

Add to `docs/07-decisions/index.md`:

```
| [039](adr-039-mobile-performance-architecture.md) | Mobile Performance & Async Stats | Accepted | 2026-03-21 |
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-03-21-mobile-performance-design.md docs/07-decisions/adr-039-mobile-performance-architecture.md docs/07-decisions/index.md
git commit -m "docs: add ADR-039 mobile performance architecture and recreate design spec"
```

---

## Task 2: LTTB Algorithm

Pure function, no React dependency. TDD.

**Files:**

- Create: `packages/core/src/stats/lttb.ts`
- Create: `packages/core/src/stats/__tests__/lttb.test.ts`
- Modify: `packages/core/src/stats/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/stats/__tests__/lttb.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { lttb } from '../lttb';

describe('lttb', () => {
  const makePoints = (ys: number[]) => ys.map((y, i) => ({ x: i, y, originalIndex: i }));

  it('returns all points when data length <= threshold', () => {
    const data = makePoints([1, 2, 3, 4, 5]);
    const result = lttb(data, 10);
    expect(result).toHaveLength(5);
  });

  it('returns exactly threshold points when data exceeds threshold', () => {
    const data = makePoints(Array.from({ length: 100 }, (_, i) => Math.sin(i / 10)));
    const result = lttb(data, 20);
    expect(result).toHaveLength(20);
  });

  it('always preserves first and last points', () => {
    const data = makePoints([10, 5, 3, 7, 2, 8, 1, 9, 4, 6]);
    const result = lttb(data, 4);
    expect(result[0]).toEqual(data[0]);
    expect(result[result.length - 1]).toEqual(data[data.length - 1]);
  });

  it('preserves visual peaks and valleys', () => {
    // Create data with a clear spike at index 50
    const data = makePoints(Array.from({ length: 100 }, (_, i) => (i === 50 ? 100 : 10)));
    const result = lttb(data, 10);
    // The spike should be preserved
    const maxY = Math.max(...result.map(p => p.y));
    expect(maxY).toBe(100);
  });

  it('force-includes specified indices', () => {
    const data = makePoints(Array.from({ length: 200 }, () => 10));
    // Point 77 is a violation — force include it even in flat data
    data[77] = { x: 77, y: 999, originalIndex: 77 };
    const forceInclude = new Set([77]);
    const result = lttb(data, 10, forceInclude);
    expect(result.some(p => p.originalIndex === 77)).toBe(true);
  });

  it('returns sorted output when force-including points', () => {
    const data = makePoints(Array.from({ length: 100 }, (_, i) => i));
    const forceInclude = new Set([25, 75]);
    const result = lttb(data, 10, forceInclude);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].x).toBeGreaterThan(result[i - 1].x);
    }
  });

  it('handles threshold of 2 (just first and last)', () => {
    const data = makePoints([1, 5, 3, 8, 2]);
    const result = lttb(data, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(data[0]);
    expect(result[1]).toEqual(data[data.length - 1]);
  });

  it('handles empty data', () => {
    const result = lttb([], 10);
    expect(result).toHaveLength(0);
  });

  it('handles single point', () => {
    const data = makePoints([42]);
    const result = lttb(data, 10);
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run lttb`
Expected: FAIL — module `../lttb` does not exist

- [ ] **Step 3: Implement LTTB algorithm**

Create `packages/core/src/stats/lttb.ts`:

```typescript
/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm.
 *
 * Reduces N data points to `threshold` visually representative points
 * while preserving the visual shape (peaks, valleys, trends).
 *
 * Reference: Steinarsson, S. (2013). "Downsampling Time Series for
 * Visual Representation." University of Iceland.
 *
 * @param data - Input points sorted by x
 * @param threshold - Target number of output points
 * @param forceInclude - Set of originalIndex values that must appear in output
 *                       (e.g., control limit violations)
 */
export function lttb<T extends { x: number; y: number; originalIndex: number }>(
  data: T[],
  threshold: number,
  forceInclude?: Set<number>
): T[] {
  const len = data.length;
  if (len <= threshold || threshold <= 2) {
    return len <= threshold ? [...data] : [data[0], data[len - 1]];
  }
  if (len === 0) return [];

  const sampled: T[] = [data[0]]; // Always keep first
  const bucketSize = (len - 2) / (threshold - 2);
  let prevSelected = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, len - 1);

    // Next bucket average (for triangle area calculation)
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len - 1);

    let avgX = 0;
    let avgY = 0;
    let count = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
      count++;
    }
    if (count > 0) {
      avgX /= count;
      avgY /= count;
    }

    // Find point in current bucket with max triangle area
    const prevX = data[prevSelected].x;
    const prevY = data[prevSelected].y;
    let maxArea = -1;
    let maxAreaIdx = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (prevX - avgX) * (data[j].y - prevY) - (prevX - data[j].x) * (avgY - prevY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIdx = j;
      }
    }

    sampled.push(data[maxAreaIdx]);
    prevSelected = maxAreaIdx;
  }

  sampled.push(data[len - 1]); // Always keep last

  // Force-include violation points
  if (forceInclude?.size) {
    const sampledOriginalIndices = new Set(sampled.map(p => p.originalIndex));
    for (const idx of forceInclude) {
      if (!sampledOriginalIndices.has(idx)) {
        const point = data.find(p => p.originalIndex === idx);
        if (point) sampled.push(point);
      }
    }
    sampled.sort((a, b) => a.x - b.x);
  }

  return sampled;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run lttb`
Expected: All 8 tests PASS

- [ ] **Step 5: Export from barrel files**

Add to `packages/core/src/stats/index.ts` after the KDE export:

```typescript
// Point decimation for chart rendering
export { lttb } from './lttb';
```

Add to `packages/core/src/index.ts` in the stats re-exports section:

```typescript
export { lttb } from './stats';
```

- [ ] **Step 6: Verify build**

Run: `pnpm --filter @variscout/core build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/stats/lttb.ts packages/core/src/stats/__tests__/lttb.test.ts packages/core/src/stats/index.ts packages/core/src/index.ts
git commit -m "feat: add LTTB point decimation algorithm for I-Chart (ADR-039)"
```

---

## Task 3: React.memo on Chart Components

Quick win — no dependencies on other tasks.

**Files:**

- Modify: `packages/charts/src/IChart.tsx`
- Modify: `packages/charts/src/Boxplot.tsx`
- Modify: `packages/charts/src/Pareto.tsx`
- Modify: `packages/charts/src/YamazumiChart.tsx`

- [ ] **Step 1: Add React.memo to IChartBase**

In `packages/charts/src/IChart.tsx`, find the existing export at the bottom of the file. The component is defined as `const IChartBase: React.FC<IChartProps> = (...)`. Wrap the export:

```typescript
// At the bottom of the file, replace:
//   export default withParentSize(IChartBase);
//   export { IChartBase };
// With:
const IChartBaseMemo = React.memo(IChartBase);
export default withParentSize(IChartBaseMemo);
export { IChartBaseMemo as IChartBase };
```

- [ ] **Step 2: Add React.memo to BoxplotBase**

Same pattern in `packages/charts/src/Boxplot.tsx`. Read the file first to find the exact export pattern, then wrap similarly.

- [ ] **Step 3: Add React.memo to ParetoBase**

Same pattern in `packages/charts/src/Pareto.tsx`.

- [ ] **Step 4: Add React.memo to YamazumiChartBase**

Same pattern in `packages/charts/src/YamazumiChart.tsx`.

- [ ] **Step 5: Run chart tests**

Run: `pnpm --filter @variscout/charts test -- --run`
Expected: All existing tests pass (memo is transparent to behavior tests)

- [ ] **Step 6: Commit**

```bash
git add packages/charts/src/IChart.tsx packages/charts/src/Boxplot.tsx packages/charts/src/Pareto.tsx packages/charts/src/YamazumiChart.tsx
git commit -m "perf: add React.memo to chart base components (ADR-039)"
```

---

## Task 4: Web Worker Types and API

Define the Worker interface and implement the computation functions. No React dependency — pure TypeScript.

**Files:**

- Create: `packages/core/src/workers/types.ts`
- Create: `packages/core/src/workers/statsWorkerApi.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create Worker types**

Create `packages/core/src/workers/types.ts`:

```typescript
import type { StatsResult, SpecLimits } from '../types';
import type { AnovaResult } from '../types';

/** Input for a stats computation request */
export interface StatsComputeRequest {
  /** Numeric values extracted from the outcome column */
  values: number[];
  /** Spec limits for capability calculation */
  specs: SpecLimits;
  /** Factor values for ANOVA (parallel arrays: factorValues[i] corresponds to values[i]) */
  factorValues?: string[];
  /** Whether to compute KDE (for violin plots) */
  computeKDE?: boolean;
}

/** Result from a stats computation */
export interface StatsComputeResult {
  stats: StatsResult;
  /** ANOVA result (if factorValues provided) */
  anova?: AnovaResult | null;
  /** KDE points (if computeKDE was true) */
  kde?: { x: number; y: number }[] | null;
}

/** The API exposed by the stats Worker via Comlink */
export interface StatsWorkerAPI {
  computeStats(request: StatsComputeRequest): StatsComputeResult;
}
```

Note: LTTB decimation runs in `useIChartData` (on the main thread, O(n), <5ms) — not in the Worker. The Worker handles the expensive computations: stats, ANOVA, KDE.

- [ ] **Step 2: Create Worker API implementation**

Create `packages/core/src/workers/statsWorkerApi.ts`:

```typescript
import { calculateStats } from '../stats/basic';
import { getEtaSquared, groupDataByFactor } from '../stats/anova';
import { calculateKDE } from '../stats/kde';
import type { StatsComputeRequest, StatsComputeResult } from './types';

/**
 * Compute stats, ANOVA, and optionally KDE.
 * This function runs inside the Web Worker — all heavy computation offloaded from main thread.
 */
export function computeStats(request: StatsComputeRequest): StatsComputeResult {
  const { values, specs, factorValues, computeKDE: doKDE } = request;

  // Basic stats (mean, stdDev, Cp, Cpk, control limits)
  const stats = calculateStats(values, specs.usl, specs.lsl);

  // ANOVA (eta² for factor significance)
  let anova: StatsComputeResult['anova'] = null;
  if (factorValues && factorValues.length === values.length) {
    const groups = groupDataByFactor(values, factorValues);
    if (groups.length > 1) {
      anova = { etaSquared: getEtaSquared(values, factorValues), groups };
    }
  }

  // KDE (kernel density estimation for violin plots)
  let kde: StatsComputeResult['kde'] = null;
  if (doKDE && values.length > 0) {
    kde = calculateKDE(values);
  }

  return { stats, anova, kde };
}
```

- [ ] **Step 3: Export types from core**

Add to `packages/core/src/index.ts`:

```typescript
// Worker types (for app-level Worker integration)
export type { StatsComputeRequest, StatsComputeResult, StatsWorkerAPI } from './workers/types';
export { computeStats } from './workers/statsWorkerApi';
```

- [ ] **Step 4: Run core tests**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: All tests pass (new code is additive)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/workers/ packages/core/src/index.ts
git commit -m "feat: add Web Worker stats API and types (ADR-039)"
```

---

## Task 5: Install Comlink + Create Worker Entry Points

**Files:**

- Create: `apps/pwa/src/workers/stats.worker.ts`
- Create: `apps/azure/src/workers/stats.worker.ts`
- Modify: root `package.json` or app `package.json`

- [ ] **Step 1: Install Comlink**

```bash
pnpm add comlink --filter @variscout/pwa --filter @variscout/azure-app
```

- [ ] **Step 2: Create PWA worker entry**

Create `apps/pwa/src/workers/stats.worker.ts`:

```typescript
import * as Comlink from 'comlink';
import { computeStats } from '@variscout/core';
import type { StatsWorkerAPI } from '@variscout/core';

const api: StatsWorkerAPI = {
  computeStats,
};

Comlink.expose(api);
```

- [ ] **Step 3: Create Azure worker entry**

Create `apps/azure/src/workers/stats.worker.ts` with identical content to PWA worker.

- [ ] **Step 4: Verify Vite bundles the worker**

Check that `apps/pwa/vite.config.ts` doesn't need changes — Vite automatically detects `new Worker(new URL(...))` patterns. If manual chunk config exists for workers, add the worker to it.

Run: `pnpm --filter @variscout/pwa build`
Expected: Build succeeds. Check output for a worker chunk file.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/workers/ apps/azure/src/workers/ pnpm-lock.yaml apps/pwa/package.json apps/azure/package.json
git commit -m "feat: add Comlink Web Worker entry points for stats (ADR-039)"
```

---

## Task 6: useAsyncStats Hook

The core integration hook that replaces synchronous `useMemo` stats with async Worker calls.

**Files:**

- Create: `packages/hooks/src/useAsyncStats.ts`
- Create: `packages/hooks/src/__tests__/useAsyncStats.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/hooks/src/__tests__/useAsyncStats.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncStats } from '../useAsyncStats';
import type { StatsResult, IChartDataPoint } from '@variscout/core';

// Mock stats result
const mockStats: StatsResult = {
  mean: 10,
  stdDev: 2,
  median: 10,
  count: 100,
  min: 5,
  max: 15,
  cp: 1.5,
  cpk: 1.2,
  sigmaWithin: 1.8,
  mrBar: 2.1,
  ucl: 15.4,
  lcl: 4.6,
  outOfSpecPercentage: 0,
  aboveUSLPercentage: 0,
  belowLSLPercentage: 0,
};

const mockWorker = {
  computeStats: vi.fn().mockResolvedValue({
    stats: mockStats,
    decimatedIChartData: undefined,
  }),
};

describe('useAsyncStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null stats and isComputing=false initially with no data', () => {
    const { result } = renderHook(() =>
      useAsyncStats({ values: [], specs: {}, workerApi: mockWorker as any })
    );
    expect(result.current.stats).toBeNull();
    expect(result.current.isComputing).toBe(false);
  });

  it('computes stats via worker when values are provided', async () => {
    const values = [1, 2, 3, 4, 5];
    const { result } = renderHook(() =>
      useAsyncStats({ values, specs: { usl: 10 }, workerApi: mockWorker as any })
    );

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats);
    });
    expect(result.current.isComputing).toBe(false);
    expect(mockWorker.computeStats).toHaveBeenCalledTimes(1);
  });

  it('discards stale results (generation counter)', async () => {
    const slowWorker = {
      computeStats: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ stats: { ...mockStats, mean: 1 } }), 100)
            )
        )
        .mockImplementationOnce(() => Promise.resolve({ stats: { ...mockStats, mean: 2 } })),
    };

    const { result, rerender } = renderHook(
      ({ values }) => useAsyncStats({ values, specs: {}, workerApi: slowWorker as any }),
      { initialProps: { values: [1] } }
    );

    // Trigger second computation before first resolves
    rerender({ values: [2] });

    await waitFor(() => {
      expect(result.current.stats?.mean).toBe(2);
    });
    // First (stale) result should have been discarded
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/hooks test -- --run useAsyncStats`
Expected: FAIL — module not found

- [ ] **Step 3: Implement useAsyncStats**

Create `packages/hooks/src/useAsyncStats.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  StatsResult,
  SpecLimits,
  IChartDataPoint,
  StatsWorkerAPI,
  StatsComputeResult,
} from '@variscout/core';

export interface UseAsyncStatsOptions {
  /** Numeric values from outcome column */
  values: number[];
  /** Spec limits */
  specs: SpecLimits;
  /** Comlink-wrapped Worker API */
  workerApi: StatsWorkerAPI | null;
  /** Factor values for ANOVA (parallel to values) */
  factorValues?: string[];
  /** Whether to compute KDE */
  computeKDE?: boolean;
}

export interface UseAsyncStatsResult {
  stats: StatsResult | null;
  anova: AnovaResult | null;
  kde: { x: number; y: number }[] | null;
  isComputing: boolean;
}

/**
 * Async stats computation via Web Worker with generation counter.
 * Replaces synchronous useMemo stats in useDataComputation.
 *
 * - Generation counter discards stale results from rapid filter clicks
 * - Falls back to synchronous computation if workerApi is null
 */
export function useAsyncStats(options: UseAsyncStatsOptions): UseAsyncStatsResult {
  const { values, specs, workerApi, factorValues, computeKDE } = options;

  const [stats, setStats] = useState<StatsResult | null>(null);
  const [anova, setAnova] = useState<AnovaResult | null>(null);
  const [kde, setKde] = useState<{ x: number; y: number }[] | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const generationRef = useRef(0);

  useEffect(() => {
    if (values.length === 0) {
      setStats(null);
      setAnova(null);
      setKde(null);
      setIsComputing(false);
      return;
    }

    const thisGeneration = ++generationRef.current;
    setIsComputing(true);

    const request = { values, specs, factorValues, computeKDE };

    if (!workerApi) {
      // Fallback: sync computation (for tests or Worker unavailable)
      import('@variscout/core').then(({ computeStats }) => {
        if (thisGeneration !== generationRef.current) return;
        const result = computeStats(request);
        setStats(result.stats);
        setAnova(result.anova ?? null);
        setKde(result.kde ?? null);
        setIsComputing(false);
      });
      return;
    }

    workerApi
      .computeStats(request)
      .then((result: StatsComputeResult) => {
        if (thisGeneration !== generationRef.current) return; // Stale
        setStats(result.stats);
        setAnova(result.anova ?? null);
        setKde(result.kde ?? null);
        setIsComputing(false);
      })
      .catch(() => {
        if (thisGeneration !== generationRef.current) return;
        setIsComputing(false);
      });
  }, [values, specs, workerApi, factorValues, computeKDE]);

  return { stats, anova, kde, isComputing };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/hooks test -- --run useAsyncStats`
Expected: All 3 tests PASS

- [ ] **Step 5: Export from hooks**

Add to `packages/hooks/src/index.ts`:

```typescript
export {
  useAsyncStats,
  type UseAsyncStatsOptions,
  type UseAsyncStatsResult,
} from './useAsyncStats';
```

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useAsyncStats.ts packages/hooks/src/__tests__/useAsyncStats.test.ts packages/hooks/src/index.ts
git commit -m "feat: add useAsyncStats hook with generation counter (ADR-039)"
```

---

## Task 7: Integrate Worker into useDataComputation + LTTB in useIChartData

Replace the synchronous `useMemo` stats computation with `useAsyncStats`. Add LTTB decimation to `useIChartData`. These are the critical integration points.

**Files:**

- Modify: `packages/hooks/src/useDataComputation.ts`
- Modify: `packages/hooks/src/useIChartData.ts`

- [ ] **Step 1: Read useDataComputation.ts carefully**

Read the full file to understand all `useMemo` blocks and the return type. Note that `stats` is returned and consumed by `useDataState.ts`. The key changes:

- Replace the `stats` useMemo (lines ~75-84) with `useAsyncStats`
- Add `isComputing` to the return type
- Add `workerApi` to the input interface

- [ ] **Step 2: Modify useDataComputation to use async stats**

The critical change is replacing:

```typescript
const stats = useMemo(() => {
  if (!outcome || filteredData.length === 0) return null;
  const values = filteredData.map(...).filter(...);
  return calculateStats(values, specs.usl, specs.lsl);
}, [filteredData, outcome, specs]);
```

With:

```typescript
// Extract values for Worker (memoized to prevent unnecessary Worker calls)
const values = useMemo(() => {
  if (!outcome || filteredData.length === 0) return [];
  return filteredData
    .map(d => {
      const v = d[outcome];
      return typeof v === 'number' ? v : Number(v);
    })
    .filter(v => !isNaN(v));
}, [filteredData, outcome]);

// Extract factor values for ANOVA (if a factor is active in boxplot)
const factorValues = useMemo(() => {
  if (!factors.length || filteredData.length === 0) return undefined;
  const factor = factors[0]; // Primary factor for ANOVA
  return filteredData.map(d => String(d[factor] ?? ''));
}, [filteredData, factors]);

const { stats, anova, kde, isComputing } = useAsyncStats({
  values,
  specs,
  workerApi: inputs.workerApi ?? null,
  factorValues,
  computeKDE: inputs.displayOptions?.showViolin,
});
```

Also add `workerApi` to the input interface and add `isComputing`, `anova`, `kde` to the return type.

- [ ] **Step 3: Add LTTB decimation to useIChartData**

LTTB runs in `useIChartData` on the main thread because: (a) it needs the constructed `IChartDataPoint[]` which includes stage and timeValue fields, (b) it's O(n) and takes <5ms even for 50K points, (c) it needs the chart container width which is only available in the render tree.

Modify `packages/hooks/src/useIChartData.ts`:

```typescript
import { useMemo } from 'react';
import type { IChartDataPoint } from '@variscout/core';
import { formatTimeValue, lttb, type DataCellValue } from '@variscout/core';

export function useIChartData(
  sourceData: Record<string, unknown>[],
  outcome: string | null,
  stageColumn: string | null,
  timeColumn: string | null,
  /** Chart container width for LTTB threshold. If provided, decimates large datasets. */
  chartWidth?: number,
  /** Stats with control limits — used to force-include violation points */
  stats?: { ucl: number; lcl: number } | null
): IChartDataPoint[] {
  const fullData = useMemo(() => {
    if (!outcome) return [];
    return sourceData
      .map(
        (d, i): IChartDataPoint => ({
          x: i,
          y: Number(d[outcome]),
          stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
          timeValue: timeColumn ? formatTimeValue(d[timeColumn] as DataCellValue) : undefined,
          originalIndex: i,
        })
      )
      .filter(d => !isNaN(d.y));
  }, [sourceData, outcome, stageColumn, timeColumn]);

  // Apply LTTB decimation for large datasets
  return useMemo(() => {
    if (!chartWidth || fullData.length <= chartWidth * 2) return fullData;

    // Find violation points to force-include
    const forceInclude = new Set<number>();
    if (stats) {
      fullData.forEach(p => {
        if (p.y > stats.ucl || p.y < stats.lcl) {
          forceInclude.add(p.originalIndex);
        }
      });
    }

    return lttb(fullData, chartWidth * 2, forceInclude.size > 0 ? forceInclude : undefined);
  }, [fullData, chartWidth, stats]);
}
```

- [ ] **Step 4: Run all hooks tests**

Run: `pnpm --filter @variscout/hooks test -- --run`
Expected: All tests pass. Some tests may need `workerApi: null` added to mock inputs. Update existing `useIChartData` tests if they break due to new parameters.

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/useDataComputation.ts packages/hooks/src/useIChartData.ts
git commit -m "feat: integrate async Worker stats + LTTB decimation (ADR-039)"
```

---

## Task 8: App-level Worker Wiring (PWA + Azure)

Connect the Worker to DataContext in both apps. Add stale-while-revalidate overlay.

**Files:**

- Modify: `apps/pwa/src/context/DataContext.tsx` (or the hook it delegates to)
- Modify: `apps/azure/src/context/DataContext.tsx` (or equivalent)
- Modify: Chart wrappers in both apps (computing overlay)

- [ ] **Step 1: Read how PWA DataContext delegates to useDataState**

Both apps delegate to `useDataState` which calls `useDataComputation`. The Worker needs to be created in the app and passed through. Read the app DataContext and useDataState to find the right injection point.

- [ ] **Step 2: Create Worker singleton in PWA**

In `apps/pwa/src/context/DataContext.tsx` (or a new `apps/pwa/src/workers/useStatsWorker.ts`), create the Worker and pass its API:

```typescript
import * as Comlink from 'comlink';
import type { StatsWorkerAPI } from '@variscout/core';

function createStatsWorker(): StatsWorkerAPI {
  const worker = new Worker(new URL('../workers/stats.worker.ts', import.meta.url), {
    type: 'module',
  });
  return Comlink.wrap<StatsWorkerAPI>(worker);
}

// Singleton — created once at app startup
let workerApi: StatsWorkerAPI | null = null;
export function getStatsWorkerApi(): StatsWorkerAPI {
  if (!workerApi) {
    workerApi = createStatsWorker();
  }
  return workerApi;
}
```

Pass `workerApi` into `useDataState` / `useDataComputation` via the options/inputs parameter.

- [ ] **Step 3: Same for Azure app**

Identical pattern in `apps/azure/src/context/DataContext.tsx`.

- [ ] **Step 4: Thread `isComputing` through to components**

Add `isComputing` to the DataState interface and expose it through the context. Both apps' `useData()` hook should return `isComputing`.

- [ ] **Step 5: Add computing overlay to chart wrappers**

In both apps' IChart wrapper (e.g., `apps/pwa/src/components/charts/IChart.tsx`), wrap the chart with the overlay:

```tsx
const IChart = (props: IChartProps) => {
  const ctx = useData();

  return (
    <div className="relative">
      <IChartWrapperBase
        stats={ctx.stats}
        // ... other props
      />
      {ctx.isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};
```

Apply to IChart, Boxplot, Pareto, and Yamazumi wrappers in both apps.

- [ ] **Step 6: Run app tests**

Run: `pnpm --filter @variscout/pwa test -- --run` and `pnpm --filter @variscout/azure-app test -- --run`
Expected: Tests pass. Worker is mocked in tests (vi.mock the worker module).

- [ ] **Step 7: Visual verification**

Run: `pnpm dev`

- Load the coffee sample dataset
- Verify I-Chart renders
- Verify stats panel shows computed values
- Open DevTools → check worker chunk loaded in Sources panel

- [ ] **Step 8: Commit**

```bash
git add apps/pwa/src/ apps/azure/src/
git commit -m "feat: wire Web Worker into app DataContexts with computing overlay (ADR-039)"
```

---

## Task 9: Mobile Row Limits

**Files:**

- Modify: `apps/pwa/src/hooks/useDataIngestion.ts`
- Modify: `apps/azure/src/hooks/useDataIngestion.ts`

- [ ] **Step 1: Read current useDataIngestion wrappers**

Both app wrappers are thin — they import `useDataIngestionBase` from `@variscout/hooks` and pass through. Azure already passes `limits: AZURE_LIMITS`. PWA uses defaults.

- [ ] **Step 2: Add mobile limits to PWA**

Modify `apps/pwa/src/hooks/useDataIngestion.ts`:

```typescript
import { useIsMobile } from '@variscout/ui';

const MOBILE_LIMITS = {
  rowHardLimit: 10_000,
  rowWarningThreshold: 2_000,
};

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const isMobile = useIsMobile(640);
  // ... existing code ...
  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? MOBILE_LIMITS : undefined,
  });
};
```

- [ ] **Step 3: Add mobile limits to Azure**

Modify `apps/azure/src/hooks/useDataIngestion.ts`:

```typescript
import { useIsMobile } from '@variscout/ui';

const AZURE_LIMITS = { rowHardLimit: 100_000, rowWarningThreshold: 10_000 };
const AZURE_MOBILE_LIMITS = { rowHardLimit: 25_000, rowWarningThreshold: 5_000 };

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const isMobile = useIsMobile(640);
  // ... existing code ...
  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? AZURE_MOBILE_LIMITS : AZURE_LIMITS,
  });
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- --run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/hooks/useDataIngestion.ts apps/azure/src/hooks/useDataIngestion.ts
git commit -m "feat: add mobile-specific row limits (ADR-039)"
```

---

## Task 10: Documentation Updates

**Files:** 10 documentation files (see spec)

- [ ] **Step 1: Update system limits doc**

In `docs/05-technical/implementation/system-limits.md`, add mobile row limits table alongside existing desktop limits.

- [ ] **Step 2: Update .claude/rules/charts.md**

Add a "Chart Performance" section after the Yamazumi section covering: React.memo convention, LTTB decimation, violation point preservation.

- [ ] **Step 3: Update .claude/rules/monorepo.md**

Add `useAsyncStats` to the hooks list with description.

- [ ] **Step 4: Update .claude/rules/testing.md**

Add LTTB and Worker to the `@variscout/core` test ownership row. Add `@variscout/hooks` entry for useAsyncStats.

- [ ] **Step 5: Update CLAUDE.md**

Add "Performance / Mobile" row to the task-to-doc mapping table pointing to ADR-039 and system-limits.md.

- [ ] **Step 6: Update docs/superpowers/specs/index.md**

Add this spec entry.

- [ ] **Step 7: Update product docs**

- `docs/08-products/tier-philosophy.md` — note mobile vs desktop row limits
- `docs/08-products/feature-parity.md` — add mobile limits footnote
- `docs/01-vision/evaluations/tensions/mobile-screen-budget.md` — add resolution note

- [ ] **Step 8: Commit**

```bash
git add docs/ .claude/ CLAUDE.md
git commit -m "docs: update system limits, charts rules, and product docs for mobile performance (ADR-039)"
```

---

## Task 11: Full Test Suite + Build Verification

- [ ] **Step 1: Run all tests**

```bash
pnpm test -- --run
```

Expected: All ~3,000 tests pass

- [ ] **Step 2: Build all packages**

```bash
pnpm build
```

Expected: Clean build. Worker chunk appears in PWA output.

- [ ] **Step 3: Visual verification**

```bash
pnpm dev
```

Verify:

1. Coffee sample → I-Chart renders smoothly, stats panel populated
2. Open DevTools Network tab → worker chunk loaded
3. Filter click → brief overlay appears on charts, then updates
4. Mobile viewport (Chrome DevTools responsive mode, 375x667):
   - Row limits are lower (10K for PWA)
   - Charts render correctly in carousel mode
5. Multi-window: open findings popout, filter in main window → main UI stays responsive

- [ ] **Step 4: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: address test/build issues from mobile performance implementation"
```
