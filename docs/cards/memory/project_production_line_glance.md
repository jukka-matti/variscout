---
title: 'Production-line-glance dashboard design'
description: 'Unified design replacing original W1 (cross-hub Cpk eligibility taxonomy) with a methodologically purer alternative. Spec at docs/superpowers/specs/2026-04-28-production-line-glance-design.md.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 13f5469d606b393a
origin-session-id: ce1c7399-5523-4447-b096-37f8fa8894ef
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_production_line_glance.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The 2026-04-28 brainstorming session produced this unified design. It replaces the original W1 ("engineer cross-hub Cpk eligibility taxonomy") with a structural-absence approach: **the engine has no function aggregating Cp/Cpk across investigations or hubs**. Cross-hub comparison stays visual via per-step distributions, never collapsed to a number.

**Why:** Watson's "Cpks aren't additive across heterogeneous local processes" was a verbal commitment in the operating-model spec but unenforced in code. Engineering an eligibility taxonomy was the patch; eliminating the unsafe primitive was the structural fix.

**How to apply:** When the user asks about W1, capability aggregation, the per-step dashboard, the Layered Process View Operations band V2, H2 line 2 capability cards, or the cross-hub global-process-owner view — they all collapse into this one design.

## Locked design decisions

- **Step definition**: Process Map nodes (FRAME river-SIPOC). Reuses existing `ProcessMapNode.ctqColumn` for measurement; adds `capabilityScope.specRules`.
- **Three-drill semantics + org hierarchy**:
  - Drill A: Hub→Step (the new dashboard)
  - Drill B: Step→Channels (existing Performance mode, unchanged)
  - Drill C: Step→Sub-flow (recursive ProcessMap, max 1 level in V1)
  - Org Hub-of-Hubs: visual side-by-side only, never arithmetic
- **Versioned canonical map governance**: Hub owner edits canonical structure + specs. Investigations pin a `canonicalMapVersion`. Override = local fork via `nodeMappings[i].specsOverride` (flagged).
- **Specs scope**: Per canonical-node, indexed by `(node × context-tuple)` via sparse `specRules[]` with most-specific-match lookup. `null` = any/default.
- **Context dimensions**: Hub-level `contextColumns[]` (product, shift) AND tributary-attached `contextColumns[]` (e.g., supplier on Steel tributary). Engine treats uniformly; declaration is UX metadata.
- **B0/B1/B2 unification**: `Investigation.nodeMappings.length` distinguishes legacy fallback (0), whole-line investigation (>1), and step-deep-dive (1).
- **UI placement**: Single primitive in `@variscout/charts` + `@variscout/ui`, surfaced in 3 places — LayeredProcessView Operations band (architectural primary, V2 implementation), Process Hub view, FRAME workspace.
- **V1 chart composition (2×2)**: Cpk vs target i-chart [reuse] + Δ(Cp-Cpk) trend [W3 NEW] + per-step Cpk boxplot [NEW] + per-step error Pareto [NEW].
- **Cross-hub context-filtered view** at Org Hub-of-Hubs: same per-step boxplot primitive, multiplied across child hubs filtered by a context value. Each child computes locally; no cross-hub arithmetic.

## Out of scope (named, deferred)

- Portfolio Investigation as first-class entity (sustained cross-hub investigation with own questions/findings/actions/sustainment) — H3+
- Per-node distinct context dimensions — V2
- Investigation-level context overrides — V2
- Drill C beyond 1 level — V2
- Per-step delegation of canonical-map editing to local owners — V2+
- W4 terminology drift, W5 governance docs, W6 ADR amendments, W7 observed-vs-expected — separate plans/PRs

## References

- Spec: `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
- Engine plan: `docs/superpowers/plans/2026-04-28-production-line-glance-engine.md`
- Critique addressed: A2 (Δ-trend chart), A3 (aggregation safety), A4 (n<30 guard) at `~/.claude/plans/i-would-need-to-drifting-hummingbird.md`
- Vision spec (2026-05-03, supersedes operating model): `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` — production-line-glance C2's per-(node × context-tuple) engine is "what stays" (§7); the canvas surface (§3.3) absorbs the LayeredProcessView + LayeredProcessViewWithCapability shipped via this workstream.
