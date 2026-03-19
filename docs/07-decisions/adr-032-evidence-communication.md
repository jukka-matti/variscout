---
title: 'ADR-032: Evidence-Based Statistical Communication'
status: Accepted
date: 2026-03-19
---

# ADR-032: Evidence-Based Statistical Communication

## Status

Accepted

## Date

2026-03-19

## Context

VariScout is "EDA for process improvement, not statistical verification" (methodology.md). The tool already leads with Contribution % (eta-squared) over p-values. But several gaps remained where traditional statistical thinking leaked through — "statistically significant" language in the glossary, binary `isSignificant` booleans, "collect more data" advice instead of structured learning guidance, and missing scope context in the AI pipeline.

The ASA's 2016/2019 statements established: stop treating p < 0.05 as a truth machine. VariScout's methodology already aligned — this work makes the implementation match the philosophy.

## Decision

### Terminology

- Ban "statistically significant" / "not significant" from all AI outputs — use evidence language: "clearly drives", "suggests", "may show a pattern", "no clear evidence"
- Ban "collect more data to confirm" — guide toward complementary evidence types (gemba, expert, findings)
- Update glossary definitions for p-value and eta-squared to remove binary thresholds and behavioral science benchmarks

### Evidence Interpretation

- New `interpretEvidence()` function in `@variscout/core/stats/evidence` provides a reusable evidence level classification (strong/moderate/weak/insufficient) from p-value, and generates insight text from the eta-squared x p-value matrix
- Used by: ANOVA insight line, hypothesis hover tooltip, CoScout prompts, narration

### ANOVA Panel

- Flip layout: Contribution % first (bold, prominent), F/p second (muted, smaller)
- Add deterministic insight line below stats, naming the specific outlier category and suggesting progressive stratification

### AI Context

- `cumulativeScope` (0-1 fraction) added to AIContext
- `drillPathEnriched` with per-step scope fractions replaces plain string drill path when available
- `switch_factor` action tool added for CoScout to propose Boxplot factor switching

### Hypothesis Hover

- Status badge tooltip shows Contribution %, evidence level, sample info, and interpretation
- Weak evidence triggers gemba/expert follow-up suggestion, not "collect more data"

### Staged Comparison

- Insight line added: "Cpk improved from X to Y — the improvement appears effective"

## Consequences

### Positive

- AI outputs align with ASA position on statistical significance
- Analysts guided toward multi-evidence investigation, not data collection delays
- ANOVA panel leads with actionable information (which factor matters most)
- Progressive stratification guidance becomes specific (names the category to select)
- CoScout receives scope context for evidence-calibrated responses

### Negative

- Existing users familiar with p < 0.05 language may need adjustment period
- More complex insight generation logic to maintain

### Neutral

- No breaking changes to data model or persistence
- `isSignificant` boolean retained in AnovaResult for backward compatibility but de-emphasized in UI
