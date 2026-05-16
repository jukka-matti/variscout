---
tier: living
purpose: decide
title: 'ADR-082: Wedge architecture — single-product VariScout'
---

# ADR-082: Wedge architecture — single-product VariScout for improvement specialists

**Status:** Accepted
**Date:** 2026-05-16
**Supersedes (in part):** ADR-007 (Azure Marketplace distribution — single SKU replaces tiered), ADR-033 (€79/€199 tier split — single €99 SKU)
**Partially supersedes:** [Coherence audit spec (2026-05-14)](../superpowers/specs/2026-05-14-variscout-coherence-design.md) — Session A retires for V1, Session B amends, Session C refocuses

## Context

After shipping the Projects tab redesign (PRs #172–#181) and reviewing the breadth of the current product surface — 7 tabs, 4 personas, Hub + Project containers, tier-gating across ~28 files, multi-source data ingestion plans, automated process-owner monitoring concepts — a strategic question surfaced: is VariScout trying to be too many things at once?

The current model commits to two implicit products inside one codebase:

- **A specialist tool**: improvement specialist runs a project, finds suspected causes, takes action, verifies improvement.
- **A platform**: enterprise with process ownership, automated data pipelines, Hub portfolios, multi-persona workflows.

Building both simultaneously creates conceptual surface area (Hub vs. Project tension, persona-routing matrices, tier-gating UX decisions, dual-mode Improve workbench) that delays validation of either.

The 2026-05-16 brainstorm session converged on a clearer framing: ship the specialist tool first as a coherent product; defer the platform features to a future, separate product.

## Decision

Split VariScout into two products on a roadmap. Ship the wedge first.

### Product 1 — VariScout (V1, this ADR)

- **Audience**: Improvement specialists running projects with their team.
- **Two analyst modes**: quick analysis (no project) + project-anchored (formal lifecycle). Both first-class. Promotion path: any quick analysis can become a Project; Charter inherits prior Hub state.
- **Foundational unit (formal)**: Project (self-contained, invite-scoped). **Hub** stays as the _internal_ data container backing Process tab + paste data; not surfaced as a user-visible noun.
- **Collaboration**: Project Lead invites org users _per project_ (not tenant-wide).
- **Persona model**: One — Specialist. Project-membership roles: **Lead** (full edit + manages membership), **Member** (full edit), **Sponsor** (Report-only access; signoff out-of-band at V1).
- **Investigation model**: Investigation Wall is the canonical Hypothesis-driven surface. Extended with **Measurement Plan** sub-entity per Hypothesis — supports hypothesis-first investigation (plan → collect → finding → confirm/refute) without a separate Measure stage. Both data-first and hypothesis-first starting points converge on the Wall.
- **Pricing**: **€99/month**, single SKU, Azure tenant-wide, unlimited org users, unlimited projects.
- **Distribution**: Azure Marketplace Managed Application + in-app project membership ACLs (Hub-level data tenant-wide; Project-level data membership-gated).
- **Privacy boundary**: Project-scoped membership within Azure AD tenant. Cross-AD-tenant invitations explicitly out of scope.

### Product 2 — VariScout Process (future, separate roadmap item)

- **Audience**: Enterprises with ongoing process ownership.
- **Foundational unit**: Process Hub (multi-project orchestration).
- **Persona model**: 4 personas (Process Owner / Project Lead / SME / Frontline).
- **Data**: Auto pipelines feeding Hub-level Blob storage.
- **Distribution + pricing**: TBD.
- **Status**: Internal roadmap commitment. Not announced in V1 marketing; mentioned only when customers ask about enterprise / process-ownership use cases.

### What V1 builds

| Surface                                                                  | Status                                                                                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 6-tab nav `Home · Projects · Process · Analyze · Investigation · Report` | Refactored from current 7-tab                                                                                                    |
| Projects detail: 4 stages `Charter → Approach → Improve → Sustainment`   | Improve becomes a stage (was a top-level tab); Handoff folds into Sustainment                                                    |
| Improve UI = simple action tracker by default                            | PDCA workbench retained behind an "Advanced" toggle (progressive disclosure, not a parallel mode)                                |
| Process tab + canvas + Frame step                                        | Unchanged (canvas is foundational substrate per ADR-081)                                                                         |
| Canvas response paths from step drill                                    | Reduced from 5 to 3 (Investigate, Quick Action, Charter); Handoff path deleted                                                   |
| Project membership ACLs                                                  | New data model: `ProjectMember`, `Invitation`, role enum (Lead/Member/Sponsor)                                                   |
| Investigation Wall + Measurement Plans                                   | Wall extended with `MeasurementPlan` sub-entity per Hypothesis. Supports hypothesis-first flow without a separate Measure stage. |
| Tier-gating (`isPaidTier()` / `hasTeamFeatures()`)                       | Mostly retires (single SKU); replaced where useful by project-membership checks                                                  |
| Persona routing (`personaRole`)                                          | Deleted from V1 codebase (migrates to VariScout Process)                                                                         |
| PWA tier                                                                 | Stays free as try-before-buy funnel                                                                                              |

### Pricing rationale

€99/month single SKU is chosen because:

- Honors ADR-033's strategic hypothesis **H6** ("per-deployment beats per-seat") — €99 is still per-deployment.
- Sits between the retired €79 Standard and €199 Team, weighted slightly toward Standard to keep the SME purchasing-threshold logic (€99/mo = €1,188/year, just above the €1,000 SME threshold but acceptable given the upgraded V1 product scope — Standard's investigation-only role expands to full DMAIC arc).
- Eliminates the Standard vs Team decision moment, simplifying sales conversation to "€99/month, Azure tenant-wide, invite your team per project."
- Single SKU = single billing path = no tier-gating UX engineering.

### Privacy and ACL rationale

Project-scoped membership creates a defensible privacy boundary that tenant-wide access can't provide. Users not invited to Project X cannot see Project X's data, even though they're in the same Azure tenant as the buyer. This is sellable as a feature (GDPR, SOC2 alignment, customer-paranoia mitigation) and is the _primary justification_ for adding ACL complexity in V1.

The Azure AD tenant boundary is the outer scope: cross-AD-tenant invites would require either Azure AD guest accounts (managed by buyer) or a SaaS distribution rebuild. Both are deferred. Cross-org collaboration is acknowledged as out-of-V1-ICP.

## Migration

### Existing customers

Customers currently on €79 Standard or €199 Team need a migration path. Modeled options (to be settled per spec §8.1 precondition):

- Grandfather existing customers at current price for N months.
- Upgrade €79 → €99 (real but small churn risk).
- Downgrade €199 → €99 (price decrease — material revenue hit per affected account; requires financial sensitivity check).
- Sunset window with one-time conversion offer.

### Engineering

~6–8 PRs, ~3–4 weeks. The recent week's foundation work (PRs #172–#181) is mostly wedge-aligned and stays valid. The main engineering items:

- Delete Improve top-level tab; redirect to Projects detail Improve stage.
- Rename Projects detail stages (Sustainment+Handoff → Improve+Sustainment); fold Handoff close-logic into Sustainment.
- Add Improve stage component with simple list default + Advanced PDCA toggle.
- Add project membership ACL data model + auth checks.
- Re-key canvas viewport state from ProcessHubId to ProjectId.
- Delete persona-routing logic.
- Reduce canvas response paths from 5 to 3.

### Documentation

~500 docs reviewed. Handled via three-round Audit → Triage → Apply pattern (see [wedge spec §13](../superpowers/specs/2026-05-16-wedge-architecture-design.md)):

1. Audit (parallel Explore subagents produce triage table)
2. User reviews triage
3. Apply (parallel subagents handle ARCHIVE/AMEND/DELETE batches)

Archive over delete: institutional knowledge preserved in `docs/archive/`.

## Preconditions before engineering commits

Three strategic checks must clear before engineering work commits (see wedge spec §8):

1. **Migration math** — 30-minute financial sensitivity on €79 → €99 (small price increase) and €199 → €99 (real revenue hit per account).
2. **Azure AD invitation constraint accepted as feature** — confirm V1 ICP doesn't depend on cross-org collaboration.
3. **One customer validation conversation** — 30-minute pitch to a real specialist, confirm "yes, that's the product I want."

If any block, pause and revisit.

## Consequences

### Positive

- **One product, one price, one pitch** — sales conversation collapses to a Stripe-checkout-page sentence.
- **Privacy is a feature** — project-scoped membership genuinely defensible vs. tenant-shared access.
- **Architecture simplification** — tier-gating matrix → switch; persona routing → ACL check; Hub container → optional internal label.
- **Faster validation** — wedge market validation possible without enterprise sales motion.
- **Future product (VariScout Process) creates honest expansion story** — when wedge validates, Process becomes the enterprise upsell.

### Negative

- **Walking away from breadth-first vision** — Hub portfolios, process ownership, multi-source pipelines, 4-persona model all defer to a separate, unscheduled product.
- **Lower V1 ARPU** — no €199 Team upgrade lever; only €99 SKU until VariScout Process ships.
- **Existing customer migration cost** — price changes are real money; grandfathering reduces but doesn't eliminate revenue impact.
- **Azure AD constraint** — customers needing external collaborators (consulting MBBs, multi-org SMEs) are out of V1 ICP.
- **VariScout Process becomes a real commitment** — once named on the roadmap, it's a promise customers can ask about.

### Risks

- If the V1 specialist market is too small, no upgrade lever exists until VariScout Process ships (at least a year out).
- If existing €199 Team customers churn on the price decrease (low risk but real), revenue dip is concentrated.
- If Azure AD invitation friction is more painful than expected, ICP narrows further.

Mitigation in all three cases: the three preconditions are exactly the checks that catch these before code commits.

## Related artifacts

- Wedge architecture spec (canonical V1 design): `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`
- Decision log entry: `docs/decision-log.md` 2026-05-16
- ADR-007 (superseded in part — pricing section): `docs/07-decisions/adr-007-azure-marketplace-distribution.md`
- ADR-033 (superseded in part — tier model): `docs/07-decisions/adr-033-pricing-simplification.md`
- Coherence audit (partially superseded — Session A retires, Sessions B+C refocus): `docs/superpowers/specs/2026-05-14-variscout-coherence-design.md`
- Projects tab design (to be amended — stage list change): `docs/superpowers/specs/2026-05-14-projects-tab-design.md`
- ADR-080 (preserved — Sustainment auto-fire pattern): `docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md`
- ADR-081 (preserved — canvas viewport architecture): `docs/07-decisions/adr-081-canvas-viewport-architecture.md`
