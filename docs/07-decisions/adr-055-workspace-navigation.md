---
title: 'ADR-055: Workspace-Based Navigation'
audience: [developer, architect]
category: architecture
status: stable
related: [navigation, workspaces, investigation, panels, question-driven-eda]
---

# ADR-055: Workspace-Based Navigation

**Status:** Accepted
**Date:** 2026-04-01
**Decision Makers:** Development team
**Tags:** navigation, workspaces, panels, investigation, improvement, question-driven-eda

## Context

The Azure app has a 2-tab toggle (Overview | Analysis) with `activeView: 'dashboard' | 'editor'` in the panels store. Investigation lives inside a 320-600px Findings sidebar, and Improvement is a full-screen takeover (`isImprovementOpen`). This creates three problems:

1. **Investigation UI outgrew the sidebar.** The question-driven EDA flow (ADR-053) includes issue statement, question checklist with coverage progress, hypothesis tree, findings board, investigation conclusion with suspected causes, and problem statement output. At 320-600px, this is squeezed — the FindingsWindow popout (`?view=findings`) already proves it works better at full width.

2. **Improvement workspace lacks app-level wiring.** `ImprovementWorkspaceBase`, `SynthesisCard`, `IdeaGroupCard`, and `ImprovementSummaryBar` components exist in `@variscout/ui` but are rendered as a full-screen takeover that bypasses the normal layout. There's no tab to navigate to it — only a button that swaps the entire view.

3. **Desktop doesn't match mobile.** The mobile `MobileTabBar` already has 4 tabs (Analysis | Findings | Improve | More) that map to the three-workspace model. Desktop has no equivalent — workspace switching requires knowing which panel buttons to click.

The three-workspace model (Analysis | Investigation | Improvement) is already documented in `navigation.md`, `mental-model-hierarchy.md`, and the dashboard-chrome-redesign spec (2026-03-28), but has not been implemented as navigable workspace tabs.

## Decision

Adopt workspace-based navigation with 5 tabs (Overview | Analysis | Investigation | Improvement | Report) replacing the current 2-tab toggle.

### 1. State model: `activeView` expands to workspace types

Replace `activeView: 'dashboard' | 'editor'` with `activeView: 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report'`:

- `'dashboard'` — Project Dashboard (Overview). Landing page for saved projects, also a workspace tab.
- `'analysis'` — Chart dashboard with stats, filters, drill-down. Replaces `'editor'`.
- `'investigation'` — Full-width investigation workspace with question-driven EDA layout.
- `'improvement'` — Improvement workspace (synthesis, ideas, actions). Replaces `isImprovementOpen` takeover.
- `'report'` — Report workspace. Report is a workspace tab (not a modal overlay). Report/export/PDF actions live within this workspace. Replaces `isReportOpen` and `isPresentationMode`.

Backward compatibility: `'editor'` maps to `'analysis'` on read. `setImprovementOpen(true)` maps to `showImprovement()`.

### 2. AppHeader with workspace tabs

A single 44px `AppHeader` replaces the App header (56px) + EditorToolbar (48px) + WorkspaceTabs (45px). Five workspace tabs render in the center zone:

```
[Overview] [Analysis v] [Investigation (3)] [Improvement (2)] [Report]
```

- Investigation badge shows open question count
- Improvement badge shows selected idea count
- Analysis tab has dropdown for sub-modes (Standard / Performance / Yamazumi)
- Report tab replaces the report modal overlay and presentation mode
- Auto-save (`useAutoSave`) debounces saves on state changes alongside the manual Save button

### 3. Investigation workspace layout

Promotes question-driven EDA (ADR-053) from sidebar to full workspace:

```
+-----------------------+------------------------+--------------+
| Question Panel        | Findings Board         | CoScout      |
| (280-400px, resizable)| (flex-1)               | (right, opt) |
|                       |                        |              |
| Issue Statement       | [List | Board | Tree]  | Phase-aware  |
| Coverage progress     |                        | coaching     |
| Open questions        | FindingsLog / Board    |              |
| Answered (collapsed)  | / HypothesisTree       |              |
| ──────────────────    |                        |              |
| Phase badge           |                        |              |
| Suspected causes      |                        |              |
| Problem statement     |                        |              |
+-----------------------+------------------------+--------------+
```

**Left panel:** Composes `QuestionChecklist` + `InvestigationPhaseBadge` + `InvestigationConclusion` — the same components currently used inside `InvestigationSidebar`, arranged vertically at full height.

**Center area:** `FindingsLog` (same component `FindingsPanelBase` uses) at full width with view mode toggle (list / board / tree).

**Right panel:** `CoScoutPanelBase` — available alongside findings (no mutual exclusion, because findings are center content, not a competing sidebar).

### 4. Question click round-trip

The core interaction loop of question-driven EDA crosses workspaces:

1. **Investigation workspace** → user clicks a question in the left panel
2. Set focused question in investigation store (for auto-linking)
3. **Switch to Analysis workspace** with the relevant factor chart focused
4. User creates finding in Analysis → auto-links to the focused question (ADR-053 mechanism)
5. **Switch back to Investigation** → updated tree shows the answer

