---
title: 'Factor Suggestion'
---

# Factor Suggestion

> After each filter, highlight the next highest-impact factor to reduce analyst guesswork.

## The Concept

After each drill-down step, the system would highlight the recommended next factor: "Try Machine next --- explains 45% of remaining variation." This makes the implicit suggestion of eta-squared values into an explicit, actionable prompt. The recommendation would appear near the boxplot or in the variation funnel, positioned as a suggestion rather than a directive.

The simplest implementation is a visual emphasis on the highest-eta-squared bar in the boxplot after each filter is applied --- a subtle glow, a "suggested" label, or a ranking indicator. A more aggressive version would display a banner or inline prompt: "Machine explains the most remaining variation. Drill here?" The suggestion would update dynamically as filters change.

The core tension is between guidance and autonomy. The Sock Mystery pedagogy depends on the analyst's own curiosity driving the investigation. If the system always suggests the next step, the analyst stops thinking about which factor matters and follows prompts instead. The learning value of progressive stratification is partly in the _decision_ of what to drill next, not just the drilling itself. A factor suggestion that's too prominent converts an exploration tool into a wizard.

## Tensions Addressed

- [Factor Ordering](../tensions/factor-ordering.md) --- Directly resolves the "which factor next?" decision for novices.
- [Discoverability](../tensions/discoverability.md) --- Suggestions could guide first-time users toward the drill-down workflow.
- [When to Stop](../tensions/when-to-stop.md) --- Could be extended to include stopping suggestions ("Remaining variation is dispersed --- consider acting on current findings").

## Philosophy Alignment

- **EDA for process improvement**: Partially aligned. Suggestions accelerate the exploration but risk making it feel less exploratory. The analyst is still seeing patterns and making decisions, just with a recommendation overlay.
- **Guided frustration pedagogy**: Conflicts if too prominent. The Sock Mystery works because the analyst struggles before discovering patterns. Immediate suggestions short-circuit the productive struggle. A toggle or progressive disclosure (suggestions appear after inactivity or on request) would preserve pedagogy.
- **Four Lenses coordination**: Neutral. Suggestions don't affect how the four charts coordinate during filtering.
- **Two Voices**: Neutral. Factor suggestions address process-voice exploration; the Value lens still provides the customer-voice check independently.

## Persona Impact

| Persona         | Effect                  | Why                                                                                                                                                          |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Green Belt Gary | Positive                | Gary benefits from confirmation that his factor choice is statistically sound. The suggestion validates his instinct or redirects him efficiently.           |
| Student Sara    | Positive (with caution) | Sara learns faster with guidance, but risks becoming dependent on suggestions rather than developing her own analytical judgment. An optional mode is ideal. |
| OpEx Olivia     | Positive                | Olivia's team gets more consistent results when guided. Less variance in analysis quality across different analysts.                                         |
| Trainer Tina    | Neutral                 | Tina wants the option to disable suggestions during training exercises. If it's a toggle, she's happy; if it's always-on, it undermines her teaching.        |
| Evaluator Erik  | Neutral                 | Doesn't affect Erik's evaluation criteria.                                                                                                                   |
| Curious Carlos  | Positive                | Carlos doesn't know statistics. Suggestions help him make better choices without requiring training.                                                         |

## Platform Fit

| Platform            | Fit  | Notes                                                                                                                                       |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | Good | Ideal for the training audience. Could be always-on for PWA since the audience is learners.                                                 |
| Azure (paid team)   | Good | Professional teams benefit from guided workflows. Should be toggleable for experienced users.                                               |
| Excel Add-in        | Poor | The Excel Add-in uses native slicers for filtering, not the drill-down workflow. Factor suggestions don't fit the slicer interaction model. |

## Competitive Landscape

- **Minitab**: The Assistant feature uses a decision-tree approach to suggest which statistical test to run (e.g., "use a 2-sample t-test"), but it is hypothesis-driven menu guidance — the analyst must already have a question in mind. The Assistant does not suggest drill-down order or factor investigation sequence. It directs the analyst to the right menu item, not through an iterative investigation. See [Minitab Benchmark](../competitive/minitab-benchmark.md).
- **JMP**: Graph Builder surfaces visual patterns that the analyst interprets — dragging variables onto shelves reveals correlations and distributions interactively. This is the closest major tool to EDA-style exploration guidance, but the analyst must take initiative to try different variable combinations. JMP does not suggest which factor to examine next; the Effect Summary in Fit Model ranks factors by significance, but only after a model has been fitted. See [JMP Benchmark](../competitive/jmp-benchmark.md).
- **Tableau**: No concept of suggested filter order. Dashboards present all filters equally through sidebar controls — the analyst applies filters based on their own domain knowledge. Tableau is designed for known-structure dashboards, not investigation workflows where the tool guides the analyst toward the most impactful factor. See [Tableau Benchmark](../competitive/tableau-benchmark.md).
- **Power BI**: Same paradigm as Tableau. Slicers present all filter options without ranking or suggestion. The Key Influencers visual performs automated factor analysis using ML, but it produces a static report visual rather than guiding an interactive investigation sequence. See [Power BI Benchmark](../competitive/powerbi-benchmark.md).
- **EDAScout**: Smart Cards and a "Socratic Analyst" chatbot sidebar (Gemini 2.0 Flash) suggest next factors via AI dialogue. Added in v6, completely rolled back in v7, restored in v9. Their approach is AI-mediated (the model tells you what to try) rather than statistically transparent (showing eta-squared and letting the analyst decide). The v6-to-v7 rollback --- and subsequent v9 restoration with audit instrumentation --- suggests AI-driven factor suggestion is harder to get right than it appears. See [EDAScout Benchmark](../competitive/edascout-benchmark.md) for details.

VariScout's version would be unique in suggesting factor order within an EDA workflow. The differentiation is the combination of statistical recommendation (eta-squared ranking) with the progressive stratification methodology. Unlike EDAScout's AI-mediated approach, VariScout's factor suggestion would be grounded in transparent statistics that the analyst can verify and learn from.

## Strategic Verdict

**Pursue** --- Factor suggestion addresses the highest-frequency pain point (factor ordering) with low implementation complexity. The key constraint is making it optional or unobtrusive enough to preserve the exploratory character. A subtle visual emphasis on the highest-eta-squared bar is a low-risk starting point; an explicit prompt is a higher-risk, higher-reward next step.
