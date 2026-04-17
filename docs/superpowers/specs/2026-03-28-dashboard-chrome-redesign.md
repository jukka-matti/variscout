---
title: Dashboard Chrome Redesign
date: 2026-03-28
status: delivered
audience: [developer, designer]
category: design-spec
related: [header, toolbar, stats-panel, navigation, panels, layout, workspaces]
---

# Dashboard Chrome Redesign

Holistic redesign of header, toolbar, stats panel, and panel architecture. Introduces workspace-based navigation with cross-cutting panel sidebars.

## Problem

The header/toolbar area accumulated controls organically across features, creating 3 visual layers of scattered controls, wasting vertical space, and disconnecting related actions. The stats panel works well in grid mode but is disconnected in scroll mode. AI touch points (NarrativeBar, CoScout, ChartInsightChips) are bolted on rather than integrated. What-If is disconnected from the findings/improvement workflow.

## Design: Workspace-Based Navigation

### Navigation Model

The header provides two types of controls:

1. **Workspace tabs** — Switch the center content area (Analysis | Investigation | Improvement)
2. **Panel toggles** — Open/close cross-cutting sidebars (Stats/Data left, CoScout right)

```
Header (56px):
┌──────────────────────────────────────────────────────────────┐
│ V VariScout · Coffee Moisture (30)                           │
│   [Analysis v] [Investigation] [Improvement]  [Stats][AI][Settings] │
└──────────────────────────────────────────────────────────────┘
```

- **Left**: Logo + case name + row count
- **Center**: 3 workspace tabs (always visible, active highlighted)
- **Right**: Stats/Data toggle (left sidebar) + AI toggle (right sidebar) + Settings
- Analysis tab has dropdown for sub-modes (Standard / Performance / Yamazumi)

### Workspace Layouts

**Analysis workspace (SCOUT/FRAME phase):**

```
┌──────┬──────────────────────────────┬────────┐
│Stats │ Filter chips + Variation bar │CoScout │
│/Data │ [Grid|Scroll] [Factors]      │(right, │
│(left,│                              │ opt.)  │
│ opt.)│ I-Chart                      │        │
│      │ Boxplot    Pareto            │        │
│ Tabs:│              + Stats slot    │        │
│ Summ │ [Export v] [Present]         │        │
│ Data │                              │        │
│ Hist │ ─── NarrativeBar (bottom) ── │        │
│ Prob └──────────────────────────────┘        │
└──────┘                              └────────┘
```

**Investigation workspace (INVESTIGATE phase):**

```
┌──────┬──────────────────────────────┬────────┐
│Stats │ Findings Board               │CoScout │
│/Data │ [Observed][Investigating]     │(right) │
│(left)│ [Analyzed]                    │        │
│      │                              │ Phase: │
│      │ Hypothesis tree              │ Conv.  │
│      │ Synthesis card               │        │
│      │ Investigation sidebar        │ Ask... │
│      │                              │        │
│      │ ─── NarrativeBar (bottom) ── │        │
└──────┴──────────────────────────────┴────────┘
```

**Improvement workspace (IMPROVE phase):**

```
┌──────┬──────────────────────────────┬────────┐
│Stats │ Synthesis card (editable)    │CoScout │
│/Data │ Four Directions hint         │(right) │
│(left)│                              │        │
│      │ Idea groups (by hypothesis)  │ Idea   │
│      │  - text, direction, time     │ advice │
│      │  - cost, risk, What-If       │        │
│      │                              │        │
│      │ ────────────────────────     │        │
│      │ [Convert selected → Actions] │        │
└──────┴──────────────────────────────┴────────┘
```

### Cross-Cutting Panels

| Panel            | Side   | Toggle                      | Content                                                                                                                                                                                               | Adapts to workspace?                                            |
| ---------------- | ------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Stats/Data**   | Left   | Header icon                 | 3 tabs: Summary (stats + target discovery), Data, What-If. Histogram/ProbPlot handled by VerificationCard in grid. See [Process Intelligence Panel](2026-03-28-process-intelligence-panel-design.md). | No — same content in all workspaces                             |
| **CoScout**      | Right  | Header icon                 | AI conversation, adapts coaching by phase                                                                                                                                                             | Yes — reasoning effort + system prompt change per workspace     |
| **NarrativeBar** | Bottom | Always visible (when AI on) | 1-line AI summary, adapts content by phase                                                                                                                                                            | Yes — pattern discovery / investigation progress / verification |

### Analysis Sub-Modes

Analysis workspace tab has a dropdown for mode switching:

```
[Analysis v]
├─ Standard (default)
├─ Performance (if wide-format detected)
└─ Yamazumi (if activity-type detected)
```

Each mode changes chart slot mapping but uses the same dashboard grid/scroll layout.

### Analysis Workspace Toolbar

Controls specific to the Analysis workspace (not in header):

```
[Grid|Scroll] [Factors(1)] ··· [Export v] [Present]
```

