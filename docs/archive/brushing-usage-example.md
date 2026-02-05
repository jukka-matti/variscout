# Minitab-Style Brushing - Usage Example

## Quick Start

### 1. Enable Brushing in Dashboard

```tsx
// apps/pwa/src/components/Dashboard.tsx
import { useData } from '../context/DataContext';
import { IChart } from '@variscout/charts';

const Dashboard = () => {
  const { filteredData, outcome, stats, specs, selectedPoints, setSelectedPoints, clearSelection } =
    useData();

  // Transform data for IChart
  const chartData = filteredData.map((row, i) => ({
    x: i,
    y: row[outcome] as number,
    originalIndex: i,
  }));

  return (
    <div>
      {/* Selection count badge */}
      {selectedPoints.size > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded bg-blue-500 px-3 py-1 text-sm text-white">
            {selectedPoints.size} point{selectedPoints.size > 1 ? 's' : ''} selected
          </span>
          <button onClick={clearSelection} className="text-sm text-slate-400 hover:text-slate-200">
            Clear
          </button>
        </div>
      )}

      {/* I-Chart with brushing enabled */}
      <IChart
        data={chartData}
        stats={stats}
        specs={specs}
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={indices => setSelectedPoints(indices)}
        parentWidth={800}
        parentHeight={400}
        yAxisLabel={outcome || 'Value'}
      />
    </div>
  );
};
```

### 2. Interaction Patterns

#### Rectangular Brush Selection

```
1. Click and drag on chart to draw selection rectangle
2. Release mouse to select all points within rectangle
3. Selected points: larger (6px), white stroke, full opacity
4. Unselected points: dimmed (0.3 opacity)
```

#### Modifier Key Interactions

```
Ctrl+Click: Toggle individual point
  - Point selected? → Remove from selection
  - Point not selected? → Add to selection

Shift+Click: Add point to selection
  - Always adds point without removing others

Regular Click: Replace selection
  - Clears existing selection
  - Selects only the clicked point
```

### 3. Visual Feedback

#### Default State (No Selection)

```
All points:
  - Radius: 4px
  - Opacity: 1.0
  - Stroke: Default (1px)
  - Color: Semantic (red/green/amber/blue)
```

#### Active Selection

```
Selected points:
  - Radius: 6px (+2px)
  - Opacity: 1.0
  - Stroke: 2px white
  - Color: Maintains semantic meaning

Unselected points:
  - Radius: 4px
  - Opacity: 0.3 (dimmed)
  - Stroke: Default (1px)
  - Color: Dimmed semantic color
```

#### Brush Rectangle (During Selection)

```
Fill: rgba(59, 130, 246, 0.1)  // Blue, 10% opacity
Stroke: rgba(59, 130, 246, 0.5) // Blue, 50% opacity
Width: 1.5px
Cursor: crosshair
```

### 4. Advanced Usage - Custom Selection Actions

```tsx
const Dashboard = () => {
  const { filteredData, selectedPoints, setSelectedPoints, clearSelection, setFilters, filters } =
    useData();

  // Filter to show only selected points
  const filterToSelection = () => {
    if (selectedPoints.size === 0) return;

    // Get selected row IDs (if you have a unique ID column)
    const selectedIds = Array.from(selectedPoints).map(i => filteredData[i].id);

    setFilters({
      ...filters,
      id: selectedIds, // Assuming 'id' is a column
    });

    clearSelection();
  };

  // Export selected points to CSV
  const exportSelection = () => {
    if (selectedPoints.size === 0) return;

    const selectedRows = Array.from(selectedPoints).map(i => filteredData[i]);

    const csv = [
      Object.keys(selectedRows[0]).join(','),
      ...selectedRows.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_points.csv';
    a.click();
  };

  // Highlight outliers automatically
  const selectOutliers = () => {
    const indices = new Set<number>();

    filteredData.forEach((row, i) => {
      const value = row[outcome] as number;
      if (
        (specs.usl !== undefined && value > specs.usl) ||
        (specs.lsl !== undefined && value < specs.lsl)
      ) {
        indices.add(i);
      }
    });

    setSelectedPoints(indices);
  };

  return (
    <div>
      {/* Action buttons */}
      <div className="mb-4 flex gap-2">
        <button onClick={selectOutliers}>Select Outliers</button>
        {selectedPoints.size > 0 && (
          <>
            <button onClick={filterToSelection}>Filter to Selection ({selectedPoints.size})</button>
            <button onClick={exportSelection}>Export Selection</button>
          </>
        )}
      </div>

      <IChart
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
        {...chartProps}
      />
    </div>
  );
};
```

