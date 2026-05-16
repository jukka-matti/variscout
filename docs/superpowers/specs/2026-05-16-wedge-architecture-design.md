---
title: Wedge architecture — single-product VariScout for improvement specialists
audience: [product, engineer, designer, business]
category: design-spec
status: draft
last-reviewed: 2026-05-16
related:
  - docs/superpowers/specs/2026-05-14-variscout-coherence-design.md
  - docs/superpowers/specs/2026-05-14-projects-tab-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/07-decisions/adr-007-azure-marketplace-distribution.md
  - docs/07-decisions/adr-033-pricing-simplification.md
  - docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md
  - docs/01-vision/positioning.md
  - docs/01-vision/business-bible.md
  - docs/08-products/tier-philosophy.md
  - docs/roadmap.md
  - docs/decision-log.md
supersedes:
  - adr-007-azure-marketplace-distribution.md (in part — single SKU replaces tiered model)
  - adr-033-pricing-simplification.md (in part — €99 single tier replaces €79/€199 split)
  - 2026-05-14-variscout-coherence-design.md (Session A retires for V1; Session B nav amends; Session C refocuses)
---

# Wedge architecture — single-product VariScout for improvement specialists

## §1 What this spec covers

VariScout splits into **two products on a roadmap**: ship the wedge first, defer the platform.

This spec is the canonical design for **VariScout V1** — a single-tier project tool for improvement specialists. It defines product anatomy, project membership model, pricing, and the explicit deferral of platform-shaped features to a future product, **VariScout Process**.

This spec emerged from an 8-round strategic brainstorm on 2026-05-16 that questioned whether the breadth-first product design (4 personas, Hub + Project containers, tier-gating across surfaces) was making VariScout try to be too many things at once. The conversation converged on a sharper framing: today's improvement specialist is the V1 ICP; everything else is deferred.

This spec **partially supersedes** ADR-007 (distribution), ADR-033 (pricing tiers), and the Coherence audit (§9 supersession matrix below).

---

## §2 Strategic decision — two products

|                   | **VariScout (V1, this spec)**                               | **VariScout Process (future)**                 |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Audience          | Improvement specialists running projects with their team    | Enterprises with ongoing process ownership     |
| Foundational unit | Project (self-contained, invite-scoped)                     | Process Hub (multi-project orchestration)      |
| Collaboration     | Project Lead invites org users _per project_                | Tenant-wide with persona routing               |
| Data ingestion    | Manual paste + file upload                                  | Auto pipelines feeding Hub-level storage       |
| Persona model     | One — Specialist (with member-roles within projects)        | Process Owner / Project Lead / SME / Frontline |
| Pricing           | **€99/month**, single SKU, Azure-tenant-wide                | TBD — separate product                         |
| Distribution      | Azure Marketplace Managed Application + in-app project ACLs | TBD                                            |
| Privacy boundary  | Project-scoped membership (Azure AD tenant only)            | Tenant-wide with role-based access             |

**Net effect for V1:** all the conceptual complexity recently surfaced (Hub vs Project tension, 4-persona model, multi-source pipelines, tier-gating matrices) moves to a _future, separate product_. V1 is a focused, coherent thing: **the project tool an improvement specialist invites their team to.**

### Why a wedge, not a slice

A wedge is committed product strategy. The Standard/Team tier split that exists today markets VariScout as one thing while _building_ it as two. The wedge collapses that — one product, one price, one pitch. The breadth-first vision (process ownership, auto data, Hub portfolios) is preserved as a separate roadmap item (VariScout Process), not as hidden complexity inside V1.

### Positioning unchanged

_"Structured investigation for process improvement"_ — the tagline still works. V1 delivers the whole sentence for one project lead and their invited team. No rebrand needed.

---

## §3 V1 product anatomy

### §3.1 Nav: 6 tabs, in workflow order

```
[Home] [Projects] [Process] [Analyze] [Investigation] [Report]
```

Left-to-right matches the specialist's flow:

1. **Home** — pick what you're working on (project queue + active-IP launchpad)
2. **Projects** — current project's status overview (the IP detail page is here)
3. **Process** — canvas / process map (spatial substrate)
4. **Analyze** — EDA / charts / Factor Intelligence
5. **Investigation** — Wall + Evidence Map → suspected causes
6. **Report** — narrative output

The **Improve tab is removed as a top-level surface**. Improve becomes a stage _inside Projects detail_.

