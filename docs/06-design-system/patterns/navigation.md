---
title: Navigation Patterns
audience: [analyst, engineer]
category: patterns
status: stable
related: [navigation, view-management, filter-chips, accessibility, z-index]
---

# Navigation Patterns

Comprehensive navigation patterns used across VariScout applications.

---

## 1. Overview

VariScout's navigation model is **data-driven exploration**, not page-based routing. There are no traditional pages or a router — view switching is state-driven via boolean panel flags and reducer actions.

Key principles:

- **State, not routes**: Panels open/close via `useAppPanels()` (PWA) and `usePanelsStore()` (Azure) reducers
- **Shared logic**: Filter navigation, keyboard shortcuts, and chart interaction hooks live in `@variscout/hooks`
- **Shared UI**: Panel components, filter chips, and mobile sheets live in `@variscout/ui`
- **Progressive disclosure**: Start with the dashboard, reveal panels as the analyst drills deeper

---

## 2. Three-Workspace Model

VariScout organizes the analyst's workflow into three workspaces, mapped to the PDCA journey:

| Workspace              | Purpose                                          | Current State                                                     |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| **Analysis** (default) | Dashboard with charts, stats, filters            | Fully implemented                                                 |
| **Findings**           | Investigation tracking, hypothesis tree, actions | Panel + popout (`?view=findings`)                                 |
| **Improvement**        | PDCA planning, idea synthesis, action tracking   | Components ready (`ImprovementWorkspaceBase`), app wiring pending |

### Planned: Workspace-Tab Header Navigation

The header will provide workspace tabs as the primary navigation mechanism, with cross-cutting panel sidebars:

```
Header:
[Analysis v] [Investigation] [Improvement]   [Stats/Data] [AI] [Settings]
  center: workspace tabs                      right: panel toggles
```

- **Workspace tabs** switch the center content area (charts / findings board / improvement workspace)
- **Stats/Data** toggle opens a left sidebar (Summary, Data, Histogram, Probability tabs)
- **AI** toggle opens CoScout as a right sidebar (adapts coaching to active workspace phase)
- **Analysis** has a dropdown for sub-modes (Standard / Performance / Yamazumi)
- PWA shows only Analysis tab + Stats. Azure shows all 3 tabs + AI.
- Mobile uses bottom tab bar instead (Analysis | Findings | Improve | More)

See [Dashboard Chrome Redesign spec](../../superpowers/specs/2026-03-28-dashboard-chrome-redesign.md) for full design.

### How workspace switching works today

- **Analysis → Findings**: `isFindingsPanelOpen` boolean toggles a slide-in panel (PWA) or resizable inline panel (Azure)
- **Findings popout**: `?view=findings` opens Findings in a separate browser window
- **Analysis → Improvement**: Not yet wired — `ImprovementWorkspaceBase`, `SynthesisCard`, `IdeaGroupCard`, and `ImprovementSummaryBar` components exist in `@variscout/ui` but app-level navigation, URL routing, and board-to-workspace synthesis remain as future work

### URL parameters

| Parameter            | Purpose                                          | Status              |
| -------------------- | ------------------------------------------------ | ------------------- |
| `?view=findings`     | Popout findings window                           | Implemented         |
| `?view=improvement`  | Improvement workspace popout                     | Future              |
| `?embed=true`        | Embed mode (hides chrome)                        | Implemented (PWA)   |
| `?project=<id>`      | Deep link to project (UUID or legacy name)       | Implemented (Azure) |
| `?tab=overview`      | Land on Dashboard (Overview tab) within project  | Implemented (Azure) |
| `?tab=analysis`      | Land on Editor (Analysis tab) within project     | Implemented (Azure) |
| `?finding=<id>`      | Deep link to finding                             | Implemented (Azure) |
| `?chart=<type>`      | Deep link to chart                               | Implemented (Azure) |
| `?hypothesis=<id>`   | Deep link to hypothesis in Investigation sidebar | Implemented (Azure) |
| `?workspace=improve` | Deep link to Improvement workspace               | Implemented (Azure) |
| `?mode=performance`  | Performance mode                                 | Implemented (Azure) |

> `tab=` is distinct from `view=`. `view=` opens a popout window (separate browser tab). `tab=` selects which project tab (Overview vs Analysis) to show within the main app window.

---

## 3. View Management

### PWA: `useAppPanels()`

Manages panel visibility via a `useReducer` with `AppPanelState`:

