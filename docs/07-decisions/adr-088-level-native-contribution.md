---
title: 'ADR-088: Level-native contribution — Y/X/x native shares, no bespoke SS-share'
status: active
date: 2026-05-29
purpose: decide
tier: living
audience: both
topic: [stats, investigation, methodology, capability, wedge-v1]
related:
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - adr-074-scout-level-spanning-surface-boundary-policy
  - adr-084-capability-indices-cp-cpk-only
  - 2026-05-29-investigation-surface-design
layer: L5
last-verified: 2026-05-29
---

# ADR-088: Level-native contribution — Y/X/x native shares, no bespoke SS-share

**Status:** Accepted
**Date:** 2026-05-29

## Context

The investigation-surface design (2026-05-29, Cluster B) settled how VariScout reports
**how much a condition contributes** to the problem the team is chasing. The temptation when
unifying the analysis surfaces is to invent a single cross-lens "contribution %" — a bespoke
sum-of-squares share rendered as the one number the user reads everywhere. That number does not
exist in the methodology author's own teaching, and manufacturing it would be _more formal_ than
the practice it claims to encode (see `feedback_prefer_pragmatic_over_formal`).

The codebase already speaks several native dialects of "contribution," each correct for its lens:

- **Factor variance share** — `getEtaSquared()` computes `η² = SS_between / SS_total`
  (`packages/core/src/stats/anova.ts:25`); `computeMainEffects()` returns a `MainEffectsResult`
  built from the same SS decomposition + F-ratios (`packages/core/src/stats/factorEffects.ts:121`).
- **Regression slope share** — `computeBestSubsets()` returns a `BestSubsetResult`
  (`packages/core/src/stats/bestSubsets.ts:497`) ranking factor effects by fitted slope.
- **Capability per group** — `subgroupCapability.ts` reports Cp/Cpk per subgroup (ADR-084).
- **Pareto count-%, value-add %, bottleneck seconds** — the defect, yamazumi, and
  process-flow lenses each carry their own native quantity.

The only level concept that exists in code today is `CanvasLevel` (`l1 | l2 | l3`,
`packages/core/src/canvas/viewport.ts:1`) plus the `process-flow` lens. There is **no** named
Outcome/Flow/Local or Y/X/x type. And the actionable cross-lens number — "what would the overall
result be if this condition were fixed?" — is already engineered: `computeCumulativeProjection()`
(`packages/core/src/variation/projection.ts:110`) chains `simulateOverallImpact()`
(`packages/core/src/variation/simulation.ts:285`) down successive scoped findings to a projected
overall Cpk. Today it is keyed on each `Finding.activeFilters`, not on a drilled {factor=level}
condition.

What is _not_ yet built is the part-whole arithmetic that ties a drilled condition back to the
**original problem**: each lens reports its own share over whatever dataset it was handed, and
`LocalMechanismView` recomputes per step but never chains its share against the parent level.

This ADR records the resolution. The design is settled; this is its durable home.

## Decision

**Contribution is level-native. Each lens reports its own native share, routed by the three
process-learning levels — and there is no bespoke, user-facing sum-of-squares contribution metric.**

1. **Level before mode.** Introduce a thin named `ProcessLevel` — `Outcome` / `Flow` / `Local`
   (Y / X / x) — **mapped onto** the existing `CanvasLevel` (`l1` / `l2` / `l3`). It is a naming
   and routing layer, not a new state machine. The level decides which native share is in view.

2. **Native share per lens, no bespoke SS-share number.** Each lens surfaces its own quantity:
   η² (factor variance share) / Cpk-per-group / Pareto count-% / regression slope / VA% /
   bottleneck-seconds. There is **no** user-facing "contribution %" computed from a custom
   sum-of-squares formula. **This does not remove the η² engine.** `getEtaSquared()` and
   `computeMainEffects()` legitimately use `ssBetween / ssTotal` + F-ratios _internally_ and must
   stay. The distinction is sharp: **engine-internal math** (SS decomposition powering η²) is
   retained; a **user-facing bespoke contribution number** is not introduced.

3. **What-If is the actionable cross-lens number — reuse, do not rebuild.**
   `computeCumulativeProjection()` is the canonical engine. Wire it to a drilled {factor=level}
   condition rather than building a parallel projector. Today it reads `Finding.activeFilters`;
   the net-new wiring feeds it the drill chip's condition instead.

4. **Net-new: contribution-to-total + cumulative-variation bar — variance-fraction basis only.**
   Add a recompute that multiplies the **variance-share basis** (the dimensionless η²-fraction in
   `[0,1]`) **down** successive drill levels, plus a cumulative-variation bar anchored to the
   **original problem** with the banding from `eda-mental-model.md` §3.3
   (blue `<30%` / amber `30–50%` / green `>50%`). **Only the variance fraction chains** — fractions
   of variance multiply coherently. Non-variance native shares (Pareto count-%, bottleneck-seconds,
   regression slope, VA%) are **level-local readouts**, never folded into the cross-level bar:
   chaining a value that switches units between levels (seconds into a Cpk anchor) is undefined, and
   coercing everything onto a Cpk basis would re-introduce the ADR-073/084 hazard. A level joins the
   to-total chain only if its contribution is a variance fraction within the **same homogeneous
   outcome**. This is the chaining `LocalMechanismView` never performs.

The intent router (NÄHDÄ / VERRATA / KVANTIFIOIDA / AJALLINEN → which native share) is **derived**
from Frame + level, not exposed as a user-facing picker.

## Rationale

