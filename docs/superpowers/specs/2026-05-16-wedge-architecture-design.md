---
tier: living
purpose: design
title: Wedge architecture — single-product VariScout for improvement specialists
audience: human
category: design-spec
status: draft
last-reviewed: 2026-05-16
related:
  - docs/archive/specs/2026-05-16-improve-tab-amendment-design.md
  - docs/archive/specs/2026-05-14-variscout-coherence-design.md
  - docs/archive/specs/2026-05-14-projects-tab-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/07-decisions/adr-007-azure-marketplace-distribution.md
  - docs/07-decisions/adr-033-pricing-simplification.md
  - docs/07-decisions/adr-080-control-auto-fire-pattern.md
  - docs/01-vision/positioning.md
  - docs/01-vision/business-bible.md
  - docs/08-products/tier-philosophy.md
  - docs/roadmap.md
  - docs/decision-log.md
supersedes:
  - adr-007-azure-marketplace-distribution.md (in part — single SKU replaces tiered model)
  - adr-033-pricing-simplification.md (in part — €120 single tier replaces €79/€199 split)
  - 2026-05-14-variscout-coherence-design.md (Session A retires for V1; Session B nav amends; Session C refocuses)
layer: spec
implements:
  - docs/01-vision/positioning.md
  - docs/01-vision/business-bible.md
  - docs/01-vision/product-overview.md
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/ia-nav-model.md
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
| Pricing           | **€120/month**, single SKU, Azure-tenant-wide               | TBD — separate product                         |
| Distribution      | Azure Marketplace Managed Application + in-app project ACLs | TBD                                            |
| Privacy boundary  | Project-scoped membership (Azure AD tenant only)            | Tenant-wide with role-based access             |

**Net effect for V1:** all the conceptual complexity recently surfaced (Hub vs Project tension, 4-persona model, multi-source pipelines, tier-gating matrices) moves to a _future, separate product_. V1 is a focused, coherent thing: **the project tool an improvement specialist invites their team to.**

### Why a wedge, not a slice

A wedge is committed product strategy. The Standard/Team tier split that exists today markets VariScout as one thing while _building_ it as two. The wedge collapses that — one product, one price, one pitch. The breadth-first vision (process ownership, auto data, Hub portfolios) is preserved as a separate roadmap item (VariScout Process), not as hidden complexity inside V1.

### Positioning unchanged

_"Structured investigation for process improvement"_ — the tagline still works. V1 delivers the whole sentence for one project lead and their invited team. No rebrand needed.

---

## §3 V1 product anatomy

### §3.0 Two analyst modes — both first-class

V1 serves two distinct workflows, both as primary use cases:

1. **Quick analysis (exploratory)** — analyst pastes data, explores in charts, optionally creates Findings and Hypotheses. _No Project required._ Free PWA supports this in session-only mode; Azure tier adds persistence and collaboration.
2. **Project-anchored investigation** — analyst (or anyone in the tenant) creates a Project (Charter ceremony). The Project wraps an existing Hub with formal lifecycle (Charter → Approach → Control) and project-membership ACLs.

**Hub goes internal, not retired.** The "Hub" (the data container holding paste data + outcome + process map + factors) survives as the internal data architecture. It is _not_ surfaced as a user-visible noun in V1 — only "Project" and "Process" appear in the UI. Tenant users can paste data and analyze without ever creating a Project. Projects are the optional formal wrapper.

**Promotion path.** At any moment during quick analysis, the analyst can promote their work to a Project via a "+ New Project" / "Promote to Project" CTA (available in Home, Analyze, Investigation, and from canvas drill per §3.3.4). The newly-created Project's Charter inherits the current Hub state — data, outcome, factors, framing narrative, any Findings, any Hypotheses, current canvas viewport — and asks only for project-formal metadata: issue statement, member invites, optional refined goal. Nothing already done gets lost.

This split — Hub internal, Project optional — preserves the free-PWA fast-paste-and-analyze flow that's central to VariScout's onramp, while making formal project ceremony available when the work justifies it.

