---
tier: ephemeral
purpose: design
title: 'Workspace architecture and project formalization'
audience: human
category: design-spec
status: active
date: 2026-06-09
last-verified: 2026-06-09
related:
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/superpowers/plans/2026-06-09-workspace-architecture-roadmap.md
  - docs/superpowers/plans/2026-06-09-holistic-architecture-evaluation.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
supersedes: []
layer: spec
implements:
  - docs/01-vision/product-overview.md
  - docs/02-journeys/ia-nav-model.md
  - docs/03-features/workflows/home.md
  - docs/03-features/workflows/project-dashboard.md
  - docs/03-features/workflows/analysis-flow.md
  - docs/03-features/workflows/analyze-wall.md
  - docs/03-features/ai/coscout.md
---

# Workspace architecture and project formalization

> **Accepted design — 2026-06-09.** V1 product model is `Workspace → (soft-formalized) Project → Analysis Scope`, with `ProcessHub` as internal storage. This **completes in the product surface the Hub↔Project 1:1 collapse that IM-0a (PR #243, Azure schema v15 / PWA v8) already made in the data model** — it is a finishing-a-migration, not a fresh pivot. It corrects an earlier draft of this spec that said "zero-or-one / optional Project": the shipped First-Session-Journey (#307–326, `ensureSessionProject` / `landFreshEntryOnProcess`) auto-creates an `active` Project for every data entry, so the model is **"always backed by an active Project, soft-formalized"**, not "can have no Project." ADR-082's wedge model stands; its 2026-06-09 amendment points here.

## Summary

VariScout V1 is designed around the analyst's mental model:

```text
Workspace -> (soft-formalized) Project -> current Analysis Scope
```

An analyst does not start by thinking about a Hub, an "Active IP," or a portfolio. They have data, a process problem, or a performance question, and they want a place to investigate it. That place is a **Workspace**.

Every Workspace is backed by exactly one Project record from its first data entry — but that record stays **informal** (Untitled, solo) and shows no Project chrome until the analyst takes a **deliberate act of formalization**: opening the charter, inviting a member, or explicitly choosing "Make this a Project." Formalization is a _felt moment_, not a mode switch and not a new data object.

`ProcessHub` remains a storage/container implementation detail. It is not a user-facing product noun. `Active IP`, `Project Focus`, `Exit IP`, "Free roaming," and "Switch IP" — the portfolio-era focus ceremony — **retire**. There is exactly one Project per Workspace; the analyst never enters, exits, or switches a project lens. Analytical attention narrows and broadens only through **Analysis Scope**.

## Why this exists (the migration framing)

The current UI still speaks a model that the data model abandoned:

- The **portfolio era**: a `ProcessHub` was a long-lived _process_ (with a process owner) that accumulated _many_ improvement projects. That is why `ActiveIPLaunchpadCard` offers "Free roaming across the Hub," "Switch IP," and "Exit IP."
- **The wedge pivot (ADR-082)** split that model out: V1's unit is the Project; the Hub goes internal; the multi-project process portfolio moves to the named-future **VariScout Process** product.
- **IM-0a** made it literal: Hub↔Project is **1:1** in the data. So today "Switch IP" is dead (`canSwitchIP = projects.length > 1` is never true) and "Free roaming" is only reachable by explicitly _exiting_ the single auto-created project.

This spec finishes that migration in the user-facing surface and gives the V1 container a clean name — **Workspace** — so it stops colliding with the future "Process Hub."

## Definitions

| Concept           | Product meaning                                                                                                       | Current implementation anchor                                                                               | V1 rule                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Workspace         | The user's analysis workspace: data, process map, findings, hypotheses, Wall, report context, and its (soft) Project. | `ProcessHub` plus document snapshot state, always carrying one `ImprovementProject`.                        | The V1 user-facing object. One active Workspace in the shell. UI noun: **Workspace** (arch: _Analysis Workspace_). |
| Project           | The formalization layer of a Workspace: charter/status, members, role/ACL, actions, report/signoff.                   | `ImprovementProject` (`status: 'active'` from creation), `useImprovementProjectStore`, membership metadata. | Exactly one per Workspace, always backed. **Informal** until a deliberate formalization act; then surfaces bloom.  |
| Analysis Scope    | The active analytical lens: selected outcome/measure, factor, process step, and categorical filters.                  | `useAnalysisScopeStore` with `yColumn`, `boxplotFactor`, `stepId`, and `categoricalFilters`.                | The only active lens in V1. View-layer, transient, shared across workflow surfaces.                                |
| ProcessHub        | Internal storage primitive that groups document state and process data.                                               | Hub IDs, snapshots, repository storage, route/document identity.                                            | Internal vocabulary only, until an optional later rename. Never user-facing.                                       |
| VariScout Process | Named-future enterprise product for ongoing process ownership and multi-project orchestration.                        | Roadmap/docs, not V1 product behavior.                                                                      | A long-lived process may host many Projects later. Not V1.                                                         |

## Product Model

### Workspace is the start

A Workspace begins when the analyst imports or pastes data, opens a saved analysis, or starts a new investigation. It is the user's place to frame, explore, analyze, improve, and report.

Workspace responsibilities:

- Own the current document identity and data context.
- Carry the process map and analytical artifacts.
- Host findings, hypotheses, measurement plans, actions, and report material.
- Carry exactly one Project record, and expose whether it has been formalized.
- Provide the context that CoScout and the deterministic stats engine consume.

### Project is soft-formalized, never detached

Every Workspace is backed by one `ImprovementProject` from its first data entry (the First-Session-Journey guarantee). That record is **always `status: 'active'`** — there is no draft gating (E1 decision preserved). What changes is _presentation_, driven by formalization:

- **Informal Workspace** (default after data entry): Untitled, solo, no deliberate formalization act yet. The shell presents a plain Workspace — no Project chrome beyond a quiet "Name & formalize" affordance. This is the first-class "quick analysis" path.
- **Formalized Project**: the analyst has performed a **deliberate act** — opened/filled the charter, invited a member, or explicitly chose "Make this a Project." Project surfaces (charter, members/ACL, actions, report/signoff prominence) now bloom.

**Formalization signal — deliberate act, not auto-title.** The FSJ auto-names the backing project from the data source (sample name / `.vrs` envelope name), so `title !== 'Untitled project'` is **not** a valid formalization signal — a loaded sample must still present as informal. The signal is a deliberate act: members present, charter opened/filled, or an explicit formalize action. The exact mechanism (derived predicate over `members`/charter vs. an explicit `formalizedAt` marker) is for the implementation plan; the **product rule** is fixed here.

Project responsibilities (once formalized):

- Store charter/status and formal lifecycle metadata.
- Store members and role context: Lead, Member, Sponsor.
- Gate Azure collaboration and write authority where needed.
- Own project actions, report readiness, and formal follow-through.
- Provide CoScout with role context and permission boundaries.

There is **no** active-project selector, **no** "Exit IP," **no** "Free roaming," and **no** "Switch IP." A Workspace has one Project; the analyst never toggles a project lens.

### Analysis Scope is the active lens

Analysis Scope answers "what am I looking at right now?" It is intentionally smaller and more temporary than Workspace or Project.

Analysis Scope includes:

- Outcome or measure under analysis.
- Factor under comparison or investigation.
- Process step when the question is step-scoped.
- Categorical filters, including WHERE-style predicates from chart or Wall interactions.

Analysis Scope is consumed consistently by Explore, Process, Analyze, Report, and CoScout. It stays **View-layer** state — it must not become persistence identity, ACL state, or project membership state.

## Decisions

1. **Workspace is the V1 product object.** User-facing docs and UI use _Workspace_; architecture prose may use _Analysis Workspace_ for precision.
2. **Every Workspace is backed by exactly one active Project.** No draft state, no "zero project" state — the First-Session-Journey auto-project guarantee is preserved.
3. **Project is soft-formalized.** The backing project stays informal (no Project chrome) until a deliberate formalization act; the auto-title does not formalize.
4. **Another effort means another Workspace.** V1 does not support many Projects inside one Hub or one Workspace.
5. **Hub is internal vocabulary.** `ProcessHub` remains storage vocabulary; public vocabulary becomes Workspace.
6. **The focus ceremony retires.** Active IP, Project Focus, Exit IP, "Free roaming," and "Switch IP" are removed — not renamed. Their behavior collapses into "the Workspace's one Project is always the context; narrowing is Analysis Scope."
7. **VariScout Process keeps the multi-project future.** Enterprise process ownership can later introduce a long-lived process object hosting many Projects.

## Current Code Mapping

| Current code/document term                                                                 | Target model                             | Migration note                                                                                                                                                         |
| ------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProcessHub`, `hubId`, `sessionHub`                                                        | Workspace backing storage                | Keep in persistence and repository boundaries until a later optional internal rename plan.                                                                             |
| `ImprovementProject` (always `status: 'active'`)                                           | The Workspace's backing Project          | Keep the type. "Formalized" is a presentational predicate over it, not a new entity.                                                                                   |
| `useImprovementProjectStore.projectsById` + `getProjectForHub`                             | Workspace -> its one Project lookup      | Already 1:1 per Hub since IM-0a (`getProjectForHub` returns the single live project). `projectsByHub` was retired — do not reference it.                               |
| `ProcessHub.improvementProject` (1:1) + `ensureSessionProject` / `landFreshEntryOnProcess` | The Workspace's auto-provisioned Project | The always-backed guarantee. Read it directly for ACL/scope/report context instead of via Active IP.                                                                   |
| `useActiveIPContext`, `useActiveIPStore`, `activeIP`                                       | Retirement target                        | Replace reads with the Workspace's `improvementProject`. Delete the auto-activation effect + `wasUserCleared` / cleared-state sessionStorage dance.                    |
| `ActiveIPLaunchpadCard` (Free roaming / Switch IP / Exit IP)                               | Retirement target                        | Replace with a lean **Workspace identity header**: title + (formalized) status/stage, or (informal) a "Name & formalize" affordance. No focus toggle, switch, or exit. |
| "Exit IP" / explicit cleared focus / `onExitIP` (8 call sites)                             | Retirement target                        | Remove after shell, ACL, Wall, Analyze, Report, Control, and mobile behavior read the Workspace's Project directly and the first-session walk is green.                |
| `useAnalysisScopeStore`                                                                    | Analysis Scope                           | Strengthen and document as the only active analytical lens.                                                                                                            |

## Consequences

### Product consequences

- Home helps users open or create **Workspaces**, not navigate Hub portfolios. ("New Workspace", "Open Workspace", "Untitled Workspace".)
- Project creation is **"Make this a Project / formalize this Workspace"**, not "create another project in this Hub."
- The Project tab is quiet for an informal Workspace and guides formal status/work once formalized.
- Quick analysis remains first-class: an **informal** Workspace presents with no Project chrome, yet is fully analyzable.
- Report is Workspace-level for exploratory work and Project-formal once the Project is formalized.

### Architecture consequences

- App shells derive a **Workspace view model** over the current `ProcessHub` + its `ImprovementProject` (the adapter is the boundary that lets the internal `ProcessHub` name survive while the surface speaks Workspace).
- ACL and role behavior read the attached Project, not a separate active-focus object.
- Analysis surfaces read **Analysis Scope**, not Active IP, for analytical context.
- Active-IP dead-code cleanup happens only after all live reads are migrated and the first-session walk proves behavior.
- Internal `ProcessHub` renaming is a later optional plan (it touches persistence, snapshots, storage keys, repository APIs).

### CoScout consequences

CoScout is designed around: Workspace context (data, process map, findings, hypotheses, Wall, report material); Project context (role/ACL, charter/status, membership, actions, formalization state); and current Analysis Scope (outcome, factor, step, filters).

Deterministic stats remain the authority. CoScout consumes validated Workspace + Analysis Scope context, then answers, proposes, drafts, routes, or requests confirmation according to role and safety rules. The CoScout autonomy boundary + eval-fixture work is an **independent** initiative (holistic eval ranked #2) and may run in parallel with this migration.

## Sequencing

This is one **holistic** initiative — no docs-now / behavior-later split. The migration is still _ordered for safety_ within the initiative: lock the product model (this spec) → introduce the Workspace view-model adapter → swap behavior off Active IP → delete the portfolio fossil → render-split the shells. The **first-session / b0 walk is the acceptance gate** at every behavior-touching step — it is the exact flow that must not regress. Detailed slice ordering lives in the [Workspace Architecture Roadmap](../plans/2026-06-09-workspace-architecture-roadmap.md); each product-code slice gets its own implementation plan and worktree.

## Acceptance Criteria

- User-facing architecture says **Workspace**, **Project** (soft-formalized), and **Analysis Scope**.
- V1 docs no longer describe one Hub/process containing many Projects as the current product model.
- The model states **"always backed by one active Project"**, not "zero-or-one / optional Project"; the First-Session-Journey auto-project guarantee is preserved.
- "Formalized" is a deliberate-act predicate; the FSJ auto-title alone does not formalize.
- Active IP, Project Focus, Exit IP, "Free roaming," and "Switch IP" are removal targets, not future vocabulary.
- `ProcessHub` remains allowed as internal storage vocabulary.
- Analysis Scope is the only active analytical lens.
- VariScout Process retains the named-future multi-project process model.
