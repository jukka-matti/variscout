# M5-W2: Probability Plot - 3-Way AI Comparison

**Month:** 5 (Complete GB Toolkit)  
**Week:** 2 (Week 18 overall)  
**Theme:** 3-Way AI Comparison  
**Tool Focus:** Probability Plot / Normality Assessment  
**The Question:** "Is my data normal?"

---

## Format: 3-Way Comparison

| Method                    | Description                   |
| ------------------------- | ----------------------------- |
| **Copilot**               | Chat-based AI in Edge/Windows |
| **Copilot Analyst Agent** | Autonomous data analyst agent |
| **VaRiScout**             | Visual exploration tool       |

Same data. Same question. Three approaches.

---

## Video: "Can AI Check Normality?"

### Duration

10-12 minutes

### Structure

**Opening Hook (30 sec)**

- "Before you calculate Cpk, you need to know..."
- "Is your data normal?"
- "I tested three ways to find out"

**Teaching: Why Normality Matters (2-3 min)**

- Many statistical methods assume normality
- Cpk calculation assumes normal distribution
- Control chart limits assume normality
- What does "normal" mean? (bell curve, symmetric)
- What does non-normal tell you? (multiple sources, outliers, truncation)

**Round 1: Copilot (2-3 min)**

- Prompt: "Is this data normally distributed?"
- What it does: May calculate Shapiro-Wilk, Anderson-Darling
- Show response: p-value, conclusion
- What's missing: Can you SEE the deviation?

**Round 2: Copilot Analyst Agent (2-3 min)**

- Give it the dataset
- Ask about distribution
- Does it think to check normality?
- Show its approach and output

**Round 3: VaRiScout (2-3 min)**

- Toggle to Probability Plot view
- What you see: Points should follow the line
- Deviations are visible: Where does it bend? Why?
- Connects to histogram: See the shape
- The insight: Not just "normal/not normal" but "what's going on?"

**The Verdict (1-2 min)**

- AI gives you a p-value
- Probability plot shows you WHERE and HOW it deviates
- For understanding: visual wins
- For quick check: AI is fine
- For GB training: need to understand what non-normality means

**Close (30 sec)**

- "Normal or not isn't just pass/fail"
- "The pattern of deviation tells you something"
- CTA

---

## Teaching Points: Probability Plot

### What It Shows

- Data plotted against expected normal values
- If normal: points follow the straight line
- If non-normal: points deviate from line

### Reading Deviations

| Pattern                 | What It Means                 |
| ----------------------- | ----------------------------- |
| S-curve                 | Heavy tails (outliers)        |
| Bend up at right        | Right skew (some high values) |
| Bend down at left       | Left skew (some low values)   |
| Two lines               | Two populations (bimodal)     |
| Points off line at ends | Outliers                      |

### Why This Matters

- Cpk assumes normality - if not normal, Cpk may mislead
- Non-normality often signals something interesting
- Two populations = two sources of variation
- Skew = process limit or measurement issue

### The Insight

- P-value says "different from normal" but not HOW
- Probability plot shows the story

---

## Clips to Cut

### Clip 1: "Why Normality?" (45 sec)

- "Before Cpk, check normality"
- Many methods assume it
- Non-normal tells you something

### Clip 2: "The P-Value Problem" (45 sec)

- AI gives you: "p = 0.03, not normal"
- But... not normal HOW?
- Two populations? Outliers? Skew?

### Clip 3: "Reading the Plot" (60 sec)

- Points on line = normal
- Deviations = information
- Show examples: S-curve, bend, two lines

### Clip 4: "The Story" (30 sec)

- p-value = verdict
- Probability plot = story
- Which builds understanding?

---

## LinkedIn Posts

### Post 1: The Test (Monday)

```
"Is my data normal?"

Every GB asks this before calculating Cpk.

I tested three approaches:

**Copilot**: Ran Shapiro-Wilk test, gave p-value
→ "p = 0.03, likely not normal"

**Analyst Agent**: Checked distribution
→ Summary statistics + normality conclusion

**VaRiScout**: Probability plot
→ I can SEE where it deviates
→ Two populations? Outliers? Skew?

The p-value tells you it's not normal.
The probability plot tells you WHY.

Full comparison: [link]

#Statistics #NormalDistribution #DataAnalysis
```

### Post 2: Reading the Plot (Wednesday)

```
How to read a probability plot:

📈 Points follow the line = Normal

Deviations tell you something:

↗️ S-curve = Heavy tails (outliers on both ends)
↗️ Bend up at right = Right skew (some high values)
↗️ Two parallel lines = Two populations (!)
↗️ Points way off at ends = Outliers

A p-value tells you "not normal."
The plot tells you WHAT'S HAPPENING.

That's the difference between a verdict and understanding.

#ProbabilityPlot #Statistics #QualityManagement
```

### Post 3: The Verdict (Friday)

```
Normality check comparison:

**AI approach**:
- Calculate test statistic
- Return p-value
- Binary verdict: normal / not normal

**Visual approach**:
- Plot data against expected normal
- See the pattern of deviation
- Understand what's causing non-normality

Both valid.

But when I'm training Green Belts, I want them to ask:

"Not normal... but WHY?"

Two populations = investigate sources
Outliers = investigate those points
Skew = investigate process limits

The probability plot answers these questions.

[link]

#GreenBeltTraining #DataLiteracy #ProcessImprovement
```

---

## Sample Data for Demo

Prepare multiple datasets:

1. Normal data (control - follows line nicely)
2. Bimodal data (two populations - two lines visible)
3. Skewed data (bend in probability plot)
4. Data with outliers (points off at ends)

Show at least 2-3 in the demo to illustrate reading patterns.

---

## Production Checklist

- [ ] Multiple sample datasets prepared
- [ ] Copilot prompts tested
- [ ] Copilot Analyst tested
- [ ] VaRiScout probability plot demo ready
- [ ] Video recorded
- [ ] Video edited
- [ ] Clips cut
- [ ] Blog written
- [ ] LinkedIn posts written
- [ ] All content scheduled

---

## Status

| Item          | Status |
| ------------- | ------ |
| **Published** | ⬜     |
