# Responsive Charts

Charts adapt to container size using responsive utilities.

## Breakpoints

| Name    | Width     | Typical Usage          |
| ------- | --------- | ---------------------- |
| Mobile  | < 400px   | Phone portrait         |
| Tablet  | 400-768px | Tablet/phone landscape |
| Desktop | > 768px   | Desktop/laptop         |

## Responsive Utilities

Import from `@variscout/charts`:

```tsx
import {
  getResponsiveMargins,
  getResponsiveFonts,
  getResponsiveTickCount,
} from '@variscout/charts';
```

### Margins

```tsx
const margin = getResponsiveMargins(parentWidth, chartType, extraBottom);
```

**Chart type margins (desktop):**

| Chart       | Top | Right | Bottom | Left |
| ----------- | --- | ----- | ------ | ---- |
| ichart      | 40  | 60    | 60     | 70   |
| boxplot     | 20  | 20    | 60     | 70   |
| pareto      | 20  | 20    | 60     | 70   |
| histogram   | 20  | 20    | 40     | 40   |
| probability | 20  | 20    | 40     | 50   |
| scatter     | 20  | 20    | 50     | 50   |

**Scaling:**

- Mobile (< 400px): 50-75% of base
- Tablet (400-768px): 70-85% of base
- Desktop: 100% of base

### Fonts

```tsx
const fonts = getResponsiveFonts(parentWidth);
// Returns: { tickLabel, axisLabel, statLabel }
```

| Breakpoint | tickLabel | axisLabel | statLabel |
| ---------- | --------- | --------- | --------- |
| < 400px    | 8px       | 9px       | 10px      |
| 400-768px  | 9px       | 10px      | 11px      |
| > 768px    | 11px      | 13px      | 12px      |

### Tick Count

```tsx
const xTicks = getResponsiveTickCount(parentWidth, 'x');
const yTicks = getResponsiveTickCount(parentHeight, 'y');
```

**X-axis ticks:**
| Width | Ticks |
|-------|-------|
| < 200px | 3 |
| 200-400px | 5 |
| 400-600px | 7 |
| > 600px | 10 |

**Y-axis ticks:**
| Height | Ticks |
|--------|-------|
| < 150px | 3 |
| 150-250px | 5 |
| > 250px | 7 |

## Using withParentSize

The `withParentSize` HOC from Visx handles responsive sizing:

```tsx
import { withParentSize } from '@visx/responsive';

const ChartBase: React.FC<ChartProps> = ({ parentWidth, parentHeight, ...props }) => {
  const margin = getResponsiveMargins(parentWidth, 'ichart');
  const fonts = getResponsiveFonts(parentWidth);

  const width = parentWidth - margin.left - margin.right;
  const height = parentHeight - margin.top - margin.bottom;

  // Render chart...
};

export default withParentSize(ChartBase);
```

## Container Requirements

For responsive charts to work, the parent container must have defined dimensions:

```tsx
// PWA - flex container
<div className="flex-1 min-h-0">
  <IChart data={data} />
</div>

// Fixed height
<div style={{ height: 400 }}>
  <IChart data={data} />
</div>
```

## Mobile Optimizations

At small sizes, charts automatically:

1. Reduce axis tick count
2. Shrink margins
3. Hide axis labels if too crowded
4. Simplify tooltips

### Example: Hide label on small width

```tsx
<AxisBottom label={parentWidth > 250 ? 'X Value' : ''} labelOffset={parentWidth < 400 ? 24 : 32} />
```

## PWA Breakpoints

The PWA uses Tailwind breakpoints for layout:

| Breakpoint | Width  | Usage                 |
| ---------- | ------ | --------------------- |
| sm         | 640px  | Mobile/desktop toggle |
| md         | 768px  | Grid column changes   |
| lg         | 1024px | Full desktop layout   |

```tsx
// Mobile detection in Dashboard
const MOBILE_BREAKPOINT = 640;
const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
```

## Panel Sizing

Dashboard panels use `react-resizable-panels` with:

- Default split: 40% I-Chart / 60% bottom
- Min size: 20% per panel
- Persisted to localStorage

```tsx
<PanelGroup orientation="vertical">
  <Panel defaultSize={40} minSize={20}>
    {/* I-Chart */}
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={60} minSize={20}>
    {/* Bottom charts */}
  </Panel>
</PanelGroup>
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Overview](./overview.md) - Chart architecture and common patterns
- [Colors](./colors.md) - Data visualization color palette
- [Hooks](./hooks.md) - useChartLayout for responsive layout
- [Utilities](./utilities.md) - Accessibility and interaction helpers