- Layout toggle (Grid/Scroll) — desktop only
- Factors button
- Export dropdown (CSV, PNG, Copy)
- Presentation mode button
- Filter chips + VariationBar above charts

### What-If Integration

What-If is no longer a standalone page. It's accessible from:

1. **Improvement workspace** — "What-If" button on each idea (round-trip: idea → simulator → projection saved to idea)
2. **Analysis workspace toolbar** — standalone access for quick projections
3. **PWA** — standalone access (no improvement workspace in PWA)

## Resolved Design Questions

| #   | Question                                | Decision                                                                                                    |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Q1  | Where do What-If, Presentation, Export? | What-If in Improvement + Analysis toolbar. Export/Presentation in Analysis toolbar.                         |
| Q2  | Phase-adaptive header?                  | No — workspace tabs are always visible. Phase adapts AI coaching invisibly.                                 |
| Q3  | Scroll mode stats?                      | Left sidebar works in both grid and scroll mode (stays while scrolling).                                    |
| Q4  | Performance/Yamazumi in header?         | Sub-tabs under Analysis workspace dropdown.                                                                 |
| Q5  | NarrativeBar?                           | Stays as bottom bar. Adapts content per workspace/phase.                                                    |
| Q6  | Azure vs PWA divergence?                | Shared header component. PWA shows only Analysis tab + Stats. Azure shows all 3 workspace tabs + AI toggle. |
| Q7  | Mobile stats?                           | Stats is 4th swipe in chart carousel (existing). Data table via More menu. No left sidebar on phone.        |

## App Differences

| Feature              | PWA                                     | Azure                                    |
| -------------------- | --------------------------------------- | ---------------------------------------- |
| Workspace tabs       | Analysis only                           | Analysis + Investigation + Improvement   |
| Stats/Data panel     | Left sidebar (Summary + Data + What-If) | Same                                     |
| CoScout panel        | Hidden (no AI)                          | Right sidebar                            |
| AI toggle in header  | Hidden                                  | Visible                                  |
| NarrativeBar         | Hidden (no AI)                          | Bottom bar                               |
| Performance/Yamazumi | No (Azure only)                         | Sub-modes under Analysis                 |
| What-If              | Analysis toolbar (standalone)           | Analysis toolbar + Improvement workspace |

## Mobile Layout

```
Mobile header (simplified):
┌─────────────────────────────────┐
│ [←] Coffee Moisture (30)   [⋮] │
└─────────────────────────────────┘

Chart carousel (Analysis tab):
[◀] I-Chart | Boxplot | Pareto | Stats [▶]
     •         •         •       •

Bottom tab bar:
[Analysis] [Findings] [Improve] [More]
                                  │
                                  ├─ Data Table
                                  ├─ What-If
                                  ├─ Export
                                  ├─ Presentation
                                  └─ Settings
```

- No left/right sidebars on phone (<640px)
- Stats accessible as carousel swipe position
- CoScout opens as full-screen overlay from Findings/Improve tabs
- Bottom tab bar matches workspace model

## Teams Integration

Same navigation structure as desktop browser. Teams adds:

- Native share dialog (replaces copy URL)
- Deep links via `pages.shareDeepLink()`
- Channel name in header (when channel tab)
- Camera capture via Teams SDK
- Theme sync (default/dark/contrast)

No Teams-specific navigation changes needed.

## Popout Windows

Any workspace can be popped out to a separate browser window:

- `?view=findings` — Findings workspace popout
- `?view=improvement` — Improvement workspace popout
- `?view=coscout` — CoScout conversation popout
- Synchronization via `BroadcastChannel` (existing pattern)
- Popout windows show workspace content without header tabs (single-purpose)

## Implementation Phases

### Phase 1: Header + Stats Sidebar

- Shared header component with workspace tabs
- Stats panel → left sidebar with Summary/Data/What-If tabs (Process Intelligence Panel)
- PWA: Analysis tab only + Stats toggle
- Azure: All 3 tabs + Stats + AI toggles

### Phase 2: Analysis Workspace Toolbar

- Consolidate toolbar (layout toggle, Factors, Export, Presentation)
- Move Performance/Yamazumi to Analysis dropdown
- Remove scattered copy/download/presentation from header

### Phase 3: CoScout Right Sidebar

- AI toggle in header opens CoScout as right sidebar
- Phase-adaptive coaching (already implemented in CoScout prompts)
- Works alongside any workspace

### Phase 4: What-If Integration

- What-If accessible from Improvement workspace ideas
- Keep standalone access in Analysis toolbar
- Remove What-If from header

## Related

- [Navigation Patterns](../../06-design-system/patterns/navigation.md)
- [Dashboard Layout Architecture](../../05-technical/architecture/dashboard-layout.md)
- [Panels and Drawers](../../06-design-system/patterns/panels-and-drawers.md)
- IMPROVE Phase UX (archived)
- [AI Journey Integration](../../05-technical/architecture/ai-journey-integration.md)
- [ADR-055: Workspace-Based Navigation](../../07-decisions/adr-055-workspace-navigation.md) — Decision record for workspace tabs implementation
