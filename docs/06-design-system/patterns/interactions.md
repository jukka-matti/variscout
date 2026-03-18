---
title: 'Interaction Patterns'
---

# Interaction Patterns

Design system reference for interactive component behaviors across VariScout.

## 1. Inline Editing

Components that enter edit mode in-place, save on blur/Enter, cancel on Escape.

| Component              | Trigger            | Save          | Cancel           | Keyboard                                                  |
| ---------------------- | ------------------ | ------------- | ---------------- | --------------------------------------------------------- |
| `ColumnCard` rename    | Click pencil icon  | Blur or Enter | Escape (reverts) | Enter commits, Escape reverts                             |
| `DataTableBase` cells  | Click cell         | Blur or Enter | Escape (reverts) | Arrow Up/Down move between rows, Tab moves to next column |
| `EditableChartTitle`   | Click title text   | Blur or Enter | Escape (reverts) | —                                                         |
| `StepAnnotation` notes | Click "+ Add note" | Enter         | Escape           | —                                                         |

**Convention:** Blur always saves (never discards). Escape always reverts to the pre-edit value.

### Styling Tokens

| State                | Token                          |
| -------------------- | ------------------------------ |
| Input background     | `bg-surface`                   |
| Input border (rest)  | `border-edge`                  |
| Input border (focus) | `focus:border-blue-500`        |
| Input text           | `text-content` or `text-white` |
| Monospace numbers    | `font-mono text-right`         |

---

## 2. Grid / Spreadsheet Entry

Multi-cell data entry with keyboard-driven navigation.

| Component              | Arrow Keys                         | Tab                       | Enter            | Paste                             |
| ---------------------- | ---------------------------------- | ------------------------- | ---------------- | --------------------------------- |
| `DataTableBase`        | Up/Down between rows (save + move) | Next column (save + move) | Save + exit edit | Multi-cell paste (rows × columns) |
| `StandardEntryGrid`    | —                                  | Next cell                 | Save row         | —                                 |
| `PerformanceEntryGrid` | —                                  | Next measure column       | Save row         | Paste button for bulk fill        |

**Convention:** Arrow/Tab navigation always saves the current cell before moving. Paste detects rows (newlines) and columns (tabs) automatically.

### Styling Tokens

| Element           | Token                    |
| ----------------- | ------------------------ |
| Table background  | `bg-surface`             |
| Cell border       | `border-edge`            |
| Header background | `bg-surface-secondary`   |
| Header text       | `text-content-secondary` |
| Active cell ring  | `ring-2 ring-blue-500`   |
| Numeric cells     | `font-mono text-right`   |

---

## 3. Selection Cards

Cards that toggle selection state on click, used in column mapping and setup flows.

| Component               | Click           | Keyboard           | Visual Feedback                     |
| ----------------------- | --------------- | ------------------ | ----------------------------------- |
| `ColumnCard` (outcome)  | Radio select    | Enter/Space toggle | Blue glow border + filled radio dot |
| `ColumnCard` (factor)   | Checkbox toggle | Enter/Space toggle | Emerald glow border + check icon    |
| `MeasureColumnSelector` | Checkbox toggle | —                  | Emerald highlight                   |

**Convention:** Outcome = radio (single select, blue). Factor = checkbox (multi-select, emerald). Cards use `role="button"` with `tabIndex={0}` for keyboard access. Selected state uses colored border + background glow (`shadow-[0_0_10px_...]`).

### Styling Tokens

| State                 | Token                                          |
| --------------------- | ---------------------------------------------- |
| Unselected border     | `border-slate-700`                             |
| Unselected background | `bg-slate-800`                                 |
| Hover                 | `hover:border-slate-600 hover:bg-slate-700/50` |
| Selected (outcome)    | `border-blue-500 bg-blue-600/20`               |
| Selected (factor)     | `border-emerald-500 bg-emerald-600/20`         |
| Disabled              | `opacity-50 cursor-not-allowed`                |

---

## 4. Segmented Controls

Pill-button groups for selecting from 2–5 options.

| Component                   | Purpose               | Selected Style           | Indicator                    |
| --------------------------- | --------------------- | ------------------------ | ---------------------------- |
| `FactorSelector`            | Boxplot/Pareto factor | `bg-blue-600 text-white` | Amber dot when filter active |
| `BoxplotDisplayToggle`      | Sort criteria         | `bg-blue-600 text-white` | —                            |
| Mode toggles (Manual Entry) | Standard/Performance  | `bg-blue-600 text-white` | —                            |

**Convention:** Selected = `bg-blue-600 text-white shadow-sm`. Unselected = `text-slate-400 hover:text-white hover:bg-slate-800`. Container = `bg-slate-900 rounded-lg p-0.5 border border-slate-700`. Use dropdown when options exceed 5.

---

## 5. Context Menus

Right-click menus for chart interactions.

| Component                                | Trigger                   | Actions                           |
| ---------------------------------------- | ------------------------- | --------------------------------- |
| `AnnotationContextMenu` (Boxplot/Pareto) | Right-click on category   | Highlight category, Add text note |
| `AnnotationContextMenu` (I-Chart)        | Right-click on chart area | Add text note (free-floating %)   |

**Convention:** Positioned at cursor. Click-outside or Escape to dismiss. Menu items are buttons with hover highlight. Category highlights toggle on/off.

---

## 6. Drag and Drop

Native HTML5 drag-and-drop (no library dependency).

| Component             | Draggable     | Drop Target   | Visual Feedback                  |
| --------------------- | ------------- | ------------- | -------------------------------- |
| `FindingBoardColumns` | Finding cards | Board columns | Drag ghost + drop zone highlight |

**Convention:** Uses native `draggable`, `onDragStart`, `onDragOver`, `onDrop` — no dnd-kit or similar library. Status updates on drop.

---

## Cross-Cutting Conventions

| Convention        | Pattern                                                       | Where Used                      |
| ----------------- | ------------------------------------------------------------- | ------------------------------- |
| Focus ring        | `focus:border-blue-500` or `focus:ring-2 focus:ring-blue-500` | All interactive elements        |
| Blur saves        | `onBlur` triggers save/commit, never discard                  | Inline edit, grid cells         |
| Escape cancels    | Revert to pre-edit value                                      | Inline edit, rename, modals     |
| Monospace numbers | `font-mono text-right`                                        | All numeric inputs and displays |
| Semantic tokens   | `bg-surface`, `border-edge`, `text-content`                   | All shared UI components        |
| Transition        | `transition-colors` or `transition-all`                       | Hover/focus state changes       |
| Disabled          | `opacity-50 cursor-not-allowed`                               | Cards, buttons, inputs          |

---

## See Also

- [Foundational Patterns](../components/foundational-patterns.md) — Buttons, forms, cards, modals
- [Navigation](navigation.md) — Filter breadcrumbs, drill-down patterns
- [Accessibility](../foundations/accessibility.md) — WCAG AA guidelines
- [Feedback](feedback.md) — Loading, error, and success states
