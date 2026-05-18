---
title: 'Aggregating Cpks across heterogeneous specs is unsafe — even within one investigation'
description: 'Watson''s "Cpks aren''t additive across heterogeneous local processes" rule generalizes to ANY heterogeneity dimension (different products, suppliers, paint classes, etc.). Math.min across context groups with different specs is the same violation.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: c4edf4bdc91eb1d1
origin-session-id: ce1c7399-5523-4447-b096-37f8fa8894ef
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_aggregation_heterogeneous_specs.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When designing capability aggregation, treat any context dimension that drives DIFFERENT spec rules as creating heterogeneity that forbids arithmetic collapse. Math.min, mean, max — none are methodologically valid across contexts that resolved to different `SpecRule` objects, even within a single investigation. The reviewer caught this as a blocking issue in PR #103: my plan had `calculateFromColumn` taking `Math.min` across per-context Cpks, which silently broke Watson's rule even though no cross-investigation primitive existed.

**Why:** A Cpk of 1.0 against [349, 359] (Coke 12oz) and a Cpk of 1.0 against [468, 478] (Coke 16oz) live on completely different physics scales. Min-collapsing them produces a number no MBB can interpret — exactly the "Cpks across unrelated processes" hazard the operating-model spec at line 291-293 forbids. The hazard isn't only at hub boundaries; it's anywhere specs differ.

**How to apply:**

- For per-(node × context-tuple) Cp/Cpk arrays: populate the node-level scalar **only** when all matched contexts resolved to the SAME `SpecRule` (homogeneous specs). Otherwise leave `cpk`/`cp` undefined and force callers to render the per-context distribution.
- For pre-computed cross-investigation aggregation (the `children` source in `calculateNodeCapability`): leave node-level scalars undefined unconditionally. The caller cannot tell whether siblings used identical specs, so any collapse risks the heterogeneous-physics violation.
- The rule generalizes to `meanCpk` style fields too: they're acceptable on `PerformanceSummary.overall` (within-investigation across same-physics channels — granulation lines, multi-cavity press) but NEVER on a hub or cross-investigation aggregate. The architectural guard test forbids cross-context names but allows within-investigation `meanCpk` for this exact reason.
- When in doubt: surface the array (`perContextResults`) and let the dashboard render a boxplot/distribution. Visual side-by-side is always safe; arithmetic is the hazard.

## References

- Watson critique objection A3 / D3: `~/.claude/plans/i-would-need-to-drifting-hummingbird.md`
- Vision spec §3.3 #7 (context propagation) and §2.3 (ADR-073) at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` — the canvas's branch/join + context propagation makes ADR-073 structurally visible. (Pre-2026-05-03: same content lived in the operating-model spec, now archived at `docs/archive/specs/2026-04-27-process-learning-operating-model-design.md`.)
- Architectural guard: `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`
- Implementation: `packages/core/src/stats/nodeCapability.ts` (PR #103 commit `16ca1e1f`)
