# Navigation Patterns

Navigation and drill-down patterns across VariScout products.

## Overview

VariScout uses a consistent navigation model across all products:

- **Filter-based navigation**: Clicking chart elements filters data
- **Breadcrumb trail**: Shows current drill path with back navigation
- **State persistence**: Filters auto-saved in project state

## Drill-Down Behavior by Chart

| Chart   | Click Action | Effect                                           |
| ------- | ------------ | ------------------------------------------------ |
| I-Chart | Point click  | Highlight row in data table (no filter)          |
| Boxplot | Box click    | Filter + auto-switch to highest variation factor |
| Pareto  | Bar click    | Filter + auto-switch to highest variation factor |

### I-Chart (Highlight Only)

```
Click point → Opens data table with row highlighted
```

The I-Chart highlights individual data points without filtering. This preserves context while allowing inspection.

### Boxplot & Pareto (Filter Drill-down with Auto-Switch)

```
Click element → Adds filter → Charts switch to next best factor → Breadcrumb updates
Click same element → Removes filter (toggle behavior)
```

Multi-select is supported: clicking multiple elements adds all to the filter.

**Auto-Switch Logic**:

When a user drills down, the system:

1. Applies the filter (existing behavior)
2. Calculates η² (eta-squared) for all remaining factors in the filtered data
3. Switches both Boxplot and Pareto to show the factor with highest variation
4. If no factor has ≥5% variation, stays on current factor

This creates a guided "variation funnel" that leads users to the root cause:

```
Machine A (clicked) → Charts switch to Shift (67% η²)
Night Shift (clicked) → Charts switch to Operator (45% η²)
New Ops (clicked) → Charts show remaining factor (if any)
```

**Implementation**: `getNextDrillFactor()` in `@variscout/core/variation.ts`

### Pareto Comparison View (Ghost Bars)

When filters are active, Pareto can show a comparison between filtered and full population distributions:

```
PARETO: Shift (filtered to Machine A)
┌──────────────────────────────────────┐
│  ░░░░    Night causes 60% of         │
│  ████    Machine A problems          │
│  ████                                │
│  ████    But only 30% overall        │
│  ████    (ghost bar shows 30%)       │
│  ████    → Specific to Machine A!    │
│  ░░░░ ████                           │
│  ░░░░ ████ ░░░░ ████                 │
└──────────────────────────────────────┘
  ████ = Filtered %    ░░░░ = Overall %
```

**Toggle UI**: Eye icon button in Pareto header

- Only visible when filters are active
- `Eye` icon when comparison is visible
- `EyeOff` icon when hidden
- Default: OFF (hidden)

**Tooltip with Comparison**:

```
Category: Night
Count: 45
Cumulative: 60.0%
─────────────────
Filtered: 60.0%
Overall: 30.0%
↑ 30.0% vs overall  (red = over-represented)
```

**Use Case**: Reveals whether a category is over-represented (specific to filtered context) or under-represented (general pattern) compared to the full population.

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
[🏠 All Data] > [Machine: A, B ✕] > [Shift: Day ✕]  [✕ Clear All]
```

- Home icon for root state
- Chevron separators between items
- Active item (last) is highlighted
- Clickable items navigate back
- Individual × buttons on each segment (except root)
- Clear All button when filters active

### Props

```typescript
interface DrillBreadcrumbProps {
  items: BreadcrumbItem[]; // From useDrillDown or generated
  onNavigate: (id: string) => void;
  onClearAll?: () => void;
  onRemove?: (id: string) => void; // Remove individual filter
  cumulativeVariationPct?: number | null; // Show variation % badge
  compact?: boolean; // Mobile mode: chips without chevrons
  showClearAll?: boolean; // Default: true
}

interface BreadcrumbItem {
  id: string; // 'root' or factor name
  label: string; // Display text
  isActive: boolean; // Is this the current position?
  source: DrillSource; // Chart that initiated this drill
  variationPct?: number | null; // Individual step variation %
}
```

### Compact Mode (Mobile)

For mobile displays, DrillBreadcrumb supports a compact mode that shows filter chips without breadcrumb arrows:

```tsx
<DrillBreadcrumb
  items={breadcrumbs}
  onNavigate={handleNavigate}
  onClearAll={clearAll}
  compact={true}
/>
```

Visual design in compact mode:

```
[Machine: A, B ✕] [Shift: Day ✕]  Clear all
```

- Chips are displayed inline with horizontal scroll
- Each chip shows factor:values with × remove button
- "Clear all" appears when multiple filters active

## Layout Integration

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, Save indicator, 📊 ⛶ ↗ ⚙ icons)          │
├─────────────────────────────────────────────────────────┤
│ DrillBreadcrumb (when filters active)                   │
├─────────────────────────────────────┬───────────────────┤
│ Main Content (Dashboard/Regression) │ Data Panel (opt)  │
│                                     │                   │
└─────────────────────────────────────┴───────────────────┘
```

**Notes:**

- Analysis view switching (Dashboard, Regression, Gage R&R) is in the Settings Panel (⚙), not top tabs
- Data Panel is toggled via the 📊 button in the header
- DrillBreadcrumb appears in sticky navigation when any filters are active

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

| File                                             | Purpose                                       |
| ------------------------------------------------ | --------------------------------------------- |
| `packages/core/src/navigation.ts`                | Types and utilities                           |
| `packages/core/src/variation.ts`                 | Auto-switch logic (η²)                        |
| `apps/pwa/src/hooks/useDrillDown.ts`             | React hook                                    |
| `apps/pwa/src/components/DrillBreadcrumb.tsx`    | Unified filter display (breadcrumb + compact) |
| `apps/pwa/src/components/FactorSelector.tsx`     | Segmented factor control                      |
| `apps/pwa/src/components/Dashboard.tsx`          | Integration                                   |
| `apps/pwa/src/components/charts/ParetoChart.tsx` | Pareto with ghost bars                        |
