# Teams Entry Experience Redesign

## Context

When users open VariScout (in Teams or browser), the current project list is a basic flat table showing name, modified date, modified by, and location. It provides no project health indicators, no personal task awareness, and no status context — users must open each project to understand its state.

The recently added Project Dashboard (ADR-042) provides a good overview once inside a project, but doesn't address the portfolio-level question: "which of my projects needs attention?"

This design creates a cohesive entry experience: **Portfolio → Overview → Analysis**, with rich project cards, a "what's new" briefing, expanded deep links, and full mobile/non-Teams support.

## Design Decisions

- **Portfolio is the home screen** — replaces the flat project table with rich status cards showing phase, findings, your assigned tasks, and who/when.
- **Overview tab integrates existing + new** — merges the current Project Dashboard content with "what's new since last visit" and "other projects" sections.
- **Each project opens in its own browser tab** — multi-project via browser tabs, no architecture change needed for master-detail.
- **"What's new" uses timestamp diff** — no activity log. `lastViewedAt` per project, diff against finding/hypothesis/action timestamps. CoScout analyzes the changes.
- **Deep links use project ID** (not name) — fixes fragility. Expanded targets: finding, hypothesis, chart, dashboard, improvement.
- **Progressive enhancement** — works without Teams SDK, without AI, without Team plan. Each capability layer adds value but none is required.
- **PWA unchanged** — this is Azure-only. PWA keeps its current HomeScreen with samples + paste.
- **Mobile fixes shipped separately** — toast positioning, user account visibility, share in mobile nav are targeted fixes, not part of this design.

---

## Layer 1: Portfolio (Home Screen)

### What it replaces

The current `Dashboard.tsx` flat table. All existing features are preserved and enriched.

### Layout

**Header bar:**

- VariScout logo (left)
- Channel name if Teams channel tab, "Personal" otherwise (left, after logo)
- Sync status badge: "Connected" / "Offline" / "Syncing (N pending)" (right)
- Search input (right)

**Action row:**

- "+ New Analysis" button (primary)
- "Open from..." button — adaptive label:
  - **Team plan:** "Open from SharePoint" (OneDrive File Picker v8)
  - **Standard plan:** "Open from Computer" (native file browser, `.vrs` + `.csv` + `.xlsx`)
  - Currently dead code for SharePoint — wire it up via `useFilePicker`
- "Try a Sample" button → opens sample dataset picker (coffee, journey, bottleneck, sachets from `@variscout/data`)

**Project cards (vertical list):**

Each card shows:

| Element                  | Source                                                          | Always visible?          |
| ------------------------ | --------------------------------------------------------------- | ------------------------ |
| Project name             | `CloudProject.name`                                             | Yes                      |
| Channel/location         | `CloudProject.location` + Teams context                         | Yes                      |
| Who updated + when       | `CloudProject.modifiedBy` + `CloudProject.modified` (Graph API) | Yes                      |
| Phase badge              | Derived from finding/hypothesis counts in project metadata      | Yes                      |
| Finding counts by status | Project metadata                                                | Yes                      |
| "Your tasks" section     | Findings/hypotheses assigned to current user                    | Only when user has tasks |
| Overdue flag             | Actions past `dueDate`                                          | Only when overdue        |

**"Your tasks" section** appears only when the current user has assigned items:

- Actions assigned to the user (from `ActionItem.assignee`)
- Hypotheses assigned for gemba/expert validation (from `Hypothesis.validationType` + `Hypothesis.validationTask`)
- Overdue items flagged in amber

**Visual priority:**

- Projects with "your tasks" get a left border accent (amber if overdue)
- Projects with no recent activity fade slightly (opacity)
- Projects sorted by: your tasks first → recently modified → rest

### Project metadata loading

**Problem:** The current project list only has Graph API metadata (name, modified, modifiedBy). Health indicators (finding counts, phase, your tasks) require reading the `.vrs` file.

**Solution — lightweight metadata sidecar:**

- When saving a project, write a small `<project-name>.meta.json` alongside the `.vrs` file
- Contains: `{ phase, findingCounts, hypothesisCounts, actionCounts, assignedTasks, lastViewedAt }`
- ~500 bytes, fast to read from Graph API without downloading the full `.vrs`
- `listProjects()` reads `.meta.json` files in parallel for all projects
- Backward compat: if `.meta.json` doesn't exist, card shows basic info only (name, modified, who)

### Mobile layout (<640px)

- Cards stack vertically, full width
- Phase badge moves below project name (not beside it)
- "Your tasks" section remains prominent
- Action row: "+ New Analysis" as full-width button, "SharePoint" and "Sample" in overflow menu
- Search: tap icon to expand input
- Touch targets: 44px minimum