### §3.1 Nav: 7 tabs, in workflow order

```
[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]
```

Left-to-right matches the specialist's flow:

1. **Home** — pick what you're working on (project queue + active-IP launchpad)
2. **Project** — active project's status overview (the IP detail page is here; singular per the active-IP-centric cascade)
3. **Process** — canvas / process map (spatial substrate)
4. **Analyze** — EDA / charts / Factor Intelligence
5. **Investigation** — Wall + Evidence Map → suspected causes
6. **Improve** — action tracker for the active IP (default action list; PDCA workbench behind Advanced toggle per §3.4)
7. **Report** — narrative output

**Improve is a top-level verb tab** with active-IP cascade — same scoping pattern as Analyze and Investigation. Empty-state when no active IP routes to Home via `<NoActiveProjectGuidance>`. (Earlier wedge drafts removed Improve as a tab and folded it into Project detail; the 2026-05-16 amendment restored it — see §15.)

This order supersedes the Coherence §4 nav (which placed Process between Home and Analyze and put Projects later). Workflow-order grouping is stronger than the verb-noun grouping rationale Coherence used.

### §3.2 Project detail: 3 stages

`Charter → Approach → Control`

Improve is **not** a stage — it lives as a top-level verb tab (§3.1) with active-IP cascade, so the action tracker is always one click away regardless of which Project-stage panel is open. Handoff is **folded into Control closure**. Single end-of-project decision moment.

**Charter is optional.** Quick analysis (per §3.0) does not require a Project; this stage list only applies when the analyst formalizes work into a Project. Charter inherits any prior Hub-level framing, Findings, and Hypotheses on promotion (see §3.0 promotion path).

| Stage        | Function                                                                                                                                                                                            | UI                                                                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Charter**  | Wrap an existing Hub with project ceremony — issue statement, member invites, optional refined goal. Inherits the Hub's framing (outcome spec, data, factors, process map) rather than re-doing it. | Issue statement form + Invite modal + (read-only) inherited Hub context summary. _Existing data paste / framing primitives stay at Hub level, not re-mounted inside Charter._ |
| **Approach** | Investigation strategy → produces suspected causes. Anchor surface is the **Investigation Wall** (see §3.6 — Hypotheses + Findings + Measurement Plans).                                            | SuspectedCause-anchored hierarchy; links to Wall + Evidence Map                                                                                                               |
| **Control**  | "Did it work?" + close project                                                                                                                                                                      | Cpk delta + action completion + drift since closure + Mark complete / Reopen for follow-up                                                                                    |

Improvement actions, PDCA workbench, and What-If live in the **Improve tab** (§3.4), not under a Project stage panel.

**Issue Statement vs Problem Statement.** What the user types at Charter is an **Issue Statement** (free-text, ≤ 500 chars — captured by `AnalysisBrief.issueStatement` in `packages/core/src/findings/types.ts`). The structured **Problem Statement** is auto-synthesized later in the Approach stage via `buildProblemStatement()` from `packages/core/src/findings/problemStatement.ts`, using Watson's 3 Questions framework, with maturity stages (`partial` → `actionable` → `with-causes`). The Approved Problem Statement (locked by Lead) is what the Report renders. Distinct concepts at distinct lifecycle stages.

### §3.3 Process tab — canvas substrate + State/Edit modes + Specialist content

