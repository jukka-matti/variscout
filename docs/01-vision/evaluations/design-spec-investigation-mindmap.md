# Design Spec: Investigation Mindmap

> Authoritative design specification for the Mindmap-first investigation UX. Consolidates four concept documents into a three-layer architecture that replaces the Funnel Panel ecosystem with one spatial view.

---

## 1. Three-Layer Architecture

The investigation UX consolidates into three layers with clear boundaries. No layer depends on the others being visible — each works independently but they compose into a coherent whole.

| Layer                   | Visibility     | Components                                                            | Role                                                                   |
| ----------------------- | -------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Chart Layer**         | Always visible | Boxplot "↓ drill here", Pareto ranking, I-Chart patterns, Stats Panel | Primary workspace — the analyst reads data and acts on it              |
| **Navigation Layer**    | Always visible | FilterBreadcrumb (contribution %), VariationBar (cumulative %)        | Filter state — the analyst sees where they are in the investigation    |
| **Investigation Layer** | On demand      | Investigation Mindmap (slide-out panel or pop-out window)             | Strategic overview — the analyst plans next steps and reviews progress |

### Layer Boundaries

- **Chart Layer** owns the data visualization. Charts accept data via props and render the current filtered view. The Boxplot's "↓ drill here" label (`Boxplot.tsx:389`) is the Chart Layer's only guidance element — it points to the highest-η² bar.
- **Navigation Layer** owns filter state display. FilterBreadcrumb shows active filters with contribution % badges (color-coded: ≥50% green, ≥30% amber, <30% blue). VariationBar shows cumulative explained variation as a horizontal bar. These components exist today and require no changes.
- **Investigation Layer** owns the strategic overview. The Investigation Mindmap replaces the Funnel Panel as the on-demand companion view. It shows all factors spatially, the drill trail, and interaction relationships — information that the Chart and Navigation layers cannot convey because they show one factor at a time.

The three-layer architecture reduces the current PWA from 20+ guidance surfaces to three clearly scoped layers. The analyst knows where to look: charts for data, breadcrumbs for filter state, mindmap for investigation strategy.

---

## 2. Investigation Mindmap — Three Modes

The Mindmap has three switchable modes that share the same node layout but show different information. A mode toggle (segmented control) at the top of the mindmap switches between modes. Nodes stay fixed during transitions; only edges, annotations, and layout direction change.

### Mode Progressive Disclosure

Modes unlock progressively as the investigation progresses. The segmented control always shows all three modes, but unavailable modes are muted with a tooltip explaining the requirement.

| Mode            | Available When                                       | Disabled Reason Tooltip                           |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **Drilldown**   | Always                                               | (never disabled)                                  |
| **Interaction** | 2+ factors in the dataset AND n >= 5 after filtering | "Requires 2+ factors with at least 5 data points" |
| **Narrative**   | 1+ drill applied (at least one filter active)        | "Apply a filter to start building the timeline"   |

This is a mode-level progressive disclosure: the analyst cannot switch to Interaction Mode until the data supports pairwise regression, and cannot switch to Narrative Mode until there is at least one drill step to narrate. The gating prevents empty-state confusion.

### Drilldown Mode

The default mode. Shows the factor landscape and investigation path.

- **Factor nodes**: All categorical factors appear as nodes. Node size is proportional to η² (computed by `getEtaSquared()` in `stats.ts:177` against the current filtered subset). The factor explaining the most remaining variation is the largest node.
- **Node color encodes filter state**:
  - **Active filter** (e.g., Store = South): Solid fill, bright color. The filtered value appears as a label below the node.
  - **Available** (not yet filtered): Outlined, neutral fill. Hovering shows the η² value.
  - **Exhausted** (filtered, negligible remaining η²): Dimmed/grayed. Signals diminishing returns.
- **Drill trail**: A highlighted path connects nodes in drill order (Start → Store → Time_Slot). The path is the visual record of the investigation sequence.
- **Suggested-next node**: The factor with the highest η² among remaining (unfiltered) factors has a pulsing glow or "suggested" badge. This is the spatial equivalent of the Boxplot's "↓ drill here" label.
- **Click node → filter dropdown**: Clicking a node opens a popover listing that factor's category values with their contribution percentages. Selecting a value applies the filter. The main dashboard updates simultaneously.
- **Cumulative progress footer**: A persistent bar at the bottom shows cumulative explained variation (e.g., "58% of variation explained") with a 70% target marker. Source: `useVariationTracking` running sum.

### Interaction Mode

Same factor nodes in the same positions. Edges appear showing interaction relationships.

