# Mode-Aware Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the report system adapt its content based on the active analysis mode (standard/capability/performance/yamazumi), specs availability, and target metric — while keeping the 6-section journey spine unchanged.

**Architecture:** Extend existing mode branching (already done for yamazumi) to cover capability and performance modes. Add specs-gating to ReportKPIGrid. Thread `targetMetric` and `isCapabilityMode` through `useReportSections`. Create two new KPI grid components following the `ReportYamazumiKPIGrid` pattern. Adapt the Drivers section to show only acted-upon findings in summary mode.

**Tech Stack:** React, TypeScript, Vitest, Zustand (Azure stores), @variscout/core types, @variscout/hooks, @variscout/ui

**Spec:** `docs/superpowers/specs/2026-03-22-mode-aware-reports-design.md`

---

## File Map

| File                                                                                | Action          | Responsibility                                                                           |
| ----------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `packages/ui/src/components/ReportView/ReportKPIGrid.tsx`                           | Modify          | Add `hasSpecs` gating, `targetMetric` highlight                                          |
| `packages/ui/src/components/ReportView/__tests__/ReportKPIGrid.test.tsx`            | Modify + extend | Update existing tests + add specs-gating tests                                           |
| `packages/ui/src/components/ReportView/ReportCapabilityKPIGrid.tsx`                 | Create          | Mean Cpk, Cp, centering loss, % passing                                                  |
| `packages/ui/src/components/ReportView/__tests__/ReportCapabilityKPIGrid.test.tsx`  | Create          | Unit tests                                                                               |
| `packages/ui/src/components/ReportView/ReportPerformanceKPIGrid.tsx`                | Create          | # channels passing, worst Cpk, mean Cpk                                                  |
| `packages/ui/src/components/ReportView/__tests__/ReportPerformanceKPIGrid.test.tsx` | Create          | Unit tests                                                                               |
| `packages/ui/src/components/ReportView/ReportChartSnapshot.tsx`                     | Modify          | Extend `chartType` union                                                                 |
| `packages/hooks/src/useReportSections.ts`                                           | Modify          | Add `isCapabilityMode`, `targetMetric` params, mode-aware titles                         |
| `packages/hooks/src/__tests__/useReportSections.test.ts`                            | Modify          | Tests for new params and title logic                                                     |
| `apps/azure/src/components/views/ReportView.tsx`                                    | Modify          | Section 1 mode branching, Section 2 audience filter, Section 6 metric, thread new params |
| `packages/ui/src/index.ts`                                                          | Modify          | Export new KPI grid components                                                           |
| `.claude/rules/monorepo.md`                                                         | Modify          | Add new components to UI listing                                                         |
| `CLAUDE.md`                                                                         | Modify          | Update task-to-doc mapping + Key Files                                                   |
| `docs/07-decisions/adr-041-zustand-feature-stores.md` or relevant ADR               | Modify          | Cross-reference mode-aware reports spec                                                  |

**Architecture note — Capability data source:** ReportView does NOT have `capabilityData` from DataContext. Compute it inside ReportView via `useCapabilityIChartData` hook (same pattern as `apps/azure/src/components/charts/IChart.tsx:7-29`). Inputs: `filteredData`, `outcome`, `specs`, `subgroupConfig`, `cpkTarget` — all available from `useData()`.

**Architecture note — ChannelResult.cpk:** The `cpk` field is optional (`cpk?: number`). All performance mode computations must filter to channels with defined cpk: `channels.filter(c => c.cpk !== undefined)`. Use `c.label` (not `c.name`) for display.

---

### Task 1: ReportKPIGrid — Specs Gating + Target Metric Highlight

Add `hasSpecs` logic to hide Cpk and In-Spec% cards when no spec limits are set. Add `targetMetric` prop to highlight the target-driven KPI card.

**Files:**

