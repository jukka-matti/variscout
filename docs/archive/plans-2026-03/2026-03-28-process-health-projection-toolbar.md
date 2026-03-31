---
title: 'Process Health & Projection Toolbar — Phase 1 Implementation Plan'
---

# Process Health & Projection Toolbar — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge stats, filter chips, and variation bar into a single adaptive toolbar row. Replace the 3-row chart grid with a 2-row layout using a tabbed Histogram/ProbPlot card.

**Architecture:** The current two-section sticky nav (FilterBreadcrumb + toolbar) and the separate stats panel grid slot are consolidated into one `ProcessHealthBar` component. The chart grid reverts to 2-row (55fr/45fr) with the 3rd slot in row 2 becoming a tabbed verification card. Stats sidebar role shifts from "primary display" to "deep dive."

**Tech Stack:** React, Tailwind CSS, existing `@variscout/hooks` (useVariationTracking, useDashboardChartsBase), existing `@variscout/core` types (StatsResult, SpecLimits).

**Spec:** `docs/superpowers/specs/2026-03-28-process-health-projection-toolbar-design.md`

---

## File Structure

| File                                                                              | Action | Responsibility                                                            |
| --------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`                | Create | Unified toolbar: stats + chips + variation + target                       |
| `packages/ui/src/components/ProcessHealthBar/types.ts`                            | Create | Props interface                                                           |
| `packages/ui/src/components/ProcessHealthBar/index.ts`                            | Create | Barrel export                                                             |
| `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx` | Create | Component tests                                                           |
| `packages/ui/src/components/VerificationCard/VerificationCard.tsx`                | Create | Tabbed Histogram/ProbPlot card                                            |
| `packages/ui/src/components/VerificationCard/index.ts`                            | Create | Barrel export                                                             |
| `packages/ui/src/components/VerificationCard/__tests__/VerificationCard.test.tsx` | Create | Component tests                                                           |
| `packages/ui/src/index.ts`                                                        | Modify | Add exports                                                               |
| `packages/ui/src/components/DashboardBase/DashboardGrid.tsx`                      | Modify | Revert to 2-row grid, remove histogram/probability slots                  |
| `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx`                | Modify | Remove histogram/probability render slots, add verification card slot     |
| `apps/pwa/src/components/Dashboard.tsx`                                           | Modify | Replace sticky nav sections with ProcessHealthBar, wire verification card |
| `apps/azure/src/components/Dashboard.tsx`                                         | Modify | Same as PWA                                                               |
| `apps/pwa/src/components/__tests__/Dashboard.test.tsx`                            | Modify | Update mocks                                                              |
| `apps/azure/src/components/__tests__/Dashboard.test.tsx`                          | Modify | Update mocks                                                              |
| `docs/05-technical/architecture/dashboard-layout.md`                              | Modify | Update layout documentation                                               |

---

### Task 1: Create ProcessHealthBar component

**Files:**

- Create: `packages/ui/src/components/ProcessHealthBar/types.ts`
- Create: `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`
- Create: `packages/ui/src/components/ProcessHealthBar/index.ts`
- Create: `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx`

- [ ] **Step 1: Define the types**

```typescript
// packages/ui/src/components/ProcessHealthBar/types.ts
import type { StatsResult, SpecLimits } from '@variscout/core';
import type { FilterChipData } from '@variscout/hooks';

export interface ProcessHealthBarProps {
  /** Current stats for the filtered data */
  stats: StatsResult | null;
  /** Specification limits */
  specs: SpecLimits;
  /** User-defined Cpk target */
  cpkTarget?: number;
  /** Callback to change Cpk target inline */
  onCpkTargetChange?: (target: number) => void;
  /** Sample count of filtered data */
  sampleCount: number;

