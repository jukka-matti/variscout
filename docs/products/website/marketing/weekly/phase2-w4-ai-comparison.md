# M2-W4: ABB + AI Comparison (Boxplot)

**Month:** 2 (ABB)  
**Week:** 4 (Week 8 overall)  
**Theme:** AI Comparison + Chart Teaching  
**Angle:** "Can AI compare groups?"  
**Chart Focus:** Boxplot (Box-and-Whisker Plot)

---

## Context

Second AI comparison video. Teach the boxplot while comparing AI vs. visual exploration for group comparisons. ABB context: comparing machines, shifts, lines.

---

## Video: "Can AI Compare Groups?"

### Duration

8-12 minutes

### Talking Points

**Opening Hook (30 sec)**

- "I asked Copilot: Which machine has the most variation?"
- Show response
- "Now watch what happens when you see the comparison"

**Teaching: What is a Boxplot? (3-4 min)**

- The box: median, Q1, Q3 (middle 50% of data)
- The whiskers: range of data
- Outliers: points beyond whiskers
- Comparing multiple groups side by side
- What to look for: location, spread, outliers

**The AI Test (3-4 min)**

- Same dataset (measurements by machine/shift/line)
- Question: "Compare performance across these machines"
- Copilot's response
- VaRiScout's boxplot - what you see immediately
- Click to filter - drill into one group

**The ABB Application (2 min)**

- Real use case: comparing lines, machines, shifts
- The question engineers ask: "Which one is different?"
- Visual answer vs. statistical answer
- Follow-up questions that emerge from seeing

**The Honest Assessment (1-2 min)**

- AI: good at summarizing differences
- Visual: better at seeing patterns, outliers, distributions
- For ABB engineers: they needed to SEE and EXPLORE
- Both have their place

**Close (30 sec)**

- "AI can tell you Machine C is different"
- "VaRiScout shows you HOW it's different"
- CTA

---

## Boxplot Teaching Points

### What It Shows

- Center: median (middle value)
- Box: Q1 to Q3 (25th to 75th percentile)
- Whiskers: typical range
- Dots: outliers (unusual values)

### Comparing Groups

- Side by side boxes
- Compare: center (location), spread (width), outliers
- "Different?" = boxes don't overlap much

### What to Look For

- Location: Is one group higher/lower?
- Spread: Is one group more variable?
- Outliers: Are there unusual points?
- Shape: Are distributions symmetric?

### Plain Language

- "Which group is different?"
- "Where's the most variation?"
- "Are there outliers?"

---

## Clips to Cut

### Clip 1: "The AI Test" (45 sec)

- "Which machine has the most variation?"
- Copilot's response
- "Now look at this..." → boxplot

### Clip 2: "What is a Boxplot?" (60 sec)

- Quick visual explanation
- Box, whiskers, outliers
- Comparing groups

### Clip 3: "The Visual Difference" (45 sec)

- AI tells you "Machine C is different"
- Boxplot shows you HOW:
  - Higher median? Wider spread? More outliers?
- "That's what understanding looks like"

### Clip 4: "The Follow-up" (30 sec)

- "What about Machine C on night shift?"
- Click → filter → instant
- The exploration continues

---

## LinkedIn Posts

### Post 1: The Test (Monday)

```
I asked Copilot: "Which machine has the most variation?"

It analyzed the data and told me: "Machine C shows significantly higher variability..."

Good answer.

Then I made a boxplot.

I could SEE:
- Machine C's box is twice as wide
- There are 4 outliers on the high end
- The median is about the same as others

AI told me Machine C was different.
The boxplot showed me HOW it was different.

One is information.
The other is understanding.

Full comparison: [link]

#DataVisualization #AI #ProcessImprovement
```

### Post 2: Teaching Boxplots (Wednesday)

```
The boxplot is the fastest way to compare groups.

What you're looking at:
📦 The box = middle 50% of your data
➖ The line in the box = median (middle value)
📏 The whiskers = typical range
● The dots = outliers (unusual values)

Comparing groups:
→ Higher box = higher values
→ Wider box = more variation
→ More dots = more outliers

At ABB, engineers used this to compare:
- Machines
- Shifts
- Product lines
- Operators

One chart. Instant insight.

"Which one is different?" becomes obvious.

#Statistics #DataAnalysis #QualityManagement
```

### Post 3: Seeing vs. Being Told (Friday)

```
Two ways to learn "Machine C has more variation":

Way 1: AI tells you
"Analysis indicates Machine C exhibits statistically significant higher variance (p < 0.05) compared to other machines."

Way 2: You see it
[Boxplot showing Machine C with obviously wider box]

Both are true.

One builds understanding.
One gives information.

For process improvement, I want engineers who UNDERSTAND their processes.

Not engineers who ask AI for answers.

That's why we still need visual exploration.

[link]

#DataLiteracy #ProcessUnderstanding #Manufacturing
```

---

## Case Reference

**Use the Hospital Ward Case dataset:** `docs/cases/hospital-ward/data.csv`

This dataset shows:

- 28 days × 24 hours = 672 observations
- Hourly bed occupancy with clear time-of-day patterns
- Night shift peaks at 95%+, afternoon dips to 50%
- Daily average looks stable at 75% (aggregation trap)

**Connection to Week 5 Video:**

- Week 5 introduced the Hospital Ward case (aggregation trap)
- Week 8 revisits with AI comparison for group comparisons
- "Let's see if AI can spot the time-of-day pattern..."

**Sample questions for AI:**

- "Compare bed occupancy by time of day"
- "Which time period has the highest utilization?"
- "Is there significant variation between time periods?"

**Boxplot opportunity:**

- Group by Hour or Time_Period column
- Shows clear bimodal pattern (Night high, Afternoon low)
- AI may calculate averages but miss the operational implications

**Website reference:** /cases/hospital-ward

---

## Production Checklist

- [ ] Sample data prepared (Hospital Ward dataset)
- [ ] Video recorded
- [ ] Video edited
- [ ] Clips cut
- [ ] Blog written
- [ ] LinkedIn posts written
- [ ] Carousel designed
- [ ] All content scheduled

---

## Status

| Item          | Status |
| ------------- | ------ |
| **Published** | ⬜     |