- **Edges between nodes**: Thickness proportional to interaction strength (ΔR² — the difference in R² between a model with and without the interaction term, computed by running `calculateMultipleRegression()` at `stats.ts:1886` twice).
- **Edge color encodes significance**: Bright/saturated for p < 0.05, muted/translucent for p < 0.10, absent for p ≥ 0.10.
- **Hover edge → tooltip**: Shows ΔR², standardized β, p-value, and a plain-language description (e.g., "Store and Time_Slot interact — the Dinner rush effect is stronger at Store South").
- **Click edge → multi-select**: Selects both connected factors for combined analysis in the Regression Panel.
- **No edges visible** is itself informative: "Your factors don't interact significantly — the sequential drill-down captured the main effects."
- **Computation**: Interaction scan runs on demand when the analyst switches to Interaction Mode (not on data load). For N factors, this is N×(N−1)/2 regression pairs. For the typical 3–5 factor dataset, this is 3–10 pairs — fast enough for interactive use.

### Narrative Mode

The spatial layout reorganizes into a linear timeline for stakeholder communication.

- **Timeline layout**: Nodes appear sequentially (horizontal on desktop, vertical on mobile) in drill order. Each node is a "step" in the investigation story.
- **Step annotations**: Each step shows key findings from that drill point:
  - Factor name and filtered value (e.g., "Step 1: Store = South")
  - Variation explained (η² from `useVariationTracking`)
  - Key statistic change (mean shift, Cpk change from before/after `calculateStats`)
  - Cumulative explained variation at that point
- **Interaction cross-connections**: If significant interactions were detected, they appear as cross-links between timeline steps (e.g., a dashed arc between Store and Time_Slot steps).
- **Cumulative progress**: A running bar along the timeline shows explained variation building at each step.
- **Conclusion panel**: At the end of the timeline, a summary: "Two factors explain 60% of delivery time variation."
- **Export**: PNG/SVG image export. The analyst can paste the image into slides or reports. This is the MVP export format.
- **Annotations**: The analyst can optionally add text notes to each step (e.g., "Store South uses contract drivers"). Annotations are stored locally and included in exports.

### Mode Switch Interaction

| From                    | To                                                         | Transition                                                   |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Drilldown → Interaction | Nodes stay fixed; edges fade in                            | Analyst wants to check factor-pair relationships             |
| Drilldown → Narrative   | Nodes reorganize into timeline; trail becomes the sequence | Analyst is done investigating, wants to communicate findings |
| Interaction → Drilldown | Edges fade out; nodes regain drill-state coloring          | Analyst returns to investigation after checking interactions |
| Interaction → Narrative | Edges fade, nodes reorganize into timeline                 | Analyst wants to include interaction findings in the story   |
| Narrative → Drilldown   | Timeline collapses back to spatial layout                  | Analyst wants to resume investigating                        |

---

## 3. What the Mindmap Replaces

The Funnel Panel ecosystem (`VariationFunnel.tsx` — 965 lines, `FunnelPanel.tsx`, `FunnelWindow.tsx`, `InteractionGuidance.tsx`) currently provides investigation guidance through dense, everything-at-once presentation. The Mindmap replaces this with progressive disclosure.

### Element-by-Element Replacement Map

| Current Funnel Element                        | Location                                        | Mindmap Equivalent                                           | How It Improves                                                               |
| --------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Factor ranking list** (η² bars, sorted)     | `VariationFunnel.tsx:96–123`                    | Node size encodes η² ranking spatially                       | Spatial layout is scannable at a glance; no scrolling through a list          |
| **Factor selection checkboxes**               | `VariationFunnel.tsx:126–129, 288–298`          | Click node → filter dropdown                                 | Direct manipulation replaces checkbox+apply two-step                          |
| **"Highest impact" label + Drill button**     | `VariationFunnel.tsx:635–647`                   | Suggested-next node (pulsing glow)                           | Spatial emphasis is more visible than a text label in a list                  |
| **"Worst" red label**                         | `VariationFunnel.tsx:727–728`                   | Red-tinted category in click-popover; contribution % visible | On-demand detail replaces always-visible label                                |
| **Inline Cpk badge** (improvement projection) | `VariationFunnel.tsx:737–767`                   | Removed — moves to WhatIfSimulator (separate page)           | Cpk projection is a "what if" scenario, not an investigation guidance element |
| **Cumulative explained summary**              | `VariationFunnel.tsx:267–283`                   | Cumulative progress footer in all three modes                | Always visible at bottom of mindmap, not buried in a list header              |
| **Category-level μ/σ/% density table**        | `VariationFunnel.tsx:183–189` (expanded rows)   | Available on hover/click in Drilldown Mode popover           | Progressive disclosure: shown when requested, not always                      |
| **WhatIfSimulator** (embedded)                | `VariationFunnel.tsx:25–28, 139–143`            | Moves to separate page (see Section 4)                       | Separated mental modes: investigation ≠ scenario modeling                     |
| **InteractionGuidance** (text prompt)         | `InteractionGuidance.tsx:26`                    | Interaction Mode replaces text with visual evidence          | Edges show _whether_ interactions exist, not just _that they might_           |
| **Pop-out window sync**                       | `FunnelWindow.tsx` (localStorage + postMessage) | Reused for Mindmap pop-out window                            | Same bidirectional sync pattern, new content                                  |
| **Slide-out panel shell**                     | `FunnelPanel.tsx` (backdrop, escape-to-close)   | Reused for Mindmap slide-out panel                           | Same panel infrastructure, new content                                        |