This order supersedes the Coherence §4 nav (which placed Process between Home and Analyze and put Projects later). Workflow-order grouping is stronger than the verb-noun grouping rationale Coherence used.

### §3.2 Projects detail: 4 stages

`Charter → Approach → Improve → Sustainment`

Handoff stage is **folded into Sustainment closure**. Single end-of-project decision moment.

| Stage           | Function                                                                | UI                                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Charter**     | Frame problem, define outcome spec, ingest data, set project membership | Goal narrative + outcome panel + data paste + invite modal                                                                                                                                                                  |
| **Approach**    | Investigation strategy → produces suspected causes                      | SuspectedCause-anchored hierarchy; links to Wall + Evidence Map                                                                                                                                                             |
| **Improve**     | Action tracker                                                          | Single-list UI (default): improvement actions + quick actions, owner/due/status, linked to suspected causes. **PDCA workbench + What-If accessible via an "Advanced" toggle** (progressive disclosure, not a parallel mode) |
| **Sustainment** | "Did it work?" + close project                                          | Cpk delta + action completion + drift since closure + Mark complete / Reopen for follow-up                                                                                                                                  |

### §3.3 Process tab + Canvas: unchanged, stays foundational

Locked by Coherence §4.304 + §4.324 — canvas IS the Process tab's architectural substrate, not a removable surface. 8f viewport architecture (PRs #160–#168) intact.

**3 response paths from canvas drill at V1:**

- **Investigate** → opens Wall + Evidence Map scoped to step
- **Quick Action** → creates tracked item in active IP's Improve stage
- **Charter** → creates new IP from canvas context

Sustainment auto-fires per ADR-080 (no canvas-launch needed).
Handoff path **deleted everywhere** (folded into Sustainment closure).

### §3.4 Improve mode default + "Advanced" disclosure

The default Improve stage UI is a simple action list (action title, owner, due, status, linked suspected cause). One row per action; two action categories (improvement, quick).

The PDCA workbench survives as an **Advanced view** — accessible via a single toggle. Not a parallel mode. Power features earn visibility through user action, not menu space. The What-If simulator and the idea board / action conversion features retire (What-If may re-emerge in Analyze later if customer demand surfaces; idea board does not).

**Reason:** Two equal modes is two products in one tab. Pick one as default, hide the other behind progressive disclosure. Selected default = simple, because the wedge's promise is focus and clarity.

### §3.5 Persona collapse

Coherence Session A's 4-persona model (Pat / Dr. Chen / Fred / Project Lead) **retires for V1**. V1 has one persona — Specialist — with member-roles _inside_ projects (see §4 below). The 4-persona model migrates to VariScout Process when that ships.

Behaviorally: existing `personaRole` routing logic is deleted from the V1 codebase. Home no longer renders persona variants. The Inbox simplifies to project-scoped notifications.

---

## §4 Project membership model (new)

Membership ACLs replace persona routing. Membership is **per project**, not per tenant.

### §4.1 Roles within a project

| Role         | Capabilities                                                | Manages membership? |
| ------------ | ----------------------------------------------------------- | ------------------- |
| **Lead**     | Full edit; manages membership; sets project lifecycle stage | Yes                 |
| **Member**   | Full edit; cannot manage membership                         | No                  |
| **Reviewer** | Read + comment; for signoff workflows                       | No                  |

### §4.2 Invitation flow

Project Lead invites org users from within the buyer's Azure AD tenant. Invitation is by Azure AD identity (email or directory pick). Invitee receives in-app + email notification, accepts, becomes a Member or Reviewer (Lead's choice at invite time).

### §4.3 Cross-tenant invites — out of scope V1

Cross-Azure-AD-tenant invitations are **explicitly out of scope** for V1. Members must already be in the buyer's Azure AD tenant.

This is **a feature, not a limitation** — it creates a clean privacy boundary and aligns with the Azure Marketplace per-deployment distribution model. Buyers who need to bring in external consultants can use Azure AD guest accounts; that's overhead the buyer manages, not the product.

If pipeline analysis (§8.2) reveals significant ICP demand for cross-org invites, the SaaS distribution path becomes a future product decision, not a V1 scope creep.

### §4.4 Data isolation

Every project-scoped read is gated by a membership check. Project-owned data (canvas viewport state, evidence snapshots, findings, action items, sustainment results) is invisible to org users not invited to that project.

ACL enforcement points (eventual implementation):

- `useProjectMembershipStore` — new annotation-layer store
- Auth checks at `core/project/*` read paths
- UI: project list filters to memberships; invite modal in Charter stage

