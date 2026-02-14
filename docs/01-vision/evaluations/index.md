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

| Pattern                                                          | Verdict    | Tensions Addressed                                     | Philosophy Fit                   |
| ---------------------------------------------------------------- | ---------- | ------------------------------------------------------ | -------------------------------- |
| [Factor Suggestion](patterns/factor-suggestion.md)               | **Pursue** | Factor Ordering, Discoverability, When to Stop         | Good (if optional/subtle)        |
| [Interaction Heatmap](patterns/interaction-heatmap.md)           | **Pursue** | Hierarchy Assumption, Factor Ordering                  | Strong                           |
| [Parallel Path Comparison](patterns/parallel-path-comparison.md) | **Defer**  | Path Dependency, Hierarchy Assumption                  | Good                             |
| [Auto-Combination Finder](patterns/auto-combination-finder.md)   | **Defer**  | Hierarchy Assumption, Factor Ordering, Path Dependency | Mixed (conflicts with pedagogy)  |
| [Small Multiples](patterns/small-multiples.md)                   | **Defer**  | Factor Ordering, Path Dependency                       | Good (scaling limits)            |
| [Factor Map](patterns/factor-map.md)                             | **Defer**  | All 5 non-mobile tensions                              | Strong (high complexity)         |
| [Sidebar Filter Panel](patterns/sidebar-filter-panel.md)         | **Reject** | Discoverability                                        | Poor (undermines differentiator) |

---

## Crosswalk: Which Patterns Address Which Tensions

|                          | Factor Suggestion | Interaction Heatmap | Parallel Path | Auto-Combination | Small Multiples | Factor Map  | Sidebar Panel |
| ------------------------ | ----------------- | ------------------- | ------------- | ---------------- | --------------- | ----------- | ------------- |
| **Hierarchy Assumption** |                   | **primary**         | secondary     | **primary**      |                 | **primary** |               |
| **Discoverability**      | secondary         |                     |               |                  |                 | secondary   | **primary**   |
| **Factor Ordering**      | **primary**       | secondary           |               | **primary**      | partial         | **primary** |               |
| **When to Stop**         | secondary         |                     |               |                  |                 |             |               |
| **Mobile Screen Budget** |                   |                     |               |                  | worsens         | improves    | worsens       |
| **Path Dependency**      |                   |                     | **primary**   | **primary**      | partial         | **primary** |               |

**Legend**: **primary** = directly resolves the tension. secondary = partially addresses. partial = helps for some cases. worsens = makes the tension worse.

---

## Recommended Sequence

Based on the evaluations, the suggested implementation sequence is:

1. **Phase 1: Factor Suggestion** --- Low complexity, addresses the most common pain point (factor ordering), improves discoverability as a side effect. Establishes the "guided drill-down" pattern.
2. **Phase 2: Interaction Heatmap** --- Moderate complexity, addresses the highest-weight tension (hierarchy assumption). Builds on the regression engine already in `@variscout/core`.
3. **Phase 3 (future): Factor Map / Small Multiples / Parallel Path Comparison** --- Higher complexity, addresses secondary tensions. Factor map is the most ambitious but addresses the most tensions simultaneously.

The sidebar filter panel is rejected as incompatible with VariScout's core differentiator. The auto-combination finder is deferred to the Azure App only, as it conflicts with the PWA's educational mission.

---

## Methodology

Each evaluation uses a consistent template:

- **Tension files**: The tension described, persona impact assessment (6 personas), current mitigation, strategic weight, and related patterns.
- **Pattern files**: The concept described, tensions addressed, philosophy alignment (EDA, Sock Mystery, Four Lenses, Two Voices), persona impact, platform fit (PWA/Azure/Excel), competitive landscape, and strategic verdict.

Content is seeded from [Progressive Stratification](../progressive-stratification.md) Part 2 and expanded with assessments drawn from [persona definitions](../../02-journeys/personas/) and [product philosophy](../philosophy.md).
