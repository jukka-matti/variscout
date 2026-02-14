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

1. Looks at which factor explains the most variation (via the Boxplot's eta-squared display)
2. Filters to the highest-impact level of that factor
3. Sees how the remaining factors redistribute in the now-filtered data
4. Repeats until enough variation is isolated to act on

This is analogous to **binary search** applied to a factor space. You don't examine every combination --- you narrow down by the highest-impact factor at each step. Each step does two things simultaneously:

- **Reduces the problem space** --- fewer factors left to investigate
- **Quantifies progress** --- the cumulative variation bar shows "67% of total variation captured"

The endpoint is a specific, actionable condition ("Operator Kim on Machine C during Night Shift accounts for 46% of all variation") --- not a vague recommendation ("improve quality"). This specificity is what makes the methodology useful to operations managers who need to assign resources and measure improvement.

### Why filter chips with contribution %

The UI choices in VariScout's drill-down are not arbitrary. Each design decision addresses a specific analytical need.

**Why chips instead of hierarchical breadcrumbs.** A traditional breadcrumb trail (Home > Category > Product) implies strict nesting --- removing a middle element invalidates everything after it. But variation factors are independent. Filtering by Shift and then by Machine doesn't create a hierarchy where Machine is "inside" Shift. You can remove the Shift filter and the Machine filter still makes sense. Chips reflect this independence: each chip is a standalone filter that can be added, removed, or modified without affecting the others.

**Why contribution to total (not local eta-squared).** Local eta-squared answers "how much does this factor explain within the current subset?" --- useful for a statistician examining the filtered data in isolation, but it disconnects from the original problem. If the analyst filters to Night Shift (67% of total) and then sees Machine explains 36% of the Night Shift subset, the local eta-squared is 36%. But what they actually need to know is: "how much of my TOTAL problem does Machine explain?" That's 24% (36% of the 67% Night Shift portion). Contribution to total keeps the analyst anchored to the original question at every step.

**Why multi-select.** Sometimes two values together tell the story. "Machines A and C together account for 60% of variation" is more useful than being forced to pick one. Single-select drill-down imposes artificial binary choices that don't match how real process factors behave. Multi-select also enables comparison workflows: select all the "good" operators to establish a baseline, then see what's different about the excluded ones.

**Why the variation bar.** The cumulative variation bar gives a visceral sense of progress --- "am I getting somewhere?" The color thresholds (green at 50%+, amber at 30--50%, blue below 30%) translate statistics into actionable confidence levels. A plant manager doesn't need to understand eta-squared --- they need to know "is this enough to act on?" The bar answers that question at a glance.

### Connection to Four Lenses and Two Voices

Progressive stratification is the mechanism that makes VariScout's core frameworks actionable.

**Four Lenses.** The Boxplot (FLOW lens) is the natural entry point --- it shows eta-squared by factor, immediately revealing where variation concentrates. But the drill-down doesn't happen in one lens alone. Linked filtering means that drilling in the Boxplot simultaneously updates the I-Chart (CHANGE), Pareto (FAILURE), and Capability (VALUE). The analyst sees not just "Machine C has high variation" but also "Machine C's timeline shows a drift starting in week 3" (I-Chart), "Machine C's failure mode is predominantly oversized" (Pareto), and "Machine C's Cpk is 0.4 vs the overall 0.8" (Capability). The Four Pillars become a coordinated investigation team rather than four independent displays.

**Two Voices.** The drill-down finds process-voice patterns --- which factors drive variation in the process itself. The Capability lens (VALUE) then asks the customer-voice question: "does this variation actually matter to the customer?" A factor might explain 40% of process variation but the filtered Cpk might still be 1.5 --- meaning the process easily meets spec even with this factor active. Conversely, a factor explaining only 15% of variation might push Cpk below 1.0 for that subset, making it the real priority despite its lower statistical contribution. Progressive stratification surfaces both perspectives simultaneously.

---

## Part 2: Tensions and Open Questions

Each tension and pattern below has been evaluated individually against VariScout's philosophy, personas, and competitive positioning --- see [Evaluations](evaluations/index.md).

### Where the current design may be insufficient

**Hierarchy assumption.** The sequential drill-down captures main effects --- how much variation each factor explains independently. But factors can interact: "Machine C is only problematic on Night Shift" is an interaction effect that the one-factor-at-a-time drill-down may miss. The regression panel handles interaction analysis, but the connection between the drill-down and the regression panel isn't obvious in the UI. The variation funnel shows a prompt when 2+ factors are in the drill stack ("Try the Regression Panel with Include interactions"), but this requires the analyst to notice and act on the prompt.

**Discoverability.** The entire progressive stratification system starts with clicking a boxplot bar. If the analyst doesn't know to click, the most powerful feature is invisible. The variation funnel exists as an alternative entry point and progress tracker, but it's behind an icon in the toolbar. First-time users may see four static charts and never discover the interactive drill-down underneath.

**Factor ordering.** The analyst chooses which factor to drill next. The Boxplot shows eta-squared for each factor, which implicitly suggests the highest-eta-squared factor is the best next drill target. But the analyst may not read it that way --- or may have domain knowledge that makes a different factor more interesting. Should the system suggest the next drill target more explicitly? There's a tension between guided and exploratory interaction.

**"When to stop" judgment.** The color-coded variation bar helps (green = strong isolation, amber = moderate, blue = weak), but actionability and statistical explanatory power aren't the same thing. Isolating 46% of variation to "Machine C on Night Shift" is only useful if someone can actually change something about Machine C on Night Shift. If Machine C is the only machine available and Night Shift can't be eliminated, the finding is descriptively accurate but operationally useless. The tool quantifies variation sources but can't assess whether those sources are controllable.

**Mobile screen budget.** Filter chips, the variation bar, and four charts all compete for screen space. On mobile, the filtering UI takes real estate from the charts that make it meaningful. The current design handles this with responsive margins and collapsible sections, but there's an inherent tension between showing the analytical state (active filters, cumulative progress) and showing the analytical content (the charts themselves).

**Path dependency.** The order you drill matters for the intermediate contribution percentages. Filtering by Shift first then Machine gives different intermediate numbers than Machine first then Shift. The final cumulative result converges (the total variation explained by the combination is similar regardless of order), but the journey feels different. An analyst who drills Shift first sees "Shift explains 67%" and may conclude Shift is the dominant factor. An analyst who drills Machine first sees "Machine explains 42%" and draws a different intermediate conclusion. Both reach roughly the same endpoint, but the narrative differs. Whether this is confusing or simply an accurate reflection of how factor contribution depends on context is an open question.

### Alternative patterns worth considering

These aren't proposals for implementation --- they're design patterns that address specific limitations of the current approach, worth evaluating as the product evolves.

**Factor suggestion.** After each filter, highlight the next highest-impact factor: "Try Machine next --- explains 45% of remaining variation." This reduces analyst guesswork and addresses the factor ordering tension. The risk is over-automation: if the system always suggests the next step, the analyst stops thinking about which factor matters and just follows the prompts. The Sock Mystery pedagogy depends on the analyst's own curiosity driving the investigation.

**Automatic top-combination finder.** Use the regression engine to identify the highest-impact 2--3 filter combination automatically, then present it as a starting point. The analyst refines from there rather than building from scratch. This inverts the current workflow: instead of bottom-up exploration, the analyst starts with a system-generated hypothesis and validates or adjusts it. Useful for experienced analysts who want speed over discovery, but potentially harmful for learning.

**Parallel path comparison.** "You drilled Shift then Machine. What if you had started with Machine then Shift?" Show alternative drill paths and whether they converge on the same finding. This directly addresses path dependency concerns by making the convergence (or divergence) visible. The cost is UI complexity and potential information overload.

**Interaction heatmap.** A small matrix visualization showing factor-by-factor interaction strength before drilling. Cells are colored by interaction eta-squared. This helps the analyst see where interactions might matter before committing to a drill path. Addresses the interaction blindness limitation of one-factor-at-a-time drilling. Could be shown as a small panel alongside the Boxplot.

**Sidebar filter panel (Tableau-style).** An always-visible panel listing all factors with checkboxes and sliders. More discoverable than click-to-drill (the filters are always visible, not hidden behind chart interactions), but less integrated with the analytical narrative. The analyst would be managing filters in one panel and reading charts in another, rather than the current approach where filtering is embedded in the chart interaction itself. Trade-off: discoverability vs analytical flow.

**Small multiples.** Show all factor-by-value combinations as a grid of mini-charts. Visual and comprehensive, but quadratic in the number of factors --- 4 factors with 5 levels each means 20 mini-charts, and adding a second dimension makes it 400. Useful for low-dimensional data (2--3 factors), overwhelming beyond that.

**Factor map (network visualization).** Display factors as nodes sized by eta-squared, with values as branches colored by contribution. The analyst's current filter path highlights as a trail through the map. Factor-by-factor interactions show as connecting lines between nodes. This addresses several limitations simultaneously: spatial overview of the entire factor landscape at a glance, interactions visible before drilling, no imposed sequence, and no screen space competition with charts (opens in a separate window). Could serve as an alternative entry point to the boxplot click, or as a "strategy view" alongside the tactical chip trail.

---

## Part 3: Cross-references

This document describes the _why_ behind VariScout's drill-down design. The _what_ and _how_ are documented elsewhere:

| Topic                               | Document                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Product philosophy and EDA mindset  | [EDA for Process Improvement](philosophy.md)                                    |
| Four Lenses drill-down methodology  | [Drill-Down: Progressive Variation Analysis](four-pillars/drilldown.md)         |
| Drill-down implementation and hooks | [Drill-Down Navigation](../03-features/navigation/drill-down.md)                |
| Filter chip UI specification        | [Filter Chips Navigation](../03-features/navigation/breadcrumbs.md)             |
| Linked filtering across charts      | [Linked Filtering](../03-features/navigation/linked-filtering.md)               |
| Step-by-step drill-down workflow    | [Drill-Down Analysis Workflow](../03-features/workflows/drill-down-workflow.md) |
