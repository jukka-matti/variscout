---
title: 'ADR-084: Capability indices — Cp/Cpk only, no Pp/Ppk'
status: active
date: 2026-05-18
purpose: decide
tier: living
audience: both
topic: [stats, capability, methodology, wedge-v1]
related:
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - 2026-05-16-wedge-architecture-design
layer: L5
last-verified: 2026-05-18
---

# ADR-084: Capability indices — Cp/Cpk only, no Pp/Ppk

**Status:** Accepted
**Date:** 2026-05-18

## Context

Six Sigma / SPC literature defines two parallel families of capability indices:

- **Cp / Cpk** — short-term capability, computed against **within-subgroup σ̂** (the rational-subgroup estimate). Answers: _"How capable is this process when stable?"_
- **Pp / Ppk** — long-term performance, computed against **overall total σ**. Answers: _"How did this process perform across all the variation that actually occurred, including drift, shifts, and special-cause noise?"_

Until 2026-05-18 the VariScout codebase calculated both families and surfaced Pp/Ppk in:

- `StatsResult.pp` / `StatsResult.ppk` (`packages/core/src/types.ts`)
- `computeBasicStats()` (`packages/core/src/stats/basic.ts`) — overall-σ branch
- L1 outcome panel (`SystemLevelView.tsx`) — Pp / Ppk rendered as a separate metric row alongside Cp / Cpk / Conformance
- `SystemOutcomeModel` field plumbing (`DashboardBase/internal/systemOutcomeModel.ts`)
- CoScout capability-mode prompt text ("overall Ppk is representative")
- Glossary "Capability Stability" entry framed in Ppk terms

The wedge V1 strategic pivot (2026-05-16, [ADR-082](adr-082-wedge-architecture.md)) repositions VariScout as a **single-product tool for improvement specialists** whose canonical workflow is _Charter → Approach → Sustainment_. That workflow centers on closing the gap between **what the process can do when stable** (Cp/Cpk) and **what the customer needs** (target × spec). It does not center on retrospective performance reporting across heterogeneous time windows.

Carrying both families in the V1 UI and engine creates three problems:

1. **Methodology dilution.** New users see four metrics (Cp, Cpk, Pp, Ppk) where the product's mental model only needs two. The wedge V1 positioning becomes ambiguous: "Are we a capability tool or a performance tool?" The answer is capability.
2. **Aggregation hazard surface.** Pp/Ppk are systematically harder to interpret correctly under the constraints of [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) ("no cross-investigation aggregation") because the overall-σ basis is even more sensitive to context-mixing than the within-subgroup σ̂ basis. Every Pp/Ppk site is a potential ADR-073 violation that wouldn't exist if the index didn't exist.
3. **Engine surface tax.** Every consumer that branches on `if (stats.ppk)` is a fork in the codebase that must be maintained, type-checked, tested, and reasoned about — for a number the wedge V1 product doesn't surface a workflow around.

## Decision

**VariScout calculates only Cp and Cpk. Pp and Ppk are deleted from the type system, the stats engine, the UI, the CoScout prompts, and the glossary.**

Existing Pp/Ppk references are a **removal target**, not a parallel calculation to preserve. No back-compat shim, no migration path, no feature flag, no `if (showPpk)` toggle.

The single exception is the marketing/educational website (`apps/website/src/data/learnData.ts` + `toolsData.ts`), which retains Pp/Ppk **explanatory text** framed as _"not in VariScout — here's why"_. This is reader-facing pedagogy, not active calculation, and serves the same methodology-positioning purpose this ADR encodes.

## Rationale

