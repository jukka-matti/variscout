---
title: 'Investigation Showcase: Fill Weight'
audience: [analyst, developer]
category: workflow
status: stable
related: [investigation, findings, questions, suspected-cause, regression]
---

# Investigation Showcase: Fill Weight

**Purpose:** Demonstrates the full investigation workflow with pre-populated questions, findings, suspected cause hubs, and improvement ideas. This is the only sample dataset that loads with investigation state already in place.

## Scenario

A food packaging company operates 3 filling lines across 3 shifts. Customer complaints about overfilled packages triggered an investigation.

| Factor | Levels | Story |
|--------|--------|-------|
| Line | Line 1, Line 2, Line 3 | Line 2 has worn nozzle → mean shift +2g, 2× variation |
| Shift | Morning, Afternoon, Night | Night shift has 1.5× variation (fatigue) |
| Material_Batch | A, B, C, D | Batch C slightly low (ruled out — negligible effect) |
| Operator | Kim, Lee, Park | No significant effect |

**Specs:** LSL = 495g, USL = 505g, Target = 500g

## Pre-populated Investigation State

The dataset loads at a **mid-investigation** state:

### Questions (6)

| Question | Status | Factor | Evidence |
|----------|--------|--------|----------|
| Does the filling line affect fill weight? | Answered | Line | η² = 0.25, R²adj = 0.23 |
| Is Line 2's mean shift caused by nozzle wear? | Investigating | Line (gemba) | Pending inspection |
| Does shift affect fill weight variation? | Investigating | Shift | η² = 0.08 |
| Is night shift variation due to fatigue or maintenance? | Open | Shift (gemba) | — |
| Does material batch affect fill weight? | Ruled out | Material_Batch | η² = 0.02 |
| Does operator affect fill weight? | Ruled out | Operator | η² = 0.005 |

### Findings (5)

| Finding | Status | Key Insight |
|---------|--------|-------------|
| Line 2 runs consistently high (~502g) | Analyzed (key-driver) | Has What-If projection |
| Night shift has wider spread | Investigating | Linked to shift question |
| Batch C slightly low but within spec | Observed | Inconclusive |
| Line 2 + Night shift worst Cpk | Investigating | Interaction effect |
| Line 1 Morning = best-in-class | Analyzed (benchmark) | Cpk ~1.65 |

### Suspected Cause Hub (1)

**"Line 2 nozzle wear"** — connects the line and shift questions with associated findings. Evidence: R²adj = 0.23, selected for improvement.

### Improvement Ideas (2)

1. Replace worn nozzle on Line 2 (selected, low cost, days)
2. Add nozzle to weekly maintenance checklist (preventive)

## Teaching Points

1. **Regression equation** — Line factor alone explains 23% of variation (visible in EquationDisplay)
2. **Three evidence types** — data (η² auto-validation), gemba (nozzle inspection pending), analyst reasoning
3. **Question tree** — root questions generate sub-questions for deeper investigation
4. **Suspected cause hub** — synthesizes multiple evidence threads into one coherent story
5. **What-If projection** — Line 2 finding shows projected Cpk improvement from 0.49 to 1.67
6. **Ruled-out factors** — Material batch and operator are systematically eliminated

## Data Structure

~216 observations (3 lines × 3 shifts × 4 batches × 3 operators × 2 replicates)

```
Observation, Fill_Weight_g, Line, Shift, Material_Batch, Operator
1, 500.3, Line 1, Morning, Batch A, Kim
2, 499.8, Line 1, Morning, Batch A, Kim
...
```

## Platform Availability

| Feature | PWA | Azure |
|---------|-----|-------|
| Data + charts | ✓ | ✓ |
| Questions (PI Panel) | ✓ | ✓ |
| Findings | ✓ | ✓ |
| Suspected cause hubs | — | ✓ |
| Improvement ideas | — | ✓ |