### 5. Cross-Chart Synchronization (Phase 2 - Pending)

```tsx
// Future: Selection syncs across all charts automatically
const Dashboard = () => {
  const { selectedPoints, setSelectedPoints } = useData();

  return (
    <div>
      {/* Selection persists across all charts */}
      <IChart
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
        {...chartProps}
      />

      <ScatterPlot
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
        {...scatterProps}
      />

      <Boxplot
        selectedGroups={getSelectedGroups(selectedPoints)}
        onBoxClick={handleBoxClick}
        {...boxplotProps}
      />
    </div>
  );
};
```

### 6. Data Table Bi-Directional Sync (Phase 2 - Pending)

```tsx
// Future: Table row click updates chart selection
const DataTable = () => {
  const { filteredData, selectedPoints, addToSelection, togglePointSelection } = useData();

  return (
    <table>
      {filteredData.map((row, i) => (
        <tr
          key={i}
          className={selectedPoints.has(i) ? 'bg-blue-100' : ''}
          onClick={e => {
            if (e.ctrlKey || e.metaKey) {
              togglePointSelection(i);
            } else {
              addToSelection([i]);
            }
          }}
        >
          <td>{row.value}</td>
        </tr>
      ))}
    </table>
  );
};
```

## Keyboard Shortcuts (Phase 6 - Pending)

| Key      | Action            |
| -------- | ----------------- |
| `Escape` | Clear selection   |
| `Ctrl+A` | Select all points |
| `Ctrl+I` | Invert selection  |

## Mobile/Touch Support (Phase 6 - Pending)

```tsx
// Touch gestures for mobile devices
const IChartMobile = () => {
  return (
    <IChart
      enableBrushSelection={true}
      // Touch: Long press to start brush
      // Touch: Drag to select region
      // Touch: Double-tap to toggle point
      {...props}
    />
  );
};
```

## Performance Tips

### Large Datasets (1000+ points)

```tsx
// Use virtualization for data table
import { VirtualizedTable } from '@variscout/ui';

const DataTable = () => {
  return (
    <VirtualizedTable
      data={filteredData}
      selectedRows={Array.from(selectedPoints)}
      onRowClick={index => togglePointSelection(index)}
      rowHeight={40}
      height={600}
    />
  );
};

// Use sampling for preview
const previewSelection = Array.from(selectedPoints).slice(0, 5);
```

### Debounce Selection Updates

```tsx
import { useDebouncedCallback } from 'use-debounce';

const Dashboard = () => {
  const debouncedSelectionChange = useDebouncedCallback(
    (indices: Set<number>) => {
      setSelectedPoints(indices);
    },
    100 // 100ms debounce
  );

  return <IChart onSelectionChange={debouncedSelectionChange} {...props} />;
};
```

## Troubleshooting

### Selection Cleared After Filter Change

This is intentional to prevent confusion. When filters change, the visible data changes, so selection is auto-cleared. A warning banner will be added in Phase 3.

### Selection Not Syncing Across Charts

Phase 2 pending. Currently only IChart supports brushing. ScatterPlot and Boxplot integration coming soon.

### Brush Not Working

Verify `enableBrushSelection={true}` prop is set and `onSelectionChange` callback is provided.

### Mobile Touch Issues

Mobile/touch support pending in Phase 6. Use desktop browser for now.
