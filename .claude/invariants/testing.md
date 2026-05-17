---
paths:
  - "**/__tests__/**"
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "e2e/**"
---

# Test code — non-negotiables

- **`vi.mock()` BEFORE component imports.** If mocks come after imports, tests hang in an infinite loop. Most common test failure mode.
- **`vi.mock()` factories that reference `@variscout/core` exports** must use `importOriginal` partial-pattern, not flat factories — flat factories crash on transitive `DEFAULT_TIME_LENS` reads at preferencesStore init.
- **Floats: `toBeCloseTo(value, decimals)`** — never `toBe()`.
- **Zustand stores: reset state in `beforeEach`** via `useStore.setState(useStore.getInitialState())`.
- **i18n in tests: register your own loader** via `import.meta.glob` before `beforeAll` — never assume global registration.
- **Never `Math.random()`** in tests — use `mulberry32(seed)` from `packages/core/src/__tests__/helpers/stressDataGenerator.ts` (or copy the 9-line helper if cross-package import is awkward). Seeded PRNGs make failures reproduce deterministically.
- **`fake-indexeddb/auto` is globally installed via root `test/setup.ts`.** Do NOT remove that import — any test that transitively pulls in a Dexie-backed store (e.g. `canvasViewportStore` via Canvas tests in `packages/ui`) will hang silently in jsdom without it. The hang has no stack trace — the test never starts.
- **E2E selectors: `data-testid`** only — text/role/class change with i18n + theme.
- Known flaky: `packages/hooks/src/__tests__/index.test.ts` under concurrent Turbo load — passes in isolation; retry once before treating as failure.
- **Architecture tests** (structural-absence guards): see `docs/05-technical/implementation/testing.md` "Architecture Tests (Structural-Absence Guards)" — read-once + per-name regex pattern, denylist limits, branded-type follow-up. Scope is **single-package only** (e.g. the Cpk aggregation guard scans `@variscout/core` only). State the scope honestly in the test's docstring.
