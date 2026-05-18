---
title: 'Continuous Regression (Unified GLM)'
description: 'OLS/GLM engine replacing categorical-only ANOVA best subsets — handles continuous + categorical factors with QR decomposition, NIST-validated'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_continuous_regression.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## Unified GLM Regression Engine (ADR-067, delivered Apr 5 2026)

Replaces the categorical-only ANOVA best subsets with a unified OLS/GLM engine. ~75% of real-world process improvement predictors are continuous (temperature, pressure, speed).

**Why:** Benchmarking Minitab (continuous-only Best Subsets), JMP (unified Fit Model + Prediction Profiler), and NIST confirmed the need. The HP injection molding story (1983 voice memo) is the canonical use case: barrel temperature, clamping force, humidity — all continuous Xs.

**How to apply:** When working on any stats, Evidence Map, or What-If code, remember that factors can now be continuous OR categorical. The engine auto-detects via `classifyAllFactors()`.

### Architecture

- **Two engines**: `calculateAnova()` stays for single-factor boxplot η². New OLS engine handles best subsets (mixed factor types).
- **Why two**: ANOVA is ~20 lines, O(n), proven for the simple boxplot case. OLS adds matrix algebra overhead that's unnecessary for single-factor display.
- **Dual path in `computeBestSubsets()`**: all-categorical → ANOVA cell-means (exact backward compat), any continuous → OLS with dummy coding.
- **Type III SS** "drop one" decomposition for correct partial η² with unbalanced data. Single-factor η² = R² (identical to ANOVA). Multi-factor: partial η² ≠ overall R².

### Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/stats/factorTypeDetection.ts` | Auto-classify columns (≤6 unique → categorical, >20 → continuous) |
| `packages/core/src/stats/designMatrix.ts` | Reference coding + centering + Float64Array |
| `packages/core/src/stats/olsRegression.ts` | QR solver (Householder) + `shouldIncludeQuadratic()` |
| `packages/core/src/stats/typeIIISS.ts` | Type III SS via model comparison |
| `packages/core/src/stats/bestSubsets.ts` | Unified engine (ANOVA + OLS dual path) |
| `packages/charts/src/ScatterFit.tsx` | Scatterplot + fitted curve chart |
| `packages/ui/.../PredictionProfiler.tsx` | JMP-style continuous sliders + categorical selectors |
| `packages/ui/.../SweetSpotCard.tsx` | Quadratic optimum with operating window |
| `packages/ui/.../EquationDisplay.tsx` | Natural language + expanded math + trust badge |
| `packages/data/src/samples/injection.ts` | HP-inspired mixed-factor sample dataset |
| `packages/data/src/samples/nistLongley.ts` | NIST validation dataset (6 predictors, 16 obs) |

### Critical Math Notes

- **Vertex formula** for centered quadratic: `x_opt = mean - b1/(2*b2)`, NOT `-b1/(2*b2)`. The mean offset matters because X² is centered.
- **Center X before squaring**: drops X vs X² correlation from ~0.95 to ~0.
- **QR decomposition** (not normal equations) for numerical stability. NIST-validated to 9 significant digits.
- **PredictorInfo.mean** field carries the factor mean for correct quadratic vertex and prediction.

### Two-Way Interaction Effects (delivered Apr 7 2026)

Two-pass hierarchical best subsets with interaction screening. Matches Minitab Best Subsets and JMP Fit Model for all factor type combinations (cont×cont, cont×cat, cat×cat).

Key files: `interactionScreening.ts` (screening + pattern classification), `designMatrix.ts` (interaction columns), `bestSubsets.ts` (Pass 2 orchestration).

Pattern classifier: `'ordinal'` (gap changes, lines don't cross) or `'disordinal'` (ranking reverses, lines cross). Plot axis assignment by convention (continuous on x). Language: geometric descriptions only, no causal claims.

MBB validation caveats addressed: equation qualification badge when interactions present, cell counts in edge detail.

UI wiring delivered Apr 7:
- EquationDisplay: interaction chip (× glyph, purple) + qualification badge
- EdgeDetailCard: ordinal/disordinal guidance text + cell counts with amber n<5 flag
- Question templates: directional ("gap changes" / "ranking flips") from screening results
- CoScout context: enriched interactionEffects with pattern + plainLanguage, wired through Editor→useAIOrchestration→useAIContext→buildAIContext
- Known trade-off: Editor.tsx computes bestSubsets separately from useQuestionGeneration (~100ms on data change)

### Phase 2 (future)

- Residual diagnostic plots (vs fitted, vs order, normal probability)
- Multi-series probability plot by factor (parallel line check)
- Per-subgroup regression equations (when distributions diverge)

### Test Coverage

- 168 new tests for OLS engine (2112 → 2280 core tests, Apr 5)
- Interaction effects: +15 tests (2280 → 2485 core tests, Apr 7)
- NIST validation: Norris (2 params), Pontius (3 params), Longley (7 params, multicollinear)
- Code reviewed with 2 critical bugs found and fixed (vertex formula, quadratic prediction)
- Interaction code reviewed: flaky test fixed (deterministic PRNG), safeDivide applied, pattern/axis consistency fixed
