---
title: 'ADR-035: Improvement Prioritization Model'
---

# ADR-035: Improvement Prioritization Model

**Status:** Accepted
**Date:** 2026-03-20

## Context

The IMPROVE phase workspace evaluated improvement ideas using a simple effort dimension (low/medium/high). Real-world improvement decisions require richer evaluation:

- **Timeframe** — "how long will this take?" (days vs months matters for planning)
- **Cost** — "how much will it cost?" (always asked by plant directors)
- **Risk** — "what could go wrong?" (RDMAIC risk matrix methodology)
- **Visual prioritization** — analysts need to compare ideas across multiple dimensions simultaneously

The existing effort dimension conflated resource complexity with implementation duration, making it hard to distinguish "expensive but quick" from "cheap but slow."

## Decision

### 1. Replace Effort with Timeframe

Replace `IdeaEffort` (low/medium/high) with `IdeaTimeframe` (just-do/days/weeks/months). The new dimension naturally captures both implementation duration and resource complexity — "just do" implies low effort, "months" implies high effort.

| Level   | Definition                                   |
| ------- | -------------------------------------------- |
| Just do | Right now, existing resources, no approval   |
| Days    | Minor coordination, within days              |
| Weeks   | Requires planning, moderate resources        |
| Months  | Investment, cross-team, significant planning |

### 2. Add Cost Dimension (dual-mode)

Categorical quick estimate (None/Low/Medium/High) with optional precise euro amount. When precise amounts are entered, the system enables budget fitting, ROI visualization, and continuous matrix positioning.

### 3. Add Risk Assessment (2-axis matrix)

Two configurable sub-axes (default: Process Impact x Safety Impact) producing a computed risk level via a 3x3 RDMAIC matrix. Six axis presets available: process, safety, environmental, quality, regulatory, brand.

### 4. Add Prioritization Matrix View

Interactive SVG scatter plot with flexible X/Y/Color axis selection from four dimensions (benefit, timeframe, cost, risk). Four presets: Bang for Buck, Quick Impact, Risk-Reward, Budget View. Click dots to select ideas for implementation.

## Consequences

### Positive

- Analysts can make informed multi-dimensional improvement decisions
- Visual matrix reveals "quick wins" vs "major projects" at a glance
- Cost tracking enables budget-aware improvement planning
- Risk assessment follows established RDMAIC methodology
- CoScout AI suggests timeframe, cost, and risk alongside improvement ideas

### Negative

- Breaking change: `IdeaEffort` type removed, `effort` field replaced by `timeframe`
- Existing saved projects with `effort` values will lose that data (no migration — clean break)
- More fields per idea (though most are optional)
- Idea row is denser despite overflow menu optimization

### Neutral

- Azure-only (consistent with IMPROVE phase being Azure-only)
- Direction dimension unchanged (creative prompt, not evaluation axis)
- What-If projection unchanged (still the primary benefit quantification tool)

## Implementation

See [Improvement Prioritization Design](../archive/specs/2026-03-20-improvement-prioritization-design.md) for the full spec including data model, UI mockups, and migration details.