- Modify: `packages/ui/src/components/ReportView/ReportKPIGrid.tsx`
- Modify: `packages/ui/src/components/ReportView/__tests__/ReportKPIGrid.test.tsx` (update existing + add new tests)

**Important:** Existing tests assert all 5 cards render. After specs-gating, those tests must pass specs with values so they continue to pass. Update the test fixture's `specs` prop to `{ usl: 110, lsl: 90 }` in existing tests.

- [ ] **Step 1: Write failing tests for specs gating**

Test that Cpk and In-Spec% cards are hidden when `specs === {}`:

```typescript
// ReportKPIGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportKPIGrid } from '../ReportKPIGrid';
import type { StatsResult, SpecLimits } from '@variscout/core';

const baseStats: StatsResult = {
  mean: 100.5, median: 100.3, stdDev: 2.1, count: 50,
  min: 95, max: 106, q1: 99, q3: 102, iqr: 3,
  cpk: 1.45, cp: 1.52, outOfSpecPercentage: 0.5,
  ucl: 106.8, lcl: 94.2, meanLine: 100.5,
};

const specsSet: SpecLimits = { usl: 110, lsl: 90 };
const noSpecs: SpecLimits = {};

describe('ReportKPIGrid specs gating', () => {
  it('shows Cpk and In-Spec% when specs are set', () => {
    render(<ReportKPIGrid stats={baseStats} specs={specsSet} sampleCount={50} />);
    expect(screen.getByText(/cpk/i)).toBeInTheDocument();
    expect(screen.getByText(/in.*spec/i)).toBeInTheDocument();
  });

  it('hides Cpk and In-Spec% when no specs are set', () => {
    render(<ReportKPIGrid stats={baseStats} specs={noSpecs} sampleCount={50} />);
    expect(screen.queryByText(/cpk/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/in.*spec/i)).not.toBeInTheDocument();
  });

  it('shows Cpk when only USL is set (one-sided)', () => {
    render(<ReportKPIGrid stats={baseStats} specs={{ usl: 110 }} sampleCount={50} />);
    expect(screen.getByText(/cpk/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- --run ReportKPIGrid`
Expected: FAIL — Cpk and In-Spec% render unconditionally.

- [ ] **Step 3: Implement specs gating in ReportKPIGrid**

In `ReportKPIGrid.tsx`, add `hasSpecs` check and conditionally render Cpk/In-Spec% cards:

```typescript
// Add at top of component:
const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

// Wrap Cpk card:
{hasSpecs && (
  <div className={scheme.card}>
    <div className={scheme.label}>{t('report.kpi.cpk')}</div>
    ...
  </div>
)}

// Wrap In-Spec% card:
{hasSpecs && (
  <div className={scheme.card}>
    <div className={scheme.label}>{t('report.kpi.inSpec')} %</div>
    ...
  </div>
)}

// Adjust grid columns: sm:grid-cols-5 → dynamic based on hasSpecs
// container: `grid grid-cols-2 ${hasSpecs ? 'sm:grid-cols-5' : 'sm:grid-cols-3'} gap-3`
```

