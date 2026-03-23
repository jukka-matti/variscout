---
title: 'Testing Strategy'
---

# Testing Strategy

**Status:** Active
**Last Updated:** February 2026

---

## Philosophy

VariScout Lite testing follows these principles:

1.  **Test critical paths first** - Statistical accuracy is business-critical
2.  **Behavior over implementation** - Test what the code does, not how it does it
3.  **Local-first** - All tests run locally without CI/CD dependencies
4.  **Agent-Augmented & Chrome-Verified** — Leverage AI agents ("Antigravity") and Claude Code Chrome browser integration for complex E2E, visual, and regression testing

---

## Framework

| Tool                          | Purpose                                                        |
| :---------------------------- | :------------------------------------------------------------- |
| **Vitest**                    | Test runner (Vite-native, fast)                                |
| **Playwright**                | E2E browser testing (Chromium)                                 |
| **React Testing Library**     | Component testing (PWA, Azure)                                 |
| **@testing-library/jest-dom** | DOM assertions                                                 |
| **Antigravity (Agent)**       | Visual verification, E2E flows, manual QA automation           |
| **Claude Code Chrome**        | Interactive browser testing, visual checks, protocol execution |

### Running Tests

```bash
# Run all vitest tests across monorepo
pnpm test

# Run tests in specific package
pnpm --filter @variscout/core test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/hooks test
pnpm --filter @variscout/charts test
pnpm --filter @variscout/ui test

# Watch mode (during development)
pnpm --filter @variscout/core test -- --watch

# Coverage report
pnpm --filter @variscout/core test -- --coverage

# Chrome Browser Testing
claude --chrome              # Enable Chrome browser access
# Then use prompts like: "Run the staged analysis verification protocol"

# Playwright E2E (automated regression)
pnpm --filter @variscout/pwa test:e2e
pnpm --filter @variscout/azure-app test:e2e
```

### Agentic & Chrome Browser Testing

**Antigravity (Agent)** — Issue a prompt to the AI agent for autonomous verification:

> "Run the smoke test protocol on the PWA"
> "Verify the StatsPanel visualization matches the data"

**Claude Code Chrome** — Interactive browser testing via Claude Code's native Chrome integration:

**Prerequisites:**

- Claude Code CLI v2.0.73+ with Chrome extension v1.0.36+
- Enable with `claude --chrome` to launch a visible Chrome window

**Usage examples:**

> "Open localhost:5173, load the Coffee sample, and verify the I-Chart renders with control limits"
> "Run the staged analysis verification protocol"
> "Switch to the Azure app at localhost:5174 and verify the theme toggle works"

**When to use each:**

| Method      | Best For                                                              |
| :---------- | :-------------------------------------------------------------------- |
| Antigravity | AI-driven verification, complex multi-step flows, batch QA runs       |
| Chrome      | Interactive visual checks, debugging, authenticated session testing   |
| Playwright  | Automated CI regression, headless pipelines, deterministic assertions |

---

## Test Ownership by Package

