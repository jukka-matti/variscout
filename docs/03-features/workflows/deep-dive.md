# Deep Dive Workflow

A 30-minute systematic investigation pattern for problem-solving.

## Overview

The Deep Dive is a structured analysis approach for investigating problems. Use it when a Quick Check reveals issues, or when you need to thoroughly understand a process.

## When to Use

- Quick Check found an alert
- Customer complaint received
- Process change evaluation
- Root cause investigation
- Process improvement project
- New process qualification

## The 30-Minute Structure

| Phase             | Focus                 | Deliverable                |
| ----------------- | --------------------- | -------------------------- |
| 1. Baseline       | Full dataset overview | Current state summary      |
| 2. Stability      | I-Chart analysis      | Stability assessment       |
| 3. Stratification | Drill-down workflow   | Top variation drivers      |
| 4. Capability     | Filtered subset Cpk   | Capability of problem area |
| 5. Documentation  | Export findings       | Filter path + evidence     |

## Phase 1: Baseline (5 minutes)

### Objective

Understand what you're working with before diving in.

### Actions

1. **Review the data**
   - How many samples?
   - What time period?
   - Which factors are available?

2. **Check overall metrics**
   - Mean and standard deviation
   - Overall Cpk
   - Total defect count

3. **Note the context**
   - What's the business problem?
   - What changed recently?
   - What do stakeholders expect?

### Deliverable

```
BASELINE SUMMARY
───────────────────────────
Samples: 847
Period: 2024-01-15 to 2024-01-21
Factors: Shift (3), Operator (5), Machine (4)

Overall Cpk: 0.89 (Poor)
Mean: 100.3g (Target: 100.0g)
Defects: 42 (5.0%)

Context: Customer complaint about underweight packages
Question: Why is Cpk below 1.0?
```

## Phase 2: Stability (5 minutes)

### Objective

Determine if the process is in statistical control.

### Actions

1. **Review I-Chart**
   - Any points outside limits?
   - Any Nelson Rule violations?
   - Patterns or trends?

2. **Identify special causes**
   - When did they occur?
   - How many are there?
   - Single events or recurring?

3. **Assess stability**
   - Stable: Common cause variation only
   - Unstable: Special causes present

### Deliverable

```
STABILITY ASSESSMENT
───────────────────────────
Status: UNSTABLE

Violations found:
- 3 points above UCL (samples 45, 189, 567)
- Run of 9 below mean (samples 200-208)

Pattern: Special causes cluster on Day shift
Implication: Need to investigate Day shift separately
```

### Decision Point

| Finding  | Next Step                        |
| -------- | -------------------------------- |
| Stable   | Proceed to stratification        |
| Unstable | Investigate special causes first |

## Phase 3: Stratification (10 minutes)

### Objective

Identify what factors explain the variation.

### Actions

1. **Review Boxplot η² values**
   - Which factor explains most?
   - Are there multiple significant factors?

2. **Drill down systematically**
   - Start with highest η²
   - Apply filter
   - Check remaining factors
   - Continue until 50%+ isolated

3. **Track your path**
   - Note each filter applied
   - Record contribution percentages
   - Watch variation funnel

### Drill-Down Record

```
STRATIFICATION PATH
───────────────────────────
All data → Cpk: 0.89

Filter: Shift = Day (η² = 42%)
└─ Cpk: 0.71
   Remaining: Machine (η² = 28%)

Filter: Machine = 3 (η² = 28%)
└─ Cpk: 0.52
   Remaining: Operator (η² = 12%)

Filter: Operator = New (η² = 12%)
└─ Cpk: 0.38

Total variation isolated: 82%
```

### Interpretation

```
STRATIFICATION FINDINGS
───────────────────────────
Primary driver: Day shift + Machine 3 + New Operator
Combined effect: 82% of variation explained

This combination represents:
- 15% of samples
- But causes most of the capability problems
```

## Phase 4: Capability (5 minutes)

### Objective

Quantify the impact and identify improvement potential.

### Actions

1. **Check capability at each level**
   - Compare filtered vs unfiltered Cpk
   - Identify where capability fails

2. **Calculate improvement potential**
   - What if we fixed the worst area?
   - What Cpk would we achieve?

3. **Check distribution shape**
   - Normal distribution?
   - Bimodal (mixed populations)?
   - Skewed?

### Capability Analysis

