---
title: 'Investigation Flow Map: Bottleneck Detection'
---

# Investigation Flow Map: Bottleneck Detection

> A step-by-step walkthrough of a complete variation investigation using the Bottleneck dataset, documenting what exists at each step, what guidance the analyst receives, and where gaps remain. Follows the [Pizza Delivery flow map](investigation-flow-map.md) format.

---

## Dataset: Process Step Bottleneck

- **Source**: `packages/data/src/samples/bottleneck.ts`
- **Outcome**: `Cycle_Time_sec` (target: 40s)
- **Factors**: Step (Step 1–5), Shift (Morning, Afternoon)
- **Data generation**: 150 observations = 5 steps x 2 shifts x 5 days x 3 reps. Step 2: mean=40, std=10 (the hidden bottleneck — high variance). Step 3: mean=45, std=2 (the decoy — high average, low variance). Steps 1, 4, 5: means=32, 34, 30, std=2. All clamped [15, 60].
- **Expected story**: Step dominates variation. Step 2 is the real bottleneck (high variance starves downstream). Step 3 is the misdirection (highest average, but stable). The analyst must learn that variation matters more than location.

---

## Step 1: Data Loaded — Dashboard Shows Four Lenses

The analyst loads the Bottleneck sample via the home screen card or `/?sample=bottleneck`. The Dashboard renders the Four Lenses: I-Chart, Boxplot, Pareto, and Stats Panel.

**What the analyst sees:**

- **I-Chart**: 150 cycle times plotted sequentially. The pattern is noisy because all five steps are mixed together. Control limits are wide (~15–60s range). No clear trend — the mixed population masks structure.
- **Boxplot**: Five groups for Step (the first factor). Step 3's box is shifted highest (~45s median). Step 2's box is dramatically wider than all others (IQR ~13s vs ~3s). Steps 1, 4, 5 cluster low and tight.
- **Pareto**: Ranked by out-of-spec frequency against the 40s target.
- **Stats Panel**: Overall mean ~36s, std dev ~7–8s, n=150. With the 40s target, Cpk is modest.

**Existing guidance at this step:**

- Boxplot shows **"↓ drill here"** label on the group with the highest contribution to variation (likely Step 2, since its spread dominates Total SS).
- VariationBar at the top shows total variation scope.
- No other suggestions unless the analyst interacts.

**Gap — the Boxplot draws the eye to the wrong place:**
Step 3 has the highest median, which is the most visually prominent feature in a boxplot (the center line). A first-time analyst will likely fixate on Step 3's position rather than Step 2's width. The "↓ drill here" label correctly points to the highest-variation step, but there is no teaching callout explaining _why_ a wide box matters more than a high box. The insight "variation > location" is the entire pedagogical point of this dataset, yet the product provides no guidance at this critical moment.

---

## Step 2: Boxplot Reveals the Misdirection

The analyst studies the Boxplot more carefully. Five groups are visible. Step 3 is the tallest (highest median ~45s). But Step 2 has a dramatically wider box — its IQR spans roughly 13 seconds while other steps span ~3 seconds.

**What the analyst sees:**

- Step 3 median is the highest — it looks like the "worst" step.
- Step 2's box extends much further above and below its median (~40s). Whiskers reach from low 20s to high 50s.
- Steps 1, 4, 5 are compact and low — clearly not the problem.
- The "↓ drill here" label appears on Step 2 (highest contribution %), correctly identifying the high-variation step.
- Contribution percentages are visible on the label, showing Step's dominance.

**Existing guidance at this step:**

- The "↓ drill here" label with contribution % on Step 2 is the key navigation cue.
- ANOVA (visible in maximized boxplot view) shows Step is a significant factor with high F-statistic and low p-value.

**Gap — no "variation vs mean" teaching moment:**
This is the critical decision point. The analyst must choose: drill into Step 3 (highest average — the intuitive choice) or Step 2 (highest variation — the correct choice). The "↓ drill here" label guides correctly but doesn't explain _why_. There is no callout like "Step 2 has 3x the spread of Step 3 — inconsistency causes more downstream disruption than consistently slow operation." The product silently guides correctly but misses the teaching opportunity that makes this dataset valuable.

---

## Step 3: Click Step 2 — First Drill

The analyst clicks the Step 2 group in the Boxplot. The dashboard filters to only Step 2 observations.

