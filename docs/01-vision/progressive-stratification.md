---
title: 'Progressive Stratification'
audience: [analyst, developer]
category: analysis
status: stable
related: [drill-down, filter-chips, eta-squared, r-squared-adj, factor-intelligence]
---

# Progressive Stratification

Why VariScout's filter chip drill-down is the right interaction model for variation analysis --- and where it might not be.

---

## Part 1: The Concept

### The analyst's problem

Variation data is multidimensional. A production line generates measurements across time, machines, operators, shifts, materials, and environmental conditions. The analyst's question is always the same: **where is the variation concentrated?** But the data doesn't answer that directly.

Traditional approaches force uncomfortable trade-offs:

| Approach                            | Limitation                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------- |
| One chart at a time                 | No way to see how factors interact with each other                         |
| Pivot tables                        | Combinatorial explosion --- 4 factors x 5 levels each = 625 cells          |
| Statistical software (Minitab, JMP) | Powerful but expensive, steep learning curve, outputs p-values not actions |
| Dashboard tools (Tableau, Power BI) | Good at slicing, but don't quantify how much each slice explains           |

The fundamental challenge is that this is an **exploration problem**, not a hypothesis-testing problem. The analyst doesn't start with "I think Machine C is the problem" --- they start with "something is wrong and I don't know where to look." The tool needs to support open-ended investigation that converges on a specific, actionable finding.

### Progressive stratification as the solution

Progressive stratification converts a multidimensional problem into a sequential, one-factor-at-a-time investigation. The analyst:

1. Checks Factor Intelligence (R²adj ranking) to see which factors and combinations explain the most variation
2. Looks at the Boxplot's η² display to confirm which factor to explore first
3. Filters to the category of interest (highest spread, worst mean, or domain-relevant)
4. Sees how the remaining factors redistribute in the now-filtered data
5. Repeats until the variation source is specific enough to act on

This is analogous to **binary search** applied to a factor space. You don't examine every combination --- you narrow down by the highest-impact factor at each step. Each step **reduces the problem space** --- fewer factors left to investigate.

The endpoint is a specific, actionable condition ("Operator Kim on Machine C during Night Shift has StdDev 3x the average") --- not a vague recommendation ("improve quality"). This specificity is what makes the methodology useful to operations managers who need to assign resources and measure improvement.

### Why filter chips

The UI choices in VariScout's drill-down are not arbitrary. Each design decision addresses a specific analytical need.

**Why chips instead of hierarchical breadcrumbs.** A traditional breadcrumb trail (Home > Category > Product) implies strict nesting --- removing a middle element invalidates everything after it. But variation factors are independent. Filtering by Shift and then by Machine doesn't create a hierarchy where Machine is "inside" Shift. You can remove the Shift filter and the Machine filter still makes sense. Chips reflect this independence: each chip is a standalone filter that can be added, removed, or modified without affecting the others.

**Why n=X on chips.** Each chip shows the sample count for the current selection: `Shift = Night (n=45)`. This keeps the analyst aware of how much data remains after filtering --- critical for knowing when statistics become unreliable. Sample count is a universally understood quantity that needs no statistical background to interpret.

**Why multi-select.** Sometimes two values together tell the story. "Machines A and C together show high spread" is more useful than being forced to pick one. Single-select drill-down imposes artificial binary choices that don't match how real process factors behave. Multi-select also enables comparison workflows: select all the "good" operators to establish a baseline, then see what's different about the excluded ones.

**Why Factor Intelligence guides drilling order.** R²adj ranking evaluates all factor combinations simultaneously via Best Subsets regression. This tells the analyst WHERE to drill --- which factors (individually and in combination) explain the most variation. η² on the Boxplot confirms the factor-level effect size. The boxplot visual and StdDev column tell WHICH category to explore within that factor. Three standard metrics, three levels of the investigation.

### Connection to Four Lenses and Two Voices

Progressive stratification is the mechanism that makes VariScout's core frameworks actionable.

**Four Lenses.** The Boxplot (FLOW lens) is the natural entry point --- it shows η² by factor, immediately revealing where variation concentrates. But the drill-down doesn't happen in one lens alone. Linked filtering means that drilling in the Boxplot updates the I-Chart (CHANGE) and the adaptive lens, where Pareto (FAILURE) and Distribution/Capability (VALUE) remain available in context. The analyst still sees not just "Machine C has high variation" but also "Machine C's timeline shows a drift starting in week 3" (I-Chart), "Machine C's failure mode is predominantly oversized" (Pareto), and "Machine C's Cpk is 0.4 vs the overall 0.8" (Capability). The Four Lenses become a coordinated investigation team rather than four independent displays.

**Two Voices.** The drill-down finds process-voice patterns --- which factors drive variation in the process itself. The Capability lens (VALUE) then asks the customer-voice question: "does this variation actually matter to the customer?" A factor might explain 40% of process variation but the filtered Cpk might still be 1.5 --- meaning the process easily meets spec even with this factor active. Conversely, a factor explaining only 15% of variation might push Cpk below 1.0 for that subset, making it the real priority despite its lower statistical contribution. Progressive stratification surfaces both perspectives simultaneously.

---

## Part 2: Tensions and Open Questions

