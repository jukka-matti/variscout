# Bottleneck Case - ESTIEM

## Campaign Position

**Week 1** - The Conversion Video ("The Bottleneck")

## Origin

Teaching case from ESTIEM Lean Six Sigma training. Demonstrates how process flow analysis reveals hidden variation sources.

## The Setup

A manufacturing process has 5 sequential steps. Management has always blamed Step 3 for delays and is considering a €50,000 equipment upgrade for that station.

**The twist:** When you actually look at the data, Step 2 has 3x the variation of Step 3. Step 3's average time is higher, but Step 2's inconsistency is what's creating the backlog.

## The Problem Statement

> "This process had 5 steps. Step 3 was always blamed for delays. The manager wanted to invest in Step 3 equipment. But look what happens when we actually see the data..."

## VaRiScout Analysis

### Charts Used

| Chart   | What It Shows                                                                     |
| ------- | --------------------------------------------------------------------------------- |
| I-Chart | Cycle times for each step - Step 2 shows high variation, Step 3 is stable         |
| Boxplot | Cycle time by Process Step - reveals Step 2's wide spread vs Step 3's consistency |

### The Reveal

- **Average cycle times:** Step 3 = 45 sec, Step 2 = 38 sec
- **Variation (Range):** Step 3 = 8 sec, Step 2 = 24 sec
- **The insight:** "Step 2 had 3x the variation. It WAS the bottleneck."

## Three-Act Structure

### Act 1: The Problem

Show the averages. Step 3 looks worst at 45 seconds average. Management's conclusion seems reasonable.

**Key visualization:** Bar chart of averages - Step 3 is tallest

### Act 2: Your Turn

Interactive VaRiScout demo. User explores the data themselves.

**Guided questions:**

- "Click on the boxplot. What do you notice about the spread?"
- "Look at the I-Chart. Which step has the most unpredictable timing?"

### Act 3: The Solution

The variation analysis reveals the truth. Step 2's inconsistency (24-second range) causes more downstream delays than Step 3's consistently higher but predictable timing.

**Business impact:**

- Investing €50k in Step 3 would not solve the problem
- Step 2 investigation reveals: operator training issue, equipment not standardized
- Actual fix: €5k training + standardized work instructions

## Teaching Points

| Concept               | Learning                                 |
| --------------------- | ---------------------------------------- |
| Averages can mislead  | High average ≠ biggest problem           |
| Variation matters     | Predictable slow > unpredictable fast    |
| Visual analysis first | The pattern tells the story before stats |
| Question assumptions  | "We always blamed Step 3" isn't evidence |

## Key Message

> "What's hiding in YOUR process?"

## AI Comparison (Week 4)

Same dataset analyzed with VaRiScout vs Copilot Analyst Agent:

- **VaRiScout:** Instantly shows boxplot variation, I-Chart patterns visible
- **Copilot Analyst:** Calculates averages correctly, may miss variation story
- **Teaching point:** AI is great at calculation, but visual EDA catches what matters

## Linked Filtering Demonstration

- Click Step 2 in boxplot → I-Chart filters to show only Step 2 observations
- Time series reveals: first half of shift stable, second half variable (fatigue?)

## Dataset

### File: `data.csv`

| Column         | Description           | Type        |
| -------------- | --------------------- | ----------- |
| Observation    | Sequential ID (1-150) | int         |
| Step           | Process step (1-5)    | categorical |
| Cycle_Time_sec | Time to complete step | numeric     |
| Shift          | Morning/Afternoon     | categorical |
| Day            | Mon-Fri               | categorical |

### Data Characteristics

- 30 observations per step (150 total)
- Step 2: Mean 38 sec, SD 8 sec (high variation)
- Step 3: Mean 45 sec, SD 2.7 sec (low variation)
- Other steps: Means 30-35 sec, SD 3-4 sec (moderate)

### Sample Rows

```csv
Observation,Step,Cycle_Time_sec,Shift,Day
1,1,32,Morning,Mon
2,1,34,Morning,Mon
3,1,31,Morning,Mon
...
31,2,28,Morning,Mon
32,2,52,Morning,Mon
33,2,36,Morning,Mon
...
```

## Video Script Notes

### Hook (0-15 sec)

"Every factory has a Step 3. The step everyone complains about. The one management wants to upgrade. But what if they're wrong?"

### Story (15 sec - 3 min)

- Walk through the 5-step process
- Show the average times (Step 3 looks worst)
- Manager's request: €50k upgrade for Step 3
- "But I said: let me see the data first..."

### Reveal (3-4 min)

- Open VaRiScout
- Paste the data
- Click boxplot
- "Look at Step 2. That spread. That's your bottleneck."
- Explain variation vs average

### CTA (4-5 min)

- "What's hiding in YOUR process?"
- "Try VaRiScout free at variscout.com"
- "Same data, different insight."

---

_Case created for: VaRiScout Content Campaign Week 1_
_Teaching level: Introduction to variation analysis_
_Prerequisites: None - this is the entry point_