  /** Filter chip data from useVariationTracking */
  filterChipData: FilterChipData[];
  /** Column display aliases */
  columnAliases?: Record<string, string>;
  /** Update filter values (multi-select) */
  onUpdateFilterValues: (factor: string, newValues: (string | number)[]) => void;
  /** Remove a filter */
  onRemoveFilter: (factor: string) => void;
  /** Clear all filters */
  onClearAll?: () => void;

  /** Cumulative variation percentage in focus */
  cumulativeVariationPct?: number | null;
  /** Callback when variation bar is clicked */
  onVariationBarClick?: () => void;
  /** Pin current filter as finding */
  onPinFinding?: () => void;

  /** Layout mode toggle */
  layout: 'grid' | 'scroll';
  onLayoutChange: (layout: 'grid' | 'scroll') => void;

  /** Factor count and manage callback */
  factorCount: number;
  onManageFactors?: () => void;

  /** Export/Present callbacks */
  onExportCSV?: () => void;
  onEnterPresentationMode?: () => void;

  /** Open spec editor or capability suggestion modal */
  onSetSpecs?: () => void;
  /** Open Cpk click handler (navigate to capability view) */
  onCpkClick?: () => void;
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProcessHealthBar from '../ProcessHealthBar';

// Mock useTranslation
vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      formatStat: (v: number, d?: number) => v.toFixed(d ?? 2),
    }),
  };
});

const baseProps = {
  stats: null,
  specs: {},
  sampleCount: 30,
  filterChipData: [],
  onUpdateFilterValues: vi.fn(),
  onRemoveFilter: vi.fn(),
  layout: 'grid' as const,
  onLayoutChange: vi.fn(),
  factorCount: 2,
};

