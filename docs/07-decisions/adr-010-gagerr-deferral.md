---
title: 'ADR-010: Defer Gage R&R from Azure App v1'
---

# ADR-010: Defer Gage R&R from Azure App v1

**Status:** Superseded
**Date:** 2026-02-16
**Supersedes:** None
**Related:** [ADR-007](adr-007-azure-marketplace-distribution.md) (distribution strategy)

---

## Context

VariScout includes a Gage R&R (Measurement System Analysis) implementation shared across the PWA and Azure App via `@variscout/core`, `@variscout/charts`, and `@variscout/ui`. A systematic evaluation revealed the current implementation is solid for learning but MVP-level for paying customers.

### What Works Well (Learning Context)

- ANOVA math is correct (%GRR via variance components)
- Interaction plot visualises operator-by-part patterns
- Auto-detection of operator/part columns reduces setup friction
- Educational tooltips explain MSA concepts in context
- Sufficient for Green Belt training exercises

### Gap Analysis for Production MSA

Gaps are ordered by impact on paying users:

#### Tier 1 - Expected by any MSA practitioner

| Gap                                         | Impact                                                  |
| ------------------------------------------- | ------------------------------------------------------- |
| No %Tolerance (%GRR relative to spec range) | Cannot assess measurement system acceptability per AIAG |
| No NDC (Number of Distinct Categories)      | Missing key acceptance criterion (NDC >= 5)             |
| No F-tests with p-values                    | Cannot determine statistical significance of sources    |
| No X-bar/R control charts                   | Standard MSA deliverable missing                        |

#### Tier 2 - Expected by quality engineers

| Gap                             | Impact                                         |
| ------------------------------- | ---------------------------------------------- |
| No confidence intervals on %GRR | Cannot quantify uncertainty in the measurement |
| No formal report export         | Engineers need documented results for audits   |
| No multi-study comparison       | Cannot track measurement system over time      |

#### Tier 3 - Competitive differentiation

| Gap                                  | Impact                          |
| ------------------------------------ | ------------------------------- |
| No crossed vs nested study selection | Limits study design flexibility |
| No attribute agreement analysis      | Only handles continuous data    |
| No linearity/bias study              | Incomplete MSA coverage         |

### Competitive Landscape

Minitab, JMP, and dedicated MSA tools all include Tier 1 features as baseline. Shipping without them would be immediately noticed by quality professionals evaluating the Azure App at EUR 150/month.

## Decision

**Defer Gage R&R from Azure App v1. Keep it in the PWA (free, learning-appropriate).**

### Rationale

1. **Credibility risk**: Half-baked MSA undermines trust in the entire tool. Quality professionals will judge VariScout's statistical rigour by its weakest feature.
2. **PWA fit**: The current implementation is genuinely useful for training. Green Belt students learning MSA concepts benefit from the interactive visualization.
3. **Low demand signal**: No customer has asked for MSA yet. Build it properly when they do.
4. **Reversible**: The code stays in place (shared packages, Azure GageRRPanel.tsx). Re-enabling is a one-line change in Dashboard.tsx.

## Implementation

- Remove `'gagerr'` from Azure Dashboard tab navigation
- Keep `GageRRPanel.tsx` and its tests in the Azure app codebase (not wired into navigation)
- Keep all shared MSA code in `@variscout/core`, `@variscout/charts`, `@variscout/ui`
- PWA Gage R&R tab remains unchanged
- Update feature-parity matrix to reflect PWA-only availability

## Re-enablement Criteria

When customer demand materialises, implement at minimum Tier 1 gaps before re-enabling in Azure App:

1. %Tolerance calculation and display
2. NDC (Number of Distinct Categories)
3. F-tests with p-values for each variance source
4. X-bar and R control charts

Then re-add `'gagerr'` to `DashboardTab` union in `Dashboard.tsx`.

## Consequences

### Positive

- Azure App ships only features that meet professional quality standards
- No wasted effort building production MSA before demand exists
- PWA retains a valuable differentiator for training use

### Negative

- Feature parity between PWA and Azure is slightly asymmetric (PWA has a feature Azure doesn't)
- If a prospect specifically needs MSA, they'll see it in the free tool but not the paid one (mitigated: Azure is positioned for SPC workflow, not standalone MSA)

### Neutral

- Shared package code (`@variscout/core` GageRR calculations) is maintained regardless
- GageRRPanel.tsx stays in Azure codebase, just not navigable

---

## Post-Decision Update

**Update (2026-02-16):** Decision evolved beyond deferral. Gage R&R was fully removed from all products, shared packages, and documentation (commit 87bb072). The feature proved unnecessary — no customer demand, and PWA serves training needs without it. ADR kept as historical record of the evaluation and gap analysis.
