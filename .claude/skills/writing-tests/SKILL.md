---
name: writing-tests
description: Use when writing or modifying tests in any package. Vitest + React Testing Library + Playwright patterns, CRITICAL vi.mock() BEFORE component imports to prevent infinite loops, toBeCloseTo() for float comparisons, Zustand store test pattern (setState in beforeEach), i18n locale loader registration in tests, E2E selector conventions (data-testid), deterministic PRNG in stats tests (never Math.random).
---

# Writing Tests

## When this skill applies

Use this skill when writing or modifying tests in any VariScout package: unit tests via Vitest, component tests via React Testing Library, or E2E tests via Playwright.

## Framework choices

- **Vitest** — unit tests for logic, utilities, and hooks. Test files in `__tests__/` directories alongside source.
- **React Testing Library** — component tests. Prefer `getByRole` over `getByTestId` for queries.
- **Playwright** — E2E browser tests for automated regression (CI/CD safety net).

## Commands

```bash
# Run all tests
pnpm test

# Vitest flags
pnpm test -- --watch       # Watch mode during development
pnpm test -- --coverage    # Coverage report

# Per-package tests
pnpm --filter @variscout/core test
pnpm --filter @variscout/charts test
pnpm --filter @variscout/hooks test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test

# Playwright E2E (automated regression)
pnpm --filter @variscout/pwa test:e2e
pnpm --filter @variscout/azure-app test:e2e

# Browser testing
claude --chrome              # Enable Chrome browser access for interactive E2E
```

## Test ownership (by package)

| Package                | Test Type            | What to Test                                                        |
| ---------------------- | -------------------- | ------------------------------------------------------------------- |
| `@variscout/core`      | Unit                 | stats, parser, tier, export, performance, yamazumi, lttb, buildAIContext, channelQuestions, causalGraph, evidenceMapLayout |
| `@variscout/charts`    | Unit                 | colors, accessibility, multi-selection hook                         |
| `@variscout/hooks`     | Unit                 | All hooks in `packages/hooks/src/` should have tests in `__tests__/` |
| `@variscout/ui`        | Unit                 | UpgradePrompt, HelpTooltip, DataQualityBanner, ColumnMapping, BoxplotDisplayToggle, DataTableBase, DocumentShelf, KnowledgeCitationCard, QuestionsTabView |
| `@variscout/pwa`       | Component + E2E      | UI components, context, full user flows                             |
| `@variscout/azure-app` | Component + E2E      | UI components, auth, storage, editor flows, actionToolHandlers, investigationSerializer |

## Critical patterns

### vi.mock() MUST come BEFORE component imports

Mocking must happen **before** importing any component that uses the mocked module. Importing the component first causes infinite render loops.

**Correct:**
```typescript
import { vi } from 'vitest';

// Mock FIRST
vi.mock('../utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] })),
}));

// THEN import components
import { MyComponent } from './MyComponent';
```

**Wrong:**
```typescript
import { MyComponent } from './MyComponent';  // WRONG: imports before mock
import { vi } from 'vitest';
vi.mock('../utils/api');  // Too late — infinite loop
```

### Float comparisons use toBeCloseTo()

For statistical values with floating-point precision, use `toBeCloseTo()` with a precision parameter:

```typescript
expect(result.mean).toBeCloseTo(42.5, 2);      // Within 0.01
expect(result.sigma).toBeCloseTo(3.14159, 4);  // Within 0.00001
```

### Zustand store test pattern

Stores are tested as plain state containers. Reset store state in `beforeEach()` using `setState(initialState)`:

```typescript
import { usePanelsStore } from '../panelsStore';

beforeEach(() => {
  usePanelsStore.setState(usePanelsStore.getInitialState());
});

it('should toggle findings panel', () => {
  usePanelsStore.getState().toggleFindings();
  expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
});

// Selectors tested as pure functions from known state
it('should derive visible factor count', () => {
  usePanelsStore.setState({
    factors: ['A', 'B', 'C'],
    hiddenFactors: ['B'],
  });
  const count = usePanelsStore(s => s.visibleFactorCount);
  expect(count).toBe(2);
});

// Mock sibling stores when cross-store reading
vi.mock('../investigationStore');
import { useInvestigationStore } from '../investigationStore';
vi.mocked(useInvestigationStore).mockReturnValue({
  getState: () => ({ currentPhase: 'INVESTIGATE' }),
});
```

### i18n locale loader registration in tests

Tests that preload locales must call `registerLocaleLoaders()` with `import.meta.glob` **before** calling `preloadLocale()`:

```typescript
import { registerLocaleLoaders, preloadLocale } from '@variscout/core/i18n';
import type { MessageCatalog } from '@variscout/core';
import { LOCALES } from '@variscout/core/i18n';

// Register Vite-based locale loaders FIRST
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

it('loads German messages', () => {
  expect(getMessage('de', 'stats.mean')).toBe('Mittelwert');
});
```

Reference: `packages/core/src/i18n/__tests__/index.test.ts`

### Deterministic PRNG in stats tests

Never use `Math.random()` in stats tests — it causes flaky tests. Use a seeded, deterministic PRNG:

```typescript
// Bad (flaky)
const randomValue = Math.random();  // Non-deterministic

// Good (deterministic)
import seedrandom from 'seedrandom';
const rng = seedrandom('test-seed');
const randomValue = rng();  // Always the same sequence
```

## E2E data-testid selectors

Key `data-testid` attributes for Playwright E2E tests:

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

## Feature Verification Protocols

Executable via Claude Code Chrome (`claude --chrome`) or Antigravity agents:

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

Full protocol details: `docs/05-technical/implementation/testing.md#feature-verification-protocols`

## Gotchas

- **vi.mock() placement** — Put mocks BEFORE any component import that uses them, not after. Importing the component first causes infinite render loops.
- **Flaky timeout** — `packages/hooks/src/__tests__/index.test.ts` can time out under concurrent Turbo load; passes when run in isolation. Known flake, not a real bug.
- **i18n loaders silent failure** — Tests that preload locales without first registering loaders will silently pass with empty catalogs. Always call `registerLocaleLoaders()` before `preloadLocale()`.
- **Math.random() flakiness** — Never use `Math.random()` in stats tests. Use deterministic seeded PRNGs. Code review will catch this.
- **getByRole over getByTestId** — Prefer role-based queries. Test IDs are a last resort for elements without accessible roles. Role-based queries also verify accessibility.
- **Test count varies** — Don't hardcode "5793 tests" in comments. Run `pnpm test` for the current count; it evolves with new tests.

## Reference

- `docs/05-technical/implementation/testing.md` — full testing strategy and verification protocols
- `packages/core/src/i18n/__tests__/index.test.ts` — canonical i18n test setup
- `packages/*/src/__tests__/` — examples per package
- `.claude/rules/testing.md` — extended testing rules