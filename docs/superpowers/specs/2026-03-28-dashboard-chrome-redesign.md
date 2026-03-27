---
title: Dashboard Chrome Redesign
date: 2026-03-28
status: draft
audience: [developer, designer]
category: design-spec
related: [header, toolbar, stats-panel, navigation, panels, layout]
---

# Dashboard Chrome Redesign

Holistic redesign of the header, toolbar, stats panel, and panel architecture across PWA and Azure apps.

## Problem

The dashboard header/toolbar area has accumulated controls organically across feature additions:

1. **3 visual layers** of scattered controls (header bar, copy/download row, toolbar row) waste vertical space
2. **Stats panel** (320px sidebar) works well in grid mode but is disconnected at the bottom in scroll mode
3. **No left panel** — right side has Findings + CoScout panels, left has nothing. Asymmetric layout.
4. **AI mode elements** (NarrativeBar, problem statement, CoScout) are bolted on rather than integrated
5. **What-If simulator** floats as standalone page, disconnected from the findings/improvement workflow
6. **Performance/Yamazumi modes** change chart slots but header doesn't adapt
7. **Controls scattered**: layout toggle in toolbar, presentation in header, export in header, Factors in toolbar — related actions are split across layers

## Current State

### Vertical space budget (everything above charts)

| Layer                             | Height     | Condition                  |
| --------------------------------- | ---------- | -------------------------- |
| AppHeader                         | 56px       | Always                     |
| Copy/Download buttons             | ~28px      | When no focused chart      |
| FilterBreadcrumb                  | ~44px      | When filters active        |
| VariationBar                      | ~24px      | When variation data exists |
| Toolbar (layout toggle + Factors) | ~36px      | When factors exist         |
| SelectionPanel                    | ~36px      | When points brushed        |
| **Total possible**                | **~224px** | Before charts start        |

### Panel architecture

| Panel                | Side                     | App   | Toggle                |
| -------------------- | ------------------------ | ----- | --------------------- |
| FindingsPanel        | Right (inline)           | Both  | Header button         |
| CoScoutPanel         | Right (sidebar)          | Azure | Header button         |
| DataPanel            | Right (inline)           | Both  | Header button         |
| Stats panel          | Bottom-right (grid slot) | Both  | Not toggle-able       |
| ImprovementWorkspace | Full page                | Azure | Via findings workflow |

### Header controls inventory

**PWA AppHeader**: Logo, DataTable, Findings, What-If, Presentation, Share/Export, Settings
**Azure EditorToolbar**: Back, Project name, Save, Add Data, Findings, Data, Share, Presentation, Report, Settings
**Dashboard toolbar**: Layout toggle (Grid/Scroll), Factors button, copy/download icons

## Decisions Made

### 1. Stats panel becomes a toggle-able left sidebar

Mirrors the Findings panel on the right. Creates a symmetric 3-panel layout:

```
┌──────┬──────────────────────┬──────────┐
│Stats │   Charts (center)    │Findings/ │
│Panel │                      │ CoScout  │
│(left)│  I-Chart             │  (right) │
│      │  Boxplot             │          │
│ Cpk  │  Pareto              │          │
│ Cp   │                      │          │
│ Pass │                      │          │
│ n=30 │                      │          │
└──────┴──────────────────────┴──────────┘
```

- **Default**: Hidden (charts get full width)
- **Toggle**: Stats icon in header opens the left sidebar
- **Grid mode**: Left sidebar, charts resize to remaining width
- **Scroll mode**: Left sidebar stays while scrolling through charts
- **Content**: Same as current StatsPanelBase (Summary/Histogram/Probability Plot tabs)
- **Width**: ~280-320px (consistent with Findings panel)

### 2. Header becomes minimal navigation bar

```
┌────────────────────────────────────────────────────┐
│ V VariScout · Coffee Moisture (30)                 │
│                        [Stats][Findings][AI][⚙]    │
└────────────────────────────────────────────────────┘
```

- 56px, single line, navigation/panel-toggle only
- Left: Logo + case name + row count
- Right: Panel toggle icons + Settings
- All content-specific controls (layout, filters, export, Factors) move to dashboard toolbar

### 3. One comprehensive spec, implemented in phases

Design holistically so decisions are coherent. Implement as independent commits:

- Phase 1: Header simplification + stats panel as left sidebar
- Phase 2: Toolbar consolidation
- Phase 3: Scroll-mode stats integration
- Phase 4: AI mode integration

