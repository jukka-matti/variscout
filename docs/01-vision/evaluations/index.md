---
title: 'Evaluations: Progressive Stratification Tensions & Patterns'
---

# Evaluations: Progressive Stratification Tensions & Patterns

Product strategy evaluations for the design tensions and alternative patterns identified in [Progressive Stratification](../progressive-stratification.md) Part 2. Each evaluation assesses fit against VariScout's philosophy, personas, and competitive positioning.

---

## Summary Matrix

### Tensions

| Tension                                                  | Strategic Weight | Primary Personas Affected | Key Insight                                                                                                      |
| -------------------------------------------------------- | ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Hierarchy Assumption](tensions/hierarchy-assumption.md) | **High**         | Gary, Olivia              | Interaction effects are common in real processes; the one-factor drill-down may miss them.                       |
| [Discoverability](tensions/discoverability.md)           | **High**         | Gary, Carlos              | The drill-down is both the primary differentiator and the hardest feature to find.                               |
| [Factor Ordering](tensions/factor-ordering.md)           | **Medium**       | Gary, Sara                | Analysts may not read eta-squared as navigation guidance without explicit prompting.                             |
| [When to Stop](tensions/when-to-stop.md)                 | **Medium**       | Sara, Olivia              | Statistical isolation doesn't guarantee operational actionability.                                               |
| [Mobile Screen Budget](tensions/mobile-screen-budget.md) | **Medium**       | Sara, Carlos              | Filter state and chart content compete for limited mobile viewport.                                              |
| [Path Dependency](tensions/path-dependency.md)           | **Low**          | Sara                      | Intermediate numbers differ by drill order, but final results converge. Correct behavior, potentially confusing. |

### Patterns

| Pattern                  | Verdict                                            | Tensions Addressed                                                      | Philosophy Fit                   |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------- |
| Factor Suggestion        | **Pursue**                                         | Factor Ordering, Discoverability, When to Stop                          | Good (if optional/subtle)        |
| Interaction Heatmap      | **Pursue**                                         | Hierarchy Assumption, Factor Ordering                                   | Strong                           |
| Parallel Path Comparison | **Defer**                                          | Path Dependency, Hierarchy Assumption                                   | Good                             |
| Auto-Combination Finder  | **Defer**                                          | Hierarchy Assumption, Factor Ordering, Path Dependency                  | Mixed (conflicts with pedagogy)  |
| Small Multiples          | **Defer**                                          | Factor Ordering, Path Dependency                                        | Good (scaling limits)            |
| Factor Map               | **Defer**                                          | All 5 non-mobile tensions                                               | Strong (high complexity)         |
| Investigation Mindmap    | **Primary** (replaced by Findings, Feb 2026)       | Hierarchy Assumption, Discoverability, Factor Ordering, Path Dependency | Strong (lighter Factor Map)      |
| Investigation Narrative  | **Primary** (absorbed into Mindmap, then replaced) | When to Stop, Path Dependency, Discoverability                          | Strong                           |
| Sidebar Filter Panel     | **Reject**                                         | Discoverability                                                         | Poor (undermines differentiator) |

> **Note:** Pattern evaluation files have been archived to `docs/archive/evaluation-patterns/`. The decisions documented here are captured in ADRs and the Findings system implementation. See `docs/archive/evaluation-patterns/` for the original detailed evaluations.

---

## Crosswalk: Which Patterns Address Which Tensions

|                          | Factor Suggestion | Interaction Heatmap | Parallel Path | Auto-Combination | Small Multiples | Factor Map  | Inv. Mindmap | Inv. Narrative | Sidebar Panel |
| ------------------------ | ----------------- | ------------------- | ------------- | ---------------- | --------------- | ----------- | ------------ | -------------- | ------------- |
| **Hierarchy Assumption** |                   | **primary**         | secondary     | **primary**      |                 | **primary** | **primary**  |                |               |
| **Discoverability**      | secondary         |                     |               |                  |                 | secondary   | secondary    | secondary      | **primary**   |
| **Factor Ordering**      | **primary**       | secondary           |               | **primary**      | partial         | **primary** | **primary**  |                |               |
| **When to Stop**         | secondary         |                     |               |                  |                 |             |              | **primary**    |               |
| **Mobile Screen Budget** |                   |                     |               |                  | worsens         | improves    | improves     |                | worsens       |
| **Path Dependency**      |                   |                     | **primary**   | **primary**      | partial         | **primary** | secondary    | secondary      |               |

**Legend**: **primary** = directly resolves the tension. secondary = partially addresses. partial = helps for some cases. worsens = makes the tension worse.

---

## Recommended Sequence

The Investigation Mindmap consolidates Factor Suggestion, Interaction Heatmap, and Investigation Narrative into one three-mode component that replaces the Funnel Panel. Implementation is phased by mode:

1. **Phase A: Drilldown Mode** — Replaces the Funnel Panel with a spatial investigation view. Factor nodes sized by η², drill trail, suggested-next pulsing, click-to-filter popovers. Subsumes Factor Suggestion (the suggested-next node provides the same guidance). New infrastructure: `useDrillPath` hook, Mindmap SVG component.
2. **Phase B: Interaction Mode** — Adds edges between factor nodes showing interaction strength (ΔR²) and significance. Subsumes Interaction Heatmap (visual edges replace the standalone heatmap). New infrastructure: `getInteractionStrength()` helper in `@variscout/core`.
3. **Phase C: Narrative Mode + WhatIfSimulator separation** — Reorganizes nodes into a timeline for stakeholder communication. Step annotations, interaction cross-connections, conclusion panel, PNG export. WhatIfSimulator moves to standalone `/whatif` route.
4. **Phase D: Polish + Azure enhancements** — Split-pane option (Azure, viewport > 1280px), annotations (Azure: OneDrive-synced; PWA: session-only), SVG export (Azure), "Model improvements" → WhatIfSimulator link.

