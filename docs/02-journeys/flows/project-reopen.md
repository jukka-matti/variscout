---
tier: living
purpose: design
title: Project Reopen Flow
audience: human
category: workflow
status: active
related: [azure-daily-use, adr-082]
layer: L2
last-reviewed: 2026-06-05
---

# Flow: Home → Open Saved Project → 7-Tab Workflow

Expands [Flow 5: Return Visitor](../../02-journeys/traceability.md#flow-5-return-visitor) with the full project reopen experience for improvement specialists on the Azure app.

---

## Context

When an improvement specialist opens VariScout, they land on the Home screen — a list of `ProjectCard` components showing the projects they have access to (filtered by role: Lead sees projects they lead; Member sees invited projects; Sponsor sees sponsored projects). From Home they select a project, which loads the document wholesale and drops them into the 7-tab workflow.

Common return intents:

- **Continue the Measure⇄Analyze loop** — re-ingest new data and resume Explore / Analyze
- **Check finding or hypothesis status** — scan what's been captured and where things stand
- **Advance the IP to Control** — review the Control region on the Project tab
- **Build or share the Report** — compile findings and hypothesis verdicts

---

## Full Flow

### Step 0: Home — Project Cards

Before opening a project the specialist scans the Home list.

| Signal on card              | Source                                                                  |
| --------------------------- | ----------------------------------------------------------------------- |
| Project name + phase badge  | `CloudProject.name`, `metadata.phase` → `PHASE_CONFIG`                  |
| Recency (who updated, when) | `CloudProject.modified` + `CloudProject.modifiedBy`                     |
| Finding / question counts   | `metadata.findingCounts` + `metadata.questionCounts` (computed at save) |
| Control due-ness chip       | `metadata.sustainment.nextReviewDue` → "Review overdue" or "Review due" |

The chip is a non-interactive display element — the card itself carries the `onClick` that opens the project. Opening the card lands the specialist in the 7-tab workflow; the Control region is on the Project tab. Cards sort newest-modified first.

**Empty state:** when the specialist has no accessible projects, Home shows onboarding guidance and the option to start a new project.

---

### Step 1: Authenticate + Load Project

| Action                          | Implementation                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| App loads, SSO session active   | `easyAuth.ts`, `getEasyAuthUser()`                                                                       |
| Specialist selects project card | `Dashboard.tsx` list → `onClick`                                                                         |
| Document loads wholesale        | `hydrateDocumentSnapshot()` — one blob / one `.vrs` aggregate                                            |
| Stores hydrate                  | `useProjectStore`, `useImprovementProjectStore`, `useAnalyzeStore`, `useCanvasStore` + annotation stores |
| Active hub established          | `useActiveIPStore` restores per-session active IP if one existed                                         |

**PWA note:** The PWA is session-only (`R6d`). On re-open it shows a fresh start; findings and hypotheses survive if the specialist exported a `.vrs` and imports it (the file round-trips the full `DocumentSnapshot` including findings via PO-6).

---

### Step 2: 7-Tab Workflow Resumes

Once the document is loaded the full workflow nav is available:

```
Home · Project · Process · Explore · Analyze · Improve · Report
```

The specialist picks up where they left off. The active-IP cascade (if an IP was set active) scopes Project, Process, Explore, and Analyze to that IP automatically.

**Tab purposes at a glance:**

| Tab     | Purpose                                                                |
| ------- | ---------------------------------------------------------------------- |
| Home    | Back to the project list or switch project                             |
| Project | Charter, member roster, lifecycle stage (Charter → Approach → Control) |
| Process | Process map and scope definition for the active investigation          |
| Explore | Canvas / Four Lenses — measure and visualize the data                  |
| Analyze | Investigation Wall, hypotheses, cause-contribution                     |
| Improve | Action tracker scoped to the active Improvement Project                |
| Report  | Terminal compilation: findings + hypothesis verdicts + Control status  |

---

### Step 3: Common Re-entry Paths

#### Option A: Re-ingest New Data (Measure⇄Analyze Loop)

The most frequent return: new data came in for an ongoing project.

| Action                      | Behavior                                                      |
| --------------------------- | ------------------------------------------------------------- |
| Switch to Explore tab       | Canvas / chart workspace with current data                    |
| Upload or paste new batch   | `useEditorDataFlow` triggers the data-ingest overlay          |
| Charts update               | Stats engine re-runs on the new dataset                       |
| Drill produces a scope chip | `syncScopeFromDrill` writes `ProblemStatementScope.projectId` |
| Switch to Analyze to review | Hypotheses and Evidence Wall update from new data             |

#### Option B: Capture or Review Findings

The specialist spots a pattern or wants to review existing findings.

| Action                     | Behavior                                                         |
| -------------------------- | ---------------------------------------------------------------- |
| Right-click chart category | Creates a Finding with source metadata; status starts `observed` |
| Open Analyze tab           | FindingsPanel / FindingsLog shows current findings by status     |
| Advance Finding status     | `observed → investigating → analyzed → improving → resolved`     |
| Findings persist in `.vrs` | Round-trip survives export / import (PO-6)                       |

Findings are the unit of progress. Each Finding may carry one or more Hypotheses; the Report compiles from analyst-owned Hypothesis status (`evidence-survived-test`, `refuted`, etc.) rather than from a stored membership list.

#### Option C: Control Review

When the Home card shows a control due-ness chip the specialist navigates directly to the Project tab.

| Action                           | Behavior                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Click project card               | Document loads; Project tab surfaces the Control region                                  |
| Control region loads             | `ProcessHubControlRegion` mounted as `controlRegionSlot` in Project tab                  |
| Specialist reviews / logs        | `ControlRecordEditor`, `ControlReviewLogger` write via `services/localDb.ts`             |
| `sustainment` projection updated | `metadata.sustainment.nextReviewDue` written at save; next Home visit shows updated chip |

The Control region is the Project tab's third stage (Charter → Approach → **Control**), gated by the active-IP cascade. Only Leads and Members can write control reviews; Sponsors see the Report-level summary.

#### Option D: Build or Share the Report

The specialist switches to the Report tab to compile status for a stakeholder.

| Action                    | Behavior                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Switch to Report tab      | `ReportView` composes from Hypothesis status + Finding status + Control data                                                          |
| Hypothesis verdicts shown | `evidence-survived-test` → narrative rows; `refuted` → tested-and-excluded; `proposed`/`needs-disconfirmation` → open-questions block |
| Copy or export            | Copy section as slide, Save as PDF, or share the `.vrs` file                                                                          |

---

## Roles and Access

Per ADR-082, access is per-project:

| Role    | Home visibility    | Project tab write | Control writes | Report sign-off |
| ------- | ------------------ | ----------------- | -------------- | --------------- |
| Lead    | Projects they lead | Full              | Yes            | No (Sponsor)    |
| Member  | Invited projects   | Member scope      | Yes            | No              |
| Sponsor | Sponsored projects | Read-only charter | No             | Yes (optional)  |

Non-members never see the project in their list. Access gates inside each surface; tab entry itself is not blocked.

---

## Implementation Reference

| Component / Store                      | File                                                    | Role in flow                                    |
| -------------------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `ProjectCard`                          | `apps/azure/src/components/ProjectCard.tsx`             | Home card with recency + finding/control chips  |
| `hydrateDocumentSnapshot()`            | `packages/stores/src/documentSnapshot.ts`               | Wholesale document load → store hydration       |
| `useImprovementProjectStore`           | `packages/stores/src/improvementProjectStore.ts`        | Document-layer project mirror                   |
| `useAnalyzeStore`                      | `packages/stores/src/analyzeStore.ts`                   | Findings, scopes, causal links                  |
| `useActiveIPStore`                     | `packages/stores/src/activeIPStore.ts`                  | Per-session active IP (annotation-user layer)   |
| `ProjectsTabView`                      | `apps/azure/src/components/ProjectsTabView.tsx`         | Project tab host; mounts `controlRegionSlot`    |
| `ProcessHubControlRegion`              | `apps/azure/src/components/ProcessHubControlRegion.tsx` | Control review UI on Project tab                |
| `projectMetadata.buildProjectMetadata` | `packages/core/src/projectMetadata.ts`                  | Derives `findingCounts` + `sustainment` at save |

---

## See Also

- [ADR-082: Wedge Architecture](../../07-decisions/adr-082-wedge-architecture.md) — single-SKU + per-project ACLs (Lead / Member / Sponsor)
- [ADR-043: Teams Entry Experience](../../archive/adrs/adr-043-teams-entry-experience.md) — historical heritage (portfolio home screen, pre-wedge entry design)
- [Journey Traceability — Flow 5](../traceability.md#flow-5-return-visitor) — high-level flow index
- [Journey Traceability — Flow 7](../traceability.md#flow-7-azure-daily-use) — daily use flow
- [IA Nav Model](../ia-nav-model.md) — 7-tab nav + active-IP cascade
