---
title: 'Investigation Flow Map: Pizza Delivery'
audience: [business, product]
category: strategy
status: reference
---

# Investigation Flow Map: Pizza Delivery

> **Historical document** — describes the pre-Mindmap investigation flow using FunnelPanel.
> See design-spec-investigation-mindmap.md for the archived design spec (replaced by Findings system, Feb 2026).

> A step-by-step walkthrough of a complete variation investigation using the Pizza Delivery dataset, documenting what exists at each step, what guidance the analyst receives, and where enhanced/new elements would improve the flow.

---

## Dataset: Pizza Delivery

- **Source**: `packages/data/src/samples/pizza.ts`
- **Outcome**: `Delivery_Time_min` (target: 30 min, USL: 45 min)
- **Factors**: Store (3 levels: North, Central, South), Time_Slot (3: Lunch, Dinner, Late Night), Day (7: Mon–Sun)
- **Data generation**: Store South has higher base mean (35 vs 28) and more variance (σ=8 vs σ=4). Dinner rush adds +5 min. Late Night subtracts −3 min. 252 observations (4 weeks × 7 days × 3 stores × 3 time slots).
- **Expected η² hierarchy**: Store dominates (large mean shift + variance difference), Time_Slot moderate (rush penalty), Day weak (no systematic effect in generation code).

---

## Step 1: Data Loaded — Dashboard Shows Four Lenses

The analyst loads the Pizza Delivery sample. The Dashboard renders the Four Lenses: I-Chart, Boxplot, Pareto, and Stats Panel.

**What the analyst sees:**

- **I-Chart**: Individual delivery times plotted sequentially. Control limits (UCL/LCL) calculated from overall data. Some points above UCL, concentrated where Store South + Dinner overlap.
- **Boxplot**: Three groups for the first factor (Store). Store South's box is wider and shifted higher than North and Central. The whiskers extend further.
- **Pareto**: Ranked bar chart of out-of-spec frequency by Store.
- **Stats Panel**: Overall mean, std dev, Cp/Cpk against the 45-min USL and 30-min target.

**Existing guidance at this step:**

- Boxplot shows **"↓ drill here"** in red text on the Store South bar (highest η²). (`Boxplot.tsx:389`)
- No other suggestions visible unless the analyst opens the Funnel Panel.

**Gap — no "start here" for first-time users:**
The Boxplot label says "↓ drill here" but doesn't explain _why_ Store South is highlighted or what drilling means. A first-time user (Student Sara) sees a red label but may not understand it as an invitation to filter. There is no onboarding prompt, no "Your data has 3 factors — Store explains the most variation. Click a bar to investigate" message.

**What the Investigation Mindmap would show:**
Three factor nodes (Store, Time_Slot, Day) sized by η². Store is the largest node. No drill path yet. If interactions are pre-scanned, faint connections between Store–Time_Slot (potential rush interaction) and Store–Day (probably negligible).

**What competitors' users would do differently:**

- _Minitab_: Choose Stat → ANOVA → One-Way from the menu, type in "Store" as the factor. No visual prompt.
- _JMP_: Drag Delivery_Time onto Y and Store onto X in Graph Builder. No guidance on which variable to start with.
- _Tableau_: Drag Store onto the filter shelf. No statistical ranking of factors.
- _Power BI_: Add Store to a slicer. Or use Key Influencers, which would auto-rank factors but as a separate visual.

---

## Step 2: Analyst Clicks Store South — First Drill

The analyst clicks the Store South bar in the Boxplot (or selects Store = Store South from a dropdown). The dashboard filters to only Store South data.

**What the analyst sees:**

- **I-Chart**: Only Store South delivery times. The pattern is noisier (σ=8). Some high values clustered during Dinner time slots.
- **Boxplot**: Now shows Time_Slot groups within Store South. Dinner bar is tallest/widest. Lunch is tightest.
- **Pareto**: Ranked by Time_Slot within Store South.
- **Stats Panel**: Store South statistics (mean ~35, higher std dev).
- **FilterBreadcrumb**: A chip appears: **"Store: South (n=60)"** — showing the sample count for the filtered subset.

