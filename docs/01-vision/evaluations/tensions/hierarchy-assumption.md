# Hierarchy Assumption

> The sequential one-factor-at-a-time drill-down captures main effects but may miss interaction effects between factors.

## The Tension

Progressive stratification works by drilling into the highest-impact factor at each step, treating each factor as an independent contributor to total variation. This is analogous to a greedy search: pick the largest signal, filter, repeat. For main effects --- where a single factor independently drives variation --- this converges reliably on the right answer.

But factors can interact. "Machine C is only problematic on Night Shift" is an interaction effect that the one-factor-at-a-time approach may miss entirely. If Machine C looks average across all shifts, the drill-down would never highlight it. The problem only surfaces when you look at Machine C _within_ Night Shift, or Night Shift _within_ Machine C. The sequential approach can't see this unless the analyst happens to drill both factors in the right order and notices the pattern in the intermediate step.

VariScout's regression panel handles interaction analysis. The Investigation Mindmap's Interaction mode visually surfaces factor-by-factor interaction edges (with delta-R², p-value, and standardized beta) when 2+ factors are in the drill stack, bridging the gap between the drill-down's main-effects focus and the regression panel's interaction capability. Action buttons in both the ConclusionPanel ("Refine in Regression") and the EdgeTooltip ("Model in Regression") navigate directly to the Regression Panel with investigated factors pre-populated.

## Persona Impact

| Persona         | Impact | Why                                                                                                                                                                              |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | High   | Gary knows about interactions from training but may not think to check for them during an exploratory drill-down. He could reach a confident but incomplete conclusion.          |
| Student Sara    | Medium | Sara is learning the methodology and may not understand interaction effects yet. The drill-down teaches one-factor thinking, which is pedagogically correct as a starting point. |
| OpEx Olivia     | High   | Olivia needs comprehensive answers for improvement projects. Missing an interaction means deploying resources to the wrong root cause.                                           |
| Trainer Tina    | Medium | Tina understands the limitation and can teach around it, but she'd prefer the tool to surface interactions more naturally rather than requiring a separate workflow.             |
| Evaluator Erik  | Low    | Erik evaluates security and deployment, not analytical depth. This tension doesn't affect his evaluation criteria.                                                               |
| Curious Carlos  | Low    | Carlos is exploring and discovering patterns. Interaction effects are too advanced for his current journey --- finding main effects is already valuable.                         |

## Current Mitigation

- The Investigation Mindmap's **Interaction mode** (available when 2+ factors are drilled) visually shows interaction edges between factors with delta-R², p-value, and standardized beta.
- The **ConclusionPanel** "Refine in Regression" button navigates to the Regression Panel with investigated factors pre-populated as predictors.
- The **EdgeTooltip** "Model in Regression" button (in Interaction mode) navigates to the Regression Panel with the specific interaction pair pre-populated.
- The Regression Panel's **AdvancedRegressionView** shows a "Project in What-If" button when all terms are significant, completing the investigation-to-action chain.
- Multi-select in filter chips allows the analyst to manually explore two-factor combinations.

## Strategic Weight

**Medium** --- Interaction effects are common in real manufacturing and service processes. The Investigation Mindmap's Interaction mode now provides visual detection and direct navigation to regression, reducing the reliance on analyst initiative. The remaining gap is that the analyst must still switch to Interaction mode rather than being automatically alerted.

## Related Patterns

- [Interaction Heatmap](../patterns/interaction-heatmap.md) --- Directly addresses this by showing factor-by-factor interaction strength before drilling.
- [Auto-Combination Finder](../patterns/auto-combination-finder.md) --- The regression engine could surface interaction-driven combinations automatically.
- [Factor Map](../patterns/factor-map.md) --- Network visualization could show interaction links between factors.
