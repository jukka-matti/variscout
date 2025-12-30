# Charts Package Rules (@variscout/charts)

## Component Pattern

- All charts are **props-based** (no context dependency)
- Export both wrapped and base components:
  - `IChart` - Responsive wrapper (uses `withParentSize`)
  - `IChartBase` - Raw component for custom sizing

## Props Interface

```typescript
interface ChartProps extends BaseChartProps {
  data: DataType[];
  specs: SpecLimits;
  showBranding?: boolean;
  // ... chart-specific props
}
```

## Responsive Utilities

- `getResponsiveMargins(width, chartType, extraBottom)`
- `getResponsiveFonts(width)` - Returns tick/axis/stat font sizes
- `getResponsiveTickCount(size, axis)` - Optimal tick count

## Branding

- `ChartSourceBar` component for footer branding
- `getSourceBarHeight(showBranding)` for margin calculations
- Controlled by edition system in `@variscout/core`

## Adding New Charts

1. Create `NewChart.tsx` with `NewChartBase` export
2. Add to `packages/charts/src/index.ts` exports
3. Add props interface to `types.ts`
