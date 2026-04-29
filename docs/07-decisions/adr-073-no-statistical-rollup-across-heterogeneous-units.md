---
title: 'ADR-073: No Statistical Roll-Up Across Heterogeneous Units'
status: accepted
date: 2026-04-29
---

# ADR-073: No Statistical Roll-Up Across Heterogeneous Units

**Status**: Accepted

**Date**: 2026-04-29

**Supersedes**: None

**Related**:
[ADR-010](adr-010-gagerr-deferral.md) (statistical rigour as credibility floor),
[ADR-069](adr-069-three-boundary-numeric-safety.md) (structural enforcement of numeric safety),
[Investigation Scope and Drill Semantics](../superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md) (the spec this policy companions)

---

## Context

VariScout's process-learning operating model rests on one Master Black Belt invariant — Watson's locality rule: capability indices computed against different specifications cannot be combined arithmetically. The hazard is concrete. Plant North runs Coke 12 oz with USL/LSL of [349, 359] g; Plant South runs Sprite 16 oz with USL/LSL of [468, 478] g. A Cpk of 1.0 on one and a Cpk of 1.0 on the other live on unrelated physics scales. `mean(cpks)` between them produces a number no MBB can interpret. `min(cpks)` is no safer — it falsely implies the lower Cpk is the binding constraint when the two are simply incommensurable.

The hazard is not confined to hub boundaries. It generalizes to **any heterogeneity dimension**: different products, different suppliers, different paint classes, different shifts that resolve to a different `SpecRule`. As `feedback_aggregation_heterogeneous_specs.md` records, the hazard surfaced inside PR #103 even within a single investigation when a per-context Cpk array was reduced via `Math.min` across context-tuples that had resolved to different `SpecRule` objects. Watson's rule is not a hub-boundary rule; it is a heterogeneous-physics rule.

Two paths exist to honor that rule:

1. **Permission predicate**. Engineer a `processFamily` taxonomy, a `canAggregate(a, b)` function, and UI guidance that warns when an aggregation looks unsafe. Cross-unit aggregation primitives remain in the engine; they are guarded at call sites.
2. **Design absence**. Remove the unsafe primitive from the engine entirely. No function exposes a single statistical metric formed by collapsing values across heterogeneous units. The locality rule then holds because the operation that would violate it does not exist.

Per `feedback_systemic_before_patching.md`, fix patterns rather than symptoms. Permission predicates degrade as new contributors invent new wrappers, and the warning surface grows faster than the policy can be re-explained. Design absence is invariant against all of that.

## Decision

**VariScout's engine does not, and will not, expose any function that produces a single statistical metric (Cpk, Cp, mean Cpk, min Cpk, sum Cpk, portfolio Cpk, or any equivalent) by combining values across heterogeneous units.**

Heterogeneous units are defined as:

- Hubs with different canonical maps.
- Investigations with different `SpecRule` resolutions for the same logical outcome.
- Multi-context steps where the matched context-tuples resolved to different `SpecRule` objects.

The structural enforcement is **design absence**. The API surface of `@variscout/core` contains no function whose name or signature implies cross-unit statistical aggregation. Within-investigation aggregation across same-physics channels (for example, `meanCpk` across cavities of one multi-cavity press) remains valid and continues to live on `PerformanceSummary.overall` — that case is homogeneous by construction.

## Rationale

Choosing design absence over a permission predicate is the same call ADR-069 made for numeric safety: structural enforcement beats discipline. The legitimate visualization for the question "how does capability vary across hubs / steps / contexts" is the **per-step Cpk distribution boxplot**. Each Cpk keeps its identity; the boxplot shows the distribution shape; the analyst's eye does the pattern recognition; no arithmetic spans heterogeneous physics. Side-by-side comparison is always safe; arithmetic is the hazard.

This is also a contribution-not-causation discipline. A side-by-side boxplot lets the analyst observe that one hub's distribution sits lower than another's — that is contribution to a question. A `meanCpkAcrossHubs()` value would falsely promise summary, and summary across heterogeneous physics is the exact misreading VariScout exists to prevent.

## Consequences

- Cross-hub views are **facets**, not aggregations. The dashboard reads multiple `NodeCapabilityResult` arrays and renders them side-by-side — never collapses them to a number.
- The Org Hub-of-Hubs concept is operational coordination (which hubs exist, who owns them, what cadence they run on), not executive analytics. There is no single "portfolio Cpk" to surface.
- The `processFamily` taxonomy patch-pattern is explicitly avoided. No `canAggregate(a, b)` predicate, no UI warning surface, no taxonomy maintenance burden.
- Any future contributor instinctively reaching for `meanCapabilityAcrossHubs()` is structurally prevented — the function does not exist, so neither static analysis nor a code review is the last line of defence.
- The Investigation Scope and Drill Semantics spec depends on this policy. Its drill-down semantics (hub → investigation → step → context-tuple) and its cross-hub context analysis section are all designed around per-step distribution rendering, not cross-unit collapse.
- Within-investigation `meanCpk` across same-physics channels remains valid on `PerformanceSummary.overall`. The architectural guard test forbids cross-context names but allows within-investigation `meanCpk` for this exact reason.

## Verification

- `rg "meanCapability|aggregateCpk|sumCpk|portfolioCpk|meanAcrossHubs" packages/` returns zero hits today and must continue to return zero.
- The architectural guard test at `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts` enforces the absence.
- New code review must reject any PR introducing a cross-unit statistical aggregation function. The rule applies to function names, exported types, and CoScout tool definitions.
- The Investigation Scope and Drill Semantics spec's "Cross-hub context analysis" section describes the legitimate alternative — per-step distribution rendering — that contributors should reach for instead.

## Status

Accepted (2026-04-29). Supersedes: none (new policy). Superseded by: none.
