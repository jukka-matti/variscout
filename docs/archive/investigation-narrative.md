# HISTORICAL ONLY — Mindmap replaced by Findings system (Feb 2026)

# Investigation Narrative

> A presentation mode that transforms the investigation path into a visual story for stakeholders — showing what was found, in what order, and why it matters.

## The Concept

After completing a variation investigation, the analyst switches to Narrative mode. The [Investigation Mindmap](investigation-mindmap.md) transforms from a navigation instrument into a storytelling view:

- **The drill path becomes a timeline**: Nodes appear sequentially, left-to-right or top-to-bottom, showing the investigation order. Each step is annotated with what was found: "Step 1: Filtered to Store South — explains 45% of variation. Mean delivery time: 35 min vs. 28 min overall."
- **Key findings at each step**: Each node shows the before/after statistics that the filter revealed — mean shift, Cpk change, variation reduction, or out-of-spec reduction. The numbers tell the story of progressive isolation.
- **Interaction connections**: If the Interaction Mode scan found significant interactions, the narrative shows them as cross-connections between steps: "Store and Time_Slot interact — the Dinner rush effect is 2× worse at Store South than at other stores."
- **Cumulative progress bar**: A running indicator along the timeline shows how much variation was explained at each step, building toward the final total.
- **Conclusion panel**: At the end of the timeline, a summary states the investigation outcome: "Two factors explain 60% of delivery time variation. Recommended actions: (1) Standardize Store South driver routing, (2) Pre-stage Dinner rush orders."
- **Export**: The narrative is exportable as a static image (PNG/SVG), a printable view, or copy-to-clipboard for pasting into slides and reports.

The narrative is not auto-generated prose — it's a structured visual layout of the investigation data that the analyst can optionally annotate with their own notes. VariScout provides the statistical scaffolding; the analyst adds the operational interpretation.

### The Analyst's Workflow

1. Complete an investigation through the normal drill-down workflow (apply filters, examine charts, identify drivers).
2. Open the Investigation Mindmap companion view.
3. Toggle to Narrative mode.
4. The mindmap reorganizes into a linear timeline showing the drill path and findings.
5. Optionally add annotations: "Store South uses contract drivers" or "Dinner rush coincides with shift change."
6. Export or present the narrative to stakeholders.

### What the Narrative Contains

For each drill step:

| Element              | Source                         | Example                  |
| -------------------- | ------------------------------ | ------------------------ |
| Factor name          | Current filter                 | "Store"                  |
| Filtered value(s)    | Filter selection               | "South"                  |
| Variation explained  | η² from `useVariationTracking` | "45% of total variation" |
| Key statistic change | Before/after `calculateStats`  | "Mean: 28 → 35 min"      |
| Capability change    | Before/after Cpk               | "Cpk: 0.8 → 0.4"         |
| Cumulative explained | Running sum                    | "45% → 60% → 63%"        |

For interactions (if detected):

| Element                | Source                               | Example                                          |
| ---------------------- | ------------------------------------ | ------------------------------------------------ |
| Factor pair            | Interaction term from regression     | "Store × Time_Slot"                              |
| Interaction strength   | ΔR² or \|standardized β\|            | "Adds 5% explanatory power"                      |
| Plain-language finding | Generated from coefficient direction | "Dinner rush effect is amplified at Store South" |

## Tensions Addressed

- [When to Stop](../tensions/when-to-stop.md) — **Primary**. The narrative is itself the stopping signal. Constructing a coherent story of the investigation forces the analyst to assess whether the findings are sufficient. If the cumulative explained variation is low or the conclusion panel is weak, the analyst knows to continue investigating. The act of narrativizing the investigation creates a natural stopping point.
- [Path Dependency](../tensions/path-dependency.md) — **Secondary**. The narrative records the specific path taken, making path dependency explicit. The analyst (or a reviewer) can see: "We drilled Store first, then Time_Slot. The investigation explained 60% of variation." A different analyst who drilled Time_Slot first would produce a different narrative with different intermediate numbers but a similar conclusion — making the path-dependent intermediate steps transparent rather than hidden.
- [Discoverability](../tensions/discoverability.md) — **Secondary**. The narrative format shows stakeholders what a variation investigation looks like. For organizations considering VariScout, a sample narrative demonstrates the analytical workflow — this is marketing material as much as an analytical output.

## Philosophy Alignment

- **EDA for process improvement**: Aligned. The narrative is the bridge from exploration to action. EDA produces findings; the narrative communicates them. This closes the loop that most EDA tools leave open — Minitab's Session Window logs commands, not stories; JMP's Journal captures analysis steps but not a narrative arc.
- **Guided frustration pedagogy**: Compatible. The narrative doesn't short-circuit the investigation — it structures the output. The analyst still does the work of drilling, interpreting, and concluding. The narrative mode activates _after_ the investigation, not during it.
- **Four Lenses coordination**: Extends. Each step in the narrative can include a small thumbnail of the Four Lenses state at that point — a mini I-Chart showing the pattern that led to the drill decision, a mini Boxplot showing the factor groups. This creates a visual record of the analytical reasoning.
- **Two Voices**: Positive. The narrative naturally incorporates both voices: "Store South explains 45% of variation (process voice) and reduces Cpk from 0.8 to 0.4 (customer voice)." The combination of η² (process metric) and Cpk (customer metric) in the same timeline makes the Two Voices concept tangible for stakeholders.

## Persona Impact

