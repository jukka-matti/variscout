# Shared Packages

The monorepo contains several shared packages that provide common functionality across apps.

---

## Package Overview

| Package             | Purpose                     | React? |
| ------------------- | --------------------------- | ------ |
| `@variscout/core`   | Statistics, parsing, types  | No     |
| `@variscout/charts` | Visx chart components       | Yes    |
| `@variscout/hooks`  | Shared React hooks          | Yes    |
| `@variscout/ui`     | UI components and utilities | Yes    |
| `@variscout/data`   | Sample datasets             | No     |

---

## @variscout/core

**Pure logic with no React dependencies.**

### Key Exports

```typescript
// Statistics
import { calculateStats, calculateAnova, calculateGageRR } from '@variscout/core';

// Parsing
import { parseCSV, validateData, detectColumns } from '@variscout/core';

// Types
import type { StatsResult, SpecLimits, DataPoint } from '@variscout/core';

// Glossary
import { glossaryTerms, getTerm, hasTerm } from '@variscout/core';

// Edition
import { getEdition, isThemingEnabled } from '@variscout/core';

// Navigation
import type { DrillLevel, BreadcrumbItem } from '@variscout/core';
```

### Key Files

| File                | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `stats.ts`          | Statistics engine (mean, Cp, Cpk, ANOVA, GageRR) |
| `parser.ts`         | CSV/Excel parsing, validation, keyword detection |
| `types.ts`          | Shared TypeScript interfaces                     |
| `glossary/terms.ts` | Glossary content (~20 terms)                     |
| `edition.ts`        | Edition detection, feature gates                 |

---

## @variscout/charts

**React + Visx chart components.**

### Key Exports

```typescript
// Standard charts
import { IChart, Boxplot, ParetoChart, ScatterPlot, GageRRChart } from '@variscout/charts';

// Performance charts (multi-channel)
import {
  PerformanceIChart,
  PerformanceBoxplot,
  PerformancePareto,
  PerformanceCapability,
} from '@variscout/charts';

// Theme hook
import { useChartTheme } from '@variscout/charts';

// Colors
import { chartColors, chromeColors, operatorColors } from '@variscout/charts';
```

### Component Pattern

All charts are props-based:

```tsx
<IChart
  data={measurements}
  specs={{ lsl: 98, usl: 102, target: 100 }}
  stats={calculatedStats}
  showBranding={true}
/>
```

---

## @variscout/hooks

**Shared React hooks for state and behavior.**

### Key Exports

```typescript
import {
  useChartScale, // Y-axis scale calculation
  useFilterNavigation, // Filter-based drill-down navigation
  useVariationTracking, // Cumulative η² tracking
  useDataState, // Shared DataContext state
  useKeyboardNavigation, // Arrow key focus
  useResponsiveChartMargins, // Dynamic margins
} from '@variscout/hooks';
```

### useDataState

Central state management hook used by both PWA and Azure apps. Returns `[state, actions]` tuple.

**Key DataState properties:**

| Property             | Type                         | Purpose                         |
| -------------------- | ---------------------------- | ------------------------------- |
| `rawData`            | `DataRow[]`                  | Original dataset                |
| `filteredData`       | `DataRow[]`                  | After filter application        |
| `specs`              | `SpecLimits`                 | Global specification limits     |
| `measureSpecs`       | `Record<string, SpecLimits>` | Per-measure spec overrides      |
| `getSpecsForMeasure` | `(id: string) => SpecLimits` | Get effective specs for measure |
| `isPerformanceMode`  | `boolean`                    | Multi-measure analysis active   |
| `measureColumns`     | `string[]`                   | Selected measure column names   |

**Key DataActions:**

| Action               | Purpose                         |
| -------------------- | ------------------------------- |
| `setSpecs`           | Set global specification limits |
| `setMeasureSpecs`    | Set all per-measure overrides   |
| `setMeasureSpec`     | Update single measure's specs   |
| `setFilters`         | Update active filters           |
| `setPerformanceMode` | Toggle Performance Mode         |

### Usage Example

```tsx
const [state, actions] = useDataState({ persistence: adapter });

// Get specs for a specific measure (returns override or global)
const specs = state.getSpecsForMeasure('FillHead_1');

// Set per-measure spec override
actions.setMeasureSpec('FillHead_1', { usl: 105, lsl: 95 });
```

---

## @variscout/ui

**Shared UI components and utilities.**

### Key Exports

```typescript
// Components
import { HelpTooltip, ChartCard } from '@variscout/ui';

// Hooks
import { useGlossary, useIsMobile } from '@variscout/ui';

// Colors
import { gradeColors } from '@variscout/ui';

// Services
import { errorService } from '@variscout/ui';
```

---

## @variscout/data

**Sample datasets with pre-computed statistics.**

### Usage

```typescript
import { coffeeData, journeyData, bottleneckData } from '@variscout/data';

// Each dataset includes:
// - Raw data points
// - Pre-computed stats
// - Chart-ready data structures
```

---

## Import Rules

```typescript
// ✅ Correct: Apps import from packages
import { calculateStats } from '@variscout/core';
import { IChart } from '@variscout/charts';

// ❌ Wrong: Packages should not import from apps
// import { Dashboard } from '@variscout/pwa';

// ✅ Correct: Use workspace protocol in package.json
// "@variscout/core": "workspace:*"
```

---

## See Also

- [Monorepo Architecture](monorepo.md)
- [Charts Package](../../06-design-system/charts/overview.md)