- **Wedge V1 positioning is sharper with one index family.** The improvement-specialist workflow (Charter → Approach → Sustainment) asks: _"Is the process capable now? If not, what intervention closes the gap?"_ — both questions answered with Cp/Cpk. Pp/Ppk asks a retrospective question (_"how did we do across all of last year's variation?"_) that fits an audit-and-report tool, which the named-future VariScout Process product can take on if a customer ever requires it.
- **Subgroup-σ̂ is the right basis for the wedge.** Rational subgrouping is the methodological core of SPC. Cp/Cpk's within-subgroup σ̂ is the index that respects subgrouping; Pp/Ppk's overall σ collapses it. Keeping only Cp/Cpk locks the tool's analytical posture to the SPC-rigor side of the road.
- **Hazard surface reduction.** Removing Pp/Ppk shrinks the [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) violation perimeter by half (in code-surface terms) before the upcoming branded-type migration (see "Consequences" below).
- **Reversibility cost is bounded.** If a future customer surfaces a hard requirement for Pp/Ppk, restoring the index is two type fields + one calculation block + one UI row + one prompt sentence. The deletion is locally reversible; the methodology-dilution cost of _keeping_ it is global.

## Consequences

### Code-level

- `StatsResult.pp` and `StatsResult.ppk` removed from `packages/core/src/types.ts`. Any caller branching on these fields breaks at compile time — intended.
- The Pp/Ppk calculation block in `packages/core/src/stats/basic.ts` is deleted. The remaining `computeBasicStats()` still computes mean, σ, σ_within, σ_overall (σ_overall is retained because non-capability surfaces use it).
- L1 outcome panel (`SystemLevelView.tsx`) renders only Cp / Cpk / Conformance — visually tighter, one fewer column.
- `SystemOutcomeModel` no longer has `pp?` / `ppk?` fields. Consumers that destructure these break at compile time — intended.
- CoScout capability-mode narration uses "overall Cpk is representative" framing instead of "overall Ppk is representative." The methodological content is unchanged (when subgroups are in control, σ_within ≈ σ_overall, so Cpk ≈ Ppk anyway).
- Glossary "Capability Stability" entry rewritten in Cp/Cpk-against-σ̂ terms.

### Methodological

- Cpk grade banding (`gradeCpk`, [target-relative per `resolveCpkTarget` cascade](../../packages/core/src/capability/)) is unchanged. The single rule remains: green if `cpk ≥ target`; amber if `cpk ≥ target × 0.75`; red otherwise. Default target is `1.33`.
- Within-investigation aggregation rules (per [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md)) are unchanged. The boundary policy explicitly enumerates "same-physics channels" and "different spec rules" cases; this ADR removes Pp/Ppk from those rules without otherwise altering them.

### Forward implication

This ADR is the **product-level precondition** for the branded-`Cp` / branded-`Cpk` migration tracked at `docs/ephemeral/investigations.md` under "Branded Cpk type as durable replacement for forbidden-name guard". With Pp/Ppk gone, the branded set narrows to exactly `Cp` + `Cpk`, each with a single typed constructor that takes a single-`SpecRule` context. When that migration ships, [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) will be amended to note that the forbidden-name guard at `architecture.noCrossInvestigationAggregation.test.ts` has been retired in favor of compile-time enforcement.

### Documentation

- `apps/website/src/data/learnData.ts` + `toolsData.ts` retain Pp/Ppk explanatory text as the public-facing methodology-positioning surface ("not in VariScout, here's why"). This is the canonical place to point users who ask.
- `feedback_no_pp_ppk_only_cp_cpk` (Claude/Codex auto-memory entry, 2026-05-18) cross-references this ADR as the durable home for the decision.

## Alternatives considered

1. **Keep both index families, hide Pp/Ppk behind a paid-tier toggle.** Rejected: introduces a UI mode no V1 customer asked for, doubles the surface to maintain, and weakens the wedge positioning.
2. **Keep both index families, demote Pp/Ppk to an advanced-mode disclosure.** Rejected: same maintenance cost without the simplification benefit.
3. **Keep Ppk only, drop Pp.** Rejected: the methodological argument is about the σ basis, not about with-vs-without target. Cp/Cpk and Pp/Ppk move as families.
4. **Defer the deletion until V2.** Rejected: every new capability surface added during V1 development that respects Pp/Ppk extends the deletion blast radius. Today's surface is the cheapest moment.
