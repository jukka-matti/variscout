---
title: Improvement Project V1 — Design (SUPERSEDED 2026-05-09)
audience: [product, engineer, designer]
category: design-spec
status: archived
superseded-by: docs/archive/specs/2026-05-09-response-path-system-v1-design.md
last-reviewed: 2026-05-09
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md
  - docs/investigations.md
  - docs/07-decisions/adr-053-question-driven-investigation.md
  - docs/07-decisions/adr-064-suspected-cause-hub-model.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/07-decisions/adr-059-web-first-deployment-architecture.md
---

> **Status:** ARCHIVED 2026-05-17 — superseded first by [RPS V1 spec](2026-05-09-response-path-system-v1-design.md) (2026-05-09), then by [wedge architecture spec](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../../07-decisions/adr-082-wedge-architecture.md) (2026-05-16). The Improvement Project concept survives as the "Charter" canvas response path and the Improve tab in V1; the QC Story / TBP-shaped 8-section narrative design is preserved here as heritage for VariScout Process scope.
>
> **Preserved here** for institutional knowledge — the original design intent informs future product decisions, especially for VariScout Process scope (see [docs/01-vision/variscout-process/](../../01-vision/variscout-process/index.md)).

# Improvement Project V1 — Design

> **What this spec covers.** The first response-path surface to ship beyond the canvas drill-down stub: a hub-level **Improvement Project** — a structured, progressively-filled, problem-to-sustainment narrative that doubles as the project's final report. Replaces today's `CharterPanel` stub destinations in `apps/pwa/src/components/CharterPanel.tsx` and `apps/azure/src/components/charter/CharterPanel.tsx` (both wired by canvas PR8 sub-PR 8a).
>
> **Methodology lineage.** Structurally a **QC Story** / Toyota TBP narrative (8 sections, problem-to-sustainment progression, PDCA-anchored). The lineage is acknowledged in this design spec for engineers; **no Japanese / Toyota / Six Sigma / DMAIC jargon appears in user-facing UI copy.** Surface vocabulary stays plain English ("Improvement Project," "Issue," "Goal," "Cause Analysis," etc.).
>
> **Vision §2.4 alignment.** Vision §2.4 originally listed response path 3 as "Charter." This design renames that path to "**Improvement Project**" — a small but important amendment, captured in §10 of this spec.

---

## 1. Why this spec exists

PR8 sub-PR 8a (canvas migration, `docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md`) shipped mode-and-prerequisite-aware response-path CTAs on the canvas card drill-down. **Charter** (response path 3 per vision §2.4) was wired to a stub destination only — both PWA and Azure render a placeholder panel with copy: _"A Charter formalizes a process improvement project: problem statement, goals, scope, team, and timeline. The full authoring surface ships in a future release."_

This spec defines that future release at V1 scope, with the locked-in product reframings discovered during 8a's amendment review (DMAIC reality-check, free-tier-active tier reframe, hub-level entity, multiple per Hub).

The work also addresses three deeper questions surfaced during brainstorming:

1. **Should we even use DMAIC?** No — VariScout already has its own opinionated investigation spine (Issue Statement, SuspectedCause hubs, Findings, ImprovementIdea, Sustainment). The Improvement Project should _reuse_ those primitives, not duplicate them in DMAIC's vocabulary.
2. **What methodology, then?** **QC Story** / Toyota Practical Problem Solving (TBP) — a PDCA-anchored narrative methodology where the artifact, the methodology, and the report are the same thing. Maps 1:1 to VariScout's existing primitives and supports a single progressively-filled artifact that lives across the project lifecycle.
3. **Should the artifact still be called "Charter"?** No — renamed to "Improvement Project" to (a) avoid DMAIC-coding the vocabulary, (b) communicate the artifact's persistent / living-document nature, (c) avoid the higher-level `useProjectStore` collision while staying qualified, (d) maintain stakeholder familiarity (it's still recognizably the same kind of thing).

---

## 2. Locked design decisions (D1–D14)

### D1. Methodology — QC Story-shaped, jargon-free in UI

