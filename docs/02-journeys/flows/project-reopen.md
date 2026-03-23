---
title: Project Reopen Flow
audience: [analyst, engineer]
category: workflow
status: stable
related: [return-visitor, azure-daily-use, project-dashboard, adr-042, adr-043]
---

# Flow: Portfolio → Open Saved Project → Project Dashboard → Analysis

Expands [Flow 5: Return Visitor](../../02-journeys/traceability.md#flow-5-return-visitor) with the full project reopen experience. Entry now starts at the **Portfolio home screen** (ADR-043), followed by the Project Dashboard landing (ADR-042).

---

## Context

When an Azure user opens VariScout, they land on the Portfolio home screen — a grid of `ProjectCard` components showing project health at a glance. From there, they select a project and (for projects with data) land on the Project Dashboard before entering analysis.

Common return intents:

- **Continue analysis** — resume at the point where they left off
- **Check investigation status** — scan findings, hypotheses, open questions
- **Add new data batch** — append fresh measurements to an ongoing analysis
- **Ask a question** — "have we already checked X?"

The Portfolio provides an orientation moment before the project is even opened. The Project Dashboard provides a second orientation layer once inside the project.

---

## Full Flow

### Step 0: Portfolio Home Screen

Before selecting a project, the user scans the Portfolio grid.

| Action                                | Implementation                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| App loads, SSO session active         | `easyAuth.ts`, `getEasyAuthUser()`                                           |
| Portfolio reads `.meta.json` sidecars | `storage.ts` — lightweight sidecar reads, no `.vrs` loaded yet               |
| `ProjectCard` components rendered     | Phase indicator, finding counts, task counts, overdue flag, "What's new" dot |
| "What's new" indicator visible        | `lastModified > lastViewedAt` comparison from `.meta.json`                   |
| User scans cards for signals          | Overdue badges, unresolved findings, blue "new changes" dots                 |

**Empty portfolio**: When no projects exist, `SampleDataPicker` is shown instead of an empty list. The user can select a sample dataset (coffee, journey, bottleneck, sachets) to create a new project with pre-loaded data.

---

### Step 1: Authenticate + Load Project

| Action                         | Implementation                                             |
| ------------------------------ | ---------------------------------------------------------- |
| App loads, SSO session active  | `easyAuth.ts`, `getEasyAuthUser()`                         |
| User selects project from list | Project list UI (Azure only)                               |
| `loadProject()` hydrates state | `useProjectPersistence`, IndexedDB or OneDrive sync        |
| `panelsStore.activeView` set   | `'dashboard'` (has data) or `'editor'` (new/empty project) |

**Exception — deep link bypass:** If the URL contains `?finding=<id>`, `?chart=<type>`, or a Teams task link with a target, `activeView` is set to `'editor'` before render. The dashboard is skipped and the Editor opens at the linked target.

---

### Step 2: Project Dashboard Loads

`ProjectDashboard` renders when `panelsStore.activeView === 'dashboard'`. All status data comes from the already-loaded `AnalysisState` — no extra fetch.

**What's New section (top, conditional):**

Shown when `lastModified > lastViewedAt` (read from `.meta.json` sidecar). Summarizes changes since last visit:

- New findings added (count + names)
- Hypotheses whose status changed
- Actions completed or newly overdue
- Findings resolved

Dismissed by clicking "Got it" or switching to the Editor tab. Dismissal writes current timestamp to `lastViewedAt` in `.meta.json`.

**Left column — Project Status (no AI required):**

- Project name + last edited timestamp
- Journey phase indicator (FRAME/SCOUT/INVESTIGATE/IMPROVE) with visual progress segments
- "Current focus" — active view description from `ViewState` (filter breadcrumb trail + "Go to analysis" button)
- Findings by status — clickable counts with color-coded dots
- Hypothesis tree summary — root hypotheses with status icons (✓/✗/?/◐) + η²
- Action progress — "2/5 actions completed" progress bar

**Right top — AI Summary Card (progressive enhancement):**

- 1-3 sentence contextual summary: current investigation status, overdue items, suggested next step
- Fast tier (gpt-5.4-nano, `reasoning: none`), `prompt_cache_key: 'variscout-dashboard'`
- State-aware cache: re-fetches only when `findingCount`, `hypothesisStatusCounts`, or `actionCompletionCount` changes
- Hidden when AI unavailable — left column expands to full width

**Right bottom — Quick Actions:**

- "Go to analysis" (always) — switches to Editor at current `ViewState`
- "Add new data batch" (always) — switches to Editor in data append flow
- "View report" (when findings exist) — switches to Editor with report view open
- "Review actions" (when overdue actions exist) — replaces "View report", opens Improvement workspace

---

### Step 3: Choose Orientation Path

From the Project Dashboard, the user has three primary paths:

#### Option A: Continue Analysis

User clicks "Go to analysis", the "Analysis" tab, or any chart-related item.

| Action                           | Implementation                                            |
| -------------------------------- | --------------------------------------------------------- |
| `panelsStore.showEditor()`       | Sets `activeView: 'editor'`                               |
| Editor renders at last ViewState | Saved `activeTab`, `focusedChart`, `filterStack` restored |

#### Option B: Navigate to a Specific Item

Clicking a status item on the dashboard switches to the Editor with a targeted panel/view:

| Dashboard item                           | What happens in Editor                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Findings count (e.g., "3 investigating") | Findings panel opens, `findingsStore.statusFilter` = `'investigating'`                                  |
| Hypothesis row                           | Investigation sidebar opens, `investigationStore.expandedHypothesisId` set, tree auto-expands to target |
| Action progress bar                      | Improvement workspace opens                                                                             |

#### Option C: Ask CoScout ("have we checked X?")

User types in the "Ask CoScout..." input on the Dashboard AI Summary Card.

| Action                                           | Implementation                                                  |
| ------------------------------------------------ | --------------------------------------------------------------- |
| User submits question                            | `aiStore.setPendingDashboardQuestion(question)`                 |
| Dashboard switches to Editor                     | `panelsStore.showEditor()`                                      |
| Editor opens CoScout panel                       | `panelsStore.openCoScout()`                                     |
| CoScout panel detects `pendingDashboardQuestion` | Auto-sends question on mount; clears `pendingDashboardQuestion` |
| CoScout auto-calls `search_project`              | Searches findings/hypotheses/ideas/actions for query text       |
| CoScout responds with search results             | May follow with `navigate_to` to show the relevant item         |

#### Option D: Add New Data Batch

User clicks "Add new data batch".

| Action                | Implementation                                          |
| --------------------- | ------------------------------------------------------- |
| Switch to Editor      | `panelsStore.showEditor()`                              |
| Open data append flow | `useEditorDataFlow` triggers the data ingestion overlay |

---

### Step 4: Return to Dashboard Mid-Session

The user can return to the Project Dashboard at any time via the "Overview" tab in the project shell nav.

| Action                              | Behavior                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Click "Overview" tab                | `panelsStore.showDashboard()`, `activeView: 'dashboard'`                                                 |
| Dashboard re-renders                | All status counts re-read from current `AnalysisState`                                                   |
| AI summary cache staleness check    | If `findingCount`/`hypothesisStatusCounts`/`actionCompletionCount` changed since last render, re-fetches |
| AI summary updates if state changed | Ensures the summary reflects work done in the Editor during this session                                 |

---

## Deep Link Bypass (Teams + Sharing)

Teams task links and direct share links bypass the dashboard and land in the Editor at the target view. This applies to:

| Source                                     | Target                                        |
| ------------------------------------------ | --------------------------------------------- |
| Teams Adaptive Card "View Finding"         | Editor + findings panel + finding highlighted |
| Shared chart URL (`?chart=boxplot`)        | Editor + that chart in focused view           |
| "View Finding" deep link (`?finding=<id>`) | Editor + findings panel + finding scrolled to |
| Teams channel tab (initial load)           | Editor (Teams users always start in analysis) |

In all deep link cases, `panelsStore.activeView` is set to `'editor'` before the project shell renders. The user can still navigate to the dashboard via the "Overview" tab after the deep link target is reached.

---

## Mobile Layout

On phone (<640px), the dashboard renders as a **single-column stacked layout**:

1. Project name + phase indicator
2. AI Summary Card (or hidden if unavailable)
3. Findings by status
4. Hypothesis tree summary
5. Action progress
6. Quick Actions

The "Ask CoScout..." input collapses to a tap-to-expand bottom sheet. All navigation actions work identically on mobile.

---

## Implementation Reference

| Component / Store                         | File                                                          | Role in flow                             |
| ----------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `ProjectDashboard`                        | `apps/azure/src/components/ProjectDashboard.tsx`              | Full dashboard view                      |
| `ProjectStatusCard`                       | `apps/azure/src/components/ProjectStatusCard.tsx`             | Left column status summary               |
| `DashboardSummaryCard`                    | `apps/azure/src/components/DashboardSummaryCard.tsx`          | AI summary + quick-ask input             |
| `panelsStore.activeView`                  | `apps/azure/src/features/panels/panelsStore.ts`               | `'dashboard' \| 'editor'` toggle         |
| `panelsStore.showDashboard()`             | `apps/azure/src/features/panels/panelsStore.ts`               | Sets `activeView: 'dashboard'`           |
| `panelsStore.showEditor()`                | `apps/azure/src/features/panels/panelsStore.ts`               | Sets `activeView: 'editor'`              |
| `findingsStore.statusFilter`              | `apps/azure/src/features/findings/findingsStore.ts`           | Pre-filter findings panel from dashboard |
| `investigationStore.expandedHypothesisId` | `apps/azure/src/features/investigation/investigationStore.ts` | Scroll-to hypothesis from dashboard      |
| `aiStore.pendingDashboardQuestion`        | `apps/azure/src/features/ai/aiStore.ts`                       | Dashboard → CoScout question handoff     |
| `buildDashboardSummaryPrompt()`           | `packages/core/src/ai/prompts/dashboardSummary.ts`            | AI summary prompt builder                |
| `search_project` tool                     | `packages/core/src/ai/searchProject.ts`                       | CoScout artifact search                  |
| `navigate_to` tool                        | `apps/azure/src/features/ai/useAIOrchestration.ts`            | CoScout navigation handler               |

---

## See Also

- [ADR-042: Project Dashboard](../../07-decisions/adr-042-project-dashboard.md) — design decisions for the Dashboard ↔ Editor model
- [ADR-043: Teams Entry Experience](../../07-decisions/adr-043-teams-entry-experience.md) — design decisions for Portfolio, ProjectCard, What's New, and deep links
- [Journey Traceability — Flow 5](../traceability.md#flow-5-return-visitor) — high-level flow index
- [Journey Traceability — Flow 7](../traceability.md#flow-7-azure-daily-use) — daily use (includes portfolio + dashboard entry)
- [Journey Phase → Screen Mapping](../../05-technical/architecture/journey-phase-screen-mapping.md#project-dashboard-azure-only)
- [Navigation Patterns § Portfolio and Dashboard](../../06-design-system/patterns/navigation.md#8-portfolio-and-dashboard-navigation-azure)