Each tension and pattern below has been evaluated individually against VariScout's philosophy, personas, and competitive positioning --- see [Evaluations](evaluations/index.md).

### Where the current design may be insufficient

**Path dependency.** The sequential drill-down captures main effects --- how much variation each factor explains independently. Different drill orders produce different intermediate views. Factor Intelligence (R²adj) mitigates this by evaluating all combinations simultaneously, giving the analyst an order-independent ranking before they start drilling. But the drill-down interaction itself remains sequential, and the analyst's narrative is shaped by which factor they explore first.

**Interaction effects.** Factors can interact: "Machine C is only problematic on Night Shift" is an interaction effect that the one-factor-at-a-time drill-down may miss. Factor Intelligence can flag strong two-factor combinations (high R²adj for the pair vs individuals), but explicit interaction modeling is planned for a future phase (see [ADR-014](../07-decisions/adr-014-regression-deferral.md), superseded by [ADR-067](../07-decisions/adr-067-unified-glm-regression.md) which ships interaction modeling).

**Discoverability.** The entire progressive stratification system starts with clicking a boxplot bar. If the analyst doesn't know to click, the most powerful feature is invisible. Factor Intelligence provides an alternative entry point by explicitly ranking factors, but first-time users may see four static charts and never discover the interactive drill-down underneath.

**Factor ordering.** The analyst chooses which factor to drill next. Factor Intelligence suggests the highest-R²adj factor, and the Boxplot shows η² for each factor. But the analyst may have domain knowledge that makes a different factor more interesting. There's a tension between guided and exploratory interaction.

**"When to stop" judgment.** Actionability and statistical explanatory power aren't the same thing. Isolating a high-variation condition to "Machine C on Night Shift" is only useful if someone can actually change something about Machine C on Night Shift. If Machine C is the only machine available and Night Shift can't be eliminated, the finding is descriptively accurate but operationally useless. The tool quantifies variation sources but can't assess whether those sources are controllable.

**Mobile screen budget.** Filter chips and four charts all compete for screen space. On mobile, the filtering UI takes real estate from the charts that make it meaningful. The current design handles this with responsive margins and collapsible sections, but there's an inherent tension between showing the analytical state (active filters) and showing the analytical content (the charts themselves).

### Alternative patterns worth considering

These aren't proposals for implementation --- they're design patterns that address specific limitations of the current approach, worth evaluating as the product evolves.

**Automatic top-combination finder.** Use the regression engine to identify the highest-impact 2-3 filter combination automatically, then present it as a starting point. The analyst refines from there rather than building from scratch. This inverts the current workflow: instead of bottom-up exploration, the analyst starts with a system-suggested question and validates or adjusts it. Useful for experienced analysts who want speed over discovery, but potentially harmful for learning.

**Parallel path comparison.** "You drilled Shift then Machine. What if you had started with Machine then Shift?" Show alternative drill paths and whether they converge on the same finding. This directly addresses path dependency concerns by making the convergence (or divergence) visible. The cost is UI complexity and potential information overload.

**Interaction heatmap.** A small matrix visualization showing factor-by-factor interaction strength before drilling. Cells are colored by interaction eta-squared. This helps the analyst see where interactions might matter before committing to a drill path. Addresses the interaction blindness limitation of one-factor-at-a-time drilling. Could be shown as a small panel alongside the Boxplot.

**Sidebar filter panel (Tableau-style).** An always-visible panel listing all factors with checkboxes and sliders. More discoverable than click-to-drill (the filters are always visible, not hidden behind chart interactions), but less integrated with the analytical narrative. The analyst would be managing filters in one panel and reading charts in another, rather than the current approach where filtering is embedded in the chart interaction itself. Trade-off: discoverability vs analytical flow.

**Small multiples.** Show all factor-by-value combinations as a grid of mini-charts. Visual and comprehensive, but quadratic in the number of factors --- 4 factors with 5 levels each means 20 mini-charts, and adding a second dimension makes it 400. Useful for low-dimensional data (2-3 factors), overwhelming beyond that.

**Factor map (network visualization).** Display factors as nodes sized by η², with values as branches. The analyst's current filter path highlights as a trail through the map. Factor-by-factor interactions show as connecting lines between nodes. This addresses several limitations simultaneously: spatial overview of the entire factor landscape at a glance, interactions visible before drilling, no imposed sequence, and no screen space competition with charts (opens in a separate window). Could serve as an alternative entry point to the boxplot click, or as a "strategy view" alongside the tactical chip trail.

---

## Part 3: Cross-references

This document describes the _why_ behind VariScout's drill-down design. The _what_ and _how_ are documented elsewhere:

| Topic                              | Document                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Product philosophy and EDA mindset | [EDA for Process Improvement](philosophy.md)                                    |
| Four Lenses drill-down methodology | [Drill-Down: Progressive Variation Analysis](four-lenses/drilldown.md)          |
| Progressive filtering system       | [Progressive Filtering](../03-features/navigation/progressive-filtering.md)     |
| Step-by-step drill-down workflow   | [Drill-Down Analysis Workflow](../03-features/workflows/drill-down-workflow.md) |
| Variation decomposition statistics | [Variation Decomposition](../03-features/analysis/variation-decomposition.md)   |