```typescript
interface AppPanelState {
  isSettingsOpen: boolean;
  isDataTableOpen: boolean;
  isDataPanelOpen: boolean;
  isFindingsPanelOpen: boolean;
  isPresentationMode: boolean;
  isWhatIfPageOpen: boolean;
  // + highlight state, reset confirm, etc.
}
```

Desktop/mobile behavior splits at 1024px. Compound actions handle cross-panel coordination (e.g., `OPEN_DATA_TABLE_AT_ROW_DESKTOP` opens the data panel and highlights a row atomically).

**Source**: `apps/pwa/src/hooks/useAppPanels.ts`

### Azure: `usePanelsStore()`

Manages a richer panel set including CoScout, reports, and presentation mode:

```typescript
interface EditorPanelState {
  isDataPanelOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isPresentationMode: boolean;
  isReportOpen: boolean;
  // + highlight state
}
```

Findings and What-If state are persisted to `ViewState` via a side-effect, surviving project reload. `BoolSetter`-compatible wrappers support both `setState(true)` and `setState(prev => !prev)` patterns.

**Source**: `apps/azure/src/features/panels/panelsStore.ts`

### Deep links (Azure)

Azure supports deep links via URL search params, parsed in `deepLinks.ts`. When a project URL includes `?finding=abc`, the app opens the findings panel and scrolls to that finding on load.

### Popout windows

Findings can be opened in a separate window via `?view=findings`. The popout receives the same DataContext and renders `FindingsWindow` standalone.

**Multi-window sync** (BroadcastChannel) is designed but not yet implemented — changes in the popout do not currently propagate back to the main window in real time.

---

## 4. Filter Navigation

Filter chips show active filters with contribution % to total variation:

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ Shift: Night ▼ 67% │  │ Machine: C ▼ 24%   │  │ Operator: Kim ▼ 9% │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

### Implementation

```tsx
import { useFilterNavigation, useVariationTracking } from '@variscout/hooks';

const { filterStack, updateFilterValues, removeFilter } = useFilterNavigation(context);
const { filterChipData } = useVariationTracking(rawData, filterStack, outcome, factors);

{
  filterChipData.map(chip => (
    <FilterChipDropdown
      key={chip.factor}
      factor={chip.factor}
      values={chip.values}
      contributionPct={chip.contributionPct}
      availableValues={chip.availableValues}
      onValuesChange={newValues => updateFilterValues(chip.factor, newValues)}
      onRemove={() => removeFilter(chip.factor)}
    />
  ));
}
```

### Visual Design

| Element         | Style                                    |
| --------------- | ---------------------------------------- |
| Chip            | Rounded pill with factor name and values |
| Percentage      | Contribution % to TOTAL variation        |
| Dropdown arrow  | Click to reveal all values with %        |
| Selected values | Checkmarks in dropdown                   |
| Remove button   | X icon or "Remove Filter" in dropdown    |

### Multi-Select

Chips support selecting multiple values within a factor:

```
┌────────────────────────┐
│ Machine: A, C ▼ 45%    │
└────────────────────────┘
```

### Contribution % vs Local η²

- **Contribution %** (shown in chips): Percentage of TOTAL variation from the original unfiltered data (via Total SS tracking)
- **Local η²**: Percentage of variation at the current filtered level (used internally for ANOVA significance)

Filter chips always show contribution to TOTAL variation, making cumulative impact intuitive.

### Navigation Actions

| Action                | Result                                           |
| --------------------- | ------------------------------------------------ |
| Click chip dropdown   | Show all values with contribution %              |
| Toggle value checkbox | Add/remove value from selection                  |
| Click "Remove Filter" | Remove entire filter for that factor             |
| Click "Clear All"     | Reset to unfiltered view                         |
| Keyboard: `Backspace` | Remove last filter                               |
| Pin as finding        | Create a Finding from the current filter context |

### Key Components

- `useFilterNavigation` — Filter stack management, apply/update/remove/clear
- `useVariationTracking` — Total SS scope tracking, contribution % calculation
- `FilterBreadcrumb` — Sticky filter context bar
- `FilterChipDropdown` — Individual chip with dropdown

---

## 5. Z-Index Strategy

Formalized z-index scale based on actual usage across both apps:

| Layer              | Z-Index   | Usage                                                                                                                            |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Skip-to-content    | `z-[100]` | Accessibility skip link (both apps)                                                                                              |
| Settings overlay   | `z-[60]`  | `SettingsPanelBase` full-screen overlay                                                                                          |
| Mobile fullscreen  | `z-[60]`  | Findings panel (phone), What-If page, CoScout (phone), SyncToast                                                                 |
| Header + popovers  | `z-50`    | App header, toolbar dropdowns, tooltips, `DataTableModalBase`, share popover, `AxisEditor`, mobile menu, `PeoplePicker` dropdown |
| Mobile backdrop    | `z-40`    | `MobileMenu` backdrop overlay                                                                                                    |
| Filter context bar | `z-30`    | Sticky filter breadcrumb (both dashboards)                                                                                       |
| Chart annotations  | `z-20`    | Floating annotation boxes (`ChartAnnotationLayer`)                                                                               |
| Data table headers | `z-10`    | Sticky `<thead>` in `DataTableBase`, `DataPanel`, PWA `AppHeader`                                                                |
| Base content       | `z-0`     | Dashboard, charts, default layout                                                                                                |

### Guidelines

- **Modals and overlays** (`z-[60]`): Full-screen takeovers that block interaction with content below
- **Popovers and dropdowns** (`z-50`): Floating UI that overlays content but doesn't block the full screen
- **Sticky navigation** (`z-30`–`z-40`): Elements that persist during scroll
- **In-content layers** (`z-10`–`z-20`): Elements that layer within the content area
- New components should use this scale — avoid arbitrary z-index values

---

## 6. Accessibility Standards

### Touch Targets

- **Primary actions** (buttons, filter chips, menu items): 48px minimum (WCAG 2.5.8 AAA)
- **Secondary actions** (close buttons, toggle icons): 44px minimum (WCAG 2.5.5 AA)
- Applied to: filter chips, breadcrumbs, chart carousel pills, mobile menu items

### Forced Colors (High Contrast)

For Teams high-contrast mode and Windows High Contrast:

```css
@media (forced-colors: active) {
  .border-edge {
    border-color: ButtonText;
  }
  .text-content {
    color: ButtonText;
  }
  .text-content-secondary {
    color: GrayText;
  }
  button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
  }
}
```

Affects: smooth scrolling in filter navigation, chart carousel transitions, panel slide animations.

### Dialog Pattern

- Prefer native `<dialog>` over `div` + backdrop for modals (e.g., `DataTableModalBase` uses `<dialog>`)
- `MobileCategorySheet` is a target for `<dialog>` migration

### ARIA

- `aria-live="polite"` on filter change announcements
- `aria-label` on all icon-only buttons
- `role="status"` on NarrativeBar loading states

### Keyboard Navigation

| Key         | Action                                                   |
| ----------- | -------------------------------------------------------- |
| `←` / `→`   | Navigate between factors                                 |
| `↑` / `↓`   | Navigate within factor levels                            |
| `Enter`     | Select / drill into                                      |
| `Backspace` | Remove last filter                                       |
| `Escape`    | Close topmost panel (settings → data table → focus mode) |
| `Tab`       | Standard focus traversal                                 |

Escape priority is handled by `useAppPanels` — it dismisses panels in reverse-stacking order.

---

## 7. Mobile Patterns

### Phone (<640px)

- **Hamburger menu**: `MobileMenu` with drawer overlay (`z-40` backdrop, `z-50` menu)
- **Chart carousel**: `MobileChartCarousel` — swipe between 4 chart views (I-Chart, Boxplot, Pareto, Stats)
- **Bottom sheets**: `MobileCategorySheet` for chart category actions (stats, drill-down, highlight, pin-as-finding)
- **Findings panel**: Full-screen overlay (`z-[60]`) instead of inline panel
- **Data panel**: Hidden on phone — accessible via overflow menu → `DataTableModal`
- **Popout**: Not supported on mobile

### Tablet (640–1024px)

- Sidebar collapses, panels stack vertically
- Filter chips wrap to multiple rows
- Chart grid adjusts from 2-column to 1-column

### Touch Interactions

- Tap on boxplot box or Pareto bar → `MobileCategorySheet` bottom action sheet
- Swipe left/right on chart carousel
- Long-press not used (avoids conflict with system gestures)

---

## 8. Portfolio and Dashboard Navigation (Azure)

