---
title: MBB Investigation Spine Validation
type: interview
language: en
date: 2026-03-29
status: delivered
---

# MBB Validation Interview: Investigation Spine Design

Simulated review with a Lean Six Sigma Master Black Belt — rigorous, practical, skeptical.

**Interviewer profile:** Dr. Makela — 18 years in automotive quality, MBB certified (ASQ), trained 200+ Black Belts. Led Analyze phase for 40+ DMAIC projects. Daily Minitab user. Skeptical of software that "does the thinking for the analyst." Evaluates against: (1) methodological correctness, (2) practical analyst workflow, (3) statistical rigor.

---

## Topic 1: Progressive Problem Statement

> **Dr. Makela:** "Show me how the Problem Statement forms. In my experience, teams spend weeks writing a problem statement before they've even looked at data."

**We present:** Watson's Q1 (measure) + Q2 (direction) are deterministic from specs. Q3 (scope) fills in at SCOUT Loop 1 from first significant factor. Problem Statement is live, always visible, progressively sharpening.

### Verdict: Strong approval with one caveat.

"This is exactly right. Watson's three questions are the backbone of good problem definition. Most tools make you write the problem statement as a text field during Define — that's backwards. You shouldn't be able to write a good problem statement until you've seen the data.

Q2 from characteristic type is elegant — I've never seen a tool do that automatically. If you have both spec limits, it's nominal. One limit, it's directional. That's correct.

**Caveat:** The first significant factor for Q3 — make sure the analyst can override this. Sometimes the first factor by R²adj isn't the right scope. In automotive, we might know the scope is 'Plant A' from the customer complaint even if the data shows 'Shift' as the highest R²adj. The auto-fill is a good default, but it must be editable."

> **Design already handles this:** Problem Statement is always editable. Auto-fill is a suggestion, not a lock.

---

## Topic 2: SuspectedCause Hub Model

> **Dr. Makela:** "Multiple root causes? Walk me through how this works. In DMAIC we usually converge on one root cause."

**We present:** Hub entities connecting multiple evidence threads. The analyst names the mechanism — "nozzle wear on night shift." Multiple hubs can coexist. Each drives one HMW brainstorm. Confirmed by outcome, not statistics.

### Verdict: Strong approval. Corrects a common DMAIC misunderstanding.

"Actually, the 'one root cause' idea is a simplification that causes problems. In my 40+ projects, I can count on one hand the cases where there was truly a single root cause. Real processes have multiple independent variation sources. Fill weight might be affected by nozzle wear AND material moisture AND ambient temperature — three separate mechanisms that each need their own countermeasure.

The hub model is correct. What I like is that the analyst _names_ the mechanism in their own words. That's the moment of understanding. A good Black Belt can explain the mechanism to the operator in one sentence. If you can't name it simply, you don't understand it yet.

**Key validation:** 'Confirmed by outcome, not statistics' — _this is exactly right_. I've seen too many projects where a team declares root cause at p<0.05 and moves to Improve without verifying. A p-value tells you there's a difference, not that you've found the mechanism. Confirmation is when the process actually improves after the fix."

---

## Topic 3: Regression Equation from Best Subsets

> **Dr. Makela:** "Now this is interesting. You're using cell-means ANOVA and calling it a regression equation. Explain why that's valid."

**We present:** Cell-means model — group by factor level combinations, compute means. Level effects = group mean - grand mean. Prediction = grand mean + sum of level effects for target levels. Displayed as: `Y = 12.1 + Shift(Day -0.3, Night +0.8) + Head(1-4 -0.2, 5-8 +0.5)`.

### Verdict: Methodologically sound with important caveats.

"The cell-means model IS a valid regression equation for categorical predictors. In Minitab, when you run Best Subsets with categorical factors, this is exactly what you get — dummy-coded variables where the coefficient is the level effect relative to a reference level. Your grand-mean-centered approach is equivalent and arguably more intuitive.

**Caveat 1 — Additivity assumption:** The main-effects model assumes no interactions. If Shift and Head interact (the combination is worse than the sum), the prediction will be off. You need to flag this. When L3 interaction questions show dR² > X%, the equation's prediction should carry a confidence qualifier: 'Model assumes additive effects; interaction detected — prediction may be conservative.'

**Caveat 2 — Sample size per cell:** If a cell (e.g., Night + Head 5-8) has only 3 observations, the mean is unstable. Show n per cell. Flag cells with n < 5 or n < 10. Minitab does this with 'unusual observations.'

**Caveat 3 — Don't overstate precision:** Display the equation as a practical tool, not as scientific truth. 'The model suggests fixing Shift + Head would shift fill weight by approximately -1.8g' — not 'will shift by exactly -1.8g.' Prediction intervals matter. You don't need to compute full CI, but the language should be appropriately hedged.

**What I really like:** The equation display format — `Y = 12.1 + Shift(...) + Head(...)` — that's exactly how I'd show it in a report. Practitioners read this. They can point to it and say 'Night shift adds 0.8g to fill weight.' That's actionable. That's what the Improve team needs."

### Design action items:

1. Add interaction flag when L3 dR² is significant — qualify prediction.
2. Include cell sample counts in equation detail view.
3. Use hedged language: "model suggests" not "will be."

---

## Topic 4: EDA Heartbeat Rhythm

> **Dr. Makela:** "Auto-generated follow-up questions and a 'next question' highlight. Does this make the analyst lazy?"

### Verdict: Approval — but watch the balance.

