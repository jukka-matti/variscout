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
| **React Testing Library**     | Component testing (PWA)                                  |
| **@testing-library/jest-dom** | DOM assertions                                           |
| **Antigravity (Agent)**       | **Visual Verification, E2E Flows, Manual QA Automation** |

### Running Tests

```bash
# Run all tests across monorepo
pnpm test

# Run tests in specific package
pnpm --filter @variscout/core test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test

# Watch mode (during development)
pnpm --filter @variscout/core test -- --watch

# Coverage report
pnpm --filter @variscout/core test -- --coverage
```

### Agentic Testing

To run agentic tests, issue a prompt to the agent:

> "Run the smoke test protocol on the PWA"
> "Verify the StatsPanel visualization matches the data"

---

## Test Ownership by Package

| Package                | Test Type        | What to Test                                                                                                   |
| :--------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------- |
| `@variscout/core`      | **Unit**         | Statistics (calculateStats, calculateAnova, calculateRegression), parser, license validation, export utilities |
| `@variscout/pwa`       | **Component**    | UI components (StatsPanel, Dashboard, DataTableModal, RegressionPanel, AnovaResults)                           |
| `@variscout/pwa`       | **Agent E2E**    | **Visual verification of charts**, full user flows, persistence layer checks                                   |
| `@variscout/azure-app` | **Component**    | UI components (Dashboard, StatsPanel, RegressionPanel, AnovaResults) - mirrors PWA tests                       |
| `@variscout/azure-app` | **Agent E2E**    | **EasyAuth flows**, OneDrive sync, team collaboration features                                                 |
| `@variscout/charts`    | **Agent Visual** | **Render quality**, responsiveness, interaction handling                                                       |

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

### @variscout/core (550+ test cases)

| Function/Module                   | Tested | Cases                                                                                                               |
| :-------------------------------- | :----- | :------------------------------------------------------------------------------------------------------------------ |
| `calculateStats()`                | ✅     | Basic stats, Cp/Cpk, one-sided specs, empty data                                                                    |
| `calculateAnova()`                | ✅     | Significant/non-significant, group stats, eta-squared                                                               |
| `calculateRegression()`           | ✅     | Linear, quadratic, weak relationships, optimum detection                                                            |
| `getNelsonRule2ViolationPoints()` | ✅     | Run detection, edge cases (8 vs 9 points), mean breaks run, staged mode                                             |
| Reference validation (NIST/R)     | ✅     | normalQuantile, mean/stdDev, ANOVA F, regression coefficients, boxplot quantiles, matrix ops, KDE, probability plot |
| `tier.ts`                         | ✅     | Tier configuration, channel limits, validation                                                                      |
| `parser.ts`                       | ✅     | CSV/Excel parsing, auto-mapping, validation, data types                                                             |
| `export.ts`                       | ✅     | CSV generation, special characters, escaping                                                                        |
| `edition.ts`                      | ✅     | Edition detection, feature flags, theming gates                                                                     |

### @variscout/pwa (25+ test cases)

| Component         | Tested | Focus                                      |
| :---------------- | :----- | :----------------------------------------- |
| `StatsPanel`      | ✅     | Conditional display, Cp/Cpk formatting     |
| `Dashboard`       | ✅     | Tab switching, chart rendering, ANOVA      |
| `DataTableModal`  | ✅     | Cell editing, row operations               |
| `RegressionPanel` | ✅     | Empty states, chart expansion, ranking     |
| `AnovaResults`    | ✅     | Null state, F-stat display, p-value format |
| `export.ts`       | ✅     | CSV generation, special characters         |

### @variscout/hooks

| Hook      | Tested | Focus                                           |
| :-------- | :----- | :---------------------------------------------- |
| `useTier` | ✅     | Tier info, channel validation, warning messages |

### @variscout/ui

| Component       | Tested | Focus                                         |
| :-------------- | :----- | :-------------------------------------------- |
| `TierBadge`     | ✅     | Tier rendering, colors, upgrade link, sizing  |
| `UpgradePrompt` | ✅     | Variants (inline/banner/card), tier messaging |

### @variscout/azure-app (31 test cases)

| Component         | Tested | Focus                                      |
| :---------------- | :----- | :----------------------------------------- |
| `AnovaResults`    | ✅     | Null state, F-stat display, p-value format |
| `RegressionPanel` | ✅     | Empty states, chart expansion, ranking     |
| `Dashboard`       | ✅     | Tab switching, ANOVA integration, stats    |
| `StatsPanel`      | ✅     | Conditional display, Cp/Cpk, tabs          |

### @variscout/charts

| Item                 | Tested                                                |
| :------------------- | :---------------------------------------------------- |
| Chart components     | **Agent Verified** (Visual analysis via browser tool) |
| Responsive utilities | **Agent Verified** (Browser resize testing)           |

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
├── reference-data/          # NIST StRD CSV files for Minitab cross-validation
│   ├── README.md
│   ├── nist-numacc1.csv
│   ├── nist-numacc4.csv
│   ├── nist-sirstv.csv
│   ├── nist-norris.csv
│   └── nist-pontius.csv
├── src/
│   ├── stats.ts
│   ├── parser.ts
│   └── __tests__/
│       ├── stats.test.ts
│       ├── reference-validation.test.ts  # NIST StRD + R reference values
│       ├── navigation.test.ts
│       └── variation.test.ts

apps/pwa/
├── src/
│   ├── components/
│   │   ├── StatsPanel.tsx
│   │   ├── Dashboard.tsx
│   │   └── __tests__/
│   │       ├── StatsPanel.test.tsx
│   │       ├── Dashboard.test.tsx
│   │       ├── RegressionPanel.test.tsx
│   │       └── AnovaResults.test.tsx
│   └── lib/
│       └── __tests__/
│           └── export.test.ts

apps/azure/
├── vitest.config.ts
├── src/
│   ├── setupTests.ts
│   └── components/
│       └── __tests__/
│           ├── AnovaResults.test.tsx
│           ├── RegressionPanel.test.tsx
│           ├── Dashboard.test.tsx
│           └── StatsPanel.test.tsx
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