The Azure app has three navigation layers: **Portfolio** (project selection), **Project Dashboard** (Overview tab), and **analysis Editor** (Analysis tab). The Portfolio is the app entry point. Within a loaded project, the Dashboard and Editor are peer views controlled by `panelsStore.activeView`.

### Portfolio → Project selection

```
App entry
└── Portfolio home screen
    ├── ProjectCard × N  (reads .meta.json sidecars)
    │   ├── Phase indicator
    │   ├── Finding counts by status
    │   ├── Overdue action badge
    │   └── "What's new" indicator dot
    ├── SampleDataPicker  (shown when no projects exist)
    └── [select project] → loadProject()
                               ↓
                         Project Shell (DataContext)
```

| Situation                          | Next screen                    | Mechanism                               |
| ---------------------------------- | ------------------------------ | --------------------------------------- |
| Project has data                   | Project Dashboard (Overview)   | `activeView: 'dashboard'`               |
| New project (no data)              | Editor (FRAME mode)            | `activeView: 'editor'` — skip Dashboard |
| Deep link `?tab=overview`          | Project Dashboard              | `tab` param parsed before shell renders |
| Deep link `?tab=analysis`          | Editor                         | `tab` param parsed before shell renders |
| Deep link `?finding=` or `?chart=` | Editor at target               | Existing deep link bypass               |
| Deep link `?hypothesis=<id>`       | Editor + Investigation sidebar | New; scrolls to hypothesis              |
| Deep link `?workspace=improve`     | Editor + Improvement workspace | New target                              |

For saved Azure projects with data, the project shell contains two peer views: **Project Dashboard** (Overview tab) and **analysis Editor** (Analysis tab). Navigation between them is controlled by `panelsStore.activeView`.

```
Project Shell
├── Overview tab  → activeView: 'dashboard' → ProjectDashboard component
└── Analysis tab  → activeView: 'editor'   → Editor component (full analysis view)
```

### Entry rules

| Situation                          | Landing view     | Mechanism                                                      |
| ---------------------------------- | ---------------- | -------------------------------------------------------------- |
| Open saved project with data       | Dashboard        | `loadProject()` sets `activeView: 'dashboard'`                 |
| New project (no data)              | Editor (FRAME)   | Skip dashboard — no data to summarize                          |
| Deep link (`?finding=`, `?chart=`) | Editor at target | `activeView: 'editor'` set before render                       |
| User clicks "Overview" tab         | Dashboard        | `panelsStore.showDashboard()`                                  |
| User clicks "Analysis" tab         | Editor           | `panelsStore.showEditor()`                                     |
| User clicks any dashboard item     | Editor (focused) | Dashboard item calls `panelsStore.showEditor()` + panel action |

### Dashboard quick actions → Editor

Each clickable item on the dashboard navigates to the Editor with a pre-configured view:

| Dashboard item           | Editor destination                                                        |
| ------------------------ | ------------------------------------------------------------------------- |
| "Go to analysis" button  | Current `ViewState` (last focused chart, active filters)                  |
| Findings count by status | Findings panel open, `findingsStore.statusFilter` set                     |
| Hypothesis tree row      | Investigation sidebar open, `investigationStore.expandedHypothesisId` set |
| Action progress bar      | Improvement workspace open                                                |
| "Add new data batch"     | Editor in data append flow (`useEditorDataFlow`)                          |
| "View report"            | Report view open                                                          |

### CoScout navigate_to tool

CoScout's `navigate_to` tool (ADR-042) extends dashboard navigation into conversation:

- `navigate_to({target: 'dashboard'})` — Switches to the Project Dashboard from anywhere
- `navigate_to({target: 'finding', target_id: '...'})` — Auto-executes: opens findings panel, switches to Editor
- `navigate_to({target: 'finding', target_id: '...', restore_filters: true})` — Shows proposal card (filter mutation requires confirmation)

### "← Portfolio" back link

The project shell header always shows a "← Portfolio" back link that returns the user to the Portfolio home screen. This unloads the current project (clears DataContext) and renders the portfolio grid. The back link is visible from both the Dashboard and the Editor.

On Teams channel tab, the "← Portfolio" link is hidden (Teams users always operate within a shared channel project — there is no personal portfolio in the channel tab context).

### Deep link bypass

Deep links always bypass the Dashboard and land directly in the Editor at the target. The `tab=` parameter is the only way to intentionally target the Dashboard via a link:

| Link type                          | Landing                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `?tab=overview`                    | Dashboard (Overview tab)                              |
| `?tab=analysis`                    | Editor (Analysis tab)                                 |
| `?finding=<id>`                    | Editor + findings panel + finding highlighted         |
| `?chart=<type>`                    | Editor + focused chart                                |
| `?hypothesis=<id>`                 | Editor + Investigation sidebar scrolled to hypothesis |
| `?workspace=improve`               | Editor + Improvement workspace                        |
| Teams Adaptive Card "View Finding" | Editor + finding highlighted                          |
| Teams channel tab initial load     | Editor (teams users start in analysis)                |

After a deep link lands in the Editor, the user can always navigate to the Dashboard via the "Overview" tab in the project shell.

### Persistence

`activeView` is included in `ViewState` and restored on project reopen. If a user was on the dashboard when they last saved, they return to the dashboard.

---

## 9. Analysis Modes

The dashboard supports three mutually exclusive analysis modes, each with its own 4-slot chart layout:

| Mode                   | Trigger                                        | Slot 1                      | Slot 2               | Slot 3           | Slot 4           |
| ---------------------- | ---------------------------------------------- | --------------------------- | -------------------- | ---------------- | ---------------- |
| **Standard** (default) | Any non-special data                           | I-Chart                     | Boxplot              | Pareto           | Stats Panel      |
| **Performance**        | Wide-format data with multiple measure columns | Cpk Scatter                 | Boxplot              | Cpk Pareto       | Stats Panel      |
| **Yamazumi**           | Data with activity type column (VA/NVA/Waste)  | I-Chart (switchable metric) | Yamazumi stacked bar | Pareto (5 modes) | Yamazumi Summary |

Mode is set via `analysisMode` in DataContext (`'standard' | 'performance' | 'yamazumi'`). Detection happens automatically during data ingestion — `detectWideFormat()` for Performance, `detectYamazumiFormat()` for Yamazumi — and presents a confirmation modal before switching.

---

## 10. Future: Unified Navigation Hook

The `feature/navigation-architecture` branch (preserved as reference) prototypes a `useNavigation` hook that would unify view management:

### Concept

```typescript
interface UseNavigationReturn<V extends string> {
  navigate(view: V, params?: Record<string, string>): void;
  replace(view: V, params?: Record<string, string>): void;
  goBack(): void;
  canGoBack: boolean;
  currentView: V;
  currentParams: Record<string, string>;
}
```

### Key Ideas

- **History stack** with `pushState`/`popstate` for browser back button support
- **URL serialization**: `/?view=editor&chart=boxplot&filter_Shift=Night`
- **Navigation guards**: `beforeNavigate` callback for unsaved changes warnings
- **Filter integration**: `useFilterNavigation` delegates history to `useNavigation` via `externalHistory` mode
- **Phase detection**: `detectAnalysisPhase(signals)` returns `frame | scout | investigate | improve`

### Status

This is **designed but not implemented** on main. The branch code is 38+ commits behind main and was committed as a reference rather than cherry-picked. The concepts inform the three-workspace model and will be implemented when workspace routing is needed.

---

## 11. See Also

- [Journey Phase → Screen Mapping](../../05-technical/architecture/journey-phase-screen-mapping.md) — phase-to-component-to-tier mapping
- [Mental Model Hierarchy](../../05-technical/architecture/mental-model-hierarchy.md) — conceptual navigation layers
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — INVESTIGATE phase workflow
- [IMPROVE Phase UX Design](../../superpowers/specs/2026-03-19-improve-phase-ux-design.md) — three-workspace model detail
- [Project Dashboard](../../03-features/workflows/project-dashboard.md) — Dashboard feature (What's New, OtherProjectsList, Portfolio integration)
- [Project Reopen Flow](../../02-journeys/flows/project-reopen.md) — Full flow: Portfolio → Dashboard → Analysis
- [ADR-042: Project Dashboard](../../07-decisions/adr-042-project-dashboard.md) — Dashboard ↔ Editor design decisions
- [ADR-043: Teams Entry Experience](../../07-decisions/adr-043-teams-entry-experience.md) — Portfolio, ProjectCard, deep links design decisions
- [Accessibility Foundations](../foundations/accessibility.md) — full accessibility guidelines
- [Filter Chips](../../03-features/navigation/breadcrumbs.md) — detailed filter chip design
- [Drill-Down](../../03-features/navigation/drill-down.md) — drill-down methodology and decision thresholds
