# Auto-Combination Finder

> Use the regression engine to identify the highest-impact 2--3 filter combination automatically.

## The Concept

Instead of the analyst building a drill-down path manually --- one factor at a time, choosing at each step --- the system would use the existing regression engine to identify the top 2--3 factor combinations that explain the most variation. The result is presented as a starting hypothesis: "Machine C + Night Shift + Material Batch 7 explains 62% of total variation."

The analyst then validates, adjusts, or explores from this starting point. This inverts the current workflow: instead of bottom-up exploration converging on a finding, the analyst starts with a system-generated finding and drills around it to understand _why_ that combination matters. The regression calculation is already available in `@variscout/core` --- this pattern surfaces its output earlier in the workflow rather than requiring the analyst to navigate to the regression panel.

The risk is twofold. First, for learning audiences, it short-circuits the entire progressive stratification methodology. The analyst never experiences the "where is the variation?" investigation that builds statistical intuition. Second, for all audiences, it may create false confidence: the system says "here's your answer" before the analyst has developed any context about the data. A top combination that's statistically strong but operationally meaningless (the factor can't be changed) feels like a wrong answer from the tool, even though the statistics are correct.

## Tensions Addressed

- [Hierarchy Assumption](../tensions/hierarchy-assumption.md) --- Regression-based detection naturally captures interaction effects that one-factor drilling misses.
- [Factor Ordering](../tensions/factor-ordering.md) --- Bypasses factor ordering entirely by jumping to the optimal combination.
- [Path Dependency](../tensions/path-dependency.md) --- Eliminates path dependency by starting from the endpoint rather than navigating to it.

## Philosophy Alignment

- **EDA for process improvement**: Partially conflicts. EDA is about exploration and pattern discovery. Auto-combination finding is closer to automated hypothesis generation --- useful but a different cognitive mode.
- **Guided frustration pedagogy**: Strongly conflicts. The Sock Mystery depends on the analyst's journey from confusion to understanding. An auto-finder skips the journey entirely. This pattern is fundamentally at odds with the learning mission of the PWA.
- **Four Lenses coordination**: Neutral to positive. Once a combination is surfaced, the analyst can examine it through all four lenses. The coordination still works; only the entry point changes.
- **Two Voices**: Positive. The regression engine could weight combinations by both process-voice (variation explained) and customer-voice (Cpk impact), surfacing the combinations that matter most to the customer.

## Persona Impact

| Persona         | Effect   | Why                                                                                                                                                                     |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Positive | Gary wants efficiency. He can validate the system's suggestion against his domain knowledge rather than building the analysis from scratch.                             |
| Student Sara    | Negative | Sara needs the exploration journey to learn. An auto-finder teaches her to trust the tool's answer rather than develop her own analytical skills.                       |
| OpEx Olivia     | Positive | Olivia's team gets faster, more consistent results. The auto-finder is a productivity multiplier for experienced analysts.                                              |
| Trainer Tina    | Negative | Tina would never use this in training. It undermines the pedagogical approach. She might use it personally for consulting work but would want it disabled for students. |
| Evaluator Erik  | Neutral  | Doesn't affect Erik's evaluation criteria.                                                                                                                              |
| Curious Carlos  | Positive | Carlos wants to see "the answer" quickly. Auto-combination finding matches his attention span and delivers the dopamine hit of a clear finding.                         |

## Platform Fit

| Platform            | Fit  | Notes                                                                                                                     |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Poor | Conflicts with the PWA's educational mission. Should not be available or should be clearly labeled as "skip exploration." |
| Azure (paid team)   | Good | Professional teams prioritize speed and consistency. This is a premium feature that justifies the paid tier.              |
| Excel Add-in        | N/A  | The Excel Add-in's slicer-based filtering doesn't support this workflow.                                                  |

## Competitive Landscape

- **Minitab**: Response Optimizer and DOE analysis find optimal combinations but require formal experimental design, not observational data.
- **JMP**: Prediction Profiler shows factor effects but requires a fitted model, not a one-click scan.
- **SigmaXL**: Multiple regression with stepwise selection is available but requires statistical expertise.

VariScout's version would be unique in combining automatic combination detection with a visual drill-down validation workflow. The differentiation: not just "here's the math" but "here's the finding --- now explore it through Four Lenses."

## Strategic Verdict

**Defer** --- Valuable for the Azure App as a power-user feature but conflicts with the PWA's educational mission. Should be implemented as a premium feature behind the paid tier, explicitly not available in the free training tool. The prerequisite is factor suggestion (a lighter-weight guided pattern) succeeding first.
