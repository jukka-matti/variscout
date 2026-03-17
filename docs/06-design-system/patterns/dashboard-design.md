---
title: Dashboard Design Principles
audience: [analyst, engineer]
category: reference
status: stable
related: [layout, dashboard, presentation-mode]
---

# Dashboard Design Principles

UX principles and layout rules for the VariScout analysis dashboard.

---

## Scrollable Dashboard Layout

The dashboard uses a scrollable layout with minimum chart heights for comfortable analysis:

| Chart   | Minimum Height | Purpose                                 |
| ------- | -------------- | --------------------------------------- |
| I-Chart | 400px          | Primary chart needs good vertical space |
| Boxplot | 280px          | Enough for readable axes                |
| Pareto  | 280px          | Enough for readable axes                |

**Sticky Navigation**: Breadcrumb trail and tab bar remain visible at top while scrolling.

---

## Dashboard Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 All Data > Machine: A  [Clear All]    (sticky header)   │
│  [Analysis]                                                    │
├─────────────────────────────────────────────────────────────┤
│  I-Chart                                    [Outcome ▼]     │
│                                                             │
│  (scrollable content)                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Boxplot      │  Pareto       │  Summary                    │
│  [Factor ▼]   │  [Category ▼] │  [Prob] [Cap]               │
│               │               │                             │
└───────────────┴───────────────┴─────────────────────────────┘
```

---

## Independent Panel Selections

Each panel has its own data selector and operates independently:

| Panel   | Selection                     | Required  |
| ------- | ----------------------------- | --------- |
| I-Chart | Outcome (numeric column)      | Yes       |
| Boxplot | Factor (categorical column)   | No        |
| Pareto  | Category (categorical column) | No        |
| Summary | Uses Outcome                  | Automatic |

---

## Empty State Behavior

When no data is selected for a panel, it displays a dropdown prompt rather than hiding or rearranging the layout. This keeps the interface consistent and learnable.

---

## Header & Workspace Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  📂 Project Name          data.csv (1,247 rows)    [Copy ▼] [⚙]│
├─────────────────────────────────────────────────────────────────┤
│  I-Chart ...                                                    │
```

| Element      | Description                     |
| ------------ | ------------------------------- |
| Project name | Editable, user-defined          |
| Data file    | Shows source file and row count |
| Copy menu    | Copy All, Copy Chart options    |
| Settings     | Gear icon for preferences       |

---

## Presentation Mode

Fullscreen distraction-free view for stakeholder presentations:

- Access via **View → Presentation Mode**
- Displays all charts in optimized layout:
  - I-Chart on top (~60% height)
  - Boxplot, Pareto, Stats Panel in bottom row
- Hides header, footer, tabs, and breadcrumbs
- Press **Escape** to exit
- Subtle "Press Escape to exit" hint in bottom right

---

## Filter State Display

Always show current filter state so users know what subset of data they're viewing:

**No filters (default):**

```
│  📂 Cycle Time Reduction                    n = 1,247 rows │
```

**Filters active:**

```
│  📂 Cycle Time Reduction                                   │
│  Shift = Night ✕ → Machine = Oven B ✕   [Clear] n = 47    │
```

| Action                 | Result                 |
| ---------------------- | ---------------------- |
| Click boxplot category | Adds filter            |
| Click pareto bar       | Adds filter            |
| Click ✕ on filter chip | Removes that filter    |
| Click "Clear All"      | Resets to full dataset |

---

## Copy & Export Workflow

| Option     | Description                                             |
| ---------- | ------------------------------------------------------- |
| Copy All   | Entire dashboard view as single image                   |
| Copy Chart | Individual chart (I-Chart, Boxplot, Pareto, or Summary) |
| Copy Stats | Summary statistics as formatted text                    |

Charts are copied to clipboard as PNG — paste directly into PowerPoint, Word, Google Slides, or email.

---

## Design Principles Summary

| Principle              | Implementation                               |
| ---------------------- | -------------------------------------------- |
| Scrollable layout      | Charts have comfortable min-heights          |
| Sticky navigation      | Breadcrumb and tabs visible while scrolling  |
| Consistent layout      | Same structure regardless of data selections |
| Independent selections | Each panel has its own data selector         |
| Empty state = prompt   | Shows dropdown when no data selected         |
| Presentation mode      | Fullscreen view for stakeholder meetings     |

---

## See Also

- [Layout Patterns](layout.md) — CSS-level layout patterns and responsive breakpoints
