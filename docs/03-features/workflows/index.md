# Analyst Workflows

How analysts use VariScout to solve real problems.

## What Are Workflows?

Workflows describe **what analysts actually DO** inside VariScout—the sequence of charts, filters, and decisions that lead to actionable insights. While feature documentation explains what each tool does, workflows show how to combine them effectively.

## Core Workflows

### [Four Pillars Analysis](four-pillars-workflow.md)

The foundational methodology: **CHANGE → FLOW → FAILURE → VALUE**

```
I-Chart → Boxplot → Pareto → Capability
```

Use this progression for systematic root cause analysis.

### [Drill-Down Analysis](drill-down-workflow.md)

VariScout's signature interaction pattern—progressive stratification using filter chips to isolate variation sources.

- Filter chips show contribution percentage
- Cumulative tracking in variation funnel
- Multi-select for combined effects

### [Performance Mode](performance-mode-workflow.md)

Multi-channel analysis for production equipment:

- Fill heads
- Cavities
- Nozzles
- Zones

Compare all channels at once, then drill into the worst performer.

## Specialized Workflows

### [MSA/Gage R&R Study](msa-workflow.md)

Validate your measurement system before drawing conclusions:

- When to run MSA
- Study design (operators × parts × trials)
- Interpreting %GRR results

### [Decision Trees](decision-trees.md)

"Which chart should I use?"

Flowcharts for common analyst questions:

- Data stability assessment
- Factor comparison
- Defect concentration
- Specification compliance

## Time-Boxed Scenarios

### [Quick Check (5 Minutes)](quick-check.md)

Daily/shift-level monitoring pattern:

1. I-Chart stability scan
2. Capability check
3. Boxplot factor review
4. Document any issues

### [Deep Dive (30 Minutes)](deep-dive.md)

Systematic investigation for problem-solving:

| Phase          | Time   | Focus                 |
| -------------- | ------ | --------------------- |
| Baseline       | 5 min  | Full dataset overview |
| Stability      | 5 min  | I-Chart analysis      |
| Stratification | 10 min | Drill-down workflow   |
| Capability     | 5 min  | Filtered Cpk          |
| Documentation  | 5 min  | Export findings       |

## Workflow Selection Guide

| Your Question                   | Start Here                                       |
| ------------------------------- | ------------------------------------------------ |
| "Is my process stable?"         | [Four Pillars](four-pillars-workflow.md)         |
| "What's causing variation?"     | [Drill-Down](drill-down-workflow.md)             |
| "Which channel is worst?"       | [Performance Mode](performance-mode-workflow.md) |
| "Can I trust this measurement?" | [MSA Workflow](msa-workflow.md)                  |
| "Quick shift check needed"      | [Quick Check](quick-check.md)                    |
| "Need to solve this problem"    | [Deep Dive](deep-dive.md)                        |

## Related Documentation

- [Feature Documentation](../index.md) - What each chart does
- [Case Studies](../../04-cases/index.md) - Teaching examples
- [Four Pillars Philosophy](../../01-vision/four-pillars/index.md) - Why this methodology