### Non-Teams browser

- Same layout, no channel name
- "Open from..." shows "Open from Computer" (Standard plan) or "Open from SharePoint" (Team plan)
- Sync status shows "Local" (Standard) or "Connected" (Team)
- "Who updated" shows only your own activity on Standard plan (single user)

---

## Layer 2: Overview Tab (Inside a Project)

### What it integrates

Merges the current Project Dashboard (ADR-042) with new features:

- **Existing:** Phase progress, finding status, hypothesis summary, action progress, "where you left off", AI summary, Ask CoScout, quick actions
- **New:** "What's new since last visit", "Other projects" compact list

### Navigation

Tab bar: `← Portfolio` (back link) | **Overview** | Analysis

- Default landing when opening a project from Portfolio
- Deep links bypass to Analysis tab directly
- `activeView` persisted in ViewState (existing from ADR-042)

### "What's New Since Last Visit"

**Mechanism:**

- Store `lastViewedAt: number` per project in the metadata sidecar
- On Overview tab load, scan all project artifacts for `createdAt` or `updatedAt` > `lastViewedAt`:
  - New/updated findings (text, status change, new comments)
  - Hypothesis status changes (untested → supported/contradicted)
  - Completed actions
  - New improvement ideas
- Display as a compact list: "• Kim added gemba comment on 'Night Shift' finding"
- Update `lastViewedAt` after the user has seen the Overview

**AI integration:**

- "What's new" items are injected into the dashboard AI summary prompt
- CoScout can analyze changes and suggest next steps: "Kim's gemba comment supports the Operator hypothesis. Consider updating status."
- Uses existing `buildDashboardSummaryPrompt()` — extend with "what's new" context

**Type note:** `Hypothesis.createdAt` and `Hypothesis.updatedAt` are ISO strings (not numbers). Use `Date.parse()` before comparing with `lastViewedAt` epoch values. All other artifact timestamps (`Finding.createdAt`, `FindingComment.createdAt`, `ActionItem.completedAt`) are numbers.

**Empty state:** "Nothing new since your last visit. All caught up." with a subtle checkmark.

### "Other Projects" Section

- Compact cards showing: name, phase badge, last updated
- Sourced from the same `listProjects()` data used by Portfolio
- Click → opens that project in a **new browser tab** (same VariScout URL with `?project=<id>`)
- Shows max 5 projects (sorted by recent activity), "View all" link → Portfolio

### Integrated Content (from existing ProjectDashboard)

All existing Project Dashboard content remains:

- Phase progress bar (4 colored segments)
- Finding counts by status (clickable → switches to Analysis tab with findings panel + status filter)
- Hypothesis tree summary (clickable → switches to Analysis with investigation sidebar)
- Action progress (clickable → switches to Analysis with improvement workspace)
- "Where you left off" with resume button
- AI summary card with "Ask CoScout..." input
- Quick actions: Continue analysis, Add new data, View report, Review overdue actions

### Mobile layout (<640px)

- Single column, stacked vertically
- "What's new" section at top (most important)
- Phase + status below
- AI summary + Ask CoScout
- Quick actions as full-width buttons
- "Other projects" collapsed behind "See other projects" expandable section

### Non-Teams browser

- Same layout
- "Other projects" sourced from IndexedDB (Standard) or OneDrive (Team)
- "Who updated" in "What's new" shows user names on Team plan, "You" on Standard

---

## Layer 3: Deep Links

### Fix: ID-based links

**Current:** `?project=<name>` — fragile, breaks on rename, name collisions.

**New:** `?project=<id>` where ID is the unique identifier from storage (IndexedDB key or SharePoint item ID).

**Migration plan:**

- **SharePoint/OneDrive (Team plan):** `CloudProject.id` already holds the SharePoint drive item ID — use it directly
- **IndexedDB (Standard plan):** On first save after update, generate a UUID and store it as `project.id` alongside the existing name-based key. The IndexedDB store gains an `id` index.
- **Backward compat:** If the `?project=` value doesn't match any ID, try name-based lookup as fallback. This covers old Teams tab configurations and pre-migration bookmarks.
- **TeamsTabConfig:** Existing tabs use `entityId: 'variscout-channel'` (generic). New tabs will use `entityId: 'variscout-${channelId}'`. Old tabs continue working via name fallback.

### Expanded targets

