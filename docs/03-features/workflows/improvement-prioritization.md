---
title: Improvement Prioritization
audience: [analyst, engineer]
category: workflow
status: stable
related: [improve, prioritization, risk, timeframe, cost, matrix, ideas, actions]
---

# Improvement Prioritization

Multi-dimensional evaluation model for selecting which improvement ideas to implement. Extends the IMPROVE phase workspace with timeframe, cost, and risk assessment, plus a visual prioritization matrix.

## Evaluation Dimensions

Each improvement idea can be evaluated on four dimensions:

| Dimension     | Type           | Scale                                               | Purpose                          |
| ------------- | -------------- | --------------------------------------------------- | -------------------------------- |
| **Timeframe** | Required       | Just do / Days / Weeks / Months                     | How long to implement            |
| **Cost**      | Optional       | None / Low / Medium / High (or precise €)           | How much it costs                |
| **Risk**      | Optional       | 2-axis matrix → Low / Medium / High / Very High     | What could go wrong              |
| **Benefit**   | Auto or manual | What-If Cpk/yield projection or Low / Medium / High | How much it improves the process |

**Direction** (Prevent / Detect / Simplify / Eliminate) is a creative prompt, not an evaluation dimension.

### Timeframe (replaces Effort)

| Level       | Definition                                        | Examples                               |
| ----------- | ------------------------------------------------- | -------------------------------------- |
| **Just do** | Right now, existing resources, no approval needed | Adjust machine setting, add visual aid |
| **Days**    | Minor coordination, can be done this week         | Order part, update SOP                 |
| **Weeks**   | Requires planning, moderate resources             | Modify fixture, schedule training      |
| **Months**  | Investment, cross-team, significant planning      | Capital equipment, process redesign    |

### Cost

Dual-mode input:

- **Categorical** (default): None / Low / Medium / High — quick gut estimate
- **Precise** (optional): Enter a euro amount — enables budget fitting and ROI calculations

### Risk Assessment (RDMAIC)

A 3x3 matrix with two configurable axes, following RDMAIC risk analysis methodology:

```
            Axis 2: None(1)  Possible(2)  Immediate(3)
Axis 1:
Severe(3):    High        High         Very High
Significant(2): Medium      Medium       High
Small(1):     Low         Medium       High
```

**Configurable axis presets** (pick any 2):

- Process Impact (default axis 1)
- Safety Impact (default axis 2)
- Environmental Impact
- Quality Impact
- Regulatory Impact
- Brand Impact

## Workflow

The improvement prioritization follows a natural sequence:

1. **Brainstorm ideas** — Add ideas to supported hypotheses with text + direction (creative phase)
2. **Quick assessment** — Set timeframe and cost per idea (lightweight, seconds each)
3. **Quantify benefit** — Run What-If simulation on promising ideas (optional, deeper analysis)
4. **Assess risk** — Open risk popover for ideas that warrant risk evaluation (optional, deliberate)
5. **Prioritize & select** — Use the prioritization matrix to visualize and select the best combination
6. **Convert to actions** — Selected ideas become actionable tasks with assignees and due dates

## Prioritization Matrix

An interactive scatter plot that visualizes all ideas on configurable axes:

- **Y-axis**: Any dimension (default: Benefit)
- **X-axis**: Any dimension (default: Timeframe)
- **Color**: Any remaining dimension (default: Risk)

### Presets

| Preset            | Y       | X         | Color     | Use Case                          |
| ----------------- | ------- | --------- | --------- | --------------------------------- |
| **Bang for Buck** | Benefit | Cost      | Risk      | Best value for money              |
| **Quick Impact**  | Benefit | Timeframe | Risk      | What improves things fastest      |
| **Risk-Reward**   | Benefit | Risk      | Timeframe | Is the risk worth the reward      |
| **Budget View**   | Cost    | Timeframe | Benefit   | What fits the timeline and budget |

### Quick Wins

Ideas in the top-left quadrant (high benefit, low timeframe/cost) are "quick wins" — the best candidates for immediate implementation.

## CoScout AI Integration

CoScout suggests timeframe, cost, and optionally risk when proposing improvement ideas. The analyst can accept or override any suggestion.

## Budget Fitting

When the analyst sets an improvement budget (in Settings) and enters precise euro costs on ideas, the summary bar shows spend vs budget. This helps ensure the selected improvement set fits within available resources.

## Related

- [Investigation to Action Workflow](investigation-to-action.md) — full improvement methodology
- [IMPROVE Phase UX Design](../../archive/specs/2026-03-19-improve-phase-ux-design.md) — workspace design
- [Improvement Prioritization Design](../../superpowers/specs/2026-03-20-improvement-prioritization-design.md) — detailed spec
- [ADR-035](../../07-decisions/adr-035-improvement-prioritization.md) — decision record
