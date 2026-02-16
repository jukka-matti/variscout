# Testing Strategy

**Status:** Active
**Last Updated:** February 2026

---

## Philosophy

VariScout Lite testing follows these principles:

1.  **Test critical paths first** - Statistical accuracy is business-critical
2.  **Behavior over implementation** - Test what the code does, not how it does it
3.  **Local-first** - All tests run locally without CI/CD dependencies
4.  **Agent-Augmented** - Leverage AI agents ("Antigravity") for complex E2E, visual, and regression testing

---

## Framework

| Tool                          | Purpose                                                  |
| :---------------------------- | :------------------------------------------------------- |
| **Vitest**                    | Test runner (Vite-native, fast)                          |
| **Playwright**                | E2E browser testing (Chromium)                           |
| **React Testing Library**     | Component testing (PWA, Azure)                           |
| **@testing-library/jest-dom** | DOM assertions                                           |
| **Antigravity (Agent)**       | **Visual Verification, E2E Flows, Manual QA Automation** |

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

# Playwright E2E tests
pnpm --filter @variscout/pwa test:e2e
pnpm --filter @variscout/azure-app test:e2e
```

### Agentic Testing

To run agentic tests, issue a prompt to the agent:

> "Run the smoke test protocol on the PWA"
> "Verify the StatsPanel visualization matches the data"

---

## Test Ownership by Package

| Package                | Test Type          | What to Test                                                                                                                                                                   |
| :--------------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@variscout/core`      | **Unit**           | Statistics (calculateStats, calculateAnova, calculateRegression), parser, license validation, export utilities                                                                 |
| `@variscout/charts`    | **Unit**           | Color constants, accessibility utilities, multi-selection hook                                                                                                                 |
| `@variscout/hooks`     | **Unit**           | Hooks (useTier, useChartScale, useColumnClassification, useDrillPath, useMindmapState, useRegressionState, useVariationTracking), pipeline integration                         |
| `@variscout/ui`        | **Unit**           | UpgradePrompt, HelpTooltip, DataQualityBanner                                                                                                                                  |
| `@variscout/pwa`       | **Component**      | UI components (StatsPanel, Dashboard, DataTableModal, RegressionPanel, AnovaResults, MindmapPanel, WhatIfPage, WhatIfSimulator), hooks (useFilterNavigation), export utilities |
| `@variscout/pwa`       | **Playwright E2E** | Critical workflow, drill-down, samples, analysis views, stats/ANOVA                                                                                                            |
| `@variscout/azure-app` | **Component**      | UI components (Dashboard, StatsPanel, RegressionPanel, AnovaResults, MindmapWindow, WhatIfPage, FilterBreadcrumb, Editor, SettingsPanel), auth (easyAuth), storage             |
| `@variscout/azure-app` | **Playwright E2E** | Editor workflow, samples, analysis views, stats/ANOVA                                                                                                                          |

---

## Priority Tiers

| Priority | Category          | Rationale                                                          |
| :------- | :---------------- | :----------------------------------------------------------------- |
| **P0**   | Statistics engine | Business-critical accuracy - wrong Cpk could lead to bad decisions |
| **P1**   | Data persistence  | User data integrity - losing projects is unacceptable              |
| **P2**   | Export/Import     | Data portability - .vrs files must work reliably                   |
| **P3**   | UI & Visuals      | **Agent-verified** visuals and interactions                        |

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

CSV reference data files are available in `packages/core/reference-data/` for independent verification in Minitab or any statistics package. See the [README](../../../packages/core/reference-data/README.md) in that directory for certified values and step-by-step Minitab instructions.

---

## Current Coverage

**Total: 55 vitest files, 989 test cases + 9 Playwright E2E spec files**

### @variscout/core (19 files, 610 test cases)

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
| `edition.ts`                      | ✅     | Edition detection, feature flags, theming gates                                                                     |
| `performance.ts`                  | ✅     | Multi-channel analysis, performance metrics                                                                         |

### @variscout/charts (3 files, 44 test cases)

| Module              | Tested | Focus                                        |
| :------------------ | :----- | :------------------------------------------- |
| `colors.ts`         | ✅     | Chart color constants, theme color functions |
| `accessibility.ts`  | ✅     | Accessible color generation, contrast ratios |
| `useMultiSelection` | ✅     | Multi-selection hook for Performance charts  |

### @variscout/hooks (9 files, 91 test cases)

