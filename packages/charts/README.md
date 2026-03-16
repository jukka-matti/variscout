# @variscout/charts

React + Visx chart components for VariScout.

## Installation

```json
{
  "dependencies": {
    "@variscout/charts": "workspace:*"
  }
}
```

## Components

All charts are **props-based** (no context dependency). Each exports a responsive wrapper and a base component.

| Component               | Base Export                 | Purpose                                     |
| ----------------------- | --------------------------- | ------------------------------------------- |
| `IChart`                | `IChartBase`                | Individual values over time (control chart) |
| `Boxplot`               | `BoxplotBase`               | Factor comparison with optional violin mode |
| `ParetoChart`           | `ParetoChartBase`           | Problem concentration ranking               |
| `CapabilityHistogram`   | `CapabilityHistogramBase`   | Specification compliance histogram          |
| `ProbabilityPlot`       | `ProbabilityPlotBase`       | Normal probability plot                     |
| `PerformanceIChart`     | `PerformanceIChartBase`     | Multi-channel Cpk scatter                   |
| `PerformanceBoxplot`    | `PerformanceBoxplotBase`    | Multi-channel distribution comparison       |
| `PerformancePareto`     | `PerformanceParetoBase`     | Multi-channel Cpk ranking                   |
| `PerformanceCapability` | `PerformanceCapabilityBase` | Single channel histogram                    |
| `ChartSourceBar`        | -                           | Footer branding bar                         |

## Theme Support

Use `useChartTheme` for automatic dark/light and technical/executive mode:

```tsx
import { useChartTheme } from '@variscout/charts';

const { isDark, mode, chrome, colors, fontScale } = useChartTheme();
```

## Color Constants

All chart colors are centralized in `src/colors.ts`:

```tsx
import { chartColors, chromeColors, operatorColors } from '@variscout/charts';
```

Never hardcode hex values — always use color constants.

## Testing

```bash
pnpm --filter @variscout/charts test
```

## Related

- [Chart Rules](../../.claude/rules/charts.md) — full API reference and conventions
- [Core Package](../core/README.md)
- [Hooks Package](../hooks/README.md)
