---
tier: living
purpose: design
title: 'Project Dashboard'
audience: human
category: workflow
status: active
last-verified: 2026-06-09
verified-against-commit: 160991867
related: [investigation, findings, hypotheses, coscout, azure, navigation]
layer: L3
kind: ui
serves:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/personas/member.md
  - docs/02-journeys/personas/sponsor.md
---

# Project Dashboard

Under the Workspace model (see [workspace architecture spec](../../superpowers/specs/2026-06-09-workspace-architecture-and-project-formalization-design.md)), there are **two distinct "home" surfaces** in the Azure app, and the code carries both under dashboard-ish names. This doc describes them as they ship today on `main`.

1. **Home** — the app-level launcher shown before a Workspace is open. Resume the last Workspace, start a new one, or open another. Component: `pages/Dashboard.tsx` (`App.tsx` renders it when `currentView === 'dashboard'`).
2. **Project home view** — the in-Workspace orientation surface shown when `panelsStore.activeView === 'home'`. Status card + AI summary + quick actions + what's-new. Component: `components/ProjectDashboard.tsx` (rendered by `EditorViewSwitch`).

```
App launch ──► Home (pages/Dashboard.tsx)
                 │  Resume last │ New │ Open another
                 ▼
            open Workspace ──► Editor ──► activeView
                                            ├─ 'home'  ──► ProjectDashboard (status · AI summary · quick actions · what's-new)
                                            └─ deep link ──► Explore / Analyze / Improve / Report (bypasses home)
```

> Azure-only feature. The PWA has no Workspace persistence and no dashboard.

> The product object is the **Workspace**, always backed by one active **Project** record (informal until deliberately formalized). The only analytical-narrowing lens is **Analysis Scope**. There is no active-IP focus mode, exit mode, free-roaming, or project-switcher (retired by the Workspace migration). Code still uses legacy internal names (`ProcessHub`, `improvementProject`, `activeView`); user-facing copy says Workspace / Project / Analysis Scope.

---

## Home (app-level launcher)

