# Testing Rules

> Full testing strategy: [docs/05-technical/implementation/testing.md](../../docs/05-technical/implementation/testing.md)

## Framework

- **Vitest** for unit tests
- **Playwright** for E2E browser tests
- **React Testing Library** for component tests
- Test files in `__tests__/` directories alongside source

## Browser Testing

- **Claude Code Chrome** — Interactive E2E verification (`claude --chrome`)
- **Antigravity (Agent)** — AI-driven visual verification and QA automation
- **Playwright** — Automated regression (CI/CD safety net)

## Test Ownership

| Package                | Test Type            | What to Test                                                        |
| ---------------------- | -------------------- | ------------------------------------------------------------------- |
| `@variscout/core`      | Unit                 | stats, parser, tier, export, performance                            |
| `@variscout/charts`    | Unit                 | colors, accessibility, multi-selection hook                         |
| `@variscout/hooks`     | Unit                 | useTier, useChartScale, useColumnClassification, useDrillPath, useMindmapState, useVariationTracking, useAnnotationMode, useBoxplotData, useChartCopy, useControlViolations, useDataIngestion, useDataState, useFilterNavigation, useFocusedChartNav, useIChartData, useKeyboardNavigation, useResponsiveChartMargins, useThemeState |
| `@variscout/ui`        | Unit                 | UpgradePrompt, HelpTooltip, DataQualityBanner, ColumnMapping, BoxplotDisplayToggle, DataTableBase |
| `@variscout/pwa`       | Component + E2E      | UI components, context, full user flows                             |
| `@variscout/azure-app` | Component + E2E      | UI components, auth, storage, editor flows                          |

## Commands

```bash
# Chrome Browser Testing
claude --chrome              # Enable Chrome browser access

# Vitest
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # Coverage report

# Playwright E2E (automated regression)
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
| Filter chip      | `[data-testid^="filter-chip-"]`             |
| Sample button    | `[data-testid^="sample-"]`                  |

## Feature Verification Protocols

Executable via Antigravity agents or `claude --chrome`. Full protocol details in [testing.md](../../docs/05-technical/implementation/testing.md#feature-verification-protocols).

1. Staged Analysis Verification
2. PWA Embed Mode Verification
3. Performance Module Verification
4. Capability Chart Verification
5. ANOVA Results Verification
6. Multi-Level Drill-Down Verification
7. Manual Data Entry Verification
8. What-If Simulation Verification
9. Mindmap Panel Verification
10. Theme Switching (Azure) Verification
