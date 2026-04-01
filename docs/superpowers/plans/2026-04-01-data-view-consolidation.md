# Data View Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate duplicate data viewing surfaces into the PI Panel Data tab, add selection filter toggle, reduce default rows/page from 500 to 100.

**Architecture:** Three independent changes: (1) reduce DEFAULT_ROWS_PER_PAGE, (2) add selection filter props to DataTableBase, (3) remove standalone DataPanel from both apps and redirect chart-click highlighting to PI Panel.

**Tech Stack:** React, TypeScript, Zustand, Vitest, @testing-library/react

---

### Task 1: Reduce DEFAULT_ROWS_PER_PAGE from 500 to 100

**Files:**

- Modify: `packages/ui/src/components/DataTable/DataTableBase.tsx:7`
- Test: `packages/ui/src/components/DataTable/__tests__/DataTableBase.test.tsx`

- [ ] **Step 1: Update the constant**

In `packages/ui/src/components/DataTable/DataTableBase.tsx` line 7, change:

```typescript
const DEFAULT_ROWS_PER_PAGE = 500;
```

to:

```typescript
const DEFAULT_ROWS_PER_PAGE = 100;
```

- [ ] **Step 2: Update any tests that rely on the 500 threshold**

Check `packages/ui/src/components/DataTable/__tests__/DataTableBase.test.tsx` for tests that create >100 rows expecting them all on one page. If any exist, either reduce test data or explicitly pass `rowsPerPage={500}` to preserve the test intent.

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/DataTable/DataTableBase.tsx packages/ui/src/components/DataTable/__tests__/DataTableBase.test.tsx
git commit -m "perf: reduce DataTable default rows per page from 500 to 100

Users target specific problem rows, not scan 500 sequentially.
100 rows × 10 columns = ~1,300 DOM nodes (fast on any device)."
```

---

### Task 2: Add selection filter to DataTableBase

**Files:**

- Modify: `packages/ui/src/components/DataTable/DataTableBase.tsx`
- Test: `packages/ui/src/components/DataTable/__tests__/DataTableBase.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `packages/ui/src/components/DataTable/__tests__/DataTableBase.test.tsx`:

```typescript
describe('selection filter', () => {
  const makeData = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ value: i * 10, factor: `F${i % 3}` }));

  it('shows "Show selected" toggle when selectedRowIndices is provided', () => {
    const { getByText } = render(
      <DataTableBase
        data={makeData(20)}
        columns={['value', 'factor']}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
        selectedRowIndices={new Set([2, 5, 8])}
        filterToSelection={false}
        onToggleFilterSelection={vi.fn()}
      />
    );
    expect(getByText(/Show selected \(3\)/)).toBeInTheDocument();
  });

  it('filters to only selected rows when filterToSelection is true', () => {
    const data = makeData(20);
    const { container } = render(
      <DataTableBase
        data={data}
        columns={['value', 'factor']}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
        selectedRowIndices={new Set([0, 1, 2])}
        filterToSelection={true}
        onToggleFilterSelection={vi.fn()}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('does not show toggle when selectedRowIndices is empty', () => {
    const { queryByText } = render(
      <DataTableBase
        data={makeData(5)}
        columns={['value', 'factor']}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
        selectedRowIndices={new Set()}
        filterToSelection={false}
        onToggleFilterSelection={vi.fn()}
      />
    );
    expect(queryByText(/Show selected/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: FAIL — `selectedRowIndices` prop not recognized

- [ ] **Step 3: Add props to DataTableBase**

In `DataTableBase.tsx`, add to the `DataTableBaseProps` interface:

```typescript
/** Indices of rows selected/highlighted from chart interaction */
selectedRowIndices?: Set<number>;
/** When true, show only selected rows */
filterToSelection?: boolean;
/** Callback when user toggles the selection filter */
onToggleFilterSelection?: () => void;
```

Destructure in the component:

```typescript
const DataTableBase: React.FC<DataTableBaseProps> = ({
  // ... existing props ...
  selectedRowIndices,
  filterToSelection,
  onToggleFilterSelection,
}) => {
```

- [ ] **Step 4: Add filtering logic to displayData**

Update the `displayData` useMemo (around line 55) to handle selection filtering. Add selection filter AFTER the existing excluded filter:

```typescript
const displayData = useMemo(() => {
  let items = data.map((row, i) => ({ row, originalIndex: i }));
  if (filterExcluded && excludedRowIndices) {
    items = items.filter(item => excludedRowIndices.has(item.originalIndex));
  }
  if (filterToSelection && selectedRowIndices?.size) {
    items = items.filter(item => selectedRowIndices.has(item.originalIndex));
  }
  return items;
}, [data, filterExcluded, excludedRowIndices, filterToSelection, selectedRowIndices]);
```

- [ ] **Step 5: Add toggle chip in the table header area**

Before the `<table>` element (inside the `<div className="flex-1 overflow-auto p-4">` wrapper), add a filter bar when selection exists. Follow the pattern from `DataTableModalBase.tsx` lines 182-201:

```tsx
{
  selectedRowIndices && selectedRowIndices.size > 0 && onToggleFilterSelection && (
    <div className="flex items-center gap-2 mb-2">
      <button
        type="button"
        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
          filterToSelection
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : 'border-edge text-content-muted hover:text-content'
        }`}
        onClick={onToggleFilterSelection}
      >
        {filterToSelection ? t('table.showAll') : `Show selected (${selectedRowIndices.size})`}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Add i18n key for "Show all"**

Add to `packages/core/src/i18n/messages/en.ts`:

```typescript
'table.showAll': 'Show all',
```

Add to `packages/core/src/i18n/types.ts` in the MessageCatalog interface:

```typescript
'table.showAll': string;
```

Add the same key to all 31 other locale files (English placeholder).

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: All tests pass including the 3 new selection filter tests

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/DataTable/ packages/core/src/i18n/
git commit -m "feat: add selection filter toggle to DataTableBase

When chart interaction highlights rows, DataTableBase shows a 'Show
selected (N)' toggle chip. When active, filters table to only those
rows. Mirrors the existing filterExcluded pattern."
```

---

### Task 3: Remove standalone DataPanel from Azure app

**Files:**

- Delete: `apps/azure/src/components/data/DataPanel.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/features/panels/panelsStore.ts`

- [ ] **Step 1: Update panelsStore — redirect handlePointClick**

In `apps/azure/src/features/panels/panelsStore.ts`:

Change `handlePointClick` (line 157) from:

```typescript
handlePointClick: index => set({ highlightRowIndex: index, isDataPanelOpen: true }),
```

to:

```typescript
handlePointClick: index => set({ highlightRowIndex: index, isStatsSidebarOpen: true }),
```

This opens the PI Panel (Stats/Data sidebar) instead of the standalone DataPanel when a chart point is clicked. The PI Panel Data tab already accepts `highlightRowIndex`.

- [ ] **Step 2: Remove DataPanel rendering from Editor.tsx**

In `apps/azure/src/pages/Editor.tsx`:

- Remove the `isDataPanelOpen` selector (line 173)
- Remove `handleDataPanelToggle` callback (line 198-202)
- Remove DataPanel-related props from the dashboard view wiring (lines ~1007-1014: `isDataPanelOpen`, `onToggleDataPanel`)
- Remove DataPanel component rendering (search for `<DataPanel` and remove)
- Remove the DataPanel import if it exists

- [ ] **Step 3: Remove DataPanel component file**

Delete `apps/azure/src/components/data/DataPanel.tsx`

- [ ] **Step 4: Build to verify**

Run: `pnpm --filter @variscout/azure-app build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/
git commit -m "refactor: remove standalone DataPanel from Azure app

Chart-click highlighting now opens the PI Panel (Stats/Data sidebar)
instead of the standalone DataPanel. Consolidates data viewing to
one location per data-view-consolidation design spec."
```

---

### Task 4: Remove standalone DataPanel from PWA app

**Files:**

- Delete: `apps/pwa/src/components/data/DataPanel.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/features/panels/panelsStore.ts`

- [ ] **Step 1: Update PWA panelsStore — redirect handlePointClick**

In `apps/pwa/src/features/panels/panelsStore.ts`:

Change `handlePointClick` (line 98) from:

```typescript
handlePointClick: index => set({ highlightRowIndex: index, isDataPanelOpen: true }),
```

to:

```typescript
handlePointClick: index => set({ highlightRowIndex: index, isStatsSidebarOpen: true }),
```

Check if `isStatsSidebarOpen` exists in the PWA panelsStore. If not, check what the PI Panel/Stats sidebar toggle is called and use that instead.

- [ ] **Step 2: Remove DataPanel rendering from App.tsx**

In `apps/pwa/src/App.tsx`:

- Remove the lazy import: `const DataPanel = React.lazy(() => import('./components/data/DataPanel'));` (line 53)
- Remove DataPanel-related props from dashboard wiring (lines ~566-569: `isDataPanelOpen`, `onToggleDataPanel`)
- Remove `<DataPanel>` component rendering (lines ~772-776)
- Remove the `closeDataPanel` callback from panelsStore usage

- [ ] **Step 3: Remove DataPanel component file**

Delete `apps/pwa/src/components/data/DataPanel.tsx`

- [ ] **Step 4: Build to verify**

Run: `pnpm --filter @variscout/pwa build`
Expected: Build succeeds

- [ ] **Step 5: Run all tests**

Run: `pnpm test`
Expected: All tests pass. If any tests reference DataPanel, update them.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/
git commit -m "refactor: remove standalone DataPanel from PWA app

Same consolidation as Azure — chart-click highlighting opens the
Stats/Data sidebar instead of standalone DataPanel."
```

---

### Task 5: Update panelsStore tests

**Files:**

- Modify: `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`
- Modify: `apps/pwa/src/features/panels/__tests__/panelsStore.test.ts`

- [ ] **Step 1: Update Azure panelsStore tests**

In `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`:

- Update any tests that assert `isDataPanelOpen: true` after `handlePointClick` — they should now assert `isStatsSidebarOpen: true`
- Remove tests for `toggleDataPanel`, `openDataPanel`, `closeDataPanel` if those actions were removed
- Verify remaining tests still pass

- [ ] **Step 2: Update PWA panelsStore tests**

Same changes for `apps/pwa/src/features/panels/__tests__/panelsStore.test.ts`.

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/features/panels/__tests__/ apps/pwa/src/features/panels/__tests__/
git commit -m "test: update panelsStore tests for DataPanel removal

handlePointClick now opens Stats sidebar instead of DataPanel."
```

---

### Task 6: Update design spec status + docs

**Files:**

- Modify: `docs/superpowers/specs/2026-04-01-data-view-consolidation-design.md`
- Modify: `.claude/rules/monorepo.md` (if DataPanel is listed)
- Modify: `CLAUDE.md` (if DataPanel is referenced)

- [ ] **Step 1: Update spec status**

Change frontmatter `status: draft` to `status: delivered` in `docs/superpowers/specs/2026-04-01-data-view-consolidation-design.md`.

- [ ] **Step 2: Check CLAUDE.md and monorepo.md**

Search for "DataPanel" references in `.claude/rules/monorepo.md` and `CLAUDE.md`. If listed as a component export, remove or mark as deprecated.

- [ ] **Step 3: Final verification**

Run:

```bash
pnpm build
pnpm test
bash scripts/check-doc-health.sh
```

Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add docs/ .claude/ CLAUDE.md
git commit -m "docs: mark data view consolidation as delivered"
```