| Parameter                        | Target      | Behavior                                                                   |
| -------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `?project=<id>`                  | Project     | Opens project → Overview tab                                               |
| `?project=<id>&finding=<id>`     | Finding     | Opens project → Analysis tab → Findings panel → finding highlighted        |
| `?project=<id>&hypothesis=<id>`  | Hypothesis  | Opens project → Analysis tab → Investigation sidebar → hypothesis expanded |
| `?project=<id>&chart=<type>`     | Chart       | Opens project → Analysis tab → chart focused                               |
| `?project=<id>&mode=report`      | Report      | Opens project → Analysis tab → report view                                 |
| `?project=<id>&mode=improvement` | Improvement | Opens project → Analysis tab → improvement workspace                       |
| `?project=<id>&tab=overview`     | Overview    | Opens project → Overview tab (explicit)                                    |

**Note:** Use `tab=` (not `view=`) for within-project navigation. The `view=` parameter is reserved for popout routing (`view=findings`, `view=improvement`) in `App.tsx`.

### Teams integration

- `buildSubPageId()` updated to use project ID
- `pages.shareDeepLink()` includes hypothesis and improvement targets
- Adaptive Cards include deep link buttons for all target types
- `useTeamsShare()` updated with new link builders

### Link builders

New/updated functions in `deepLinks.ts`:

- `buildProjectLink(baseUrl, projectId)` → `?project=<id>`
- `buildFindingLink(baseUrl, projectId, findingId)` → `?project=<id>&finding=<id>`
- `buildHypothesisLink(baseUrl, projectId, hypothesisId)` → `?project=<id>&hypothesis=<id>` (NEW)
- `buildChartLink(baseUrl, projectId, chartType)` → `?project=<id>&chart=<type>`
- `buildReportLink(baseUrl, projectId)` → `?project=<id>&mode=report`
- `buildImprovementLink(baseUrl, projectId)` → `?project=<id>&mode=improvement` (NEW)
- `buildOverviewLink(baseUrl, projectId)` → `?project=<id>&tab=overview` (NEW)

### Validation on arrival

When a deep link is parsed:

1. Check if project exists (try ID lookup, fallback to name)
2. If not found → show plan-aware error:
   - **Team plan:** "This project may have been moved or deleted." + "Go to Portfolio" button
   - **Standard plan:** "This project was not found locally. Standard plan projects are stored on this device only — Team plan enables shared access." + "Go to Portfolio" button
3. If found but target (finding/hypothesis) not found → open project Overview with a toast: "The linked item was not found"
4. If found → navigate to target

---

## Layer 4: Data Model Changes

### Metadata sidecar (`<project>.meta.json`)

Written alongside `.vrs` on every save:

```typescript
interface ProjectMetadata {
  phase: JourneyPhase; // 'frame' | 'scout' | 'investigate' | 'improve' — from useJourneyPhase, NOT detectInvestigationPhase()
  findingCounts: Record<FindingStatus, number>;
  hypothesisCounts: Record<HypothesisStatus, number>;
  actionCounts: { total: number; completed: number; overdue: number };
  assignedTaskCount: number; // count only — no PII in sidecar
  hasOverdueTasks: boolean;
  lastViewedAt: Record<string, number>; // keyed by user ID (Team) or 'local' (Standard)
}
```

**PII note:** The sidecar does NOT include assignee names or task text — only counts and flags. Assignee details are resolved client-side from the full `.vrs` file after project load. This avoids exposing PII in the sidecar which has the same SharePoint permissions as the `.vrs` file.

**Size:** ~200 bytes typical, ~500 bytes max.
**Written by:** `saveProject()` in `apps/azure/src/services/storage.ts` (not `useProjectPersistence` — the sidecar is a storage concern).
**Read by:** `listProjects()` for Portfolio cards.

### `lastViewedAt` per user

- Stored in `ProjectMetadata.lastViewedAt[userId]`
- Updated when user views the Overview tab (not on every page load)
- Used to compute "what's new" diff
- For Standard plan (single user): keyed by `'local'`
- For Team plan: keyed by EasyAuth user ID

### ViewState extension

No new fields needed — `activeView: 'dashboard' | 'editor'` from ADR-042 already handles Overview vs Analysis toggle. Rename semantics: `'dashboard'` = Overview tab, `'editor'` = Analysis tab.

---

## Files to Create/Modify

### New files

| File                                              | Purpose                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| `apps/azure/src/components/ProjectCard.tsx`       | Rich project card for Portfolio                   |
| `apps/azure/src/components/WhatsNewSection.tsx`   | "What's new since last visit" component           |
| `apps/azure/src/components/OtherProjectsList.tsx` | Compact project list for Overview tab             |
| `apps/azure/src/components/SampleDataPicker.tsx`  | Sample dataset selection modal                    |
| `packages/core/src/ai/prompts/whatsNew.ts`        | Extend dashboard prompt with "what's new" context |

