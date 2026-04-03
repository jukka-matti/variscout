---
title: 'Investigation Flow Map: Hospital Ward (Aggregation Trap)'
---

# Investigation Flow Map: Hospital Ward (Aggregation Trap)

> A step-by-step walkthrough of a complete variation investigation using the Hospital Ward dataset, documenting what exists at each step, what guidance the analyst receives, and where gaps remain. Follows the [Pizza Delivery flow map](investigation-flow-map.md) format.

---

## Dataset: Hospital Ward Utilization

- **Source**: `packages/data/src/samples/hospital-ward.ts`
- **Outcome**: `Utilization_pct` (target: 75%, USL: 90%)
- **Factors**: Time_Period (Night 22–06, Morning 7–13, Afternoon 14–16, Evening 17–21), Day_of_Week (Mon–Sun)
- **Data generation**: 672 observations = 28 days x 24 hours. Night: mean=94, std=3 (crisis). Morning: mean=70, std=6. Afternoon: mean=48, std=6 (waste). Evening: mean=65, std=7. All clamped [35, 100].
- **Expected story**: Time_Period dominates massively (multimodal distribution). Day_of_Week is weak. The overall mean (~69%) looks "fine" — but it hides a 94% crisis and a 48% waste reality. This is the textbook aggregation trap: an average of extremes that matches no individual's experience.

---

## Step 1: Data Loaded — The Misleading Dashboard

The analyst loads the Hospital Ward sample via `/?sample=hospital-ward`. The Dashboard renders the Four Lenses.

**What the analyst sees:**

- **I-Chart**: 672 hourly utilization values plotted sequentially. Very noisy — the chart is dense with points cycling between high and low values. Control limits are wide due to the mixed population. The overall pattern looks chaotic but "centered."
- **Boxplot**: Four groups for Time_Period (the first factor). Immediately striking: Night is high and tight (~94%), Afternoon is low (~48%), Morning and Evening are in between. The boxes barely overlap.
- **Pareto**: Ranked by out-of-spec frequency against the 90% USL.
- **Stats Panel**: Overall mean ~69%, std dev ~16–18%, n=672. With the 90% USL, overall Cpk is modest. With the 75% target, the mean looks "close enough."

**Existing guidance at this step:**

- Boxplot shows **"↓ drill here"** on the Time_Period group with the highest contribution to variation (likely Night, due to its extreme position).
- VariationBar shows total variation scope.
- The 4-group Boxplot immediately reveals the multimodal structure — this is the chart's strongest moment.

**Gap — the overall mean is the lie, but nothing calls it out:**
The Stats Panel displays mean ~69%, which a manager would read as "we're at 69%, target is 75%, we have room to improve." This sounds like a mild shortfall. But 69% is a mathematical fiction — it's the average of 94% (crisis) and 48% (waste), a number that describes nobody's actual experience. The product shows both the misleading mean and the revealing Boxplot on the same screen, but draws no connection between them. There is no "your overall mean hides 4 different realities" teaching callout.

---

## Step 2: Boxplot Reveals Four Realities

The analyst studies the Boxplot. Four Time_Period groups tell dramatically different stories.

**What the analyst sees:**

- **Night** (22:00–06:00): Box centered around ~94%. Very tight (std=3). The entire box sits near or above the 90% USL line. Crisis-level capacity.
- **Morning** (07:00–13:00): Box centered around ~70%. Moderate spread (std=6). Comfortable operating range.
- **Afternoon** (14:00–16:00): Box centered around ~48%. Moderate spread (std=6). Dramatically underutilized — waste.
- **Evening** (17:00–21:00): Box centered around ~65%. Wider spread (std=7). Below target.
- The boxes barely overlap. Time_Period's contribution % is very high (likely >60%).
- The "↓ drill here" label appears on the highest-contribution group.

**Existing guidance at this step:**

- "↓ drill here" with contribution % identifies the dominant factor.
- ANOVA (in maximized view) shows Time_Period is overwhelmingly significant.
- The visual separation of the four boxes is itself the primary guidance — the multimodal structure is unmistakable.

**Gap — no "aggregation trap" teaching callout:**
The Boxplot reveals the structure brilliantly — four non-overlapping boxes are a textbook sign that the overall average is meaningless. But the product doesn't name this pattern. There is no "These four groups don't overlap — the overall mean of 69% represents none of them" annotation. The aggregation trap is the entire teaching point of this dataset, yet the product relies on the analyst recognizing it themselves.

---

