---
title: 'Design Brief: Guided Investigation'
---

# Design Brief: Guided Investigation

> **Historical document** — this design brief led to the Investigation Mindmap (Phases A-D).
> See [design-spec-investigation-mindmap.md](../../archive/design-spec-investigation-mindmap.md) for final spec.

> Synthesis document bridging competitive intelligence, existing codebase capabilities, and design questions for the Factor Suggestion (Phase 1) and Interaction Heatmap (Phase 2) features.

---

## 1. Statistical Methodology

The guided investigation features build on two distinct statistical engines already present in `@variscout/core`. This section resolves which engine serves which purpose.

### Main Effects: Eta-Squared (Drill-Down Ranking)

The drill-down workflow uses one-way ANOVA eta-squared (η² = SS_between / SS_total) to rank factors by explanatory power. This is the correct metric for the "which factor next?" question because it quantifies how much of the outcome's total variation is attributable to group membership.

| Capability              | Implementation                            | Location                                      | Status |
| ----------------------- | ----------------------------------------- | --------------------------------------------- | ------ |
| Single-factor η²        | `getEtaSquared(data, factor, outcome)`    | `packages/core/src/stats.ts:177`              | Exists |
| Per-filter sample count | `useVariationTracking` → `filterChipData` | `packages/hooks/src/useVariationTracking.ts`  | Exists |
| Cumulative η² tracking  | `useVariationTracking` → running sum      | `packages/hooks/src/useVariationTracking.ts`  | Exists |
| Factor ranking by η²    | `VariationFunnel` → `optimalFactors`      | `apps/pwa/src/components/VariationFunnel.tsx` | Exists |

**Key property**: η² values are computed per-factor against the current filtered subset, so they update dynamically as the analyst drills down. This is the foundation for factor suggestion — the highest η² among remaining (unfiltered) factors is the suggested next step.

### Interactions: Multiple Regression / GLM

Interaction detection uses the multiple regression engine, which already supports categorical predictors (dummy-encoded) and two-way interaction terms.

| Capability                    | Implementation                                                                  | Location                               | Status                |
| ----------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- | --------------------- |
| Interaction term fitting      | `calculateMultipleRegression(data, y, [x1, x2], { includeInteractions: true })` | `packages/core/src/stats.ts:1886`      | Exists                |
| Categorical × categorical     | Dummy encoding with interaction columns                                         | `packages/core/src/stats.ts:1644–1682` | Exists                |
| Standardized coefficients     | `CoefficientResult.standardizedBeta`                                            | `packages/core/src/types.ts:598`       | Exists                |
| Significance testing          | `CoefficientResult.tStatistic`, `CoefficientResult.pValue`                      | `packages/core/src/types.ts:593–596`   | Exists                |
| Interaction term type flag    | `RegressionTerm.type: 'interaction'`                                            | `packages/core/src/types.ts:575`       | Exists                |
| Interaction effect size (ΔR²) | Compare R² of model with and without interaction terms                          | —                                      | **Needs thin helper** |

**The ΔR² helper**: To quantify how much additional variation an interaction explains beyond the main effects, run `calculateMultipleRegression` twice — once with `includeInteractions: false`, once with `includeInteractions: true` — and compute ΔR² = R²_full − R²_main. This is a ~10-line utility function, not a new statistical engine. The individual interaction term standardized betas (already returned) provide the ranking; ΔR² provides the aggregate "are interactions worth investigating?" signal.

### When to Use Which

| Question                                         | Engine              | Metric                                             |
| ------------------------------------------------ | ------------------- | -------------------------------------------------- |
| "Which factor explains the most variation?"      | η² (one-way ANOVA)  | `getEtaSquared()` value                            |
| "What should I drill into next?"                 | η² ranking          | Highest η² among remaining factors                 |
| "Do any factor pairs interact?"                  | Multiple regression | ΔR² > threshold (e.g., 0.05)                       |
| "Which interaction is strongest?"                | Multiple regression | Largest \|standardized β\| among interaction terms |
| "Is this interaction statistically significant?" | Multiple regression | p-value < 0.05 on interaction coefficient          |
| "How much variation have I explained so far?"    | Cumulative η²       | `useVariationTracking` running sum                 |

