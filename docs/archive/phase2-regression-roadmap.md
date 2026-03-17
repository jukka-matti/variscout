---
title: 'Phase 2: Regression Re-enablement Roadmap'
---

> **HISTORICAL ONLY** — This document describes a deferred roadmap. Regression UI was removed in Feb 2026 per [ADR-014](../07-decisions/adr-014-regression-deferral.md). Kept for reference only.

# Phase 2: Regression Re-enablement Roadmap

> **Status:** Deferred — not started
> **Prerequisite:** [ADR-014](../07-decisions/adr-014-regression-deferral.md) re-enablement criteria must be met
> **Related:** [GLM Roadmap](glm-roadmap.md) (core math enhancements)

---

## A. Re-enablement Criteria

All three conditions from ADR-014 must be satisfied before starting Phase 2 work:

1. **Post-marketplace certification** — Azure App is listed on Azure Marketplace and generating revenue
2. **Customer demand signal** — At least one paying customer requests regression or the investigation workflow
3. **UX validation** — Regression workflow tested with target persona (Green Belt Gary) for discoverability and comprehension

---

## B. Preserved Foundation — Inventory

The core math was preserved in commit `35339a3` (Feb 2026). All source files remain in the repository but are **unexported** from package indexes, so tree-shaking excludes them from production builds.

### Core math files (internal, unexported)

