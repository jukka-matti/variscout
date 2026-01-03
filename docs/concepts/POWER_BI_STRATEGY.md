# VaRiScout Power BI Custom Visual Strategy

**Status:** Concept / Future
**Date:** January 2026
**Version:** 1.0

---

## Overview

Beyond the standalone PWA, VaRiScout's core analysis capabilities can be packaged as Power BI custom visuals. This opens a significant market opportunity: organizations already using Power BI for reporting can add LSS analysis directly to their dashboards without switching tools.

---

## Market Opportunity

Power BI has the largest BI market share globally. Custom visuals are distributed through Microsoft AppSource, which handles discovery, licensing, and payments. Existing SPC visuals on AppSource focus primarily on healthcare (NHS) metrics, leaving manufacturing and LSS training underserved.

---

## Technical Foundation

Power BI custom visuals are built with TypeScript and D3.js — the same rendering approach used in VaRiScout Lite. This means core chart logic can be shared between the PWA and Power BI versions, reducing development effort significantly.

| Component     | PWA Version               | Power BI Version          |
| ------------- | ------------------------- | ------------------------- |
| Data input    | CSV upload / manual entry | Power BI data binding     |
| Rendering     | React + D3.js             | D3.js (reusable)          |
| Interactivity | Click filtering           | Power BI cross-filter API |
| Export        | PNG / CSV                 | Native Power BI export    |
| Distribution  | Web / PWA install         | Microsoft AppSource       |

---

## Proposed Visual Package

Four custom visuals covering the core VaRiScout functionality:

### Visual 1: VaRiScout I-Chart

**Purpose:** Individual control chart for process stability monitoring

- Automatic UCL/LCL calculation (3σ limits)
- Optional specification limits (USL/LSL)
- Western Electric rules for special cause detection
- Plain-language stability verdict
- Cross-filtering with other Power BI visuals

### Visual 2: VaRiScout Boxplot

**Purpose:** Factor comparison with integrated ANOVA

- Side-by-side boxplots for categorical factors
- Automatic ANOVA calculation with p-value
- Group means and sample sizes displayed
- Plain-language verdict: "Groups are different" or "No significant difference"
- Click-to-filter interaction with other visuals

### Visual 3: VaRiScout Pareto

**Purpose:** Frequency analysis with cumulative percentage

- Automatic sorting by frequency (descending)
- Cumulative percentage line overlay
- 80/20 threshold indicator
- Summary statistics panel (count, categories, top contributor)
- Click bar to filter dashboard

### Visual 4: VaRiScout Capability

**Purpose:** Process capability analysis with probability plot

- Capability histogram with normal curve overlay
- Probability plot for normality assessment
- Cp and Cpk metrics with color-coded status
- Specification limits (USL/LSL/Target) configuration
- Plain-language capability verdict
- Expected defect rate (PPM) calculation

---

## Capability Interpretation Guide

| Cpk Value   | Rating    | Interpretation                    |
| ----------- | --------- | --------------------------------- |
| ≥ 1.67      | Excellent | Process is highly capable         |
| 1.33 – 1.67 | Good      | Process is capable                |
| 1.00 – 1.33 | Marginal  | Process barely meets requirements |
| < 1.00      | Poor      | Process is not capable            |

---

## Competitive Differentiation

Existing Power BI SPC visuals are fragmented (one chart type per visual) and focused on healthcare metrics. VaRiScout differentiates through:

- **Integrated suite:** Four visuals designed to work together with consistent UX
- **Manufacturing focus:** Capability analysis, Gage R&R (future), terminology familiar to LSS practitioners
- **Plain-language insights:** Verdicts and interpretations, not just numbers
- **Cross-visual filtering:** Click a point in I-Chart, see it highlighted in Boxplot and Pareto
- **Training integration:** Same visuals used in training courses, familiar to graduates

---

## Monetization Model

Power BI AppSource supports tiered licensing based on user count:

| Tier       | Price       | Users           |
| ---------- | ----------- | --------------- |
| Team       | €399/year   | Up to 10 users  |
| Department | €999/year   | Up to 50 users  |
| Enterprise | €1,999/year | Unlimited users |

See [MONETIZATION_CONCEPT.md](MONETIZATION_CONCEPT.md) for full pricing details.

---

## Development Approach

| Phase   | Deliverable                             | Effort    |
| ------- | --------------------------------------- | --------- |
| Phase 1 | I-Chart visual with control limits      | 2-3 weeks |
| Phase 2 | Boxplot visual with ANOVA               | 2-3 weeks |
| Phase 3 | Pareto visual with summary stats        | 2 weeks   |
| Phase 4 | Capability visual with probability plot | 4 weeks   |
| Phase 5 | Cross-visual filtering integration      | 2 weeks   |
| Phase 6 | AppSource certification & launch        | 2-4 weeks |

**Total estimated effort:** 13-18 weeks for full Power BI visual suite

---

## Future Platform Extensions

After Power BI success, the same core logic can be adapted for:

- **Tableau Viz Extensions:** New in 2024.2, less competition, strong enterprise presence
- **Qlik Sense Extensions:** Strong in manufacturing sector, direct customer relationships

---

## Related Documentation

- [LSS_TRAINER_STRATEGY.md](LSS_TRAINER_STRATEGY.md) — Core feature roadmap
- [MONETIZATION_CONCEPT.md](MONETIZATION_CONCEPT.md) — Pricing and monetization
- [EXCEL_ADDIN_STRATEGY.md](EXCEL_ADDIN_STRATEGY.md) — Excel Add-in architecture