### Modified files

| File                                             | Change                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `apps/azure/src/pages/Dashboard.tsx`             | Replace flat table with ProjectCard list, add sample picker, wire SharePoint button |
| `apps/azure/src/components/ProjectDashboard.tsx` | Integrate WhatsNewSection + OtherProjectsList                                       |
| `apps/azure/src/services/deepLinks.ts`           | ID-based links, new targets (hypothesis, improvement, overview), validation         |
| `apps/azure/src/services/storage.ts`             | Write/read `.meta.json` sidecar, `lastViewedAt` management                          |
| `apps/azure/src/hooks/useTeamsShare.ts`          | New link builders for expanded targets                                              |
| `apps/azure/src/teams/TeamsTabConfig.tsx`        | Channel-specific entityId (from audit M-8)                                          |
| `apps/azure/src/App.tsx`                         | Deep link validation, hypothesis/improvement routing                                |
| `apps/azure/src/services/storage.ts`             | Write `.meta.json` sidecar on save, read on list                                    |

### Existing utilities to reuse

| Utility                         | Location           | Reuse                                                            |
| ------------------------------- | ------------------ | ---------------------------------------------------------------- |
| `searchProjectArtifacts()`      | `@variscout/core`  | CoScout "what's new" analysis                                    |
| `buildDashboardSummaryPrompt()` | `@variscout/core`  | Extend with what's new context                                   |
| `useJourneyPhase()`             | `@variscout/hooks` | JourneyPhase for metadata sidecar (not detectInvestigationPhase) |
| `FINDING_STATUSES` / labels     | `@variscout/core`  | Status display on cards                                          |
| `usePanelsStore`                | Azure features     | Navigation from Portfolio/Overview                               |
| `useFilePicker`                 | Azure hooks        | Wire SharePoint button                                           |
| Sample datasets                 | `@variscout/data`  | Sample picker                                                    |

---

## Documentation Plan

### New documents

| Document                                              | Purpose                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `docs/07-decisions/adr-043-teams-entry-experience.md` | ADR: Portfolio, metadata sidecar, ID-based deep links, "what's new" timestamp diff, expanded deep link targets |

### Updated documents

| Document                                            | Changes                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `docs/07-decisions/index.md`                        | Add ADR-043 entry                                                                                         |
| `docs/03-features/workflows/project-dashboard.md`   | Add "what's new" section, "other projects", integration with Portfolio, rename to cover full Overview tab |
| `docs/02-journeys/flows/project-reopen.md`          | Add Portfolio as entry point, update flow with rich cards and "what's new"                                |
| `docs/05-technical/architecture/ai-architecture.md` | Dashboard summary prompt extension with "what's new" context                                              |
| `docs/06-design-system/patterns/navigation.md`      | Add Portfolio → Overview → Analysis navigation pattern                                                    |
| `docs/08-products/feature-parity.md`                | Update Portfolio row (Azure-only), add metadata sidecar note                                              |
| `CLAUDE.md`                                         | Update task-to-documentation table for Portfolio/Teams entry                                              |
| `.claude/rules/monorepo.md`                         | Add ProjectCard, WhatsNewSection, OtherProjectsList, SampleDataPicker to component listing                |

---

## Verification

### Unit tests

- `ProjectCard`: renders phase badge, finding counts, your tasks, overdue flag
- `WhatsNewSection`: computes changes from timestamp diff, handles empty state
- `OtherProjectsList`: renders compact cards, click opens new tab
- `deepLinks.ts`: ID-based parsing, all new targets, backward compat name fallback, validation
- Metadata sidecar: write on save, read on list, schema

### Integration tests

- Portfolio loads with project cards showing correct status from `.meta.json`
- Click project card → Overview tab with "what's new" computed correctly
- Deep link with hypothesis target → Analysis tab with investigation sidebar open
- "Try a Sample" → loads sample dataset into new project
- "Open from SharePoint" → file picker opens (Team plan only)

### E2E verification

- Open VariScout → Portfolio with rich cards
- Click project → Overview tab with "what's new"
- Click "Analysis" tab → full editor
- Click "← Portfolio" → returns to Portfolio
- Share deep link → recipient lands on correct target
- Mobile viewport: Portfolio cards stack, Overview single-column

### Manual verification

- Non-Teams browser: same flow, no channel name
- Standard plan: no SharePoint button, "Local" sync, single-user activity
- Offline: Portfolio shows cached project list, "Offline" badge
- "What's new" empty state when nothing changed
