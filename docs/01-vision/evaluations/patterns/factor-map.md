# Factor Map

> A network visualization of the factor landscape showing factors as nodes, values as branches, and interactions as connections.

## The Concept

A spatial visualization where each factor is a node sized by its eta-squared contribution. Values within each factor extend as branches (or sub-nodes) colored by their contribution to variation. The analyst's current filter path highlights as a trail through the map. Factor-by-factor interactions show as connecting lines between nodes, with line thickness indicating interaction strength.

The factor map addresses several limitations simultaneously. It provides a **spatial overview** of the entire factor landscape at a glance, making interactions visible before drilling, removing the imposed sequence of one-factor-at-a-time analysis, and eliminating the screen space competition between filter state and chart content (the map opens in a separate panel or view).

The visualization draws on network graph conventions: force-directed layout positions related factors closer together, node size communicates importance, and edge thickness communicates relationship strength. The analyst can click a node to apply a filter (equivalent to clicking a boxplot bar) or click an edge to explore the interaction between two factors.

The implementation complexity is significant. Force-directed graph layouts require a physics engine (d3-force or similar), and the visual needs to be readable for both 3-factor and 8-factor datasets. The interaction edges require pre-computation of all pairwise interaction eta-squared values (the same calculation as the interaction heatmap). The resulting visualization must be intuitive to analysts who aren't familiar with network graphs.

## Tensions Addressed

- [Hierarchy Assumption](../tensions/hierarchy-assumption.md) --- Interaction edges make factor-pair relationships visible without sequential drilling.
- [Discoverability](../tensions/discoverability.md) --- The map could serve as an alternative entry point to the boxplot click. A visible, spatial overview invites exploration.
- [Factor Ordering](../tensions/factor-ordering.md) --- No imposed sequence. The analyst can click any node in any order. Node size naturally suggests where to start.
- [Path Dependency](../tensions/path-dependency.md) --- The spatial layout shows all factors simultaneously. The analyst's path is a highlighted trail, not the only way to navigate.
- [Mobile Screen Budget](../tensions/mobile-screen-budget.md) --- The map opens in a separate view, decoupling filter state from chart space.

## Philosophy Alignment

- **EDA for process improvement**: Strongly aligned. A spatial overview of the factor landscape is pure EDA --- the analyst reads visual patterns (big nodes, thick edges, clusters) to guide investigation.
- **Guided frustration pedagogy**: Compatible. The map presents the factor landscape without solving it. The analyst still needs to decide where to drill and interpret what they find. The spatial overview adds context without providing answers.
- **Four Lenses coordination**: Extends. The factor map could be considered a "strategy view" that complements the "tactical" lens views. Click a factor in the map, and the four charts update to show that factor's details.
- **Two Voices**: Neutral to positive. The map could encode customer-voice information (e.g., color nodes red when the filtered Cpk drops below 1.0) alongside process-voice information (node size = eta-squared).

## Persona Impact

| Persona         | Effect   | Why                                                                                                                                                                    |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Positive | Gary gains a visual overview that matches how he thinks about process factors --- as a connected system, not a flat list.                                              |
| Student Sara    | Positive | Sara sees factor relationships spatially, which is more intuitive than numerical eta-squared values. The map is a teaching tool that shows "the shape of the problem." |
| OpEx Olivia     | Positive | Olivia can use the map in presentations to show stakeholders the factor landscape and justify improvement priorities. Visual impact for non-technical audiences.       |
| Trainer Tina    | Positive | Tina can project the map and guide the class through it: "See this big node? That's where the variation is. See this thick line? Those factors interact."              |
| Evaluator Erik  | Neutral  | Adds to the feature comparison against competitors. Network visualization is a differentiating capability.                                                             |
| Curious Carlos  | Positive | Carlos finds spatial visualizations engaging. The map invites clicking and exploring, matching his curiosity-driven approach.                                          |

## Platform Fit

| Platform            | Fit  | Notes                                                                                                                                             |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Good | Excellent teaching tool. Force-directed layout works well in browser. The PWA's exploration-first mission aligns with the map's spatial overview. |
| Azure (paid team)   | Good | Professional teams benefit from the strategic overview. Integration with the four-chart dashboard creates a powerful analysis workspace.          |
| Excel Add-in        | Poor | The content pane's fixed dimensions and slicer-based workflow don't support network visualization. The map is fundamentally a web-native pattern. |

## Competitive Landscape

- **No direct competitor implements this for factor analysis.** Network graphs are used in social network analysis, dependency mapping, and knowledge graphs, but not as an entry point for variation analysis.
- **JMP**: Graph Builder doesn't offer network visualization for factor landscapes.
- **Minitab**: No spatial factor overview.
- **Tableau**: Network visualization requires third-party extensions and is not integrated with statistical analysis.

A factor map would be a genuine innovation --- a visualization pattern that no SPC or EDA tool currently offers. The risk is that it's innovative enough to be confusing for users who expect traditional chart layouts.

## Strategic Verdict

**Defer** --- The factor map is the most ambitious pattern in this evaluation. It addresses the most tensions simultaneously and would be a genuine differentiator. But the implementation complexity (force-directed layout, interaction pre-computation, intuitive interaction design) and the user education requirement (teaching analysts to read a network graph) make it a Phase 3 feature. Build factor suggestion and interaction heatmap first to establish the "guided drill-down" foundation, then introduce the factor map as an advanced overview for power users.
