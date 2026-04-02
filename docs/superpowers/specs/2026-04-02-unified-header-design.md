---
title: Unified Header — App + Project Merge
date: 2026-04-02
status: draft
audience: [developer, designer]
category: design-spec
related: [header, navigation, auto-save, settings, responsive, workspace-tabs]
supersedes: 2026-04-01-header-redesign-design.md (extends Phase 2)
---

# Unified Header — App + Project Merge

Merge the App header (56px) and ProjectHeader (44px) into a single adaptive 44px bar. Eliminate the Save button in favor of auto-save with file-name-based auto-naming. Move user/logout/admin into the Settings panel.

## Problem

The Azure app currently renders two stacked headers totaling 100px:

1. **App header** (`App.tsx`, 56px, sticky): VariScout logo + breadcrumb + user name + admin + settings + logout
2. **ProjectHeader** (44px, not sticky): back arrow + project name + workspace tabs + PI/AI toggles + Add Data + Save

This wastes 56px of vertical space, duplicates the project name ("/ New Analysis" breadcrumb + project name), and splits user actions across two bars. The App header provides no value when inside a project — you know you're in VariScout, you know who you are.

## Design

### One Adaptive Header (44px)

The header has two modes based on whether a project is loaded:

**Portfolio / Admin (no project):**

```
┌────────────────────────────────────────────────────┐
│ [V] VariScout                                  [⚙] │
└────────────────────────────────────────────────────┘
```

**Inside a project (with data):**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [V] │ Project Name (n) ● │ Overview · Analysis ▾ · Investigation · Improvement · Report │ PI · AI · [+action] · ⚙ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Header Zones (project mode)

| Zone        | Content                                                                        | Changes per workspace?    |
| ----------- | ------------------------------------------------------------------------------ | ------------------------- |
| **Brand**   | Logo mark [V] — click navigates to Portfolio                                   | Never                     |
| **Project** | Project name (clickable for menu) + row count + save status dot                | Never (dot color changes) |
| **Center**  | 5 workspace tabs: Overview · Analysis ▾ · Investigation · Improvement · Report | Active tab highlight only |
| **Right**   | PI toggle + AI toggle + one optional primary action + Settings gear            | Primary action slot only  |

### Logo Mark

- Always present as a 26×28px blue rounded square with "V" icon
- **In project context:** clicking navigates to Portfolio (replaces the back arrow)
- **In portfolio/admin:** just the brand anchor, not clickable (or navigates to portfolio root)
- **"VariScout" text** appears only in portfolio mode. Inside a project, the logo mark alone is sufficient — the text doesn't tell you anything you don't know

### Right Zone: Fixed + One Primary Action

PI Panel (📊) and AI/CoScout (💬) toggles never move. One optional primary action appears in the same slot position. Settings gear is always last.

| Workspace     | Primary action                                        |
| ------------- | ----------------------------------------------------- |
| Overview      | —                                                     |
| Analysis      | `+ Add Data` (green)                                  |
| Investigation | —                                                     |
| Improvement   | `→ Actions` (purple, visible when ideas are selected) |
| Report        | —                                                     |

### Save → Auto-Save

No Save button in any context. Persistence is fully automatic.

**Auto-save behavior:**

- `useAutoSave` hook (already implemented, debounced 2s) handles all persistence
- Status communicated via dot next to project name

**Status dot:**

| State           | Dot            | Desktop text (tooltip)             |
| --------------- | -------------- | ---------------------------------- |
| Saved           | ● green        | "Saved"                            |
| Saving          | ● blue (pulse) | "Saving…"                          |
| Unsaved changes | ● amber        | "Unsaved"                          |
| Error           | ● red          | "Save failed — click to retry"     |
| Syncing (Team)  | ☁ blue         | "Syncing to OneDrive…"             |
| Conflict (Team) | ☁ amber        | "Sync conflict — click to resolve" |

**Project name dropdown** (click project name):

- Rename project
- Save As… (Team plan only)
- Export CSV
- Share (Team plan only)

### Auto-Naming on First Save

When data first enters the project, a project is auto-created with an intelligent name. No "name your project" prompt needed.