## Step 3: Click Night — The Crisis

The analyst clicks the Night group in the Boxplot. The dashboard filters to Night observations only.

**What the analyst sees:**

- **I-Chart**: ~252 data points (9 hours/day x 28 days). Remarkably stable — all values clustered tightly around 94%. The process is "in control" at a dangerously high level. Some points touch or exceed the 90% USL.
- **Boxplot**: Now shows Day_of_Week groups within Night (7 groups: Mon–Sun).
- **Stats Panel**: Mean ~94%, std dev ~3%, n ~252. Pass rate against 90% USL is low — many observations exceed the spec limit.
- **FilterBreadcrumb**: A chip appears: **"Time_Period: Night XX%"** — showing a very high contribution percentage.
- **VariationBar**: Updates to show substantial explained variation.

**Existing guidance at this step:**

- Filter chip with high contribution % confirms Night is the dominant source.
- The I-Chart's stability at ~94% is visually striking — the problem isn't random spikes, it's the entire operating level.
- Pass rate against USL drops dramatically, making the crisis concrete.

**Gap — no "above USL" emphasis at the subgroup level:**
The overall dataset had a mix of pass/fail against the 90% USL. But Night's mean is ~94% — nearly every observation is at or above the limit. The pass rate stat updates, but there is no explicit callout like "During Night hours, average utilization exceeds your 90% capacity limit." The connection between the filtered stats and operational risk (patient safety, staff burnout) is left to the analyst.

---

## Step 4: Day_of_Week within Night — Every Day

The analyst examines the Boxplot showing Mon–Sun within Night.

**What the analyst sees:**

- **Boxplot**: Seven boxes (Mon–Sun), all clustered around ~94% with similar spread. No day stands out. The crisis is chronic, not day-specific.
- **"↓ drill here"** may appear on one day, but the contribution % is negligible.
- **ANOVA** (if checked): Day_of_Week within Night has a low F-statistic and high p-value. Day explains essentially zero variation within Night.

**Existing guidance at this step:**

- Low contribution % signals this factor isn't helpful.
- ANOVA confirms Day_of_Week is not significant within Night.
- The visual uniformity of the seven boxes tells the story.

**Gap — no "chronic problem" confirmation:**
The analyst has discovered that Night's crisis happens every day, not just weekends or specific days. This is an important operational finding — it means the solution must be systemic (staffing model, admission scheduling), not targeted (e.g., "add Sunday night coverage"). But the product doesn't synthesize this. There is no "Day_of_Week explains <2% of Night variation — the crisis is every night" summary.

---

## Step 5: Backtrack, Click Afternoon — The Waste

The analyst removes the Night filter and clicks the Afternoon group in the Boxplot.

**What the analyst sees:**

- **I-Chart**: ~84 data points (3 hours/day x 28 days). Stable at a dramatically different level — values cluster around ~48%. The process is "in control" at severe underutilization.
- **Boxplot**: Shows Day_of_Week within Afternoon. Similar pattern to Night — no day stands out.
- **Stats Panel**: Mean ~48%, std dev ~6%, n ~84. Far below the 75% target. The opposite problem from Night.
- **FilterBreadcrumb**: "Time_Period: Afternoon XX%".

**Existing guidance at this step:**

- The stats panel clearly shows the low mean.
- Filter chip with contribution %.

**Gap — no connection between Night and Afternoon:**
The analyst has now seen 94% (Night) and 48% (Afternoon). The arithmetic is compelling: (94 + 48) / 2 ≈ 71% — close to the "overall 69%" the dashboard showed. But the product doesn't draw this connection. There is no "Night's 94% and Afternoon's 48% average to the 69% your dashboard showed — but neither group experiences 69%" callout. The aggregation trap demonstration requires the analyst to do the mental arithmetic themselves.

---

## Step 6: Return to Full View — The Lying Dashboard

The analyst removes the Afternoon filter to return to the full 672-point dataset.

**What the analyst sees:**

- Overall stats restored: mean ~69%, std dev ~16–18%, n=672.
- The same Boxplot showing four non-overlapping groups.
- ANOVA confirming Time_Period's dominance.
- The overall mean of ~69% — the number that started this investigation — looks innocuous again.

**Existing guidance at this step:**

- ANOVA provides statistical confirmation.
- The Boxplot structure remains visible and revealing.
- η² on the "↓ drill here" label quantifies Time_Period's importance.

