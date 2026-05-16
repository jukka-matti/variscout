---
paths:
  - "packages/core/src/stats/**"
  - "packages/core/src/findings/**"
---

# Stats engine — non-negotiables

- **Never return `NaN` / `Infinity`.** Return `number | undefined`. Use `safeMath.ts` (`finiteOrUndefined`, `safeDivide`, `computeOptimum`).
- **Never `Math.random()`** in code or tests. Tests use seeded PRNG helpers.
- **Never `.toFixed()`** on stat outputs — display via `formatStatistic()` from `@variscout/core/i18n`. ESLint `no-tofixed-on-stats` enforces.
- **Never call interactions "moderator" / "primary"** — use `'ordinal'` / `'disordinal'`. ESLint `no-interaction-moderator` enforces.
- **NIST Longley fixture must stay green** to 9 significant digits — never weaken the threshold.

Detailed patterns + ADR refs: `packages/core/CLAUDE.md`.