| File                                         | Lines | Key Functions                                                                                                                                            |
| -------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/stats/regression.ts`      | 279   | `calculateRegression()` — linear + quadratic simple regression                                                                                           |
| `packages/core/src/stats/multiRegression.ts` | 558   | `calculateMultipleRegression()` — OLS GLM with dummy coding, interactions, VIF                                                                           |
| `packages/core/src/stats/interaction.ts`     | 72    | `getInteractionStrength()` — ΔR² between main-effects and full models                                                                                    |
| `packages/core/src/stats/modelReduction.ts`  | 59    | `suggestTermRemoval()` — guided term elimination                                                                                                         |
| `packages/core/src/matrix.ts`                | 291   | `transpose()`, `multiply()`, `inverse()` — linear algebra primitives                                                                                     |
| `packages/core/src/variation/simulation.ts`  | 491   | `simulateFromModel()`, `getFactorBaselines()` — model-driven What-If (partial; `simulateDirectAdjustment` and `calculateProjectedStats` remain exported) |

### Types (defined in `types.ts`, not exported from package index)

`MultiRegressionResult`, `RegressionTerm`, `CoefficientResult`, `VIFWarning`, `InteractionEdge`, `TermRemovalSuggestion`, `FactorAdjustment`, `ModelSimulationResult`

### Active assets (exported, usable today)

| Asset                         | Location                                          | Notes                                              |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| ScatterPlot chart             | `packages/charts/src/ScatterPlot.tsx` (371 lines) | General-purpose; exported from `@variscout/charts` |
| WhatIfSimulator (direct mode) | `packages/ui/src/components/WhatIfSimulator/`     | Standalone; no regression dependency               |
| `simulateDirectAdjustment()`  | `packages/core/src/variation/simulation.ts`       | Exported; supports direct What-If                  |
| `calculateProjectedStats()`   | `packages/core/src/variation/simulation.ts`       | Exported; supports direct What-If                  |

---

## C. Re-enablement Steps

### Step 1: Restore exports (~1 hour)

Re-add exports to package barrel files so the preserved math becomes available to consumers:

- **`packages/core/src/stats/index.ts`** — re-export `calculateRegression`, `calculateMultipleRegression`, `getInteractionStrength`, `suggestTermRemoval`
- **`packages/core/src/index.ts`** — re-export regression types: `MultiRegressionResult`, `RegressionTerm`, `CoefficientResult`, `VIFWarning`, `InteractionEdge`, `TermRemovalSuggestion`, `FactorAdjustment`, `ModelSimulationResult`
- **`packages/core/src/variation/index.ts`** — re-export `simulateFromModel`, `getFactorBaselines`

### Step 2: Restore tests (~2 hours)

Recover test files from git history (commit before `35339a3`):

```bash
git show 35339a3^:packages/core/src/stats/__tests__/regression.test.ts
git show 35339a3^:packages/core/src/stats/__tests__/multiRegression.test.ts
git show 35339a3^:packages/core/src/stats/__tests__/modelReduction.test.ts
```

Additional restoration:

- Regression blocks in `stats.test.ts`, `stress.test.ts`, `reference-validation.test.ts`, `goldenData.test.ts`
- Regression-specific terms in `packages/core/src/glossary/terms.ts`
- Simulation test coverage for `simulateFromModel` and `getFactorBaselines`

### Step 3: Rebuild UI components (~1–2 weeks)

Decide whether to restore verbatim from git or rebuild based on UX validation feedback (re-enablement criterion 3):

| Component                | Package            | Purpose                                     |
| ------------------------ | ------------------ | ------------------------------------------- |
| `RegressionPanelBase`    | `@variscout/ui`    | Container with simple/advanced toggle       |
| `SimpleRegressionView`   | `@variscout/ui`    | Single-predictor scatter + fit line         |
| `AdvancedRegressionView` | `@variscout/ui`    | Multi-predictor GLM results table           |
| `ExpandedScatterModal`   | `@variscout/ui`    | Full-screen scatter plot overlay            |
| `useRegressionState`     | `@variscout/hooks` | Regression panel state management           |
| `ModelDrivenSimulator`   | `@variscout/ui`    | What-If driven by fitted model coefficients |

Persistence restoration:

- `RegressionPersistenceState` fields in `useProjectPersistence.ts` and `useDataState.ts`
- `.vrs` file format backward compatibility (new fields must be optional with defaults)

### Step 4: Restore Mindmap interaction mode (~2–3 days)

- Re-add `'interactions'` to `MindmapMode` type union
- Restore interaction edge computation in `useMindmapState.ts`
- Restore `EdgeTooltip` in `packages/charts/src/mindmap/`
- Restore `factorCount`/`dataCount` gating in `MindmapModeToggle`
- Re-add `initialPredictors` bridge from Mindmap → Regression panel

### Step 5: Restore app integration (~2–3 days)

- Add Regression tab to PWA and Azure Dashboard
- Wire toolbar buttons and bridge props (`App.tsx` / `Editor.tsx`)
- Restore `regressionState`/`setRegressionState` in Azure `DataContext`
- Restore `'regression'` in embed messaging `ChartId` type
- Restore `MobileDashboard` regression tab

### Step 6: Restore docs & final tests (~1–2 days)

- Restore app-level test files: `RegressionPanel.test.tsx` (PWA + Azure)
- Restore E2E regression tab tests
- Update `variation-decomposition.md` — change Phase 2 references to present tense
- Re-add regression to `feature-parity.md`, `pricing-tiers.md`, `submission-checklist.md`
- Restore glossary terms
- Update `CLAUDE.md` key files table and `MEMORY.md` exports

---

## D. Core Math Enhancements

Independent of re-enablement, the [GLM Roadmap](glm-roadmap.md) defines 7 enhancements to the preserved OLS engine:

| Priority             | Features                                                           | Purpose                                                     |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| **1 (Foundation)**   | Residual diagnostics + QR decomposition                            | Return residuals/fitted values; improve numerical stability |
| **2 (Diagnostics)**  | Shapiro-Wilk normality test + leverage/Cook's distance             | Warn on model violations; flag influential points           |
| **3 (Distribution)** | Distribution identification (Normal/Lognormal/Weibull/Exponential) | Correct capability analysis for non-normal data             |
| **4 (Advanced)**     | Generalized Linear Models (IRLS) + robust/weighted regression      | Handle non-normal responses and outliers                    |

These enhancements extend the existing engine and can be developed at any time — before, during, or after UI re-enablement. They do not require the UI layer.

---

## E. Removed Code Recovery

All removed UI code is recoverable from git history:

```bash
# UI components
git show 35339a3^:packages/ui/src/components/RegressionPanel/RegressionPanelBase.tsx
git show 35339a3^:packages/ui/src/components/RegressionPanel/SimpleRegressionView.tsx
git show 35339a3^:packages/ui/src/components/RegressionPanel/AdvancedRegressionView.tsx
git show 35339a3^:packages/ui/src/components/RegressionPanel/ExpandedScatterModal.tsx

# Hooks
git show 35339a3^:packages/hooks/src/useRegressionState.ts

# Simulation
git show 35339a3^:packages/ui/src/components/WhatIfSimulator/ModelDrivenSimulator.tsx

# Tests
git show 35339a3^:packages/hooks/src/__tests__/useRegressionState.test.ts
git show 35339a3^:packages/ui/src/components/__tests__/RegressionPanel.test.tsx
```

**Decision gate:** Restore verbatim vs rebuild from scratch should be made after UX validation (re-enablement criterion 3). If the validation reveals discoverability or comprehension issues with the original UI, rebuilding will produce a better result than patching restored code.

---

## Cross-references

| Topic                                       | Document                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Deferral decision and criteria              | [ADR-014](../../07-decisions/adr-014-regression-deferral.md)                   |
| Core math enhancement details               | [GLM Roadmap](glm-roadmap.md)                                                  |
| Variation decomposition (ANOVA, drill-down) | [Variation Decomposition](../03-features/analysis/variation-decomposition.md)  |
| Investigation workflow                      | [Investigation to Action](../03-features/workflows/investigation-to-action.md) |
| What-If simulation (direct mode)            | [What-If Simulator](../06-design-system/components/what-if-simulator.md)       |