| Hook/Module                      | Tested | Focus                                                        |
| :------------------------------- | :----- | :----------------------------------------------------------- |
| `useTier`                        | ✅     | Tier info, channel validation, warning messages              |
| `useChartScale`                  | ✅     | Y-axis scale calculation, locked vs dynamic ranges           |
| `useColumnClassification`        | ✅     | Numeric vs categorical column detection, threshold tuning    |
| `useDrillPath`                   | ✅     | DrillStep computation from filterStack, node contributions   |
| `useMindmapState`                | ✅     | Radial tree layout, eta-squared labels, progress tracking    |
| `useRegressionState`             | ✅     | Mode switching, column selection, reduction history          |
| `useVariationTracking`           | ✅     | Cumulative eta-squared, filter chip data with contribution % |
| `index.ts` (exports)             | ✅     | All public exports resolve correctly                         |
| Integration: filterStatsPipeline | ✅     | End-to-end: CSV parse → filter → stats → ANOVA pipeline      |

### @variscout/ui (3 files, 33 test cases)

| Component           | Tested | Focus                                           |
| :------------------ | :----- | :---------------------------------------------- |
| `UpgradePrompt`     | ✅     | Variants (inline/banner/card), tier messaging   |
| `HelpTooltip`       | ✅     | Tooltip rendering, glossary term display, icons |
| `DataQualityBanner` | ✅     | Validation summary, warning/error states        |

### @variscout/pwa (10 vitest files, 97 test cases)

| Component/Module      | Tested | Focus                                              |
| :-------------------- | :----- | :------------------------------------------------- |
| `StatsPanel`          | ✅     | Conditional display, Cp/Cpk formatting, tabs       |
| `Dashboard`           | ✅     | View switching, chart rendering, ANOVA integration |
| `DataTableModal`      | ✅     | Cell editing, row operations, paste handling       |
| `RegressionPanel`     | ✅     | Empty states, chart expansion, ranking display     |
| `AnovaResults`        | ✅     | Null state, F-stat display, p-value format         |
| `MindmapPanel`        | ✅     | Panel open/close, backdrop, slide-in animation     |
| `WhatIfPage`          | ✅     | Simulator rendering, navigation, spec limits       |
| `WhatIfSimulator`     | ✅     | Slider interaction, predicted values, reset        |
| `useFilterNavigation` | ✅     | Multi-select, updateFilterValues, removeFilter     |
| `export.ts`           | ✅     | CSV generation, special characters                 |

### @variscout/azure-app (11 vitest files, 114 test cases)

| Component/Module   | Tested | Focus                                                  |
| :----------------- | :----- | :----------------------------------------------------- |
| `AnovaResults`     | ✅     | Null state, F-stat display, p-value format             |
| `RegressionPanel`  | ✅     | Empty states, chart expansion, ranking                 |
| `Dashboard`        | ✅     | Tab switching (Analysis/Regression/Performance), stats |
| `StatsPanel`       | ✅     | Conditional display, Cp/Cpk, sigma within              |
| `MindmapWindow`    | ✅     | Window rendering, popout behavior, localStorage sync   |
| `WhatIfPage`       | ✅     | Simulator integration, navigation, predictions         |
| `FilterBreadcrumb` | ✅     | Chip rendering, remove button, contribution %          |
| `Editor`           | ✅     | Empty state, sample loading, navigation                |
| `SettingsPanel`    | ✅     | Theme toggle, display options, panel open/close        |
| `easyAuth`         | ✅     | Mock user on localhost, token retrieval, login/logout  |
| `storage`          | ✅     | Offline-first storage, IndexedDB operations            |

---

## Playwright E2E Coverage

### PWA (5 spec files)

| Spec File                   | Tests                                                             |
| :-------------------------- | :---------------------------------------------------------------- |
| `critical-workflow.spec.ts` | App load, home screen, sample load, stats display, SVG rendering  |
| `drill-down.spec.ts`        | Boxplot click → filter chip, stats update, chip remove, clear all |
| `samples.spec.ts`           | All sample datasets load, chart rendering, expected stats values  |
| `analysis-views.spec.ts`    | Dashboard → Regression view switch via Settings, SVG rendering    |
| `stats-anova.spec.ts`       | Cp/Cpk display, mean/sigma/samples, ANOVA F-stat/p-value/eta²     |

```bash
# Run PWA E2E tests
pnpm --filter @variscout/pwa test:e2e
```