### What Gets Explicitly Removed

These Funnel elements are not replicated in the Mindmap because they contribute to the density problem:

| Removed Element                                       | Why                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dual checkboxes** (select factor + select category) | The Funnel required selecting which factors to include, then expanding to select categories. The Mindmap shows all factors by default (nodes) and uses click-to-drill for categories. No two-step selection needed.                                                          |
| **Inline Cpk badges** on category rows                | Cpk projection per-category is a scenario modeling feature (what if we removed this category?). This belongs in the WhatIfSimulator, not in the investigation overview.                                                                                                      |
| **Category-level μ/σ/% always-visible density**       | In the Funnel, expanding a factor showed a table of every category with mean, std dev, and % of data. This is useful but dense. The Mindmap's click-popover shows category contribution % (the actionable metric) on demand. Full stats remain available in the Stats Panel. |
| **"Standardize to best" presets**                     | These WhatIfSimulator presets generated from category stats move with the simulator to its own page.                                                                                                                                                                         |
| **Excluded-category tracking**                        | The Funnel allowed checking/unchecking categories to see projected stats. This is WhatIfSimulator territory.                                                                                                                                                                 |

### Net Effect

The Funnel Panel presents ~15 interactive elements per factor row (checkbox, expand button, category checkboxes, drill button, Cpk badge, worst label, μ/σ/% per category). For 3 factors with 3–7 categories each, this is **60–150 interactive elements** in a 320px-wide panel.

The Mindmap presents 3–5 factor nodes with hover tooltips and click-popovers. The default view has **3–5 interactive elements** plus the mode toggle and progress footer. Detail is available on demand, not by default.

---

## 4. WhatIfSimulator as Separate Page

The WhatIfSimulator (`WhatIfSimulator.tsx` — currently embedded in the Funnel Panel and available standalone in Azure) moves to its own page/view, accessible from the Settings menu or a dedicated route.

### Rationale

Investigation and scenario modeling are distinct mental modes:

- **Investigation** (Mindmap): "What is causing the variation?" — exploratory, analytical, drilling into data to identify root causes. The analyst is _reading_ the process.
- **Scenario modeling** (WhatIfSimulator): "What if we fixed it?" — projective, hypothetical, adjusting parameters to estimate improvement. The analyst is _imagining_ a different process.

Embedding the WhatIfSimulator inside the Funnel Panel conflated these modes. The analyst would drill into a factor, see the "worst" category, then immediately see a Cpk projection for removing it — before finishing the investigation. The separate page enforces a natural workflow: investigate first, then model improvements.

### Access Pattern

- **Route**: `/whatif` or equivalent in-app navigation
- **Entry points**: (1) Settings/tools menu, (2) "Model improvements" button at the end of a Narrative Mode timeline, (3) direct link from FilterBreadcrumb context menu
- **Data flow**: The WhatIfSimulator receives the current process statistics (mean, stdDev, Cpk) and spec limits from the DataContext. It does not need the investigation state — it operates on the filtered data as-is.
- **Presets**: The "Exclude worst category" and "Standardize to best" presets (currently generated in `VariationFunnel.tsx:192–265`) move to the WhatIfSimulator page. They are generated from the current filtered data, not from the mindmap state.

---

## 5. Statistical Foundation

The Mindmap's three modes are powered by two statistical engines already present in `@variscout/core`, plus one new infrastructure requirement.

### Existing: η² for Node Sizing and Drill Ranking

`getEtaSquared(data, factor, outcome)` at `stats.ts:177` computes one-way ANOVA eta-squared (η² = SS_between / SS_total). This is the primary metric for:

- **Node size**: Larger η² → larger node. The visual hierarchy directly encodes statistical importance.
- **Suggested-next**: The factor with the highest η² among unfiltered factors gets the pulsing suggestion.
- **Cumulative tracking**: `useVariationTracking` (in `packages/hooks/src/useVariationTracking.ts`) maintains the running cumulative η² that powers the progress footer.

η² values are computed per-factor against the current filtered subset, so they update dynamically as the analyst drills. This is the existing behavior — no changes needed.

### Existing: Regression for Interaction Edges

`calculateMultipleRegression(data, outcome, [factor1, factor2], { includeInteractions: true })` at `stats.ts:1886` computes interaction effects. The returned `CoefficientResult` objects include `standardizedBeta`, `tStatistic`, and `pValue` for each interaction term.

For Interaction Mode edges:

