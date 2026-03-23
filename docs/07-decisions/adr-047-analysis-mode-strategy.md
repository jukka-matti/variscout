---
title: 'ADR-047: Analysis Mode Strategy Pattern'
---

# ADR-047: Analysis Mode Strategy Pattern

**Status:** Accepted
**Date:** 2026-03-23

## Context

VariScout supports three analysis modes that change which charts, KPIs, and metric labels appear in the dashboard and report views:

| Mode          | When active                 | Primary charts                                              |
| ------------- | --------------------------- | ----------------------------------------------------------- |
| `standard`    | Default                     | I-Chart, Boxplot, Pareto                                    |
| `performance` | Multi-measure data detected | Performance IChart, Performance Boxplot, Performance Pareto |
| `yamazumi`    | Time-study data detected    | Yamazumi Chart, I-Chart, Pareto (5 modes)                   |

A fourth rendering concern — **capability** (histogram + probability plot) — is toggled by `displayOptions.showCapability` and applies within `standard` and `performance` modes. It is not a separate mode.

### The branching problem

As Yamazumi mode was added (ADR-034), mode-specific branching was implemented inline at each call site. By March 2026, the codebase contained approximately **80 mode-branching ternaries** across ~10 files:

```typescript
// Scattered in ReportView, useReportSections, EditorDashboardView, etc.
const chartSlot1 = isYamazumiMode
  ? <YamazumiIChart />
  : isPerformanceMode
  ? <PerformanceIChart />
  : <IChart />;

const kpiComponent = isYamazumiMode
  ? <YamazumiSummaryBar />
  : isPerformanceMode
  ? <PerformanceKPIGrid />
  : <CapabilityKPIGrid />; // only when showCapability
```

Adding a fourth analysis mode would require auditing all 10 files. The branching also incorrectly modeled capability: `showCapability` is an analytical thread within a mode, not a mode itself, but it was being checked in the same ternary chains.

### Options considered

**Option A: 4-value `AnalysisMode`** — Add `capability` as a fourth mode value. Rejected: capability is not a methodology mode; it overlaps with standard and performance.

**Option B: Strategy objects only** — Replace `AnalysisMode` with a strategy registry. Rejected: `AnalysisMode` is already used in `AnalysisState`, persistence, i18n keys, and AI context. Renaming it adds churn with no benefit.

**Option C: Hybrid** — Keep `AnalysisMode` as the 3-value source of truth, add a `resolveMode()` function that returns a 4-value `ResolvedMode`, and build strategy objects on top. Accepted.

## Decision

### Hybrid approach: `AnalysisMode` + `resolveMode()` + strategy objects

#### 1. `AnalysisMode` stays as the 3-value domain type

```typescript
// @variscout/core/types.ts (unchanged)
type AnalysisMode = 'standard' | 'performance' | 'yamazumi';
```

This type is used in `AnalysisState`, saved to IndexedDB, used in AI context strings, and drives mode detection. It does not change.

#### 2. `resolveMode()` returns a 4-value `ResolvedMode`

```typescript
// @variscout/core/types.ts (new)
type ResolvedMode = 'standard' | 'performance' | 'yamazumi' | 'capability';

// @variscout/core/performance.ts (new function)
function resolveMode(mode: AnalysisMode, showCapability: boolean): ResolvedMode {
  if (mode === 'standard' && showCapability) return 'capability';
  return mode;
}
```

`capability` is produced when `mode === 'standard'` and the capability toggle is on. Performance + capability is not a named resolved mode — performance mode always shows the capability chart in its own slot.

#### 3. Strategy objects define mode-specific rendering contracts

```typescript
interface AnalysisModeStrategy {
  chartSlots: {
    slot1: ComponentType;
    slot2: ComponentType;
    slot3: ComponentType;
    slot4: ComponentType;
  };
  kpiComponent: ComponentType;
  metricLabels: Record<string, string>;
  aiHints: string[];
}

const strategies: Record<ResolvedMode, AnalysisModeStrategy> = {
  standard: {
    /* I-Chart, Boxplot, Pareto, Stats */
  },
  performance: {
    /* PerformanceIChart, PerformanceBoxplot, PerformancePareto, Stats */
  },
  yamazumi: {
    /* YamazumiIChart, YamazumiChart, YamazumiPareto, YamazumiSummaryBar */
  },
  capability: {
    /* CapabilityHistogram, ProbabilityPlot, Pareto, CapabilityKPIGrid */
  },
};
```

Callers replace ternary chains with a single strategy lookup:

```typescript
const strategy = strategies[resolveMode(mode, displayOptions.showCapability)];
return <strategy.chartSlots.slot1 />;
```

#### 4. Cascading ternaries eliminated in priority files

The following files are refactored to use strategy lookup instead of inline ternaries:

- `packages/ui/src/components/ReportView/ReportViewBase.tsx` — report section composition
- `packages/hooks/src/useReportSections.ts` — section availability detection

Other files (`EditorDashboardView`, `useAIContext`) are refactored progressively as they are touched.

#### 5. Adding a new analysis mode

Adding a fifth analysis mode requires:

1. Add value to `AnalysisMode` in `@variscout/core/types.ts`
2. Update `resolveMode()` if it produces a new `ResolvedMode` variant
3. Add one strategy object to the registry
4. Update mode detection logic (already isolated in `detectAnalysisMode()`)

No other files need to change.

## Consequences

### Positive

- Adding a new mode is additive (one strategy object), not a multi-file search-and-edit
- `capability` is correctly modeled as an analytical thread within standard mode, not a parallel mode
- `ReportViewBase` and `useReportSections` replace cascading ternaries with a single strategy lookup
- Strategy objects are independently testable (no React rendering required)
- AI hints per mode are co-located with chart and KPI decisions

### Negative

- `resolveMode()` adds a thin indirection layer — callers must remember to call it before strategy lookup
- Strategy objects require type discipline; forgetting to update all 4 keys is a compile-time error but requires understanding the interface
- Initial refactoring of existing ternary sites takes one development session

### Neutral

- `AnalysisMode` in persistence, i18n, and AI context is unchanged
- Mode detection logic (auto-detect from data) is unchanged
- PWA is unaffected (only supports `standard` mode today)

## Related

- [ADR-034: Yamazumi Analysis Mode](adr-034-yamazumi-analysis-mode.md) — introduced the third mode that motivated this pattern
- [ADR-045: Modular Architecture](adr-045-modular-architecture.md) — architectural context for where strategy objects live
- Full design: `docs/superpowers/specs/2026-03-23-event-driven-architecture-design.md`
