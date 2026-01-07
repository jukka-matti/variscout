# Testing Strategy

**Status:** Active
**Last Updated:** January 2026

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

| Package                  | Test Type        | What to Test                                                                                                                    |
| :----------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `@variscout/core`        | **Unit**         | Statistics (calculateStats, calculateAnova, calculateRegression, calculateGageRR), parser, license validation, export utilities |
| `@variscout/pwa`         | **Component**    | UI components (StatsPanel, Dashboard, DataTableModal, RegressionPanel, GageRRPanel, AnovaResults)                               |
| `@variscout/pwa`         | **Agent E2E**    | **Visual verification of charts**, full user flows, persistence layer checks                                                    |
| `@variscout/azure-app`   | **Component**    | UI components (Dashboard, StatsPanel, RegressionPanel, GageRRPanel, AnovaResults) - mirrors PWA tests                           |
| `@variscout/azure-app`   | **Agent E2E**    | **MSAL auth flows**, OneDrive sync, team collaboration features                                                                 |
| `@variscout/charts`      | **Agent Visual** | **Render quality**, responsiveness, interaction handling                                                                        |
| `@variscout/excel-addin` | **Agent E2E**    | State bridge, Office.js integration simulation                                                                                  |

---

## Priority Tiers

| Priority | Category          | Rationale                                                          |
| :------- | :---------------- | :----------------------------------------------------------------- |
| **P0**   | Statistics engine | Business-critical accuracy - wrong Cpk could lead to bad decisions |
| **P1**   | Data persistence  | User data integrity - losing projects is unacceptable              |
| **P2**   | Export/Import     | Data portability - .vrs files must work reliably                   |
| **P3**   | UI & Visuals      | **Agent-verified** visuals and interactions                        |

---

## Current Coverage

### @variscout/core (30+ test cases)

| Function                | Tested | Cases                                                    |
| :---------------------- | :----- | :------------------------------------------------------- |
| `calculateStats()`      | ✅     | Basic stats, Cp/Cpk, one-sided specs, empty data         |
| `calculateAnova()`      | ✅     | Significant/non-significant, group stats, eta-squared    |
| `calculateRegression()` | ✅     | Linear, quadratic, weak relationships, optimum detection |
| `calculateGageRR()`     | ✅     | Excellent/unacceptable systems, variance components      |

### @variscout/pwa (25+ test cases)

| Component         | Tested | Focus                                      |
| :---------------- | :----- | :----------------------------------------- |
| `StatsPanel`      | ✅     | Conditional display, Cp/Cpk formatting     |
| `Dashboard`       | ✅     | Tab switching, chart rendering, ANOVA      |
| `DataTableModal`  | ✅     | Cell editing, row operations               |
| `RegressionPanel` | ✅     | Empty states, chart expansion, ranking     |
| `GageRRPanel`     | ✅     | Column validation, verdict display         |
| `AnovaResults`    | ✅     | Null state, F-stat display, p-value format |
| `export.ts`       | ✅     | CSV generation, special characters         |

### @variscout/azure-app (31 test cases)

| Component         | Tested | Focus                                      |
| :---------------- | :----- | :----------------------------------------- |
| `AnovaResults`    | ✅     | Null state, F-stat display, p-value format |
| `RegressionPanel` | ✅     | Empty states, chart expansion, ranking     |
| `GageRRPanel`     | ✅     | Column validation, verdict display         |
| `Dashboard`       | ✅     | Tab switching, ANOVA integration, stats    |
| `StatsPanel`      | ✅     | Conditional display, Cp/Cpk, tabs          |

### @variscout/charts

| Item                 | Tested                                                |
| :------------------- | :---------------------------------------------------- |
| Chart components     | **Agent Verified** (Visual analysis via browser tool) |
| Responsive utilities | **Agent Verified** (Browser resize testing)           |

### @variscout/excel-addin

| Item                  | Tested                                          |
| :-------------------- | :---------------------------------------------- |
| State bridge          | **Agent Verified** (End-to-End flow simulation) |
| Office.js integration | **Agent Verified** (Mocked environment checks)  |

---

## Testing Patterns

### Float Comparisons (Statistics)

```typescript
// Use toBeCloseTo for floating-point math
expect(stats.mean).toBeCloseTo(11.2, 1); // 1 decimal precision
expect(stats.cpk).toBeCloseTo(0.33, 2); // 2 decimal precision
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
├── src/
│   ├── stats.ts
│   ├── parser.ts
│   └── __tests__/
│       ├── stats.test.ts
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
│   │       ├── GageRRPanel.test.tsx
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
│           ├── GageRRPanel.test.tsx
│           ├── Dashboard.test.tsx
│           └── StatsPanel.test.tsx
```

---

## Agent-Verified QA Checklist

Instead of a manual checklist, assign the following tasks to the Agent for release verification:

### PWA

- [ ] **Smoke Test**: Launch PWA, ensuring it loads without console errors.
- [ ] **Data Flow**: Load sample data, edit a cell, verify stats update.
- [ ] **Visual Check**: Take screenshots of I-Charts and generic charts; check for layout shifts.
- [ ] **Persistence**: Reload page, ensure data remains.
- [ ] **Export**: Generate a PDF/CSV and verify file existence (if environment permits).

### Azure Team App

- [ ] **Auth Flow**: Verify MSAL login/logout works correctly.
- [ ] **Tab Navigation**: Switch between Analysis, Regression, and Gage R&R tabs.
- [ ] **Chart Rendering**: Verify I-Chart, Boxplot, Pareto, ScatterPlot, and GageRR charts render.
- [ ] **ANOVA Integration**: Confirm ANOVA results display below Boxplot.
- [ ] **Sync Status**: Verify offline/online sync indicator updates.

---

## Related Documentation

- [.claude/rules/testing.md](../../.claude/rules/testing.md) - Quick reference testing rules
- [docs/technical/README.md](README.md) - Technical Overview
