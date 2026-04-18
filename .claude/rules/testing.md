---
paths:
  - "**/__tests__/**"
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "e2e/**"
---

# Test code — editing invariants

- **`vi.mock()` BEFORE component imports.** If mocks are below imports, tests hang in an infinite loop. This is the most common test failure mode.
- **Float comparisons**: `toBeCloseTo(value, decimals)` — never `toBe()` on floats.
- **Zustand store tests**: reset state in `beforeEach` via `setState`. Don't rely on test-order isolation.
- **i18n in tests**: each test file that renders components must register its own locale loader via `import.meta.glob`. Don't assume global registration.
- **Stats tests**: deterministic PRNG only. Never `Math.random()`. Use seeded helpers from `__tests__/` utilities.
- **E2E selectors**: `data-testid` attributes, not DOM class / role / text (text changes with i18n).
- **Known flaky**: `packages/hooks/src/__tests__/index.test.ts` under concurrent Turbo load. Runs clean in isolation.

Reference: `.claude/skills/writing-tests/SKILL.md`.
