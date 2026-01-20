# Azure Data Panel

Interactive data table panel for exploring analysis data with bi-directional chart synchronization.

## Overview

The Data Panel provides a tabular view of the current dataset, synchronized with chart interactions. When you click a data point on a chart, the panel opens and highlights the corresponding row. Conversely, clicking a row in the panel highlights the corresponding point on the chart.

```
┌─────────────────────────────────────┬────────────────────────┐
│                                     │  Data Panel            │
│           Charts                    │  ┌────┬─────┬─────┐    │
│                                     │  │ #  │ Op  │ Wt  │    │
│         ┌─●─────┐                   │  ├────┼─────┼─────┤    │
│         │   ●   │  ← click point    │  │ 1  │ A   │ 10.2│    │
│         └───────┘                   │  │ 2★ │ B   │ 10.4│◄───│
│                                     │  │ 3  │ A   │ 10.1│    │
│                                     │  └────┴─────┴─────┘    │
└─────────────────────────────────────┴────────────────────────┘
                    ↓ highlight syncs both ways
```

## Access

Toggle the Data Panel via the **📊** button in the header toolbar.

---

## Features

### Resizable Panel

- **Width range:** 280px - 600px
- **Drag handle:** Grip icon on left edge
- **Persistence:** Width saved to localStorage (`variscout-azure-data-panel-width`)

### Pagination

Large datasets are paginated for performance:

- **Page size:** 100 rows per page
- **Navigation:** Previous/Next buttons in footer
- **Auto-navigation:** When highlighting from chart, auto-navigates to correct page

### Column Selection

The panel shows up to 5 columns, prioritized as:

1. **Outcome column** (highlighted in blue)
2. **Active filter columns** (factors used in current drill-down)
3. **Remaining columns** (fill to 5)

### Spec Status Color-Coding

Outcome values are color-coded by specification status:

| Status       | Color         | Condition         |
| ------------ | ------------- | ----------------- |
| **Pass**     | Green         | LSL ≤ value ≤ USL |
| **Fail USL** | Red           | value > USL       |
| **Fail LSL** | Amber/Yellow  | value < LSL       |
| **No specs** | Slate/Default | No limits defined |

### Excluded Row Indicators

Rows excluded from analysis (missing/invalid data) show:

- Amber background tint
- Warning triangle (⚠) next to row number
- Tooltip with exclusion reasons on hover

### Appended Data

When new data is added via Manual Entry append mode:

- New rows appear at the end of the table
- Row numbering continues from existing data
- All highlighting and spec color-coding applies to appended rows

---

## Bi-directional Highlighting

### Chart → Panel

1. Click a data point on any chart (I-Chart, Boxplot, etc.)
2. Data Panel opens automatically (if closed)
3. Corresponding row is highlighted with blue background
4. Panel auto-navigates to the correct page
5. Highlight fades out after 3 seconds

### Panel → Chart

1. Click any row in the Data Panel
2. Corresponding point highlights on the I-Chart
3. Highlight fades out after 2 seconds

---

## Data Flow

```
┌──────────────┐     highlightRowIndex     ┌──────────────┐
│              │ ──────────────────────────►│              │
│   Dashboard  │                            │  DataPanel   │
│   (Charts)   │ ◄─────────────────────────│              │
│              │      onRowClick(index)     │              │
└──────────────┘                            └──────────────┘
```

### Props Interface

```typescript
interface DataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number | null; // From chart click
  onRowClick?: (index: number) => void; // To chart highlight
  excludedRowIndices?: Set<number>; // Excluded from analysis
  excludedReasons?: Map<number, ExclusionReason[]>;
}
```

---

## Implementation

**Source file:** `apps/azure/src/components/DataPanel.tsx`

### Key Implementation Details

- **Index mapping:** Creates a map from filtered data indices to raw data indices for accurate highlighting
- **Page calculation:** `Math.floor(dataIndex / ROWS_PER_PAGE)` for auto-navigation
- **Highlight timeout:** 3 seconds with cleanup on unmount
- **Resize events:** Uses `mousedown`/`mousemove`/`mouseup` event listeners

### Constants

```typescript
const ROWS_PER_PAGE = 100;
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 350;
const STORAGE_KEY = 'variscout-azure-data-panel-width';
```

---

## Related Documentation

- [Azure Overview](./OVERVIEW.md) - Azure app features
- [Core Analysis Journey](../../flows/CORE-ANALYSIS-JOURNEY.md) - Chart interactions
- [Navigation Architecture](../../design-system/NAVIGATION_ARCHITECTURE.md) - Highlighting system
