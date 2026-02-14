# Small Multiples

> Show all factor-by-value combinations as a grid of mini-charts.

## The Concept

A grid of small charts --- one per factor level --- showing the same metric (e.g., measurement values, I-Chart, boxplot) across all levels simultaneously. For a factor with 5 machines, the display shows 5 mini-charts side by side. The analyst reads the grid visually: which chart looks different? Where is the spread wider? Where does the center shift?

Small multiples are a Tufte-endorsed pattern for visual comparison. They leverage the human visual system's ability to spot pattern breaks across a grid. The analyst doesn't need to click or filter --- the comparison is immediate and spatial. Each mini-chart is too small for detailed reading but perfect for spotting outliers and trends.

The scaling problem is quadratic. A single factor with 5 levels produces 5 mini-charts --- manageable. Two factors with 5 levels each produce 25 mini-charts (5x5 grid) --- still readable on a large screen. Three factors or more produce hundreds of cells --- overwhelming and unreadable. For the 2--4 factor datasets common in quality analysis, small multiples work well. For datasets with many factors or many levels per factor, they collapse under their own combinatorial weight.

An additional challenge is mobile display. A grid of mini-charts is inherently hostile to narrow screens. Each chart needs minimum dimensions to be readable, and a 5-column grid on a phone screen produces charts too small to convey meaning.

## Tensions Addressed

- [Factor Ordering](../tensions/factor-ordering.md) --- Partially addressed. All factor levels are visible simultaneously, so the analyst doesn't need to choose a drill order. But the analyst still needs to choose _which factor_ to display as the grid dimension.
- [Path Dependency](../tensions/path-dependency.md) --- Partially addressed. Small multiples show all levels at once, removing the sequential narrative that creates path dependency for a single factor.
- [Mobile Screen Budget](../tensions/mobile-screen-budget.md) --- Worsens significantly. Grids are the most screen-hungry visualization pattern.

## Philosophy Alignment

- **EDA for process improvement**: Aligned. Small multiples are a classic EDA technique. Visual comparison across levels is pure exploratory analysis --- the analyst reads patterns, not numbers.
- **Guided frustration pedagogy**: Compatible. The grid doesn't solve the problem; it presents all the data for the analyst to find the pattern. The "frustration" is still present --- the analyst must identify which mini-chart is different.
- **Four Lenses coordination**: Extends naturally. Small multiples could show I-Charts, Boxplots, or Capability histograms across factor levels. The question is which lens to use for the grid.
- **Two Voices**: Neutral. The grid pattern is agnostic to whether the metric is process-voice or customer-voice.

## Persona Impact

| Persona         | Effect   | Why                                                                                                                                       |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Positive | Gary finds visual comparison intuitive. Small multiples match how he thinks about machine-to-machine or shift-to-shift comparisons.       |
| Student Sara    | Positive | Sara sees all the data at once and can practice pattern recognition. The grid is a natural teaching format for "spot the difference."     |
| OpEx Olivia     | Neutral  | Useful for presentations and team discussions where everyone can see the comparison, but may require large screens for readability.       |
| Trainer Tina    | Positive | Tina can project the grid in class and ask "which chart is the outlier?" as an exercise. Excellent teaching tool for low-factor datasets. |
| Evaluator Erik  | Neutral  | Adds to the feature list but doesn't affect security or deployment evaluation.                                                            |
| Curious Carlos  | Neutral  | Carlos may find the grid visually engaging but might not know how to interpret it without guidance.                                       |

## Platform Fit

| Platform            | Fit                | Notes                                                                                                                                   |
| ------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Good (with limits) | Excellent for 2--3 factor datasets used in training. Should be limited to low-dimensional data with a clear "too many levels" fallback. |
| Azure (paid team)   | Good               | Professional teams work on large screens where grids are readable. Should handle higher factor counts gracefully.                       |
| Excel Add-in        | Poor               | The content pane's fixed dimensions make grids impractical. The slicer-based workflow already provides factor-level filtering.          |

## Competitive Landscape

- **Tableau**: Small multiples are a supported layout. Users can create faceted views natively.
- **JMP**: Graph Builder supports faceted displays across factor levels.
- **Minitab**: Multi-vari charts are essentially small multiples with specific statistical overlays.
- **Power BI**: Small multiples feature added in 2021, now a standard visual option.

Small multiples are an established pattern in the industry. VariScout's version would integrate them with the progressive stratification workflow --- the grid would show mini-versions of the Four Lenses charts, coordinated with the drill-down state.

## Strategic Verdict

**Defer** --- Small multiples are valuable for low-dimensional datasets and teaching contexts. However, they don't address the highest-priority tensions (hierarchy assumption, discoverability) and scale poorly with factor count. Build this as a supplementary view after the core drill-down improvements (factor suggestion, interaction heatmap) are in place. Limit initial implementation to single-factor grids with a maximum of 8 levels.
