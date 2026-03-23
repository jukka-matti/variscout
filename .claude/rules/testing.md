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
| `@variscout/core`      | Unit                 | stats, parser, tier, export, performance, yamazumi, lttb            |
| `@variscout/charts`    | Unit                 | colors, accessibility, multi-selection hook                         |
| `@variscout/hooks`     | Unit                 | useTier, useChartScale, useColumnClassification, useDrillPath, useVariationTracking, useAnnotations, useBoxplotData, useChartCopy, useControlViolations, useDataIngestion, useDataState, useFilterNavigation, useFocusedChartNav, useIChartData, useKeyboardNavigation, useResponsiveChartMargins, useThemeState, useBoxplotWrapperData, useIChartWrapperData, useParetoChartData, useDashboardComputedData, useHypotheses, useFindings, useAIContext, useChartInsights, useAICoScout, useKnowledgeSearch, useNarration, useProjectPersistence, useVerificationCharts, useFilterHandlers, useCreateFactorModal, useLocaleState, useTranslation, useReportSections, useScrollSpy, useSnapshotData, copySectionAsHTML, useYamazumiChartData, useYamazumiIChartData, useYamazumiParetoData, useAsyncStats |
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
| NarrativeBar     | `[data-testid="narrative-bar"]`             |
| Narrative shimmer| `[data-testid="narrative-shimmer"]`         |
| Ask button       | `[data-testid="narrative-ask-button"]`      |
| CoScoutPanel     | `[data-testid="coscout-panel"]`             |
| CoScout input    | `[data-testid="coscout-input"]`             |
| CoScout message  | `[data-testid^="coscout-message-"]`         |
| ChartInsightChip | `[data-testid^="insight-chip-"]`            |
| Save as PDF button | `[data-testid="report-save-pdf"]`          |

## Zustand Store Testing

Zustand stores are tested as plain state containers without rendering components:

- **Pattern**: Create store instance, call actions, assert resulting state
- **Reset between tests**: Use `store.setState(initialState)` or call `store.getState().reset()` if the store exposes a reset action
- **Selector testing**: Assert that selectors derive correct values from known state
- **Cross-store access**: Mock `otherStore.getState()` when testing stores that read from siblings
- **Reference test**: `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`

```typescript
import { usePanelsStore } from '../panelsStore';

beforeEach(() => {
  usePanelsStore.setState(usePanelsStore.getInitialState());
});

it('should toggle findings panel', () => {
  usePanelsStore.getState().toggleFindings();
  expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
});
```

## i18n Test Setup

Tests that use translations must register locale loaders before preloading. `@variscout/core` no longer uses `import.meta.glob` directly — apps and tests register their own loaders:

```typescript
import { registerLocaleLoaders } from '@variscout/core/i18n';
import type { MessageCatalog } from '@variscout/core';

// Register Vite-based locale loaders for tests
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

// Then preload as needed
beforeAll(async () => {
  await Promise.all(LOCALES.map(l => preloadLocale(l)));
});
```

Reference tests: `packages/core/src/i18n/__tests__/index.test.ts`, `packages/hooks/src/__tests__/useTranslation.test.ts`

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
9. Theme Switching (Azure) Verification
10. AI Graceful Degradation Verification
11. NarrativeBar Lifecycle Verification
12. CoScoutPanel Conversation Verification