describe('ProcessHealthBar', () => {
  it('renders basic stats when no specs set', () => {
    render(
      <ProcessHealthBar
        {...baseProps}
        stats={{ mean: 11.74, median: 11.5, stdDev: 1.05, sigmaWithin: 0.9, mrBar: 1.0, ucl: 12.73, lcl: 10.75, outOfSpecPercentage: 0 }}
      />
    );
    expect(screen.getByText('11.74')).toBeInTheDocument();
    expect(screen.getByText('1.05')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders Cpk and Pass Rate when specs are set', () => {
    render(
      <ProcessHealthBar
        {...baseProps}
        stats={{ mean: 11.74, median: 11.5, stdDev: 1.05, sigmaWithin: 0.9, mrBar: 1.0, ucl: 12.73, lcl: 10.75, cpk: 0.26, cp: 1.01, outOfSpecPercentage: 33.3 }}
        specs={{ usl: 12.0, lsl: 10.0 }}
        cpkTarget={1.33}
      />
    );
    expect(screen.getByText('0.26')).toBeInTheDocument();
    expect(screen.getByText('66.7%')).toBeInTheDocument(); // 100 - 33.3
  });

  it('renders filter chips when drilling', () => {
    render(
      <ProcessHealthBar
        {...baseProps}
        filterChipData={[
          { factor: 'Bed', values: ['C'], contributionPct: 65, availableValues: [] },
        ]}
        cumulativeVariationPct={65}
      />
    );
    expect(screen.getByText(/Bed/)).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows "Set specs" prompt when no specs and onSetSpecs provided', () => {
    render(<ProcessHealthBar {...baseProps} onSetSpecs={vi.fn()} />);
    expect(screen.getByText(/specs/i)).toBeInTheDocument();
  });

  it('renders layout toggle', () => {
    render(<ProcessHealthBar {...baseProps} />);
    expect(screen.getByLabelText('Grid layout')).toBeInTheDocument();
    expect(screen.getByLabelText('Scroll layout')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- --run -t "ProcessHealthBar"`
Expected: FAIL — module not found

- [ ] **Step 4: Implement ProcessHealthBar component**

```typescript
// packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx
import React from 'react';
import { LayoutGrid, List, Settings2 } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { FilterChipDropdown } from '../FilterBreadcrumb/FilterChipDropdown';
import type { ProcessHealthBarProps } from './types';

// Cpk color: green >= target, amber >= 1.0, red < 1.0
function cpkColor(cpk: number | undefined, target?: number): string {
  if (cpk === undefined || cpk === null) return 'text-content';
  if (target !== undefined && cpk >= target) return 'text-green-500';
  if (cpk >= 1.0) return 'text-amber-500';
  return 'text-red-400';
}

// Variation bar color: green >= 50%, amber 30-50%, blue < 30%
function variationColor(pct: number): string {
  if (pct >= 50) return 'bg-green-500';
  if (pct >= 30) return 'bg-amber-500';
  return 'bg-blue-500';
}

function variationTextColor(pct: number): string {
  if (pct >= 50) return 'text-green-500';
  if (pct >= 30) return 'text-amber-500';
  return 'text-blue-500';
}

const ProcessHealthBar: React.FC<ProcessHealthBarProps> = ({
  stats,
  specs,
  cpkTarget,
  onCpkTargetChange,
  sampleCount,
  filterChipData,
  columnAliases,
  onUpdateFilterValues,
  onRemoveFilter,
  onClearAll,
  cumulativeVariationPct,
  onVariationBarClick,
  onPinFinding,
  layout,
  onLayoutChange,
  factorCount,
  onManageFactors,
  onExportCSV,
  onEnterPresentationMode,
  onSetSpecs,
  onCpkClick,
}) => {
  const { formatStat } = useTranslation();
  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
  const hasFilters = filterChipData.length > 0;
  const passRate = hasSpecs && stats ? 100 - (stats.outOfSpecPercentage || 0) : undefined;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border-b border-edge text-xs" data-testid="process-health-bar">
      {/* Layout toggle */}
      <div className="hidden lg:flex items-center bg-surface rounded-lg p-0.5" data-export-hide>
        <button
          onClick={() => onLayoutChange('grid')}
          className={`p-1 px-2 rounded-md text-xs font-medium transition-colors ${layout === 'grid' ? 'bg-surface-tertiary text-content shadow-sm' : 'text-content-secondary hover:text-content'}`}
          aria-label="Grid layout"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          onClick={() => onLayoutChange('scroll')}
          className={`p-1 px-2 rounded-md text-xs font-medium transition-colors ${layout === 'scroll' ? 'bg-surface-tertiary text-content shadow-sm' : 'text-content-secondary hover:text-content'}`}
          aria-label="Scroll layout"
        >
          <List size={14} />
        </button>
      </div>

      {/* Factors */}
      {onManageFactors && factorCount > 0 && (
        <button
          onClick={onManageFactors}
          className="flex items-center gap-1 text-xs text-content-secondary hover:text-content transition-colors"
          data-export-hide
        >
          <Settings2 size={12} />
          Factors ({factorCount})
        </button>
      )}

      <div className="w-px h-5 bg-edge flex-shrink-0" />

      {/* Stats */}
      <div className="flex items-baseline gap-2 flex-shrink-0">
        {hasSpecs && passRate !== undefined && (
          <>
            <span className="text-content-muted text-[9px] uppercase">Pass</span>
            <span className={`font-bold text-xs ${passRate >= 99 ? 'text-green-500' : passRate >= 90 ? 'text-amber-500' : 'text-red-400'}`}>
              {formatStat(passRate, 1)}%
            </span>
          </>
        )}
        {hasSpecs && stats?.cpk !== undefined && (
          <>
            <span className="text-content-muted text-[9px] uppercase">Cpk</span>
            <span
              className={`font-bold text-xs cursor-pointer ${cpkColor(stats.cpk, cpkTarget)}`}
              onClick={onCpkClick}
              role={onCpkClick ? 'button' : undefined}
              tabIndex={onCpkClick ? 0 : undefined}
            >
              {formatStat(stats.cpk)}
            </span>
            {cpkTarget !== undefined && (
              <span className={`text-[8px] ${cpkColor(stats.cpk, cpkTarget)}`}>/ {formatStat(cpkTarget)}</span>
            )}
          </>
        )}
        {stats && (
          <>
            <span className="text-content-muted text-[9px] uppercase">Mean</span>
            <span className="text-content font-semibold text-[11px]">{formatStat(stats.mean)}</span>
            <span className="text-content-muted text-[9px]">σ</span>
            <span className="text-content font-semibold text-[11px]">{formatStat(stats.stdDev)}</span>
            <span className="text-content-muted text-[9px]">n</span>
            <span className="text-content-secondary text-[11px]">{sampleCount}</span>
          </>
        )}
        {!hasSpecs && onSetSpecs && (
          <button onClick={onSetSpecs} className="text-blue-400 text-[10px] hover:text-blue-300 transition-colors">
            Set specs →
          </button>
        )}
      </div>

      {/* Filter chips (when drilling) */}
      {hasFilters && (
        <>
          <div className="w-px h-5 bg-edge flex-shrink-0" />
          <div className="flex items-center gap-1 flex-shrink-0">
            {filterChipData.map(chip => (
              <div
                key={chip.factor}
                className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5 text-[10px] text-blue-300"
              >
                <span className="truncate max-w-[100px]">
                  {columnAliases?.[chip.factor] ?? chip.factor}: {chip.values.join(', ')}
                </span>
                {chip.contributionPct > 0 && (
                  <span className="text-content-muted">{Math.round(chip.contributionPct)}%</span>
                )}
                <button
                  onClick={() => onRemoveFilter(chip.factor)}
                  className="text-content-muted hover:text-content ml-0.5"
                  aria-label={`Remove ${chip.factor} filter`}
                >
                  ✕
                </button>
              </div>
            ))}
            {onClearAll && filterChipData.length > 1 && (
              <button onClick={onClearAll} className="text-[9px] text-content-muted hover:text-content transition-colors">
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-2" />

      {/* Variation bar (when drilling) */}
      {cumulativeVariationPct != null && cumulativeVariationPct > 0 && (
        <div
          className="flex items-center gap-1.5 min-w-[120px] flex-shrink-0 cursor-pointer"
          onClick={onVariationBarClick}
          role={onVariationBarClick ? 'button' : undefined}
        >
          <div className="flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${variationColor(cumulativeVariationPct)}`}
              style={{ width: `${Math.min(100, cumulativeVariationPct)}%` }}
            />
          </div>
          <span className={`text-[10px] font-semibold whitespace-nowrap ${variationTextColor(cumulativeVariationPct)}`}>
            {Math.round(cumulativeVariationPct)}%
          </span>
        </div>
      )}

      {/* Cpk target inline editor */}
      {hasSpecs && cpkTarget !== undefined && onCpkTargetChange && (
        <>
          <div className="w-px h-5 bg-edge flex-shrink-0" />
          <div className="flex items-baseline gap-1 flex-shrink-0 text-[9px] text-content-muted">
            target:
            <input
              type="number"
              value={cpkTarget}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) onCpkTargetChange(v);
              }}
              className="w-10 bg-surface border border-edge rounded px-1 py-0.5 text-[10px] text-content text-center"
              step={0.01}
              min={0.1}
              aria-label="Cpk target"
            />
          </div>
        </>
      )}

      {/* Export / Present */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0" data-export-hide>
        {hasFilters && onPinFinding && (
          <>
            <div className="w-px h-5 bg-edge" />
            <button onClick={onPinFinding} className="text-[10px] text-content-secondary hover:text-content transition-colors" title="Pin as finding">
              📌
            </button>
          </>
        )}
        <div className="w-px h-5 bg-edge" />
        {onExportCSV && (
          <button onClick={onExportCSV} className="text-[10px] text-content-secondary hover:text-content transition-colors">
            Export
          </button>
        )}
        {onEnterPresentationMode && (
          <button onClick={onEnterPresentationMode} className="text-[10px] text-content-secondary hover:text-content transition-colors">
            Present
          </button>
        )}
      </div>
    </div>
  );
};

export default ProcessHealthBar;
```

- [ ] **Step 5: Create barrel export**

```typescript
// packages/ui/src/components/ProcessHealthBar/index.ts
export { default as ProcessHealthBar } from './ProcessHealthBar';
export type { ProcessHealthBarProps } from './types';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- --run -t "ProcessHealthBar"`
Expected: PASS

- [ ] **Step 7: Export from @variscout/ui**

Add to `packages/ui/src/index.ts`:

```typescript
export { ProcessHealthBar, type ProcessHealthBarProps } from './components/ProcessHealthBar';
```

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/ProcessHealthBar/ packages/ui/src/index.ts
git commit -m "feat: add ProcessHealthBar component for unified toolbar stats"
```

---

### Task 2: Create VerificationCard (tabbed Histogram/ProbPlot)

**Files:**

- Create: `packages/ui/src/components/VerificationCard/VerificationCard.tsx`
- Create: `packages/ui/src/components/VerificationCard/index.ts`
- Create: `packages/ui/src/components/VerificationCard/__tests__/VerificationCard.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/ui/src/components/VerificationCard/__tests__/VerificationCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VerificationCard from '../VerificationCard';

vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return { ...actual, useTranslation: () => ({ t: (k: string) => k }) };
});

describe('VerificationCard', () => {
  const histogram = <div data-testid="histogram">Histogram</div>;
  const probPlot = <div data-testid="prob-plot">ProbPlot</div>;

  it('renders histogram tab by default', () => {
    render(<VerificationCard renderHistogram={histogram} renderProbabilityPlot={probPlot} />);
    expect(screen.getByTestId('histogram')).toBeInTheDocument();
    expect(screen.queryByTestId('prob-plot')).not.toBeInTheDocument();
  });

  it('switches to probability plot tab on click', () => {
    render(<VerificationCard renderHistogram={histogram} renderProbabilityPlot={probPlot} />);
    fireEvent.click(screen.getByText('stats.probPlot'));
    expect(screen.getByTestId('prob-plot')).toBeInTheDocument();
    expect(screen.queryByTestId('histogram')).not.toBeInTheDocument();
  });

  it('renders with custom default tab', () => {
    render(<VerificationCard renderHistogram={histogram} renderProbabilityPlot={probPlot} defaultTab="probability" />);
    expect(screen.getByTestId('prob-plot')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- --run -t "VerificationCard"`
Expected: FAIL

- [ ] **Step 3: Implement VerificationCard**

```typescript
// packages/ui/src/components/VerificationCard/VerificationCard.tsx
import React, { useState } from 'react';
import { useTranslation } from '@variscout/hooks';

export interface VerificationCardProps {
  renderHistogram: React.ReactNode;
  renderProbabilityPlot: React.ReactNode;
  defaultTab?: 'histogram' | 'probability';
}

const TAB_ACTIVE = 'bg-surface-tertiary text-content shadow-sm';
const TAB_INACTIVE = 'text-content-secondary hover:text-content';

const VerificationCard: React.FC<VerificationCardProps> = ({
  renderHistogram,
  renderProbabilityPlot,
  defaultTab = 'histogram',
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'histogram' | 'probability'>(defaultTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-0.5 bg-surface/50 p-0.5 rounded-lg border border-edge/50 mb-2" data-export-hide>
        <button
          onClick={() => setActiveTab('histogram')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'histogram' ? TAB_ACTIVE : TAB_INACTIVE}`}
        >
          {t('stats.histogram')}
        </button>
        <button
          onClick={() => setActiveTab('probability')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'probability' ? TAB_ACTIVE : TAB_INACTIVE}`}
        >
          {t('stats.probPlot')}
        </button>
      </div>
      {/* Chart content */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          {activeTab === 'histogram' ? renderHistogram : renderProbabilityPlot}
        </div>
      </div>
    </div>
  );
};

export default VerificationCard;
```

- [ ] **Step 4: Create barrel export**

```typescript
// packages/ui/src/components/VerificationCard/index.ts
export { default as VerificationCard } from './VerificationCard';
export type { VerificationCardProps } from './VerificationCard';
```

- [ ] **Step 5: Export from @variscout/ui**

Add to `packages/ui/src/index.ts`:

```typescript
export { VerificationCard, type VerificationCardProps } from './components/VerificationCard';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- --run -t "VerificationCard"`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/VerificationCard/ packages/ui/src/index.ts
git commit -m "feat: add VerificationCard tabbed Histogram/ProbPlot component"
```

---

### Task 3: Simplify DashboardGrid back to 2-row layout

**Files:**

- Modify: `packages/ui/src/components/DashboardBase/DashboardGrid.tsx`
- Modify: `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx`

- [ ] **Step 1: Rewrite DashboardGrid — remove 3-row mode, add verificationCard slot**

Replace the content of `DashboardGrid.tsx` with:

```typescript
import React from 'react';

export interface DashboardGridProps {
  ichartCard: React.ReactNode;
  boxplotCard: React.ReactNode;
  paretoCard?: React.ReactNode;
  /** Tabbed Histogram/ProbPlot card (replaces separate histogram/probability slots) */
  verificationCard?: React.ReactNode;
  /** Stats panel (only when sidebar is closed) */
  statsPanel?: React.ReactNode;
  layout?: 'grid' | 'scroll';
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  verificationCard,
  statsPanel,
  layout = 'grid',
}) => {
  if (layout === 'scroll') {
    return (
      <div className="flex flex-col gap-4 p-3 overflow-y-auto">
        <div className="min-h-[500px] rounded-2xl">{ichartCard}</div>
        <div className="min-h-[400px] rounded-2xl">{boxplotCard}</div>
        {paretoCard && <div className="min-h-[400px] rounded-2xl">{paretoCard}</div>}
        {verificationCard && <div className="min-h-[400px] rounded-2xl">{verificationCard}</div>}
        {statsPanel && <div className="rounded-2xl">{statsPanel}</div>}
      </div>
    );
  }

  // Grid mode: 2-row viewport-fit (55fr/45fr)
  return (
    <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:h-full lg:grid lg:grid-rows-[55fr_45fr] lg:overflow-hidden">
      <div className="min-h-0 overflow-hidden lg:rounded-2xl">{ichartCard}</div>
      <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
          {boxplotCard}
          {paretoCard}
          {verificationCard}
        </div>
        {statsPanel && (
          <div className="min-h-0 overflow-hidden lg:w-[280px] lg:flex-shrink-0">{statsPanel}</div>
        )}
      </div>
    </div>
  );
};

export default DashboardGrid;
```

- [ ] **Step 2: Update DashboardLayoutBase — replace histogram/probability slots with verificationCard**

In `DashboardLayoutBase.tsx`, replace the `renderHistogramContent` and `renderProbabilityPlotContent` props with a single `renderVerificationCard` prop:

1. In the interface, replace:

```typescript
  renderHistogramContent?: React.ReactNode;
  renderProbabilityPlotContent?: React.ReactNode;
```

with:

```typescript
  /** Tabbed verification card (Histogram/ProbPlot) */
  renderVerificationCard?: React.ReactNode;
```

2. In the destructuring, replace `renderHistogramContent, renderProbabilityPlotContent` with `renderVerificationCard`.

3. In the DashboardGrid call, replace the `histogramCard` and `probabilityPlotCard` props with:

```typescript
verificationCard={
  renderVerificationCard ? (
    <DashboardChartCard
      id="verification-card"
      testId="chart-verification"
      chartName="verification"
      className="flex-1 min-w-[250px] min-h-0"
      onMaximize={() => setFocusedChart('histogram')}
      copyFeedback={copyFeedback}
      onCopyChart={onCopyChart}
      onDownloadPng={onDownloadPng}
      onDownloadSvg={onDownloadSvg}
      onShareChart={onShareChart}
      title={
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
          Verification
        </h3>
      }
    >
      {renderVerificationCard}
    </DashboardChartCard>
  ) : undefined
}
```

4. Remove the separate `histogramCard` and `probabilityPlotCard` DashboardChartCard blocks.

- [ ] **Step 3: Run build to check types**

Run: `pnpm --filter @variscout/ui build 2>&1 | tail -5`
Expected: Build succeeds (apps will fail until wired up in Task 4/5)

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/DashboardBase/
git commit -m "refactor: simplify DashboardGrid to 2-row with verificationCard slot"
```

---

### Task 4: Wire ProcessHealthBar + VerificationCard in PWA Dashboard

**Files:**

- Modify: `apps/pwa/src/components/Dashboard.tsx`
- Modify: `apps/pwa/src/components/__tests__/Dashboard.test.tsx`

- [ ] **Step 1: Import new components in PWA Dashboard**

Add imports:

```typescript
import { ProcessHealthBar, VerificationCard } from '@variscout/ui';
```

Remove separate CapabilityHistogram and ProbabilityPlot imports (they'll be used inside VerificationCard).

- [ ] **Step 2: Replace sticky nav sections with ProcessHealthBar**

Replace the entire sticky nav content (FilterBreadcrumb section + toolbar section, lines ~417-525) with a single `ProcessHealthBar` component. Keep SelectionPanel below it.

The ProcessHealthBar receives all the props from the existing toolbar and FilterBreadcrumb:

- `stats`, `specs`, `cpkTarget`, `sampleCount` from `useData()`
- `filterChipData`, `cumulativeVariationPct` from `useDashboardChartsBase()`
- `layout`, `onLayoutChange` from `displayOptions`
- `factorCount`, `onManageFactors` from props
- `onExportCSV`, `onEnterPresentationMode` from props
- Filter handlers from `useFilterHandlers()`
- `onSetSpecs` → opens spec editor or capability suggestion modal

- [ ] **Step 3: Replace renderHistogramContent/renderProbabilityPlotContent with renderVerificationCard**

Replace the two separate render props with:

```typescript
renderVerificationCard={
  histogramData.length > 0 && stats ? (
    <VerificationCard
      renderHistogram={<CapabilityHistogram data={histogramData} specs={specs} mean={stats.mean} />}
      renderProbabilityPlot={<ProbabilityPlot data={histogramData} mean={stats.mean} stdDev={stats.stdDev} />}
    />
  ) : undefined
}
```

Remove the `(displayOptions.dashboardLayout ?? 'grid') === 'grid'` guard — the verification card shows in both grid and scroll modes (DashboardGrid handles the layout differences).

- [ ] **Step 4: Update focused view handling**

Replace the `focusedChart === 'histogram' || focusedChart === 'probability-plot'` focused view block — the verification card's maximize button sets `focusedChart` to `'histogram'`. The existing focused view handling for histogram/probability-plot stays as-is.

- [ ] **Step 5: Update Dashboard test mocks**

Add mock for ProcessHealthBar and VerificationCard:

```typescript
vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: () => <div data-testid="process-health-bar">Health Bar</div>,
    VerificationCard: ({ renderHistogram }: any) => <div data-testid="verification-card">{renderHistogram}</div>,
  };
});
```

- [ ] **Step 6: Build and test PWA**

Run: `pnpm --filter @variscout/pwa build 2>&1 | tail -5`
Run: `pnpm --filter @variscout/pwa test -- --run 2>&1 | tail -10`
Expected: Both pass

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/
git commit -m "feat: wire ProcessHealthBar + VerificationCard in PWA Dashboard"
```

---

### Task 5: Wire ProcessHealthBar + VerificationCard in Azure Dashboard

**Files:**

- Modify: `apps/azure/src/components/Dashboard.tsx`
- Modify: `apps/azure/src/components/__tests__/Dashboard.test.tsx`

- [ ] **Step 1: Same pattern as PWA Task 4**

Follow the same steps as Task 4 but for the Azure Dashboard:

1. Import `ProcessHealthBar` and `VerificationCard` from `@variscout/ui`
2. Replace sticky nav with `ProcessHealthBar` (Azure adds `onShareChart`, NarrativeBar integration)
3. Replace `renderHistogramContent`/`renderProbabilityPlotContent` with `renderVerificationCard`
4. When `isStatsSidebarOpen`: omit `statsPanel` from grid (already done), keep `verificationCard`
5. Update test mocks

Key Azure differences:

- `onCpkTargetChange` wired to `setCpkTarget` from `useData()`
- `NarrativeBar` stays as a separate bottom bar (not in ProcessHealthBar)
- `onSetSpecs` opens the capability suggestion modal

- [ ] **Step 2: Build and test Azure**

Run: `pnpm --filter @variscout/azure-app build 2>&1 | tail -5`
Run: `pnpm --filter @variscout/azure-app test -- --run 2>&1 | tail -10`
Expected: Both pass

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/
git commit -m "feat: wire ProcessHealthBar + VerificationCard in Azure Dashboard"
```

---

### Task 6: Update documentation

**Files:**

- Modify: `docs/05-technical/architecture/dashboard-layout.md`
- Modify: `CLAUDE.md` (Key Entry Points table, if ProcessHealthBar is significant enough)

- [ ] **Step 1: Update dashboard-layout.md**

Update the following sections:

- **Height chain**: Remove 3-row grid reference, update to show ProcessHealthBar in the sticky nav area
- **Grid Slot Mapping**: Revert to 2-row with verification card as 3rd slot in row 2
- **Panel Sidebars**: Update stats sidebar description (now "deep dive" role)
- **Panel Interactions**: Add ProcessHealthBar row
- **Key files**: Add ProcessHealthBar, VerificationCard
- **Chart Export**: Update for verification card (exports active tab chart)

- [ ] **Step 2: Update spec status**

Change `docs/superpowers/specs/2026-03-28-process-health-projection-toolbar-design.md` status from `draft` to `implementing` in frontmatter.

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: update dashboard layout architecture for ProcessHealthBar + VerificationCard"
```

---

### Task 7: Full integration test

- [ ] **Step 1: Run all package tests**

```bash
pnpm --filter @variscout/core test -- --run
pnpm --filter @variscout/hooks test -- --run
pnpm --filter @variscout/ui test -- --run
pnpm --filter @variscout/pwa test -- --run
pnpm --filter @variscout/azure-app test -- --run
```

Expected: All pass

- [ ] **Step 2: Build both apps**

```bash
pnpm --filter @variscout/pwa build
pnpm --filter @variscout/azure-app build
```

Expected: Both build clean

- [ ] **Step 3: Visual verification**

Start dev servers and verify:

```bash
pnpm dev  # PWA at :5173
pnpm --filter @variscout/azure-app dev  # Azure at :5174
```

Verify in browser:

1. Grid mode: 2-row layout with verification card (Histogram/ProbPlot tabs) in row 2
2. ProcessHealthBar shows stats inline, layout toggle, factors, export
3. Drill into a factor: filter chips appear in toolbar, variation bar fills
4. Toggle Histogram ↔ Probability Plot in verification card
5. Scroll mode: all charts stacked, verification card as separate scrollable element
6. Stats sidebar open: stats removed from ProcessHealthBar (or stays for comparison), verification card stays

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify Phase 1 integration — ProcessHealthBar + VerificationCard"
```