**Design principle**: η² is the primary navigation metric. Regression is the supplementary "look deeper" engine. The analyst follows η² to drill down; the interaction heatmap uses regression to surface cross-factor patterns that η² (being a one-at-a-time metric) cannot detect.

---

## 2. Existing Suggestion UI Audit

VariScout already contains 10+ guidance elements scattered across the PWA and (partially) the Azure app. These exist organically from different development phases and are not yet unified into a coherent "guided investigation" experience.

### High Prominence (Always Visible)

| Element                    | Location                                                           | What It Does                                                                   | Platform   |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------- |
| **Boxplot "↓ drill here"** | `packages/charts/src/Boxplot.tsx:389`                              | Red text label on the highest-η² bar in the Boxplot                            | PWA, Azure |
| **Filter chip n=X badge**  | `packages/ui/src/components/FilterBreadcrumb/FilterBreadcrumb.tsx` | Badge on each active filter showing sample count (n=X) for the filtered subset | PWA, Azure |

### Moderate Prominence (Visible in Funnel Panel)

| Element                                   | Location                                              | What It Does                                                                                                                                                   | Platform |
| ----------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Factor ranking list**                   | `apps/pwa/src/components/VariationFunnel.tsx:96`      | Ranked list of factors by η², with visual bars and cumulative tracking. "Helps users identify the optimal 1-3 filter settings that explain ~70% of variation." | PWA only |
| **"Highest impact" label + Drill button** | `apps/pwa/src/components/VariationFunnel.tsx:635–647` | Per-factor row showing best value with a "Drill →" action button                                                                                               | PWA only |
| **"Worst" label**                         | `apps/pwa/src/components/VariationFunnel.tsx:727–728` | Red label on the category with highest contribution to variation (>20%)                                                                                        | PWA only |
| **Inline Cpk badge**                      | `apps/pwa/src/components/VariationFunnel.tsx:737–767` | Shows Cpk improvement potential when removing the worst category                                                                                               | PWA only |
| **Combined explained summary**            | `apps/pwa/src/components/VariationFunnel.tsx:267–283` | Cumulative explained variation for selected factors, tracking toward 70% target                                                                                | PWA only |

### Low Prominence (Contextual / On-Demand)

| Element                 | Location                                                                                       | What It Does                                                                                                            | Platform   |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| **InteractionGuidance** | `apps/pwa/src/components/InteractionGuidance.tsx:26`                                           | Educational prompt shown when 2+ factors are in the drill stack. Guides to Regression Panel with "Include interactions" | PWA only   |
| **WhatIfSimulator**     | `apps/pwa/src/components/WhatIfSimulator.tsx`, `apps/azure/src/components/WhatIfSimulator.tsx` | Scenario modeling: "what if we removed the worst category?"                                                             | PWA, Azure |
| **FunnelWindow**        | `apps/pwa/src/components/FunnelWindow.tsx`                                                     | Pop-out window for the Variation Funnel (opens in separate window)                                                      | PWA only   |

### Azure Gaps

The Azure app is missing several guidance elements that exist in the PWA:

| Missing in Azure                  | Impact                                            |
| --------------------------------- | ------------------------------------------------- |
| VariationFunnel / FunnelPanel     | No factor ranking view, no cumulative η² tracking |
| InteractionGuidance               | No interaction awareness prompt                   |
| FunnelWindow (pop-out)            | No companion overview window                      |
| Inline Cpk badges                 | No improvement potential indicators               |
| Cumulative explained target (70%) | No stopping signal                                |

