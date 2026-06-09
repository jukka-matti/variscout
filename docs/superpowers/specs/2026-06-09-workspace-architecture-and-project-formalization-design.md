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

> **Last material edit 2026-06-09** - establishes the V1 Workspace -> optional Project -> Analysis Scope product model. ADR-082 remains accepted, with a 2026-06-09 amendment pointing here.

## Summary

VariScout V1 should be designed around the analyst's mental model:

```text
Workspace -> optional Project -> current Analysis Scope
```

An analyst does not start by thinking about a Hub, IP, or portfolio. They have data, a process problem, or a performance question, and they want a place to investigate it. That place is a **Workspace**.

A Workspace can later become formal work by attaching a **Project**: membership, role context, charter/status, actions, and report/signoff affordances. V1 supports zero or one Project per Workspace. Another effort means another Workspace, not another Project inside the same Hub.

`ProcessHub` remains a storage/container implementation detail for now. It is not a user-facing product noun. `Active IP` and `Project Focus` retire as product architecture. Once a Workspace has a Project, the Project is always attached; users narrow and broaden analytical attention with **Analysis Scope**, not by entering or exiting project focus.

## Definitions

| Concept           | Product meaning                                                                                                            | Current implementation anchor                                                                | V1 rule                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Workspace         | The user's analysis workspace: data, process map, findings, hypotheses, wall, report context, and optional formal Project. | `ProcessHub` plus document snapshot state.                                                   | User-facing object. One active Workspace in the shell.                                  |
| Project           | Optional formalization of a Workspace for collaboration, lifecycle, role context, actions, and report/signoff work.        | `ImprovementProject`, `useImprovementProjectStore`, project membership metadata.             | Zero or one Project per Workspace. Always attached once created.                        |
| Analysis Scope    | The active analytical lens: selected outcome/measure, factor, process step, and categorical filters.                       | `useAnalysisScopeStore` with `yColumn`, `boxplotFactor`, `stepId`, and `categoricalFilters`. | The only active lens in V1. View-layer, transient, and shared across workflow surfaces. |
| ProcessHub        | Internal storage primitive that groups document state and process data.                                                    | Hub IDs, snapshots, repository storage, route/document identity.                             | Internal vocabulary only until an optional later rename.                                |
| VariScout Process | Named-future enterprise product for ongoing process ownership and multi-project orchestration.                             | Roadmap/docs, not V1 product behavior.                                                       | May support one ongoing process with many Projects later. Not V1.                       |

## Product Model

### Workspace is the start

A Workspace starts when the analyst imports or pastes data, opens an existing saved analysis, or creates a new investigation. It is the user's place to frame, explore, analyze, improve, and report.

Workspace responsibilities:

- Own the current document identity and data context.
- Carry the process map and analytical artifacts.
- Host findings, hypotheses, measurement plans, actions, and report material.
- Expose whether the work has been formalized as a Project.
- Provide the context that CoScout and deterministic stats consume.

### Project is optional formalization

A Project is not a separate item inside a Hub portfolio in V1. It is a formal layer attached to the current Workspace.

Project responsibilities:

- Store charter/status and formal lifecycle metadata.
- Store members and role context: Lead, Member, Sponsor.
- Gate Azure collaboration and write authority where needed.
- Own project actions, report readiness, and formal follow-through.
- Provide CoScout with role context and permission boundaries.

If a Workspace has a Project, Project surfaces read that Project directly. There is no user-facing active-project selector for the same Workspace and no "Exit IP" state.

### Analysis Scope is the active lens

Analysis Scope answers "what am I looking at right now?" It is intentionally smaller and more temporary than Workspace or Project.

Analysis Scope includes:

- Outcome or measure under analysis.
- Factor under comparison or investigation.
- Process step when the question is step-scoped.
- Categorical filters, including WHERE-style predicates from chart or Wall interactions.

