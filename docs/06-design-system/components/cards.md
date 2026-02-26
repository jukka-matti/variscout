# Cards

Card components for grouping related content.

---

## Panel Card

Used for dashboard panels and chart containers.

### PWA (Tailwind)

```tsx
<div className="bg-surface border border-edge rounded-lg p-4">
  <h3 className="text-content font-semibold mb-2">Panel Title</h3>
  <div className="text-content-secondary">Panel content here</div>
</div>
```

### Variants

| Variant     | Use Case        | Border                  |
| ----------- | --------------- | ----------------------- |
| Default     | Standard panels | `border-edge`           |
| Interactive | Clickable cards | `hover:border-blue-500` |
| Selected    | Active state    | `border-blue-500`       |

---

## Stats Card

Compact card for displaying statistics.

```tsx
<div className="bg-surface-secondary rounded p-3">
  <div className="text-content-secondary text-xs">Label</div>
  <div className="text-content text-lg font-mono">1.45</div>
</div>
```

### Always-Visible Stats

The following metrics are always shown in the Stats Panel regardless of whether specification limits are configured:

- **Mean** — arithmetic average
- **Median** — midpoint value (always shown alongside Mean)
- **Std Dev** — standard deviation
- **Samples** — row count (n)

### Spec-Dependent Metrics and Pencil Link (`onEditSpecs`)

Spec-dependent metrics (Pass Rate, Cp, Cpk) require USL or LSL to be set. When no specs are configured, these cards are omitted from the grid.

`StatsPanelBase` shows a pencil link below the metric cards when `onEditSpecs` is provided:

- **No specs:** Shows `✏ Set spec limits`
- **Specs exist:** Shows `✏ Edit spec limits`

Clicking the link calls `onEditSpecs()` — the app wrapper is responsible for opening its SpecEditor popover.

```tsx
<StatsPanelBase
  stats={stats}
  specs={specs}
  onEditSpecs={() => setIsEditingSpecs(true)}
  // ...other props
/>
```

When `onEditSpecs` is omitted, no pencil link is shown.

### ColumnCard

Individual card for each column in the ColumnMapping screen. Displays rich metadata to help users understand their data at a glance.

**Props:**

| Prop             | Type                                             | Description                                       |
| ---------------- | ------------------------------------------------ | ------------------------------------------------- |
| `column`         | `ColumnAnalysis`                                 | Rich column metadata from detectColumns           |
| `role`           | `'outcome' \| 'factor'`                          | Whether card is in Y or X section                 |
| `selected`       | `boolean`                                        | Current selection state                           |
| `disabled`       | `boolean?`                                       | Greyed out (e.g., already used)                   |
| `disabledReason` | `string?`                                        | Tooltip explaining why disabled                   |
| `alias`          | `string?`                                        | Current rename alias                              |
| `onSelect`       | `() => void`                                     | Selection callback                                |
| `onRename`       | `(originalName: string, alias: string) => void?` | Rename callback (pencil icon shown when provided) |

**Type badges:**

| Type        | Color | Tailwind classes                     |
| ----------- | ----- | ------------------------------------ |
| Numeric     | Blue  | `bg-blue-500/20 text-blue-400`       |
| Categorical | Green | `bg-emerald-500/20 text-emerald-400` |
| Date        | Amber | `bg-amber-500/20 text-amber-400`     |
| Text        | Slate | `bg-slate-500/20 text-slate-400`     |

**Card content:**

- **Sample values**: Shows 3–4 values from `column.sampleValues` (all values shown for categorical columns with ≤6 unique values)
- **Summary line**: Categorical with ≤10 unique → "N categories"; otherwise "N unique". Appends "N missing" when `missingCount > 0`
- **Missing warning**: Amber `AlertTriangle` icon shown when `missingCount > 0`
- **Inline rename**: Pencil icon triggers an inline text input. Enter/blur saves, Escape cancels. When aliased, original name shown as subtitle in parentheses

### DataPreviewTable

Collapsible mini table showing the first few rows of data with color-coded column headers.

**Props:**

| Prop             | Type               | Description                         |
| ---------------- | ------------------ | ----------------------------------- |
| `rows`           | `DataRow[]`        | Preview rows (first 5 displayed)    |
| `columnAnalysis` | `ColumnAnalysis[]` | Column metadata for header coloring |
| `totalRows`      | `number?`          | Total row count for summary display |

**Behavior:**

- **Collapsed by default** — toggle via Table icon button
- **Color-coded headers**: blue (numeric), emerald (categorical), amber (date), slate (text)
- **Shows first 5 rows** with monospace values and row numbers
- **Summary line**: "N rows · N columns" shown next to the toggle

### ColumnMapping Spec Section

`ColumnMapping` exposes an optional collapsible spec entry section (`SpecsSection`), collapsed by default. The component accepts rich column metadata via `columnAnalysis` (preferred) or falls back to plain column names via `availableColumns` for backwards compatibility.

**Key props:**

| Prop               | Type                                             | Description                             |
| ------------------ | ------------------------------------------------ | --------------------------------------- |
| `columnAnalysis`   | `ColumnAnalysis[]?`                              | Rich metadata (preferred)               |
| `availableColumns` | `string[]?`                                      | Fallback: plain column names            |
| `previewRows`      | `DataRow[]?`                                     | Rows for collapsible data preview table |
| `totalRows`        | `number?`                                        | Total row count for summary             |
| `columnAliases`    | `Record<string, string>?`                        | Current column rename aliases           |
| `onColumnRename`   | `(originalName: string, alias: string) => void?` | Callback when user renames a column     |
| `maxFactors`       | `number?`                                        | Max selectable factors (default: 3)     |

This allows users to preview data, rename columns, and enter Target, LSL, and USL before reaching the dashboard.

---

## ChartCard (Accent-Aware Hover)

`ChartCard` from `@variscout/charts` uses CSS for its hover border:

```css
.chart-card:hover {
  border-color: var(--accent-hex, var(--color-edge-hover, #475569));
}
```

When a company accent is configured (Azure App), the hover border picks up that color. PWA falls back to `--color-edge-hover`.

See [Shared Chart Components > ChartCard](../charts/shared-components.md#chartcard) for full props and layout.

---

## See Also

- [Layout Patterns](../patterns/layout.md)
- [Specification Management](../../03-features/specifications.md)