```
CAPABILITY COMPARISON
───────────────────────────
Subset                          Cpk    n
───────────────────────────────────────────
All data                        0.89   847
Excluding Day shift             1.24   412
Excluding Machine 3             1.18   695
Day + Machine 3 + New Operator  0.38   127

IMPROVEMENT POTENTIAL
If Day/Machine 3/New Operator fixed:
- Expected Cpk: 1.15 to 1.35
- Defects reduced by ~70%
```

## Phase 5: Documentation (5 minutes)

### Objective

Create actionable output that can be shared and tracked.

### Actions

1. **Summarize findings**
   - What's the root cause?
   - How certain are we?
   - What's the impact?

2. **Export evidence**
   - Filter path used
   - Key charts as images
   - Statistical summary

3. **Recommend actions**
   - What should be fixed?
   - Who owns it?
   - How will we verify?

### Deep Dive Report

```
DEEP DIVE REPORT
═══════════════════════════════════════════════════

PROBLEM STATEMENT
Customer complaints about underweight packages (5% defect rate)

FINDINGS
Root Cause: Machine 3 operated by New Operator on Day shift
Confidence: High (82% of variation explained)
Impact: This combination creates 70% of underweight packages

EVIDENCE
- Filter path: Shift=Day → Machine=3 → Operator=New
- Cpk drops from 0.89 (overall) to 0.38 (filtered)
- I-Chart shows special causes during Day shift

ANALYSIS
New Operator was not trained on Machine 3's specific quirks.
Machine 3 requires different fill timing due to worn seals.

RECOMMENDED ACTIONS
1. Train New Operator on Machine 3 setup [Owner: Training]
2. Schedule Machine 3 seal replacement [Owner: Maintenance]
3. Re-run analysis after fixes [Owner: Quality]

VERIFICATION CRITERIA
- Cpk ≥ 1.0 for Day/Machine 3/New Operator subset
- No points outside control limits
- Customer complaint rate < 1%

TIMELINE
Training: Complete by Friday
Seal replacement: Complete by end of month
Verification: 1 week after both actions complete

───────────────────────────────────────────────────
Analyst: [Name]
Date: [Date]
Filter path: Shift=Day → Machine=3 → Operator=New
```

## Time Management Tips

| Phase          | If Running Short            | If Have Extra Time        |
| -------------- | --------------------------- | ------------------------- |
| Baseline       | Focus on key metrics        | Explore data distribution |
| Stability      | Note obvious violations     | Check all Nelson Rules    |
| Stratification | Stop at 50% explained       | Continue to 70%+          |
| Capability     | Compare overall vs filtered | Check Cp vs Cpk           |
| Documentation  | Summary only                | Full report + charts      |

## Integration with Quick Check

```
Quick Check (5 min) → Alert found
         ↓
Deep Dive (30 min) → Root cause identified
         ↓
Action plan → Fix implemented
         ↓
Quick Check (5 min) → Verify improvement
```

## When 30 Minutes Isn't Enough

### Extend to 60 Minutes

- More complex problems
- Multiple interacting factors
- Need to check interactions

### Split into Sessions

1. Session 1: Baseline + Stability
2. Session 2: Stratification (more thorough)
3. Session 3: Capability + Documentation

### Involve Others

- Bring in process experts
- Review findings with operators
- Get engineering input

## Checklist

```
DEEP DIVE CHECKLIST
═══════════════════════════════════════════════════

Phase 1: Baseline (5 min)
[ ] Reviewed data scope
[ ] Noted overall metrics
[ ] Understood business context

Phase 2: Stability (5 min)
[ ] Checked I-Chart
[ ] Identified special causes
[ ] Assessed stability status

Phase 3: Stratification (10 min)
[ ] Reviewed all factors
[ ] Drilled down systematically
[ ] Isolated 50%+ of variation
[ ] Recorded filter path

Phase 4: Capability (5 min)
[ ] Compared filtered vs unfiltered Cpk
[ ] Calculated improvement potential
[ ] Checked distribution shape

Phase 5: Documentation (5 min)
[ ] Summarized findings
[ ] Exported evidence
[ ] Recommended actions

Total time: _____ minutes
```

## Related Documentation

- [Quick Check Workflow](quick-check.md)
- [Four Pillars Workflow](four-pillars-workflow.md)
- [Drill-Down Workflow](drill-down-workflow.md)
- [Decision Trees](decision-trees.md)