Analysis Scope should be consumed consistently by Explore, Process, Analyze, Report, and CoScout. It should not become persistence identity, ACL state, or project membership state.

## Decisions

1. **Workspace is the V1 product object.** User-facing docs and UI should use Workspace for the analysis container.
2. **Project is optional formalization.** V1 supports zero or one Project attached to a Workspace.
3. **Another effort means another Workspace.** V1 does not support many Projects inside one Hub or one Workspace.
4. **Hub is internal vocabulary.** `ProcessHub` remains as storage vocabulary while public vocabulary moves to Workspace.
5. **Active IP is retired.** It is not renamed to Project Focus. Its current behavior should be migrated to Workspace + attached Project + Analysis Scope.
6. **No Exit IP in the target model.** A Project is always attached once created; broad/narrow analysis happens through Analysis Scope.
7. **VariScout Process keeps the multi-project future.** Enterprise process ownership can later introduce a long-lived process object with many Projects.

## Current Code Mapping

| Current code/document term                           | Target model                         | Migration note                                                                             |
| ---------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `ProcessHub`, `hubId`, `sessionHub`                  | Workspace backing storage            | Keep in persistence and repository boundaries until a later internal rename plan.          |
| `ImprovementProject`                                 | Optional Project formalization       | Keep type until behavior is migrated; later naming can be planned separately.              |
| `useImprovementProjectStore.projectsByHub`           | Workspace -> optional Project lookup | V1 should enforce one live Project per Workspace at the view-model boundary.               |
| `useActiveIPContext`, `useActiveIPStore`, `activeIP` | Retirement target                    | Migrate reads to Workspace Project presence or Analysis Scope depending on behavior.       |
| "Exit IP" / explicit cleared focus                   | Retirement target                    | Remove after shell, ACL, Wall, Analyze, Report, Control, and mobile behavior are migrated. |
| `useAnalysisScopeStore`                              | Analysis Scope                       | Strengthen and document as the only active analytical lens.                                |

## Consequences

### Product consequences

- Home should help users open or create Workspaces, not navigate Hub portfolios.
- Project creation becomes "formalize this Workspace", not "create another project in this Hub".
- Project tab is present when a Workspace has a Project and should guide formal status/work.
- Quick analysis remains first-class: a Workspace can have no Project.
- Report can be Workspace-level for exploratory work and Project-formal when the Project exists.

### Architecture consequences

- App shells should derive a Workspace view model over the current `ProcessHub` + optional `ImprovementProject`.
- ACL and role behavior should read the attached Project, not a separate active focus object.
- Analysis surfaces should read `Analysis Scope`, not Active IP, when they need analytical context.
- Dead-code cleanup for Active IP must wait until live reads are migrated and tests prove behavior.
- Internal `ProcessHub` renaming is a later optional plan because it touches persistence, snapshots, storage keys, and repository APIs.

### CoScout consequences

CoScout should be designed around:

- Workspace context: data, process map, findings, hypotheses, wall, report material.
- Optional Project context: role/ACL, charter/status, membership, actions, report formalization.
- Current Analysis Scope: outcome, factor, step, and filters.

Deterministic stats remain the authority. CoScout should consume validated Workspace + Analysis Scope context, then answer, propose, draft, route, or request confirmation according to role and safety rules.

## Roadmap Link

Implementation sequencing lives in the [Workspace Architecture Roadmap](../plans/2026-06-09-workspace-architecture-roadmap.md). The roadmap intentionally keeps product-code changes out of this spec and requires a dedicated implementation plan for each promoted slice.

## Acceptance Criteria

- User-facing architecture says Workspace, optional Project, and Analysis Scope.
- V1 docs no longer describe one Hub/process containing many Projects as the current product model.
- Active IP and Project Focus are treated as migration targets, not future vocabulary.
- `ProcessHub` remains allowed as internal storage vocabulary.
- Analysis Scope is the only active analytical lens.
- VariScout Process retains the named-future multi-project process model.
