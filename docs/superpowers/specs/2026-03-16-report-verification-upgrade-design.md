---
title: Report Verification Section — Staged Evidence Upgrade
audience: [analyst, engineer]
category: feature
status: draft
date: 2026-03-16
related: [adr-024, adr-023, staged-analysis, report-view, tier-4]
---

# Report Verification Section — Staged Evidence Upgrade

## Problem

The Report View's Step 5 (Verification — "Did the actions work?") currently shows only a text callout: _"Before/after comparison data is available. View the full staged analysis in the dashboard."_ This is a placeholder. Meanwhile, ADR-023 Tier 4 has shipped all the visual building blocks for staged before/after comparison:

- `StagedComparisonCard` — before/after stats table with color-coded deltas
- Staged I-Chart — time-series with per-stage control limits and boundary lines
- Dual-stage Boxplot — side-by-side Before/After sub-boxes per category
- Capability Histogram — Cpk comparison badge (Before → After with delta)
- Pareto with rank change — `↑N`/`↓N` indicators showing category movement

The report should render actual staged evidence instead of deferring to the dashboard.

## Design Decisions

### 1. Scope: Step 5 only

Only the Verification section (Step 5) is upgraded. Steps 1–4 remain unchanged. This is the natural home for before/after evidence in the QC Story methodology.

### 2. Stacked vertical layout

When staged data exists, Step 5 renders:

1. **Toggle chip bar** — one chip per available chart type
2. **Active charts stack vertically** at full width, matching the rest of the report's scrollable flow

### 3. Smart defaults + fully independent toggles

Each chart type has an availability condition and a default-ON condition:

| Chart ID    | Label     | Available when...                          | Default ON when...    |
| ----------- | --------- | ------------------------------------------ | --------------------- |
| `stats`     | Stats     | `stagedComparison` exists                  | Always when available |
| `ichart`    | I-Chart   | `stagedStats` exists                       | Always when available |
| `boxplot`   | Boxplot   | `factors.length > 0` AND `stageColumn` set | When available        |
| `histogram` | Histogram | `specs.usl` or `specs.lsl` defined         | When available        |
| `pareto`    | Pareto    | `comparisonData` exists                    | When available        |

**All chips are independently toggleable** — any chart can be turned off, including Stats and I-Chart. The user has full control to curate exactly which evidence appears.

**Unavailable charts** show as struck-through disabled chips (not hidden), so users understand what would be possible with different data.

### 4. Toggle state is ephemeral

Toggle selections reset to smart defaults each time the report is opened. No persistence in `AnalysisState` or `ViewState`.

### 5. Chip states

| State       | Visual                                                              |
| ----------- | ------------------------------------------------------------------- |
| Active (ON) | Blue filled chip (`bg-blue-500 text-white`)                         |
| Available   | Outline chip (`border-slate-600 text-slate-400`)                    |
| Unavailable | Struck-through outline chip, `pointer-events: none`, `opacity: 0.5` |

## Component Architecture

### New hook: `useVerificationCharts`

**Package:** `@variscout/hooks`

```typescript
type VerificationChartId = 'stats' | 'ichart' | 'boxplot' | 'histogram' | 'pareto';

interface VerificationChartOption {
  id: VerificationChartId;
  label: string;
  available: boolean;
}

interface UseVerificationChartsOptions {
  stagedComparison: StagedComparison | null;
  stagedStats: StagedStatsResult | null;
  factors: string[];
  specs: SpecLimits;
  stageColumn: string | null;
  comparisonData: Map<string, number> | null;
}

interface UseVerificationChartsResult {
  charts: VerificationChartOption[]; // All 5 chart types with availability
  activeCharts: Set<VerificationChartId>; // Currently toggled ON
  toggleChart: (id: VerificationChartId) => void;
  hasAnyAvailable: boolean; // True if at least one chart is available
}
```

Smart defaults: on mount, enable all available charts. `toggleChart` flips individual charts. Unavailable charts cannot be toggled on.

**Ordering guarantee:** The hook returns `charts` in the canonical render order: `stats`, `ichart`, `boxplot`, `histogram`, `pareto`. `VerificationEvidenceBase` iterates this array in order for both chip rendering and chart rendering.

### New shared component: `VerificationEvidenceBase`

**Package:** `@variscout/ui`

**Props:**

```typescript
interface VerificationEvidenceBaseProps {
  charts: VerificationChartOption[];
  activeCharts: Set<VerificationChartId>;
  onToggleChart: (id: VerificationChartId) => void;
  renderChart: (id: VerificationChartId) => React.ReactNode | null;
  colorScheme?: Partial<VerificationEvidenceColorScheme>;
}
```