**Existing guidance at this step:**

- FilterBreadcrumb shows n=X badge on the Store chip. (`FilterBreadcrumb.tsx:272–297`)
- Boxplot shows **"↓ drill here"** on the Dinner bar (highest η² among Time_Slot levels within the filtered data).

**Gap — no "suggested next factor" after first drill:**
The analyst sees the n=X count on the active filter and the "↓ drill here" on the next Boxplot. But there's no explicit prompt like "Time_Slot explains 25% of remaining variation — try this next." The analyst must infer from the Boxplot label that Dinner is worth investigating.

**What the Investigation Mindmap would show:**
Store node is highlighted/filled (active filter). A trail leads from the center (start) to Store. Time_Slot and Day nodes are outlined (available). Time_Slot is larger than Day (higher η² on remaining data). The "suggested next" node (Time_Slot) pulses gently.

---

## Step 3: Analyst Opens Funnel Panel

Curious about the investigation state, the analyst clicks the funnel icon in the header to open the Variation Funnel slide-out panel.

**What the analyst sees:**

- **Factor ranking**: Store (η² ~0.40), Time_Slot (η² ~0.20), Day (η² ~0.03). Visual bars show relative importance.
- **"Highest impact" labels**: Store South highlighted as the best value for Store. Dinner highlighted for Time_Slot.
- **"Worst" labels**: Store South marked with a red "worst" label (highest contribution to variation >20%). Dinner similarly marked for Time_Slot.
- **Cumulative bar**: Shows ~40% explained so far (Store filter only).
- **Inline Cpk badge**: On the Store South "worst" row, a badge shows what the Cpk would improve to if Store South's variation matched the other stores.
- **Drill buttons**: Each factor row has a "Drill →" button next to the highest-impact value.

**Existing guidance at this step:**
This is the richest guidance view in VariScout. Factor ranking, worst labels, Cpk badges, cumulative tracking, and drill actions are all present. (`VariationFunnel.tsx:96–767`)

**Gap — the Funnel is hidden:**
All this guidance requires the analyst to explicitly open the Funnel Panel. A first-time user who doesn't know the funnel icon exists will never see the factor ranking, cumulative tracking, or Cpk badges. The Funnel Panel is a slide-out overlay — it covers the charts, so the analyst can't see the guidance and the data simultaneously.

**What competitors' users would do differently:**

- _Minitab_: No equivalent to the Funnel Panel. The analyst would run separate ANOVA analyses and compare p-values manually.
- _JMP_: Effect Summary in Fit Model shows a ranked bar chart of effects, but only after fitting a model with all terms specified.
- _Power BI_: Key Influencers visual auto-ranks factors, but it's a separate visual on the report canvas, not integrated with the filtering workflow.

---

## Step 4: Analyst Drills into Time_Slot — Second Drill

The analyst clicks Dinner in the Boxplot (or uses the "Drill →" button in the Funnel for Time_Slot = Dinner).

**What the analyst sees:**

- **I-Chart**: Store South, Dinner only. Tighter distribution (noise from non-Dinner slots removed).
- **Boxplot**: Now shows Day groups within Store South + Dinner. Bars are relatively even (Day has low η²).
- **FilterBreadcrumb**: Two chips: **"Store: South (n=60)"** and **"Time_Slot: Dinner (n=20)"**. The sample counts show the filtered subset size at each drill level.
- **Stats Panel**: Filtered statistics for Store South × Dinner.

**Existing guidance at this step:**

- Two n=X badges in the FilterBreadcrumb.
- Boxplot "↓ drill here" on the highest-η² Day bar (likely weak signal).
- **InteractionGuidance appears**: With 2+ factors in the drill stack, the `InteractionGuidance` component renders: "When factors interact (e.g., Store × Time_Slot), use the Regression Panel with 'Include interactions'." (`InteractionGuidance.tsx:26`)

**Gap — interaction guidance is text-only:**
The InteractionGuidance component tells the analyst that interactions _might_ exist and where to check. But it doesn't show whether Store × Time_Slot actually interacts in this data. The analyst has to navigate to the Regression Panel, configure it with both factors, enable interactions, and read the results. This is exactly the "separate seeing from acting" anti-pattern.

