# Assembly Line Bottleneck Analysis

## The Problem

A Production Manager or Industrial Engineer has a line that's below throughput target. Management points at Station 3 because it has the highest average cycle time. But is that actually the bottleneck? The real bottleneck might be a station with lower average but wildly inconsistent cycle times — unpredictability starves downstream stations more than a consistently slow one.

The data exists in the MES or a cycle time spreadsheet, but it's displayed as averages and bar charts. Nobody looks at the _variation_ — and that's where the real answer hides.

## Target Searcher

| Role                            | Industry                   | Searches for                                                       | Current tool                       |
| ------------------------------- | -------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| Production / IE Manager         | Manufacturing, Assembly    | "bottleneck analysis manufacturing," "cycle time variation"        | MES dashboards, Excel averages     |
| Continuous Improvement Engineer | Any production environment | "production bottleneck identification," "line balancing variation" | Value stream maps, time studies    |
| Operations Supervisor           | Assembly, Packaging        | "where is my bottleneck," "throughput analysis"                    | Gut feel, Pareto of downtime codes |

## Keyword Cluster

**Primary:**

- bottleneck analysis manufacturing
- cycle time variation analysis
- production bottleneck identification

**Long-tail:**

- how to find bottleneck with data
- cycle time variation vs average
- which station is the real bottleneck
- line balancing using variation data
- throughput analysis beyond averages

**Related queries:**

- SPC for cycle times
- control chart for production line
- variation analysis assembly line
- Theory of Constraints variation
- bottleneck analysis tool free

## The VariScout Journey

1. **Paste cycle time data** — rows with Station, Operator, Shift, Product Variant, Cycle Time columns
2. **I-Chart** — all stations combined shows instability (mixed signals — expected)
3. **Boxplot by Station** — surprise: Station 2 has a wider box than Station 3. eta-squared: "Station explains 28% of variation, but Station 2 _dominates_ the spread"
4. **Drill-down: Station 2** — filter, then boxplot by Operator. One operator has 3x the variation of the others
5. **Drill-down: Station 2 + Operator B** — I-Chart shows special causes on alternating shifts
6. **Boxplot by Product Variant** — Product Variant C takes significantly longer at Station 2 (design issue, not operator issue)
7. **Staged analysis** — before/after the last changeover: Station 2 setup procedure is the root cause

**Aha moment:** "Station 3 has the highest average, but it's _stable_ — consistently 45 seconds. Station 2 averages 38 seconds but ranges from 25 to 70. The unpredictability in Station 2 causes waiting and starvation downstream. The bottleneck isn't where the average is highest — it's where the variation is highest."

## Before / After

| Before VariScout                      | After VariScout                                           |
| ------------------------------------- | --------------------------------------------------------- |
| "Station 3 is the bottleneck" (wrong) | Station 2's _variation_ is the real constraint            |
| Improvement effort on wrong station   | Focused effort on Station 2 setup and Operator B training |
| Averages hide the problem             | Boxplot + eta-squared reveal variation structure          |
| Days of time study analysis           | 30-second paste-and-analyze                               |
| No quantification of impact           | "Station 2 explains 28% of total cycle time variation"    |

## Website Content Map

**Landing page:** `/solutions/bottleneck-analysis`

- Headline: "Your bottleneck isn't where you think it is."
- Key message: Averages point you to the wrong station. Variation analysis finds the real constraint.
- Interactive demo: 5-station cycle time dataset

**Case study:** Assembly line with 5 stations, 3 shifts, 4 operators — bottleneck case in `packages/data`

- Narrative: "Management blamed Station 3. The data told a different story."
- Walk through the aggregation trap step by step
- Show eta-squared quantifying station contribution

**Blog posts:**

- "The Aggregation Trap: Why Averages Find the Wrong Bottleneck" (methodology)
- "Variation Analysis for Production Lines: A 5-Minute Guide" (educational)
- "Beyond Theory of Constraints: Using SPC to Find Real Bottlenecks" (advanced)

**Social:**

- LinkedIn: "We spent 3 months optimizing the wrong station. Here's how 30 seconds of data analysis would have found the real bottleneck." (narrative)
- YouTube: "The Aggregation Trap" — 3-minute explainer with VariScout demo

## Platform Fit

| Stage              | Product                 | Why                                                                             |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------- |
| Investigation      | **PWA** (free)          | Paste cycle time export, find the bottleneck in minutes                         |
| Ongoing monitoring | **Excel Add-in** (free) | Connect to MES export spreadsheet, slicer by station/shift                      |
| Team analysis      | **Azure App** (paid)    | Multiple engineers, Performance Mode across stations, shared drill-down history |
