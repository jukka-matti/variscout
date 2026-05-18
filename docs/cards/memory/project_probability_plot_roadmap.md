---
title: 'Probability Plot Enhancement Roadmap'
description: 'Phased roadmap for probability plot improvements from user testing (signature block, multi-series, inflection detection)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: f937ef5b915540e6
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_probability_plot_roadmap.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Probability plot enhancement roadmap defined 2026-03-29 from user testing analysis.

**Phase A — Quick wins (UX polish):**
- Signature block: N, Mean, StDev, AD p-value on chart (use existing `signatureElement` prop in ProbabilityPlotBase)
- Anderson-Darling normality test p-value
- Cp/Cpk on probability plot in capability mode
- Easier focused view entry (double-click to expand)

**Phase B — Multi-series (DELIVERED 2026-03-30, UI WIRED 2026-04-05):**
- Multiple probability plot by factor — one line per factor level, different colors ✓
- Brush selection for zooming ✓
- Anderson-Darling normality test per series ✓
- useProbabilityPlotData hook handles data transform ✓
- Promoted to VerificationCard grid tab ✓
- Factor selection linked to Boxplot factor in both PWA and Azure apps ✓ (Apr 5)

**Phase C — Process diagnostics:**
- Inflection point detection (piecewise linear regression)
- Annotations on inflection points → Findings
- Chi-square goodness-of-fit

**Why:** Expert user describes probability plot as a *process diagnostic tool*, not just normality check. Inflection points = process transitions. Multiple overlay by factor enables visual prioritization. This is a differentiating feature vs Minitab.
**How to apply:** Start with Phase A (quick wins in existing ProbabilityPlot.tsx). Phase B is the high-impact feature. Phase C is advanced.