`pages/Dashboard.tsx`. Header reads **"Home"** with the subtitle "Resume the last Workspace, start a new one, or open another Workspace." The W4 migration (#358) replaced the former hub × analysis **portfolio browser** with a resume-first launcher.

### Resume last Workspace

A prominent card at the top of the list (`data-testid="resume-last-workspace"`). `resumeProject` is the project with the most-recent `metadata.lastViewedAt[userId]`, falling back to the most-recently-`modified` project. The card shows the project name and "Updated {date}", and the **Resume** button calls `onOpenProject(resumeProject.id)`.

### Start new / open existing

- **New Workspace** — `handleCreateHub()` provisions an incomplete Workspace via `useNewHubProvision`.
- **Try a Sample** — opens `SampleDataPicker`; the chosen sample loads into a new analysis.
- **Open from SharePoint** — `.vrs` file browse (rendered only when `onLoadProjectFile` is provided).
- **Open another Workspace** — a `<select>` populated from `listProjects()` / `listProcessHubs()`, with each option's title derived by `deriveWorkspaceViewModel` (the W2 Workspace view-model adapter from `@variscout/hooks`). Choosing a Workspace filters the recent-work list below.
- **Search + Refresh** — text filter over Workspace names; refresh re-fetches the listing.

The recent-work list renders `ProjectCard` rows (`components/ProjectCard.tsx`), each opening its project via `onOpenProject(project.id)`. When there are zero saved Workspaces, an empty state offers "Try a Sample".

---

## Project home view (in-Workspace)

`components/ProjectDashboard.tsx`, shown when `panelsStore.activeView === 'home'`. A two-column orientation surface, with `WhatsNewSection` pinned to the top on mobile.

### Project Status (left column)

`components/ProjectStatusCard.tsx`. Visible without AI, works offline:

- **Project name and last-edited timestamp**
- **Phase indicator** — four progress segments labeled **Frame / Explore / Analyze / Improve** (`PHASE_CONFIG` in `apps/azure/src/lib/journeyPhaseConfig.ts`; colors blue / green / amber / purple). The active phase is derived deterministically by `useJourneyPhase(hasData, findings)` — no data → frame, findings present → analyze, a finding with actions → improve, otherwise scout/explore. (Internal phase keys are still `frame`/`scout`/`analyze`/`improve`; the older linear journey-phase model and CoScout's `JourneyPhase` enum were retired — this indicator is a passive state read, not a workflow gate.)
- **Current focus** — when a filter stack is active, a breadcrumb trail from `filterStack` (e.g. "Operator > Night Shift"); clicking it calls `onResumeAnalysis`.
- **Findings by status** — clickable counts with color-coded dots (`finding-status-{status}`); clicking navigates to the findings view filtered to that status.
- **Suspected causes** — hypothesis hubs (`question-{id}`) with a status glyph; clicking opens the Analyze workspace focused on that hub (`expandToHypothesis`). (IM-1 replaced the retired Question entity with hypothesis hubs.)
- **Action progress** — "{completed}/{total} completed" progress bar; clicking opens the actions view.

### AI Summary Card (right top)

`components/DashboardSummaryCard.tsx`. Progressive enhancement — hidden when `aiEnabled` is false:

- A short contextual summary, sourced from the AI narration store (`narration.narrative`).
- **Quick-ask input** — on submit, stores the question in `aiStore.pendingDashboardQuestion` and navigates to the CoScout surface (`onNavigate('coscout')`).

### Quick Actions (right bottom)

Contextual buttons (`data-testid="quick-actions"`):

| Button            | Condition           | testid                  | Action                        |
| ----------------- | ------------------- | ----------------------- | ----------------------------- |
| Continue analysis | Always              | `action-resume`         | `onResumeAnalysis()`          |
| Add data          | Always              | `action-add-data`       | `onAddData()`                 |
| New Workspace     | `onNewHub` provided | `action-new-hub`        | `onNewHub()`                  |
| View report       | Findings exist      | `action-report`         | `onNavigate('report')`        |
| Review actions    | Open actions exist  | `action-review-actions` | navigates to the actions view |

---

## What's New (timestamp diff)

`components/WhatsNewSection.tsx`. Renders only when `lastViewedAt > 0`. It compares each artifact's timestamp against the current user's `lastViewedAt` and lists changes since the last visit (newest first, capped at 10):

- New findings (`finding.createdAt > lastViewedAt`)
- Finding status changes
- Completed actions
- New comments on findings
- Hypothesis hub status changes (`hypothesis.updatedAt > lastViewedAt`)

`ProjectDashboard` updates `lastViewedAt` once on mount via `onUpdateLastViewed`. The header reads "What's new since {date}"; with nothing new it shows an all-caught-up empty state.

---

## Navigation model

The project home view is one of the workspace tabs controlled by `panelsStore.activeView`, whose values are `'home' | 'frame' | 'explore' | 'analyze' | 'projects' | 'improvement' | 'report' | 'charter' | 'sustainment'`. `showHome()` sets `'home'`. (The former value `'dashboard'` was renamed to `'home'` in W5; `initFromViewState` still maps the legacy key for older saved documents.)

When a Workspace loads (`Editor`):

- **Deep links bypass the home view** and land directly in the relevant surface — `initialFindingId` and `initialChart` open the Explore/Analyze target; `initialMode` (`analyze` / `improvement` / `report` / `home`) selects the workspace; stale linked items show a toast.
- **No deep link, with a persisted view** — the persisted `activeView` is restored via `initFromViewState`.
- **No deep link, no persisted view** — defaults to Home (`showHome()`).

---

## CoScout tools

CoScout tools are gated by **product surface** (`process` / `explore` / `analyze` / `report`) in `packages/core/src/ai/prompts/coScout/tools/registry.ts` via `getToolsForSurface()` — not by a journey phase. Two tools relate to project-wide orientation:

### `search_project` (read / auto-execute)

Searches findings, hypotheses, improvement ideas, and actions in the current project by text, with optional `finding_status` / `hypothesis_status` filters (each status filter applies only to its artifact type). Available on the **explore, analyze, and report** surfaces. The pure search is `searchProjectArtifacts()` in `packages/core/src/ai/searchProject.ts`.

### `navigate_to` (action / hybrid)

Navigates to a finding, hypothesis, chart, improvement workspace, report, or **home**. Available on the **explore and analyze** surfaces. Auto-executes for plain panel/view navigation; when `restore_filters: true`, it returns a proposal card requiring user confirmation (filter restoration mutates the data pipeline). `'home'` is a valid target and calls `panels.showHome()`. Handler: `apps/azure/src/features/ai/teamToolHandlers.ts`.

---

## Roles

Access is per-project membership, not persona-routing. The V1 model collapses to one Specialist who takes a role per Project (wedge §3.5):

| Role        | How they use the home surfaces                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| **Lead**    | Resumes the active Workspace, advances stage, drives the investigation. Full edit per ACL.             |
| **Member**  | Opens formalized Projects they belong to; edits within role gating. Uses the status card to re-orient. |
| **Sponsor** | Read-mostly. Checks findings-by-status and action progress; reviews the compiled Report.               |

See [`ia-nav-model.md`](../../02-journeys/ia-nav-model.md) for the full role × tab access matrix.

---

## Implementation references

| File                                                     | Purpose                                           |
| -------------------------------------------------------- | ------------------------------------------------- |
| `apps/azure/src/pages/Dashboard.tsx`                     | App-level Home (resume / new / open Workspace)    |
| `apps/azure/src/components/ProjectDashboard.tsx`         | In-Workspace project home view                    |
| `apps/azure/src/components/ProjectStatusCard.tsx`        | Status summary (phase, findings, causes, actions) |
| `apps/azure/src/components/DashboardSummaryCard.tsx`     | AI summary card + quick-ask                       |
| `apps/azure/src/components/WhatsNewSection.tsx`          | Timestamp-diff "what's new" panel                 |
| `apps/azure/src/components/ProjectCard.tsx`              | Workspace row in the Home listing                 |
| `apps/azure/src/lib/journeyPhaseConfig.ts`               | Phase labels + colors (`PHASE_CONFIG`)            |
| `packages/hooks/src/useJourneyPhase.ts`                  | Deterministic phase derivation                    |
| `packages/core/src/ai/searchProject.ts`                  | `searchProjectArtifacts()` pure function          |
| `packages/core/src/ai/prompts/coScout/tools/registry.ts` | Surface-gated CoScout tool registry               |
| `apps/azure/src/features/ai/teamToolHandlers.ts`         | `navigate_to` handler                             |
| `apps/azure/src/features/panels/panelsStore.ts`          | `activeView` + `showHome()` / view actions        |

See [ADR-042](../../07-decisions/adr-042-project-dashboard.md) for the original dashboard design intent. The retired portfolio/Teams entry experience is archived in [ADR-043](../../archive/adrs/adr-043-teams-entry-experience.md); current Process Hub storage/context direction is [ADR-072](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md).
