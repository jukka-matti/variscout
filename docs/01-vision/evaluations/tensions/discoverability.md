# Discoverability

> The entire progressive stratification system starts with clicking a boxplot bar --- if the analyst doesn't know to click, the most powerful feature is invisible.

## The Tension

VariScout's drill-down is triggered by interacting with chart elements: clicking a boxplot bar, selecting a Pareto category, or using the filter chip dropdown. This design choice is intentional --- it integrates filtering into the analytical flow rather than separating it into a control panel. The analyst discovers patterns _and_ acts on them in the same visual space.

But this integration comes at a discoverability cost. A first-time user sees four static charts and may never realize they're interactive. The boxplot bars don't visually signal "click me" in the way a button or menu would. The variation funnel exists as an alternative entry point and progress tracker, but it's behind an icon in the toolbar --- itself a discoverable-only-if-you-look feature. The result is that VariScout's most powerful capability is also its most hidden.

This is particularly acute because the drill-down is what differentiates VariScout from simpler charting tools. Without discovering it, the user sees a competent but unremarkable SPC dashboard. With it, they have a systematic variation investigation methodology. The gap between "never discovered drill-down" and "uses drill-down fluently" is the gap between a user who churns and a user who becomes an advocate.

## Persona Impact

| Persona         | Impact | Why                                                                                                                                                                          |
| --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | High   | Gary is evaluating tools. If he doesn't discover the drill-down in his first session, he may conclude VariScout is "just another chart tool" and move on.                    |
| Student Sara    | Medium | Sara often arrives via instructor guidance, which may include explicit instructions to click the boxplot. Her discovery path is mediated by course materials.                |
| OpEx Olivia     | Medium | Olivia evaluates based on team capability, not personal exploration. If one team member discovers the drill-down and demonstrates it, the discovery gap is bridged socially. |
| Trainer Tina    | Low    | Tina is an expert who explores tools thoroughly. She'll discover the drill-down quickly --- but she may worry about her students' ability to find it independently.          |
| Evaluator Erik  | Low    | Erik evaluates security and deployment, not interaction patterns. However, a demo that fails to showcase the drill-down would weaken the case he's evaluating.               |
| Curious Carlos  | High   | Carlos arrives from social media with short attention. If the case study demo doesn't guide him to click, he'll see static charts and bounce.                                |

## Current Mitigation

- The variation funnel icon in the toolbar provides an alternative entry point.
- Case study demos on the website walk through the drill-down step by step.
- Sample datasets load with pre-configured views that hint at interactivity.
- Tooltips appear on hover over boxplot bars (desktop only).

## Strategic Weight

**High** --- Discoverability directly impacts conversion and retention. The drill-down is both the primary differentiator and the hardest feature to find. Every user who doesn't discover it represents a missed opportunity for the product to demonstrate its value.

## Related Patterns

- [Sidebar Filter Panel](../patterns/sidebar-filter-panel.md) --- Always-visible filters solve discoverability entirely but sacrifice analytical flow integration.
- [Factor Suggestion](../patterns/factor-suggestion.md) --- An explicit prompt ("Try clicking Machine next") could guide first-time users.
- [Factor Map](../patterns/factor-map.md) --- A spatial overview could serve as a more discoverable entry point than chart-embedded interactions.
