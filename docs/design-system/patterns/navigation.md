# Navigation Patterns

Navigation and drill-down patterns across VariScout products.

## Overview

VariScout uses a consistent navigation model across all products:

- **Filter-based navigation**: Clicking chart elements filters data
- **Breadcrumb trail**: Shows current drill path with back navigation
- **State persistence**: Filters auto-saved in project state

## Drill-Down Behavior by Chart

| Chart   | Click Action | Effect                                  |
| ------- | ------------ | --------------------------------------- |
| I-Chart | Point click  | Highlight row in data table (no filter) |
| Boxplot | Box click    | Filter to that factor level             |
| Pareto  | Bar click    | Filter to that category                 |

### I-Chart (Highlight Only)

```
Click point → Opens data table with row highlighted
```

The I-Chart highlights individual data points without filtering. This preserves context while allowing inspection.

### Boxplot & Pareto (Filter Drill-down)

```
Click element → Adds filter → Breadcrumb updates
Click same element → Removes filter (toggle behavior)
```

Multi-select is supported: clicking multiple elements adds all to the filter.

## Breadcrumb Component

Location: `apps/pwa/src/components/DrillBreadcrumb.tsx`

### Usage

```tsx
import DrillBreadcrumb from './DrillBreadcrumb';

<DrillBreadcrumb
  items={breadcrumbs}
  onNavigate={id => handleNavigate(id)}
  onClearAll={() => clearAllFilters()}
/>;
```

### Visual Design

```
[🏠 All Data] > [Machine: A, B] > [Shift: Day]  [✕ Clear All]
```

- Home icon for root state
- Chevron separators between items
- Active item (last) is highlighted
- Clickable items navigate back
- Clear All button when filters active

### Props

```typescript
interface DrillBreadcrumbProps {
  items: BreadcrumbItem[]; // From useDrillDown or generated
  onNavigate: (id: string) => void;
  onClearAll?: () => void;
  showClearAll?: boolean; // Default: true
}

interface BreadcrumbItem {
  id: string; // 'root' or factor name
  label: string; // Display text
  isActive: boolean; // Is this the current position?
  source: DrillSource; // Chart that initiated this drill
}
```

## Layout Integration

```
┌─────────────────────────────────────────┐
│ Header                                   │
├─────────────────────────────────────────┤
│ DrillBreadcrumb (when filters active)   │
├─────────────────────────────────────────┤
│ Tab Navigation                          │
├─────────────────────────────────────────┤
│ Main Content                            │
└─────────────────────────────────────────┘
```

The breadcrumb appears above tab navigation when any filters are active.

## Core Types

From `@variscout/core`:

```typescript
type DrillType = 'highlight' | 'filter';
type DrillSource = 'ichart' | 'boxplot' | 'pareto' | 'histogram';

interface DrillAction {
  id: string;
  type: DrillType;
  source: DrillSource;
  factor?: string;
  values: (string | number)[];
  rowIndex?: number;
  timestamp: number;
  label: string;
}

interface NavigationState {
  drillStack: DrillAction[];
  currentHighlight: HighlightState | null;
}
```

## useDrillDown Hook

Location: `apps/pwa/src/hooks/useDrillDown.ts`

For advanced drill-down management with history tracking.

```tsx
import { useDrillDown } from '../hooks/useDrillDown';

const {
  drillStack, // Current drill history
  breadcrumbs, // Formatted for UI
  drillDown, // Add new drill
  drillUp, // Go back one level
  drillTo, // Navigate to specific point
  clearDrill, // Clear all
  currentHighlight,
  setHighlight,
  clearHighlight,
} = useDrillDown();
```

## Cross-Product Consistency

| Feature           | PWA              | Excel               | Azure            |
| ----------------- | ---------------- | ------------------- | ---------------- |
| Drill-down        | Full             | Read-only (slicers) | Full             |
| Breadcrumbs       | Interactive      | Display only        | Interactive      |
| Back navigation   | Click breadcrumb | Use Excel slicers   | Click breadcrumb |
| State persistence | IndexedDB        | Document Properties | Cloud save       |

### Excel Limitations

Excel Add-in uses native slicers for filtering. The breadcrumb displays current selections but cannot programmatically control slicers.

## Styling

### PWA (Tailwind CSS)

```css
/* Breadcrumb container */
bg-slate-900/50 border-b border-slate-800

/* Active breadcrumb */
bg-slate-700/50 text-white font-medium

/* Inactive breadcrumb */
text-slate-400 hover:text-white hover:bg-slate-700/30

/* Clear All button */
text-slate-400 hover:text-red-400 hover:bg-red-400/10
```

### Excel (Fluent UI)

Use Fluent UI Breadcrumb component with dark theme tokens when in Content Add-in.

## Accessibility

- Breadcrumb uses `<nav aria-label="Drill-down navigation">`
- Current page marked with `aria-current="page"`
- Clear All has `aria-label="Clear all filters"`
- Keyboard navigation: Tab through items, Enter to activate

## Related Files

| File                                          | Purpose               |
| --------------------------------------------- | --------------------- |
| `packages/core/src/navigation.ts`             | Types and utilities   |
| `apps/pwa/src/hooks/useDrillDown.ts`          | React hook            |
| `apps/pwa/src/components/DrillBreadcrumb.tsx` | UI component          |
| `apps/pwa/src/components/Dashboard.tsx`       | Integration           |
| `apps/pwa/src/components/FilterBar.tsx`       | Legacy filter display |