**What the analyst sees:**

- **I-Chart**: 30 data points (Step 2 only). Wild scatter — values ranging from low 20s to high 50s. No stable pattern. Control limits are very wide, confirming high inherent variation.
- **Boxplot**: Now shows Shift groups within Step 2 (Morning, Afternoon). Both boxes are wide.
- **Pareto**: Shift-level ranking within Step 2.
- **Stats Panel**: Mean ~40s, std dev ~10s, n=30. The standard deviation is the key number — it's 3–5x higher than other steps.
- **FilterBreadcrumb**: A chip appears: **"Step: Step 2 XX%"** — showing Step 2's contribution to total variation. The percentage is high, confirming this is the dominant source.
- **VariationBar**: Updates to show cumulative explained variation.

**Existing guidance at this step:**

- Filter chip with contribution % badge confirms this is a meaningful filter.
- Boxplot "↓ drill here" appears on one of the Shift groups.
- VariationBar shows progress in the investigation.

**Gap — no "you found the problem" confirmation:**
The analyst has correctly identified the high-variation step, but nothing in the UI celebrates or confirms this. The I-Chart's wild scatter is the visual proof, and the std dev ~10 is the numeric proof, but there's no explicit comparison to other steps. The analyst would need to mentally recall that other steps had std ~2–3 to appreciate the 3–5x difference. A side-by-side comparison or "Step 2's variation is 3x the average of other steps" callout would reinforce the finding.

---

## Step 4: Shift within Step 2 — Not the Cause

The analyst examines the Boxplot showing Morning vs Afternoon shifts within Step 2.

**What the analyst sees:**

- **Boxplot**: Two boxes (Morning, Afternoon) with similar medians (~40s) and similarly wide spread. Neither shift is dramatically different from the other.
- **"↓ drill here"** may appear on one shift, but the contribution % is low.
- **ANOVA** (if checked): Shift within Step 2 has a low F-statistic and high p-value. Shift explains negligible variation within Step 2.

**Existing guidance at this step:**

- Low contribution % on the Shift label signals this factor isn't important within the current filter.
- ANOVA confirms Shift is not significant.

**Gap — no "dead end" signal:**
The analyst has reached a dead end — Shift doesn't explain Step 2's variation. The problem is the step's process itself, not when it runs. But nothing in the UI explicitly says "this factor doesn't help." The analyst must interpret the similar-looking boxes and low contribution % themselves. A prompt like "Shift explains <5% of remaining variation — the variability is inherent to Step 2's process" would close the loop and redirect the analyst's attention.

---

## Step 5: Backtrack, Click Step 3 — The Contrast

The analyst removes the Step 2 filter (clicks the X on the filter chip) to return to the full dataset, then clicks Step 3 in the Boxplot.

**What the analyst sees:**

- **I-Chart**: 30 data points (Step 3 only). Remarkably stable — values cluster tightly around 45s. Very narrow control limits. A textbook example of an in-control process.
- **Boxplot**: Shows Shift groups within Step 3, both tight.
- **Stats Panel**: Mean ~45s (higher than Step 2!), std dev ~2s (5x lower than Step 2). The contrast is stark.
- **FilterBreadcrumb**: "Step: Step 3 XX%".

**Existing guidance at this step:**

- The stats panel clearly shows the low std dev.
- Filter chip shows contribution %.

**Gap — no comparison context from the previous drill:**
This is where the pedagogical payoff should happen: Step 2 (mean ~40, std ~10) vs Step 3 (mean ~45, std ~2). But the analyst has to remember Step 2's numbers from memory. The sequential drill-down loses the comparison context — each filter shows its own stats in isolation. There is no "compared to Step 2, this step has 5x less variation" callout. No side-by-side view of drill results. The "slow but predictable vs fast but chaotic" insight requires the analyst to hold two mental models simultaneously.

---

## Step 6: Return to Full View

The analyst removes the Step 3 filter to return to the full 150-point dataset.

**What the analyst sees:**

- Overall stats restored: mean ~36s, std dev ~7–8s, n=150.
- ANOVA (in maximized boxplot view) confirms Step is statistically significant with high F-statistic and low p-value.
- The Boxplot shows all five steps again, with Step 2's wide spread and Step 3's high position clearly visible.

**Existing guidance at this step:**

