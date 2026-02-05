# Quick Check Workflow

A 5-minute analysis pattern for daily/shift-level monitoring.

## Overview

The Quick Check is a rapid assessment pattern for routine monitoring. Use it to catch problems early before they become major issues.

## When to Use

- Start of shift
- After process changeover
- Daily quality check
- Before shipment approval
- After maintenance

## The 5-Minute Pattern

| Step | Focus      | What to Look For           |
| ---- | ---------- | -------------------------- |
| 1    | I-Chart    | Points outside limits?     |
| 2    | Capability | Cpk dropped?               |
| 3    | Boxplot    | Any factor suddenly worse? |
| 4    | Pareto     | New defect type appearing? |
| 5    | Document   | Note issues found          |

## Step-by-Step

### Step 1: I-Chart Scan (30 seconds)

**Look for:**

- [ ] Any points outside UCL or LCL
- [ ] Runs of 9+ points on one side
- [ ] Obvious trends up or down
- [ ] Unusual patterns

**If issues found:** Note the time/sample where problem appears.

**Quick interpretation:**

| Pattern         | Likely Cause                        |
| --------------- | ----------------------------------- |
| Point above UCL | Something went wrong at that moment |
| Point below LCL | Different type of special cause     |
| Run on one side | Process shifted                     |
| Trend           | Gradual drift (wear, temperature)   |

### Step 2: Capability Check (30 seconds)

**Look at:**

- Current Cpk value
- Comparison to target (usually 1.33)
- Change from last check

**Quick interpretation:**

| Cpk      | Status                    |
| -------- | ------------------------- |
| ≥ 1.33   | Good - proceed            |
| 1.0-1.33 | Warning - monitor closely |
| < 1.0    | Alert - investigate now   |

!!! tip "Baseline Comparison"
Know your typical Cpk. A drop from 1.5 to 1.2 is significant even though 1.2 is "OK."

### Step 3: Boxplot Scan (1 minute)

**Quick scan for:**

- Any factor showing unexpectedly high η²
- Any box that looks different from usual
- Outliers appearing in one factor level

**If something stands out:**

- Click to drill down
- Check if it's a data issue or real effect
- Note the factor and level

### Step 4: Pareto Review (1 minute)

**Look for:**

- New defect category appearing
- Existing category getting worse
- Change in the "vital few"

**Quick comparison:**

- Is the top defect still the top?
- Any new entries in top 3?
- Overall defect count trending?

### Step 5: Document (2 minutes)

**If no issues:**

```
Shift check: [Date/Time]
Status: OK
Cpk: [value]
Notes: Process running normally
```

**If issues found:**

```
Shift check: [Date/Time]
Status: ALERT
Issue: [Description]
Chart: [Which chart showed it]
Filter: [If you drilled down]
Action: [What you'll do]
```

## Quick Check Checklist

Print or keep handy:

```
QUICK CHECK - [Date] [Shift]

[ ] I-Chart
    [ ] All points within limits
    [ ] No runs or trends
    Noted: _______________

[ ] Capability
    Cpk: _______
    [ ] ≥1.33  [ ] 1.0-1.33  [ ] <1.0

[ ] Boxplot
    [ ] No unexpected high η²
    [ ] No unusual outliers
    Noted: _______________

[ ] Pareto
    [ ] Top defects unchanged
    [ ] No new categories
    Noted: _______________

Overall: [ ] OK  [ ] Monitor  [ ] Alert
Signature: _____________
```

## Escalation Guide

### Green: All Clear

- Continue normal operations
- Log the check
- No immediate action needed

### Yellow: Monitor

At least one of:

- Cpk between 1.0-1.33
- Point near but not outside limits
- New factor showing moderate effect

**Action:**

- Continue monitoring
- Check more frequently
- Alert supervisor

### Red: Alert

At least one of:

- Point outside control limits
- Cpk below 1.0
- Major shift in Pareto

**Action:**

- Stop and investigate
- Document findings
- Escalate to engineering
- Consider holding product

## Shortcuts for Speed

### Keyboard Navigation

| Key          | Action                |
| ------------ | --------------------- |
| `Tab`        | Move between charts   |
| `Arrow keys` | Navigate within chart |
| `Enter`      | Select/drill down     |
| `Esc`        | Clear filter          |

### Pre-Set Views

Save a "Quick Check" view with:

- I-Chart prominent
- Capability visible
- Boxplot showing top factor
- Pareto showing defects

## Common Quick Check Findings

### "Point Outside Limits"

**Immediate actions:**

1. Check if data entry error
2. Identify the specific sample
3. Look at surrounding samples
4. Check process logs for that time

### "Cpk Dropped"

**Immediate actions:**

1. Check both Cp and Cpk
2. Look at histogram shape
3. Is it centering or spread?
4. Check recent samples vs historical

### "New Defect Category"

**Immediate actions:**

1. Verify categorization is correct
2. Check when it started
3. Look for pattern (shift, machine, etc.)
4. Investigate root cause

## Frequency Recommendations

| Process Risk             | Check Frequency |
| ------------------------ | --------------- |
| High (safety critical)   | Every hour      |
| Medium (customer impact) | Every shift     |
| Low (internal)           | Daily           |
| Stable, proven           | Weekly          |

## Integration with Deep Dive

Quick Check finds the problem. [Deep Dive](deep-dive.md) solves it.

```
Quick Check → Alert → Deep Dive
             ↓
           OK → Log and continue
```

## Related Documentation

- [Deep Dive Workflow](deep-dive.md)
- [I-Chart Feature](../analysis/i-chart.md)
- [Capability Feature](../analysis/capability.md)
- [Nelson Rules](../analysis/nelson-rules.md)