- **WHERE is not WHY.** The level routes you to the native share of a scope — the {factor=level}
  condition you drilled to. The mechanisms _within_ that scope (Hypotheses) are a separate axis.
  Collapsing the two into one universal "contribution %" would erase the scope/cause distinction
  the model depends on. Level-native shares keep WHERE (the condition) and WHY (the suspected
  mechanism) on different surfaces.
- **It is contribution, never proof of cause.** A native share quantifies how much a condition
  _contributes_ to the spread or the count or the time — it is a suspected contribution, not a
  demonstrated cause (`contribution-not-causation`). The level-native framing makes this honest:
  η² says "share of variation," not "this is the cause."
- **Don't out-formalize the methodology.** A bespoke SS-share rendered as the headline number
  would be a statistic the practice itself does not teach. The native quantity each lens already
  speaks is the pragmatic, recognizable signal (`feedback_prefer_pragmatic_over_formal`).
- **Reuse beats a parallel engine.** `computeCumulativeProjection()` already chains
  `simulateOverallImpact()` correctly across scoped fixes. A second projector would be a fork to
  maintain and a second place for the aggregation rules to drift.
- **The work is additive.** There is no bespoke SS-share primitive to delete — it was never built.
  The cascade is a thin `ProcessLevel` mapping + the contribution-to-total recompute + the
  cumulative-variation bar + the What-If wiring.

## Consequences

### Code-level

- **Net-new `ProcessLevel` type** (`Outcome | Flow | Local`, Y/X/x) mapped onto `CanvasLevel`
  (`packages/core/src/canvas/viewport.ts:1`). Thin mapping; no new store, no new state machine.
- **`getEtaSquared()` (`anova.ts:25`) and `computeMainEffects()` (`factorEffects.ts:121`) are
  retained unchanged** — their `ssBetween / ssTotal` + F-ratio math is engine-internal and powers
  the factor-variance native share. No SS-share number is exported to the UI.
- **`computeCumulativeProjection()` (`projection.ts:110`) is the What-If engine.** New wiring feeds
  it the drilled {factor=level} condition where today it reads `Finding.activeFilters`. No parallel
  projector.
- **Net-new contribution-to-total recompute** multiplies the **variance-share basis (η²-fraction)**
  — and only that basis — down drill levels and drives a cumulative-variation bar banded per
  `eda-mental-model.md` §3.3. Non-variance native shares stay level-local readouts; `LocalMechanismView`
  gains a parent-anchored variance chain it does not have today.
- **Do not conflate** `computeCoverage().exploredPercent` (`bestSubsets.ts:1137`) — an R²adj-weighted
  _exploration coverage_ — with the cumulative-_variation_ bar. Different quantities; the
  exploration number must not be reused as the variation bar's value.

### Methodological

- Native shares are level-native and lens-native: η² for factor variance, Cpk per group, Pareto
  count-%, regression slope, VA%, bottleneck seconds. Each answers the question its lens asks.
- Cp/Cpk only — no Pp/Ppk anywhere in the What-If projection or the per-group capability share
  (ADR-084).
- Every contribution figure is a **suspected contribution**, never a root cause or a proof of
  cause (`contribution-not-causation`).
- The intent router maps Frame + level → native share; the user never picks a share manually.

### Forward implication

- **Aggregation tripwire.** The chained contribution-to-total must stay **within one homogeneous
  outcome/spec context** — no Cpk roll-up across heterogeneous units (ADR-073). If the chain is
  Cpk-based it brushes the design-absence rule: it must avoid names like `aggregateCpk` /
  `globalCpk` / `portfolioCpk` that `architecture.noCrossInvestigationAggregation.test.ts` guards,
  and it must respect the level-boundary checks in `scripts/check-level-boundaries.sh` (ADR-074).
  Implementers should treat the recompute as a within-context chain, not a portfolio aggregate.
- The `ProcessLevel` mapping is the seam where the level-spanning boundary policy (ADR-074) and the
  intent router meet; future lenses register their native share against a level here.

### Documentation

- The investigation-surface spec (`docs/superpowers/specs/2026-05-29-investigation-surface-design.md`)
  is the design home; this ADR is the decision home for the level-native / no-bespoke-SS-share rule.
- `eda-mental-model.md` §3.3 is the canonical source for the cumulative-variation banding thresholds.

## Alternatives considered

1. **One bespoke sum-of-squares contribution %, surfaced everywhere.** Rejected: invents a statistic
   the methodology does not teach, more formal than the practice, and collapses the WHERE/WHY
   distinction by pretending one number spans every lens and level.
2. **Remove the η² / SS engine because "no SS-share."** Rejected — and explicitly guarded against:
   the decision forbids a _user-facing_ bespoke number, not the engine-internal SS math that powers
   η² and main effects. Removing it would break the factor-variance native share itself.
3. **Build a fresh cross-lens projector for What-If.** Rejected: `computeCumulativeProjection()`
   already chains the impact simulation correctly; a parallel engine forks the aggregation rules and
   doubles the ADR-073 hazard perimeter.
4. **Expose the intent (NÄHDÄ / VERRATA / KVANTIFIOIDA / AJALLINEN) as a user-facing picker.**
   Rejected: it is derivable from Frame + level; a picker adds a mental model the user does not need
   (`feedback_prefer_pragmatic_over_formal`).
5. **Reuse `exploredPercent` as the cumulative-variation bar.** Rejected: it is R²adj-weighted
   exploration coverage, a different quantity from variation-explained-to-total.
6. **Chain every native share down levels (multiply seconds × Cpk × count-%).** Rejected: the native
   shares are heterogeneous units; chaining a value that changes units between levels is undefined,
   and forcing them onto one Cpk basis would re-create the cross-unit aggregation that the ADR-073
   guard exists to prevent. Only the dimensionless variance fraction participates in the to-total
   chain; the rest are level-local readouts.