Also accept `specs` in the destructured props (currently unused — the component receives it but doesn't destructure it).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- --run ReportKPIGrid`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportKPIGrid.tsx packages/ui/src/components/ReportView/__tests__/ReportKPIGrid.test.tsx
git commit -m "feat(report): add specs-gating to ReportKPIGrid — hide Cpk/InSpec when no specs"
```

---

### Task 2: ReportChartSnapshot — Extend chartType Union

Add `'capability-ichart'` and `'performance-ichart'` to the chartType discriminant.

**Files:**

- Modify: `packages/ui/src/components/ReportView/ReportChartSnapshot.tsx`

- [ ] **Step 1: Extend the type and label record**

In `ReportChartSnapshot.tsx`:

```typescript
// Line 22: extend union
chartType: 'ichart' | 'boxplot' | 'pareto' | 'capability-ichart' | 'performance-ichart';

// Line 30-34: extend labels
const chartTypeLabel: Record<ReportChartSnapshotProps['chartType'], string> = {
  ichart: 'I-Chart',
  boxplot: 'Boxplot',
  pareto: 'Pareto',
  'capability-ichart': 'Capability I-Chart',
  'performance-ichart': 'Performance I-Chart',
};
```

- [ ] **Step 2: Build to verify no type errors**

Run: `pnpm --filter @variscout/ui build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportChartSnapshot.tsx
git commit -m "feat(report): extend ReportChartSnapshot chartType for capability and performance"
```

---

### Task 3: ReportCapabilityKPIGrid — New Component

Create the capability mode KPI grid showing Mean Cpk, Mean Cp, centering loss, % subgroups passing.

**Files:**

- Create: `packages/ui/src/components/ReportView/ReportCapabilityKPIGrid.tsx`
- Create: `packages/ui/src/components/ReportView/__tests__/ReportCapabilityKPIGrid.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportCapabilityKPIGrid } from '../ReportCapabilityKPIGrid';

const props = {
  meanCpk: 1.45,
  meanCp: 1.62,
  cpkTarget: 1.33,
  subgroupCount: 20,
  passingCount: 18,
};

