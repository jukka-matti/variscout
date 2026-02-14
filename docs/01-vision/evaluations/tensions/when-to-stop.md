# When to Stop

> Statistical explanation and actionability aren't the same thing --- isolating variation doesn't mean you can fix it.

## The Tension

The color-coded variation bar provides a clear signal for statistical progress: green at 50%+ cumulative variation explained, amber at 30--50%, blue below 30%. This helps the analyst judge when they've captured "enough" of the problem. But statistical explanatory power and operational actionability are different things.

Isolating 46% of variation to "Machine C on Night Shift" is only useful if someone can actually change something about Machine C on Night Shift. If Machine C is the only machine available and Night Shift can't be eliminated, the finding is descriptively accurate but operationally useless. The analyst has successfully answered "where is the variation?" but the answer doesn't lead to "what can I do about it?"

The tool quantifies variation sources but can't assess whether those sources are controllable. This is fundamentally a domain knowledge problem --- the tool doesn't know that Machine C is the only option, or that Night Shift is contractually required. But the lack of any "actionability check" means the tool can guide an analyst to a statistically satisfying but practically worthless conclusion. The green variation bar says "you found it!" when it should perhaps say "you found where it is --- now assess whether you can act on it."

## Persona Impact

| Persona         | Impact | Why                                                                                                                                                                                     |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Medium | Gary has enough training to recognize the distinction between finding and fixing, but the tool's satisfaction signals (green bar) may create premature closure.                         |
| Student Sara    | High   | Sara is learning and may equate "found the variation source" with "solved the problem." The tool reinforces this by celebrating statistical progress without questioning actionability. |
| OpEx Olivia     | High   | Olivia allocates resources based on findings. A statistically impressive but unactionable finding wastes project budget and team credibility.                                           |
| Trainer Tina    | Medium | Tina teaches this distinction explicitly ("Finding is step 1, fixing is step 2") but would appreciate if the tool reinforced the message rather than contradicting it.                  |
| Evaluator Erik  | Low    | This tension is about analytical methodology, not tool deployment or security.                                                                                                          |
| Curious Carlos  | Low    | Carlos is in discovery mode. The distinction between finding and fixing is a later-stage concern that doesn't affect his initial exploration value.                                     |

## Current Mitigation

- The variation bar uses color thresholds, not binary pass/fail, which avoids a hard "done" signal.
- The philosophy documentation explicitly states "VariScout finds WHERE to focus. Apply Lean thinking to find WHY."
- Case studies show the full journey from finding to action, modeling the correct workflow.

## Strategic Weight

**Medium** --- This is a methodology limitation more than a product limitation. The tool correctly finds variation sources; it's the analyst's job to assess actionability. However, the satisfaction signals (green bar, contribution percentages) could be misread as "problem solved" signals. A lightweight nudge at the end of a drill-down ("What will you do with this finding?") could bridge the gap without adding complexity.

## Related Patterns

- [Factor Suggestion](../patterns/factor-suggestion.md) --- Could include actionability hints alongside statistical suggestions, though this requires domain knowledge the tool doesn't have.
- [Auto-Combination Finder](../patterns/auto-combination-finder.md) --- Faster path to findings, but amplifies the "now what?" gap by making the statistical part trivially easy.