**Rendering:**

1. Chip bar: horizontal flex-wrap row of toggle chips
2. Active chart stack: maps `activeCharts` → `renderChart(id)` in defined order (stats, ichart, boxplot, histogram, pareto)
3. Each rendered chart wrapped in `ReportChartSnapshot`-style container (filter label + copy button)

Follows existing `*Base` + `colorScheme` pattern.

### Modified: Azure `ReportView.tsx` — Step 5 render

Replace the placeholder callout in the Step 5 `renderSection` callback with:

```
useVerificationCharts({ stagedComparison, stagedStats, factors, specs, stageColumn, comparisonData })
  → charts, activeCharts, toggleChart

<VerificationEvidenceBase
  charts={charts}
  activeCharts={activeCharts}
  onToggleChart={toggleChart}
  renderChart={(id) => {
    switch (id) {
      case 'stats':    return <StagedComparisonCard comparison={stagedComparison} cpkTarget={cpkTarget} />
      case 'ichart':   return <IChartBase ... stagedStats={stagedStats} ... />
      case 'boxplot':  return <BoxplotBase ... fillOverrides={fillOverrides} groupSize={stageInfo.groupSize} xTickFormat={xTickFormat} />
      case 'histogram': return <CapabilityHistogram ... cpkBefore={firstStageCpk} cpkAfter={lastStageCpk} />
      case 'pareto':   return <ParetoChartBase ... comparisonData={comparisonData} showRankChange={true} />
    }
  }}
/>
```

**Data wiring in `ReportView.tsx`:**

1. **`stagedComparison`** — NOT in DataContext. Must be computed locally:

   ```typescript
   import { calculateStagedComparison } from '@variscout/core';
   const { stagedStats } = useData();
   const stagedComparison = useMemo(
     () => (stagedStats ? calculateStagedComparison(stagedStats) : null),
     [stagedStats]
   );
   ```

2. **`stageColumn` and `stageOrder`** — from DataContext analysis state (`stageColumn`, `stagedStats.stageOrder`)

3. **Boxplot data** — `useBoxplotData(filteredData, firstFactor, outcome, false, stageColumn, stageOrder)` where **`firstFactor = factors[0]`** (convention matching existing Step 2 boxplot). Returns `data`, `stageInfo`. Then `useBoxplotWrapperData({ data, specs, displayOptions, parentWidth, stageInfo })` returns `fillOverrides` and `xTickFormat`.

4. **`cpkBefore`/`cpkAfter`** — extracted from `stagedComparison.stages[0].stats.cpk` and `stagedComparison.stages[stages.length - 1].stats.cpk`

5. **Histogram `data` + `mean`** — filter `rawData` to the last stage's rows, extract the `outcome` column values. Use the last stage's stats for `mean`:

   ```typescript
   const lastStageKey = stagedStats.stageOrder[stagedStats.stageOrder.length - 1];
   const lastStageRows = rawData.filter(r => String(r[stageColumn]) === lastStageKey);
   const histogramValues = lastStageRows.map(r => Number(r[outcome])).filter(v => !isNaN(v));
   const lastStageStats = stagedStats.stages.get(lastStageKey);
   ```

6. **Pareto `comparisonData`** — computed by grouping `rawData` by `firstFactor` within each stage, counting rows per category:
   ```typescript
   const beforeRows = rawData.filter(r => String(r[stageColumn]) === firstStageKey);
   const beforeCounts = new Map<string, number>();
   for (const row of beforeRows) {
     const cat = String(row[firstFactor]);
     beforeCounts.set(cat, (beforeCounts.get(cat) ?? 0) + 1);
   }
   ```
   This `beforeCounts` is passed as `comparisonData` to ParetoChart alongside the current (after-stage) data.

### Fallback behavior (no staged data)

When `stagedStats` is null (no stage column in the analysis), Step 5 does NOT render `VerificationEvidenceBase`. Instead:

- **Findings outcomes list** — always rendered in Step 5 regardless of staged data (existing behavior, preserved)
- **Staged callout** — removed entirely (replaced by `VerificationEvidenceBase` when staged, absent when not staged)

The `useVerificationCharts` hook is only called when `stagedStats` exists. The Azure `ReportView.tsx` wrapper gates on `stagedComparison !== null` before rendering the evidence block.

### Existing components reused (no changes needed)