describe('ReportCapabilityKPIGrid', () => {
  it('renders mean Cpk with color', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('1.45')).toBeInTheDocument();
    expect(screen.getByText(/mean cpk/i)).toBeInTheDocument();
  });

  it('renders % passing', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('renders centering loss', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('0.17')).toBeInTheDocument(); // 1.62 - 1.45
  });

  it('hides Cp when undefined (one-sided specs)', () => {
    render(<ReportCapabilityKPIGrid {...props} meanCp={undefined} />);
    expect(screen.queryByText(/mean cp$/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- --run ReportCapabilityKPIGrid`
Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Implement ReportCapabilityKPIGrid**

Follow the `ReportYamazumiKPIGrid` pattern (same card classes, same grid layout):

```typescript
import React from 'react';

export interface ReportCapabilityKPIGridProps {
  meanCpk: number;
  meanCp?: number; // undefined for one-sided specs
  cpkTarget: number;
  subgroupCount: number;
  passingCount: number;
}

function getCpkColor(cpk: number, target: number): string {
  if (cpk >= target) return 'text-green-600 dark:text-green-400';
  if (cpk < 1.0) return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

const cardClass =
  'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3';
const labelClass = 'text-xs text-slate-500 dark:text-slate-400';
const valueClass = 'text-lg font-semibold text-slate-900 dark:text-slate-100';

export const ReportCapabilityKPIGrid: React.FC<ReportCapabilityKPIGridProps> = ({
  meanCpk, meanCp, cpkTarget, subgroupCount, passingCount,
}) => {
  const passingPct = subgroupCount > 0 ? Math.round((passingCount / subgroupCount) * 100) : 0;
  const centeringLoss = meanCp !== undefined ? +(meanCp - meanCpk).toFixed(2) : undefined;
  const hasCp = meanCp !== undefined;

  return (
    <div data-report-kpi className={`grid grid-cols-2 ${hasCp ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
      <div className={cardClass}>
        <div className={labelClass}>Mean Cpk</div>
        <div className={`mt-1 text-lg font-semibold ${getCpkColor(meanCpk, cpkTarget)}`}>
          {meanCpk.toFixed(2)}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          target: {cpkTarget.toFixed(2)}
        </div>
      </div>

      {hasCp && (
        <div className={cardClass}>
          <div className={labelClass}>Mean Cp</div>
          <div className={`mt-1 ${valueClass}`}>{meanCp!.toFixed(2)}</div>
        </div>
      )}

      <div className={cardClass}>
        <div className={labelClass}>Centering Loss</div>
        <div className={`mt-1 ${valueClass}`}>
          {centeringLoss !== undefined ? centeringLoss.toFixed(2) : '—'}
        </div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>Passing Target</div>
        <div className={`mt-1 text-lg font-semibold ${passingPct >= 90 ? 'text-green-600 dark:text-green-400' : passingPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
          {passingPct}%
        </div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {passingCount}/{subgroupCount} subgroups
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- --run ReportCapabilityKPIGrid`
Expected: PASS

- [ ] **Step 5: Export from package index**

Add to `packages/ui/src/components/ReportView/index.ts` (or the main `packages/ui/src/index.ts`):

```typescript
export { ReportCapabilityKPIGrid } from './components/ReportView/ReportCapabilityKPIGrid';
```

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportCapabilityKPIGrid.tsx packages/ui/src/components/ReportView/__tests__/ReportCapabilityKPIGrid.test.tsx packages/ui/src/index.ts
git commit -m "feat(report): add ReportCapabilityKPIGrid for capability mode reports"
```

---

### Task 4: ReportPerformanceKPIGrid — New Component

Create the performance mode KPI grid showing # channels passing, worst Cpk, mean Cpk.

**Files:**

- Create: `packages/ui/src/components/ReportView/ReportPerformanceKPIGrid.tsx`
- Create: `packages/ui/src/components/ReportView/__tests__/ReportPerformanceKPIGrid.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportPerformanceKPIGrid } from '../ReportPerformanceKPIGrid';

describe('ReportPerformanceKPIGrid', () => {
  it('renders channel pass count', () => {
    render(
      <ReportPerformanceKPIGrid
        totalChannels={16}
        passingChannels={12}
        worstCpk={0.85}
        worstChannelName="Head 7"
        meanCpk={1.28}
        cpkTarget={1.33}
      />
    );
    expect(screen.getByText('12/16')).toBeInTheDocument();
  });

  it('renders worst channel with name', () => {
    render(
      <ReportPerformanceKPIGrid
        totalChannels={16}
        passingChannels={12}
        worstCpk={0.85}
        worstChannelName="Head 7"
        meanCpk={1.28}
        cpkTarget={1.33}
      />
    );
    expect(screen.getByText('0.85')).toBeInTheDocument();
    expect(screen.getByText('Head 7')).toBeInTheDocument();
  });

  it('colors worst Cpk red when below 1.0', () => {
    const { container } = render(
      <ReportPerformanceKPIGrid
        totalChannels={16}
        passingChannels={16}
        worstCpk={0.85}
        worstChannelName="Head 7"
        meanCpk={1.28}
        cpkTarget={1.33}
      />
    );
    const worstValue = container.querySelector('[data-testid="worst-cpk"]');
    expect(worstValue?.className).toContain('text-red');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement ReportPerformanceKPIGrid**

Same pattern as ReportYamazumiKPIGrid. Props: `totalChannels`, `passingChannels`, `worstCpk`, `worstChannelName`, `meanCpk`, `cpkTarget`. Cards: Channels Passing, Worst Channel Cpk, Mean Cpk.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Export from package index**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(report): add ReportPerformanceKPIGrid for performance mode reports"
```

---

### Task 5: useReportSections — Mode-Aware Titles

Add `isCapabilityMode` and `targetMetric` parameters, extend title logic for all 4 contexts.

**Files:**

- Modify: `packages/hooks/src/useReportSections.ts`
- Modify: `packages/hooks/src/__tests__/useReportSections.test.ts`

- [ ] **Step 1: Write failing tests for new title branches**

```typescript
it('uses capability titles when isCapabilityMode is true', () => {
  const { result } = renderHook(() =>
    useReportSections({
      findings: [],
      hypotheses: [],
      stagedComparison: false,
      aiEnabled: false,
      analysisMode: 'standard',
      isCapabilityMode: true,
    })
  );
  expect(result.current.sections[0].title).toBe('Is capability meeting target?');
  expect(result.current.sections[1].title).toBe('What drives capability differences?');
});

it('uses performance titles when analysisMode is performance', () => {
  const { result } = renderHook(() =>
    useReportSections({
      findings: [],
      hypotheses: [],
      stagedComparison: false,
      aiEnabled: false,
      analysisMode: 'performance',
    })
  );
  expect(result.current.sections[0].title).toBe('How do channels perform?');
  expect(result.current.sections[1].title).toBe('Which channels are failing?');
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement the new parameters and title logic**

Add to `UseReportSectionsOptions`:

```typescript
/** True when standard mode I-Chart is showing Cp/Cpk per subgroup */
isCapabilityMode?: boolean;
/** Target metric for KPI emphasis (from ProcessContext) */
targetMetric?: string;
```

Extend title selection in the `useMemo`:

```typescript
// Section 1 title
const section1Title =
  analysisMode === 'yamazumi'
    ? 'What does the time composition look like?'
    : analysisMode === 'performance'
      ? 'How do channels perform?'
      : isCapabilityMode
        ? 'Is capability meeting target?'
        : 'What does the process look like?';

// Section 2 title
const section2Title =
  analysisMode === 'yamazumi'
    ? 'What is driving the activity composition?'
    : analysisMode === 'performance'
      ? 'Which channels are failing?'
      : isCapabilityMode
        ? 'What drives capability differences?'
        : reportType === 'improvement-story'
          ? 'Where does variation hide?'
          : 'What is driving the variation?';
```

- [ ] **Step 4: Run tests, verify pass**

Run: `pnpm --filter @variscout/hooks test -- --run useReportSections`

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(report): add isCapabilityMode + performance titles to useReportSections"
```

---

### Task 6: Azure ReportView — Section 1 Mode Branching

Branch Section 1 content (KPI grid + chart snapshot) based on analysis mode.

**Files:**

- Modify: `apps/azure/src/components/views/ReportView.tsx`

- [ ] **Step 1: Thread new parameters through**

Read the current ReportView.tsx to understand the hook call and available data. The component already has `analysisMode`, `displayOptions`, `performanceResult`, and capability data available from DataContext.

Add `isCapabilityMode` derivation:

```typescript
const isCapabilityMode =
  analysisMode === 'standard' && displayOptions.standardIChartMetric === 'capability';
```

Pass to `useReportSections`:

```typescript
const { reportType, sections, audienceMode } = useReportSections({
  findings,
  hypotheses,
  stagedComparison: !!stagedComparison,
  aiEnabled,
  audienceMode: audience,
  analysisMode,
  isCapabilityMode, // NEW
});
```

- [ ] **Step 2: Compute capability data inside ReportView**

Add `useCapabilityIChartData` call (same pattern as `apps/azure/src/components/charts/IChart.tsx:7-29`):

```typescript
import { useCapabilityIChartData } from '@variscout/hooks';

// Inside the component:
const capabilityIChartData = useCapabilityIChartData({
  filteredData,
  outcome: outcome ?? '',
  specs: specs ?? {},
  subgroupConfig: subgroupConfig ?? { method: 'fixed-size', size: 5 },
  cpkTarget,
});
```

Derive KPI values from the hook output:

```typescript
const capabilityKPIs = useMemo(() => {
  if (!isCapabilityMode || !capabilityIChartData.cpkStats) return null;
  const results = capabilityIChartData.subgroupResults;
  const target = cpkTarget ?? 1.33;
  const cpkValues = results.map(r => r.cpk).filter((v): v is number => v !== undefined);
  const cpValues = results.map(r => r.cp).filter((v): v is number => v !== undefined);
  return {
    meanCpk: cpkValues.length > 0 ? cpkValues.reduce((a, b) => a + b, 0) / cpkValues.length : 0,
    meanCp: cpValues.length > 0 ? cpValues.reduce((a, b) => a + b, 0) / cpValues.length : undefined,
    subgroupCount: results.length,
    passingCount: cpkValues.filter(v => v >= target).length,
  };
}, [isCapabilityMode, capabilityIChartData, cpkTarget]);
```

- [ ] **Step 3: Branch Section 1 KPI grid for capability and performance modes**

In the `section.id === 'current-condition'` block, add branches after the existing yamazumi check.

**Important for performance mode:** `ChannelResult.cpk` is optional and display name is `c.label` (not `c.name`). Filter channels with defined cpk:

```typescript
{isCapabilityMode && capabilityKPIs ? (
  <ReportCapabilityKPIGrid
    meanCpk={capabilityKPIs.meanCpk}
    meanCp={capabilityKPIs.meanCp}
    cpkTarget={cpkTarget ?? 1.33}
    subgroupCount={capabilityKPIs.subgroupCount}
    passingCount={capabilityKPIs.passingCount}
  />
) : analysisMode === 'performance' && performanceResult ? (
  (() => {
    const target = cpkTarget ?? 1.33;
    const withCpk = performanceResult.channels.filter(c => c.cpk !== undefined);
    const worst = withCpk.length > 0 ? withCpk.reduce((w, c) => (c.cpk! < w.cpk! ? c : w)) : null;
    return (
      <ReportPerformanceKPIGrid
        totalChannels={performanceResult.channels.length}
        passingChannels={withCpk.filter(c => c.cpk! >= target).length}
        worstCpk={worst?.cpk ?? 0}
        worstChannelName={worst?.label ?? '—'}
        meanCpk={withCpk.length > 0 ? withCpk.reduce((s, c) => s + c.cpk!, 0) / withCpk.length : 0}
        cpkTarget={target}
      />
    );
  })()
) : (
  // existing standard ReportKPIGrid
)}
```

- [ ] **Step 3: Add capability and performance chart snapshots**

Use `ReportChartSnapshot` with the new chartType values. Render the existing chart components in report export dimensions.

- [ ] **Step 4: Build and verify**

Run: `pnpm --filter @variscout/azure-app build`

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(report): branch Section 1 content by analysis mode (capability, performance)"
```

---

### Task 7: Azure ReportView — Section 2 Audience-Driven Findings

Make Summary mode show only acted-upon findings; make Technical mode order by importance.

**Files:**

- Modify: `apps/azure/src/components/views/ReportView.tsx`

- [ ] **Step 1: Add audience-aware findings filter for Section 2**

In the `section.id === 'drivers'` block:

```typescript
// Derive audience-appropriate findings list
const driverFindings = (() => {
  const raw = extendedSection?.findings ?? [];
  if (!isSummary) {
    // Technical: all findings, key-driver first
    return [...raw].sort((a, b) => {
      if (a.tag === 'key-driver' && b.tag !== 'key-driver') return -1;
      if (b.tag === 'key-driver' && a.tag !== 'key-driver') return 1;
      return 0;
    });
  }
  // Summary (improvement-story): only findings with actions
  const withActions = raw.filter(f => f.actions && f.actions.length > 0);
  if (withActions.length > 0) return withActions;
  // Fallback (investigation-report): key-driver tagged, or all
  const keyDrivers = raw.filter(f => f.tag === 'key-driver');
  return keyDrivers.length > 0 ? keyDrivers : raw;
})();
```

Replace `(extendedSection?.findings ?? [])` references in Section 2 with `driverFindings`.

- [ ] **Step 2: Build and verify**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(report): audience-driven findings in Section 2 — summary shows acted-upon only"
```

---

### Task 8: Azure ReportView — Section 6 Mode-Aware Learning Loop Metric

Pass mode-appropriate metric label and values to ReportCpkLearningLoop.

**Files:**

- Modify: `apps/azure/src/components/views/ReportView.tsx`

- [ ] **Step 1: Derive learning loop metric per mode**

The existing code already branches for yamazumi (metricLabel='VA Ratio'). Extend:

```typescript
const learningLoopConfig = (() => {
  if (isYamazumi)
    return {
      metricLabel: 'VA Ratio',
      formatValue: (v: number) => `${Math.round(v * 100)}%`,
    };
  if (isCapabilityMode) return { metricLabel: 'Mean Cpk' };
  if (analysisMode === 'performance') return { metricLabel: 'Worst Channel Cpk' };
  // Standard: use targetMetric label if set
  if (processContext?.targetMetric && processContext.targetMetric !== 'cpk') {
    const labels: Record<string, string> = {
      mean: 'Mean',
      sigma: 'σ',
      yield: 'Yield',
      passRate: 'Pass Rate',
    };
    return { metricLabel: labels[processContext.targetMetric] ?? 'Cpk' };
  }
  // Standard with no specs: fall back to σ
  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
  if (!hasSpecs) return { metricLabel: 'σ' };
  return { metricLabel: 'Cpk' };
})();
```

Pass to `ReportCpkLearningLoop`:

```typescript
<ReportCpkLearningLoop
  metricLabel={learningLoopConfig.metricLabel}
  formatValue={learningLoopConfig.formatValue}
  // ... existing props
/>
```

- [ ] **Step 2: Build and verify**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(report): mode-aware learning loop metric (capability, performance, targetMetric)"
```

---

### Task 9: Full Verification

Run all tests and verify the complete integration.

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: All ~3,572 tests pass.

- [ ] **Step 2: Build all apps**

```bash
pnpm --filter @variscout/azure-app build && pnpm --filter @variscout/pwa build
```

- [ ] **Step 3: Manual verification checklist**

Verify visually (via `pnpm --filter @variscout/azure-app dev` or chrome):

- [ ] Standard mode, no specs → Cpk and In-Spec% hidden in report KPI grid
- [ ] Standard mode, specs set → Cpk shown with color coding
- [ ] Standard mode, one-sided spec (USL only) → Cpk shown, Cp hidden
- [ ] Capability mode → Mean Cpk KPI grid, dual I-Chart snapshot
- [ ] Performance mode → Channel passing KPI grid, performance I-Chart snapshot
- [ ] Yamazumi report → unchanged (regression check)
- [ ] Summary mode → only acted-upon findings shown in Section 2
- [ ] Technical mode → all findings shown, key-driver first
- [ ] Investigation-report summary with no tagged findings → falls back to all findings

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git commit -m "fix(report): address verification findings"
```

---

### Task 10: Documentation Updates

Update project documentation to reflect mode-aware reports.

**Files:**

- Modify: `CLAUDE.md`
- Modify: `.claude/rules/monorepo.md`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Update CLAUDE.md**

In the Task → Documentation table, add or update:

```
| Report View / Sharing | adr-037, adr-030, adr-031, docs/superpowers/specs/2026-03-20-reporting-workspaces-design.md, docs/superpowers/specs/2026-03-22-mode-aware-reports-design.md |
```

- [ ] **Step 2: Update monorepo.md**

Add new components to the `@variscout/ui` exports listing:

```
#   ReportCapabilityKPIGrid, ReportPerformanceKPIGrid,
```

- [ ] **Step 3: Verify exports in packages/ui/src/index.ts**

Ensure both new components are exported:

```typescript
export { ReportCapabilityKPIGrid } from './components/ReportView/ReportCapabilityKPIGrid';
export { ReportPerformanceKPIGrid } from './components/ReportView/ReportPerformanceKPIGrid';
```

- [ ] **Step 4: Commit the spec document**

```bash
git add docs/superpowers/specs/2026-03-22-mode-aware-reports-design.md
git commit -m "docs: add mode-aware reports design spec"
```

- [ ] **Step 5: Commit documentation updates**

```bash
git add CLAUDE.md .claude/rules/monorepo.md packages/ui/src/index.ts
git commit -m "docs: update CLAUDE.md and monorepo.md with mode-aware report components"
```