The Azure app has the Boxplot "↓ drill here", FilterBreadcrumb with n=X badge, and WhatIfSimulator — the high-prominence and lowest-prominence elements. The entire middle tier (the Funnel Panel ecosystem) is absent.

### Audit Summary

The existing guidance elements are **individually well-designed** but suffer from three problems:

1. **Scattered placement**: Guidance appears in the Boxplot (chart layer), FilterBreadcrumb (navigation layer), and Funnel Panel (slide-out panel). No single view shows the investigation state.
2. **Hidden depth**: The richest guidance (factor ranking, Cpk badges, cumulative target) lives in the Funnel Panel, which requires explicit opening. First-time users never find it.
3. **Platform inconsistency**: The PWA has 10+ elements; Azure has 4. Professional users paying from €79/month have less guidance than free PWA users.

---

## 3. Competitive Design Principles

Distilled from the six competitor benchmarks ([Minitab](competitive/minitab-benchmark.md), [JMP](competitive/jmp-benchmark.md), [Tableau](competitive/tableau-benchmark.md), [Power BI](competitive/powerbi-benchmark.md), [SigmaXL](competitive/minor-competitors.md), [EDAScout](competitive/edascout-benchmark.md)).

### Do

| Principle                                            | Evidence                                                                                                                                        | Application                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Rank by statistical importance**                   | JMP Effect Summary ranks by LogWorth; Minitab stepwise sorts by p-value                                                                         | Factor suggestions should rank by η² with the value visible (not hidden behind a label)                              |
| **Make suggestions optional**                        | EDAScout's AI guidance was rolled back (v6→v7) because it was too aggressive; restored in v9 with instrumentation                               | Suggestions must be dismissible, toggleable, and never block the workflow                                            |
| **Integrate into the analysis flow**                 | Minitab's multi-vari is a separate menu item users must know to seek; Tableau filter suggestions require consulting a separate "Ask Data" panel | Suggestions should appear inline, in context, at the moment the analyst needs them — not in a separate mode or panel |
| **Show the statistics, not just the recommendation** | JMP shows p-values and effect sizes alongside rankings                                                                                          | The η² value, not just "drill here", should be visible so the analyst learns why a factor is recommended             |
| **Use color and size for importance**                | Power BI Key Influencers sizes bars by importance; JMP Effect Summary uses bar length                                                           | Visual weight (color saturation, size, position) should encode statistical importance                                |

### Don't

| Anti-Pattern                     | Evidence                                                                                                                                                            | Avoidance                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Require model-first analysis** | JMP Fit Model requires specifying all terms before seeing results; Minitab DOE requires pre-defined experimental structure                                          | VariScout's suggestions should emerge from the data as-loaded, not require the analyst to configure a model first                   |
| **Separate seeing from acting**  | Tableau and Power BI filter panels are detached from the charts they affect; the analyst must mentally link sidebar selections to chart changes                     | Factor suggestions should appear on or adjacent to the chart where the analyst will act (the Boxplot), not in a separate panel      |
| **Use AI mediation**             | EDAScout's "Socratic Analyst" chatbot added a conversational layer between the data and the analyst; the v6→v7 rollback shows this created more friction than value | VariScout's guidance should be statistical and transparent, not AI-generated prose                                                  |
| **Present all options equally**  | Tableau and Power BI present all filter values as equal checkboxes; no visual hierarchy of importance                                                               | Factor suggestions should create clear visual hierarchy — the recommended next factor should be visually distinct from alternatives |
| **Hide the investigation state** | Minitab's Session Window logs analysis history as text but doesn't visualize investigation progress; no competitor shows cumulative explained variation             | The analyst should always know where they are in the investigation (how much variation is explained, how many factors explored)     |

---

## 4. Enhancement vs. New Design

### Enhancement: Unify and Surface Existing Guidance

These elements already exist and work correctly. The design task is making them more discoverable and consistent across platforms:

