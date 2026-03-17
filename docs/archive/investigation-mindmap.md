---
title: 'Investigation Mindmap'
---

# HISTORICAL ONLY — Mindmap replaced by Findings system (Feb 2026)

# Investigation Mindmap

> A two-mode companion visualization — drilldown overview and interaction view — that opens on demand in a separate window or panel, showing the investigation state as an interactive node-link diagram.

## The Concept

A mindmap-style visualization where categorical factors are displayed as nodes arranged radially or hierarchically from a central "start" node. The visualization has two switchable modes — **Drilldown Mode** and **Interaction Mode** — that show different aspects of the same factor landscape using the same spatial layout.

The mindmap opens on demand as a companion view (pop-out window, split pane, or overlay) and stays synchronized with the main dashboard. It provides a persistent spatial overview of the investigation state — something the current drill-down workflow lacks because the Four Lenses show one factor at a time while the Funnel Panel is hidden by default.

This concept refines and concretizes the [Factor Map](factor-map.md) pattern (currently "Defer") into a lighter-weight, two-mode design that is more immediately implementable.

### Drilldown Mode

In Drilldown Mode, the mindmap shows the investigation path and remaining factors:

- **All categorical factors** appear as nodes, sized proportionally to their η² (the factor explaining the most variation is the largest node).
- **Node fill/color** encodes filter state:
  - **Active filter** (e.g., Store = South): Solid fill, bright color. The filtered value appears as a label inside or below the node.
  - **Available** (not yet filtered): Outlined, neutral. Hovering previews the η² value.
  - **Exhausted** (filtered but with negligible remaining η²): Dimmed/grayed.
- **Drill path trail**: A highlighted path connects the nodes in drill order (Start → Store → Time_Slot), showing the investigation sequence.
- **Suggested next node**: The factor with the highest η² among remaining (unfiltered) factors has a visual emphasis — a glow, pulse, or "suggested" badge. This mirrors the Phase 1 Factor Suggestion chip but in spatial form.
- **Clicking a node** opens a mini-dropdown of that factor's values (like clicking a Boxplot bar) and applies the filter. The main dashboard updates simultaneously.
- **Cumulative indicator**: The center node or a persistent footer shows cumulative explained variation (e.g., "58% explained").

### Interaction Mode

Switching to Interaction Mode keeps the same factor nodes in the same positions but overlays interaction information:

- **Connections between nodes** appear as edges, with thickness proportional to interaction strength (ΔR² or |standardized β| from `calculateMultipleRegression`).
- **Edge color** encodes significance: bright (p < 0.05), muted (p < 0.10), absent (p ≥ 0.10).
- **Hovering an edge** shows a tooltip with the interaction details: ΔR², standardized β, p-value, and a plain-language description ("Store and Time_Slot interact — the Dinner rush effect is stronger at Store South").
- **Clicking an edge** selects both connected factors for combined analysis — equivalent to multi-selecting two factors in the Boxplot or Funnel Panel.
- **No edges visible** is itself informative: "Your factors don't interact significantly — the sequential drill-down captured the main effects correctly."

The Interaction Mode data comes from running `calculateMultipleRegression` with `includeInteractions: true` on all factor pairs. For 3 factors this is 3 pairs; for 5 factors it's 10 pairs. The scan runs on demand when the analyst switches to Interaction Mode (not on data load) to avoid unnecessary computation.

### Relationship to Factor Map

The [Factor Map](factor-map.md) pattern (verdict: Defer) envisioned a comprehensive network visualization with force-directed layout, sub-nodes for factor values, and edge thickness for interaction strength. The Investigation Mindmap is a **lighter-weight realization** of the same concept:

| Factor Map (Deferred)                | Investigation Mindmap (This Concept)                    |
| ------------------------------------ | ------------------------------------------------------- |
| Force-directed physics layout        | Fixed radial/hierarchical layout (simpler, more stable) |
| Sub-nodes for every factor value     | Values shown in tooltips/dropdowns on click             |
| Always-visible in the dashboard      | Companion view opened on demand                         |
| Shows all information simultaneously | Two distinct modes (drilldown / interaction)            |
| Requires d3-force physics engine     | Can be built with static SVG positioning                |

The mindmap trades the Factor Map's visual density for simplicity and implementability. It can be built without a physics engine and with a fraction of the interaction design work, while still addressing the same core tensions.

## Tensions Addressed