**Gap — no "before and after understanding" contrast:**
The analyst now knows that "69% average" is a fiction. But the dashboard looks exactly the same as when they started. There is no visual marker of the analyst's changed understanding. No "you've now seen that this 69% mean hides a 94% crisis (Night) and 48% waste (Afternoon)" summary. The investigation has transformed the analyst's understanding, but the product's display is unchanged.

---

## Step 7: Investigation Complete — Aggregation Trap Revealed

The investigation concludes with the core insight: **"Night: 94% (crisis). Afternoon: 48% (waste). The dashboard showed 69%. The average lied."**

**What the analyst should take away:**

- The overall 69% utilization looks acceptable but describes nobody's reality.
- Night shifts consistently operate at 94% — above the 90% USL, meaning patient safety risk and staff burnout.
- Afternoon shifts operate at 48% — severe underutilization representing wasted capacity and staffing cost.
- The solution is flex staffing by time period, not uniform cuts or additions.
- Reducing night staff (the management proposal based on "75% target, 69% actual = spare capacity") would create a patient safety crisis.
- The I-Chart of the full dataset showed "noise" that was actually signal — the cycling between high and low values _was_ the time-of-day pattern.

**Existing guidance at this step:**

- None — the product provides no investigation conclusion or narrative summary.

**Gap — no aggregation trap lesson:**
This dataset exists specifically to teach the aggregation trap — the most common statistical fallacy in management dashboards. Yet the product never names the pattern, never draws the connection between the overall mean and the subgroup means, and never provides the operational implication. The teaching arc is: "Your dashboard showed 75%. Your nurses said something is wrong. Who's right? Both — but the dashboard is hiding the structure." The product supports the analysis but doesn't deliver the lesson.

---

## Summary: Guidance Coverage by Step

| Step | Description                 | Existing Guidance                                        | Gaps                                                             |
| ---- | --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Data loaded                 | Boxplot "↓ drill here", VariationBar                     | Overall mean ~69% looks "fine" — no warning it's meaningless     |
| 2    | Boxplot reveals 4 realities | "↓ drill here" with contribution %, ANOVA                | No "aggregation trap" teaching callout for non-overlapping boxes |
| 3    | Drill into Night            | Filter chip with high %, I-Chart shows stability at ~94% | No "above USL" emphasis for the subgroup                         |
| 4    | Day_of_Week within Night    | Low contribution %, ANOVA not significant                | No "chronic problem" confirmation                                |
| 5    | Backtrack, drill Afternoon  | Stats show low mean (~48%)                               | No connection drawn to Night — (94+48)/2 ≈ 69% is invisible      |
| 6    | Return to full view         | ANOVA confirms Time_Period dominant                      | No summary of what was found vs initial perception               |
| 7    | Investigation complete      | (none)                                                   | No aggregation trap lesson or operational recommendation         |

---

## Key Takeaways for Design

1. **The Boxplot immediately reveals the multimodal structure** — four non-overlapping boxes are visually unmistakable. This dataset validates the Boxplot as the primary investigation chart. The analyst doesn't need to be told something is wrong — they can see it.

2. **The overall mean is the enemy** — it's the single number that enables the management mistake. The Stats Panel shows it prominently, and nothing in the UI warns that it's misleading when the Boxplot shows non-overlapping groups. Detecting and flagging multimodal distributions would be the highest-impact guidance addition.

3. **The Night-to-Afternoon comparison is the "aha" moment** — but sequential drilling loses it. The analyst sees 94% in one drill and 48% in another, but never on the same screen. The arithmetic (94+48)/2 ≈ 69% is the punch line, but it requires mental math across drill states.

4. **Cpk/pass rate changes dramatically per subgroup** — overall pass rate against 90% USL is moderate, but Night's pass rate is terrible. The Stats Panel updates correctly per filter, but there's no visual comparison of subgroup pass rates. A "pass rate by Time_Period" view would make the operational risk concrete.

5. **This is the most common dashboard lie in practice** — every hospital, factory, and call center has this pattern. The aggregation trap is not an edge case; it's the default failure mode of summary dashboards. Making VariScout explicitly name and teach this pattern would be a significant competitive differentiator.

---

## Related Documents

- [Hospital Ward Case Study](../../04-cases/hospital-ward/index.md) — Teaching narrative and dataset description
- [Pizza Delivery Flow Map](investigation-flow-map.md) — Template this document follows
- [Bottleneck Flow Map](bottleneck-flow-map.md) — Companion flow map demonstrating variation vs mean
- [Progressive Stratification](../progressive-stratification.md) — Theoretical framework for drill-down methodology
