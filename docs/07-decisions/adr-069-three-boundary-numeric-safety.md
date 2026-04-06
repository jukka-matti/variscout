---
title: 'ADR-069: Three-Boundary Numeric Safety'
audience: [engineer]
category: architecture
status: stable
related: [stats-engine, numerical-safety, nan-defense, safe-math]
---

# ADR-069: Three-Boundary Numeric Safety

**Status:** Accepted
**Date:** 2026-04-06

## Context

An audit triggered by a NaN/Infinity bug in the Evidence Map optimum formula revealed a systemic gap: the stats engine had no output validation boundary. Seven division sites had inconsistent guards, 33+ UI files called `.toFixed()` directly on unvalidated statistical values, and the chart library (visx) silently drops NaN SVG attributes — making elements vanish without warning.

Research into how mature stats systems (R, NumPy/SciPy, Minitab, Apache Commons Math) handle this confirmed a universal pattern: three validation boundaries between raw data and user display.

## Decision

Adopt a three-boundary defense architecture:

```
Raw Data → [B1: Input] → Clean Data → [Stats Engine] → [B2: Output] → Safe Results → [B3: Display] → User
```

### Boundary 1 — Input Sanitization (already existed)

`toNumericValue()` in `types.ts` rejects NaN/Infinity at parse time using `isFinite() && !isNaN()`.

### Boundary 2 — Stats Engine Output (new)

Three utilities in `packages/core/src/stats/safeMath.ts`:

- `finiteOrUndefined(n)` — converts non-finite to `undefined` at return boundaries
- `safeDivide(num, denom, minDenom?)` — guards division against zero/near-zero/non-finite
- `computeOptimum(linear, quad, mean)` — single source of truth for quadratic vertex formula

Convention: stats functions return `number | undefined`, never NaN or Infinity. Applied to ANOVA, best subsets, factor effects, Type III SS, Evidence Map layout.

Exception: `andersonDarlingTest()` intentionally returns `{ statistic: Infinity, pValue: 0 }` for degenerate data (all values identical). Consumers must handle this.

### Boundary 3 — Display Formatting (enforced)

`formatStatistic()` in `@variscout/core/i18n` returns "—" for non-finite values. All `.toFixed()` calls on statistical values are guarded with `Number.isFinite()`. ESLint `no-restricted-syntax` rule warns on `.toFixed()` in UI/AI code to prevent regression.

## Alternatives Rejected

- **Branded `FiniteNumber` type**: Pervasive refactor for marginal benefit over `strictNullChecks`. TypeScript already forces handling of `number | undefined`.
- **`Result<T, E>` pattern**: Ergonomic overhead in hot computation paths. `undefined` + strict null checks achieves the same safety.
- **Global NaN exception throwing**: Breaks offline-first resilience principle. Partial results are better than crashes.
- **Custom ESLint plugin for NaN flow**: Low ROI, high false-positive rate. Runtime boundary checks are more reliable.

## Consequences

- Stats consumers can trust values are finite when non-`undefined`
- New code gets ESLint warning on `.toFixed()` in UI/AI paths
- `computeOptimum` eliminates the duplicate optimum formula (was in both `evidenceMapLayout.ts` and `buildAIContext.ts`)
- `extractPredictors` in `bestSubsets.ts` filters non-finite coefficients at the OLS boundary

## Implementation

- `packages/core/src/stats/safeMath.ts` — B2 utility functions
- `packages/core/src/stats/anova.ts` — output guard
- `packages/core/src/stats/bestSubsets.ts` — extractPredictors filter, VIF, ratio guards
- `packages/core/src/stats/factorEffects.ts` — output guard
- `packages/core/src/stats/typeIIISS.ts` — safeDivide for F-stat
- `packages/core/src/stats/evidenceMapLayout.ts` — computeOptimum, equation guards
- `packages/core/src/ai/buildAIContext.ts` — computeOptimum
- 33+ UI/AI files — `.toFixed()` guarded with `Number.isFinite()`
