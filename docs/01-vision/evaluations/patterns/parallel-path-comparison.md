# Parallel Path Comparison

> Show alternative drill paths and whether they converge on the same finding.

## The Concept

After an analyst completes a drill-down (e.g., Shift then Machine), the system would show what would have happened with an alternative path (Machine then Shift). A comparison view displays the two paths side by side: intermediate contribution percentages, the filter stack at each step, and the final cumulative result. The key insight is whether both paths converge on the same finding or diverge --- convergence confirms the finding is robust; divergence signals that the factor structure is more complex than a sequential drill-down can capture.

The simplest implementation is a retrospective comparison: after the analyst finishes their drill-down, offer "What if you had started with Machine instead?" as a secondary analysis. A more ambitious version would run multiple paths in parallel during drilling, showing a branching tree of possible investigations. The most complex version would include all permutations and highlight the path that maximizes cumulative variation explained at each step.

The cost is UI complexity and potential information overload. An analyst who just completed a satisfying drill-down ("I found it!") may not want to see that an alternative path would have reached the same conclusion faster, or that a different path reveals a completely different pattern. The value is in building statistical confidence, but the cognitive cost is in processing multiple narratives simultaneously.

## Tensions Addressed

- [Path Dependency](../tensions/path-dependency.md) --- Directly addresses this by making convergence or divergence visible.
- [Hierarchy Assumption](../tensions/hierarchy-assumption.md) --- Divergent paths can signal interaction effects that neither single path captures.

## Philosophy Alignment

- **EDA for process improvement**: Aligned. Showing multiple perspectives on the same data is exploratory by nature. It helps the analyst understand factor structure, not just find one answer.
- **Guided frustration pedagogy**: Neutral. The comparison is retrospective --- the analyst has already done the exploration. It adds a "meta-level" reflection on the methodology itself.
- **Four Lenses coordination**: Neutral. Path comparison is about the drill-down sequence, not about how the four charts coordinate.
- **Two Voices**: Neutral. Path comparison doesn't interact with the process-voice/customer-voice distinction.

## Persona Impact

| Persona         | Effect   | Why                                                                                                                                                                                       |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Positive | Gary would appreciate confirmation that his drill-down path led to the right answer. Seeing convergence builds confidence in his analysis.                                                |
| Student Sara    | Positive | Sara learns about path dependency directly. This is a teaching tool: "Notice how both paths reach the same conclusion? That's because the total variation explained is path-independent." |
| OpEx Olivia     | Neutral  | Useful for quality assurance of team analyses but adds complexity to an already feature-rich tool.                                                                                        |
| Trainer Tina    | Positive | Tina could use this as a teaching exercise: "Try both paths and compare." It reinforces understanding of conditional decomposition.                                                       |
| Evaluator Erik  | Neutral  | Doesn't affect Erik's evaluation criteria.                                                                                                                                                |
| Curious Carlos  | Negative | Carlos wants simple answers. Showing that there are multiple paths to the same answer adds confusion rather than clarity for a novice explorer.                                           |

## Platform Fit

| Platform            | Fit  | Notes                                                                                                                           |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Good | Excellent teaching tool for understanding path dependency. Low implementation complexity if done as a retrospective comparison. |
| Azure (paid team)   | Good | Quality assurance feature for team analyses. Helps analysts verify their findings are robust.                                   |
| Excel Add-in        | N/A  | The Excel Add-in uses slicers, not the drill-down workflow.                                                                     |

## Competitive Landscape

- **No direct competitor implements this.** Path comparison in drill-down analysis is a novel concept. Closest analog is JMP's "What If" profiler, which varies model inputs rather than comparing analysis paths.
- **Tableau/Power BI**: No concept of comparing filter sequences.

This would be a genuine differentiator --- a feature that no competitor offers because no competitor frames data exploration as a sequential path through factor space.

## Strategic Verdict

**Defer** --- Intellectually compelling and pedagogically valuable, but addresses a low-frequency pain point (path dependency is strategic weight: Low). Build this after factor suggestion and interaction heatmap, which address higher-impact tensions. A retrospective "what if?" comparison is the lowest-cost entry point when the time comes.