| Package                | Test Type          | What to Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| :--------------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@variscout/core`      | **Unit**           | Statistics (calculateStats, calculateAnova, calculateRegression), parser, license validation, export utilities                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@variscout/charts`    | **Unit**           | Color constants, accessibility utilities, multi-selection hook                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@variscout/hooks`     | **Unit**           | Hooks (useTier, useChartScale, useColumnClassification, useDrillPath, useFindings, useHypotheses, useVariationTracking, useDataTablePagination, useHighlightFade, useResizablePanel, useAnnotationMode, useBoxplotData, useChartCopy, useControlViolations, useDataIngestion, useDataState, useFilterNavigation, useFocusedChartNav, useIChartData, useKeyboardNavigation, useResponsiveChartMargins, useThemeState, useNarration, useChartInsights, useAICoScout, useKnowledgeSearch), pipeline integration, filter state transitions, stress tests |
| `@variscout/ui`        | **Unit**           | UpgradePrompt, HelpTooltip, DataQualityBanner, ColumnMapping, BoxplotDisplayToggle, DataTableBase                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `@variscout/pwa`       | **Component**      | UI components (StatsPanel, Dashboard, DataTableModal, AnovaResults, FindingsPanel, WhatIfPage, WhatIfSimulator), hooks (useFilterNavigation), export utilities                                                                                                                                                                                                                                                                                                                                                                                       |
| `@variscout/pwa`       | **Playwright E2E** | Critical workflow, drill-down, samples, analysis views, stats/ANOVA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `@variscout/azure-app` | **Component**      | UI components (Dashboard, StatsPanel, AnovaResults, FindingsWindow, FindingEditor, InvestigationSidebar, WhatIfPage, FilterBreadcrumb, Editor, SettingsPanel), auth (easyAuth), storage                                                                                                                                                                                                                                                                                                                                                              |
| `@variscout/azure-app` | **Playwright E2E** | Editor workflow, samples, analysis views, stats/ANOVA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

---

## Priority Tiers

| Priority | Category          | Rationale                                                          |
| :------- | :---------------- | :----------------------------------------------------------------- |
| **P0**   | Statistics engine | Business-critical accuracy - wrong Cpk could lead to bad decisions |
| **P1**   | Data persistence  | User data integrity - losing projects is unacceptable              |
| **P2**   | Export/Import     | Data portability - .vrs files must work reliably                   |
| **P3**   | UI & Visuals      | **Agent/Chrome-verified** visuals and interactions                 |

---

## Reference Validation (NIST StRD + R)

VariScout's statistics engine is validated against **NIST Statistical Reference Datasets** (StRD) and **R statistical software** reference values. This provides independent, externally certified ground truth for statistical accuracy.

### Why NIST StRD?

The National Institute of Standards and Technology publishes datasets with certified statistical values computed to 15+ significant digits. Software that produces correct results on these datasets is unlikely to have systematic numerical errors. Several datasets are specifically designed to expose flaws in naive algorithms (e.g., catastrophic cancellation in variance computation).

### Datasets Used

| Dataset | NIST Category     | What It Validates                                                    | Difficulty |
| :------ | :---------------- | :------------------------------------------------------------------- | :--------- |
| NumAcc1 | Univariate        | `calculateStats` mean/stdDev with large offset                       | Lower      |
| NumAcc4 | Univariate        | `calculateStats` mean/stdDev — catastrophic cancellation stress test | Higher     |
| SiRstv  | ANOVA             | `calculateAnova` F-statistic, eta-squared, residual SD, p-value      | Average    |
| Norris  | Linear Regression | `calculateRegression` slope, intercept, R²                           | Lower      |
| Pontius | Linear Regression | `calculateRegression` quadratic R² with large x values               | Average    |

### Indirect Validation Strategy

Private helper functions (`normalPDF`, `incompleteBeta`, `lnGamma`, `fDistributionPValue`, `tDistributionPValue`) are not exported and cannot be tested directly. They are validated **indirectly** through end-to-end chains:

- **F-distribution chain:** ANOVA p-value = `fDistributionPValue(F, df1, df2)` → `incompleteBeta()` → `lnGamma()`. If the SiRstv p-value matches R's `pf()` output, the entire chain is correct.
- **t-distribution chain:** Regression p-value = `tDistributionPValue(t, df)` → `fDistributionPValue()` → `incompleteBeta()`. If the Norris slope p-value is < 1e-10 (matching R), the chain is correct.
- **Normal quantile:** `normalQuantile()` is validated against R's `qnorm()` at 11 standard percentile points to 8 decimal places.

### Achieved Tolerances

| Section         | Function                                   | Tolerance           | Notes                               |
| :-------------- | :----------------------------------------- | :------------------ | :---------------------------------- |
| Normal quantile | `normalQuantile` vs R `qnorm()`            | 8 decimal places    | Acklam's algorithm                  |
| NumAcc1         | `calculateStats` mean, stdDev              | 9 decimal places    | Well-conditioned                    |
| NumAcc4         | `calculateStats` mean                      | 7 decimal places    | d3.mean loses ~2 digits at 10^7     |
| NumAcc4         | `calculateStats` stdDev                    | 8 decimal places    | Welford's algorithm in d3.deviation |
| SiRstv          | `calculateAnova` F, eta², residual SD      | 6 decimal places    | Standard conditioning               |
| Norris          | `calculateRegression` slope, intercept, R² | 10 decimal places   | Well-conditioned OLS                |
| Pontius         | `calculateRegression` quadratic R²         | 6 decimal places    | Large x values (up to 3×10^6)       |
| Boxplot         | `calculateBoxplotStats` Q1, median, Q3     | 10 decimal places   | R type=7 linear interpolation       |
| Matrix          | `inverse`, `multiply`, `solve`             | 6–10 decimal places | Depends on condition number         |

### Cross-Validation with Minitab

CSV reference data files are available in `packages/core/reference-data/` for independent verification in Minitab or any statistics package. See the `packages/core/reference-data/README.md` in that directory for certified values and step-by-step Minitab instructions.

---

## Current Coverage

**Total: 90 vitest files, 1,475 test cases + 19 Playwright E2E spec files**

### @variscout/core (26 files, 739 test cases)

| Function/Module                   | Tested | Cases                                                                                                               |
| :-------------------------------- | :----- | :------------------------------------------------------------------------------------------------------------------ |
| `calculateStats()`                | ✅     | Basic stats, Cp/Cpk, one-sided specs, empty data, sigma within (MR/d2)                                              |
| `calculateAnova()`                | ✅     | Significant/non-significant, group stats, eta-squared                                                               |
| `calculateRegression()`           | ✅     | Linear, quadratic, weak relationships, optimum detection, column selection                                          |
| `calculateMultipleRegression()`   | ✅     | GLM, categorical predictors, interaction terms, model reduction                                                     |
| `getNelsonRule2ViolationPoints()` | ✅     | Run detection, edge cases (8 vs 9 points), mean breaks run, staged mode                                             |
| Reference validation (NIST/R)     | ✅     | normalQuantile, mean/stdDev, ANOVA F, regression coefficients, boxplot quantiles, matrix ops, KDE, probability plot |
| Golden data tests                 | ✅     | Static CSV cases (coffee, packaging, avocado) with known expected values                                            |
| `tier.ts`                         | ✅     | Tier configuration, channel limits, validation                                                                      |
| `parser.ts`                       | ✅     | CSV/Excel parsing, auto-mapping, validation, data types                                                             |
| `export.ts`                       | ✅     | CSV generation, special characters, escaping                                                                        |
| `performance.ts`                  | ✅     | Multi-channel analysis, performance metrics                                                                         |

### @variscout/charts (4 files, 59 test cases)

| Module              | Tested | Focus                                        |
| :------------------ | :----- | :------------------------------------------- |
| `colors.ts`         | ✅     | Chart color constants, theme color functions |
| `accessibility.ts`  | ✅     | Accessible color generation, contrast ratios |
| `useMultiSelection` | ✅     | Multi-selection hook for Performance charts  |

### @variscout/hooks (29 files, 317 test cases)

| Hook/Module                      | Tested | Focus                                                        |
| :------------------------------- | :----- | :----------------------------------------------------------- |
| `useAnnotationMode`              | ✅     | Chart annotation state, highlights, text notes, context menu |
| `useBoxplotData`                 | ✅     | Shared d3 boxplot computation (quartiles, outliers)          |
| `useChartCopy`                   | ✅     | Chart copy-to-clipboard, PNG/SVG download, style restore     |
| `useChartScale`                  | ✅     | Y-axis scale calculation, locked vs dynamic ranges           |
| `useColumnClassification`        | ✅     | Numeric vs categorical column detection, threshold tuning    |
| `useControlViolations`           | ✅     | Control/spec violation computation, violation counts         |
| `useDataIngestion`               | ✅     | File upload, data parsing, sample loading                    |
| `useDataState`                   | ✅     | Shared DataContext state management, display options         |
| `useDataTablePagination`         | ✅     | Page state, row slicing, boundary conditions                 |
| `useDrillPath`                   | ✅     | DrillStep computation from filterStack, node contributions   |
| `useFilterNavigation`            | ✅     | Multi-select, updateFilterValues, removeFilter, breadcrumbs  |
| `useFocusedChartNav`             | ✅     | Focused chart keyboard navigation, chart order               |
| `useHighlightFade`               | ✅     | Highlight timeout, fade animation state                      |
| `useIChartData`                  | ✅     | Shared I-Chart data transform (control limits, points)       |
| `useKeyboardNavigation`          | ✅     | Arrow key navigation, focus management                       |
| `useBoxplotWrapperData`          | ✅     | Shared boxplot wrapper data prep (quartiles, groups)         |
| `useIChartWrapperData`           | ✅     | Shared I-Chart wrapper data prep (points, limits)            |
| `useParetoChartData`             | ✅     | Shared Pareto chart data prep (rankings, Cpk)                |
| `useDashboardComputedData`       | ✅     | Shared dashboard computed stats and chart data               |
| `useResizablePanel`              | ✅     | Panel size state, drag interaction, constraints              |
| `useResponsiveChartMargins`      | ✅     | Dynamic chart margins based on container width               |
| `useThemeState`                  | ✅     | Theme state (light/dark/system), themingEnabled parameter    |
| `useTier`                        | ✅     | Tier info, channel validation, warning messages              |
| `useVariationTracking`           | ✅     | Cumulative eta-squared, filter chip data with contribution % |
| `filterStateTransitions`         | ✅     | Filter add/remove/clear state machine transitions            |
| `stress`                         | ✅     | Performance/stress tests for hooks under load                |
| `index.ts` (exports)             | ✅     | All public exports resolve correctly                         |
| Integration: filterStatsPipeline | ✅     | End-to-end: CSV parse → filter → stats → ANOVA pipeline      |

### @variscout/ui (10 files, 136 test cases)

| Component              | Tested | Focus                                                                                                           |
| :--------------------- | :----- | :-------------------------------------------------------------------------------------------------------------- |
| `UpgradePrompt`        | ✅     | Variants (inline/banner/card), tier messaging                                                                   |
| `HelpTooltip`          | ✅     | Tooltip rendering, glossary term display, icons                                                                 |
| `DataQualityBanner`    | ✅     | Validation summary, warning/error states                                                                        |
| `ColumnMapping`        | ✅     | maxFactors enforcement, spec entry, column selection                                                            |
| `BoxplotDisplayToggle` | ✅     | Violin mode toggle, contribution label toggle, sort criterion selection, sort direction toggle, popover         |
| `DataTableBase`        | ✅     | Inline cell editing, multi-cell paste, arrow-key navigation, row status indicators, spec violation highlighting |

### @variscout/pwa (10 vitest files, 100 test cases)

| Component/Module      | Tested | Focus                                              |
| :-------------------- | :----- | :------------------------------------------------- |
| `StatsPanel`          | ✅     | Conditional display, Cp/Cpk formatting, tabs       |
| `Dashboard`           | ✅     | View switching, chart rendering, ANOVA integration |
| `DataTableModal`      | ✅     | Cell editing, row operations, paste handling       |
| `AnovaResults`        | ✅     | Null state, F-stat display, p-value format         |
| `FindingsPanel`       | ✅     | Panel open/close, backdrop, slide-in animation     |
| `WhatIfPage`          | ✅     | Simulator rendering, navigation, spec limits       |
| `WhatIfSimulator`     | ✅     | Slider interaction, predicted values, reset        |
| `PasteScreen`         | ✅     | Paste input, parseText integration, column mapping |
| `useFilterNavigation` | ✅     | Multi-select, updateFilterValues, removeFilter     |
| `export.ts`           | ✅     | CSV generation, special characters                 |

### @variscout/azure-app (15 vitest files, 171 test cases)

| Component/Module        | Tested | Focus                                                                          |
| :---------------------- | :----- | :----------------------------------------------------------------------------- |
| `AnovaResults`          | ✅     | Null state, F-stat display, p-value format                                     |
| `Dashboard`             | ✅     | Tab switching (Analysis/Performance), stats                                    |
| `StatsPanel`            | ✅     | Conditional display, Cp/Cpk, sigma within                                      |
| `FindingsWindow`        | ✅     | Window rendering, popout behavior, localStorage sync                           |
| `WhatIfPage`            | ✅     | Simulator integration, navigation, predictions                                 |
| `FilterBreadcrumb`      | ✅     | Chip rendering, remove button, contribution %                                  |
| `Editor`                | ✅     | Empty state, sample loading, navigation                                        |
| `SettingsPanel`         | ✅     | Theme toggle, display options, panel open/close                                |
| ColumnMapping (re-edit) | ✅     | Factor add/remove via ColumnMapping mode='edit', safe cancel                   |
| `PasteScreen`           | ✅     | Paste input, parseText integration, column mapping                             |
| `easyAuth`              | ✅     | Mock user on localhost, AuthError codes, proactive token refresh, login/logout |
| `storage`               | ✅     | Offline-first storage, IndexedDB operations                                    |
| `PresentationView`      | ✅     | Full-screen chart grid, focused chart navigation                               |
| `SyncToast`             | ✅     | Toast notifications, auto-dismiss, action buttons                              |
| `aiService`             | ✅     | Structured output parsing, Responses API endpoint format (mocked)              |
| `useAICoScout`          | ✅     | `streamResponsesWithToolLoop` with tool handler injection, tool dispatch       |

---

## Playwright E2E Coverage

### PWA (10 spec files)

| Spec File                             | Tests                                                             |
| :------------------------------------ | :---------------------------------------------------------------- |
| `critical-workflow.spec.ts`           | App load, home screen, sample load, stats display, SVG rendering  |
| `drill-down.spec.ts`                  | Boxplot click → filter chip, stats update, chip remove, clear all |
| `samples.spec.ts`                     | All sample datasets load, chart rendering, expected stats values  |
| `analysis-views.spec.ts`              | Dashboard view switching via Settings, SVG rendering              |
| `stats-anova.spec.ts`                 | Cp/Cpk display, mean/sigma/samples, ANOVA F-stat/p-value/eta²     |
| `user-flows.spec.ts`                  | End-to-end user journeys, navigation flows, multi-step workflows  |
| `edge-cases.spec.ts`                  | Boundary conditions, empty states, error handling, edge scenarios |
| `bottleneck-investigation.spec.ts`    | Bottleneck case study drill-down investigation                    |
| `hospital-ward-investigation.spec.ts` | Hospital ward case study investigation                            |
| `findings-evaluation.spec.ts`         | Findings panel rendering and interaction                          |

```bash
# Run PWA E2E tests
pnpm --filter @variscout/pwa test:e2e
```

### Azure App (9 spec files)

| Spec File                  | Tests                                                              |
| :------------------------- | :----------------------------------------------------------------- |
| `editor-workflow.spec.ts`  | Auth, empty state, sample load, chart rendering, filter drill-down |
| `samples.spec.ts`          | Sample dataset loading, chart rendering, expected values           |
| `analysis-views.spec.ts`   | Analysis view switching, SVG rendering                             |
| `stats-anova.spec.ts`      | Mean/sigma/samples display, ANOVA F-stat/p-value/eta²              |
| `user-flows.spec.ts`       | End-to-end user journeys, editor navigation, multi-step workflows  |
| `edge-cases.spec.ts`       | Boundary conditions, empty states, error handling, edge scenarios  |
| `editor-features.spec.ts`  | CSV export, data panel, save, What-If, findings toggle             |
| `performance-mode.spec.ts` | Performance tab, Cp/Cpk toggle, spec limits, channel count         |
| `settings-theme.spec.ts`   | Settings panel, light/dark theme, accent colors, chart text size   |

```bash
# Run Azure E2E tests
pnpm --filter @variscout/azure-app test:e2e
```

### Azure E2E Patterns

Azure E2E tests share a helper module at `apps/azure/e2e/helpers.ts` with three exported functions:

| Function                | Purpose                                                                 |
| :---------------------- | :---------------------------------------------------------------------- |
| `confirmColumnMapping`  | Click "Start Analysis" on the ColumnMapping screen                      |
| `loadSampleInEditor`    | Navigate to editor, load first sample, confirm mapping, wait for charts |
| `loadPerformanceSample` | Load the large-scale performance sample and confirm mapping             |

**Key patterns for Azure E2E tests:**

- **ColumnMapping flow:** Every sample load, paste, or file upload triggers the "Map Your Data" ColumnMapping screen. Tests must call `confirmColumnMapping(page)` (or use `loadSampleInEditor`) to click "Start Analysis" before asserting on charts.
- **Clean state between samples:** Use `page.goto('/')` between sequential sample loads to reset persisted IndexedDB state. Without this, the second sample load may skip the empty-state editor.
- **ANOVA location:** ANOVA results are only visible in the FocusedChartView (boxplot focused view). Tests must maximize the boxplot card first (click the expand button on `[data-testid="chart-boxplot"]`).
- **Paste vs Manual Entry:** "Paste Data" button opens a textarea for pasting tabular text. "Manual Entry" opens the setup form for creating columns and entering values row by row.

---

## Playwright vs Agentic/Chrome Testing

VariScout uses three complementary E2E verification methods:

| Aspect            | Antigravity (Agent)                | Claude Code Chrome                    | Playwright                          |
| :---------------- | :--------------------------------- | :------------------------------------ | :---------------------------------- |
| **Execution**     | AI-driven, autonomous              | Interactive, human-guided             | Automated, headless                 |
| **Best for**      | Complex multi-step flows, batch QA | Visual debugging, authenticated flows | CI regression, deterministic checks |
| **Speed**         | Medium (AI reasoning overhead)     | Slow (interactive)                    | Fast (scripted)                     |
| **Flakiness**     | Low (adaptive)                     | None (human-observed)                 | Medium (timing-sensitive)           |
| **CI/CD**         | No                                 | No                                    | Yes                                 |
| **Visual checks** | Yes (screenshot analysis)          | Yes (live observation)                | Limited (snapshot comparison)       |

**Why three methods coexist:**

- **Playwright** catches regressions automatically in CI — deterministic, fast, scriptable
- **Antigravity** handles complex verification that's hard to script — AI adapts to UI changes
- **Chrome** enables interactive debugging and visual spot-checks during development

**When they disagree:** Playwright is the source of truth for CI gates. If Antigravity or Chrome finds an issue Playwright misses, add a Playwright test to cover it.

---

## Testing Patterns

### Float Comparisons (Statistics)

```typescript
// Use toBeCloseTo for floating-point math
expect(stats.mean).toBeCloseTo(11.2, 1); // 1 decimal precision
expect(stats.cpk).toBeCloseTo(0.33, 2); // 2 decimal precision