### Azure App (4 spec files)

| Spec File                 | Tests                                                              |
| :------------------------ | :----------------------------------------------------------------- |
| `editor-workflow.spec.ts` | Auth, empty state, sample load, chart rendering, filter drill-down |
| `samples.spec.ts`         | Sample dataset loading, chart rendering, expected values           |
| `analysis-views.spec.ts`  | Analysis → Regression tab switch, SVG rendering, switch back       |
| `stats-anova.spec.ts`     | Mean/sigma/samples display, ANOVA F-stat/p-value/eta²              |

```bash
# Run Azure E2E tests
pnpm --filter @variscout/azure-app test:e2e
```

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

### Agentic Verification Pattern

When asking the agent to verify a feature:

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
│       ├── nelson.test.ts               # Nelson rules violation detection
│       ├── categoryStats.test.ts        # Category-level statistics
│       ├── parser.test.ts               # CSV/Excel parsing
│       ├── export.test.ts               # CSV export
│       ├── navigation.test.ts           # Navigation utilities
│       ├── variation.test.ts            # Variation tracking
│       ├── tier.test.ts                 # Tier configuration
│       ├── edition.test.ts              # Edition detection
│       ├── time.test.ts                 # Time utilities
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
        ├── index.test.ts                # Export verification
        ├── useTier.test.ts              # Tier hook
        ├── useChartScale.test.ts        # Y-axis scale
        ├── useColumnClassification.test.ts # Column type detection
        ├── useDrillPath.test.ts         # Drill path computation
        ├── useMindmapState.test.ts      # Mindmap state
        ├── useRegressionState.test.ts   # Regression state management
        ├── useVariationTracking.test.ts # Cumulative eta-squared
        └── integration/
            └── filterStatsPipeline.test.ts  # End-to-end pipeline

packages/ui/
└── src/components/
    ├── UpgradePrompt/__tests__/
    │   └── UpgradePrompt.test.tsx
    ├── HelpTooltip/__tests__/
    │   └── HelpTooltip.test.tsx
    └── DataQualityBanner/__tests__/
        └── DataQualityBanner.test.tsx

apps/pwa/
├── e2e/                                 # Playwright E2E tests
│   ├── critical-workflow.spec.ts
│   ├── drill-down.spec.ts
│   ├── samples.spec.ts
│   ├── analysis-views.spec.ts
│   └── stats-anova.spec.ts
├── src/
│   ├── components/__tests__/
│   │   ├── StatsPanel.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── RegressionPanel.test.tsx
│   │   ├── AnovaResults.test.tsx
│   │   ├── MindmapPanel.test.tsx
│   │   ├── WhatIfPage.test.tsx
│   │   ├── WhatIfSimulator.test.tsx
│   │   └── DataTableModal.test.tsx
│   ├── hooks/__tests__/
│   │   └── useFilterNavigation.test.tsx
│   └── lib/__tests__/
│       └── export.test.ts

