---
paths:
  - "packages/core/src/stats/**"
  - "packages/core/src/findings/**"
---

# Stats engine — editing invariants

Three-boundary numeric safety (ADR-069) applies: B1 parser, B2 stats output, B3 display.

- **Never return `NaN` / `Infinity`** from a stats function. Return `number | undefined`.
- **Use `safeMath.ts` primitives**: `finiteOrUndefined`, `safeDivide`, `computeOptimum`. Do not invent new division/log helpers.
- **ESLint rule `no-tofixed-on-stats`** is enforced; format at the display boundary via `formatStatistic()` from `@variscout/core/i18n`.
- **Regression**: OLS via QR solver (`olsRegression.ts`); NIST Longley test fixture must stay green. Two-pass best-subsets with interaction screening (ADR-067).
- **ANOVA metrics**: η² standardized (ADR-062); Category Total SS % was removed — do not re-add.
- **Deterministic tests only**: use seeded PRNG helpers in `__tests__/`, never `Math.random()`.

Reference: `docs/07-decisions/adr-067-unified-glm-regression.md`, `docs/07-decisions/adr-069-three-boundary-numeric-safety.md`, `.claude/skills/editing-statistics/SKILL.md`.