| Element                 | Current State                                         | Design Need                                                                      |
| ----------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Boxplot "↓ drill here"  | Works but is a single red label; no context about why | Add η² value, make it a tappable suggestion chip                                 |
| Filter chip n=X badge   | Shows sample count per active filter                  | Consider adding cumulative η² view alongside sample count                        |
| VariationFunnel ranking | Rich but hidden in slide-out panel                    | Surface key information (next factor suggestion, cumulative η²) in the main view |
| InteractionGuidance     | Only triggers at 2+ factors; text-only                | Integrate with the interaction heatmap (Phase 2) for visual backing              |
| WhatIfSimulator         | Present in both PWA and Azure                         | No changes needed for Phase 1                                                    |

### New Design: Investigation Overview Components

These don't exist yet and require design work:

| Component                            | Purpose                                                                                | Phase   |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ------- |
| **Factor Suggestion chip/banner**    | Inline prompt near the Boxplot: "Try Store next — explains 45% of remaining variation" | Phase 1 |
| **Investigation progress indicator** | Persistent bar showing cumulative explained variation and suggesting when to stop      | Phase 1 |
| **Interaction heatmap**              | Compact matrix showing factor-pair interaction strength (ΔR² or \|β\|)                 | Phase 2 |
| **Investigation Mindmap**            | Companion view showing factors as nodes, drill path as trail, interactions as edges    | Phase 3 |
| **Investigation Narrative**          | Presentation mode transforming the mindmap into a stakeholder-ready visual story       | Phase 3 |

---

## 5. Design Questions

These questions should be resolved during the UI/UX design phase. They are ordered by implementation phase.

### Phase 1: Factor Suggestion

1. **Placement**: Where does the "suggested next factor" prompt appear? Options: (a) on the Boxplot directly (extending the existing "↓ drill here"), (b) as a banner above the Four Lenses, (c) as a floating chip that follows the analyst's focus. The competitive principle says "integrate into the analysis flow" — but the Boxplot label is small and the banner competes with chart space.

2. **Progressive disclosure**: Should the suggestion appear immediately on data load, or only after the first drill? First-time users need a "start here" nudge; returning analysts may find it patronizing. A possible rule: show on first visit per dataset, hide after first interaction.

3. **Pedagogy toggle**: Should Trainer Tina be able to disable suggestions for training exercises? If so, where does the toggle live — settings panel, a toolbar button, or a per-session toggle? The competitive principle says "make suggestions optional."

4. **Funnel surfacing**: The richest guidance lives in the Funnel Panel. Should key metrics (next factor, cumulative %, stopping signal) be surfaced in the main view even when the Funnel is closed? If so, how much dashboard space can they occupy?

5. **Azure parity**: The Azure app is missing the entire Funnel Panel ecosystem. Should Phase 1 include porting the Funnel Panel to Azure, or is a lighter-weight "suggested next factor" chip sufficient for the first iteration?

### Phase 2: Interaction Heatmap

6. **Trigger**: When does the interaction scan run? Options: (a) on data load (pre-compute all pairs), (b) on demand (analyst clicks "check interactions"), (c) after the first drill (when the analyst has demonstrated interest in multi-factor analysis). Option (a) adds latency on load for datasets with many factors; option (c) is the most contextually appropriate but may feel late.

7. **Integration with InteractionGuidance**: The existing `InteractionGuidance` component shows a text prompt when 2+ factors are drilled. Should the interaction heatmap replace this prompt, extend it with visual data, or coexist as separate elements?

8. **Heatmap placement**: The heatmap is a small matrix (~4×4 cells). Where does it sit? Options: (a) below the Boxplot, (b) in a collapsible section of the Funnel Panel, (c) as a tooltip/popover triggered by an "interactions" button. The competitive principle says "don't separate seeing from acting" — a popover risks being ignored.

### Phase 3: Investigation Overview