- [Hierarchy Assumption](../tensions/hierarchy-assumption.md) — **Primary**. Interaction Mode makes factor-pair relationships visible without requiring the analyst to navigate to the Regression Panel. The mindmap shows when the one-factor-at-a-time assumption breaks down.
- [Discoverability](../tensions/discoverability.md) — **Secondary**. The spatial overview provides an alternative entry point to the investigation. New users can see the factor landscape at a glance rather than inferring it from the Boxplot.
- [Factor Ordering](../tensions/factor-ordering.md) — **Primary**. Node size encodes η², making the "which factor next?" decision visual and intuitive. The suggested-next node provides explicit guidance.
- [Path Dependency](../tensions/path-dependency.md) — **Secondary**. The spatial layout shows all factors simultaneously. The analyst can see that the drill path is one trail through the landscape, not the only possible route. Switching to Interaction Mode may reveal that a different path (following a strong interaction) would have been equally valid.
- [Mobile Screen Budget](../tensions/mobile-screen-budget.md) — **Improves**. Opening the mindmap in a companion view (pop-out or split pane) separates the investigation overview from the chart space. On mobile, the mindmap could be a full-screen mode that the analyst toggles.

## Philosophy Alignment

- **EDA for process improvement**: Strongly aligned. The mindmap is a spatial visualization of the factor landscape — the analyst reads patterns from node size, color, and connections to guide their investigation. It extends the "show the shape of the data" principle from individual charts to the meta-level investigation structure.
- **Guided frustration pedagogy**: Compatible. The mindmap presents the landscape but doesn't solve the investigation. The analyst still decides where to drill, interprets what they find, and draws conclusions. The spatial overview adds context without providing answers. The "suggested next" node is a hint, not a directive.
- **Four Lenses coordination**: Extends. The Four Lenses (I-Chart, Boxplot, Pareto, Stats) show the current filter state. The mindmap shows the investigation state — where the analyst has been, where they might go next, and how factors relate to each other. It's a navigation map for the Four Lenses.
- **Two Voices**: Neutral to positive. Drilldown Mode is entirely process-voice (η² is a process metric). Interaction Mode could incorporate customer-voice by encoding Cpk changes on interaction edges: "Store × Time_Slot interaction reduces Cpk from 1.2 to 0.6 — this interaction matters for customer outcomes."

## Persona Impact

| Persona         | Effect                | Why                                                                                                                                                                                                                                                                   |
| --------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | **Positive**          | Gary gains a spatial overview of the factor landscape that matches his mental model of process factors as an interconnected system. The mindmap makes his investigation explicit and reviewable — useful for project documentation and Tollgate reviews.              |
| Student Sara    | **Strongly positive** | Sara learns by seeing the whole picture. The mindmap shows "the shape of the problem" visually — big nodes mean important factors, bright connections mean interactions. The drill trail shows her investigation history, making the learning process visible.        |
| OpEx Olivia     | **Positive**          | Olivia can use the mindmap to standardize investigation approaches across her team. The visual record of drill paths helps in team reviews. Interaction Mode surfaces patterns that sequential analysis might miss, improving analysis thoroughness.                  |
| Trainer Tina    | **Strongly positive** | Tina can project the mindmap during training: "See these three nodes? Store is the biggest — that's where we start. Now see this connection between Store and Time_Slot? Let's explore that." The mindmap is a teaching canvas that shows the investigation strategy. |
| Evaluator Erik  | **Positive**          | The mindmap is a differentiating feature. No competitor offers a spatial investigation overview. Erik can point to it as a unique capability in competitive comparisons.                                                                                              |
| Curious Carlos  | **Positive**          | Carlos finds spatial, interactive visualizations engaging. The mindmap invites clicking and exploring — nodes respond to hover, connections glow, the drill trail animates. This matches Carlos's curiosity-driven approach.                                          |

## Platform Fit

| Platform            | Fit      | Notes                                                                                                                                                                                                                                                                                    |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA (free training) | **Good** | Excellent teaching tool. The pop-out window model already exists (`FunnelWindow.tsx`). SVG rendering works well in all browsers. The spatial overview complements the PWA's educational mission.                                                                                         |
| Azure (paid team)   | **Good** | Professional teams benefit from the investigation overview. The split-pane model (mindmap beside the dashboard) is more appropriate for Azure's desktop-oriented workflow than a pop-out window. Interaction Mode is particularly valuable for team investigations of complex processes. |
| Excel Add-in        | **N/A**  | The Excel Add-in uses native slicers for filtering, not the drill-down workflow. The mindmap concept doesn't apply to the slicer interaction model.                                                                                                                                      |

