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
- **Never `Math.random()`** in stats tests — use seeded PRNG helpers.
- **E2E selectors: `data-testid`** only — text/role/class change with i18n + theme.
- Known flaky: `packages/hooks/src/__tests__/index.test.ts` under concurrent Turbo load — passes in isolation; retry once before treating as failure.
- **Architecture tests** (structural-absence guards): see `docs/05-technical/implementation/testing.md` "Architecture Tests (Structural-Absence Guards)" — read-once + per-name regex pattern, denylist limits, branded-type follow-up.