// NIST-grade: 10 decimal places for well-conditioned OLS
expect(result.linear.slope).toBeCloseTo(1.00211681802045, 10);
// Stress test: 7-8 decimal places for large-offset data
expect(stats.mean).toBeCloseTo(10000000.2, 7);
```

### Component Testing with Context

```typescript
import { vi } from 'vitest';
import * as DataContextModule from '../context/DataContext';

beforeEach(() => {
  vi.restoreAllMocks();
});

it('displays Cpk when showCpk is true', () => {
  vi.spyOn(DataContextModule, 'useData').mockReturnValue({
    displayOptions: { showCpk: true },
    // ... other context values
  });

  render(<StatsPanel stats={mockStats} />);
  expect(screen.getByText('Cpk')).toBeInTheDocument();
});
```

### Mocking External Libraries

```typescript
// Mock libraries with CSS/DOM issues
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }) => <div data-testid="panel">{children}</div>,
}));

// Mock child components to isolate tests
vi.mock('../charts/IChart', () => ({
  default: () => <div data-testid="i-chart">Mock</div>,
}));
```

### Common Pitfalls

**Mock ordering (OOM prevention):** When mocking dependencies of imported components, place `vi.mock()` calls **before** the component import. This ensures stable mock references and prevents infinite re-render loops in `useEffect` dependency arrays.

```typescript
// ✅ Correct: mock BEFORE import
vi.mock('../context/DataContext', () => ({
  useData: vi.fn(() => mockDataValue),
}));

