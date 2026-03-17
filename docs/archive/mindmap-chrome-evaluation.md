# HISTORICAL ONLY — Mindmap replaced by Findings system (Feb 2026)

# Chrome Evaluation: Mindmap with Bottleneck & Hospital Ward

> Automated Playwright evaluation (13 tests, all passing) of the Investigation Mindmap panel with both Bottleneck and Hospital Ward case study datasets. Evaluates how the Mindmap contributes to the investigation workflow, documenting working features, UX gaps, and bugs. Screenshots in `apps/pwa/e2e/screenshots/mindmap-eval/`. E2E spec: `apps/pwa/e2e/mindmap-evaluation.spec.ts`.

---

## Summary of Findings

| Area                       | Finding                                                                                        | Severity   |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| Suggestion metric          | Shift suggested over Step in Bottleneck (58% vs 38%) — misleading for the pedagogical story    | **High**   |
| CategoryPopover            | Correctly shows all categories with contribution % before drilling                             | Working    |
| Dead-end signal            | No dead-end after Bottleneck Step 2 drill — Shift still pulses at 71%                          | **Medium** |
| Hospital Ward popover      | Night 46% + Afternoon 35% visible together — analyst CAN see contrast before drilling          | Working    |
| Day_of_Week after Night    | Day_of_Week still pulses at 17% — mild false positive                                          | **Low**    |
| Narrative mode             | Works after single drill, shows mean/Cpk before/after, conclusion panel, "+ Add note"          | Working    |
| Progress bar               | Shows "Focused on X% of variation" with 70% target — clear visual progress                     | Working    |
| Drill path footer          | Shows factor name + contribution % — useful breadcrumb                                         | Working    |
| Panel close mechanisms     | Escape and close button both work correctly                                                    | Working    |
| Investigation prompt       | Blue nudge bar appears after first boxplot drill — good discoverability                        | Working    |
| CategoryPopover truncation | Category labels truncated at 110px — some text clipped (visible in screenshots)                | **Low**    |
| Panel backdrop             | Blocks filter chip remove buttons when panel is open — must close panel to undo drill          | **Medium** |
| Step 2 contribution 0%     | Step 2 shows 0% contribution in CategoryPopover — counterintuitive for the "hidden bottleneck" | **Bug**    |

---

## Scenario 1: Bottleneck Dataset

### 1.1 Initial State

**Measured values:**

- Step node: 38% contribution, state: `available`
- Shift node: 58% contribution, state: `suggested` (green pulse)
- Progress bar: "Focused on -- of variation"

**Finding: Shift is suggested instead of Step.**
The `maxContribution` metric (single largest category's Total SS %) favors Shift because Shift has only 2 categories (Morning/Afternoon) and one of them carries a high relative proportion of the within-shift variance. Step has 5 categories that divide the variance more evenly. This means the suggestion metric recommends Shift first, which leads the analyst away from the interesting story (Step 2's high variance).

This is a significant mismatch between the suggestion algorithm and the pedagogical intent. In the Bottleneck dataset, Step is the dominant factor by any ANOVA measure (F-statistic, eta-squared), yet the max-single-category heuristic suggests Shift. An analyst following the green pulse would drill Shift first, which is a dead end — Morning and Afternoon both show 0% contribution.

**Recommendation:** Consider using the ANOVA F-statistic or eta-squared for suggestion ranking instead of max single-category contribution. The factor that explains the most between-group variance is the more analytically productive first drill.

### 1.2 CategoryPopover for Step

**Measured values (sorted by contribution):**
| Category | Contribution |
|----------|-------------|
| Step 3 | 37% |
| Step 5 | 13% |
| Step 1 | 5% |
| Step 4 | 1% |
| Step 2 | **0%** |

**Bug: Step 2 shows 0% contribution.**
Step 2 is the hidden bottleneck — it has the highest variance (std ~10 vs std ~2 for other steps). However, the `maxContribution` metric measures contribution to Total SS differently than expected. The popover shows Step 3 (37%) as the dominant category, which aligns with its high mean (45s vs 35s overall mean) but misses the variation story entirely.

This is because `maxContribution` for individual categories appears to measure the deviation of the category mean from the overall mean (between-group effect), not the within-group spread. Step 2's mean (~37s) is close to the overall mean (~35s), so its contribution registers as 0%. Step 3's mean (~45s) is 10s above overall, giving it the highest between-group contribution.

**The core problem:** The metric visible in the CategoryPopover is a between-group location metric, but the Bottleneck dataset's story is about within-group dispersion. An analyst looking at this popover would choose Step 3 (37%) over Step 2 (0%), which is the wrong choice. The popover actively misleads for dispersion-dominant scenarios.

