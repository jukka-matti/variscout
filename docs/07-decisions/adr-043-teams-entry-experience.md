---
title: 'ADR-043: Teams Entry Experience'
status: accepted
date: 2026-03-22
---

# ADR-043: Teams Entry Experience

**Status**: Accepted

**Date**: 2026-03-22

---

## Context

The current Azure project list is a flat table showing project names and last-modified timestamps. Several pain points have been identified:

- **No health indicators**: Users cannot tell at a glance which projects have overdue actions, unresolved findings, or blocked investigations. Every reopened project requires navigating into the Editor to assess the current state.
- **Fragile deep links**: Deep links are constructed using project names (URL-encoded strings). Renaming a project silently breaks all shared links in Teams chats and Adaptive Cards.
- **No "what's new" awareness**: When a user returns to a project after teammates have made changes (adding findings, advancing hypotheses, completing actions), there is no signal at the entry point that anything has changed since their last visit.
- **Limited deep link targets**: Existing deep links reach only findings (`?finding=<id>`) and charts (`?chart=<type>`). There is no way to deep-link into a hypothesis node, the improvement workspace, or the dashboard overview tab.
- **No cross-project awareness inside a project**: Once inside a project, users have no visibility into other active projects without navigating back to the project list.
- **No guided onboarding**: New users opening VariScout for the first time see a blank project list with no sample data pathway.

---

## Decision

### 1. Portfolio Home Screen with Rich ProjectCard Components

Replace the flat project table with a Portfolio home screen. Each project is rendered as a `ProjectCard` component showing:

- Project name and last modified timestamp
- Current journey phase (FRAME / SCOUT / INVESTIGATE / IMPROVE) as a visual phase indicator
- Finding counts by status (observed / investigating / analyzed / improving / resolved) as color-coded chips
- Assigned tasks count and overdue action flag (amber "Overdue" badge when past-due actions exist)
- AI-generated one-line health summary (progressive enhancement — hidden when AI is unavailable)
- "What's new" signal: a blue indicator dot when the project has changes since `lastViewedAt`

Cards are sorted by most recently modified by default. The layout is a responsive grid (1 column on phone, 2 on tablet, 3 on desktop).

### 2. Metadata Sidecar (`.meta.json`) for Lightweight Health Data

A `.meta.json` file is written alongside each `.vrs` project file whenever a project is saved. It contains the lightweight health summary needed to render `ProjectCard` without loading the full `.vrs` file:

```json
{
  "projectId": "uuid-v4",
  "name": "Filling Line Variation",
  "lastModified": "2026-03-22T14:30:00Z",
  "phase": "investigate",
  "findingCounts": {
    "observed": 2,
    "investigating": 3,
    "analyzed": 1,
    "improving": 0,
    "resolved": 0
  },
  "taskCounts": { "total": 5, "completed": 2, "overdue": 1 },
  "lastViewedAt": "2026-03-21T09:00:00Z"
}
```

The sidecar is written by `storage.ts` after every successful project save. On portfolio load, only `.meta.json` files are read (fast, lightweight). The full `.vrs` is loaded only when a project is opened.

For OneDrive-synced projects (Team plan), both files are written to the same SharePoint folder. For local projects (Standard plan), both files are written to the same File System Access API directory handle.

### 3. ID-Based Deep Links with Backward-Compatible Name Fallback

All deep links are updated to use a stable UUID project identifier (`projectId`) instead of the project name:

```
# New format
?project=3f8a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c

# Legacy format (still supported, resolved via name lookup)
?project=Filling+Line+Variation
```

`deepLinks.ts` is updated to:

1. Generate links using `projectId` from the `.meta.json` sidecar
2. Resolve incoming `?project=` by first attempting UUID match against all loaded `.meta.json` sidecar IDs
3. Fall back to name matching for backward compatibility with existing shared links
4. Show a one-time toast when a legacy name link is resolved: "This link uses an old format. Links shared from now on will be more reliable."

### 4. Expanded Deep Link Targets

Deep link `tab=` parameter is added for within-project navigation, avoiding collision with the existing `?view=` popout parameter:

| Parameter            | Target                                       | Notes                               |
| -------------------- | -------------------------------------------- | ----------------------------------- |
| `?tab=overview`      | Project Dashboard (Overview tab)             | New                                 |
| `?tab=analysis`      | Editor (Analysis tab)                        | New; equivalent to existing default |
| `?hypothesis=<id>`   | Investigation sidebar scrolled to hypothesis | New                                 |
| `?workspace=improve` | Improvement workspace open in Editor         | New                                 |
| `?finding=<id>`      | Findings panel + finding highlighted         | Existing                            |
| `?chart=<type>`      | Editor + chart in focused view               | Existing                            |

The `tab=` parameter is processed after project load and before `panelsStore.activeView` is set.

### 5. "What's New Since Last Visit" via `lastViewedAt` Timestamp Diff

The `lastViewedAt` field in `.meta.json` is updated to the current timestamp when a user opens a project. On the Portfolio home screen, a project card shows a "What's new" indicator when:

