# Testing Rules

> Full testing strategy: [docs/05-technical/implementation/testing.md](../../docs/05-technical/implementation/testing.md)

## Framework

- **Vitest** for unit tests
- **Playwright** for E2E browser tests
- **React Testing Library** for component tests
- Test files in `__tests__/` directories alongside source

## Test Ownership

| Package                | Test Type            | What to Test                                                        |
| ---------------------- | -------------------- | ------------------------------------------------------------------- |
| `@variscout/core`      | Unit                 | stats, parser, tier, export, regression, performance                |
| `@variscout/charts`    | Unit                 | colors, accessibility, multi-selection hook                         |
| `@variscout/hooks`     | Unit                 | useTier, useChartScale, useColumnClassification, useDrillPath, useMindmapState, useRegressionState, useVariationTracking |
| `@variscout/ui`        | Unit                 | UpgradePrompt, HelpTooltip, DataQualityBanner                      |
| `@variscout/pwa`       | Component + E2E      | UI components, context, full user flows                             |
| `@variscout/azure-app` | Component + E2E      | UI components, auth, storage, editor flows                          |

## Commands

```bash
# Vitest
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # Coverage report

# Playwright E2E
pnpm --filter @variscout/pwa test:e2e
pnpm --filter @variscout/azure-app test:e2e
```

## Patterns

- Test file naming: `ComponentName.test.tsx` or `util.test.ts`
- Use `describe` blocks for grouping related tests
- Prefer `getByRole` over `getByTestId` for component queries
- Mock external dependencies, not internal modules
- Use `toBeCloseTo()` for float comparisons in stats tests

## E2E Test Selectors

Key `data-testid` attributes used in Playwright E2E tests:

| Element          | Selector                                    |
| ---------------- | ------------------------------------------- |
| I-Chart          | `[data-testid="chart-ichart"]`              |
| Boxplot          | `[data-testid="chart-boxplot"]`             |
| Pareto           | `[data-testid="chart-pareto"]`              |
| Stats panel      | `[data-testid="chart-stats"]`               |
| Mean value       | `[data-testid="stat-value-mean"]`           |
| Samples count    | `[data-testid="stat-value-samples"]`        |
| Sigma value      | `[data-testid="stat-value-sigma"]`          |
| Cp value         | `[data-testid="stat-value-cp"]`             |
| Cpk value        | `[data-testid="stat-value-cpk"]`            |
| ANOVA results    | `[data-testid="anova-results"]`             |
| ANOVA F/p        | `[data-testid="anova-significance"]`        |
| ANOVA eta²       | `[data-testid="anova-eta-squared"]`         |
| Regression panel | `[data-testid="regression-panel"]`          |
| Filter chip      | `[data-testid^="filter-chip-"]`             |
| Sample button    | `[data-testid^="sample-"]`                  |