> **DELIVERED 2026-05-29 by [State/Edit mode rethink + linked-views Phase 1](2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md)** (PRs #232–#240). The Process tab now uses canvas direct-manipulation (no State/Edit binary); scope-chrome + live cross-tab visualization live in Explore. §3.3 below is preserved as design rationale; refer to the 2026-05-28 spec for shipped reality.

Canvas IS the Process tab's architectural substrate, not a removable surface (locked by Coherence §4.304 + §4.324). 8f viewport architecture (PRs #160–#168) is intact. The §3.3 subsections below port Coherence §4's Process tab design forward into the wedge, with persona references de-personalized (single Specialist replaces the Process Owner / Project Lead split).

#### §3.3.1 Two modes within one tab — State (default) and Edit

The Process tab does one job: _"this process — its current state and structure."_ That includes viewing state AND editing structure (framing). Implemented as two modes within one tab, not two tabs:

| Mode                | Content                                                                                                                                                               | Default when                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **State** (default) | Read-only: outcome panel, process map with state badges, decisions queue, reference links to active IPs / actions / investigations                                    | Specialist is monitoring or navigating                                   |
| **Edit**            | Editable: structure authoring (add/rearrange steps, assign columns, set CTQ specs, define outcome specs, multi-source joins). This is where the **Frame step** lives. | Specialist is framing or refining the process structure in Charter stage |

Mode toggle via "Edit map" affordance in Process tab header. Visual chrome changes in Edit mode (editing toolbar appears, ChipRail of unassigned columns visible, hover states active, "Done" exits to State mode).

#### §3.3.2 State-mode content — four sections, layered top-to-bottom

1. **Needs your decision** (primary attention; indigo-accent cards) — items requiring the Specialist's input across their active projects:
   - Drift escalations (Cpk degradation, control-chart out-of-control signals, breach of spec)
   - Sustainment cadence prompts (project ready for "did it work?" verification per ADR-080 auto-fire)
   - Member-action assignments (Lead assigned the Specialist to a finding or action)
   - Pending Measurement Plans on the Specialist's active Hypotheses (per §3.6)
   - _Sponsor signoffs are NOT in this queue_ — Sponsor signoff is handled out-of-band in V1 (per §4.1)
2. **Current state** — outcome chart + Cpk + drift indicators (L1 outcome panel). Scoped to active IP when IP-context is active; whole-process when free-roaming.
3. **Process map** — compact step badges color-coded by state (L2 process flow). Click a step → drill to L3 focal-step detail; canvas drill surfaces the 3 V1 response paths (see §3.3.4 below).
4. **In-flight references** — IPs in progress, recent actions, open investigations (read-only links to Projects tab / Improve stage / Investigation tab respectively).

#### §3.3.3 Canvas as substrate — L1/L2/L3 via pan/zoom

"Canvas" is the design-doc term for the Process tab's architectural pattern. "Process tab" is the UI label. The pattern:

- **L1 — Outcome view**: outcome distribution + Cpk vs spec + drift + time series. Scoped to active IP's outcome when IP-context is active.
- **L2 — Process flow view**: full process map with step cards, mini-charts on steps, state badges, editable tributaries in Edit mode.
- **L3 — Focal step (Local Mechanism) view**: focal step detail + Evidence Map / Wall mirror for that step's investigation lineage.

Pan/zoom navigation between levels per 8f Canvas Viewport Architecture (`useCanvasViewportStore`, key changes from `ProcessHubId` to `ProjectId` under the wedge per §6).

#### §3.3.4 Response paths from canvas drill — 3 at V1

Click a step card on Canvas L2 → drill to L3 focal-step detail → 3 response-path CTAs surface:

- **Capture as Finding** → records a Hub-level Finding scoped to this step (no IP commitment required; for "I noticed something" observations). Same data primitive that chart-drill Findings use.
- **Investigate** → opens Wall + Evidence Map scoped to step
- **Charter** → creates a new IP with this step / focal data as initial Charter-stage context

The user-intent gradient across the three paths is **record → explore → commit**. Sustainment auto-fires per ADR-080 (no canvas-launch needed — fires when the project's Improve stage actions complete or when sustainment cadence triggers fire). Handoff path **deleted everywhere** (folded into Sustainment closure per §3.2).

#### §3.3.5 Level × View × Focus model — Process tab owns Level + View

Three orthogonal navigation axes (per Coherence §5):

| Axis      | What it controls                                                      | Tab that owns it              |
| --------- | --------------------------------------------------------------------- | ----------------------------- |
| **Level** | Navigational scope (L1 outcome / L2 flow / L3 mechanism)              | Process tab (Canvas viewport) |
| **View**  | Spatial rendering at this Level (Map / Flow / Yamazumi / Performance) | Process tab                   |
| **Focus** | Statistical lens (factor selection, time window, sub-group)           | Analyze tab                   |

No single tab carries all three pickers. Process tab handles Level + View; Analyze tab handles Focus. Investigation tab owns L3 mechanism work entirely (per ADR-074 boundary policy).

#### §3.3.6 IP-context routing

When the Specialist activates an IP (Home launchpad or Projects tab selection), the IP's `focusLevel` (`outcome` / `flow` / `mechanism`) routes Process tab and Analyze tab to sensible defaults:

| IP focusLevel | Process tab default (Level + View) | Analyze tab default (Focus)                       |
| ------------- | ---------------------------------- | ------------------------------------------------- |
| `outcome`     | L1 outcome view                    | Capability latest                                 |
| `flow`        | L2 + Flow View                     | Step-by-step EDA                                  |
| `mechanism`   | L3 + focal step from IP            | Factor Intelligence on the suspected-cause factor |

Process tab shows the structural slice; Analyze tab shows the statistical slice. The IP's `focusLevel` determines both. When no IP is active (free-roaming), Process tab defaults to L1 of the whole process.

### §3.4 Improve tab default + "Advanced" disclosure

The default **Improve tab** UI is a simple action list (action title, owner, due, status, linked suspected cause). One row per action; two action categories (improvement, quick). The tab is active-IP-scoped: with no active IP, it routes to Home via `<NoActiveProjectGuidance>`. Production primitive: `<ImprovementWorkspaceBase>` (see PR-WV1-2; the earlier `<ImproveStageAdvanced>` skeleton was retired in favor of the shared base per `feedback_reuse_production_primitives`).

The PDCA workbench survives as an **Advanced view** — accessible via a single toggle inside the Improve tab. Not a parallel mode. Power features earn visibility through user action, not menu space. The What-If simulator and the idea board / action conversion features retire (What-If may re-emerge in Analyze later if customer demand surfaces; idea board does not).

**Reason:** Two equal modes is two products in one tab. Pick one as default, hide the other behind progressive disclosure. Selected default = simple, because the wedge's promise is focus and clarity.

### §3.5 Persona collapse

Coherence Session A's 4-persona model (Pat / Dr. Chen / Fred / Project Lead) **retires for V1**. V1 has one persona — Specialist — with member-roles _inside_ projects (see §4 below). The 4-persona model migrates to VariScout Process when that ships.

Behaviorally: existing `personaRole` routing logic is deleted from the V1 codebase. Home no longer renders persona variants. The Inbox simplifies to project-scoped notifications.

### §3.6 Investigation Wall + Measurement Plans

The **Investigation Wall** (existing surface in `packages/ui/src/components/InvestigationWall/`) is the canonical home for Hypothesis-driven investigation. Under the wedge, the Wall extends with one new sub-entity per Hypothesis: **Measurement Plan**. This integrates measurement planning, current-data analysis, and gemba / expert collection into a single spatial surface — no separate Measure stage needed.

#### §3.6.1 Two investigation starting points — both supported

**Data-first (exploratory):** analyst pastes data → explores in Analyze → notices patterns → creates Findings → groups them into Hypotheses on the Wall. Existing flow.

**Hypothesis-first (deductive):** analyst opens the Wall → creates a Hypothesis (status `'proposed'`, no Findings yet) → adds Measurement Plan rows describing what evidence is needed → coordinates collection out-of-product → re-ingests new data via the existing paste flow → new Findings auto-link to matching Plans → Hypothesis status progresses to `'evidenced'` → `'confirmed'` / `'refuted'`.

Both flows converge on the same shape: a Hypothesis card carrying linked Findings (evidence collected) + linked Measurement Plans (evidence still needed).

#### §3.6.2 Hypothesis card structure (extended)

```
Hypothesis: "<mechanism>"
Status: <proposed | evidenced | confirmed | refuted | needs-disconfirmation>
Linked Questions / Findings / Measurement Plans

─── EVIDENCE (collected) ───
✓ Finding 1 (chart snapshot + note)
✓ Finding 2
✓ Finding 3 (gemba)

─── MEASUREMENT PLAN (what we still need) ───
⏳ Plan: factor + method + sample size + owner + status (Planned / In progress / Complete / Skipped)
⏳ Plan: ...
✓ Plan: completed → links to Finding(s) above

Actions: [Add Plan] [Add Finding] [Disconfirm] [Confirm]
```

#### §3.6.3 Measurement Plan entity (V1)

| Field               | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `factor`            | What variable to measure                                      |
| `method`            | Sensor / manual count / gemba walk / expert assessment / etc. |
| `sampleSize`        | Target count (manual entry; no statistical calculator in V1)  |
| `owner`             | Who's responsible (project member)                            |
| `status`            | Planned / In progress / Complete / Skipped                    |
| `hypothesisId`      | Which Hypothesis this serves                                  |
| `linkedFindingIds?` | Once collected, which Findings the data became                |
| `msaRequired?`      | Stub flag for "Gage R&R needed" (informational only in V1)    |

#### §3.6.4 Plan → Collection → Finding cycle

1. Analyst adds a Measurement Plan row to a Hypothesis (status `Planned`).
2. Real-world collection happens out-of-product (gemba walk, sensor pull, manual log).
3. Analyst returns: pastes new data via the existing PasteScreen flow OR enters a gemba / expert Finding directly.
4. New Finding is created → analyst (or auto-suggestion if factor + window match) links it to the Measurement Plan row.
5. Plan status → `Complete`. Plan row shows ✓ and a reference to the linked Finding(s).
6. Hypothesis status progresses (`proposed` → `evidenced` → ...) per the existing Wall logic.

#### §3.6.5 Out of V1 scope for measurement planning

Explicitly deferred to V2 or VariScout Process:

- **Gage R&R / formal MSA workflow** — the `msaRequired?` field is informational only in V1. No MSA calculator, no measurement-system-assessment UI.
- **Statistical sample-size calculator** — sample size is manual entry only. No power-analysis helper.
- **Auto-ingestion / sensor feeds** — re-ingestion uses the existing paste flow. Sensor / SCADA / ERP feeds defer to VariScout Process.
- **Multi-source provenance gating** — the framing-layer Slice 2/3 work (MatchSummaryCard, EvidenceSourceSync, per-source provenance) stays in flight but is not a V1 blocker; basic re-paste suffices.

This shape gives the V1 analyst a place to plan and track measurement work without forcing the product to be Minitab for MSA. The cycle Plan → Collect → Finding → Confirm/Refute is methodologically faithful; the implementation surface is small.

---

## §4 Project membership model (new)

Membership ACLs replace persona routing. Membership is **per project**, not per tenant.

### §4.1 Roles within a project

V1 uses a **2-tier ACL model**:

| Tier              | Roles                  | Capabilities                                                                                                                                                  | Manages membership? |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Lead**          | Lead (1 per project)   | Edits everything (canvas authoring, hypotheses creation + closure, Report compilation); advances stages; manages membership.                                  | Yes                 |
| **Everyone else** | Member + Sponsor roles | Reads everywhere; edits contributions (Findings, evidence on hypotheses, action items, improvement ideas, comments). Functionally identical at the ACL layer. | No                  |

**No in-product approval gates.** Signoff (Charter approval, Sustainment closure, Report sign-off) is **out-of-band** per wedge V1 — Lead presents in a meeting or email, Sponsor approves verbally / by reply, Lead records the signoff as a note in the relevant stage. This loses the in-app audit trail but keeps V1 scope minimal. Re-evaluate adding in-app Sponsor signoff in V2 if customer demand surfaces. (This aligns with the note at line 288 in the original draft.)

**Sponsor is identity + notification routing, not permission gating.** The Sponsor label persists because it carries real meaning:

- **Identity / accountability** — _"Project X is sponsored by Jane Doe (VP Operations)"_ — shown in Charter + Report attribution.
- **Notification routing** — drift signals during Sustainment route to the Sponsor explicitly.
- **Inbox filtering** — Sponsor's inbox surfaces signoff-relevant items differently from a Member's contribution queue.
- **Real-world signoff workflow** — the Sponsor approves out-of-band; the Lead records the result.

The persona docs describe different intent (Lead drives, Member contributes, Sponsor approves and reviews); the ACL does not enforce a Member/Sponsor distinction — both read everywhere and edit contributions.

**Vocabulary note:** "Sponsor" is the canonical Six Sigma / Lean / CI term for the executive who authorizes and underwrites the project. The "Champion" terminology (GE-school Six Sigma) is equivalent; V1 uses Sponsor for unambiguity.

### §4.2 Invitation flow

Project Lead invites org users from within the buyer's Azure AD tenant. Invitation is by Azure AD identity (email or directory pick). Invitee receives in-app + email notification, accepts, becomes a Member or Sponsor (Lead's choice at invite time).

### §4.3 Cross-tenant invites — out of scope V1

Cross-Azure-AD-tenant invitations are **explicitly out of scope** for V1. Members must already be in the buyer's Azure AD tenant.

This is **a feature, not a limitation** — it creates a clean privacy boundary and aligns with the Azure Marketplace per-deployment distribution model. Buyers who need to bring in external consultants can use Azure AD guest accounts; that's overhead the buyer manages, not the product.

If pipeline analysis (§8.2) reveals significant ICP demand for cross-org invites, the SaaS distribution path becomes a future product decision, not a V1 scope creep.

### §4.4 Data isolation — two scopes

V1 has **two access scopes** that work together:

| Scope                          | Who has access                              | What's gated                                                                                                               |
| ------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Hub-level (tenant-wide)**    | Anyone in the Azure tenant (all paid users) | The shared data container — paste data, outcome spec, process map, factors. Quick analysis works here without any Project. |
| **Project-level (membership)** | Only invited members of a specific Project  | Project-formal data — Charter content, Approach Hypotheses/Plans, Improve action tracker, Sustainment closure, Report.     |

A Lead can promote any quick analysis into a Project; that Project then locks its formal artifacts to its membership while leaving the underlying Hub data tenant-wide.

ACL enforcement points (eventual implementation):

- `useProjectMembershipStore` — new annotation-layer store
- Auth checks at `core/project/*` read paths
- Role check at structural writes: Lead-only for canvas authoring, hypothesis creation + closure, stage advancement, Report compilation (2-tier per §4.1)
- UI: project list filters to memberships; invite modal in Charter stage

### §4.5 Tier-gating retires

Single tier means no `isPaidTier()` / `hasTeamFeatures()` branches. The ~28 files in the current codebase using tier-gating logic mostly retire. Where access-gating remains useful, the new pattern is **project-membership ACL check**, not tier check.

---

## §5 Pricing + distribution

### §5.1 Single SKU

**€120/month per Azure tenant.** Unlimited org users, unlimited projects.

Supersedes ADR-033's €79 Standard + €199 Team split. Honors ADR-033's strategic hypothesis H6 ("per-deployment beats per-seat") — €120 is still per-deployment.

### §5.2 Distribution — Azure Marketplace Managed Application

Unchanged from ADR-007. The Azure Marketplace path stays. What changes is the _in-app_ layer — project membership ACLs add fine-grained access control on top of the tenant-wide Marketplace subscription.

This is the simplest distribution path: existing infrastructure, existing billing, no SaaS rebuild. The Azure AD constraint (no cross-tenant invites in V1) is accepted as a feature.

### §5.3 PWA stays free as funnel

The PWA tier (free, browser-only, session-only storage, no file upload) remains. It's the try-before-buy funnel.

### §5.4 Migration story for existing customers

Existing customers on €79 Standard or €199 Team need a migration path. Options to be modeled (see §8.1):

- **Grandfather existing customers** at their current price for N months
- **Upgrade €79 → €120** (price increase; real churn risk — sensitivity check required)
- **Downgrade €199 → €120** (price decrease; significant revenue impact per affected account — needs financial sensitivity)
- **Sunset window** with one-time conversion offer

The migration economics are a precondition (§8) — to be settled before engineering work commits.

---

## §6 Migration impact (engineering)

| Item                                                                     | Change                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Improve top-level tab                                                    | **Deleted.** Top-level route removed; redirects to Projects detail Improve stage.                                                                                                                                          |
| PDCA workbench, What-If                                                  | **Retained as "Advanced" view** inside Improve stage. Simple action tracker is default; Advanced is one toggle. No parallel modes.                                                                                         |
| Idea board, action conversion                                            | Retired. Direct action creation only.                                                                                                                                                                                      |
| Projects detail stages                                                   | Rename Sustainment+Handoff → Improve+Sustainment. New Improve stage component (action list, reuses extracted primitives). Handoff stage UI deleted; close-project logic folds into Sustainment screen.                     |
| Canvas response paths                                                    | Reduce from 5 to 3 (Capture as Finding, Investigate, Charter). Handoff path deleted everywhere. Sustainment auto-fire pattern (ADR-080) preserved.                                                                         |
| Persona routing                                                          | `personaRole` logic deleted. Home renders single shape. Inbox simplifies.                                                                                                                                                  |
| **Project membership ACLs (new)**                                        | New data model: `ProjectMember`, `Invitation`, role enum (Lead/Member/Sponsor). 2-tier ACL: Lead edits everything; Member + Sponsor read everywhere + edit contributions. No in-product approval gates. Medium build.      |
| **MeasurementPlan entity (new)**                                         | New data model: `MeasurementPlan` (factor, method, sampleSize, owner, status, hypothesisId, linkedFindingIds, msaRequired flag). UI: Plans panel on each Hypothesis card in the Investigation Wall. Small-to-medium build. |
| `useCanvasViewportStore` keying                                          | Re-key from `ProcessHubId` to `ProjectId` (when project-scoped) or stays Hub-keyed (when free-roaming / quick analysis). Migration for stored viewport state.                                                              |
| `ProcessHub` data model                                                  | **Stays as the internal data container** (the tenant-wide Hub backing Process tab + paste data + outcome + factors). Demoted from user-visible primary concept; not surfaced as a noun in V1 UI.                           |
| Tier-gating logic (~28 files using `isPaidTier()` / `hasTeamFeatures()`) | Most retires. Replace with project-membership ACL checks where access-gating is still needed.                                                                                                                              |
| ADR-007 + ADR-033                                                        | Mark superseded by this spec; link to new wedge ADR.                                                                                                                                                                       |
| Coherence spec                                                           | Partial supersession — see §9.                                                                                                                                                                                             |
| Projects-tab design spec                                                 | Amend stage list (Charter/Approach/Improve/Sustainment), update §5.2 cascade table, add project-membership model, remove persona-routing references.                                                                       |

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

Model: what % of current revenue is €79 Standard accounts vs €199 Team accounts? What's the churn risk on €79 → €120 (price increase, real) vs €199 → €120 (price decrease, real revenue hit per account)? Pick a grandfathering window option.

If the financial sensitivity is bad enough, the wedge needs adjustment (e.g., grandfather forever, or stage the transition).

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
**Changes:** Tiered SKU model (Standard + Team) → single €120 SKU + project membership ACLs.
**Marker:** Add `## Amendment — 2026-05-16` block referencing this spec.

### §9.2 ADR-033 (Pricing simplification) — superseded in part

**Stays:** Strategic hypothesis H6 ("per-deployment beats per-seat") is honored.
**Changes:** €79/€199 tier split → single €120 SKU. PWA stays free.
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

- Process Hub as a top-level user-visible noun (Hub stays internal; UI surfaces only "Project" and "Process")
- Process Owner persona / persona routing
- Cross-Azure-AD-tenant invitations
- Automated data pipelines / sensor feeds / SCADA / ERP integration
- Multi-tier pricing (€79 / €199 / Enterprise)
- PDCA workbench as a default UI (only as Advanced disclosure)
- What-If simulator (retired; may re-emerge in Analyze later)
- Idea board / action conversion (retired)
- 4-persona Home variants (retired)
- In-app Sponsor signoff workflow (signoff out-of-band at V1; Sponsor reads everywhere but no in-product approval gates per §4.1)
- Separate Measure stage in Projects detail (measurement planning integrates into the Investigation Wall per §3.6, no 5th stage)
- Gage R&R / formal MSA workflow (MSA-required flag is informational only in V1)
- Statistical sample-size calculator (manual entry only)
- Multi-source provenance gating (Slice 2/3 stays in flight but not a V1 blocker)
- VariScout Process announcement in V1 marketing

---

## §11 Open items to settle during implementation plan

- **PDCA "Advanced" view scope**: which current Improve-tab features survive as the Advanced disclosure? Default: only PDCA workbench survives as Advanced; What-If retires (or moves to Analyze later); idea board retires.
- **Auto-link convention for Measurement Plan → Finding**: when a new Finding is created and matches a Plan's factor + window, do we auto-link or just suggest? Default: suggest, analyst confirms.
- **Sponsor signoff in V2**: if customer demand surfaces, design the in-app Sponsor signoff workflow (currently out-of-band).
- **Grandfathering policy for existing customers** — settled in §8.1 precondition.
- **Free PWA fate** — stays as funnel by default; revisit only if Azure Marketplace single-SKU pricing changes the funnel math.

---

## §12 Verification — how we'll know V1 works once shipped

- **Quick-analysis flow (no project):** paste data → analyze in Analyze + Investigation tabs → save Findings → optionally create Hypotheses → export/import snapshot `.vrs` in PWA or save an Azure `DocumentSnapshot`. End to end without creating a Project.
- **Project-anchored flow (golden path):** quick-analyze → "+ Promote to Project" → Charter inherits Hub state → Approach (Investigation Wall with Measurement Plans) → Improve actions → Sustainment closure → Report. End to end in <30 minutes with seeded sample data.
- **Hypothesis-first flow:** open Investigation Wall → create Hypothesis with no Findings → add Measurement Plan rows → simulate collection (re-paste new data) → Findings auto-suggest link to Plan → Hypothesis transitions `proposed` → `evidenced` → `confirmed`.
- **Collaboration flow:** Project Lead invites a Member, both edit the same project simultaneously; Sponsor reads all tabs but edits only contributions (Findings, evidence, action items, comments) per 2-tier ACL (§4.1).
- **Membership ACL test:** org user not invited to Project A cannot see Project A's project-formal data (Charter / Approach / Improve / Sustainment / Report) via direct URL access. Hub-level data (paste data, outcome, process map) is tenant-wide and accessible.
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

---

## §15 Amendments

- **2026-05-16 (Improve-tab amendment)**: 6-tab nav → 7-tab nav restoring Improve as a top-level verb tab with active-IP cascade; Sustainment+Handoff folded → Improve+Sustainment stages (3 stages inside Project: Charter → Approach → Sustainment); 5 response paths → 3. See [`docs/archive/specs/2026-05-16-improve-tab-amendment-design.md`](../../archive/specs/2026-05-16-improve-tab-amendment-design.md) (archived 2026-05-17; content now canonical in this spec).
- **2026-05-17 (Price amendment)**: §5.1 single SKU price €99/month → **€120/month**. Revised upward before any customer exposure. All downstream surfaces (marketplace.md, README, .env.example) updated in PR-WV1-6. §5.4 / §8.1 migration math preserves €79/€199 as historical-context; the migration target reads €120.
