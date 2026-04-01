---
title: Data View Consolidation
status: delivered
related: [data-table, process-intelligence-panel, dashboard-layout, performance]
---

# Data View Consolidation

## Problem

Data viewing is split across two sidebar surfaces:

1. **Process Intelligence Panel "Data" tab** (left sidebar, 280-500px) — read-only table with pagination
2. **Standalone DataPanel** (right sidebar, 280-600px) — read-only table with chart-click highlighting and editing access

This duplication is confusing: users have two places to look at the same data, with slightly different capabilities. Neither surface supports filtering to chart-selected rows, forcing users to page through potentially hundreds of pages to find highlighted data in large datasets (50K+ rows).

## Decision

Consolidate to one data viewing location: the **Process Intelligence Panel "Data" tab**. Remove the standalone DataPanel. Add a "show selection only" filter for chart-highlighted rows.

## Design

### Part 1: Remove Standalone DataPanel

**Remove from apps:**

- `apps/pwa/src/components/data/DataPanel.tsx` — delete
- `apps/azure/src/components/data/DataPanel.tsx` — delete
- Remove DataPanel imports and rendering from `apps/pwa/src/App.tsx` and `apps/azure/src/pages/Editor.tsx`

**Remove from panelsStore:**

- Remove or repurpose `isDataPanelOpen` state and `toggleDataPanel()` action
- Redirect `handlePointClick(rowIndex)` to set `highlightRowIndex` for PI Panel Data tab

**Keep in @variscout/ui:**

- `DataPanelBase` component stays in the package (may be useful for future views) but is no longer imported by apps

**PI Panel Data tab enhancements:**

- Add "Edit data" button that opens `DataTableModal` (replacing the flow through DataPanel)
- Inherit chart-click row highlighting: auto-scroll to highlighted row with blue background + 3s fade
- Keep 100 rows/page (appropriate for sidebar context)

### Part 2: Selection Filter Toggle

Add a "Show selection only" toggle to `DataTableBase` for filtering to chart-highlighted rows.

**New props on DataTableBase:**

```typescript
/** Indices of rows currently selected/highlighted from chart interaction */
selectedRowIndices?: Set<number>;
/** When true, show only selected rows */
filterToSelection?: boolean;
/** Callback when user toggles the selection filter */
onToggleFilterSelection?: () => void;
```

**Behavior:**

- When `selectedRowIndices` has entries and `onToggleFilterSelection` is provided, render a toggle chip in the table header: "Show selected (N)"
- When `filterToSelection` is true, `pageData` filters to only rows whose original index is in `selectedRowIndices`
- Pagination recalculates for the filtered subset
- When selection clears (user clicks elsewhere on chart), `filterToSelection` auto-resets to false

**Selection sources:**

- I-Chart point click → single row in `selectedRowIndices`
- Boxplot/Pareto category click → all rows matching that factor level (via `filteredData` indices)
- Future: I-Chart brush selection → multi-row set

**Pattern:** Mirrors the existing `filterExcluded` / `onToggleFilterExcluded` pattern already in DataTableBase. Same toggle chip style, same position in table header.

### Part 3: Reduce Default Rows Per Page

Change `DEFAULT_ROWS_PER_PAGE` from 500 to 100 in `DataTableBase.tsx`.

**Rationale:**

- Users target specific problem rows or explore highlighted data — they don't scan 500 rows sequentially
- At 100 rows × 10 columns = ~1,300 DOM nodes per page (fast on any device, including mobile)
- Combined with the selection filter, users can zero in on relevant rows instantly
- The `DataPanelBase` sidebar already uses 100 rows/page — this aligns the modal with the same default
- Inline editing, bulk paste, and keyboard navigation are unaffected

**No react-window dependency needed.** The combination of reduced page size + selection filtering keeps rendered DOM under 1,500 nodes in all scenarios.

## Files to Modify

| File                                                     | Change                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/ui/src/components/DataTable/DataTableBase.tsx` | Change DEFAULT_ROWS_PER_PAGE 500→100, add selection filter props + toggle UI |
| `apps/pwa/src/App.tsx`                                   | Remove DataPanel rendering, wire PI Panel Data tab highlighting              |
| `apps/pwa/src/components/data/DataPanel.tsx`             | Delete                                                                       |
| `apps/azure/src/pages/Editor.tsx`                        | Remove DataPanel rendering, wire PI Panel Data tab highlighting              |
| `apps/azure/src/components/data/DataPanel.tsx`           | Delete                                                                       |
| `apps/azure/src/features/panels/panelsStore.ts`          | Remove/repurpose isDataPanelOpen, redirect handlePointClick                  |
| `apps/pwa/src/features/panels/panelsStore.ts`            | Same changes as Azure                                                        |

## What Does NOT Change

- `DataTableBase` component — same API (new optional props only)
- `DataTableModalBase` — same (inherits new default rows/page)
- `useDataTablePagination` hook — unchanged
- `DataPanelBase` in @variscout/ui — stays in package, just not imported by apps
- PI Panel Summary and What-If tabs — unchanged
- Chart interaction patterns — unchanged (just different target for highlight)
- Mobile behavior — DataTableModal still opens full-screen via overflow menu

## Verification

- Both apps build: `pnpm build`
- All tests pass: `pnpm test`
- Chart point click highlights correct row in PI Panel Data tab
- "Show selection only" toggle filters table to selected rows
- DataTableModal opens from PI Panel "Edit data" button
- Pagination works at 100 rows/page (no visual regression)
- Mobile: DataTableModal still accessible via overflow menu