### §4.5 Tier-gating retires

Single tier means no `isPaidTier()` / `hasTeamFeatures()` branches. The ~28 files in the current codebase using tier-gating logic mostly retire. Where access-gating remains useful, the new pattern is **project-membership ACL check**, not tier check.

---

## §5 Pricing + distribution

### §5.1 Single SKU

**€99/month per Azure tenant.** Unlimited org users, unlimited projects.

Supersedes ADR-033's €79 Standard + €199 Team split. Honors ADR-033's strategic hypothesis H6 ("per-deployment beats per-seat") — €99 is still per-deployment.

### §5.2 Distribution — Azure Marketplace Managed Application

Unchanged from ADR-007. The Azure Marketplace path stays. What changes is the _in-app_ layer — project membership ACLs add fine-grained access control on top of the tenant-wide Marketplace subscription.

This is the simplest distribution path: existing infrastructure, existing billing, no SaaS rebuild. The Azure AD constraint (no cross-tenant invites in V1) is accepted as a feature.

### §5.3 PWA stays free as funnel

The PWA tier (free, browser-only, session-only storage, no file upload) remains. It's the try-before-buy funnel.

### §5.4 Migration story for existing customers

Existing customers on €79 Standard or €199 Team need a migration path. Options to be modeled (see §8.1):

- **Grandfather existing customers** at their current price for N months
- **Upgrade €79 → €99** (price increase; low churn risk per industry norms but real)
- **Downgrade €199 → €99** (price decrease; significant revenue impact per affected account — needs financial sensitivity)
- **Sunset window** with one-time conversion offer

The migration economics are a precondition (§8) — to be settled before engineering work commits.

---

## §6 Migration impact (engineering)

| Item                                                                     | Change                                                                                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Improve top-level tab                                                    | **Deleted.** Top-level route removed; redirects to Projects detail Improve stage.                                                                                                                      |
| PDCA workbench, What-If                                                  | **Retained as "Advanced" view** inside Improve stage. Simple action tracker is default; Advanced is one toggle. No parallel modes.                                                                     |
| Idea board, action conversion                                            | Retired. Direct action creation only.                                                                                                                                                                  |
| Projects detail stages                                                   | Rename Sustainment+Handoff → Improve+Sustainment. New Improve stage component (action list, reuses extracted primitives). Handoff stage UI deleted; close-project logic folds into Sustainment screen. |
| Canvas response paths                                                    | Reduce from 5 to 3 (Investigate, Quick Action, Charter). Handoff path deleted everywhere. Sustainment auto-fire pattern (ADR-080) preserved.                                                           |
| Persona routing                                                          | `personaRole` logic deleted. Home renders single shape. Inbox simplifies.                                                                                                                              |
| **Project membership ACLs (new)**                                        | New data model: `ProjectMember`, `Invitation`, role enum (Lead/Member/Reviewer). Auth checks at every project-scoped read. Medium build.                                                               |
| `useCanvasViewportStore` keying                                          | Re-key from `ProcessHubId` to `ProjectId`. Migration for stored viewport state.                                                                                                                        |
| `ProcessHub` data model                                                  | Demote to internal label OR retire entirely in favor of Project as top-level entity. Decision deferred to implementation plan; default = retire.                                                       |
| Tier-gating logic (~28 files using `isPaidTier()` / `hasTeamFeatures()`) | Most retires. Replace with project-membership ACL checks where access-gating is still needed.                                                                                                          |
| ADR-007 + ADR-033                                                        | Mark superseded by this spec; link to new wedge ADR.                                                                                                                                                   |
| Coherence spec                                                           | Partial supersession — see §9.                                                                                                                                                                         |
| Projects-tab design spec                                                 | Amend stage list (Charter/Approach/Improve/Sustainment), update §5.2 cascade table, add project-membership model, remove persona-routing references.                                                   |

### What's untouched (the foundation holds)