import { SettingsPanel } from '../components/SettingsPanel';

// ❌ Wrong: import before mock — can cause OOM (infinite re-renders)
import { SettingsPanel } from '../components/SettingsPanel';

vi.mock('../context/DataContext', () => ({
  useData: vi.fn(() => mockDataValue),
}));
```

This pattern was identified fixing the Azure `SettingsPanel` test (165s OOM → 1s).

### Verification Pattern

When asking the agent (or using Chrome) to verify a feature:

1.  **State the Goal**: "Verify the new Pareto Chart rendering."
2.  **Define Success**: "It should show bars sorted by frequency and a cumulative line."
3.  **Provide Context**: "Open the PWA, load the sample data, and navigate to the Dashboard."

---

## Test File Organization

```
packages/core/
├── reference-data/              # NIST StRD CSV files for Minitab cross-validation
│   ├── README.md
│   ├── nist-numacc1.csv
│   ├── nist-numacc4.csv
│   ├── nist-sirstv.csv
│   ├── nist-norris.csv
│   └── nist-pontius.csv
├── src/
│   ├── stats.ts
│   ├── parser.ts
│   ├── performance.ts
│   └── __tests__/
│       ├── stats.test.ts                # Core statistics engine
│       ├── regression.test.ts           # Simple regression
│       ├── multiRegression.test.ts      # GLM / multiple regression
│       ├── modelReduction.test.ts       # Term removal suggestions
│       ├── reference-validation.test.ts # NIST StRD + R reference values
│       ├── goldenData.test.ts           # Static CSV golden data tests
│       ├── performance.test.ts          # Multi-channel performance
│       ├── projectedStats.test.ts       # Projected what-if stats
│       ├── directAdjustment.test.ts     # Direct adjustment calculations
│       ├── simulation.test.ts           # Model-driven simulation
│       ├── nelson.test.ts               # Nelson rules violation detection
│       ├── categoryStats.test.ts        # Category-level statistics
│       ├── sortBoxplotData.test.ts      # Boxplot sorting by mean/spread/name
│       ├── parser.test.ts               # CSV/Excel parsing
│       ├── stressParser.test.ts         # Parser stress/performance tests
│       ├── export.test.ts               # CSV export
│       ├── navigation.test.ts           # Navigation utilities
│       ├── variation.test.ts            # Variation tracking
│       ├── tier.test.ts                 # Tier configuration
│       ├── time.test.ts                 # Time utilities
│       ├── edgeCases.test.ts            # Edge case handling
│       ├── stress.test.ts               # Performance stress tests
│       └── urlParams.test.ts            # URL parameter parsing