- ANOVA provides the statistical confirmation.
- The Boxplot's visual structure tells the whole story if the analyst knows how to read it.
- Contribution % on the "↓ drill here" label quantifies Step's importance.

**Gap — no investigation summary:**
The analyst has now drilled into Step 2 (chaotic), drilled into Step 3 (stable), and returned to the overview. But there's no record of this journey and no synthesis. The breadcrumbs are gone (filters removed). The investigation exists only in the analyst's memory. There is no "You investigated 2 of 5 steps and found that Step 2's variation (std=10) dominates the process" summary.

---

## Step 7: Investigation Complete — Aha Moment

The investigation concludes with the core insight: **"The bottleneck isn't where the average is highest — it's where the variation is highest."**

**What the analyst should take away:**

- Step 3 has the highest average cycle time (45s) but is stable and predictable.
- Step 2 has a lower average (40s) but 3–5x the variation — it's unpredictable.
- Unpredictable process times cause waiting, buffer starvation, and cascading delays downstream. A consistently slow step can be planned around; an inconsistent step cannot.
- Investing in Step 3 equipment (the management assumption) would not solve the problem.
- Step 2 needs investigation: operator training, equipment standardization, or process redesign.

**Existing guidance at this step:**

- None — the product provides no investigation conclusion or narrative summary.

**Gap — no narrative wrap-up:**
The entire teaching arc depends on the analyst constructing the "variation > mean" narrative themselves. For Green Belt Gary, this is manageable. For Student Sara or Curious Carlos encountering this concept for the first time, the product misses the opportunity to make the lesson explicit. There is no "what you found" summary, no suggested action, no connection between the statistical finding and the operational implication.

---

## Summary: Guidance Coverage by Step

| Step | Description                  | Existing Guidance                            | Gaps                                                       |
| ---- | ---------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| 1    | Data loaded                  | Boxplot "↓ drill here", VariationBar         | Eye drawn to Step 3's high median, not Step 2's wide box   |
| 2    | Boxplot reveals misdirection | "↓ drill here" on Step 2 with contribution % | No teaching callout: "variation matters more than average" |
| 3    | Drill into Step 2            | Filter chip with %, I-Chart shows scatter    | No confirmation: "you found the high-variation step"       |
| 4    | Shift within Step 2          | Low contribution %, ANOVA not significant    | No "dead end" signal to redirect investigation             |
| 5    | Backtrack, drill Step 3      | Stats show low std dev                       | No comparison to Step 2 — sequential drills lose context   |
| 6    | Return to full view          | ANOVA confirms Step is significant           | No investigation summary or journey record                 |
| 7    | Investigation complete       | (none)                                       | No narrative conclusion or teaching wrap-up                |

---

## Key Takeaways for Design

1. **The Boxplot is the hero chart for this dataset** — its visual encoding of both location (median) and spread (box width, whiskers) makes the Step 2 vs Step 3 contrast visible at a glance. But the product relies on the analyst knowing how to read spread, not just position.

2. **The "↓ drill here" label is correct but unexplained** — it points to the right step (Step 2, highest variation) but doesn't teach _why_ variation matters more than the average. This is the single highest-impact guidance gap for this dataset.

3. **Sequential drilling loses comparison context** — the analyst drills Step 2, sees std=10, then drills Step 3, sees std=2. But these are separate screens with no side-by-side view. The "3x the variation" insight requires mental arithmetic across drill states.

4. **No teaching callout for the "variation > mean" principle** — this is the core lesson of the Bottleneck case study, the ESTIEM training narrative, and the use case page promise. Yet the product provides no explicit guidance at the moment the analyst needs it.

5. **The Mindmap would capture the investigation trail** — if the analyst used the Mindmap panel, drill history would be preserved. But the Mindmap doesn't currently surface the "variation comparison" insight either.

---

## Related Documents

- [Bottleneck Case Study](../../04-cases/bottleneck/index.md) — Teaching narrative and dataset description
- [Bottleneck Analysis Use Case](../../02-journeys/use-cases/bottleneck-analysis.md) — Use case promise and SEO strategy
- [Pizza Delivery Flow Map](investigation-flow-map.md) — Template this document follows
- [Hospital Ward Flow Map](hospital-ward-flow-map.md) — Companion flow map demonstrating the aggregation trap
