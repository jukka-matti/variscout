---
title: Header Redesign — Merged Toolbar + Workspace Tabs
date: 2026-04-01
status: superseded
audience: [developer, designer]
category: design-spec
related: [header, toolbar, workspace-tabs, auto-save, report-workspace, navigation, panels]
---

> **Superseded by [Unified Header](2026-04-02-unified-header-design.md)** — extends this spec by additionally merging the App header into a single adaptive bar.

# Header Redesign — Merged Toolbar + Workspace Tabs

Merge EditorToolbar and WorkspaceTabs into a single 44px header row. Introduce Report as a 5th workspace tab. Replace explicit Save with auto-save and title-area status. Promote PI Panel to cross-cutting sidebar available in all workspaces.

## Problem

The current header consumes 93px (toolbar 48px + workspace tabs 45px). Toolbar buttons accumulated organically — Export, Report, Present, Findings, Stats, AI, What-If, Save, Add Data — creating a cluttered row that changes per workspace, breaking spatial memory. The Report view is a modal overlay rather than a proper workspace. The Save button occupies prime header real estate despite modern auto-save patterns being well-established.

## Design

### Header Structure (44px, fixed across all workspaces)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [←] Project Name (30) ●  │  Overview · Analysis ▾ · Investigation · Improvement · Report  │  [📊] [💬] [+action]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Three zones:

| Zone       | Content                                                                     | Changes per workspace?               |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------ |
| **Left**   | Back arrow + project name + row count + save status dot                     | Never                                |
| **Center** | 5 workspace tabs (Overview, Analysis ▾, Investigation, Improvement, Report) | Never (active tab highlight changes) |
| **Right**  | PI Panel toggle + CoScout toggle + one optional primary action              | Primary action slot only             |

### Right Zone: Fixed + One Primary Action

The right zone has a fixed structure. PI Panel (📊) and CoScout (💬) never move. One optional primary action appears between them and the edge, always in the same slot position.

| Workspace     | Right zone                |
| ------------- | ------------------------- |
| Overview      | 📊 💬                     |
| Analysis      | 📊 💬 `+ Add Data`        |
| Investigation | 📊 💬                     |
| Improvement   | 📊 💬 `Convert → Actions` |
| Report        | 📊 💬                     |

### 5 Workspace Tabs

| Tab               | Purpose                                                               | Maps to journey phase |
| ----------------- | --------------------------------------------------------------------- | --------------------- |
| **Overview**      | Project status, What's New, CoScout quick-ask, other projects         | Orientation (landing) |
| **Analysis ▾**    | Charts, ProcessHealthBar, drill-down, filters                         | SCOUT + FRAME         |
| **Investigation** | Question checklist, findings board, hypothesis tree                   | INVESTIGATE           |
| **Improvement**   | Synthesis, idea groups, What-If, convert to actions                   | IMPROVE               |
| **Report**        | Analysis Snapshot / Investigation Report / Improvement Story + export | Communication         |

Analysis tab has a dropdown chevron (▾) for sub-mode selection: Standard / Performance / Yamazumi.

### Report Workspace (NEW)

Report becomes a full workspace tab instead of a modal overlay. All export, presentation, and sharing functionality lives here:

- **3 report types** (ADR-037): Analysis Snapshot, Investigation Report, Improvement Story
- **Audience toggle**: Technical / Summary
- **Export actions**: Copy to clipboard, Save as PDF, Present (fullscreen), Share (Teams)
- **Default selection**: When entering from Analysis, shows Analysis Snapshot. When entering from Investigation, shows Investigation Report. When entering from Improvement, shows Improvement Story.

This removes Export, Report, and Presentation buttons from the header entirely.

### Auto-Save + Title Status

Replace explicit Save button with auto-save. Save status appears as a dot next to the project name.

| State           | Dot            | Desktop text                        | Phone            |
| --------------- | -------------- | ----------------------------------- | ---------------- |
| Saved           | ● green        | Hidden (silent success)             | ● only           |
| Saving          | ● blue (pulse) | Saving…                             | ● pulse          |
| Unsaved changes | ● amber        | Unsaved                             | ● only           |
| Error           | ● red          | Save failed — retry (clickable)     | ● tap to retry   |
| Syncing (Team)  | ☁ blue         | Syncing to OneDrive…                | ☁ only           |
| Conflict (Team) | ☁ amber        | Sync conflict — resolve (clickable) | ☁ tap to resolve |

**Project name dropdown** (click project name):

- Rename project
- Save As… (Team plan only)
- Export CSV
- Share (Team plan only)

### PI Panel as Cross-Cutting Sidebar

The Process Intelligence Panel (Summary | Data | What-If tabs) becomes available in all workspaces, not just Analysis. Renamed from "Stats" to use the 📊 icon. The analyst may want to check stats, browse data, or run What-If while investigating or planning improvements.

### Buttons Removed from Header

| Button             | Where it moved                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Save               | Auto-save + title status dot                                                                                         |
| Save As            | Project name dropdown                                                                                                |
| Export CSV         | Project name dropdown + Report workspace                                                                             |
| Report             | Report workspace tab                                                                                                 |
| Presentation       | Report workspace (Present button)                                                                                    |
| Findings toggle    | Removed — Investigation workspace IS the findings view. Findings sidebar remains in Analysis via PI Panel or inline. |
| What-If button     | Removed — already in PI Panel's What-If tab                                                                          |
| Share              | Project name dropdown                                                                                                |
| Improvement button | Removed — Improvement workspace tab (already done in ADR-055)                                                        |

### Mobile Layout

```
Header (compact):
┌─────────────────────────────────┐
│ [←] Coffee Moisture ●    [📊][💬] │
└─────────────────────────────────┘

Content area (full height)

Bottom tab bar:
[Analysis] [Investigate] [Improve] [Report] [More]
```