**What the Interaction Heatmap would show (Phase 2):**
A compact 3×3 matrix (Store × Time_Slot × Day) with cells colored by interaction strength. The Store × Time_Slot cell might glow warm (moderate interaction — Store South's Dinner rush penalty is larger than other stores'). Store × Day and Time_Slot × Day cells would be cool/neutral (no interaction in the data generation). The heatmap would replace the text-only InteractionGuidance with visual evidence.

**What the Investigation Mindmap would show:**
Store and Time_Slot nodes are both filled (active filters). The drill trail runs Start → Store → Time_Slot. Day node is outlined but small (low η²). If the heatmap data is synced, the Store–Time_Slot edge glows to show the interaction. The analyst can see that the remaining factor (Day) is weak — a visual signal that further drilling has diminishing returns.

---

## Step 5: Analyst Considers Day — Diminishing Returns

The Boxplot shows Day bars that are roughly similar in height and position. The "↓ drill here" label is present but the η² is low (~0.03).

**What the analyst sees:**

- Relatively even Boxplot bars across Day groups.
- The Funnel Panel (if open) shows Day with a small bar and ~3% η².
- Cumulative explained variation is ~55–60% without Day.

**Existing guidance at this step:**

- Boxplot label still shows "↓ drill here" on the highest Day bar, even though the effect is tiny. The label doesn't distinguish between "you should definitely drill here" and "this is the best of a weak set."
- The Funnel Panel's cumulative bar shows the investigation is past the 50% mark but hasn't reached the 70% target.
- No explicit "Day is weak — you might want to stop" prompt.

**Gap — no stopping signal in the main view:**
The cumulative target (70%) lives only in the Funnel Panel. In the main dashboard, there's no visual signal that the investigation has reached a "good enough" point or that further drilling into Day would yield diminishing returns. The Boxplot "↓ drill here" label treats all factors equally — it doesn't convey "this is a weak suggestion."

**What a Factor Suggestion enhancement would do (Phase 1):**
A suggestion chip near the Boxplot would read: "Day explains ~3% of remaining variation. Consider stopping — you've explained 58% so far." Or simply: the suggestion chip would use muted styling (gray instead of blue) to signal that the recommendation is weak. This distinguishes a strong "drill here" from a weak "you could drill here, but..."

---

## Step 6: Analyst Checks Interactions via Regression Panel

Following the InteractionGuidance prompt (or curiosity), the analyst navigates to the Regression Panel and selects Store and Time_Slot as predictors with "Include interactions" enabled.

**What the analyst sees:**

- Regression results with main effects (Store levels, Time_Slot levels) and interaction terms (Store × Time_Slot pairs).
- R² for the main-effects-only model vs. the full model with interactions.
- Individual coefficient p-values and standardized betas.
- If the Pizza data has a meaningful Store × Time_Slot interaction, the interaction term's coefficient would be significant and the ΔR² would be noticeable.

**Existing guidance at this step:**

- The Regression Panel displays results clearly, with significant terms highlighted.
- No explicit summary like "interactions add 5% explanatory power" or "Store × Time_Slot is the strongest interaction."

**Gap — results require interpretation:**
The regression output is a table of coefficients. The analyst must compare R² values mentally and scan the interaction terms to find significant ones. There is no visual summary (like the heatmap) and no ranking of interaction importance. For Green Belt Gary this is manageable; for Student Sara it's a barrier.

**What the Interaction Heatmap would provide (Phase 2):**
The heatmap would pre-compute and visualize exactly this information: ΔR² for each factor pair, displayed as colored cells. The analyst wouldn't need to configure a regression — the heatmap would surface the "Store × Time_Slot interaction is moderate" finding proactively.

---

## Step 7: Investigation Complete — Stopping Point

The analyst has identified Store (specifically Store South) and Time_Slot (specifically Dinner rush) as the primary drivers of delivery time variation. Together they explain ~60% of variation. Day is negligible.

**What the analyst sees:**

