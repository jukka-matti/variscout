---
title: 'ADR-052: Factor Intelligence — Progressive Factor Analysis'
audience: [developer, architect]
category: architecture
status: stable
related: [statistics, factor-analysis, best-subsets, strategy-pattern]
---

# ADR-052: Factor Intelligence — Progressive Factor Analysis

**Status:** Accepted  
**Date:** 2026-03-29  
**Decision Makers:** Development team  
**Tags:** statistics, factor-analysis, best-subsets, main-effects, interactions

## Context

VariScout's SCOUT phase uses single-factor ANOVA (η²) to rank factors sequentially. Analysts drill into one factor at a time, repeating the loop to build understanding. This works but misses two critical capabilities:

1. **Factor combinations** — two factors together may explain more than either alone (or less, if one is redundant)
2. **Interactions** — one factor's effect may depend on the level of another

The domain expert methodology emphasizes: _"Search for which variables make a difference first, not the equation."_ This aligns with a progressive disclosure approach rather than jumping straight to regression modeling.

## Decision

Implement **Factor Intelligence** as a 3-layer progressive feature in the SCOUT phase:

| Layer               | Question                             | Technique                        | Evidence Gate               |
| ------------------- | ------------------------------------ | -------------------------------- | --------------------------- |
| **1: Ranking**      | Which factor combinations matter?    | Best subsets R²adj               | Always shown                |
| **2: Main Effects** | How does each factor affect outcome? | Per-level group means + η²       | R²adj > 5%                  |
| **3: Interactions** | Do factors interact?                 | ΔR² additive vs cell-means model | ≥2 significant main effects |

### Key Design Choices

1. **Feature within SCOUT, not a separate analysis mode.** Best subsets is a ranking tool; analysis modes (ADR-047) are for data-shape variants (standard/performance/yamazumi). Factor Intelligence produces rankings and effects, not chart layouts.

2. **Evidence-gated layers.** Each layer only unlocks when the previous layer shows sufficient evidence. This prevents analysts from jumping to interaction analysis without first confirming factors matter (matching teaching progression).

3. **ANOVA-based, not regression-based.** Layers 1-3 use sum-of-squares decomposition on categorical factors. This avoids the heavier GLM engine while providing the factor prioritization analysts need. Full regression (Layer 4) is deferred to Phase 2.

4. **X-level targets.** Optimal factor settings from the analysis become improvement targets (`ImprovementIdea` with specific factor levels), converting statistical findings into actionable process changes.

### Mode-Specific Factor Analysis

> See [ADR-054: Mode-Aware Question Strategy](adr-054-mode-aware-question-strategy.md) for the full mode-aware extension.

Factor Intelligence Layers 1-3 use ANOVA/sum-of-squares decomposition on categorical factors. This model applies differently across analysis modes:

| Mode            | R²adj Applicable? | Metric Adaptation                                | Question Framing                       |
| --------------- | ----------------- | ------------------------------------------------ | -------------------------------------- |
| **Standard**    | Yes               | R²adj as-is                                      | "Which factor explains variation?"     |
| **Capability**  | Yes               | R²adj + Cpk impact when specs present            | "Which factor most affects Cpk?"       |
| **Performance** | Yes               | Per-channel R²adj                                | "Which factor varies across channels?" |
| **Yamazumi**    | **No**            | Waste contribution % (from aggregated time data) | "Which step has the most waste?"       |

**Yamazumi limitation:** Yamazumi data is aggregated time composition by activity type — not a continuous outcome suitable for regression. R²adj-based ranking does not apply. ADR-054 introduces a separate `wasteComposition` generator that ranks steps by waste contribution percentage and takt compliance instead of R²adj.

**Capability enhancement:** When specification limits (USL/LSL) are set, the capability adapter wraps existing best subsets output to reword questions: "variation" → "Cpk", and adds centering-vs-spread diagnostic questions based on the Cp/Cpk relationship.

## Architecture

```
packages/core/src/stats/
├── bestSubsets.ts         ← Layer 1: R²adj ranking of all 2^k-1 subsets
├── factorEffects.ts       ← Layer 2-3: main effects + interactions
└── index.ts               ← barrel exports

packages/ui/src/components/StatsPanel/
├── BestSubsetsCard.tsx            ← Layer 1 UI
├── MainEffectsPlot.tsx            ← Layer 2 UI (per-factor panels)
├── InteractionPlot.tsx            ← Layer 3 UI (multi-line chart)
├── FactorIntelligencePanel.tsx    ← Container with evidence gating
└── index.ts                       ← barrel exports
```

## Consequences

### Positive

- Accelerates SCOUT phase by replacing sequential guess-and-check with systematic factor combination ranking
- Follows the teaching methodology (understanding before modeling)
- No architecture changes needed — fits as a feature within existing StatsPanel
- Evidence gating prevents premature conclusions
- Connects to existing INVESTIGATE/IMPROVE pipeline via X-level targets

### Negative

- Limited to categorical factors (no continuous X regression yet)
- **Hard limit: MAX_FACTORS = 10** — Factor Intelligence returns `null` when more than 10 factors are available (2^10 = 1024 subsets is the combinatorial ceiling). Users with 11+ factors should reduce factor count via column mapping.
- Interaction analysis requires ≥2 significant factors with sufficient observations per cell

### Future

- **Layer 4 (Model):** Restore multiRegression.ts for regression equation + residual diagnostics
- **Layer 5 (Optimization):** Constrained optimization → What-If Simulator pipeline
- **Regression analysis mode:** When Layers 4-5 are implemented, add `'regression'` as a proper `AnalysisMode` via ADR-047 strategy pattern

## Implementation Status

| Component                      | File                                                                | Status                   |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------ |
| Layer 1: Best Subsets R²adj    | `packages/core/src/stats/bestSubsets.ts`                            | Complete                 |
| Layer 2: Main Effects          | `packages/core/src/stats/factorEffects.ts`                          | Complete                 |
| Layer 3: Interactions          | `packages/core/src/stats/factorEffects.ts`                          | Complete                 |
| Question generation            | `packages/core/src/stats/bestSubsets.ts`                            | Complete (Standard mode) |
| FactorIntelligencePanel UI     | `packages/ui/src/components/StatsPanel/FactorIntelligencePanel.tsx` | Complete                 |
| MainEffectsPlot                | `packages/ui/src/components/StatsPanel/MainEffectsPlot.tsx`         | Complete                 |
| InteractionPlot                | `packages/ui/src/components/StatsPanel/InteractionPlot.tsx`         | Complete                 |
| Mode-aware question generation | See [ADR-054](adr-054-mode-aware-question-strategy.md)              | Planned                  |

## Amendment: Standard ANOVA Metrics (ADR-062)

Since **ADR-062** (Apr 2026), R²adj is the primary factor ranking metric throughout VariScout. The custom "Category Total SS %" metric has been removed. Factor Intelligence continues to use R²adj exactly as described here. The evidence badge in `QuestionChecklist` now displays R²adj directly.

## References

- [ADR-047: Analysis Mode Strategy Pattern](adr-047-analysis-mode-strategy.md)
- [ADR-054: Mode-Aware Question Strategy](adr-054-mode-aware-question-strategy.md)
- [ADR-062: Standard ANOVA Metrics](adr-062-standard-anova-metrics.md)
- [Factor Intelligence Design Document](../10-development/discussions/2026-03-29-factor-intelligence-design.md)
- [Analysis Journey Map](../03-features/workflows/analysis-journey-map.md)