- **Edge thickness**: ΔR² = R²_full − R²_main (run `calculateMultipleRegression` twice — once with `includeInteractions: false`, once with `true`). This is a ~10-line utility function (see [Design Brief §1](design-brief-guided-investigation.md#1-statistical-methodology) for specification).
- **Edge color**: Based on the interaction term's p-value from the full model.
- **Tooltip content**: ΔR², largest |standardized β| among interaction terms, p-value.

### New Infrastructure: Drill-Path Recording

All three Mindmap modes require a recorded sequence of drill steps. This does not exist today — the current filter stack (`useFilterNavigation`) tracks _what_ is filtered but not the _order_ or _statistics at each step_.

The drill-path recording system needs to capture, for each drill step:

| Field                     | Source                                    | Used By                                                         |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Factor name               | Filter action                             | All three modes                                                 |
| Filtered value(s)         | Filter action                             | Drilldown Mode (node labels), Narrative Mode (step annotations) |
| η² at time of drill       | `getEtaSquared()` on pre-drill data       | Narrative Mode (step annotations)                               |
| Cumulative η² after drill | `useVariationTracking`                    | Narrative Mode (progress bar)                                   |
| Mean before/after         | `calculateStats()` on pre/post-drill data | Narrative Mode (statistic change)                               |
| Cpk before/after          | `calculateStats()` on pre/post-drill data | Narrative Mode (capability change)                              |
| Timestamp                 | System clock                              | Narrative Mode (ordering)                                       |

This recording can be built as a new hook (`useDrillPath`) or as an extension to `useFilterNavigation`. The data is ephemeral (session-only) and lightweight (~100 bytes per drill step). Implementation detail is deferred to the coding phase.

---

## 6. Platform Strategy — PWA and Azure Only

The Investigation Mindmap is a **PWA + Azure feature only**. The Excel Add-in has a fundamentally different interaction model (native Excel slicers) and doesn't use the progressive drill-down workflow that the Mindmap visualizes.

### PWA

- **Panel model**: Slide-out panel from the right side, occupying the same slot as the current Funnel Panel. Reuses the `FunnelPanel.tsx` shell (backdrop, escape-to-close, outside-click-to-close).
- **Pop-out window**: Available as an option. Reuses the `FunnelWindow.tsx` bidirectional sync pattern (localStorage + postMessage). The analyst can drag the Mindmap to a second monitor while the main dashboard stays on the primary screen.
- **Modes available**: Drilldown Mode (full), Interaction Mode (full), Narrative Mode (view only — PNG export limited to screenshot).
- **Trigger**: Labelled "Investigation" button (Network icon + text) in the header. Replaces the previous unlabelled icon toggle.
- **First-drill prompt**: A one-time callout (`InvestigationPrompt`) appears when the user applies their first filter, pointing them to the Investigation panel. Dismissed per session via sessionStorage.
- **VariationBar gateway**: The VariationBar accepts an optional `onClick` prop, allowing it to serve as an additional entry point to the Investigation panel.
- **Export**: Copy-to-clipboard, PNG download, and SVG download available in all three modes (Drilldown, Interactions, Narrative).

### Azure

- **Panel model**: Same slide-out panel as PWA.
- **Split-pane option**: On desktop (viewport > 1280px), the Mindmap can open as a persistent side panel alongside the dashboard. This is appropriate for Azure's desktop-oriented professional workflow.
- **Pop-out window**: Same as PWA.
- **Modes available**: All three modes with full functionality.
- **Trigger**: Labelled "Investigation" button (Network icon + text), same as PWA.
- **First-drill prompt**: Same `InvestigationPrompt` callout as PWA (same default color scheme).
- **VariationBar gateway**: Same clickable VariationBar as PWA.
- **Export**: Copy-to-clipboard, PNG download, and SVG download available in all three modes. SVG export is Azure-only. Annotations are saved with the project (OneDrive sync).

### Excel Add-in — Explicitly Excluded

The Excel Add-in uses native Excel slicers for filtering. There is no progressive drill-down workflow, no filter breadcrumbs, no cumulative η² tracking. The Mindmap concept does not apply to the slicer interaction model. The Excel Add-in's investigation workflow is: set slicer values → read chart → adjust slicers. This is fundamentally different from the PWA/Azure drill-down-and-refine workflow.

### Export by Platform

Export (copy-to-clipboard, PNG, SVG) is available in all three modes, not only Narrative.

| Capability             | PWA (free)                               | Azure (paid)                             |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| Export modes           | All (Drilldown, Interactions, Narrative) | All (Drilldown, Interactions, Narrative) |
| Copy to clipboard      | Yes                                      | Yes                                      |
| PNG export             | Yes (high-resolution render)             | Yes (high-resolution render)             |
| SVG export             | No                                       | Yes                                      |
| Annotations            | Session-only (not saved)                 | Saved with project (OneDrive)            |
| Template customization | No                                       | Future (post-MVP)                        |

---

## 7. Progressive Disclosure Design

The Mindmap's core design principle is progressive disclosure — the answer to the Funnel Panel's density problem. The Funnel showed everything simultaneously; the Mindmap shows information in layers activated by user intent.

### Disclosure Levels

| Level                 | Trigger         | What Appears                                                                        | Cognitive Load                          |
| --------------------- | --------------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| **Default view**      | Panel opens     | Factor nodes + drill trail + progress footer                                        | Low — 3–5 nodes, one trail, one bar     |
| **Hover**             | Mouse over node | Factor name, η² value, current filter value (if active)                             | Low — single tooltip                    |
| **Click**             | Click on node   | Popover with category values, contribution % per category, "drill" action per value | Moderate — one factor's detail          |
| **Mode switch**       | Toggle control  | Drilldown ↔ Interaction ↔ Narrative (gated — see below)                             | Moderate — changes the information lens |
| **Interaction hover** | Mouse over edge | ΔR², p-value, plain-language description                                            | Moderate — single interaction detail    |

**Mode-level gating**: Modes themselves are gated by progressive disclosure. Interactions mode requires 2+ factors AND n >= 5 after filtering. Narrative mode requires at least 1 drill applied. Disabled modes appear muted in the segmented control with a tooltip explaining what is needed to unlock them. This prevents the analyst from encountering empty or meaningless views.

### What Is Never Shown Simultaneously

The following information was shown simultaneously in the Funnel Panel and is now gated behind progressive disclosure:

- All category statistics (μ, σ, %) for all factors — only shown for one factor at a time, on click
- Dual checkboxes (factor-level + category-level) — eliminated entirely
- Inline Cpk badges per category — moved to WhatIfSimulator
- "Worst" labels on every category row — replaced by contribution % color-coding in click-popover
- WhatIfSimulator presets — moved to separate page

### Visual Hierarchy

In Drilldown Mode, the visual hierarchy is:

1. **Node size** — the dominant signal. Largest node = most variation explained. Scannable in <1 second.
2. **Node color/fill** — active (filled) vs. available (outlined) vs. exhausted (dimmed). Filter state at a glance.
3. **Drill trail** — the path through the nodes. Investigation history visible as a highlighted line.
4. **Suggested-next pulse** — draws attention to the recommended next factor. Subtle but discoverable.
5. **Progress footer** — cumulative %. Always visible but not competing with the spatial layout.

In Interaction Mode, the hierarchy shifts:

1. **Edge thickness** — the dominant signal. Thickest edge = strongest interaction.
2. **Edge color** — significance encoding. Bright = statistically significant.
3. **Node size** — secondary context (η² for main effects).

In Narrative Mode, the hierarchy is temporal:

1. **Timeline position** — left-to-right sequence of drill steps.
2. **Step annotations** — findings at each step.
3. **Cumulative progress bar** — building total along the timeline.

---

## 8. Demo Walkthrough — Pizza Delivery with Mindmap UX

This walkthrough uses the Pizza Delivery dataset (`packages/data/src/samples/pizza.ts`) — 252 observations, 3 factors (Store, Time_Slot, Day), outcome Delivery_Time_min. It revises the [Investigation Flow Map](investigation-flow-map.md) walkthrough to show the Mindmap-first UX.

### Step 1: Data Loaded

**Chart Layer**: I-Chart shows delivery times with control limits. Boxplot shows Store groups — Store South's box is wider and higher. "↓ drill here" appears on Store South. Pareto ranks out-of-spec frequency by Store.

**Navigation Layer**: No active filters. VariationBar shows 0% explained.

**Investigation Layer (if opened)**: Three factor nodes — Store (large, ~40% η²), Time_Slot (medium, ~20% η²), Day (small, ~3% η²). Store node pulses as suggested-next. No drill trail. Progress footer: "0% explained."

_Compared to Flow Map Step 1_: The Mindmap immediately shows the factor landscape — three nodes with visual hierarchy. The analyst sees that Store dominates before touching anything. Previously, this required opening the hidden Funnel Panel.

### Step 2: Analyst Drills Store South

The analyst clicks the Store node in the Mindmap → popover shows: North (15%), Central (12%), South (45%). Analyst clicks "South" → filter applied.

**Chart Layer**: I-Chart filters to Store South. Boxplot now shows Time_Slot groups. "↓ drill here" on Dinner.

**Navigation Layer**: FilterBreadcrumb shows "Store: South 45%". VariationBar shows ~40%.

**Investigation Layer**: Store node fills solid (active). Trail: Start → Store. Time_Slot node is now the largest remaining (highest η² on filtered data). Time_Slot pulses as suggested-next. Day remains small. Progress footer: "40% explained."

_Compared to Flow Map Step 2_: The analyst can drill from the Mindmap or the Boxplot — both paths are valid. The Mindmap shows Time_Slot as the clear next candidate without requiring the analyst to open the Funnel Panel.

### Step 3: Analyst Drills Time_Slot Dinner

The analyst clicks the Time_Slot node → popover shows: Lunch (8%), Dinner (25%), Late Night (5%). Analyst clicks "Dinner."

**Chart Layer**: I-Chart filters to Store South + Dinner. Boxplot shows Day groups (roughly even).

**Navigation Layer**: Two chips: "Store: South 45%" and "Time_Slot: Dinner 25%". VariationBar shows ~58%.

**Investigation Layer**: Store and Time_Slot nodes filled. Trail: Start → Store → Time_Slot. Day node is small and dimmed (low η², ~3%). No suggestion pulse (remaining factors are weak). Progress footer: "58% explained."

_Compared to Flow Map Step 3_: Previously, the analyst would open the Funnel Panel to see the investigation state. Now the Mindmap shows the same information spatially — two filled nodes, one dimmed, trail visible.

### Step 4: Analyst Checks Interactions

Curious whether Store and Time_Slot interact, the analyst toggles to Interaction Mode.

**Investigation Layer**: Same three nodes. An edge appears between Store and Time_Slot — medium thickness (moderate ΔR²), bright color (p < 0.05). No significant edges for Store–Day or Time_Slot–Day. Hovering the edge: "Store × Time_Slot: ΔR² = 0.05, p = 0.02. The Dinner rush effect is stronger at Store South."

_Compared to Flow Map Steps 4 + 6_: Previously, the analyst saw a text-only InteractionGuidance prompt, then had to navigate to the Regression Panel, configure it, and read coefficient tables. Now the interaction is visible as a single edge — one glance instead of a multi-step workflow.

### Step 5: Analyst Decides to Stop

Back in Drilldown Mode, the analyst sees: 58% explained, Day is dimmed (3% η²), no strong suggestion. The progress footer shows the 70% target marker is ahead but the remaining factors are weak.

The analyst decides the investigation has found the key drivers (Store South + Dinner rush) and toggles to Narrative Mode.

### Step 6: Narrative Mode — Communication

**Investigation Layer**: Timeline appears:

- **Step 1**: Store = South — "Explains 40% of variation. Mean delivery time: 35 min vs. 28 min overall."
- **Step 2**: Time_Slot = Dinner — "Explains 25% of remaining variation. Dinner adds +7 min average."
- **Interaction note**: Dashed arc between steps — "Store × Time_Slot interaction (p = 0.02). Dinner rush at Store South is 2× worse than other stores."
- **Conclusion**: "Two factors explain 58% of delivery time variation. Day has no significant effect."

The analyst adds an annotation to Step 1: "Store South uses contract drivers with less route knowledge." Exports as PNG for the team meeting.

_Compared to Flow Map Step 7_: Previously, the investigation ended without ceremony — no summary, no exportable artifact. Now the Narrative Mode creates a presentation-ready visual story.

---

## 9. Competitive Positioning

No competitor offers a spatial investigation overview. The Investigation Mindmap is a genuine differentiator — and critically, it is a **consolidation** (fewer surfaces, less cognitive load) rather than a feature addition.

### What Competitors Offer

| Competitor   | Factor Exploration                                         | Investigation Overview                       | Presentation Output                   |
| ------------ | ---------------------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| **Minitab**  | Menu-driven ANOVA, stepwise regression. No visual ranking. | Session Window (text log). No spatial view.  | Manual PowerPoint.                    |
| **JMP**      | Effect Summary ranks by LogWorth. Model-first.             | Journal (command replay). No spatial view.   | JMP Journal export.                   |
| **Tableau**  | Sidebar filters, equal-weight checkboxes.                  | Dashboard shows current state, not journey.  | Story Points (manual slide sequence). |
| **Power BI** | Slicer paradigm. Key Influencers auto-ranks.               | Decomposition Tree (enforced top-down tree). | Report export.                        |
| **EDAScout** | Smart Cards, AI chatbot.                                   | Chat transcript (verbose, not visual).       | No export.                            |

See [competitor benchmarks](competitive/) for detailed assessments.

### VariScout's Unique Position

The Mindmap combines three capabilities no competitor has together:

1. **Spatial factor overview** — factors as nodes sized by statistical importance (η²), not a flat list or tree.
2. **Investigation state tracking** — the drill trail shows where the analyst has been, suggested-next shows where to go.
3. **Interaction overlay** — edges show factor-pair relationships without requiring a separate analysis step.

This is achieved through consolidation. The current Funnel Panel has more UI elements than most competitors' entire factor analysis workflow — but those elements are hidden, dense, and PWA-only. The Mindmap surfaces the same statistical insights through a simpler, spatial interface available on both PWA and Azure.

---

## 10. Design Questions for UI/UX Phase

These questions must be resolved during the UI/UX design phase before implementation begins.

### Node Layout

1. **Layout algorithm**: Should nodes use a radial layout (factors arranged in a circle around a center "start" node), a hierarchical layout (top-to-bottom by η² ranking), or force-directed-lite (spring forces with fixed positions after initial layout)? Radial is simplest to implement (static SVG positioning). Hierarchical matches the ranking mental model. Force-directed is most flexible but requires a physics engine.

2. **Node count limit**: With 3–5 factors, any layout works. At 8+ factors (possible in Azure with complex datasets), does the spatial layout become cluttered? Should there be a threshold where the layout switches to a compact list fallback?

### Mode Switch

3. **Discoverability**: How does the analyst discover that Interaction Mode and Narrative Mode exist? Options: (a) segmented control always visible at the top, (b) icon toggle that reveals modes on hover, (c) contextual prompt ("You've drilled 2 factors — check for interactions?"). The segmented control is most discoverable but takes space.

### Click-Popover

4. **Category count limit**: When a factor has 7+ categories (e.g., Day of week), does the click-popover become too long? Should it scroll, paginate, or show only the top N categories by contribution? The Pizza dataset's "Day" factor has 7 levels — a good test case.

### Mobile

5. **Mobile adaptation**: On mobile viewports (<768px), should the Mindmap open as a full-screen overlay (replacing the dashboard temporarily) or remain a slide-out panel? The current FunnelPanel uses a 320px slide-out which leaves no space for chart interaction. Full-screen mode gives the Mindmap room but breaks the "mindmap beside charts" spatial memory.

### Export

6. **Narrative export MVP**: Is PNG-only sufficient for the first release? SVG would allow lossless scaling but is less familiar to users. Should copy-to-clipboard (as image) be prioritized over file-save for the "paste into slides" workflow?

---

## 11. Design Thinking History

This spec consolidates four concept documents written during the design exploration phase. Each contributed specific ideas that are now incorporated into the Mindmap-first architecture.

| Document                                                       | What It Contributed                                                                                                                                                                                                                                                         | Status                                                                                                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Design Brief](design-brief-guided-investigation.md)           | Statistical methodology (η² for drill ranking, regression for interactions, ΔR² helper specification). UI audit of 10+ existing guidance elements. Competitive design principles (rank by importance, make suggestions optional, integrate into flow). 10 design questions. | Historical — statistical methodology and competitive principles are canonical references. Design questions revised into Section 10.                                                                                          |
| [Investigation Flow Map](investigation-flow-map.md)            | 7-step Pizza Delivery walkthrough documenting existing guidance at each step and identifying gaps. Guidance coverage table mapping existing elements to Phase 1/2/3 features.                                                                                               | Historical — the "before" state. The Section 8 walkthrough is the "after" state showing the Mindmap-first UX at each step.                                                                                                   |
| [Investigation Mindmap](patterns/investigation-mindmap.md)     | Two-mode concept (Drilldown + Interaction). Node sizing by η², color by filter state. Suggested-next pulsing. Click-to-filter. Pop-out window model. Competitive landscape (no competitor has spatial investigation overview). Persona impact assessment.                   | **Elevated to primary** — the two-mode concept is expanded to three modes (adding Narrative). The Investigation Mindmap pattern evaluation is the conceptual ancestor of this spec.                                          |
| [Investigation Narrative](patterns/investigation-narrative.md) | Timeline concept with step annotations and cumulative progress. Export for stakeholder presentations. Persona impact (strongly positive for Olivia, Tina). Platform fit (Azure primary, PWA limited).                                                                       | **Absorbed as Mindmap's third mode** — the Narrative becomes a mode within the Mindmap rather than a separate component. This simplifies the architecture (one component, three views) and leverages the shared node layout. |

The four documents are kept in `docs/01-vision/evaluations/` as historical design thinking. They should not be used as implementation references — this spec is the authoritative source for the Mindmap UX.

---

## 12. Implementation Phasing

The Mindmap ships mode-by-mode. Each phase is self-contained and shippable; each builds on the previous phase's infrastructure.

### Phase A: Infrastructure + Drilldown Mode

Ships first. Replaces the Funnel Panel with a spatial investigation view.

**New infrastructure:**

| Component             | Scope                                                                                                         | Estimate       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- |
| `useDrillPath` hook   | Records drill steps with before/after stats (factor, filtered value, η², cumulative η², mean, Cpk, timestamp) | ~100 lines     |
| Mindmap SVG component | Static radial or hierarchical layout of factor nodes                                                          | ~300–500 lines |

**Drilldown Mode features:**

- **Node rendering**: Size proportional to η² (via `getEtaSquared()`), color by filter state (active/available/exhausted), factor labels
- **Drill trail**: Highlighted path through nodes in drill order (Start → Store → Time_Slot)
- **Suggested-next**: Pulsing glow on the highest-η² remaining node
- **Click-popover**: Category values with contribution %, drill action per value
- **Cumulative progress footer**: Running η² bar with 70% target marker

**Reuses existing infrastructure:**

- `FunnelPanel.tsx` shell (slide-out, backdrop, escape-to-close) → `MindmapPanel.tsx`
- `FunnelWindow.tsx` sync pattern (localStorage + postMessage) → `MindmapWindow.tsx`
- `useVariationTracking` (η² data, cumulative tracking)
- `getEtaSquared()` (node sizing)

**Replaces:** Funnel icon in the header opens the Mindmap instead of the Funnel Panel. The Funnel Panel remains in the codebase until the Mindmap is validated, then is removed.

### Phase B: Interaction Mode

Adds edge rendering to the existing node layout. Requires Phase A's nodes and SVG component.

**New infrastructure:**

| Component                         | Scope                                                                                              | Estimate  |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| `getInteractionStrength()` helper | Utility in `@variscout/core`: ΔR² = R²_full − R²_main (runs `calculateMultipleRegression()` twice) | ~10 lines |

**Interaction Mode features:**

- **Edge rendering**: SVG paths between factor nodes, thickness proportional to ΔR², color by p-value (bright for p < 0.05, muted for p < 0.10, absent for p ≥ 0.10)
- **Edge tooltips**: ΔR², standardized β, p-value, plain-language description
- **Mode toggle**: Segmented control at top of Mindmap (Drilldown / Interaction)

**Reuses:**

- `calculateMultipleRegression()` with `includeInteractions: true/false` (existing in `stats.ts:1886`)
- Phase A's node layout, SVG component, and panel shell

### Phase C: Narrative Mode + WhatIfSimulator Separation

Adds timeline layout and export. Requires Phase A's drill trail data and Phase B's edge data for interaction cross-connections.

**New infrastructure:**

| Component                       | Scope                                                                   |
| ------------------------------- | ----------------------------------------------------------------------- |
| Timeline layout                 | Reorganize nodes into horizontal (desktop) / vertical (mobile) sequence |
| Step annotations                | η², mean shift, Cpk change per step from `useDrillPath` recorded data   |
| Interaction cross-connections   | Dashed arcs between timeline steps from Phase B edge data               |
| Conclusion panel                | Summary text generated from drill-path statistics                       |
| PNG export                      | Canvas/SVG-to-PNG rendering for stakeholder presentations               |
| WhatIfSimulator standalone page | New route `/whatif`, presets migrated from `VariationFunnel.tsx`        |

**Mode toggle expands** to three segments (Drilldown / Interaction / Narrative).

### Phase D: Polish + Azure Enhancements

Platform-specific refinements. No new modes.

- **Azure split-pane option**: Persistent side panel alongside dashboard on viewport > 1280px
- **Annotations**: Text input per timeline step (Azure: saved to OneDrive with project; PWA: session-only)
- **SVG export**: Azure only (lossless scaling for team presentations)
- **"Model improvements" button**: At end of Narrative timeline → links to WhatIfSimulator at `/whatif`

### Phase Dependencies

```
Phase A (Drilldown Mode)
  └─→ Phase B (Interaction Mode)  — needs A's nodes + SVG component
        └─→ Phase C (Narrative Mode) — needs A's drill trail + B's edges
              └─→ Phase D (Polish)     — needs all three modes complete
```

### What This Phasing Subsumes

The original evaluations index proposed a four-phase sequence (Factor Suggestion → Interaction Heatmap → Investigation Mindmap → Factor Map). The Mindmap-first architecture consolidates this:

- **Factor Suggestion** (old Phase 1) is subsumed by the suggested-next node in Drilldown Mode (Phase A). The pulsing glow on the highest-η² node provides the same guidance without a separate feature.
- **Interaction Heatmap** (old Phase 2) is subsumed by Interaction Mode edges (Phase B). Visual edges between nodes replace the standalone heatmap component.
- **Factor Map** (old Phase 4) is no longer needed. The Mindmap _is_ a lighter-weight Factor Map with three focused modes instead of one dense visualization.

The Mindmap consolidates rather than adding surfaces.

---

## Related Documents

- [Design Brief](design-brief-guided-investigation.md) — Statistical methodology, UI audit, competitive principles
- [Investigation Flow Map](investigation-flow-map.md) — 7-step walkthrough (pre-Mindmap UX)
- [Investigation Mindmap](patterns/investigation-mindmap.md) — Original two-mode concept evaluation
- [Investigation Narrative](patterns/investigation-narrative.md) — Original timeline/export concept evaluation
- [Evaluations Index](index.md) — Summary matrix of all tensions and patterns
- [Feature Parity](../../08-products/feature-parity.md) — Platform feature availability matrix