### 1.3 CategoryPopover for Shift

| Category  | Contribution |
| --------- | ------------ |
| Morning   | 0%           |
| Afternoon | 0%           |

Both categories show 0% — Shift has no meaningful contribution to variation. This is correct. However, the Shift node shows 58% contribution on the Mindmap — a confusing contradiction. The node percentage and popover percentages appear to measure different things.

### 1.4 After Drilling Step 2

**Measured values:**

- Filter chip: "Step: Step 2 38%"
- Step node: active (blue), 38%
- Shift node: **still suggested (green pulse)**, 71%
- Drill path: "Step 38%"
- Progress: "Focused on 38% of variation"

**Finding: No dead-end signal after Step 2 drill.**
After filtering to Step 2 (n=30), Shift's contribution jumps to 71% and it still pulses green, suggesting deeper investigation. In reality, with only 2 shift categories and 15 observations each, any apparent Shift effect within Step 2 is likely noise. The analyst is guided toward a second drill that won't yield actionable insight.

The "implicit dead-end" design (no pulse = dead end) doesn't activate here because Shift's recalculated maxContribution on the filtered subset happens to exceed the suggestion threshold. This is a false positive that could waste analyst time.

### 1.5 Step 2 vs Step 3 I-Chart Contrast

**Measured values:**

- Step 2: mean=36.20, std=9.89
- Step 3: mean=45.17, std=1.94
- Ratio: 5.1x variance difference

**Working well:** The I-Chart contrast between Step 2 (chaotic, wide control limits) and Step 3 (stable, tight band around 45s) is dramatic and immediately visible. The Mindmap's drill-and-compare workflow makes it easy to see both charts sequentially. The filter chip shows "38% in focus" and the Mindmap node updates to "= Step 2" / "= Step 3" text labels.

**Gap:** There is no side-by-side comparison view. The analyst must remember Step 2's I-Chart while looking at Step 3's. The Mindmap provides the drill path breadcrumb but no mechanism to hold both views simultaneously.

---

## Scenario 2: Hospital Ward Dataset

### 2.1 Initial State

**Measured values:**

- Time_Period node: 47% contribution, state: `suggested` (green pulse)
- Day_of_Week node: 16% contribution, state: `available`
- Progress bar: "Focused on -- of variation"

**Working correctly:** Time_Period is correctly suggested. The 47% vs 16% split clearly identifies Time_Period as the dominant factor. The green pulse draws the analyst's attention to the right node.

### 2.2 CategoryPopover — Night and Afternoon Contrast

**Measured values (sorted by contribution):**
| Category | Contribution |
|----------|-------------|
| Night | 46% |
| Afternoon | 35% |
| Evening | 7% |
| Morning | 3% |

**Key success:** Both Night (46%) and Afternoon (35%) are visible in the same popover before drilling. The analyst can see that two time periods dominate before committing to a drill. This is a significant advantage over the boxplot-only workflow, where the analyst would drill Night, see the crisis, and might not return to check Afternoon.

**This is the CategoryPopover's strongest contribution to the investigation workflow.** It provides pre-drill context that the boxplot alone cannot — the analyst sees the full landscape of category contributions before filtering. For the Hospital Ward aggregation trap, this pre-drill view is the moment where the analyst can plan a multi-step investigation.

### 2.3 Night Drill — Crisis Level

**Measured values:**

- Night mean: 94.02% (vs 75% overall)
- Time_Period node: active, 47%
- Day_of_Week: suggested (green pulse), 17%
- Drill path: "Time_Period 47%"
- Progress: "Focused on 47% of variation"

**Finding: Day_of_Week still pulses after Night drill.**
With Night selected (n=252), Day_of_Week shows 17% contribution and still pulses green. This is a mild false positive — Day_of_Week has 7 categories (Mon-Sun) and some day-to-day variation within Night is expected (weekday staffing differences), but it's not the primary story. An analyst following the pulse would drill further when the investigation for Night is essentially complete.

### 2.4 Afternoon Drill — Waste Level

**Measured values:**

- Afternoon mean: 46.68% (vs 75% overall)
- Time_Period: active, 36%
- Day_of_Week: suggested, 22%
- Progress: "Focused on 36% of variation"