- FilterBreadcrumb with two active filters and their contribution percentages.
- If the Funnel Panel is open: cumulative bar at ~60%, short of the 70% target.
- Stats Panel showing the filtered (Store South × Dinner) statistics vs. the overall statistics.

**Existing guidance at this step:**

- The Funnel Panel's cumulative bar turns green at 70%. At 60%, it's still amber.
- No explicit "investigation complete" or "you've found enough" prompt.
- No summary view of what was found.

**Gap — no narrative summary:**
The investigation ends without ceremony. There's no "you investigated 3 factors, found 2 significant ones, explained 60% of variation" summary. The analyst must mentally reconstruct the investigation story for their report or team meeting.

**What the Investigation Narrative would provide (Phase 3):**
A presentation mode that transforms the investigation into a visual story: "We started with 252 deliveries. Store South was the biggest driver (45% of variation). Within Store South, the Dinner rush added the most time (25% more). Together these explain 60% of delivery time variation. Recommended action: focus on Store South's Dinner operations."

**What the Investigation Mindmap would show at this point:**
The drill trail is complete: Start → Store South → Time_Slot: Dinner. Two nodes filled, one dimmed (Day). The mindmap is a visual record of the investigation path. In Narrative mode, this becomes the stakeholder presentation.

---

## Summary: Guidance Coverage by Step

| Step | Description              | Existing Guidance                        | Gaps                                     | Phase 1 (Factor Suggestion)                | Phase 2 (Interaction Heatmap)               | Phase 3 (Mindmap/Narrative)              |
| ---- | ------------------------ | ---------------------------------------- | ---------------------------------------- | ------------------------------------------ | ------------------------------------------- | ---------------------------------------- |
| 1    | Data loaded              | Boxplot "↓ drill here"                   | No "start here" for novices              | Add suggestion chip with η² value          | —                                           | Mindmap shows factor landscape           |
| 2    | First drill (Store)      | η², Boxplot label                        | No "suggested next factor"               | Suggestion chip: "Try Time_Slot — η²=0.25" | —                                           | Drill trail begins                       |
| 3    | Funnel opened            | Rich: ranking, Cpk, cumulative           | Funnel is hidden, covers charts          | Surface key metrics in main view           | —                                           | Mindmap provides always-visible overview |
| 4    | Second drill (Time_Slot) | η², InteractionGuidance                  | Interaction guidance is text-only        | —                                          | Heatmap shows Store × Time_Slot interaction | Mindmap shows interaction edges          |
| 5    | Consider Day (weak)      | Boxplot label (no weak-signal indicator) | No diminishing returns signal            | Muted suggestion styling for weak factors  | —                                           | Small/dim Day node signals weakness      |
| 6    | Check interactions       | Regression coefficients table            | Results require expert interpretation    | —                                          | Heatmap pre-computes and visualizes         | —                                        |
| 7    | Investigation complete   | Cumulative bar (if Funnel open)          | No narrative summary, no stopping prompt | Stopping signal: "You've explained X%"     | —                                           | Narrative mode generates presentation    |

---

## Key Takeaways for Design

1. **The existing guidance is deeper than it appears** — the Funnel Panel ecosystem is rich. The problem is discoverability and platform parity, not capability.

2. **Phase 1 (Factor Suggestion) has the highest impact per effort** — a suggestion chip in the main view surfaces the Funnel Panel's best insights without requiring the analyst to find and open it.

3. **Phase 2 (Interaction Heatmap) replaces a two-step workaround** — currently the analyst sees a text prompt → navigates to Regression Panel → configures it → reads results. The heatmap collapses this into a glance.

4. **Phase 3 (Mindmap/Narrative) addresses the end of the investigation** — everything from Steps 1–6 is about finding the answer. Step 7 reveals that VariScout has no support for communicating the answer.

5. **The Pizza dataset works as a primary demo** — its 3-factor structure walks through all the guidance elements without being overwhelming. Store dominance → Time_Slot secondary → Day diminishing returns is a clean pedagogical arc.

---

## Related Documents

- [Design Brief](design-brief-guided-investigation.md) — Statistical methodology and design principles
