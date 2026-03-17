---
title: 'ADR-014: Defer Regression to Phase 2'
---

# ADR-014: Defer Regression to Phase 2

**Status:** Accepted
**Date:** 2026-02-25
**Related:** [ADR-007](adr-007-azure-marketplace-distribution.md) (distribution strategy), [ADR-010](adr-010-gagerr-deferral.md) (Gage R&R deferral precedent)

---

## Context

Regression spans simple linear, GLM (multi-predictor), model reduction, and model-driven simulation across ~3,300 lines of feature code distributed through UI components, hooks, and shared packages:

- **UI layer**: RegressionPanelBase, SimpleRegressionView, AdvancedRegressionView, ExpandedScatterModal (~1,400 lines in `@variscout/ui`)
- **Hooks**: useRegressionState (~400 lines in `@variscout/hooks`), regression persistence in .vrs files
- **Simulation**: ModelDrivenSimulator (~350 lines in `@variscout/ui`), simulateFromModel in `@variscout/core`
- **Mindmap interaction mode**: Bridge from Mindmap factors to Regression predictors (~200 lines)
- **App wrappers**: PWA and Azure RegressionPanel wrappers, Dashboard tab wiring, toolbar integration
- **Tests**: Regression-specific test files across hooks, UI, and app packages
- **Glossary**: Regression-specific terms (R-squared, adjusted R-squared, predictor, interaction term, etc.)

For the Azure Marketplace v1 launch, the core analysis workflow is complete and valuable without regression:

- I-Chart with Nelson Rules and staged analysis
- Boxplot with ANOVA, violin mode, and category sorting
- Pareto chart with contribution ranking
- Capability analysis (Cp/Cpk histogram + probability plot)
- Performance Mode (multi-channel comparison)
- Mindmap drilldown with narrative
- What-If direct-adjustment simulation
- Full drill-down navigation with filter breadcrumbs

Regression adds analytical depth but also adds certification surface area, user complexity, and maintenance burden. No customer has requested regression modelling. The Investigation-to-Action workflow (Mindmap -> Regression -> What-If) is elegant but presumes users who already understand GLM concepts -- a small subset of the target audience.

## Decision

**Defer regression from both PWA and Azure apps. Remove UI, keep core math for Phase 2 reuse.**

### What Gets Removed

| Layer                    | Files/Components                                                                        | Rationale                                             |
| ------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| UI components            | RegressionPanelBase, SimpleRegressionView, AdvancedRegressionView, ExpandedScatterModal | No regression UI in either app                        |
| Hooks                    | useRegressionState                                                                      | No regression state to manage                         |
| Simulation               | ModelDrivenSimulator, simulateFromModel                                                 | Model-driven simulation depends on regression results |
| Mindmap interaction mode | initialPredictors bridge, interaction mode toggle                                       | Simplify Mindmap to drilldown + narrative only        |
| App wiring               | Dashboard Regression tab, toolbar buttons, persistence fields                           | Remove all entry points                               |
| Tests                    | Regression-specific test files                                                          | Tests for removed code                                |
| Glossary                 | Regression-specific terms                                                               | Terms for absent features                             |

### What Stays

| Item                                                                                              | Rationale                                                                                            |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Core math files (regression.ts, multiRegression.ts, interaction.ts, modelReduction.ts, matrix.ts) | Preserved for Phase 2 reuse; exports removed from package index so tree-shaking excludes from builds |
| ScatterPlot chart component                                                                       | General-purpose chart, used outside regression context                                               |
| WhatIfSimulator (direct-adjustment mode)                                                          | Standalone value; users adjust factors directly without needing a fitted model                       |
| simulateDirectAdjustment, calculateProjectedStats                                                 | Support direct What-If mode                                                                          |
| Mindmap (drilldown + narrative modes)                                                             | Core investigation tool; only interaction mode removed                                               |
| ANOVA                                                                                             | Independent statistical feature, not part of regression                                              |

## Implementation

1. Remove regression exports from `@variscout/core` index (keep source files)
2. Remove RegressionPanelBase and related views from `@variscout/ui`
3. Remove useRegressionState from `@variscout/hooks`
4. Remove ModelDrivenSimulator from `@variscout/ui`
5. Remove Mindmap interaction mode (simplify to drilldown + narrative)
6. Remove simulateFromModel from `@variscout/core` variation exports
7. Remove regression tab and toolbar entry points from PWA and Azure Dashboard
8. Remove regression persistence fields from AnalysisState (.vrs format)
9. Remove regression-specific test files
10. Remove regression glossary terms from `@variscout/core`
11. Update feature-parity matrix and documentation

## Re-enablement Criteria (Phase 2)

Re-introduce regression when all of the following are met:

1. **Post-marketplace certification** -- Azure App is listed and generating revenue
2. **Customer demand signal** -- At least one paying customer requests regression or investigation workflow
3. **UX validation** -- Regression workflow tested with target persona (Green Belt Gary) for discoverability and comprehension

Phase 2 implementation can re-export core math files and rebuild UI layer on the preserved foundation.

## Consequences

### Positive

- Reduced MVP scope -- fewer features to certify, document, and support at launch
- Simpler user experience -- core analysis workflow without advanced statistical modelling
- Smaller bundle size -- ~3,300 lines excluded from production builds
- Lower certification surface area for Azure Marketplace submission
- What-If direct mode still provides actionable simulation without requiring regression knowledge

### Negative

- Investigation-to-Action workflow (Mindmap -> Regression -> What-If) loses its middle step; the bridge from investigation to simulation becomes manual
- Users who understand GLM lose a power feature (mitigated: no such users have been identified in the target audience)
- Core math files remain in repo without test coverage (mitigated: re-enable tests when re-enabling feature)

### Neutral

- Core math files (regression.ts, multiRegression.ts, etc.) stay in the repository, unexported -- no maintenance cost, no build cost
- ScatterPlot chart component continues to work for general-purpose use
- WhatIfSimulator direct mode is unaffected
