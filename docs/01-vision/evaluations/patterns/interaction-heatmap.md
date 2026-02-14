# Interaction Heatmap

> A small matrix visualization showing factor-by-factor interaction strength before drilling.

## The Concept

A compact heatmap where rows and columns represent factors and cells are colored by interaction eta-squared (the variation explained by the combination beyond what the individual factors explain separately). The heatmap would sit alongside or below the Boxplot, providing a "pre-flight check" before the analyst commits to a drill path.

A bright cell at the Machine x Shift intersection says: "These two factors interact strongly --- drilling one without the other will miss the pattern." The analyst can then choose to explore both factors together (using multi-select) or drill one knowing that the interaction exists and should be investigated.

The implementation leverages the existing regression engine in `@variscout/core`, which already calculates interaction terms. The heatmap would request a quick interaction scan across all factor pairs when data is loaded or when a new factor filter is applied. For datasets with few factors (2--4), this is computationally trivial. For datasets with many factors (8+), it would need to be calculated on demand or limited to top-N factors by main-effect eta-squared.

The UI footprint is small: a 4x4 grid of colored cells with factor labels takes roughly the space of a single boxplot bar's height. It's supplementary information, not a replacement for the boxplot-driven drill-down. The heatmap answers "are there interactions I should know about?" while the boxplot answers "which factor has the biggest main effect?"

## Tensions Addressed

- [Hierarchy Assumption](../tensions/hierarchy-assumption.md) --- Directly addresses interaction blindness by making interactions visible before drilling.
- [Factor Ordering](../tensions/factor-ordering.md) --- Strong interaction cells suggest factor pairs that should be explored together, informing drill order.

## Philosophy Alignment

- **EDA for process improvement**: Strongly aligned. A heatmap is a visual summary --- the analyst reads patterns from color, not p-values. It adds another lens to the investigation.
- **Guided frustration pedagogy**: Compatible. The heatmap doesn't solve the problem for the analyst; it adds information that the analyst must interpret and act on. The "frustration" of interpreting interaction patterns is productive.
- **Four Lenses coordination**: Extends naturally. The heatmap could be considered a fifth lens or a "meta-lens" that shows relationships between factors rather than individual factor effects.
- **Two Voices**: Neutral. Interactions are process-voice phenomena; the customer-voice check still happens in the Capability lens.

## Persona Impact

| Persona         | Effect   | Why                                                                                                                             |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Positive | Gary learned about interactions in training. The heatmap makes abstract concepts concrete and visible.                          |
| Student Sara    | Positive | Sara sees interaction patterns visually before learning the math. The heatmap teaches by showing, not explaining.               |
| OpEx Olivia     | Positive | Olivia's team catches interaction effects that sequential drilling misses. More thorough analyses, better improvement projects. |
| Trainer Tina    | Positive | Tina can use the heatmap as a teaching tool: "See this bright cell? That means Machine and Shift interact. Let's explore why."  |
| Evaluator Erik  | Neutral  | Doesn't affect Erik's evaluation criteria, but adds to the feature list for competitive comparison.                             |
| Curious Carlos  | Neutral  | Carlos may not understand what interaction means, but the colored grid is visually engaging and may prompt curiosity.           |

## Platform Fit

| Platform            | Fit  | Notes                                                                                                                                                                              |
| ------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Good | Excellent teaching tool. Small UI footprint fits the training context.                                                                                                             |
| Azure (paid team)   | Good | Professional feature for thorough analyses. Fits naturally alongside existing charts.                                                                                              |
| Excel Add-in        | Poor | The content pane's dark-theme chart space could accommodate a heatmap, but the slicer-based workflow doesn't create the "before drilling" moment where the heatmap is most useful. |

## Competitive Landscape

- **JMP**: Scatterplot matrix and correlation matrix are available but require navigation to specific platforms. Not integrated into an EDA drill-down workflow.
- **Minitab**: Multi-vari charts show factor interactions but as a separate analysis, not as an inline pre-flight check.
- **Tableau/Power BI**: No interaction detection. Users must build custom calculated fields for interaction effects.

VariScout's version would be unique in integrating interaction detection directly into the drill-down workflow as a compact, visual pre-flight check. The differentiation: proactive interaction visibility rather than reactive analysis.

## Strategic Verdict

**Pursue** --- Addresses a high-weight tension (hierarchy assumption) with moderate implementation complexity. The regression engine already exists; the work is primarily UI. The heatmap adds analytical depth without disrupting the existing workflow --- it's additive, not alternative. Ideal as a Phase 2 feature after factor suggestion establishes the "guided drill-down" pattern.