| Component               | Package             | How used                                                                                                              |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `StagedComparisonCard`  | `@variscout/ui`     | Stats comparison table                                                                                                |
| `IChartBase`            | `@variscout/charts` | Staged I-Chart with `stagedStats` + boundaries                                                                        |
| `BoxplotBase`           | `@variscout/charts` | Dual-stage boxplot via `fillOverrides` + `groupSize`                                                                  |
| `CapabilityHistogram`   | `@variscout/ui`     | Histogram with `cpkBefore`/`cpkAfter` badge                                                                           |
| `ParetoChartBase`       | `@variscout/charts` | Pareto with `showRankChange` + `comparisonData`                                                                       |
| `useBoxplotData`        | `@variscout/hooks`  | Staged grouping with `stageColumn`                                                                                    |
| `useBoxplotWrapperData` | `@variscout/hooks`  | Fill overrides + tick format                                                                                          |
| `computeRankDeltas`     | `@variscout/charts` | Rank delta computation                                                                                                |
| `stageColors`           | `@variscout/charts` | Stage fill color palette (consumed indirectly via `useBoxplotWrapperData`, not imported directly in `ReportView.tsx`) |
| `ReportChartSnapshot`   | `@variscout/ui`     | Chart container with copy button                                                                                      |

## Documentation Updates

The following project docs should be updated after implementation:

1. **ADR-024** (`docs/07-decisions/adr-024-scouting-report.md`)
   - Add Section 8: "Verification section renders staged evidence" describing the upgrade
   - Update the New Components table with `VerificationEvidenceBase` and `useVerificationCharts`

2. **CLAUDE.md** — Key Files table
   - Add `packages/hooks/src/useVerificationCharts.ts`
   - Add `packages/ui/src/components/ReportView/VerificationEvidenceBase.tsx`
   - Update Task-to-Documentation mapping: "Verification experience" row

3. **Feature parity matrix** (`docs/08-products/feature-parity.md`)
   - Update Report View row to note "Staged verification evidence (Azure Team/Team AI)"

4. **Scouting report design spec** (`docs/superpowers/specs/2026-03-16-scouting-report-design.md`)
   - Add a "Verification Evidence" subsection under the Step 5 section documenting: toggle chip UX, available chart types, smart defaults, and how staged data flows into chart components

5. **Testing rules** (`.claude/rules/testing.md`)
   - Add `useVerificationCharts` to hooks test ownership table

6. **Monorepo rules** (`.claude/rules/monorepo.md`)
   - Add `useVerificationCharts` to hooks export list
   - Add `VerificationEvidenceBase` to ui export list

## Files Modified (Summary)

| File                                                                 | Change                                          |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| `packages/hooks/src/useVerificationCharts.ts`                        | **NEW** — toggle state + availability detection |
| `packages/hooks/src/index.ts`                                        | Export new hook + types                         |
| `packages/ui/src/components/ReportView/VerificationEvidenceBase.tsx` | **NEW** — chip bar + chart stack                |
| `packages/ui/src/components/ReportView/index.ts`                     | Export new component                            |
| `packages/ui/src/index.ts`                                           | Export new component                            |
| `apps/azure/src/components/views/ReportView.tsx`                     | Replace Step 5 placeholder with staged evidence |
| `docs/07-decisions/adr-024-scouting-report.md`                       | Add staged verification section                 |
| `CLAUDE.md`                                                          | Key files + task mapping updates                |
| `docs/08-products/feature-parity.md`                                 | Feature parity update                           |
| `.claude/rules/testing.md`                                           | Test ownership                                  |
| `.claude/rules/monorepo.md`                                          | Export lists                                    |

## Tests

| Test                                                                                | What it verifies                                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/hooks/src/__tests__/useVerificationCharts.test.ts`                        | Availability detection, smart defaults, toggle on/off, unavailable chips can't toggle                      |
| `packages/ui/src/components/ReportView/__tests__/VerificationEvidenceBase.test.tsx` | Chip rendering, active/available/unavailable states, chart render callbacks invoked for active charts only |
| `apps/azure/src/components/__tests__/ReportView.test.tsx`                           | Step 5 renders staged evidence when `stagedComparison` exists, falls back to callout when no staged data   |

## Verification

1. Load Azure app with staged data (coffee case study with stage column)
2. Open Report View → scroll to Step 5
3. Verify: Stats card + I-Chart + available charts render with correct staged data
4. Toggle chips on/off → charts appear/disappear
5. Unavailable chips are struck-through and non-interactive
6. Copy individual chart → verify PNG export works
7. Copy section as slide → verify staged charts included
8. Run `pnpm -r test` → all tests pass