- No workspace tabs in header (bottom bar handles it)
- No Save button (auto-save)
- "More" tab: Overview, + Add Data, Settings
- PI Panel and CoScout open as full-screen overlays on phone
- Header is just: ← Title ● [📊] [💬] — maximum content space

### Responsive Behavior

| Breakpoint     | Tabs               | Right zone               | Primary action  |
| -------------- | ------------------ | ------------------------ | --------------- |
| ≥1280px        | Full labels        | 📊 PI 💬 AI `+ Add Data` | With label      |
| 1024-1279px    | Full labels        | 📊 💬 `+ Add`            | Shortened label |
| 768-1023px     | Abbreviated labels | 📊 💬 `+`                | Icon only       |
| <768px (phone) | Bottom tab bar     | 📊 💬                    | In "More" menu  |

## What Stays Unchanged

- **ProcessHealthBar** — stays inside Analysis workspace content area (Grid/Scroll, Factors, filter chips, VariationBar, Cpk target)
- **Investigation workspace layout** — three-column (QuestionChecklist | FindingsLog | CoScout) per ADR-055
- **Improvement workspace** — ImprovementWorkspaceBase with synthesis, ideas, actions
- **CoScout sidebar** — available in all workspaces (no mutual exclusion with findings)
- **MobileTabBar** — bottom tab bar on phone (updated to 5 tabs: Analysis, Investigate, Improve, Report, More)

## Resolved Design Questions

| #   | Question                         | Decision                                                                                            |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Q1  | Tabs in header or separate row?  | In header — saves 45px vertical space                                                               |
| Q2  | Adaptive or fixed right zone?    | Fixed (PI, AI, one primary action slot) — preserves spatial memory                                  |
| Q3  | Overview as tab or back-button?  | Tab — Overview has many purposes especially in Team mode (What's New, status, quick-ask)            |
| Q4  | Export/Report/Present in header? | No — moved to Report workspace tab                                                                  |
| Q5  | Explicit Save button?            | No — auto-save with title-area status dot (Google Docs/Figma pattern)                               |
| Q6  | NarrativeBar in all workspaces?  | No — ChartInsightChips + CoScout provide passive/active AI nudges. NarrativeBar removed from scope. |
| Q7  | PI Panel in all workspaces?      | Yes — cross-cutting left sidebar, renamed from "Stats"                                              |
| Q8  | Settings button in header?       | No — no global settings panel exists. Factor settings in Analysis workspace.                        |
| Q9  | CoScout popout window?           | Deferred — sidebar works well, dual-screen is edge case                                             |
| Q10 | BroadcastChannel sync?           | Deferred — complex, low-value for current user base                                                 |

## App Differences (PWA vs Azure)

| Feature               | PWA                                     | Azure                          |
| --------------------- | --------------------------------------- | ------------------------------ |
| Workspace tabs        | Analysis only                           | All 5 tabs                     |
| PI Panel              | Left sidebar (Summary + Data + What-If) | Same                           |
| CoScout               | Hidden (no AI)                          | Right sidebar                  |
| Report workspace      | Hidden (no report feature in PWA)       | Full report workspace          |
| Auto-save status      | Session-only (no persistence in PWA)    | IndexedDB + OneDrive sync      |
| Project name dropdown | Hidden (no project management in PWA)   | Rename, Save As, Export, Share |
| Overview tab          | Hidden (no project dashboard in PWA)    | Full dashboard                 |

## State Model

Extends ADR-055's `activeView` to include `'report'`:

```typescript
activeView: 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';
```

New action: `showReport()` — sets `activeView: 'report'`.

The `isReportOpen` boolean is removed (replaced by `activeView: 'report'`). The `openReport()` action becomes `showReport()`.

## Implementation Phases

### Phase 1: Report workspace tab

- Add `'report'` to `activeView` type in panelsStore
- Add `showReport()` action, keep `openReport()` as deprecated shim
- Route Report workspace in Editor.tsx (move `ReportViewBase` from overlay to workspace routing)
- Update WorkspaceTabs to show 5 tabs
- Remove Report button from EditorToolbar
- Update MobileTabBar to include Report tab

### Phase 2: Header merge

- Create new `ProjectHeader` component (replaces EditorToolbar + WorkspaceTabs)
- Three zones: left (back + title + status), center (tabs), right (PI + AI + primary action)
- Remove Export, Present, Findings, What-If buttons from header
- Move Add Data to primary action slot (Analysis only)
- Move Convert → Actions to primary action slot (Improvement only)
- Update height calculations (`h-[calc(100vh-...)]`)

### Phase 3: Auto-save

- Implement auto-save on state changes (debounced, ~2s after last change)
- Replace Save button with title-area status dot
- Add project name dropdown (Rename, Save As, Export CSV, Share)
- Handle error/retry states
- Remove Save/Save As buttons

### Phase 4: PI Panel everywhere

- Remove `activeView === 'analysis'` gate from PI Panel toggle
- Ensure PI Panel renders correctly in Investigation and Improvement workspaces

## Related

- [ADR-055: Workspace-Based Navigation](../../07-decisions/adr-055-workspace-navigation.md)
- [ADR-037: Reporting Workspaces](../../07-decisions/adr-037-reporting-workspaces.md)
- [Dashboard Chrome Redesign](2026-03-28-dashboard-chrome-redesign.md) — original broader spec (this design refines the header/toolbar portion)
- [Process Intelligence Panel](2026-03-28-process-intelligence-panel-design.md) — PI Panel tabs design
- [Navigation Patterns](../../06-design-system/patterns/navigation.md)