The 94% vs 47% contrast (Night vs Afternoon) is the aggregation trap discovery. The Mindmap makes it easy to drill each category and see the dramatic difference. The progress bar shows 36% for Afternoon (lower than Night's 47%) — this makes sense since Afternoon has fewer observations and less total impact.

**Note:** The aggregation trap itself — that the overall 75% mean represents neither Night nor Afternoon — is not explicitly called out. The analyst must make this connection by comparing the drill results with the overall stats. A "contrast summary" or "aggregation warning" would complete the story.

### 2.5 Narrative Mode

**Working:** Narrative mode activates after a single drill. The panel shows:

- Step 1: Time_Period node (47%), blue circle
- "Time_Period = Night"
- "47% of variation in scope"
- "Mean: 75.2 -> 94.0" (before/after)
- "Cpk: 0.64 -> -0.45" (dramatic capability drop — Night is out of spec)
- "n: 672 -> 252"
- "+ Add note" prompt for analyst annotations
- Conclusion panel: "Focused on 47% of variation / 53% outside scope — consider additional factors"
- "Model improvements ->" button linking to What-If

**This is the Narrative mode's strongest moment.** The before/after comparison (Mean, Cpk, n) provides exactly the context the flow map evaluations identified as missing. The analyst can document findings and see the aggregate picture. The Cpk change from 0.64 to -0.45 is a powerful visual indicator that Night is a crisis.

**Gap:** Narrative mode captures one drill per factor. The Hospital Ward investigation requires drilling Time_Period twice (Night + Afternoon) to reveal the aggregation trap. The current Narrative mode can only show one category selection per factor node. There's no mechanism to capture "I investigated Night AND Afternoon and found the contrast."

---

## Cross-Cutting Findings

### Mode Toggle States

| Condition          | Drilldown | Interactions                | Narrative    |
| ------------------ | --------- | --------------------------- | ------------ |
| Initial (no drill) | Enabled   | Enabled (2 factors, n >= 5) | **Disabled** |
| After 1 drill      | Enabled   | Enabled                     | **Enabled**  |

Interactions mode is available from the start with the Bottleneck dataset (2 factors, n=150), which is correct. Narrative requires at least 1 drill, which makes sense — there's nothing to narrate before the first investigation step.

### Panel Close Mechanisms

Both Escape key and close button work reliably. The backdrop click also works. No issues found.

### Investigation Prompt Nudge

After the first boxplot drill (without the Mindmap open), a blue nudge bar appears: "Tracking your investigation — open the Investigation panel to see the full picture." This is excellent for discoverability — it appears at exactly the right moment when the analyst is already engaged in investigation.

### Panel Backdrop Blocks Filter Chips

When the Mindmap panel is open, its backdrop overlay (`position: fixed; inset: 0; bg-black/40`) covers the main content area. This prevents clicking the filter chip remove buttons in the header bar. The analyst must close the Mindmap panel to undo a drill, then reopen it to continue investigating. This is a workflow friction point — the panel should not block header interactions.

---

## Summary: What the Mindmap Adds

### Working Well

1. **CategoryPopover provides pre-drill context** — the analyst sees all category contributions before committing to a filter. This is the Mindmap's most significant contribution, especially for the Hospital Ward scenario where Night and Afternoon are both visible at 46%/35%.

2. **Active node state tracking** — after drilling, the node turns blue with "= Step 2" label, providing clear visual confirmation of what's filtered. The trail line from Start to active node reinforces the drill path.

3. **Progress bar toward 70% target** — "Focused on 38% of variation" with a visual bar toward 70% gives the analyst a quantitative sense of investigation completeness.

4. **Drill path footer** — "Step 38%" chip provides a persistent breadcrumb of the investigation trail.

5. **Narrative mode's before/after comparison** — Mean, Cpk, and n changes are shown explicitly, which is exactly the context missing from the boxplot-only workflow.

6. **Investigation prompt nudge** — appears after first drill, excellent discoverability.

### Gaps That Remain

1. **Suggestion metric misleads for dispersion-dominated scenarios** — Shift (58%) suggested over Step (38%) in Bottleneck data because `maxContribution` measures location, not dispersion.

2. **Step 2 shows 0% in CategoryPopover** — the hidden bottleneck (high variance, near-average mean) is invisible in the popover's contribution ranking. This is the most critical analytical failure for the Bottleneck use case.

3. **No explicit dead-end signal** — after drilling Step 2, Shift still pulses green at 71%. The implicit "no pulse = dead end" design doesn't activate because the recalculated metric exceeds the threshold on filtered data.

4. **No aggregation trap warning** — the Hospital Ward's overall mean (75%) represents neither Night (94%) nor Afternoon (47%), but nothing in the Mindmap flags this. The analyst must make the connection manually.

5. **Narrative can't capture multi-category contrast** — the Hospital Ward investigation requires comparing Night vs Afternoon within Time_Period, but Narrative mode shows only one drill per factor node.

6. **Panel backdrop blocks filter chip interactions** — must close the panel to undo drills, creating workflow friction.

7. **No side-by-side comparison** — after drilling Step 2, the analyst must remember its I-Chart while drilling Step 3. No mechanism to hold both views simultaneously.

### Bugs

1. **Contribution metric inconsistency**: The Shift node shows 58% on the Mindmap but both Shift categories show 0% in the CategoryPopover. **Root cause confirmed**: The node circle uses `calculateCategoryTotalSS` (total SS including within-group spread) while the popover uses `getCategoryStats` (between-group SS only — `n_j * (mean_j - overall_mean)²`). These are fundamentally different formulas producing contradictory results. Code: `packages/core/src/variation/contributions.ts` and `packages/core/src/variation/suggestions.ts`.

2. **Step 2 at 0% in popover**: The popover's between-group-only metric `n_j * (mean_j - overall_mean)²` produces 0% for Step 2 because its group mean (~37) is close to the overall mean (~35). The high within-group variance (std=10) is invisible to this metric. This is the most analytically damaging bug for the Bottleneck use case — the popover actively hides the hidden bottleneck.

---

## Recommendations

### Priority 1: Fix Contribution Metrics

**Root cause analysis:** Two different metrics are used, and both have problems:

1. **Node circle %** (`getMaxCategoryContribution` -> `calculateCategoryTotalSS`): Computes `Σ(x_ij - overall_mean)² / SS_total` for the single largest category. This includes both mean deviation AND within-group spread, which is correct in principle. But using the _single largest category_ favors factors with fewer categories (Shift's 2 buckets > Step's 5 buckets), even when the factor itself explains little between-group variance.

2. **Popover category %** (`getCategoryStats`): Computes `n_j × (mean_j - overall_mean)² / SS_total` — a between-group-only metric. This misses within-group spread entirely, which is why Step 2 (mean ~37, close to overall ~35) shows 0% despite having the highest variance (std=10).

**The two metrics use fundamentally different formulas**, creating a contradiction: Shift node shows 58% but both Shift categories show 0% in the popover.

**Recommended fix:**

- **For node suggestion ranking**: Use ANOVA eta-squared (SS_between / SS_total for each factor). This correctly identifies Step as the dominant factor because Step's categories have diverse means AND diverse spreads.
- **For popover category ranking**: Show a _spread-aware_ metric — either within-category contribution to Total SS (the current `calculateCategoryTotalSS` formula, which already includes spread), or IQR/sigma alongside the existing between-group %. This would make Step 2's high variance visible in the popover.
- **Ensure consistency**: The node circle % and popover % sum should be reconcilable — either both use Total SS partitioning or both use between-group SS.

### Priority 2: Explicit Dead-End Signal

When a remaining factor's contribution drops below a threshold (e.g., 5%) after drilling, show an explicit indicator:

- Grey out the node
- Show "exhausted" text or icon
- Add a tooltip: "This factor explains < 5% of remaining variation"

### Priority 3: Aggregation Trap Alert

When category means span a wide range relative to the overall mean, show a warning:

- "Night (94%) and Afternoon (47%) are far from the overall mean (75%)"
- "The overall mean does not represent either subgroup"

### Priority 4: Multi-Category Narrative

Allow Narrative mode to capture multiple category drills within the same factor:

- "Step 1: Time_Period — investigated Night (94%) and Afternoon (47%), found 47-point gap"

---

## Test Data Reference

All measurements from `apps/pwa/e2e/mindmap-evaluation.spec.ts` (13 tests, all passing):

| Test | Dataset       | Key Measurement                                                 |
| ---- | ------------- | --------------------------------------------------------------- |
| 1.1  | Bottleneck    | Step 38%, Shift 58% (suggested)                                 |
| 1.2  | Bottleneck    | Step popover: Step 3=37%, Step 2=0%                             |
| 1.3  | Bottleneck    | Shift popover: Morning=0%, Afternoon=0%                         |
| 1.4  | Bottleneck    | After Step 2 drill: Shift still pulses at 71%                   |
| 1.5  | Bottleneck    | Step 2 sigma=9.89, Step 3 sigma=1.94 (5.1x ratio)               |
| 2.1  | Hospital Ward | Time_Period 47%, Day_of_Week 16%                                |
| 2.2  | Hospital Ward | Popover: Night=46%, Afternoon=35%                               |
| 2.3  | Hospital Ward | Night mean=94.02, Day_of_Week still pulses at 17%               |
| 2.4  | Hospital Ward | Afternoon mean=46.68, Day_of_Week pulses at 22%                 |
| 2.5  | Hospital Ward | Narrative: Mean 75.2->94.0, Cpk 0.64->-0.45                     |
| 3.1  | Bottleneck    | Mode states: Interactions initially enabled, Narrative disabled |
| 3.2  | Bottleneck    | Panel close: Escape and button both work                        |
| 3.3  | Bottleneck    | Investigation prompt appears after first boxplot drill          |
