---
title: 'probability-plot-enhancement-roadmap'
description: 'Phased roadmap for probability plot improvements from user testing (signature block, multi-series, inflection detection)'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 37639e5c67a1ac4a
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
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
- Inflection point detection (gap-ratio detection + Anderson-Darling whole-sample pre-check + piecewise linear regression RSS confidence) — SHIPPED via PR-CCJ-G1 (2026-05-28)
- Bin column IS the persistent diagnostic artifact (NOT a separate Finding entity); persists as `ImprovementProject.binnedFactorBindings[]`, mirrors D3 time-decomposition binding shape. State B direct-manipulation (drag/add/remove patches IP immediately, no commit step). Selectable as Boxplot + Probability factor for stratification self-validation
- Chi-square goodness-of-fit (still future)

**Why:** Expert user describes probability plot as a *process diagnostic tool*, not just normality check. Inflection points = process transitions; the user's downstream move is to stratify by them. The Minitab-differentiating claim is the **gap-ratio-on-sorted-values + self-validating stratification loop** — JMP/Minitab deliberately don't auto-suggest cuts (their SPC discipline says bimodal data should trigger stratification by an existing factor, not silent auto-binning). VariScout's wedge: when no existing factor explains the multi-modality, the user can manufacture one via inflection detection — but the algorithm's objective function ("each segment is normally distributed" — verified by the per-segment AD p-value in the side panel) IS the stratification validation criterion, so the loop closes cleanly. Algorithm delivers: (1) gap-ratio detection invariant to within-cluster spread; (2) AD whole-sample pre-check gates on normality of the whole distribution before scanning; (3) PWL-RSS confidence makes the detection strength legible to the analyst. **Findings flow earlier framing retired 2026-05-28:** the bin column carries the diagnostic in its metadata (`sourceColumn` + `cuts` + `detectionMethod` + `detectedAt`); creating a parallel Finding entity duplicates information without adding value. Existing `BrushToFindingFlow` still handles "capture observation without binning" via region-brush — the two flows coexist.
**How to apply:** Phase A (quick wins) + Phase B (multi-series) already shipped. Phase C inflection binning shipped via PR-CCJ-G1 (8 tasks, single PR). Chi-square deferred.