packages/charts/
└── src/
    ├── __tests__/
    │   └── colors.test.ts               # Chart color constants
    ├── hooks/__tests__/
    │   └── useMultiSelection.test.ts    # Multi-selection hook
    └── utils/__tests__/
        └── accessibility.test.ts        # Accessible color generation

packages/hooks/
└── src/
    └── __tests__/
        ├── index.test.ts                    # Export verification
        ├── useAnnotationMode.test.ts        # Chart annotation state
        ├── useBoxplotData.test.ts           # Shared boxplot computation
        ├── useChartCopy.test.ts             # Chart copy/export
        ├── useChartScale.test.ts            # Y-axis scale
        ├── useColumnClassification.test.ts  # Column type detection
        ├── useControlViolations.test.ts     # Control/spec violations
        ├── useDataIngestion.test.ts         # File upload, data parsing
        ├── useDataState.test.ts             # DataContext state management
        ├── useDataTablePagination.test.ts   # Pagination state
        ├── useDrillPath.test.ts             # Drill path computation
        ├── useFilterNavigation.test.ts      # Filter navigation, multi-select
        ├── useFocusedChartNav.test.ts       # Focused chart keyboard nav
        ├── useHighlightFade.test.ts         # Highlight fade animation
        ├── useIChartData.test.ts            # Shared I-Chart data transform
        ├── useKeyboardNavigation.test.ts    # Arrow key navigation
        ├── useBoxplotWrapperData.test.ts     # Boxplot wrapper data prep
        ├── useIChartWrapperData.test.ts      # I-Chart wrapper data prep
        ├── useParetoChartData.test.ts        # Pareto chart data prep
        ├── useDashboardComputedData.test.ts  # Dashboard computed data
        ├── useResizablePanel.test.ts        # Resizable panel state
        ├── useResponsiveChartMargins.test.ts # Dynamic chart margins
        ├── useThemeState.test.ts            # Theme state management
        ├── useTier.test.ts                  # Tier hook
        ├── useVariationTracking.test.ts     # Cumulative eta-squared
        ├── filterStateTransitions.test.ts   # Filter state machine
        ├── stress.test.ts                   # Performance stress tests
        └── integration/
            └── filterStatsPipeline.test.ts  # End-to-end pipeline

packages/ui/
└── src/components/
    ├── UpgradePrompt/__tests__/
    │   └── UpgradePrompt.test.tsx
    ├── HelpTooltip/__tests__/
    │   └── HelpTooltip.test.tsx
    ├── DataQualityBanner/__tests__/
    │   └── DataQualityBanner.test.tsx
    ├── ColumnMapping/__tests__/
    │   └── ColumnMapping.test.tsx
    ├── BoxplotDisplayToggle/__tests__/
    │   └── BoxplotDisplayToggle.test.tsx
    └── DataTable/__tests__/
        └── DataTableBase.test.tsx

apps/pwa/
├── e2e/                                 # Playwright E2E tests
│   ├── critical-workflow.spec.ts
│   ├── drill-down.spec.ts
│   ├── samples.spec.ts
│   ├── analysis-views.spec.ts
│   ├── stats-anova.spec.ts
│   ├── user-flows.spec.ts
│   └── edge-cases.spec.ts
├── src/
│   ├── components/__tests__/
│   │   ├── StatsPanel.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── AnovaResults.test.tsx
│   │   ├── FindingsPanel.test.tsx
│   │   ├── WhatIfPage.test.tsx
│   │   ├── WhatIfSimulator.test.tsx
│   │   ├── DataTableModal.test.tsx
│   │   └── PasteScreen.test.tsx
│   ├── hooks/__tests__/
│   │   └── useFilterNavigation.test.tsx
│   └── lib/__tests__/
│       └── export.test.ts