## Competitive Landscape

No competitor offers a spatial investigation overview for variation analysis. This is a genuine differentiator.

- **JMP**: Graph Builder is chart-centric (scatterplots, histograms). The Scatterplot Matrix shows pairwise variable relationships in a grid layout, but it's a chart grid, not an interactive node-link diagram showing investigation state. There is no concept of visualizing the investigation path or factor relationships as a network. See [JMP Benchmark](../competitive/jmp-benchmark.md).
- **Minitab**: No spatial overview. Minitab's navigation model is menu-and-dialog — the analyst runs analyses and reviews results in the Session Window (text log) and Graph window (individual charts). Multi-vari charts show factor level combinations but in a chart format, not a spatial map. See [Minitab Benchmark](../competitive/minitab-benchmark.md).
- **Tableau**: Network visualizations require third-party extensions and are designed for social networks or dependency mapping, not statistical factor analysis. There is no integration with filter state or SPC calculations. See [Tableau Benchmark](../competitive/tableau-benchmark.md).
- **Power BI**: No spatial factor overview. Decomposition Tree visual allows hierarchical drill-down but is tree-structured (enforced top-down), not a free-form spatial map where the analyst can see interactions and choose their own path. See [Power BI Benchmark](../competitive/powerbi-benchmark.md).
- **EDAScout**: Uses a Smart Card carousel and AI chatbot for factor exploration. No spatial visualization of the factor landscape or interaction network. The investigation state is tracked conversationally, not visually. See [EDAScout Benchmark](../competitive/edascout-benchmark.md).

The Investigation Mindmap would position VariScout as the only tool that provides a spatial, interactive overview of the investigation state — combining factor importance (node size), investigation progress (drill trail), and factor interactions (edge thickness) in a single synchronized view.

## Two-Mode Design

The two-mode design is deliberate. Showing drilldown state and interaction information simultaneously would overload the visualization (the [Factor Map](factor-map.md) evaluation noted this as a complexity risk). Splitting into two modes lets each mode have a clear visual hierarchy:

- **Drilldown Mode**: Node size + color is the primary signal. Edges are hidden. The analyst focuses on "where am I, where should I go next?"
- **Interaction Mode**: Edge thickness + color is the primary signal. Node size is secondary. The analyst focuses on "which factors interact, and how strongly?"

A mode toggle (two buttons or a switch) at the top of the mindmap switches between modes. The transition animates the edges appearing/disappearing while nodes stay fixed, reinforcing that the same factors are being viewed through a different lens.

## Window Model

The mindmap opens as a **companion view** rather than replacing the main dashboard. Three implementation options:

| Model                  | Pros                                                                                | Cons                                                          | Best For                       |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ |
| **Pop-out window**     | Independent sizing, works alongside full dashboard, precedent exists (FunnelWindow) | Window management overhead, may be blocked by pop-up blockers | PWA (matches existing pattern) |
| **Split pane**         | Always visible alongside charts, no window management                               | Reduces chart space, needs responsive breakpoints             | Azure (desktop-oriented)       |
| **Full-screen toggle** | Maximum space for the mindmap, clean transition                                     | Hides the charts while viewing the mindmap                    | Mobile, presentations          |

The recommended approach: **pop-out window as default** (reusing the `FunnelWindow.tsx` pattern), with **split pane as an Azure enhancement**. The mindmap window receives filter change events from the main dashboard and sends filter apply events back — the same bidirectional sync pattern that the FunnelWindow already implements.

## Strategic Verdict

**Pursue (Phase 3)** — The Investigation Mindmap addresses four of six tensions with a lighter-weight approach than the full Factor Map. It builds directly on Phase 1 (Factor Suggestion provides the η² ranking) and Phase 2 (Interaction Heatmap provides the interaction data) by combining both into a spatial view. The implementation complexity is moderate — static SVG layout, no physics engine, reuse of existing window/sync patterns. The competitive differentiation is strong: no tool offers this. The primary risk is user education (analysts unfamiliar with node-link diagrams may need onboarding), mitigated by the familiar click-to-filter interaction pattern.

Build Factor Suggestion and Interaction Heatmap first. The mindmap adds spatial context to the guidance these features provide. Without the underlying η² suggestions and interaction data, the mindmap is just a pretty picture; with them, it's a navigation instrument.
