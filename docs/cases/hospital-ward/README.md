# Hospital Ward Case - ABB/Practitioner Context

## Campaign Position

**Week 5** - "Hospital Ward" (Aggregation Case)
**Week 8** - AI Comparison using same dataset

## Origin

Teaching case for practitioner training. Demonstrates the aggregation trap - how daily/weekly averages hide operational reality.

## The Setup

A hospital ward has 20 beds. The management dashboard shows "75% average utilization" - suggesting comfortable spare capacity. Administrators are considering reducing staffing during "low demand" periods.

**The twist:** The 75% daily average hides two critical realities:

- Night shift regularly hits 95%+ (crisis level)
- Afternoon dips to 50% (apparent waste)

## The Problem Statement

> "The dashboard showed 75%. Everything looked fine. But the nurses knew something was wrong..."

## VaRiScout Analysis

### Phase 1: Daily View (What Management Sees)

| Chart   | What It Shows                                               |
| ------- | ----------------------------------------------------------- |
| I-Chart | Daily utilization % - stable around 75% with control limits |

**Management conclusion:** "We have 25% spare capacity. Consider reducing night staff."

### Phase 2: Hourly View (What's Actually Happening)

| Chart   | What It Shows                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------- |
| I-Chart | Hourly bed occupancy - wild variation visible                                                   |
| Boxplot | Utilization by Hour → Night (22:00-06:00) peaks at 95%+, Afternoon (14:00-16:00) valleys at 50% |
| Boxplot | Utilization by Day of Week → Sunday highest, Wednesday lowest                                   |

**The reveal:** "That 75% average hides crisis-level peaks and wasteful valleys."

## Three-Act Structure

### Act 1: The Problem

Show the daily dashboard. 75% average looks stable. Management's conclusion seems reasonable.

**Key visualization:** Daily I-Chart - process appears in control at 75%

### Act 2: Your Turn

Interactive VaRiScout demo. User explores hourly data.

**Guided questions:**

- "Switch to hourly view. What pattern emerges?"
- "Use boxplot by Hour. When does occupancy peak?"
- "What happens at night? What happens in afternoon?"

### Act 3: The Solution

The hourly analysis reveals:

- **Night (22:00-06:00):** 95% average, hitting 100% several nights
- **Afternoon (14:00-16:00):** 50% average
- **The aggregation trap:** Daily average = (95 + 50) / 2 ≈ 75%

**Business impact:**

- Reducing night staff would create patient safety crisis
- Afternoon "waste" is actually discharge processing time
- Solution: Flex staffing by time of day, not uniform reduction

## Teaching Points

| Concept                     | Learning                                      |
| --------------------------- | --------------------------------------------- |
| Aggregation hides variation | Daily averages mask hourly reality            |
| Dashboards can mislead      | KPIs optimized for executives, not operations |
| Granularity matters         | The right time resolution reveals patterns    |
| Question the summary        | "75% average" doesn't mean "75% all the time" |

## Key Message

> "Why your dashboard is lying"
>
> "What your daily average hides"

## AI Comparison (Week 8)

Same dataset analyzed with VaRiScout vs Copilot Analyst Agent:

- **VaRiScout:** Hour-by-hour boxplot instantly shows bimodal pattern
- **Copilot Analyst:** Calculates daily average correctly, may not think to disaggregate
- **Teaching point:** AI answers the question you ask. EDA helps you ask better questions.

## Linked Filtering Demonstration

- Click "Night" in hour boxplot → I-Chart filters to show only night observations
- Reveals: Night shift is consistently at crisis, not random peaks

## Dataset

### File: `data.csv`

| Column          | Description                     | Type        |
| --------------- | ------------------------------- | ----------- |
| Date            | Date (2026-01-01 to 2026-01-28) | date        |
| Hour            | Hour of day (0-23)              | int         |
| Day_of_Week     | Mon-Sun                         | categorical |
| Time_Period     | Night/Morning/Afternoon/Evening | categorical |
| Beds_Occupied   | Number of beds occupied (0-20)  | int         |
| Utilization_pct | Beds_Occupied / 20 \* 100       | numeric     |

### Data Characteristics

- 28 days × 24 hours = 672 observations
- Overall average: 75%
- Night hours (22:00-06:00): Mean 95%, occasional 100%
- Afternoon hours (14:00-16:00): Mean 50%
- Morning/Evening: Mean 70-80%

### Sample Rows

```csv
Date,Hour,Day_of_Week,Time_Period,Beds_Occupied,Utilization_pct
2026-01-01,0,Wed,Night,19,95
2026-01-01,1,Wed,Night,19,95
2026-01-01,2,Wed,Night,18,90
...
2026-01-01,14,Wed,Afternoon,10,50
2026-01-01,15,Wed,Afternoon,11,55
...
```

## Video Script Notes

### Hook (0-15 sec)

"Your dashboard says 75%. Your staff is burned out. Something doesn't add up."

### Story (15 sec - 3 min)

- Show the hospital ward context (20 beds)
- Display the management dashboard: 75% utilization
- Administrator's request: "We have spare capacity. Cut night staffing."
- Nurse's pushback: "But we're always full at night!"
- "Who's right? Let's look at the data..."

### Reveal (3-4 min)

- Open VaRiScout with hourly data
- Start with daily summary (confirms 75%)
- Switch to hourly view
- Create boxplot by Hour
- "Look at night hours. 95%. Look at afternoon. 50%."
- "The average? Exactly 75%. But the reality is completely different."

### CTA (4-5 min)

- "What's your dashboard hiding?"
- "Try VaRiScout at variscout.com"
- "See what your averages don't show."

## Gage R&R Applicability

**Not applicable** - bed counts are counts, not continuous measurements. No measurement system to validate.

## Connection to Other Cases

- **Bottleneck:** Shows variation in process times
- **Hospital Ward:** Shows variation hidden by aggregation
- **Together:** Two ways averages mislead us

---

_Case created for: VaRiScout Content Campaign Week 5_
_Teaching level: Understanding aggregation and time-based patterns_
_Prerequisites: Basic I-Chart and Boxplot understanding (Weeks 2-3)_