### 4. Layout toggle (Grid/Scroll) stays in dashboard toolbar

Not in the header — it's a dashboard-specific control.

## Open Questions

### Q1: Where do What-If, Presentation, Export go?

**Context**: Currently in the header. Header is being simplified to panel toggles only.

**Options discussed**:

- a) What-If → linked to findings/improvement workflow (Azure: already part of Improvement workspace ideas → What-If round-trip)
- b) Export → into stats panel actions section or toolbar
- c) Presentation → into Settings or toolbar
- d) All into an overflow/actions menu in the toolbar

**Consideration**: In Azure, What-If is connected to the IMPROVE phase — ideas get What-If projections attached. In PWA, it's standalone. Should PWA adopt the same findings-linked approach?

### Q2: How does the header adapt across journey phases?

**Context**: The four phases (FRAME → SCOUT → INVESTIGATE → IMPROVE) have different panel configurations.

| Phase       | Relevant panels              | Header should show                   |
| ----------- | ---------------------------- | ------------------------------------ |
| FRAME       | (none — column mapping)      | Minimal                              |
| SCOUT       | Stats, (Findings)            | Stats + Findings toggles             |
| INVESTIGATE | Stats, Findings, CoScout     | All panel toggles                    |
| IMPROVE     | Stats, Findings, Improvement | Improvement toggle replaces CoScout? |

**Question**: Should panel toggles appear/disappear based on phase, or always be visible (greyed out when not applicable)?

### Q3: Scroll mode stats integration

**Context**: In scroll mode, the left stats sidebar stays while charts scroll. But the current stats content (Summary/Histogram/Probability Plot) may be too much for a persistent sidebar.

**Options**:

- a) Full stats panel stays as sidebar (consistent with grid mode)
- b) Compact sticky bar with key metrics only (Cpk, Pass Rate, n=), expand to full on click
- c) Stats interspersed between chart cards in the scroll flow

### Q4: Performance/Yamazumi mode header adaptation

**Context**: These modes change chart slots but the header currently doesn't reflect which mode is active. Azure has tabs (Analysis/Performance/Yamazumi) in the dashboard toolbar.

**Question**: Should the mode be visible in the header? As a tab bar? As a badge on the logo area? Or just in the toolbar (current Azure approach)?

### Q5: NarrativeBar integration

**Context**: Currently a bottom-sticky bar (~40px) showing AI-generated summary. Only in Azure with AI active.

**Options**:

- a) Keep as bottom bar (current — works fine, doesn't conflict with header redesign)
- b) Move into CoScout panel header
- c) Show in the header bar as a subtitle under case name

### Q6: Azure vs PWA divergence

**Context**: Azure has project save, Teams, tabs, CoScout, Improvement, Report. PWA is simpler (no AI, no project save, limited findings statuses).

**Question**: Should the header architecture be identical (shared component) with Azure features hidden in PWA? Or separate header components per app? Current: separate AppHeader (PWA) vs EditorToolbar (Azure).

### Q7: Mobile panel behavior

**Context**: On phone (<640px), panels go full-screen (Findings) or are hidden (Data). How do the new left stats panel and the simplified header work on mobile?

**Options**:

- a) Left stats panel → bottom sheet on mobile (like MobileCategorySheet)
- b) Stats accessible via mobile tab bar (add a Stats tab)
- c) Stats visible in a compact bar between header and chart carousel

## Reference

### Current navigation model

```
PWA:  HomeScreen → Dashboard (+ Findings panel, What-If page, Presentation)
Azure: Portfolio → Project Dashboard → Editor (+ Findings, CoScout, Improvement, Report, What-If)
```

### Three-workspace model (Azure)

1. **Analysis Workspace**: Dashboard charts, drill-down, filter navigation
2. **Findings Workspace**: Board view (5 columns), hypothesis tree, investigation sidebar
3. **Improvement Workspace**: Synthesis, idea groups, actions, staged verification

### Journey phases

```
FRAME → SCOUT → INVESTIGATE → IMPROVE
(data)   (charts)  (findings)    (actions)
```

### Panel mutual exclusions (Azure)

- Improvement → closes: WhatIf, Report, Presentation
- Report → closes: Presentation, Improvement, Findings, CoScout, DataPanel
- Presentation → closes: Report, Improvement, Findings, CoScout

## Next Steps

1. Continue brainstorming to resolve Q1–Q7 in next session
2. Create visual mockups for the 3-panel layout
3. Finalize spec
4. Create implementation plan (phased)
