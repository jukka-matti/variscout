# Sidebar Filter Panel

> An always-visible panel listing all factors with checkboxes and sliders, Tableau-style.

## The Concept

A persistent sidebar (or bottom panel on mobile) that lists all categorical and continuous factors with checkboxes for levels, sliders for ranges, and search/filter within each factor. This is the dominant pattern in BI tools: Tableau, Power BI, Looker, and most dashboard platforms use a filter panel that's always visible alongside the visualization area.

The advantage is complete discoverability: every filter option is visible at all times, no clicking required to discover what's available. The analyst can see the full factor landscape at a glance, apply multiple filters simultaneously, and understand the complete filtering state without reading chips or navigating to a funnel view.

The trade-off is analytical flow. VariScout's current design integrates filtering into the chart interaction itself --- you click a boxplot bar because you _see_ the variation there, and the click-to-filter action is a direct response to the visual pattern. A sidebar panel separates the "seeing" from the "acting": the analyst reads patterns in the chart area and manages filters in a separate panel. This disconnect breaks the tight feedback loop that makes progressive stratification feel like investigation rather than dashboard configuration.

Additionally, a sidebar panel doesn't naturally show eta-squared or contribution percentages. It's a filter management UI, not an analysis UI. The analyst would need to read the boxplot for eta-squared information and then apply that knowledge in the sidebar, adding a cognitive transfer step that doesn't exist in the current click-to-drill design.

## Tensions Addressed

- [Discoverability](../tensions/discoverability.md) --- Completely resolves. All filter options are always visible.
- [Mobile Screen Budget](../tensions/mobile-screen-budget.md) --- Worsens on mobile. A persistent sidebar consumes significant screen real estate on narrow screens.

## Philosophy Alignment

- **EDA for process improvement**: Partially conflicts. The sidebar treats filtering as a configuration task rather than an investigation step. The analyst manages filters instead of _investigating_ through filters.
- **Guided frustration pedagogy**: Conflicts. A sidebar presents all options at once, removing the progressive discovery that builds understanding. The analyst doesn't need to "find" where variation is --- they just check boxes.
- **Four Lenses coordination**: Weakens. The current design means filtering _is_ interacting with a lens. A sidebar decouples filtering from lens interaction, reducing the sense that the four charts are connected investigation tools.
- **Two Voices**: Neutral. Filter management is orthogonal to the process-voice/customer-voice distinction.

## Persona Impact

| Persona         | Effect   | Why                                                                                                                                                                     |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Neutral  | Gary is comfortable with both interaction models. He might prefer the sidebar's familiarity from Tableau/Power BI experience but would lose the analytical integration. |
| Student Sara    | Negative | Sara needs to learn progressive stratification, not dashboard filtering. A sidebar teaches a BI workflow, not an EDA methodology.                                       |
| OpEx Olivia     | Neutral  | Olivia's team may find the sidebar more familiar if they come from Tableau/Power BI backgrounds. But familiarity isn't the same as effectiveness.                       |
| Trainer Tina    | Negative | Tina explicitly teaches the investigation-through-charts approach. A sidebar contradicts her methodology and makes it harder to demonstrate the Sock Mystery journey.   |
| Evaluator Erik  | Neutral  | Erik checks for filter capability on a feature list. Both approaches satisfy the requirement; the interaction model doesn't affect his evaluation.                      |
| Curious Carlos  | Positive | Carlos is used to filter panels from consumer apps. A sidebar is immediately understandable, reducing the learning curve for first-time users.                          |

## Platform Fit

| Platform            | Fit     | Notes                                                                                                                                               |
| ------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Poor    | Conflicts with the educational mission. The PWA should teach progressive stratification, not replicate Tableau.                                     |
| Azure (paid team)   | Neutral | Could be offered as an alternative view for teams migrating from Tableau/Power BI. But it undermines the methodology that differentiates VariScout. |
| Excel Add-in        | N/A     | The Excel Add-in already uses native Excel slicers, which serve the sidebar filter function.                                                        |

## Competitive Landscape

- **Tableau**: Sidebar filters are the primary interaction model. Well-established, familiar to millions of users.
- **Power BI**: Slicer pane serves the same function. Industry standard in enterprise BI.
- **Looker**: Filter bar at top of dashboards. Familiar pattern.

Adopting a sidebar would make VariScout more familiar but less distinctive. The current chart-integrated filtering is a competitive differentiator precisely because it's different from the Tableau model. Adopting the competitor's pattern removes the differentiation.

## Strategic Verdict

**Reject** --- The sidebar filter panel solves discoverability but at the cost of VariScout's core differentiator: analysis-integrated filtering. The philosophical conflict with guided frustration pedagogy and Four Lenses coordination is too deep. Better to solve discoverability through onboarding, tooltips, and factor suggestion rather than adopting a pattern that converts the tool from an investigation platform into a dashboard configurator.