| Persona         | Effect                  | Why                                                                                                                                                                                                                                                                                                                     |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | **Positive**            | Gary needs investigation documentation for DMAIC project Tollgate reviews. The narrative replaces manual PowerPoint construction — he gets a structured visual record of his investigation that he can annotate and present.                                                                                            |
| Student Sara    | **Neutral to positive** | Sara's investigations are learning exercises, not project deliverables. The narrative is useful for her portfolio or for showing her instructor what she found, but it's not her primary need. She benefits more from the investigation itself.                                                                         |
| OpEx Olivia     | **Strongly positive**   | Olivia presents investigation findings to plant managers and stakeholders weekly. The narrative is exactly what she needs: a visual, structured summary that non-technical stakeholders can follow. "Here's what we found, here's why it matters, here's what to do." This is Olivia's most common workflow bottleneck. |
| Trainer Tina    | **Strongly positive**   | Tina uses the narrative as a teaching walkthrough. She can show students a completed investigation narrative and walk through each step: "See how they started with the biggest factor? See how the Cpk changed? This is what a good investigation looks like." The narrative becomes a case study artifact.            |
| Evaluator Erik  | **Neutral**             | The narrative adds to the feature list but doesn't change Erik's primary evaluation criteria (statistical correctness, usability, pricing). It may help in demos.                                                                                                                                                       |
| Curious Carlos  | **Positive**            | Carlos shares interesting findings with colleagues. A narrative export gives him something shareable — "look what I found in the delivery data" — that communicates the finding without requiring the recipient to use VariScout.                                                                                       |

## Platform Fit

| Platform            | Fit         | Notes                                                                                                                                                                                                                                                                                                        |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PWA (free training) | **Limited** | The PWA is a training tool — investigations are learning exercises, not deliverables. A basic narrative view is useful for learning ("this is what a complete investigation looks like") but export/presentation features are less critical. Consider a read-only narrative view without export for the PWA. |
| Azure (paid team)   | **Primary** | The Azure app serves professional teams who need to communicate findings. The narrative is a high-value feature for Olivia's use case. Full export capabilities (PNG, PDF, copy-to-clipboard) are appropriate for the paid tier. This is a differentiating feature that justifies the Azure subscription.    |
| Excel Add-in        | **N/A**     | The Excel Add-in uses a slicer-based workflow without the drill-down path that the narrative visualizes. Not applicable.                                                                                                                                                                                     |

## Competitive Landscape

No competitor provides a visual investigation narrative. This is a genuine gap in the quality analytics tool space.

- **Minitab**: The Session Window is a chronological text log of commands and results. It captures _what was done_ but not _what was found_ or _why it matters_. Analysts copy results from the Session Window into PowerPoint manually. Minitab Workspace (the companion project management tool) supports structured project documentation but doesn't auto-generate investigation narratives from analysis sessions. See [Minitab Benchmark](../competitive/minitab-benchmark.md).
- **JMP**: The Journal feature captures analysis steps as a clickable log — the analyst can replay their work. But the Journal is a command record, not a story. JMP also supports scripting (JSL) to automate report generation, but this requires programming. There is no visual narrative of the investigation path with annotated findings. See [JMP Benchmark](../competitive/jmp-benchmark.md).
- **Tableau**: Dashboards are presentation-ready by design, but they show the _current state_ of the data, not the _investigation journey_. A Tableau dashboard says "Store South has the highest delivery times" but not "we started with overall data, drilled into Store, found South was the driver, then examined Time_Slot." Tableau Story Points attempt a narrative format but are manually constructed slide sequences, not auto-generated from analytical workflow. See [Tableau Benchmark](../competitive/tableau-benchmark.md).
- **Power BI**: Same limitation as Tableau. Reports show current state. Power BI's Smart Narrative visual auto-generates text descriptions of chart data but describes what's on screen, not how the analyst arrived there. There is no concept of an investigation path. See [Power BI Benchmark](../competitive/powerbi-benchmark.md).
- **EDAScout**: The Socratic Analyst chatbot creates a conversational record of the investigation, but this is a chat transcript, not a structured narrative. Chat transcripts are linear, verbose, and not presentation-ready. See [EDAScout Benchmark](../competitive/edascout-benchmark.md).

The Investigation Narrative would be unique in providing a **structured, visual record** of an analytical investigation that is both auto-generated from the drill-down workflow and presentation-ready for stakeholder communication. This addresses a workflow gap that every quality professional experiences: the "last mile" from finding to presentation.

## Strategic Verdict

**Pursue (Phase 3, after Investigation Mindmap)** — The Investigation Narrative builds directly on the Investigation Mindmap by adding a linear, storytelling layout to the spatial overview. Implementation requires: (1) recording the drill-down path as a sequence of steps with before/after statistics, (2) rendering the sequence as a timeline, (3) supporting annotations and export.

The statistical recording infrastructure (which filters were applied, what the cumulative η² was at each step) can be built incrementally during Phases 1 and 2. By the time the Narrative is implemented in Phase 3, the data it needs will already be collected.

The competitive opportunity is clear: no tool auto-generates visual investigation narratives. The Narrative positions VariScout not just as an analytical tool but as a **communication tool** — helping analysts share their findings, not just discover them. This is particularly valuable for the Azure tier (Olivia's team) and training contexts (Tina's classroom).

The primary risk is scope creep: annotations, export formats, and template customization could expand indefinitely. The recommendation is to start with a read-only timeline view (no annotations, PNG export only) and iterate based on user feedback.

**Export requirement**: The Narrative should support a "slide-ready" export that composites a selected chart (I-Chart, Boxplot, or Pareto) side-by-side with the narrative timeline. This enables: "I-chart on one half showing the pattern, mindmap narrative on the other showing how I got there." Primary personas: OpEx Olivia (weekly stakeholder presentations), Green Belt Gary (DMAIC Tollgate reviews). Note: individual chart copies already include filter context via the FilterContextBar component.