The Improvement Project is structured as a **QC Story / Toyota TBP** narrative (canonical 8-step variant, splitting the "Theme" step into Issue + Problem Statement to match VariScout's Issue / Problem distinction from ADR-053).

- **In design docs / engineer comments / commit messages:** the methodology lineage is named explicitly.
- **In user-facing UI copy / labels / tooltips / docs site / glossary:** no Japanese (QC Story) / Toyota (TBP) / Six Sigma (DMAIC) / Lean (A3) jargon. Section labels are plain English. Form subtitle reads _"A problem-to-sustainment narrative"_ — descriptive, methodology-neutral.

Sources for methodology research: [Quality Engineer Stuff — QC Story complete guide](https://qualityengineerstuff.com/qc-story/), [ICW — QC Story Procedure](https://www.icw.io/the-qc-story-procedure/), [Lean Enterprise Institute — Art of Lean Toyota coaching](https://www.lean.org/the-lean-post/articles/art-of-lean-on-problem-solving-part-8-toyota-coaching-practices/), [Gemba Academy — Toyota Business Practice](https://blog.gembaacademy.com/2009/02/22/tbp_toyota_business_practice/).

### D2. Eight sections, narrative-ordered, scaffold-not-gate

| #   | Section                          | Source / population                                                                                                                                                                                                                |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Issue**                        | Auto-prefilled from `processUnderstanding.issueStatement.liveStatement` (Watson Q1/Q2/Q3 autobuilt) when investigation linked; editable. Manual entry always available.                                                            |
| 2   | **Current Situation**            | Auto-pulled snapshot — Hub canonical map summary + capability snapshot + top Pareto + initial findings list. Coexists with manual narrative field below the snapshot.                                                              |
| 3   | **Problem Statement**            | Auto-prefilled from `processUnderstanding.problemCondition.summary` when present; editable. Manual entry always available. **Conceptually depends on Current Situation** (data-grounded refinement of the Issue) but not enforced. |
| 4   | **Goal**                         | Structured `{ outcomeSpecId?: OutcomeSpec['id']; baseline?: number; target?: number; deadline?: ISO8601 }`. Picker bound to Hub `outcomes`. Free-text fallback for Hubs without OutcomeSpecs.                                      |
| 5   | **Cause Analysis**               | Optional `suspectedCauseId?: SuspectedCause['id']` (FK), optional `findingIds?: Finding['id'][]` array, free-text 5-whys / fishbone / RCA narrative.                                                                               |
| 6   | **Countermeasures**              | Optional `improvementIdeaIds?: ImprovementIdea['id'][]` (FK array), free-text approach narrative.                                                                                                                                  |
| 7   | **Effect Confirmation**          | **Auto-only** — post-improvement capability snapshot + verification findings (existing `FindingProjection` pattern). Empty placeholder until improvements recorded + verified.                                                     |
| 8   | **Standardization & Reflection** | Optional FKs `sustainmentRecordId?` / `controlHandoffId?`, free-text reflection.                                                                                                                                                   |

**Sequence is communicated, not enforced.** Sections render top-to-bottom in the narrative order. First-open default expands sections 1–2; sections 3–8 collapsed with descriptive placeholder copy ("Refine the Issue with quantitative data — what specifically is wrong, by how much, where, when. Most teams fill this after reviewing the Current Situation."). No "locked" / "disabled" affordances per `feedback_no_gates_language`.

**Required-fields rule for V1 save.** Only `metadata.title` is required to save a draft. All section content is optional — the artifact is _progressively filled_ across the project lifecycle, so requiring more upfront would contradict its core design property. Status transitions (Draft → Active → Closed) do not impose extra required fields in V1; the user owns when they consider the project ready to "go active." V2 paid signoff workflow may add required-fields rules when entering `Under Review` (e.g., Goal must be filled).

### D3. Sections reuse VariScout primitives via FK or auto-population

Every section that maps to an existing entity uses an FK or auto-populated projection — **never duplicates** data into Improvement-Project-owned fields. This is non-negotiable for V1: it's what makes Improvement Project "a projection of VariScout's data spine" rather than "a parallel data silo."

| Section               | VariScout entity reused                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1 Issue               | `processUnderstanding.issueStatement` (read-only ref + editable copy field)                                      |
| 2 Current Situation   | `ProcessHub.canonicalProcessMap` + `ProcessHub.outcomes[].cpkTarget` + capability projection + Pareto projection |
| 3 Problem Statement   | `processUnderstanding.problemCondition.summary` (read-only ref + editable copy field)                            |
| 4 Goal                | `OutcomeSpec` FK (`outcomeSpecId`)                                                                               |
| 5 Cause Analysis      | `SuspectedCause` FK + `Finding[]` FKs                                                                            |
| 6 Countermeasures     | `ImprovementIdea[]` FKs                                                                                          |
| 7 Effect Confirmation | post-improvement capability + `FindingProjection`                                                                |
| 8 Standardization     | `SustainmentRecord` FK + `ControlHandoff` FK                                                                     |

**Read pattern:** copy-on-snapshot for narrative fields (Issue, Problem Statement) so the Improvement Project remains a stable artifact even if the underlying live VariScout state changes. The "live" reference is also displayed inline so the analyst can refresh the snapshot from the live state with a single button click.

### D4. Dual-mode sections — auto-populate is additive; manual entry always available

Critical design property: the Improvement Project must work **standalone** (clean slate, no FRAME, no SCOUT, no findings) **and** as **VariScout-data projection** (mature Hub with rich primitives), with no transition friction between the two.

- Sections 1, 3, 4, 5, 6, 8: render as standard form fields (multi-line text + optional FK pickers). Auto-population fills the field when source data exists; manual entry is identical otherwise.
- Section 2 (Current Situation): the **manual narrative text area always renders** (with placeholder copy when empty). The **auto-populated snapshot panel renders above it ONLY when source data exists** (capability summary + Pareto + initial findings available). At clean slate, only the narrative field shows; as the Hub matures, the snapshot panel appears above. They coexist permanently once both are present — analyst writes interpretive narrative ABOUT the data shown in the snapshot.
- Section 7 (Effect Confirmation): **auto-only — meaning no manual editable fields**, but the section ALWAYS renders. When data exists, it shows the auto-pulled post-improvement capability + verification findings. When clean-slate, it renders an empty-state placeholder _"Will populate once an improvement is recorded and verified."_ — the section never disappears, just shifts between populated and empty states.

**Consequence:** trainer / consultant pre-engagement use cases (write a Charter narrative without data) work natively with Sections 1–6 and 8. Section 7 stays empty until real data flows.

### D5. Naming — "Improvement Project"

- **Canonical artifact name:** Improvement Project
- **Code shape:** `ProcessHub.improvementProjects: ImprovementProject[]` (in-memory hydrated projection); separate Dexie table for persistence (see D11)
- **Canvas card response-path button:** "Improvement Project" (replaces the response-path-3 button label in `CanvasStepOverlay` / equivalent)
- **Form title (in-form):** "Improvement Project — _[OutcomeSpec name]_" (or "_Untitled_" before linkage)
- **Hub-overview entry:** "Improvement Projects" tab/section header + "+ New Improvement Project" button
- **Surface subtitle:** "A problem-to-sustainment narrative"

**Avoided collisions:**

- Not `Project` (would collide with `useProjectStore` / top-level workspace project / `.vrs` "project file" semantics)
- Not `Charter` (avoids DMAIC-coding the vocabulary; see D1)
- Not `Story` (too neutral; "Improvement Story" considered but "Project" matches consultant vocabulary slightly better)

**Vision §2.4 amendment** (see §10): response path 3 renamed in vision spec from "Charter" to "Improvement Project."

### D6. Form UX — progressive disclosure + 8-section progress indicator

Per [NN/g progressive disclosure guidance](https://www.nngroup.com/articles/progressive-disclosure/) and [SaaS freemium UX research](https://demogo.com/2025/11/24/feature-gating-in-saas-practical-models-for-freemium-conversion-with-examples/):

- **Single-page progressive-disclosure form** (not a multi-step wizard). 8 sections render top-to-bottom in their narrative order.
- **Default first-open expansion state:** sections 1–2 expanded; sections 3–8 collapsed, each showing a one-line descriptive placeholder ("Refine the Issue with quantitative data...", "Set the target value, deadline, and OutcomeSpec link...").
- **Auto-populated sections expand automatically** when their source data lands (e.g., when `OutcomeSpec` is set on the Hub, Section 4 expands and shows the picker prefilled).
- **Progress indicator at the form top** — visual segment bar (8 segments) showing how many sections are "filled" (have content beyond the auto-snapshot). Provides wizards' psychological completion-driving effect without abandonment cost. Tooltip on each segment shows the section name.
- **No multi-step wizard** — wizards add cognitive transitions between steps and cause known abandonment at each step boundary.

### D7. Status lifecycle — `Draft / Active / Closed` (V1)

```ts
export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';
```

- **Draft** — being authored; not yet committed as a tracked initiative. Default for new projects.
- **Active** — formally tracking; team is working on the improvement.
- **Closed** — project ended (success, abandonment, deferred). User-set transition, not auto-derived.

**`Archived` is implicit** via soft-delete (`deletedAt` set; entity hidden from default list views, retained for audit/.vrs).

**V2 paid-tier expansion** (NOT shipped V1) adds two states between Draft and Active:

- **Under Review** — signoff requested
- **Approved** — signoff complete

V1 transitions are **freeform** — user can move between any of the three states at will. No locking. Closed projects remain editable in V1 (defer "lock-on-close" to V2 paid signoff workflow).

### D8. Multiple Improvement Projects per Hub — list UX + entry-point pickers

PWA free-tier is Hub-of-one (one active Hub per session per `apps/pwa/CLAUDE.md`); a Hub can host multiple Improvement Projects. Azure paid-tier is multi-Hub; same per-Hub multiplicity.

**Hub-overview surface:**

- New "Improvement Projects" section in the Hub overview (location TBD per implementation plan — likely below the existing investigations list).
- Simple list view (1 row per project): title • status badge • last-edited timestamp • optional linked-OutcomeSpec name.
- "+ New Improvement Project" button at the section header.
- Click row → opens the form in an in-place panel (matching the rest of the Hub-overview UX).

**Canvas card → drill-down → Improvement Project CTA flow:**

- **0 existing projects on this Hub** → auto-create a new draft Improvement Project, prefill from the clicked card's context, open the form.
- **1 existing project** → open it directly (with prefill if linked-investigation context differs — flagged inline).
- **2+ existing projects** → show a small picker overlay listing the existing active projects (most-recent-first) + a "+ Create new" CTA at the bottom.

**Defer to V2:** portfolio / Gantt / Kanban / cross-hub board views. V1 is a flat list per Hub.

### D9. V1 paid-tier feature set — signoff workflow only

| Feature                                                                                                        | V1 paid-tier | V1 free-tier     | Rationale                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------- | ------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Signoff workflow** ("Request team approval" button + `Approved` status state added between Draft and Active) | ✓ ships      | locked w/ upsell | Captures sponsor-sign-off use case in regulated environments (FDA, ISO 13485, GMP, automotive APQP)                                                                                                                                |
| Audit trail (per-section change log)                                                                           | **dropped**  | n/a              | Azure tenant logging (App Insights, Activity Log) handles compliance audit at platform level — duplicating at document level adds complexity without value. Customers needing compliance audit configure it in their Azure tenant. |
| Comments / threads on sections                                                                                 | deferred V2  | hidden           | Real-time collab needs SSE / pub-sub infra                                                                                                                                                                                         |
| RACI tracking per section                                                                                      | deferred V2  | hidden           | Heavy UX                                                                                                                                                                                                                           |
| Change notifications (email / push)                                                                            | deferred V2  | hidden           | Notification infra                                                                                                                                                                                                                 |

**V1 paid-tier delta vs free:** ONE feature (signoff) + the `Approved` status state and its associated transition. Everything else is identical between tiers.

### D10. Free-tier affordance for V1 paid features — visible-with-lock

Per industry freemium UX research ([Stripe](https://stripe.com/resources/more/freemium-pricing-explained), [Demogo](https://demogo.com/2025/11/24/feature-gating-in-saas-practical-models-for-freemium-conversion-with-examples/), [RevenueCat](https://www.revenuecat.com/blog/growth/freemium-tier-design/)): "Don't hide the real product behind a paywall — showcase breadth, let users peek at what's possible."

V1 paid-tier features that are _implemented but tier-gated_ render with a **lock icon + inline upsell tooltip** for free-tier users — visible-with-lock pattern. This:

- Reinforces perceived value of paid tier
- Pedagogically previews the "complete" Charter shape (LSSGB students see what professional projects look like)
- Doesn't tease unwired features (which would violate `feedback_hidden_vs_disabled_cta`)

**Specific V1 affordances:**

- "Request team approval" button: visible with lock icon + tooltip _"Available with Azure (team signoff workflow)"_. Click attempt opens upsell modal / link.
- (No other V1 paid-tier affordances inside the form, since signoff is the only paid feature.)

**V2-deferred features stay fully hidden** in V1 (per `feedback_hidden_vs_disabled_cta` for unwired features). Comments / RACI / notifications surface only in V2 when actually built.

### D11. Persistence — separate Dexie table, dispatched via HubAction

Per DDD aggregate guidance and [IndexedDB best practices](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB): the `ImprovementProject` is its own aggregate with its own consistency boundary. Embedding in the Hub blob would bloat reads (each Hub read pulls all Improvement Projects, which can be large — 8 sections × free-text + auto-snapshots).

**PWA (`apps/pwa/src/db/schema.ts`):**

- New Dexie object store: `improvementProjects` (keyed by `id`).
- Indexed fields: `hubId`, `deletedAt`, `status`, `updatedAt`.
- Persistence flows through `pwaHubRepository.dispatch(action)` per ADR-078 / R12+R13 boundary policy. Domain stores never import `dexie` directly.

**Azure (`apps/azure/src/db/schema.ts` + `apps/azure/src/persistence/`):**

- Same Dexie object store shape (per ADR-078 D2 — same architecture, gated tiers).
- Cloud sync via Blob Storage (`apps/azure/src/services/cloudSync.ts`); ETag concurrency control per ADR-079.

**HubAction kinds** (new — `packages/core/src/actions/improvementProjectActions.ts`):

```ts
import type { ProcessHub } from '../processHub';
import type { ImprovementProject } from '../improvementProject';

export type ImprovementProjectAction =
  | {
      kind: 'IMPROVEMENT_PROJECT_CREATE';
      hubId: ProcessHub['id'];
      project: ImprovementProject;
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_UPDATE';
      projectId: ImprovementProject['id'];
      patch: Partial<Omit<ImprovementProject, 'id' | 'createdAt'>>;
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_ARCHIVE';
      projectId: ImprovementProject['id'];
    };
```

Appended to `HubAction` discriminated union in `packages/core/src/actions/HubAction.ts`. Exhaustiveness test (`__tests__/exhaustiveness.test.ts`) updated accordingly.

### D12. .vrs round-trip — in-memory hydration; backward-compatible

`VrsFile.hub: ProcessHub` already serializes the full hub object. The `ProcessHub` TypeScript type adds `improvementProjects?: ImprovementProject[]` as a hydrated projection (in-memory only — persistence layer denormalizes into the separate Dexie table).

**Export flow** (`packages/core/src/serialization/vrsExport.ts`):

1. Read `ProcessHub` from store.
2. Query `improvementProjects` Dexie table for all rows where `hubId === hub.id && deletedAt === null`.
3. Set `hub.improvementProjects` to the array.
4. Serialize the full `VrsFile`.

**Import flow** (`packages/core/src/serialization/vrsImport.ts`):

1. Deserialize `VrsFile`.
2. Read `hub.improvementProjects` (default `[]` if absent — backward-compatible with pre-V1 .vrs files).
3. Dispatch `IMPROVEMENT_PROJECT_CREATE` for each entry into the table.
4. Strip `improvementProjects` from the in-memory hub (or leave for hydration).

**No `.vrs` format version bump.** Adding an optional field on `ProcessHub` is a backward-compatible change. Older importers reading newer .vrs files ignore the field; newer importers reading older .vrs files default to empty.

### D13. Vision-spec amendment — §2.4 + §5.3

Vision spec at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` requires a small amendment per `project_adr_amendment_convention`:

- **§2.4 response path 3:** rename "Charter" → "Improvement Project". Update bullet text to: _"**Improvement Project** — formal, structured improvement project formalized as a problem-to-sustainment narrative. Promotes the situation to a tracked initiative with milestones."_
- **§5.3 references:** rename all "Charter" references to "Improvement Project" (heavy on-ramp text mentions `usePopoutChannel` for "Charter authoring sessions" — update to "Improvement Project authoring sessions").
- **Add `## Amendment — 2026-05-08` block** at the bottom of the vision spec describing the rename + reason (QC Story-shaped artifact, name-collision avoidance, methodology-bridging vocabulary).
- **Decision log entry** (`docs/decision-log.md`) under "Replayed Decisions" 2026-05-08: "Renamed canvas response path 3 from 'Charter' to 'Improvement Project' per Improvement Project V1 design (`docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md`)."

### D14. Entry points — canvas card drill-down + Hub overview

V1 ships two entry points:

1. **Canvas card → drill-down → Improvement Project CTA** (matches PR8-8a wired path; replaces stub destination with the real form). Behavior per D8.
2. **Hub-overview "+ New Improvement Project" button** — matches the trainer / consultant pre-engagement use case where users author a Charter narrative before the canvas surface is rich enough to drill into. Always opens a fresh draft.

**Out of V1 scope:**

- Standalone "Improvement Project without a Hub" path (consultant pre-engagement before any data ingestion). Workaround: create empty Hub first, then author. V2+ may revisit.
- Sidebar / global-nav "Improvement Projects" entry. Stays Hub-scoped per the hub-domain framing.

---

## 3. Architecture overview

### 3.1 Package distribution

| Concern                                | Package                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ImprovementProject` type definition   | `@variscout/core/improvementProject` (new sub-path export)                                                                |
| HubAction extension                    | `@variscout/core/actions/improvementProjectActions`                                                                       |
| `.vrs` export/import handling          | `@variscout/core/serialization` (extends existing `vrsExport` / `vrsImport`)                                              |
| Persistence — PWA Dexie                | `apps/pwa/src/db/schema.ts` + `apps/pwa/src/persistence/`                                                                 |
| Persistence — Azure Dexie + cloud sync | `apps/azure/src/db/schema.ts` + `apps/azure/src/persistence/`                                                             |
| Domain store                           | New `useImprovementProjectStore` in `@variscout/stores` (or extension of existing hub store — TBD in plan)                |
| Form UI — shared shell                 | `@variscout/ui/components/ImprovementProject/` (new subdirectory)                                                         |
| Form UI — section components           | `@variscout/ui/components/ImprovementProject/sections/` (one component per section)                                       |
| Form UI — wired in PWA                 | `apps/pwa/src/components/ImprovementProjectPanel.tsx` (replaces `CharterPanel.tsx`)                                       |
| Form UI — wired in Azure               | `apps/azure/src/components/improvementProject/ImprovementProjectPanel.tsx` (replaces existing `charter/CharterPanel.tsx`) |
| i18n strings                           | `packages/core/src/i18n/messages/*.ts` (new keys under `improvementProject.*`)                                            |
| Tier-gated signoff component (V1 paid) | `@variscout/ui/components/ImprovementProject/TeamSignoffSection.tsx` (reads `useTier()` directly)                         |

### 3.2 Component composition

```
ImprovementProjectPanel (per-app shell, ~30 LOC)
  └── ImprovementProjectForm (shared, @variscout/ui)
       ├── HeaderMetadata (title, team, business case, financial impact, linked investigation FK)
       ├── ProgressIndicator (8-segment bar)
       ├── Section1_Issue
       ├── Section2_CurrentSituation (snapshot panel + narrative text)
       ├── Section3_ProblemStatement
       ├── Section4_Goal (OutcomeSpec picker + baseline + target + deadline)
       ├── Section5_CauseAnalysis (SuspectedCause picker + Finding multi-select + narrative)
       ├── Section6_Countermeasures (ImprovementIdea multi-select + narrative)
       ├── Section7_EffectConfirmation (auto-only, post-improvement metrics)
       ├── Section8_Standardization (SustainmentRecord/ControlHandoff link + reflection)
       └── TeamSignoffSection (V1 paid; visible-with-lock for free)
```

The `ImprovementProjectPanel` per-app shell is intentionally thin — props-based wrapper that injects app-specific context (tier, repository, navigation back-handler) and renders the shared `ImprovementProjectForm`. ~30 LOC per app, mirroring the canvas-migration thin-route-shell pattern from F4.

### 3.3 State + store boundaries

The `ImprovementProject` is **document-layer state per F4 Document/Annotation/View triad**. It is content the recipient needs to reproduce the analysis (a regulator / sponsor reading the .vrs file needs the Improvement Project to understand what was done). Therefore:

- **Document layer** (F4): `useImprovementProjectStore` (or extension of `useProjectStore` — TBD in implementation plan) — persists per F-series, .vrs round-trips it.
- **Annotation layer**: per-user UI state (which sections are expanded / collapsed) — `usePreferencesStore` extension.
- **View layer**: ephemeral form state (current edits, draft buffer, focused field) — `useViewStore` extension or local component state.

---

## 4. Data model

### 4.1 `ImprovementProject` type

```ts
// packages/core/src/improvementProject.ts
import type { EntityBase } from './identity';
import type { ProcessHub, OutcomeSpec, ProcessParticipantRef } from './processHub';
import type { ProcessHubInvestigation } from './processHub';
import type { SuspectedCause, Finding, ImprovementIdea } from './findings/types';
import type { SustainmentRecord, ControlHandoff } from './sustainment';

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

/** Charter metadata header — top of the form */
export interface ImprovementProjectMetadata {
  /** Single-line project title; required */
  title: string;
  /** Multi-line business case narrative; optional */
  businessCase?: string;
  /** Optional estimated annual savings */
  financialImpact?: { amount?: number; currency: string };
  /** Team members with their roles */
  team?: Array<{
    role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
    person: ProcessParticipantRef;
  }>;
  /** Optional FK — Improvement Project may pre-date investigation */
  investigationId?: ProcessHubInvestigation['id'];
}

/** Section 1 — Issue (snapshot + manual override) */
export interface ImprovementProjectIssueSection {
  /** Snapshot taken at last "refresh from live" — copy of `issueStatement.liveStatement` */
  snapshotText?: string;
  /** Manually-edited narrative (overrides snapshot if present) */
  manualText?: string;
  /** ISO when snapshot was last refreshed */
  snapshottedAt?: string;
}

/** Section 2 — Current Situation (auto + narrative) */
export interface ImprovementProjectCurrentSituationSection {
  /** Auto-populated capability + Pareto + findings projection (computed; not persisted) */
  /** Manually-written interpretive narrative (always present) */
  narrative?: string;
}

/** Section 3 — Problem Statement (snapshot + manual) */
export interface ImprovementProjectProblemStatementSection {
  /** Snapshot of `problemCondition.summary` */
  snapshotText?: string;
  manualText?: string;
  snapshottedAt?: string;
}

/** Section 4 — Goal (structured, references OutcomeSpec) */
export interface ImprovementProjectGoalSection {
  outcomeSpecId?: OutcomeSpec['id'];
  baseline?: number;
  target?: number;
  deadline?: string; // ISO 8601
  /** Free-text fallback when no OutcomeSpec available */
  freeText?: string;
}

/** Section 5 — Cause Analysis */
export interface ImprovementProjectCauseAnalysisSection {
  suspectedCauseId?: SuspectedCause['id'];
  findingIds?: Finding['id'][];
  narrative?: string;
}

/** Section 6 — Countermeasures */
export interface ImprovementProjectCountermeasuresSection {
  improvementIdeaIds?: ImprovementIdea['id'][];
  narrative?: string;
}

/** Section 7 — Effect Confirmation (auto-only; no manual fields) */
export interface ImprovementProjectEffectConfirmationSection {
  /** Verification finding IDs from post-improvement runs */
  verificationFindingIds?: Finding['id'][];
  /** Confirmed-effect ISO timestamp; absent until verification recorded */
  confirmedAt?: string;
}

/** Section 8 — Standardization & Reflection */
export interface ImprovementProjectStandardizationSection {
  sustainmentRecordId?: SustainmentRecord['id'];
  controlHandoffId?: ControlHandoff['id'];
  reflectionNarrative?: string;
}

/** V1 paid-tier signoff state (Approved is paid-only) */
export interface ImprovementProjectSignoff {
  /** Unix ms when signoff was requested */
  requestedAt?: number;
  /** Unix ms when signoff was approved */
  approvedAt?: number;
  /** Approver participant ref */
  approvedBy?: ProcessParticipantRef;
}

export interface ImprovementProject extends EntityBase {
  /** Owning hub (typed FK) */
  hubId: ProcessHub['id'];
  /** User-set status */
  status: ImprovementProjectStatus;
  /** Top-level metadata header */
  metadata: ImprovementProjectMetadata;
  /** Eight QC-Story sections */
  sections: {
    issue: ImprovementProjectIssueSection;
    currentSituation: ImprovementProjectCurrentSituationSection;
    problemStatement: ImprovementProjectProblemStatementSection;
    goal: ImprovementProjectGoalSection;
    causeAnalysis: ImprovementProjectCauseAnalysisSection;
    countermeasures: ImprovementProjectCountermeasuresSection;
    effectConfirmation: ImprovementProjectEffectConfirmationSection;
    standardization: ImprovementProjectStandardizationSection;
  };
  /** Last modification — Unix ms */
  updatedAt: number;
  /** V1 paid-tier signoff state; absent in V1 free tier */
  signoff?: ImprovementProjectSignoff;
}
```

### 4.2 `ProcessHub` extension

```ts
// packages/core/src/processHub.ts (additive)
export interface ProcessHub extends EntityBase {
  // ... existing fields ...
  /**
   * In-memory hydrated projection of this Hub's Improvement Projects.
   * Persistence lives in a separate Dexie table; this field is populated
   * on Hub read and serialized on .vrs export. Absent in queries that
   * don't hydrate; default to [] when absent.
   */
  improvementProjects?: ImprovementProject[];
}
```

### 4.3 New core sub-path export

`packages/core/package.json` exports map gets:

```json
"./improvementProject": {
  "types": "./dist/improvementProject.d.ts",
  "default": "./dist/improvementProject.js"
}
```

Per `editing-monorepo-structure` skill rules.

---

## 5. UX walkthroughs

### 5.1 Mature Hub scenario — "promote this SuspectedCause to a tracked project"

**Setup:** analyst on a mature Hub. FRAME complete, OutcomeSpec set, SCOUT run several times, three SuspectedCauses identified, one with a Selected ImprovementIdea.

1. Analyst clicks the canvas card for the affected step → drill-down opens.
2. Clicks **"Improvement Project"** CTA.
3. Picker overlay (since 2+ projects exist on this Hub): "Continue work on existing" / "+ Create new" → picks Create new.
4. Form opens with auto-population:
   - Section 1 (Issue): prefilled from `issueStatement.liveStatement` — _"Reduce variation in Heads 5–8 thickness"_
   - Section 2 (Current Situation): snapshot panel shows _"Cpk 0.6 vs target 1.33 on Heads 5–8 (Pareto top 1, 18% of monthly output)"_; narrative text area below (empty)
   - Section 3 (Problem Statement): prefilled from `problemCondition.summary`
   - Section 4 (Goal): OutcomeSpec picker prefilled to the Hub's primary outcome; baseline = current observed; target = `cpkTarget`
   - Section 5 (Cause Analysis): SuspectedCause picker prefilled to the SuspectedCause linked to the clicked card
   - Section 6 (Countermeasures): ImprovementIdea multi-select prefilled to the Selected idea
   - Sections 7–8 collapsed (no improvement recorded yet)
5. Analyst fills metadata header (Project title: "Heads 5–8 Cpk lift Q3"), team roles, business case, deadline.
6. Saves draft. Status: `draft`. Returns to canvas card.
7. Days later: clicks Improvement Project CTA from Hub-overview list, edits Section 5 narrative, transitions status to `active`.
8. Weeks later: improvement implemented, post-data ingested. Section 7 (Effect Confirmation) auto-populates with verification finding.
9. Sustainment scheduled. Section 8 (Standardization) FK to SustainmentRecord, narrative reflection added.
10. Status transitioned to `closed`. Improvement Project IS the final report.

### 5.2 Clean-slate scenario — "draft a Charter before data exists"

**Setup:** trainer / consultant pre-engagement. No data, no FRAME, no SCOUT. Just an empty Hub.

1. Hub-overview → "+ New Improvement Project" button.
2. Form opens with no auto-population:
   - Section 1 (Issue): empty placeholder copy _"Write your Issue Statement, or finish FRAME — VariScout will autobuild it from your output column + direction + first significant factor."_
   - Section 2 (Current Situation): no snapshot panel; manual narrative text area shown directly with placeholder _"Add specs in FRAME to surface a capability snapshot here, or describe the current state manually below."_
   - Sections 3–6, 8: collapsed; placeholders describe what goes there
   - Section 7: collapsed; placeholder _"Will populate once an improvement is recorded and verified."_
3. Trainer fills sections 1–6, 8 manually as a teaching example. Saves draft.
4. Trainer exports `.vrs` file → Improvement Project travels with the file.
5. Student imports `.vrs`, sees the trainer's Improvement Project pre-filled, can edit / extend it.

### 5.3 Free-tier user encountering paid signoff feature

1. Free-tier PWA user opens Improvement Project form.
2. Scrolls to the bottom → sees a section "Team approval" with:
   - A button reading "Request team approval" with a lock icon.
   - Tooltip on hover: _"Available with Azure (team signoff workflow)."_
   - Click → upsell modal explaining team signoff feature + link to Azure tier.
3. The form is otherwise fully functional.

---

## 6. Tier behavior matrix

| Surface element                                      | Free tier (PWA)                                                                   | Paid tier (Azure)                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| Canvas card "Improvement Project" CTA                | Active                                                                            | Active                                         |
| Hub-overview "+ New Improvement Project" button      | Active                                                                            | Active                                         |
| Form sections 1–8                                    | All visible, all editable                                                         | All visible, all editable                      |
| Status enum                                          | `draft \| active \| closed`                                                       | `draft \| active \| closed` (V1)               |
| `Approved` status state + signoff workflow           | Locked w/ upsell (lock icon + "Available with Azure" tooltip; click opens upsell) | Active                                         |
| Comments / RACI / change notifications               | Hidden (V2 paid features)                                                         | Hidden (V2 paid features)                      |
| .vrs export of Improvement Project                   | ✓                                                                                 | ✓                                              |
| Cloud sync of Improvement Project                    | n/a (no cloud)                                                                    | ✓ via Blob Storage                             |
| App Insights telemetry on Improvement Project events | n/a                                                                               | ✓ structural events only, no PII (per ADR-059) |

---

## 7. Persistence + sync details

### 7.1 PWA persistence

- **Schema bump** in `apps/pwa/src/db/schema.ts`: add `improvementProjects` object store (version `N+1`), keyed by `id`, with indexes on `hubId`, `deletedAt`, `status`, `updatedAt`.
- All writes flow through `pwaHubRepository.dispatch(action)`. New action handlers in `apps/pwa/src/persistence/handlers/improvementProjectHandlers.ts`.
- ESLint `no-restricted-imports` rule (P7.2) already covers — only the persistence layer can import `dexie`.
- Hub-of-one constraint: only the active Hub's projects matter; others stay in the table but are filtered out at read time.

### 7.2 Azure persistence + cloud sync

- **Schema bump** in `apps/azure/src/db/schema.ts`: same `improvementProjects` object store shape per ADR-078 D2.
- All writes through `azureHubRepository.dispatch(action)`. Handlers in `apps/azure/src/persistence/handlers/improvementProjectHandlers.ts`.
- Cloud sync: `apps/azure/src/services/cloudSync.ts` extended to include Improvement Projects in the hub-blob sync envelope.
- ETag concurrency control per ADR-079 — concurrent edits to the same Improvement Project surface as `concurrency-exhausted` after 3 retries via the existing `PasteConflictToast` channel.

### 7.3 .vrs serialization

Per D12 — additive, backward-compatible. Implementation lives in `packages/core/src/serialization/vrsExport.ts` (collect from table + attach to hub) and `vrsImport.ts` (rehydrate to table). No format version bump needed.

---

## 8. i18n keys (representative — full set in implementation plan)

```ts
// packages/core/src/i18n/messages/en.ts (additive)
'improvementProject.title': 'Improvement Project',
'improvementProject.subtitle': 'A problem-to-sustainment narrative',
'improvementProject.cta.button': 'Improvement Project',
'improvementProject.cta.tooltip': 'Promote this situation to a tracked Improvement Project — a structured narrative from problem to sustainment.',
'improvementProject.section.issue.label': 'Issue',
'improvementProject.section.issue.placeholder': "Write your Issue Statement, or finish FRAME — VariScout will autobuild it from your output column + direction + first significant factor.",
'improvementProject.section.currentSituation.label': 'Current Situation',
'improvementProject.section.problemStatement.label': 'Problem Statement',
'improvementProject.section.problemStatement.placeholder': 'Refine the Issue with quantitative data — what specifically is wrong, by how much, where, when. Most teams fill this after reviewing the Current Situation.',
'improvementProject.section.goal.label': 'Goal',
'improvementProject.section.causeAnalysis.label': 'Cause Analysis',
'improvementProject.section.countermeasures.label': 'Countermeasures',
'improvementProject.section.effectConfirmation.label': 'Effect Confirmation',
'improvementProject.section.effectConfirmation.placeholder': 'Will populate once an improvement is recorded and verified.',
'improvementProject.section.standardization.label': 'Standardization & Reflection',
'improvementProject.signoff.requestButton': 'Request team approval',
'improvementProject.signoff.upsellTooltip': 'Available with Azure (team signoff workflow).',
'improvementProject.status.draft': 'Draft',
'improvementProject.status.active': 'Active',
'improvementProject.status.closed': 'Closed',
'improvementProject.list.heading': 'Improvement Projects',
'improvementProject.list.newButton': '+ New Improvement Project',
```

Per `adding-i18n-messages` skill — typed catalogs in `packages/core/src/i18n/messages/`, formatted via Intl APIs, no string concatenation.

---

## 9. Testing strategy

### 9.1 Unit tests (`@variscout/core`)

- `ImprovementProject` schema — exhaustiveness over `kind` of HubAction extensions (`__tests__/exhaustiveness.test.ts`).
- Section-level utility functions (e.g., `buildIssueSnapshot(processUnderstanding)` → snapshot text).
- `.vrs` export/import round-trip with Improvement Projects (`__tests__/vrsRoundTrip.test.ts` extension).

### 9.2 Component tests (`@variscout/ui`)

- Per-section components: render with empty state vs auto-populated state.
- ProgressIndicator: 0/8 / 5/8 / 8/8 visual states.
- TeamSignoffSection: free-tier renders lock + upsell; paid-tier renders the active button.
- Form-level: progressive-disclosure expansion / collapse behavior; default first-open expansion of sections 1–2.

### 9.3 Integration tests (per app)

- Canvas card → drill-down → Improvement Project CTA flow with 0 / 1 / 2+ existing projects.
- Hub-overview "+ New Improvement Project" button creates draft with default metadata.
- Status transitions Draft → Active → Closed.
- Tier-gated signoff: paid renders, free hides w/ lock.

### 9.4 E2E (Playwright)

- PWA: full clean-slate authoring path → save → reload → state persists.
- Azure: full mature-Hub authoring → cloud sync → cross-device fetch.
- .vrs export → import round-trip preserves all sections and FKs.

Per `writing-tests` skill — `vi.mock` BEFORE component imports (avoid hoist closure bug per `feedback_vi_mock_hoist_closure`); `data-testid` conventions; deterministic PRNG in any stat-touching tests.

---

## 10. Vision §2.4 + §5.3 amendment text

The following text amends `docs/superpowers/specs/2026-05-03-variscout-vision-design.md`. Apply at implementation time as part of the V1 PR.

### Amendment to §2.4 (response paths list)

Replace the bullet:

> 3. **Charter** — formal improvement project (DMAIC or similar). Promotes the situation to a tracked initiative with milestones.

With:

> 3. **Improvement Project** — formal, structured improvement project formalized as a problem-to-sustainment narrative. Promotes the situation to a tracked initiative; the artifact is structurally a QC Story (acknowledged in design specs; methodology-neutral in UI). Persists across the project lifecycle from kickoff through standardization, doubling as the final report.

### Amendment to §5.3

Replace all occurrences of "Charter" with "Improvement Project". Specifically the long-form paragraph:

> Heavy on-ramps preserved: Focused Investigation navigates to the Investigation tab (3-column workspace, shipped); **Charter** promotes via `usePopoutChannel` to a separate window for long authoring sessions; ...

becomes:

> Heavy on-ramps preserved: Focused Investigation navigates to the Investigation tab (3-column workspace, shipped); **Improvement Project** opens in-panel within the canvas drill-down for V1 (pop-out via `usePopoutChannel` deferred to V2 when long-session demand materializes); ...

### `## Amendment — 2026-05-08` block (append at bottom of vision spec)

```markdown
## Amendment — 2026-05-08 — Charter → Improvement Project rename + V1 in-panel rendering

Response path 3 in §2.4 renamed from "Charter" to "Improvement Project."
Reason: the artifact's structural form is a QC Story / Toyota TBP narrative
(8 sections, problem-to-sustainment progression) — not a DMAIC Charter.
"Charter" implied DMAIC kickoff-only semantics inconsistent with the
living-document / final-report progression the artifact actually serves.
"Improvement Project" is methodology-bridging (recognizable to DMAIC and
A3 / QC Story practitioners alike) and avoids the higher-level
useProjectStore / .vrs-file-as-project naming collision.

§5.3's `usePopoutChannel` commitment for Charter authoring is **deferred
to V2**. V1 ships in-panel rendering inside the canvas drill-down (matches
the PR8-8a stub destination's UX). Pop-out is a V2 ergonomic improvement
when long-session demand materializes.

Spec: docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md
Decision-log: 2026-05-08 entry under "Replayed Decisions"
```

### Decision-log entry (`docs/decision-log.md`)

Append under "Replayed Decisions":

> **2026-05-08 — Canvas response path 3 renamed "Charter" → "Improvement Project"**
> Per Improvement Project V1 design (`docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md`).
> Vision §2.4 + §5.3 amended. Surface label, code shape (`hub.improvementProjects`), and HubAction kinds all aligned. Methodology lineage (QC Story / Toyota TBP) acknowledged in design spec, not surfaced in UI copy.

---

## 11. Out of V1 scope (explicitly enumerated)

- **Standalone Improvement Project without a Hub** — consultant pre-engagement before any data ingestion. Workaround: create empty Hub first, then author Improvement Project. V2+ may revisit.
- **Sidebar / global-nav "Improvement Projects" entry** — stays Hub-scoped.
- **Portfolio / Gantt / Kanban / cross-hub board views** — V1 ships flat list per Hub.
- **Audit trail (per-section change log)** — Azure tenant logging (App Insights, Activity Log) handles compliance audit at platform level.
- **Comments / threads** — V2 paid feature. Heavy infrastructure (SSE, pub-sub).
- **RACI tracking** — V2 paid feature.
- **Change notifications (email / push)** — V2 paid feature. Notification infra needed.
- **Lock-on-close (closed projects become read-only)** — V2 with signoff workflow.
- **`Under Review` and `Approved` status states** — V2 paid signoff workflow extension.
- **DMAIC-explicit phase milestones (`{phase, targetDate, status}[]`)** — superseded by QC Story narrative structure; no replacement planned.
- **Auto-derived status (computed from filled sections)** — V1 is user-set; auto-derive is a possible V2 ergonomic improvement.
- **Visual progress timeline / story-mode reading view** — V1 is form-only; story-mode read view (formatted output ready for stakeholder PDF/print) is V2.
- **Pop-out window authoring (`usePopoutChannel`)** — vision §5.3 commits to "Charter promotes via `usePopoutChannel` to a separate window for long authoring sessions." V1 inherits the 8a stub destination's **in-panel** rendering instead — simpler implementation, fits the existing canvas drill-down UX. The pop-out path is a V2 ergonomic improvement when long-session demand materializes; vision §5.3 amendment notes this deferral.

---

## 12. Open questions for the implementation plan

These don't block the design but want concrete answers in the plan:

1. **Store ownership.** Does `ImprovementProject` get its own store (`useImprovementProjectStore`) or live as a sub-collection in `useProjectStore`? Per F4 store layer, leans toward a dedicated document-layer store.
2. **Form-level save semantics.** Auto-save on blur per section, debounced? Or explicit Save button? PWA precedent leans auto-save; matters for cloud-sync ETag conflict shape.
3. **Snapshot refresh affordance.** Sections 1 + 3 carry a snapshot field copied from live state. Should the form show a "refresh from live" button when snapshot drifts from current `liveStatement` / `problemCondition.summary`? Strong yes IMO; details (button copy, drift indicator) for the plan.
4. **Section 2 snapshot scope.** What's the canonical "Current Situation snapshot"? Capability summary + Pareto top-N + recent findings is the proposed set; exact projection to compute and persist requires a small spec extension during implementation.
5. **Hub-overview placement.** Below investigations? Side tab? Inline accordion in the Hub overview? Plan-time UX decision; defer.
6. **Improvement Project list — sort order.** Default sort by `updatedAt` desc; status filter chips ("Drafts" / "Active" / "Closed") — for the plan.

---

## 13. References

### VariScout context

- `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` — vision §2.4 + §5.3 (amended by this spec)
- `docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md` — wired the response-path CTAs and stub destinations
- `docs/investigations.md` "Charter authoring V1" entry — surfaced this work
- `docs/07-decisions/adr-053-question-driven-investigation.md` — Issue Statement vs Problem Condition distinction
- `docs/07-decisions/adr-064-suspected-cause-hub-model.md` — SuspectedCause primitive
- `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md` — same product, gated tiers
- `docs/07-decisions/adr-059-web-first-deployment-architecture.md` — customer-owned data principle
- `docs/01-vision/constitution.md` — P1 (FRAME→SCOUT→INVESTIGATE→IMPROVE), P2 (same analysis everywhere), P3 (customer-owned data)

### External methodology research

- [Quality Engineer Stuff — QC Story complete guide](https://qualityengineerstuff.com/qc-story/)
- [ICW — The QC Story Procedure: Solving Problem in 7 Steps](https://www.icw.io/the-qc-story-procedure/)
- [Lean Enterprise Institute — Art of Lean on Toyota Coaching Practices](https://www.lean.org/the-lean-post/articles/art-of-lean-on-problem-solving-part-8-toyota-coaching-practices/)
- [Gemba Academy — Toyota Business Practice (TBP)](https://blog.gembaacademy.com/2009/02/22/tbp_toyota_business_practice/)
- [Art of Lean — Handbook for TQM and QCC Volume II (PDF)](https://artoflean.com/wp-content/uploads/2019/01/Handbook-for-TQC-and-QCC-Volume-II-copy.pdf)
- [Performance Storyboard — Understanding QC Story in Quality Management](https://performance-storyboard.com/qc-story/)

### External UX research

- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [UXPin — What Is Progressive Disclosure in UX (2026)](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)
- [Interaction Design Foundation — What is Progressive Disclosure (updated 2026)](https://ixdf.org/literature/topics/progressive-disclosure)
- [Demogo — Feature Gating in SaaS: Practical Models for Freemium Conversion](https://demogo.com/2025/11/24/feature-gating-in-saas-practical-models-for-freemium-conversion-with-examples/)
- [Stripe — Freemium pricing strategy explained](https://stripe.com/resources/more/freemium-pricing-explained)
- [RevenueCat — 6 Steps To Design A Freemium Tier That Actually Converts](https://www.revenuecat.com/blog/growth/freemium-tier-design/)

### External DMAIC charter research (for vocabulary mapping; not adopted as primary methodology)

- [SixSigma.us — Project Charter and Define Phase](https://www.6sigma.us/project-management/six-sigma-project-charter/)
- [GoLeanSixSigma — Project Charter Template](https://goleansixsigma.com/project-charter/)
- [Pyzdek Institute — Project Charter Template](https://www.pyzdekinstitute.com/resource/project-charter-template)
- [SixSigma Institute — DMAIC Define Phase Project Charter](https://www.sixsigma-institute.org/Six_Sigma_DMAIC_Process_Define_Phase_Six_Sigma_Project_Charter.php)

### Persistence pattern research

- [MDN — IndexedDB Basic Terminology](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology)
- [Michael Plöd — Persistence Strategies for Aggregates at DDD Europe 2025](https://www.michael-ploed.com/blog/persistence-strategies-for-aggregates-at-ddd-europe-2025)
- [James Hickey — DDD & Data Modelling: How Do I Persist Aggregates?](https://www.jamesmichaelhickey.com/how-do-i-persist-ddd-aggregates/)
