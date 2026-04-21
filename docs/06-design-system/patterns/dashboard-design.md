---
title: Dashboard Design Principles
audience: [analyst, engineer]
category: reference
status: stable
related: [analysis-dashboard, layout, dashboard, presentation-mode]
---

# Dashboard Design Principles

General UX principles for VariScout dashboards.

The exact contract for the Analysis workspace now lives in [Analysis Dashboard Pattern](analysis-dashboard.md). This page keeps the cross-cutting principles that still apply regardless of specific chart slotting.

---

## Core Principles

### Laptop first

Design the normal case around **full-screen laptop** before optimizing narrow windows or oversized monitors.

### Stable regions

Keep dashboard regions stable so analysts learn where to look:

- shared context in the top strip
- orientation in the hero chart
- drill-down in the subgroup panel
- shape/spec/ranking in the adaptive lens

### Guided empty states

When data is missing for a panel, keep the layout stable and explain how to unlock the missing analysis instead of collapsing the page.

### Chart-local ownership

Selectors should stay near the chart they control. Shared summary and global actions should stay in the top strip.

### Minimal utility chrome

In the normal dashboard, visible utility actions should be lightweight. Copy/download/share belong in focused view or secondary UI when they compete with reading the charts.

---

## Scroll And Focus

Allow both:

- **viewport-fit overview** for fast orientation
- **scroll / focus views** for detailed reading and export

The analyst should be able to move between overview and deeper reading without relearning the page.

---

## Presentation Mode

Fullscreen distraction-free view for stakeholder presentations:

- Access via **View → Presentation Mode**
- Displays the key charts in a simplified reading layout
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

| Option     | Description                           |
| ---------- | ------------------------------------- |
| Copy All   | Entire dashboard view as single image |
| Copy Chart | Individual focused chart              |
| Copy Stats | Summary statistics as formatted text  |

Charts are copied to clipboard as PNG — paste directly into PowerPoint, Word, Google Slides, or email.

---

## Design Principles Summary

| Principle            | Implementation                                        |
| -------------------- | ----------------------------------------------------- |
| Laptop-first layout  | Optimize the normal case around full-screen laptop    |
| Stable regions       | Keep chart roles learnable across data states         |
| Guided empty states  | Explain missing analysis instead of collapsing layout |
| Local control owner  | Keep selectors near the chart they affect             |
| Light utility chrome | Use focused view for export-heavy actions             |
| Presentation mode    | Provide a distraction-free meeting view               |

---

## See Also

- [Analysis Dashboard Pattern](analysis-dashboard.md)
- [Layout Patterns](layout.md) — CSS-level layout patterns and responsive breakpoints
