# Path Dependency

> The order you drill matters for intermediate contribution percentages, even though final results converge.

## The Tension

Filtering by Shift first then Machine gives different intermediate numbers than Machine first then Shift. An analyst who drills Shift first sees "Shift explains 67%" and may conclude Shift is the dominant factor. An analyst who drills Machine first sees "Machine explains 42%" and draws a different intermediate conclusion. Both reach roughly the same endpoint (the total variation explained by the Shift + Machine combination is similar regardless of order), but the narrative along the way differs.

This is mathematically correct --- eta-squared is calculated on the current dataset, and filtering changes the dataset. It's the same reason that correlation doesn't imply causation: the order of conditioning matters for conditional probabilities even when the joint probability is the same. But most analysts don't think in terms of conditional decomposition. They think in narratives: "Shift is the big driver, and within Shift, Machine matters too" versus "Machine is the main factor, and within Machine, Shift separates the good from the bad."

Whether this is confusing or simply an accurate reflection of how factor contribution depends on context is an open question. For trained analysts, path dependency is expected and informative --- the different intermediate numbers reveal something about the factor structure. For novices, it can feel like the tool is giving inconsistent answers depending on the order they click.

## Persona Impact

| Persona         | Impact | Why                                                                                                                                                                                                                |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Green Belt Gary | Medium | Gary may notice the order dependency and be confused by it, or he may accept it as inherent to sequential analysis. His reaction depends on how well his training covered conditional decomposition.               |
| Student Sara    | High   | Sara is learning the methodology and may interpret different intermediate numbers from different paths as the tool being "wrong" or unreliable. This could undermine her trust in the analysis.                    |
| OpEx Olivia     | Medium | If two analysts on Olivia's team reach different intermediate conclusions, it creates alignment problems in team meetings. The final convergence helps but the journey confusion is real.                          |
| Trainer Tina    | Low    | Tina understands path dependency and can use it as a teaching moment: "Notice how the numbers change depending on order? That's because each factor's contribution depends on what you've already controlled for." |
| Evaluator Erik  | Low    | Path dependency is an analytical subtlety that doesn't affect Erik's security and deployment evaluation.                                                                                                           |
| Curious Carlos  | Medium | Carlos follows his intuition about factor importance. If the tool shows different numbers when he clicks in a different order, he may lose confidence in the results.                                              |

## Current Mitigation

- Contribution percentages are labeled "% of total variation" to anchor to the original dataset.
- The cumulative variation bar shows total progress regardless of path, emphasizing convergence.
- The variation funnel displays the full drill stack, making the path explicit.

## Strategic Weight

**Low** --- Path dependency is mathematically correct behavior, not a bug. The final results converge, and the intermediate differences are informative for skilled analysts. The risk is primarily pedagogical: novices may be confused. This is better addressed through learning content (glossary, help tooltips) than through UI changes that would mask correct statistical behavior.

## Related Patterns

- [Parallel Path Comparison](../patterns/parallel-path-comparison.md) --- Directly addresses this by showing alternative paths and their convergence or divergence.
- [Auto-Combination Finder](../patterns/auto-combination-finder.md) --- Bypasses path dependency entirely by jumping straight to the optimal combination.
- [Factor Map](../patterns/factor-map.md) --- Shows all factors simultaneously without imposing a sequence, making path dependency irrelevant for the initial overview.