apps/azure/
├── e2e/                                 # Playwright E2E tests
│   ├── editor-workflow.spec.ts
│   ├── samples.spec.ts
│   ├── analysis-views.spec.ts
│   ├── stats-anova.spec.ts
│   ├── user-flows.spec.ts
│   └── edge-cases.spec.ts
├── vitest.config.ts                     # Excludes e2e/** and api/**
├── src/
│   ├── setupTests.ts
│   ├── auth/__tests__/
│   │   └── easyAuth.test.ts
│   ├── services/__tests__/
│   │   └── storage.test.ts
│   ├── components/__tests__/
│   │   ├── AnovaResults.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── StatsPanel.test.tsx
│   │   ├── FindingsWindow.test.tsx
│   │   ├── WhatIfPage.test.tsx
│   │   ├── FilterBreadcrumb.test.tsx
│   │   ├── (removed: FactorManagerPopover — replaced by ColumnMapping re-edit)
│   │   ├── PasteScreen.test.tsx
│   │   ├── PresentationView.test.tsx
│   │   └── SyncToast.test.tsx
│   ├── components/settings/__tests__/
│   │   └── SettingsPanel.test.tsx
│   └── pages/__tests__/
│       └── Editor.test.tsx
```

---

## Feature Verification Protocols

Specific prompts for verifying complex features. These protocols can be executed via Antigravity agents or interactively with `claude --chrome`.

### 1. Staged Analysis Verification

**Goal:** Verify the Staged I-Chart correctly calculates and displays separate control limits for each phase.

**Agent Prompt:**

> "Load the 'Process Changes' sample (or any dataset with a categorical column). In the Dashboard header, select the categorical column (e.g., 'Phase' or 'Machine') in the 'Stage' dropdown. Verify that the I-Chart updates to show vertical dashed dividers between stages, and that the UCL, Mean, and LCL lines change values at each stage boundary. Confirm that points are colored according to their specific stage's limits."

**Success Criteria:**

- [ ] Vertical dashed lines separate stages
- [ ] Control limit steps (changes in level) at boundaries
- [ ] Stage labels visible at top of chart

### 2. PWA Embed Mode Verification

**Goal:** Verify the PWA renders correctly when embedded (hidden chrome, message listening).

**Agent Prompt:**

> "Open the PWA with the URL parameters `?embed=true&sample=coffee`. Verify that the application header (navigation) and footer are completely hidden. Check that the chart area maximizes to fill the viewport. Verify that clicking the chart still works (though it might not trigger internal navigation if in pure embed mode)."

**Success Criteria:**

- [ ] No header/toolbar visible
- [ ] No footer visible
- [ ] Charts render full-width/height
- [ ] No console errors related to missing context

### 3. Performance Module Verification

**Goal:** Verify the Multi-Channel Performance Dashboard loads and displays all relevant charts.

**Agent Prompt:**

> "Load a dataset with multiple numeric columns (e.g., 'Coffee Moisture'). Ensure at least 3 numeric columns are selected for analysis in the setup panel (or via 'New Analysis' -> 'Performance Analysis'). Verify that the Dashboard displays the Performance View, containing a Summary Bar, an I-Chart with multiple series (or selectable series), a Boxplot comparing channels, and a Pareto chart ranking them. Click on a specific channel in the Boxplot and verify the other charts update to focus on that channel."

**Success Criteria:**

- [ ] Performance Dashboard layout (Summary + 3-chart grid)
- [ ] I-Chart showing Cpk/Cp values
- [ ] Boxplot showing distribution comparison
- [ ] Pareto showing ranking
- [ ] Interactive cross-filtering between charts

### 4. Capability Chart Verification

**Goal:** Verify the capability histogram renders correctly with spec limit indicators.

**Agent Prompt:**

> "Load the 'Packaging' sample (it has spec limits defined). Navigate to the Stats panel and look for the histogram/capability view. Verify that the histogram shows the data distribution, spec limit lines (USL/LSL) are drawn as vertical markers, bars are colored green (in-spec) vs red (out-of-spec), and Cp/Cpk values are displayed numerically."

**Success Criteria:**

- [ ] Histogram renders with data distribution bars
- [ ] Spec limit lines visible (USL and/or LSL)
- [ ] Pass/fail coloring on histogram bars
- [ ] Cp and Cpk values displayed

### 5. ANOVA Results Verification

**Goal:** Verify ANOVA results display correctly below boxplot with all statistical values.

**Agent Prompt:**

> "Load the 'Coffee Moisture' sample. Scroll to the boxplot chart area. Below the boxplot, verify the ANOVA results section appears. Check that it shows the factor name (e.g., 'Drying_Bed'), the F-statistic and p-value on the significance line, and the eta-squared (η²) value. Verify the p-value formats correctly (e.g., '< 0.001' for very small values). Check that group means and sample sizes (n=) are listed for each category."

**Success Criteria:**

- [ ] ANOVA section visible below boxplot (`data-testid="anova-results"`)
- [ ] F-statistic displayed with 2 decimal places
- [ ] p-value displayed (formatted, e.g., `< 0.001`)
- [ ] Eta-squared (η²) shown with percentage
- [ ] Factor name mentioned in header
- [ ] Group means and n= values listed

### 6. Multi-Level Drill-Down Verification

**Goal:** Verify drilling through 2+ filter levels with cumulative filter chips and stats updates.

**Agent Prompt:**

> "Load a sample with multiple categorical columns (e.g., 'Bottleneck' or 'Oven Zones'). Click a boxplot category to apply the first filter — verify a filter chip appears and stats update. Then click another category in the boxplot at the second level — verify a second filter chip appears alongside the first. Confirm that cumulative contribution percentages update. Click 'Clear All' and verify all filters are removed and stats revert to the original values."

**Success Criteria:**

- [ ] First filter chip appears after boxplot click
- [ ] Stats (mean, sigma) update to reflect filtered subset
- [ ] Second filter chip appears at second drill level
- [ ] Both chips visible simultaneously
- [ ] Cumulative contribution % updates
- [ ] Clear All removes all chips and reverts stats

### 7. Manual Data Entry Verification

**Goal:** Verify the manual data entry workflow from setup to analysis.

**Agent Prompt:**

> "Click 'Manual Entry' on the home screen (or 'Paste from Excel' for the PWA). In the setup modal, enter a column name and configure measurement type. Verify the data entry grid appears. Type values into cells, press Enter/Tab to navigate. After entering 10+ values, click 'Analyze' and verify the dashboard renders with charts based on the entered data. Test paste mode by pasting a column of numbers from clipboard."

**Success Criteria:**

- [ ] Setup modal renders with column name input
- [ ] Data grid appears after setup
- [ ] Cell editing works (type, Enter, Tab navigation)
- [ ] 'Analyze' button triggers dashboard rendering
- [ ] Pasting multi-line data populates grid

### 8. What-If Simulation Verification

**Goal:** Verify the What-If Simulator sliders, predicted values, and real-time updates.

**Agent Prompt:**

> "Load a sample dataset, then open Settings and select 'What-If Simulator'. Verify that the simulator page renders with sliders for each predictor variable. Move a slider and verify the predicted outcome value updates in real-time. If spec limits exist, verify the predicted value is colored according to pass/fail status. Click 'Reset' and verify all sliders return to their default positions."

**Success Criteria:**

- [ ] Simulator page renders with predictor sliders
- [ ] Predicted outcome value shown
- [ ] Moving slider updates prediction in real-time
- [ ] Spec limit pass/fail coloring on predicted value (if applicable)
- [ ] Reset returns sliders to defaults

### 9. ~~Mindmap Panel Verification~~ (REMOVED)

> The Investigation Mindmap was fully replaced by the Findings system (Feb 2026). This protocol is no longer applicable.

### 10. AI Graceful Degradation Verification

**Goal:** Verify the app works identically when AI is unavailable (no endpoint configured).

**Agent Prompt:**

> "Load the Azure app WITHOUT the AI endpoint configured (VITE_AI_ENDPOINT unset). Verify that no NarrativeBar is visible at the bottom of the dashboard, no ChartInsightChip appears below any chart card, and no 'Ask →' button is present. Load sample data and perform a full multi-level drill-down — verify all existing analysis features (I-Chart, Boxplot, Pareto, Stats, ANOVA, Findings, What-If) work normally with zero AI artifacts. Open the Settings panel and verify the AI section is disabled/grayed with a message like 'Configure AI endpoint to enable'. Check the browser console for any errors related to AI."

**Success Criteria:**

- [ ] No NarrativeBar visible (`[data-testid="narrative-bar"]` absent from DOM)
- [ ] No ChartInsightChip visible on any chart card
- [ ] No "Ask →" button anywhere in the UI
- [ ] All analysis features work normally (charts, drill-down, ANOVA, findings)
- [ ] Settings panel shows AI section as disabled with configuration message
- [ ] No console errors related to AI service, endpoint, or CoScout
- [ ] App is functionally identical to pre-AI version (ADR-019 Phase 0 baseline)

### 11. NarrativeBar Lifecycle Verification

**Goal:** Verify NarrativeBar loading, display, caching, and error states through its full lifecycle.

**Agent Prompt:**

> "Configure the AI endpoint and load the Azure app with sample data. After data loads, observe the bottom of the dashboard — verify a shimmer/skeleton loading animation appears in the NarrativeBar (~2s after data is stable). Wait for the narrative text to appear, replacing the shimmer. Verify the 'Ask →' button is visible at the right edge and is clickable. Apply a drill-down filter (click a boxplot category) — verify the narrative updates with new context reflecting the filtered state. Remove the filter — verify the narrative returns to the previous (cached) state with a subtle '(cached)' label. Simulate an AI endpoint error (disconnect network or use browser DevTools to block the endpoint) — verify the NarrativeBar handles the error gracefully (hides or shows last cached response). Reconnect and verify retry works."

**Success Criteria:**

- [ ] Shimmer loading animation appears (`[data-testid="narrative-shimmer"]`)
- [ ] Narrative text replaces shimmer after AI responds
- [ ] "Ask →" button visible and clickable (`[data-testid="narrative-ask-button"]`)
- [ ] Narrative updates when filters change (drill-down)
- [ ] Cached response shown with "(cached)" label when reverting to previous state
- [ ] Error state handled gracefully — bar hidden or shows cached response, no crash
- [ ] Retry succeeds after reconnection
- [ ] No jarring transitions between loading/response/cached/error states
- [ ] `aria-live="polite"` announces narrative changes to screen readers

### 12. CoScoutPanel Conversation Verification

**Goal:** Verify conversational AI interaction through the CoScoutPanel slide-out panel.

**Agent Prompt:**

> "With AI configured, load sample data and click the 'Ask →' button on the NarrativeBar. Verify the CoScoutPanel opens as a resizable slide-in from the right (on desktop) or full-screen overlay (on phone <640px). Verify the current analysis context is shown at the top of the panel. Type a question (e.g., 'Why is Machine A the biggest contributor?') and send it. Verify a streaming response appears with a typing indicator. Check that a 'Stop generating' button appears during streaming — click it and verify generation stops cleanly. Send a follow-up question (e.g., 'What should I check first?') and verify conversation context is maintained. Close the panel with Escape or the close button, then reopen it — verify conversation history is preserved for the current session. Simulate an AI error mid-stream (block network) — verify an inline error message and retry button appear."

**Success Criteria:**

- [ ] CoScoutPanel opens from "Ask →" button (`[data-testid="coscout-panel"]`)
- [ ] Desktop: resizable side panel (320px–600px); Phone: full-screen overlay
- [ ] Analysis context summary shown at top of panel
- [ ] Text input accepts typing and send (`[data-testid="coscout-input"]`)
- [ ] Streaming response appears with typing indicator
- [ ] "Stop generating" button visible during stream and stops cleanly when clicked
- [ ] Follow-up questions maintain conversation context
- [ ] Conversation history preserved when panel is closed and reopened (session)
- [ ] Messages rendered with correct alignment (user right, AI left) (`[data-testid^="coscout-message-"]`)
- [ ] Error mid-stream shows inline error message with "Retry" button
- [ ] Keyboard: Enter sends, Shift+Enter adds newline, Escape closes panel

**AI E2E Test Approach:**

All AI-related E2E tests use **recorded fixtures** (mock AI responses), not live endpoints. This ensures deterministic, reproducible test results unaffected by AI model variability, latency, or availability.

- **Fixture format:** JSON files with request/response pairs stored in `e2e/fixtures/ai/`
- **Fixture categories:** `narration/` (NarrativeBar summaries), `coscout/` (Q&A conversation turns), `insights/` (ChartInsightChip content)
- **Mock interceptor:** Playwright `page.route()` handler intercepts all calls to the AI endpoint URL and returns matching fixture responses
- **Deterministic:** Same fixture = same test result. No flakiness from AI response variability
- **Streaming simulation:** CoScout fixtures include chunked responses to test streaming UI states
- **Error fixtures:** Dedicated fixtures for API errors, content filter blocks, rate limits, and timeouts

**AI Unit Test Approach (Responses API):**

Unit tests for the AI layer use **Responses API mocks** (not Chat Completions). Provider-specific fixtures (Anthropic etc.) have been removed in favour of the Responses API endpoint format.

- **`aiService.test.ts`** — Tests structured output parsing and Responses API endpoint format. Mocks the fetch call to return Responses API-shaped payloads (including tool calls and streamed events).
- **`useAICoScout.test.ts`** — Tests `streamResponsesWithToolLoop` with **tool handler injection**: each registered tool handler (e.g., `suggest_knowledge_search`) is passed as a dependency, allowing tests to assert that the loop correctly dispatches tool calls and feeds results back into the stream.

See [AI Architecture — Testing Strategy](../architecture/ai-architecture.md#testing-strategy) for additional unit and component test approach details.

### 13. Theme Switching (Azure) Verification

**Goal:** Verify light/dark/system theme switching with chart color updates and persistence.

**Agent Prompt:**

> "In the Azure app, click the Settings gear icon. Find the theme toggle and switch from Dark to Light mode. Verify that the entire UI updates: backgrounds become light, text becomes dark, and chart chrome (axes, grid lines, labels) changes to light-theme colors. Switch to System mode and verify it follows the OS preference. Close and reopen the app — verify the theme persists."

**Success Criteria:**

- [ ] Theme toggle visible in Settings
- [ ] Light mode: white/light backgrounds, dark text
- [ ] Dark mode: dark backgrounds, light text
- [ ] Chart colors update (grid lines, axis labels, tooltip backgrounds)
- [ ] System mode follows OS preference
- [ ] Theme persists across page reload

---

## QA Verification Checklist

Assign the following tasks to an Antigravity agent or execute interactively via `claude --chrome` for release verification:

### PWA

- [ ] **Smoke Test**: Launch PWA, ensuring it loads without console errors.
- [ ] **Data Flow**: Load sample data, edit a cell, verify stats update.
- [ ] **Staged Analysis**: Enable staging on a sample dataset, verify control limit split.
- [ ] **Performance Analysis**: Enable multi-channel analysis, verify I-Chart/Boxplot/Pareto grid.
- [ ] **Embed Mode**: Load `?embed=true`, verify UI chrome is removed.
- [ ] **Visual Check**: Take screenshots of I-Charts and generic charts; check for layout shifts.
- [ ] **Persistence**: Reload page, ensure data remains.
- [ ] **Export**: Generate a PDF/CSV and verify file existence (if environment permits).

### Azure Team App

- [ ] **Auth Flow**: Verify EasyAuth login/logout works correctly.
- [ ] **Tab Navigation**: Switch between Analysis and Performance tabs.
- [ ] **Chart Rendering**: Verify I-Chart, Boxplot, Pareto, and ScatterPlot charts render.
- [ ] **ANOVA Integration**: Confirm ANOVA results display below Boxplot.
- [ ] **Sync Status**: Verify offline/online sync indicator updates.

---

## Test Coverage Backlog (Mar 2026)

Current state: 3,786 tests across 227 files, all passing. Coverage thresholds met in all packages.

### P1 — Azure Feature Store Tests (~2h)

5 Zustand stores lack unit tests. Pattern reference: `apps/azure/src/features/panels/__tests__/panelsStore.test.ts` (46 tests).

| Store                | Location                  | Status   |
| -------------------- | ------------------------- | -------- |
| `aiStore`            | `features/ai/`            | No tests |
| `findingsStore`      | `features/findings/`      | No tests |
| `investigationStore` | `features/investigation/` | No tests |
| `improvementStore`   | `features/improvement/`   | No tests |
| `data-flow`          | `features/data-flow/`     | No tests |

### P2 — UI Component Priority Subset (~1 day)

26/66 UI components have tests. Priority subset for the remaining 40:

- ChartAnnotationLayer, CreateFactorModal, SpecsPopover, FocusedChartViewBase
- PasteScreen (both apps), PerformanceSetupPanel
- PresentationView, SettingsPanel, SelectionPanel

### P3 — Performance Chart Tests (~half day)

PerformanceIChart, PerformanceBoxplot, PerformancePareto, PerformanceCapability — no unit tests (tested indirectly via app integration).

### P4 — Hook Test Completeness (~1h)

4 hooks without dedicated test files: useAnnotations, useChartTheme, useGlossary, useIsMobile. Likely covered indirectly via component tests.

---

## Refactoring Candidates (Mar 2026)

Validated via code analysis. Priorities based on ROI and risk.

### P1 — ReportView.tsx (1,058 → ~500 lines)

`apps/azure/src/components/views/ReportView.tsx` — Extract:

- `VerificationChartRenderer` sub-component (150-180 lines of 5-branch conditional rendering)
- Report section rendering (500+ lines of conditional JSX → `ReportContent` sub-component)

### P2 — Editor.tsx Phase 7 (1,289 → ~950 lines)

`apps/azure/src/pages/Editor.tsx` — Extract `useEditorOrchestration` hook to consolidate 25 hook calls (AI, investigation, improvement orchestration). Depends on ADR-041 store consolidation.

### ~~P3 — Dashboard.tsx Prop Grouping~~ (DONE Mar 2026)

Grouped 28 flat props into 3 domain interfaces (`viewMode`, `performance`, `ai`) + flat core props. Prop surface reduced from 28 to 14.

### ~~P4 — Shared Dashboard Types~~ (DONE Mar 2026)

Extracted `FindingsCallbacks` + `AzureFindingsCallbacks` to `@variscout/ui/src/types/findingsCallbacks.ts`. PWA and Azure both import from shared package.

### Dropped — PWA App.tsx (822 lines)

Validated as correctly scoped entry point. No action needed.

---

## Related Documentation

- `.claude/rules/testing.md` - Quick reference testing rules (in project root)
- [Technical Overview](../index.md) - Technical section index