```
project.lastModified > project.lastViewedAt
```

When the user opens a project, if `lastModified > lastViewedAt`, a `WhatsNewSection` is shown at the top of the Project Dashboard before the main status columns. It summarizes changes since `lastViewedAt`:

- New findings added (count + names)
- Hypotheses whose status changed
- Actions completed or newly overdue
- Findings resolved

`WhatsNewSection` is dismissed by clicking "Got it" or navigating to the Editor. Dismissal updates `lastViewedAt` in both local state and the `.meta.json` sidecar.

### 6. `tab=` Parameter for Within-Project Navigation

The `tab=` URL parameter is introduced to target specific project tabs on deep link entry, separate from the `?view=` parameter (which handles popout windows):

- `?tab=overview` — lands on Project Dashboard (Overview tab)
- `?tab=analysis` — lands on Editor (Analysis tab), equivalent to the existing deep link default
- When `tab=` is absent, existing behavior is preserved (deep links to findings/charts/hypotheses bypass the dashboard and land in the Editor)

### 7. OtherProjectsList on Overview Tab for Cross-Project Awareness

An `OtherProjectsList` component is added at the bottom of the Project Dashboard (Overview tab). It shows a compact list of other active projects (max 3), each with their phase indicator and overdue flag. Clicking navigates to that project's portfolio card (loads the project). This provides cross-project awareness without leaving the current project context.

`OtherProjectsList` reads health data from the already-loaded `.meta.json` sidecars — no additional file reads are required at render time.

### 8. SampleDataPicker for Onboarding

When the project list is empty (no saved projects), the Portfolio home screen shows a `SampleDataPicker` component instead of an empty state. It presents the available sample datasets (coffee, journey, bottleneck, sachets) as cards with descriptions and lets the user load one into a new project with a single click.

`SampleDataPicker` uses `@variscout/data` sample datasets, consistent with the PWA sample loading flow.

---

## Consequences

### What becomes easier

- **Project health at a glance**: Users know which projects need attention before opening them. Overdue actions and blocked investigations are visible on the portfolio card.
- **Reliable deep links**: ID-based links survive project renames. Teams Adaptive Cards and shared links remain stable across project edits.
- **Reduced disorientation on return**: "What's new" summary answers "what changed since I was last here?" without manual investigation.
- **Richer Teams integration**: Deep links to hypotheses and the improvement workspace enable more precise Adaptive Card actions and channel tab entries.
- **Cross-project awareness**: `OtherProjectsList` surfaces parallel investigations without leaving the current project.
- **Faster onboarding**: `SampleDataPicker` replaces the blank empty state with guided sample data entry.

### What becomes harder / new obligations

- **Sidecar maintenance**: Every project save must write a `.meta.json` sidecar. If the sidecar write fails (e.g., disk quota), the project save must still succeed — sidecar failure is non-blocking. The portfolio will show stale health data until the next successful save.
- **Migration for existing projects**: Projects saved before this change have no `.meta.json`. The portfolio must handle missing sidecars gracefully (render a minimal card with name + last-modified only, no health data). A background sidecar generation pass runs once on first launch after upgrade.
- **OneDrive sync**: Both `.vrs` and `.meta.json` must be tracked in OneDrive sync. The sidecar adds a second file per project in the sync surface.
- **`tab=` vs `view=` disambiguation**: The new `tab=` parameter must be clearly documented and distinct from `view=` (popout) to avoid developer confusion.

### New components

| Component           | Location                     | Purpose                                            |
| ------------------- | ---------------------------- | -------------------------------------------------- |
| `ProjectCard`       | `apps/azure/src/components/` | Rich project card for Portfolio home screen        |
| `WhatsNewSection`   | `apps/azure/src/components/` | "What's new since last visit" summary on Dashboard |
| `OtherProjectsList` | `apps/azure/src/components/` | Cross-project compact list on Dashboard Overview   |
| `SampleDataPicker`  | `apps/azure/src/components/` | Guided sample data entry for empty portfolio state |

### Updated files

| File                                   | Change                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/azure/src/services/storage.ts`   | Write `.meta.json` sidecar on every project save; read sidecars for portfolio |
| `apps/azure/src/services/deepLinks.ts` | ID-based link generation; UUID + name-fallback resolution; expanded targets   |
| `apps/azure/src/App.tsx`               | Portfolio home screen; routing for `tab=` parameter; sidecar migration pass   |

---

## See Also

- [ADR-042: Project Dashboard](adr-042-project-dashboard.md) — Single-project Overview tab (Dashboard ↔ Editor)
- [ADR-016: Teams Integration](adr-016-teams-integration.md) — Teams channel tabs and deep link infrastructure
- [ADR-030: Unified File Picker](adr-030-unified-file-picker.md) — File System Access API and OneDrive file handling
- [Project Dashboard](../../docs/03-features/workflows/project-dashboard.md) — Dashboard feature documentation
- [Project Reopen Flow](../../docs/02-journeys/flows/project-reopen.md) — Updated flow with Portfolio entry