This round-trip replaces the current pattern of drilling down within the sidebar. The sidebar was too narrow for this flow; the workspace model gives each step proper space.

### 5. Cross-cutting panel behavior per workspace

| Panel            | Analysis         | Investigation        | Improvement   | Report        |
| ---------------- | ---------------- | -------------------- | ------------- | ------------- |
| PI Panel (left)  | Toggle           | Toggle               | Toggle        | Toggle        |
| Findings (right) | Toggle (sidebar) | N/A (center content) | Hidden        | Hidden        |
| CoScout (right)  | Toggle           | Toggle (alongside)   | Toggle        | Toggle        |
| NarrativeBar     | Visible          | Hidden               | Hidden        | Hidden        |
| What-If          | Modal overlay    | Modal overlay        | Modal overlay | Modal overlay |

### 6. Findings sidebar remains in Analysis

The Findings sidebar (320-600px, right) continues to work in the Analysis workspace for quick investigation without switching workspaces. The Investigation workspace is for focused, structured investigation; the sidebar is for quick observations while exploring charts.

### 7. What-If becomes a modal overlay

What-If moves from a full-screen takeover to a modal overlay accessible from all workspaces. This supports the Improvement workspace round-trip: idea → What-If → projection saved to idea.

### 8. `isImprovementOpen` removed

The `isImprovementOpen` boolean and its full-screen takeover pattern are replaced by `activeView: 'improvement'`. The Improvement workspace renders within the normal layout (with optional CoScout sidebar), not as a takeover that bypasses the toolbar and tabs.

### 9. PWA full journey (updated April 2026)

Per constitution principle 2 ("Same analysis everywhere, the full journey"), PWA has 4 workspace tabs: Analysis, Investigation, Improvement, Report. All session-only (no persistence). No Overview tab (PWA has no project dashboard). PWA uses `activeView` in its panelsStore, aligned with Azure naming.

## Implementation

### State changes (`panelsStore.ts`)

- `activeView` type: `'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report'`
- New actions: `showAnalysis()`, `showInvestigation()`, `showImprovement()`, `showReport()`
- Removed actions: `openReport()`, `closeReport()`, `openPresentation()`, `closePresentation()`, `showEditor()`, `setImprovementOpen()`
- Removed state: `isPresentationMode`, `isReportOpen`
- `showInvestigation()` closes `isFindingsOpen` (workspace IS the findings view)
- `toggleFindings()` is a no-op when `activeView === 'investigation'`
- `initFromViewState()` maps `'editor'` → `'analysis'` and `isImprovementOpen: true` → `activeView: 'improvement'`

### New components

- `AppHeader.tsx` — Single 44px adaptive header with portfolio/project modes. Project mode: logo mark + project name + workspace tabs + PI/AI toggles + primary action + settings gear. Replaces both App header (56px) and EditorToolbar (48px) + WorkspaceTabs (45px). Auto-save replaces explicit Save button.
- `InvestigationWorkspace.tsx` — Three-column layout composing existing UI components
- `useAutoSave` — Debounces saves on state changes

### Reused components (no changes)

`QuestionChecklist`, `InvestigationPhaseBadge`, `InvestigationConclusion`, `FindingsLog`, `FindingBoardView`, `HypothesisTreeView`, `ImprovementWorkspaceBase`, `CoScoutPanelBase`, `MobileTabBar`

## Consequences

### Positive

- Investigation UI gets the space the question-driven EDA flow needs
- Desktop navigation aligns with mobile tab model
- Improvement workspace becomes a proper navigation target (not a hidden takeover)
- CoScout can coexist with findings in the Investigation workspace
- Question click round-trip gives each step (question → chart → finding) proper layout
- Workspace tabs provide orientation — analyst always knows where they are in the journey

### Negative

- `panelsStore` type change requires updating 41+ tests
- `activeView: 'editor'` backward compatibility needs mapping during transition
- Deep link parameters expand (`?workspace=investigation`)

### Neutral

- FindingsWindow popout (`?view=findings`) continues to work independently via localStorage sync
- Mobile `MobileTabBar` tabs map directly to workspaces (no mobile UI changes needed)
- Question-driven EDA data flow unchanged — same hooks and stores, just wider layout

## Related

- [ADR-041: Zustand Feature Stores](adr-041-zustand-feature-stores.md) — panelsStore architecture
- [ADR-042: Project Dashboard](adr-042-project-dashboard.md) — Dashboard as entry point (stays as landing page)
- [ADR-053: Question-Driven Investigation](adr-053-question-driven-investigation.md) — Investigation flow promoted to workspace
- [ADR-054: Mode-Aware Question Strategy](adr-054-mode-aware-question-strategy.md) — Questions adapt per analysis mode
- [Dashboard Chrome Redesign spec](../superpowers/specs/2026-03-28-dashboard-chrome-redesign.md) — Full design
- [Navigation Patterns](../06-design-system/patterns/navigation.md) — Three-workspace model documentation