apps/azure/
├── e2e/                                 # Playwright E2E tests
│   ├── editor-workflow.spec.ts
│   ├── samples.spec.ts
│   ├── analysis-views.spec.ts
│   └── stats-anova.spec.ts
├── vitest.config.ts                     # Excludes e2e/** and api/**
├── src/
│   ├── setupTests.ts
│   ├── auth/__tests__/
│   │   └── easyAuth.test.ts
│   ├── services/__tests__/
│   │   └── storage.test.ts
│   ├── components/__tests__/
│   │   ├── AnovaResults.test.tsx
│   │   ├── RegressionPanel.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── StatsPanel.test.tsx
│   │   ├── MindmapWindow.test.tsx
│   │   ├── WhatIfPage.test.tsx
│   │   └── FilterBreadcrumb.test.tsx
│   ├── components/settings/__tests__/
│   │   └── SettingsPanel.test.tsx
│   └── pages/__tests__/
│       └── Editor.test.tsx
```

---

## Feature-Specific Agent Protocols

Specific prompts to use with the Antigravity Browser Agent for verifying complex features.

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

### 4. Regression Workflow Verification

**Goal:** Verify both Simple and Advanced regression modes render correctly with meaningful statistical output.

**Agent Prompt:**

> "Load the 'Coffee Moisture' sample. Open Settings and switch to Regression view. In Simple mode, verify that scatter plots appear for the auto-selected X columns with R² values displayed. Toggle column checkboxes to add/remove predictors. Click 'Expand' on a scatter plot to verify the expanded modal opens with a larger chart. Switch to Advanced (GLM) mode. Select 2-3 predictors and verify the coefficient table renders with p-values. If a term removal suggestion appears, click it and verify the model updates."

**Success Criteria:**

- [ ] Simple mode: scatter plots with regression lines render
- [ ] R² values displayed for each predictor
- [ ] Column toggles add/remove scatter plots
- [ ] Expanded scatter modal opens and closes
- [ ] Advanced mode: coefficient table with p-values renders
- [ ] Term removal updates the model

### 5. Capability Chart Verification

**Goal:** Verify the capability histogram renders correctly with spec limit indicators.

**Agent Prompt:**

> "Load the 'Packaging' sample (it has spec limits defined). Navigate to the Stats panel and look for the histogram/capability view. Verify that the histogram shows the data distribution, spec limit lines (USL/LSL) are drawn as vertical markers, bars are colored green (in-spec) vs red (out-of-spec), and Cp/Cpk values are displayed numerically."

**Success Criteria:**

- [ ] Histogram renders with data distribution bars
- [ ] Spec limit lines visible (USL and/or LSL)
- [ ] Pass/fail coloring on histogram bars
- [ ] Cp and Cpk values displayed

### 6. ANOVA Results Verification

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

### 7. Multi-Level Drill-Down Verification

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

### 8. Manual Data Entry Verification

**Goal:** Verify the manual data entry workflow from setup to analysis.

**Agent Prompt:**

> "Click 'Manual Entry' on the home screen (or 'Paste from Excel' for the PWA). In the setup modal, enter a column name and configure measurement type. Verify the data entry grid appears. Type values into cells, press Enter/Tab to navigate. After entering 10+ values, click 'Analyze' and verify the dashboard renders with charts based on the entered data. Test paste mode by pasting a column of numbers from clipboard."

**Success Criteria:**

- [ ] Setup modal renders with column name input
- [ ] Data grid appears after setup
- [ ] Cell editing works (type, Enter, Tab navigation)
- [ ] 'Analyze' button triggers dashboard rendering
- [ ] Pasting multi-line data populates grid

### 9. What-If Simulation Verification

**Goal:** Verify the What-If Simulator sliders, predicted values, and real-time updates.

**Agent Prompt:**

> "Load a sample dataset, then open Settings and select 'What-If Simulator'. Verify that the simulator page renders with sliders for each predictor variable. Move a slider and verify the predicted outcome value updates in real-time. If spec limits exist, verify the predicted value is colored according to pass/fail status. Click 'Reset' and verify all sliders return to their default positions."

**Success Criteria:**

- [ ] Simulator page renders with predictor sliders
- [ ] Predicted outcome value shown
- [ ] Moving slider updates prediction in real-time
- [ ] Spec limit pass/fail coloring on predicted value (if applicable)
- [ ] Reset returns sliders to defaults

### 10. Mindmap Panel Verification

**Goal:** Verify the Investigation Mindmap renders with correct structure and interaction.

**Agent Prompt:**

> "Load a sample with multiple categorical columns. Apply a drill-down filter by clicking a boxplot category. Open the Mindmap panel (look for a tree/mindmap icon). Verify that a radial tree renders with the root node (outcome variable) at center and child nodes for each factor. Check that nodes show eta-squared (η²) labels. Verify the drill trail highlights the path taken. Check the progress bar at the bottom. If available, test the 'Open in new window' popout button."

**Success Criteria:**

- [ ] Radial tree SVG renders with nodes
- [ ] Root node at center shows outcome variable name
- [ ] Child nodes labeled with factor names
- [ ] Eta-squared (η²) values on nodes
- [ ] Drill trail highlighted for active path
- [ ] Progress bar visible

### 11. Theme Switching (Azure) Verification

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

## Agent-Verified QA Checklist

Instead of a manual checklist, assign the following tasks to the Agent for release verification:

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
- [ ] **Tab Navigation**: Switch between Analysis and Regression tabs.
- [ ] **Chart Rendering**: Verify I-Chart, Boxplot, Pareto, and ScatterPlot charts render.
- [ ] **ANOVA Integration**: Confirm ANOVA results display below Boxplot.
- [ ] **Sync Status**: Verify offline/online sync indicator updates.

---

## Related Documentation

- `.claude/rules/testing.md` - Quick reference testing rules (in project root)
- [Technical Overview](../index.md) - Technical section index
