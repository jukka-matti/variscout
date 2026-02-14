# Factor Ordering

> The analyst chooses which factor to drill next --- there's a tension between guided and exploratory interaction.

## The Tension

The Boxplot shows eta-squared for each factor, which implicitly suggests the highest-eta-squared factor is the best next drill target. But "implicitly suggests" is doing a lot of work. The analyst may not read eta-squared values fluently. They may have domain knowledge that makes a different factor more interesting ("I know we changed suppliers last month --- let me check Material first"). Or they may simply click whatever catches their eye.

This creates a tension between two valid design philosophies. A **guided** approach would highlight the recommended next factor: "Machine explains 45% of remaining variation --- drill here." This reduces analyst guesswork and helps novices make statistically sound choices. An **exploratory** approach leaves the decision entirely to the analyst, trusting their domain knowledge and curiosity to drive the investigation.

The current design leans exploratory: eta-squared is displayed but no explicit recommendation is made. This aligns with the EDA philosophy --- the analyst is the investigator, not the tool. But it also means that an analyst who doesn't understand eta-squared (or doesn't notice it) may drill suboptimal factors, reach weak conclusions, and blame the tool rather than their approach.

## Persona Impact

| Persona         | Impact | Why                                                                                                                                                                          |
| --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | High   | Gary understands eta-squared from training but may not instinctively use it as a navigation guide. He'd benefit from a gentle nudge without losing his sense of agency.      |
| Student Sara    | High   | Sara is learning the methodology. Without guidance, she may drill randomly and not understand why her results are weak. Explicit suggestions would accelerate her learning.  |
| OpEx Olivia     | Medium | Olivia's team members vary in skill. Guided ordering would make the tool more consistent across different analysts in her organization.                                      |
| Trainer Tina    | Medium | Tina wants students to think about factor selection, not just follow prompts. Too much guidance undermines the Sock Mystery pedagogy. She'd prefer guidance that's optional. |
| Evaluator Erik  | Low    | Factor ordering is an analytical workflow detail that doesn't affect Erik's evaluation criteria.                                                                             |
| Curious Carlos  | Medium | Carlos has domain knowledge but no statistical training. Guidance would help him make better choices, but he also trusts his gut about "what matters" in his process.        |

## Current Mitigation

- Eta-squared values are displayed numerically on boxplot bars.
- The variation funnel shows cumulative progress, indirectly indicating whether current drilling is effective.
- The help tooltip system provides explanations of eta-squared on hover.

## Strategic Weight

**Medium** --- Factor ordering affects analysis quality but not fundamental tool usability. The current design works well for trained users and fails gracefully for novices (they still get results, just less optimal ones). The risk is reputational: a novice who drills poorly may conclude the methodology doesn't work.

## Related Patterns

- [Factor Suggestion](../patterns/factor-suggestion.md) --- Directly addresses this by highlighting the recommended next factor.
- [Auto-Combination Finder](../patterns/auto-combination-finder.md) --- Bypasses factor ordering entirely by starting from the optimal combination.
- [Factor Map](../patterns/factor-map.md) --- Visual factor sizing by eta-squared makes the recommendation spatial and intuitive rather than numerical.
