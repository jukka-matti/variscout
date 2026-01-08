# Packaging Line Case

**Location:** Food packaging facility, Africa
**Context:** Multi-product packaging line quality analysis
**Campaign Week:** 9 (Phase 3 - Africa)
**Website:** /cases/packaging

---

## Overview

A practical case from real work in Africa, demonstrating:

1. **Defect Analysis:** Prioritization using Pareto and tracking over time
2. **Process Diagnosis:** Connecting defect outcomes to process parameters
3. **Gage R&R:** Validating the fill weight measurement system

---

## The Story

### Part 1: "Where Should We Focus?"

**The setup:**
A packaging facility tracks defects across multiple products. Management wants to reduce defect-related costs but doesn't know where to focus improvement efforts.

**The question:**
Which product has the biggest problem, and what type of defects are we seeing?

**VaRiScout analysis:**

- Boxplot: Defect % by product → Product C highest and most variable
- I-Chart: Defect % over time with target line → recent weeks crossing target
- Pareto: Defect types → underfill dominates
- Business translation: Convert defect % to €/week

**The insight:**
"We know Product C has an underfill problem costing €X per week."

### Part 2: "What's Driving the Underfill?"

**The question:**
Defect counts can't tell us _why_ the underfills happen. What's driving the variation?

**VaRiScout analysis:**

- Histogram: Distribution shape - centered? skewed? bimodal?
- I-Chart: Fill weights over time - drift? shift?
- Boxplot: By shift or line - is one factor driving it?
- Capability: Against spec limits - where does the distribution sit?

**The insight:**
"Night shift is systematically underfilling - averaging 495.5g while Day and Evening shifts average 498.5g. Night shift Cpk is below 1.0."

### Part 3: "Is Our Scale Consistent?"

**The question:**
Before we retrain Night shift operators or adjust their filling equipment... is our QC scale giving consistent readings?

**The answer:**
A Gage R&R study validates the scale. With %GRR around 12% (marginal but acceptable), the 3g difference between Night and Day shifts is real, not measurement error.

---

## Teaching Points

| Concept               | What VaRiScout Shows                                |
| --------------------- | --------------------------------------------------- |
| Pareto prioritization | Focus on the vital few defect types                 |
| Factor comparison     | Boxplot reveals Night shift is different            |
| Two data types        | Counts (defects) vs. measurements (fill weights)    |
| Process vs. outcome   | Defects show _what_, measurements show _why_        |
| MSA validation        | Confirm measurement system before blaming operators |

---

## Datasets

### 1. Defect Tracking Data (`defects.csv`)

| Column         | Type     | Description                                                   |
| -------------- | -------- | ------------------------------------------------------------- |
| Date           | Date     | Production date                                               |
| Product        | Factor   | A, B, C, D                                                    |
| Units_Produced | Integer  | Daily production volume                                       |
| Defect_Count   | Integer  | Number of defective units                                     |
| Defect_Type    | Category | Seal_Failure, Label_Error, Underfill, Overfill, Contamination |
| Defect_Percent | Float    | Defect_Count / Units_Produced × 100                           |

**Built-in patterns:**

- Product C has highest defect rate (~3-4%)
- Underfill is dominant defect type for Product C
- Defect rate trending upward over time

### 2. Fill Weight Data (`fillweights.csv`)

| Column        | Type     | Description                  |
| ------------- | -------- | ---------------------------- |
| Sequence      | Integer  | Sample sequence number       |
| Timestamp     | DateTime | Sample collection time       |
| Fill_Weight_g | Float    | Measured fill weight (grams) |
| Shift         | Factor   | Day, Evening, Night          |

**Built-in patterns:**

- Target: 500g, LSL: 493g
- Day shift: Mean ~498.5g, stable
- Evening shift: Mean ~498.5g, stable
- Night shift: Mean ~495.5g, more variable
- Night shift has Cpk below 1.0

### 3. Fill Weight Gage R&R Data (`fillweight-grr.csv`)

| Column   | Type    | Description                                |
| -------- | ------- | ------------------------------------------ |
| Part     | Integer | Package ID (1-10)                          |
| Operator | String  | Operator ID (Day_Op, Evening_Op, Night_Op) |
| Trial    | Integer | Trial number (1, 2, 3)                     |
| Weight_g | Float   | Weight reading (grams)                     |

**Study design:**

- 10 packages spanning weight range (493.8g - 502.3g)
- 3 operators × 3 trials = 90 measurements
- Expected %GRR: ~12% (Marginal - acceptable for this application)

---

## Key Visuals

1. **Pareto Chart** - Defect types for Product C (Underfill dominates)
2. **I-Chart** - Fill weights over time with control limits
3. **Boxplot** - Fill weight by Shift (Night shift lower and wider)
4. **Capability Analysis** - Distribution vs. spec limits (LSL = 493g)
5. **Gage R&R Chart** - Variance breakdown by source

---

## Business Context (Africa)

This case reflects real constraints in developing economies:

- Resource constraints: can't fix everything at once, need to prioritize
- Simple tools: no expensive software, browser-based analysis
- Practical decisions: where to invest limited improvement resources
- Cost sensitivity: underweight penalties vs. overfill giveaway

---

## Two-Dataset Lesson

Different questions need different data:

| Question               | Data Type            | Example                    |
| ---------------------- | -------------------- | -------------------------- |
| What is happening?     | Defect counts        | Underfill rate trending up |
| Why is it happening?   | Process measurements | Night shift running 3g low |
| Can we trust the data? | MSA study            | Scale is reliable          |

---

## VaRiScout Demo Flow

### Module 1: Defect Prioritization

1. Load `defects.csv`
2. Filter to Product C
3. Create Pareto chart of defect types
4. Create I-Chart of defect % over time
5. Identify: Underfill is the priority

### Module 2: Process Diagnosis

1. Load `fillweights.csv`
2. Create I-Chart of fill weights
3. Create Boxplot by Shift
4. Run Capability analysis (LSL = 493g)
5. Identify: Night shift is the problem

### Module 3: Measurement Validation

1. Load `fillweight-grr.csv`
2. Configure Gage R&R
3. View variance breakdown
4. Verdict: %GRR = 12% → Marginal but acceptable
5. Confirm: The 3g Night shift offset is real

---

## Core Message

_"Defect counts tell you WHAT is happening. Process measurements tell you WHY."_

_"Before you blame operators, verify your measurement system."_

---

## Linked Filtering Demonstration

- **Week 1:** Click Product C in boxplot → Pareto updates to show only Product C defect types
- **Week 2:** Click Night shift in boxplot → I-Chart and histogram update to show only Night shift data

---

_Case developed for VaRiScout Lite demonstration_
_Origin: Real case from Jukkis's work in Africa_