| Entry method              | Auto-generated name                  | Example                                             |
| ------------------------- | ------------------------------------ | --------------------------------------------------- |
| File upload (.csv, .xlsx) | File name without extension, cleaned | "Coffee_Moisture_Data.csv" → "Coffee Moisture Data" |
| Paste from clipboard      | "Analysis {date}"                    | "Analysis Apr 2"                                    |
| Sample dataset            | Sample display name                  | "Coffee Batch Variation"                            |
| Manual entry              | "Analysis {date}"                    | "Analysis Apr 2"                                    |

**Name cleanup rules:** strip file extension, replace underscores and hyphens with spaces, trim whitespace, collapse multiple spaces.

The user can rename anytime by clicking the project name in the header. The auto-name is a sensible default, not a commitment.

**No empty projects:** if the user navigates away before entering data, nothing is saved.

### Settings Panel Absorbs App Chrome

The existing `SettingsPanel` gains a new **Account** section at the top:

```
┌─ Account ──────────────────────────┐
│ Jukka-Matti Turtiainen             │
│ jukka-matti@example.com            │
│                                    │
│ [Admin Hub]          (if admin)    │
│ [Sign Out]                         │
└────────────────────────────────────┘
┌─ Appearance ───────────────────────┐
│ Theme toggle (existing)            │
│ Density (existing)                 │
└────────────────────────────────────┘
┌─ Display (existing) ───────────────┐
...
```

The Settings gear (⚙) in the header right zone opens this panel — same as today, just with the Account section added.

### Responsive Scaling

| Breakpoint     | Brand | Project             | Tabs                     | Right zone                 |
| -------------- | ----- | ------------------- | ------------------------ | -------------------------- |
| ≥1280px        | [V]   | Full name + (n) + ● | Full labels              | PI · AI · + Add Data · ⚙   |
| 1024–1279px    | [V]   | Full name + (n) + ● | Full labels              | PI · AI · + Add · ⚙        |
| 768–1023px     | [V]   | Truncated name + ●  | Full labels (scrollable) | [icons only] · ⚙           |
| <768px (phone) | [V]   | Full name + ●       | Bottom tab bar           | PI · AI (action in "More") |

**Abbreviation rules (768–1023px):**

- Tabs use `overflow-x: auto` with horizontal scroll instead of abbreviation — abbreviated tab names are awkward and hard to scan. Full labels, scrollable container, no truncation.
- Project name truncates to ~80px with ellipsis
- Row count hidden
- Action buttons become icon-only (no labels)

**Phone (<768px):**

- Header: [V] + project name + ● + PI toggle + AI toggle
- Workspace tabs move to bottom tab bar: Analysis | Investigate | Improve | Report | More
- "More" menu: Overview, + Add Data, Settings
- No primary action in header (lives in "More")

### What Gets Deleted

| Element                           | Was in                     | Fate                                  |
| --------------------------------- | -------------------------- | ------------------------------------- |
| App header (`App.tsx` `<header>`) | Always visible, 56px       | **Deleted** — unified header replaces |
| User name text                    | App header right zone      | → Settings panel Account section      |
| Logout button                     | App header right zone      | → Settings panel Account section      |
| Admin button                      | App header right zone      | → Settings panel Account section      |
| Settings button                   | App header right zone      | → Unified header right zone (⚙)       |
| "/ New Analysis" breadcrumb       | App header left zone       | **Deleted** — redundant               |
| Save button                       | ProjectHeader right zone   | **Deleted** — auto-save replaces      |
| Save As button                    | ProjectHeader (if present) | → Project name dropdown               |
| Back arrow (←)                    | ProjectHeader left zone    | **Replaced** by logo mark [V]         |

### Height Calculation

Editor container changes from `h-[calc(100vh-56px)]` (subtracting app header) to `h-[calc(100vh-44px)]` (unified header only).

**Net vertical space gained: 56px** (from 100px total → 44px).

The unified header should be `sticky top-0 z-50` to prevent content scrolling behind it.

## Component Changes

### New: `AppHeader` (replaces both headers)

Single component that adapts based on context:

```typescript
interface AppHeaderProps {
  // Portfolio mode (no project)
  mode: 'portfolio' | 'project';

  // Project mode props (optional, only when mode === 'project')
  projectName?: string;
  rowCount?: number;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  syncStatus?: { status: string; message?: string };
  activeView?: WorkspaceView;
  hasData?: boolean;

  // Panel toggles
  isPISidebarOpen?: boolean;
  onTogglePISidebar?: () => void;
  isCoScoutOpen?: boolean;
  onToggleCoScout?: () => void;

  // Workspace-specific actions
  onAddData?: () => void; // Analysis
  onConvertToActions?: () => void; // Improvement
  hasSelectedIdeas?: boolean;

  // Navigation
  onNavigateToPortfolio?: () => void;
  onOpenSettings?: () => void;

  // Project name menu
  onRenameProject?: () => void;
  onExportCSV?: () => void;
}
```

### Modified: `SettingsPanel`

Add Account section with user info, admin link, sign out. Props:

```typescript
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // New
  userName?: string;
  userEmail?: string;
  isAdmin?: boolean;
  onAdminHub?: () => void;
  onSignOut?: () => void;
}
```

### Modified: `App.tsx`

- Remove the `<header>` block entirely
- Render `<AppHeader mode="portfolio" />` when `currentView !== 'editor'`
- Pass `onOpenSettings` to AppHeader
- Move settings panel state management to remain in App.tsx

### Modified: `Editor.tsx` / `pages/Editor.tsx`

- Remove `<ProjectHeader>` import and rendering
- Render `<AppHeader mode="project" ... />` at the top
- Update height calc: `h-[calc(100vh-44px)]`
- Wire auto-naming into data ingestion flow

### Modified: `useAutoSave` / data ingestion

- Auto-create project on first data entry
- Generate name from file name or date fallback
- No prompt, no save button

## App Differences (PWA vs Azure)

| Feature                | PWA                                      | Azure                                      |
| ---------------------- | ---------------------------------------- | ------------------------------------------ |
| Header mode            | Always 'project' (no portfolio)          | Switches between 'portfolio' and 'project' |
| Workspace tabs         | Analysis only (session-only)             | All 5 tabs                                 |
| Logo mark click        | No-op (no portfolio)                     | Navigate to Portfolio                      |
| "VariScout" text       | Always shown (no project context switch) | Only in portfolio mode                     |
| AI toggle              | Hidden                                   | Shown                                      |
| Settings panel Account | Minimal (no auth)                        | Full (user, admin, sign out)               |
| Auto-save              | Session-only (no persistence)            | IndexedDB + Blob Storage                   |
| Auto-naming            | N/A (no project persistence)             | Active                                     |

## Resolved Design Questions

| #   | Question                             | Decision                                                            |
| --- | ------------------------------------ | ------------------------------------------------------------------- |
| Q1  | Same or separate app/project header? | **Same** — one adaptive bar                                         |
| Q2  | "VariScout" text in project mode?    | **No** — logo mark only, text in portfolio mode only                |
| Q3  | User/settings/logout in header?      | **No** — all move to Settings panel Account section                 |
| Q4  | Save button?                         | **No** — auto-save with status dot, auto-naming on first data entry |
| Q5  | Auto-naming strategy?                | **File name** for uploads, date-based fallback for paste/manual     |
| Q6  | Back arrow or logo mark?             | **Logo mark** doubles as home button                                |
| Q7  | Brand text responsive behavior?      | Logo mark always, "VariScout" text never in project mode            |

## Migration Notes

- The existing `ProjectHeader` component can be evolved into `AppHeader` rather than rewritten from scratch — it already has the workspace tabs, PI/AI toggles, and primary action slot
- The App.tsx `<header>` block is deleted entirely
- `isSettingsOpen` state stays in App.tsx, passed down via `onOpenSettings`
- Phone layout in ProjectHeader already has the compact form — extend with logo mark

## Related

- [Header Redesign spec](2026-04-01-header-redesign-design.md) — predecessor spec (this extends Phase 2)
- [ADR-055: Workspace-Based Navigation](../../07-decisions/adr-055-workspace-navigation.md)
- [Navigation Patterns](../../06-design-system/patterns/navigation.md)
- [Settings Panel](../../apps/azure/src/components/settings/SettingsPanel.tsx)