- Process tab + canvas + 8f viewport architecture (just re-keyed to ProjectId)
- Frame step in Process tab Edit mode
- Investigation Wall + Evidence Map (Detective pack)
- Analyze tab + EDA + Factor Intelligence + Filter Chips
- Report (#181) — same component, single-tier render
- Storage architecture (PWA / Azure Managed App + Blob)
- Statistical engine (continuous regression, ANOVA, capability, NIST validation)
- i18n
- Multi-level SCOUT V1 (in flight; doesn't conflict)
- Tier-gating philosophy lives on internally as "feature-gating by project membership"

### Rough sizing

~6–8 engineering PRs across ~3–4 weeks. Plus 1 docs/spec PR (this spec + new wedge ADR + supersession markers on ADR-007 + ADR-033 + decision-log entry + Coherence + Projects-tab spec amendments + roadmap refresh + canonical anchor amendments).

---

## §7 VariScout Process — explicit deferrals

The following are **out of V1 scope** and migrate to VariScout Process as a future product. Not "coming soon" inside V1; entirely separate product on the roadmap.

- **Process Hub as a first-class container** — multi-project orchestration, Hub portfolios, Hub-keyed canvas viewport state
- **4-persona model** — Process Owner / Project Lead / SME / Frontline routing + persona-adaptive Home variants
- **Automated data pipelines** — auto-feeding Blob storage with sensor / SCADA / ERP data
- **Multi-source ingestion** at Hub level — the Framing Layer slice 4 work continues for V1 but scopes to project-level multi-source
- **Process Owner-shaped cadence monitoring dashboard** — State-mode-only Hub overview surface (separate from Process tab)
- **Knowledge Catalyst at Hub scale** — cross-project pattern memory federated across an org's whole process portfolio
- **Tier-gating philosophy** as a public-facing concept (collapses to single-SKU in V1)

VariScout Process is **not announced in V1 marketing**. It's an internal roadmap commitment, mentioned only when customers ask about enterprise / process-ownership use cases.

---

## §8 Three preconditions before committing to engineering

These are strategic checks the business needs to clear _before_ engineering commits. None block spec-writing or documentation work; all block code-level execution.

### §8.1 Migration math (30-minute exercise)

Model: what % of current revenue is €79 Standard accounts vs €199 Team accounts? What's the churn risk on €79 → €99 (price increase, real but small) vs €199 → €99 (price decrease, real revenue hit per account)? Pick a grandfathering window option.

If the financial sensitivity is bad enough, the wedge needs adjustment (e.g., €129 single SKU, or grandfather forever, or stage the transition).

### §8.2 Azure AD invitation constraint — accepted as feature

Confirm: customers needing external collaborators (consulting MBBs, multi-org SMEs) are out of V1 ICP. Check pipeline / existing customer mix.

If a meaningful slice of pipeline depends on cross-org collaboration, the SaaS distribution path becomes a precondition instead of a future option.

### §8.3 One customer validation conversation

Pitch the wedge to one real improvement specialist (existing customer or warm prospect). Verify "yes, that's the product I want." 30-minute call.

If they push back hard on something foundational (e.g., "I really need Process Owner monitoring"), pause and revisit.

---

## §9 Supersession + amendment matrix

This spec partially supersedes three prior specs/ADRs.

### §9.1 ADR-007 (Azure Marketplace distribution) — superseded in part

**Stays:** Azure Marketplace Managed Application as the distribution path.
**Changes:** Tiered SKU model (Standard + Team) → single €99 SKU + project membership ACLs.
**Marker:** Add `## Amendment — 2026-05-16` block referencing this spec.

### §9.2 ADR-033 (Pricing simplification) — superseded in part

**Stays:** Strategic hypothesis H6 ("per-deployment beats per-seat") is honored.
**Changes:** €79/€199 tier split → single €99 SKU. PWA stays free.
**Marker:** Add `## Amendment — 2026-05-16` block referencing this spec.

### §9.3 Coherence audit (2026-05-14) — partial supersession ("Coherence V2")

| Coherence Session                                                   | Wedge impact                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Session A — Persona model (4 personas locked)**                   | **Retires for V1.** Migrates to VariScout Process. V1 has Specialist + project-membership roles.                                                                                                                                                       |
| **Session B — Surface + Vocabulary (7-tab nav, verb/noun split)**   | **Amends.** Nav drops to 6 tabs in workflow order. Improve removed as tab. Verb/noun separation retained where it survives.                                                                                                                            |
| **Session C — Pedagogy + visual identity + Inbox + a11y (pending)** | **Refocuses, then closes.** First-60s narrative becomes "create your first project, paste data, frame on canvas, invite a teammate." One voice, one design system. Inbox simplifies to project-scoped notifications. Visual identity + a11y unchanged. |
| **§15 IP-detail carry-forward**                                     | Already closed by Projects-tab work (#172–#181).                                                                                                                                                                                                       |
| **§16 spec contributions matrix**                                   | Update — this spec becomes the new top-level driver.                                                                                                                                                                                                   |

The Coherence spec is **not amended in-line** — it gets a partial-supersession header pointing at this spec. The pieces still valid (Session B vocabulary, Session C refocused scope) live here.

### §9.4 Projects-tab design spec (2026-05-14) — amended

PRs #172–#181 are mostly wedge-aligned because they're already project-centric. The persona-routing hooks (active-IP store reads `personaRole`, Home shows persona variants) need de-personalization — small refactor, not a rewrite.

Amendments:

- Stage list: `Charter / Approach / Sustainment / Handoff` → `Charter / Approach / Improve / Sustainment` (Handoff folded into Sustainment).
- §5.2 cascade table: remove persona-specific routing rules; add project-membership scope.
- Add §11 project-membership model (references §4 of this spec).
- Remove persona-routing references from Home active-IP launchpad section.

### §9.5 Decision-log entry

Append a 2026-05-16 entry capturing the wedge pivot, listing the supersessions and the three preconditions.

---

## §10 Out of V1 scope (explicit)

Stated clearly so subsequent specs / plans don't reintroduce by accident:

- Process Hub as a top-level user-visible container
- Process Owner persona / persona routing
- Cross-Azure-AD-tenant invitations
- Automated data pipelines
- Multi-tier pricing (€79 / €199 / Enterprise)
- PDCA workbench as a default UI (only as Advanced disclosure)
- What-If simulator (retired; may re-emerge in Analyze later)
- Idea board / action conversion (retired)
- 4-persona Home variants (retired)
- VariScout Process announcement in V1 marketing

---

## §11 Open items to settle during implementation plan

- **`ProcessHub` data model fate**: demote to internal label, or retire entirely? Default = retire; revisit if migration of stored Hub-keyed state proves expensive.
- **PDCA "Advanced" view scope**: which current Improve-tab features survive as the Advanced disclosure? Default: only PDCA workbench survives as Advanced; What-If retires (or moves to Analyze later); idea board retires.
- **Project membership role names**: Lead / Member / Reviewer suggested. Final names + permission matrix in implementation plan.
- **Grandfathering policy for existing customers** — settled in §8.1 precondition.
- **Free PWA fate** — stays as funnel by default; revisit only if Azure Marketplace single-SKU pricing changes the funnel math.

---

## §12 Verification — how we'll know V1 works once shipped

- **Standard specialist flow (golden path):** create project → frame on canvas → drill → investigate → suspected causes → improve actions → sustainment closure → report. End to end in <30 minutes with seeded sample data.
- **Collaboration flow:** Project Lead invites Member, both edit the same project simultaneously; Reviewer can view + comment but not edit.
- **Membership ACL test:** org user not invited to Project A cannot see Project A's data via direct URL access.
- **Coherence audit re-run** after amendment: no orphaned references to Improve top-level tab, Handoff stage, PDCA workbench-as-default, What-If, 4-persona Home variants.
- **ESLint architecture tests pass** (ADR-073 + ADR-074 boundaries unchanged).
- **Pre-commit doc-validation hook** clean (no orphan docs, no broken cross-refs).
- **All shipped tests continue to pass**; new tests added for project membership ACLs + Improve stage component + Sustainment closure absorbing Handoff.

---

## §13 Implementation sequencing (high level — detailed plan to follow)

1. **Audit round** (Phase C.1 of holistic doc cleanup) — dispatch parallel Explore subagents to triage ~500 docs into KEEP / AMEND / ARCHIVE / DELETE.
2. **Three preconditions** clear (§8).
3. **Canonical anchor docs** updated (OVERVIEW, USER-JOURNEYS, DATA-FLOW, positioning, business-bible, tier-philosophy, roadmap, decision-log, root CLAUDE.md, llms.txt).
4. **Wedge ADR** written; ADR-007 + ADR-033 supersession markers added.
5. **Coherence + Projects-tab spec amendments**.
6. **Implementation plan** promoted via `writing-plans` skill.
7. **Engineering PRs** executed via `subagent-driven-development` (Sonnet workhorses, Opus for final-branch review). Each PR amends nearest docs in-PR (Phase B).
8. **Apply round** (Phase C.3) — bulk archive / amend / delete operations against the triage table.
9. **Doc-validation hook** clean-up + transient triage file deletion.

---

## §14 Open question for the reviewer

Is there anything in the V1 anatomy that doesn't earn its keep? The brainstorm path was _toward simplification_ — if you read this spec and find yourself thinking "we could drop X too," that's the right reflex. The wedge should be defensibly minimal. Push back before this spec promotes to an implementation plan.