9. **Mindmap window model**: The Investigation Mindmap (see [pattern evaluation](../../archive/investigation-mindmap.md)) opens as a companion view. Should it be: (a) a pop-out window (like the existing FunnelWindow), (b) a split-pane alongside the main dashboard, (c) a full-screen mode that replaces the dashboard temporarily? Each has different implications for state synchronization and mobile support.

10. **Narrative export format**: The Investigation Narrative (see [pattern evaluation](../../archive/investigation-narrative.md)) targets stakeholder presentations. Should it export as: (a) a static PNG/SVG image, (b) an interactive HTML page, (c) a PDF report, (d) copy-to-clipboard for pasting into slides? The Azure audience (Olivia's team) likely wants PowerPoint-compatible output.

---

## 6. Demo Dataset Validation

The guided investigation features need datasets with 3+ categorical factors and meaningful interaction effects to demonstrate effectively. The following datasets from `packages/data/src/samples/` are candidates:

| Dataset            | Factors                           | Outcome             | η² Spread                                                                                    | Interaction Potential                                                                        | Status                   |
| ------------------ | --------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| **Pizza Delivery** | Store (3), Time_Slot (3), Day (7) | Delivery_Time_min   | Store dominates (South has higher mean+variance); Time_Slot moderate (Dinner rush); Day weak | Store × Time_Slot plausible (South may be worse during Dinner rush due to driver experience) | **Primary demo dataset** |
| **Oven Zones**     | Zone, Shift, (others)             | Temperature         | Likely zone-dominated                                                                        | Zone × Shift plausible                                                                       | Good candidate           |
| **Coffee**         | Various process factors           | Cup quality metrics | Well-distributed                                                                             | Unknown interaction strength                                                                 | Good candidate           |
| **Avocado**        | Region, variety, season           | Quality/ripeness    | Regional dominance likely                                                                    | Region × Season likely (climate interaction)                                                 | Good candidate           |

### Validation Needed

The interaction effects in the sample datasets have **not yet been empirically validated**. The data generation functions in `packages/data/src/samples/*.ts` use additive models (base mean + factor adjustments) — interactions exist only if the generation code explicitly creates them (e.g., Store South × Dinner having a super-additive penalty). Before the design phase, each candidate dataset should be tested:

1. Run `calculateMultipleRegression` with `includeInteractions: true` on each dataset
2. Check if any interaction terms have significant coefficients (p < 0.05)
3. Compute ΔR² to confirm interaction effect size is large enough to demonstrate the heatmap
4. If no dataset has meaningful interactions, modify one data generation function to include an explicit interaction effect (e.g., make Store South's Dinner rush penalty 12 minutes instead of the standard 5)

This validation is a prerequisite for the Investigation Flow Map ([Concept 2](investigation-flow-map.md)) to include realistic interaction examples.

---

## Related Documents

- [Investigation Flow Map](investigation-flow-map.md) — Step-by-step scenario walkthrough using the Pizza dataset
- [Investigation Mindmap](../../archive/investigation-mindmap.md) — Pattern evaluation for the companion visualization
- [Investigation Narrative](../../archive/investigation-narrative.md) — Pattern evaluation for presentation mode
- [Factor Suggestion](../../archive/evaluation-patterns/factor-suggestion.md) — Phase 1 pattern evaluation
- [Interaction Heatmap](../../archive/evaluation-patterns/interaction-heatmap.md) — Phase 2 pattern evaluation
- [Factor Map](../../archive/evaluation-patterns/factor-map.md) — Related Phase 3 pattern (deferred)
- [EDAScout Benchmark](competitive/edascout-benchmark.md) — AI guidance rollback arc
- [Minitab Benchmark](competitive/minitab-benchmark.md) — Menu-driven factor analysis
- [JMP Benchmark](competitive/jmp-benchmark.md) — Effect Summary and model-first paradigm
- [Tableau Benchmark](competitive/tableau-benchmark.md) — Sidebar filter anti-pattern
- [Power BI Benchmark](competitive/powerbi-benchmark.md) — Key Influencers visual