Each phase builds on the previous: B needs A's nodes, C needs A's drill trail + B's edges, D needs all three modes complete. See Design Spec §12 (archived) for full infrastructure prerequisites and reuse mapping.

The sidebar filter panel is rejected as incompatible with VariScout's core differentiator. The auto-combination finder is deferred to the Azure App only, as it conflicts with the PWA's educational mission. Parallel Path Comparison, Small Multiples, and Factor Map are deferred — the Mindmap addresses the tensions they targeted through consolidation rather than additional surfaces.

---

## Methodology

Each evaluation uses a consistent template:

- **Tension files**: The tension described, persona impact assessment (6 personas), current mitigation, strategic weight, and related patterns.
- **Pattern files**: The concept described, tensions addressed, philosophy alignment (EDA, Sock Mystery, Four Lenses, Two Voices), persona impact, platform fit (PWA/Azure/Excel), competitive landscape, and strategic verdict.

Content is seeded from [Progressive Stratification](../progressive-stratification.md) Part 2 and expanded with assessments drawn from [persona definitions](../../02-journeys/personas/) and [product philosophy](../philosophy.md).

---

## Design Preparation

Pre-design deliverables that bridge the gap between competitive intelligence and actionable UI/UX design work.

| Document                                             | Purpose                                                                                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Design Spec: Investigation Mindmap (archived)        | **Historical spec.** Replaced by Findings system (Feb 2026). See `docs/archive/design-spec-investigation-mindmap.md`.                                                                                                                |
| [Design Brief](design-brief-guided-investigation.md) | Historical: competitive intelligence → statistical methodology → existing UI audit → design principles → design questions for the UI/UX phase.                                                                                       |
| [Investigation Flow Map](investigation-flow-map.md)  | Historical: step-by-step walkthrough of a complete investigation using the Pizza Delivery dataset. Documents existing guidance at each step and identifies gaps. The Design Spec Section 8 provides the updated "after" walkthrough. |
| [Bottleneck Flow Map](bottleneck-flow-map.md)        | UX flow evaluation: 7-step bottleneck detection journey using the Bottleneck dataset. Demonstrates "variation > mean" — Step 2's high variance vs Step 3's high average. E2E tests: `apps/pwa/e2e/bottleneck-investigation.spec.ts`. |
| [Hospital Ward Flow Map](hospital-ward-flow-map.md)  | UX flow evaluation: 7-step aggregation trap discovery using the Hospital Ward dataset. Night 94% crisis + Afternoon 48% waste hidden behind 69% average. E2E tests: `apps/pwa/e2e/hospital-ward-investigation.spec.ts`.              |
| Mindmap Chrome Evaluation (archived)                 | Historical evaluation. See `docs/archive/mindmap-chrome-evaluation.md`.                                                                                                                                                              |

> **Note**: The Investigation Mindmap feature was replaced by the Findings system (Feb 2026). The Design Spec, Mindmap Chrome Evaluation, Investigation Mindmap pattern, and Investigation Narrative pattern have been moved to `docs/archive/`. The Design Brief and Flow Map are retained here as historical design thinking.

---

## Competitive Intelligence

| Document                                                | Summary                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [EDAScout Benchmark](competitive/edascout-benchmark.md) | Technical assessment of EDAScout v4/v6/v7/v9 --- architecture, statistics quality, AI rollback arc, and strategic implications. Based on direct codebase analysis. |
| [Minitab Benchmark](competitive/minitab-benchmark.md)   | Industry-standard desktop SPC tool (~$1,700/year). Deep feature set, menu-driven workflow, no linked filtering or progressive drill-down.                          |
| [JMP Benchmark](competitive/jmp-benchmark.md)           | SAS visual analytics platform ($1,785+/year). Strongest EDA heritage (Graph Builder), but model-first for factor analysis. Closest philosophical competitor.       |
| [Tableau Benchmark](competitive/tableau-benchmark.md)   | Dominant BI platform ($75/user/month). Defines the sidebar filter paradigm VariScout rejects. No SPC capabilities.                                                 |
| [Power BI Benchmark](competitive/powerbi-benchmark.md)  | Microsoft enterprise BI ($10/user/month). Slicer paradigm, no native SPC. Key Influencers visual provides ML-based factor ranking.                                 |
| [Minor Competitors](competitive/minor-competitors.md)   | Brief profiles of SigmaXL (Excel add-in, stepwise regression) and Looker (Google BI, filter bar pattern).                                                          |

EDAScout is the closest conceptual competitor to VariScout (browser-based variation analysis for quality professionals). The EDAScout benchmark is based on direct codebase analysis across four versions and maps findings to the tension/pattern framework above. Key takeaways: EDAScout's AI guidance was added in v6, completely rolled back in v7, and restored in v9 --- validating VariScout's methodology-driven approach. Their statistical implementation has critical flaws (hardcoded p-value buckets, misleading within-group SS metric) that VariScout's correct eta-squared and proper F-distribution calculations avoid.

The four major competitor benchmarks (Minitab, JMP, Tableau, Power BI) are based on public documentation and published feature sets, not codebase analysis. Each document maps the competitor's capabilities to VariScout's 6 tension framework and identifies strategic differentiation points. The consistent finding across all competitors: no tool combines linked filtering, progressive stratification, and statistical variation quantification into a unified investigation workflow.