"The L1->L2->L3 progression is sound. It mirrors how an experienced analyst thinks: 'Does the factor matter? -> Which level is the problem? -> Do they interact?' The auto-generation saves time on the mechanical part.

The coverage progress bar is useful. I've had Black Belts skip factors because they 'didn't think of it.' A progress metric that shows 'you've checked 60% of explainable variation' prevents that blind spot.

**Concern:** The 'next question' highlight should be a suggestion, not a prescription. Sometimes the analyst needs to go off-script — check something the model doesn't suggest, do a gemba walk, call the operator. The highlight should be easy to ignore. Make sure the tool doesn't create a false sense of completeness — 100% coverage doesn't mean you've found everything, it means you've checked everything the _model_ can see. The real mechanism might be something not in your data columns.

**What's good:** The five question sources. Factor Intelligence is the statistical backbone, but analyst questions, gemba observations, expert input, and CoScout suggestions bring the real-world context that data alone can't provide. That's the right balance."

---

## Topic 5: What-If Projections + Model Prediction Preset

> **Dr. Makela:** "You're saying the regression equation feeds directly into the What-If simulator. Walk me through a real scenario."

**We present:** Analyst has hub "Nozzle wear on night shift" with factors Shift + Head. Clicks -> Brainstorm -> creates idea "Replace nozzles every 500h." Opens What-If. "Model prediction" preset auto-fills: mean shift -1.8g based on equation (Night->Day + Head5-8->Head1-4). Analyst adjusts if they think the fix won't fully eliminate the effect. Saves projection.

### Verdict: This is the killer feature. Strong approval.

"In Minitab, I run Best Subsets, get the equation, then manually calculate what fixing the factors would do. It's a spreadsheet exercise. You're automating that entire chain: Best Subsets -> equation -> level effects -> auto-populate What-If -> show projected Cpk.

The 'model prediction' as a preset is exactly right — it's the most informed starting point. But the analyst must be able to adjust. 'Replace nozzles every 500h' won't perfectly replicate Head 1-4 performance — maybe it gets you 70% of the way. So the preset sets -1.8g but the analyst drags the slider back to -1.3g. That's realistic.

**One addition I'd want:** Show the residual. If the model explains 38% (R²adj), then 62% is unexplained. The prediction is +/- something. Even if you don't compute a formal prediction interval, show 'Model explains 38% of variation — actual improvement may differ.' This manages expectations. A project sponsor reading 'Cpk will improve to 1.12' and getting 0.95 is disappointed. A sponsor reading 'Model suggests ~1.12 (model explains 38%)' understands there's uncertainty.

**For the lean What-If:** The activity selector approach is correct. In a kaizen workshop, you don't say 'reduce waste globally.' You point to a specific activity on the yamazumi chart and ask 'how do we cut this changeover from 12 seconds to 5?' The analyst selecting the activity mirrors real gemba-based improvement."

---

## Topic 6: Overall Assessment

> **Dr. Makela:** "Give me your summary. Would you recommend this to your Black Belts?"

"The Investigation Spine design is **methodologically sound**. It operationalizes the EDA mental model in a way I haven't seen in commercial quality software. Minitab gives you the tools but no workflow. JMP gives you a workflow but it's too rigid. This design gives you a **structured but flexible investigation narrative** that guides without constraining.

### Three things that set this apart:

1. **The equation-driven projection chain.** Best Subsets -> regression equation -> What-If preset -> projected Cpk. No other tool I know connects these automatically. This saves hours per project.

2. **Multiple suspected causes as first-class entities.** This is how real investigations work. The hub model is correct. Naming the mechanism in your own words forces understanding — it's not just data, it's comprehension.

3. **Outcome-based confirmation.** The process improved? Then the cause is confirmed. Not p<0.05 confirmed — _actually_ confirmed. This is what ISO 10.2 requires and what most tools ignore.

### Three things to watch:

1. **Interaction flag.** The additive model will mislead when interactions are strong. Flag it explicitly — "interaction detected, prediction may be conservative."

2. **Residual communication.** Show R²adj alongside every projection. 38% explained means 62% unknown. Manage expectations.

3. **Don't create false completeness.** 100% coverage != 100% understanding. The model only sees what's in the data columns. Remind the analyst to check beyond the data.

Yes, I would recommend this to my Black Belts. Especially the Green Belts who struggle with the Analyze phase — this would cut their investigation time in half while improving rigor."

---

## Design Updates from MBB Review

1. **Interaction flag on equation predictions** — When L3 dR² is significant, show: "Interaction detected — model assumes additive effects, actual improvement may differ." On equation display AND on What-If model preset.

2. **R²adj alongside every projection** — Every model-driven projection carries "Model explains X%" qualifier. ProcessHealthBar, hub cards, What-If results — all show the explained fraction to manage expectations.

3. **Cell sample counts in equation detail** — Expanded equation view shows n per cell. Flag cells with n < 5 as low-confidence. "Night + Head 5-8: n=8" vs "Day + Head 1-4: n=94".

4. **Coverage != completeness reminder** — Coverage progress bar tooltip: "This tracks factors in your data. Real-world causes may be outside your dataset — gemba walks and expert input help fill the gap."

5. **Hedged prediction language** — All model-driven projections use "Model suggests" not "will be." E.g., "Model suggests Cpk ~1.12 if Shift + Head fixed (R²adj 38%)".

---

**MBB validation result:** Design is methodologically sound. Five refinements identified — all about communicating uncertainty honestly, not about changing the architecture. The spine model, hub entities, equation-driven projections, and outcome-based confirmation all received strong approval.
