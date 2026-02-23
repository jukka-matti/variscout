# Executive Mode

Consulting-grade chart styling for professional reports, following top-tier management consulting standards (McKinsey, Bain, BCG).

## Philosophy

- **Data-First**: The data is the hero. Chrome (axes, grids, borders) should recede.
- **Clean & Minimal**: Remove unnecessary decorations. High data-ink ratio.
- **Authoritative**: Strong, high-contrast colors for data; subtle neutrals for context.
- **Typography**: Professional sans-serif fonts (Inter) with clear hierarchy.

## Enabling Executive Mode

Set `data-chart-mode="executive"` on the `<html>` element:

```html
<html data-chart-mode="executive" data-theme="light"></html>
```

The `useChartTheme` hook detects this attribute automatically and switches all chart colors to the executive palette. See [hooks.md](./hooks.md) for the full `useChartTheme` API.

## Color Palette

Executive mode uses `executiveColors` for data and `executiveChrome` for UI chrome, both defined in `packages/charts/src/colors.ts`.

### Status Colors

| Role          | Color       | Hex       | Note                         |
| ------------- | ----------- | --------- | ---------------------------- |
| **Pass**      | Emerald     | `#10b981` | Muted, professional green    |
| **Fail**      | Red         | `#ef4444` | Standard red for clarity     |
| **Warning**   | Amber       | `#f59e0b` | Standard warning color       |
| **Violation** | Deep Orange | `#ea580c` | Distinct from simple warning |

### Data & Reference Lines

| Role               | Color      | Hex       | Note                                  |
| ------------------ | ---------- | --------- | ------------------------------------- |
| **Primary / Mean** | Navy/Black | `#0f172a` | Nearly black for authority            |
| **Target**         | Emerald    | `#10b981` | Matching pass state                   |
| **Spec Limits**    | Slate      | `#94a3b8` | Subtle, context only (don't distract) |
| **Control Limits** | Slate      | `#64748b` | Slightly darker context               |
| **Linear Fit**     | Navy/Black | `#0f172a` | Authority line                        |
| **Quadratic Fit**  | Slate      | `#475569` | Secondary analysis                    |
| **Cumulative**     | Slate      | `#475569` | Distinct from bars                    |

### Chrome (UI Elements)

Executive chrome is **light-mode only** (executive reports are rarely dark mode):

| Element            | Hex       | Note                    |
| ------------------ | --------- | ----------------------- |
| Tooltip background | `#ffffff` | White                   |
| Grid lines         | `#e2e8f0` | Very subtle (slate-200) |
| Axis primary       | `#cbd5e1` | Subtle axis (slate-300) |
| Axis secondary     | `#e2e8f0` | Nearly invisible        |
| Label primary      | `#334155` | Readable (slate-700)    |
| Label secondary    | `#64748b` | Secondary text          |
| Point stroke       | `#ffffff` | White for separation    |
| Box fill           | `#94a3b8` | Neutral slate           |
| Box border         | `#475569` | Darker contrast         |

## Typography

- **Font Family**: `Inter`, `system-ui`, `sans-serif`
- **Axis Labels**: Inter Medium (500), distinct from data
- **Tick Labels**: Inter Medium (500) with `fontFamily: 'Inter, sans-serif'`
- **Signatures**: Professional sans-serif watermark, not handwritten

## Layout Principles

1. **Grid Lines**: Extremely subtle (slate-200), dashed with reduced opacity (`strokeDasharray="2,4"`, `strokeOpacity={0.5}`)
2. **Axes**: Minimalist. Left axis stroke set to `transparent` in executive mode to remove bounding box
3. **Whitespace**: Generous padding around the chart to let data breathe
4. **Data Points**: Smaller radius (3px vs 4px standard), thicker stroke (1.5px) for crisp definition
5. **Data Line**: Thicker (1.5px) with lower opacity (0.3) for subtle connection

## Implementation Details

### Color Resolution in useChartTheme

```typescript
const { isDark, mode, chrome, colors, fontScale } = useChartTheme();

// When mode === 'executive':
// chrome = executiveChrome (always, regardless of isDark)
// colors = executiveColors

// When mode === 'technical':
// chrome = isDark ? chromeColors : chromeColorsLight
// colors = chartColors
```

### Conditional Rendering in Charts

Charts apply executive styling conditionally:

```tsx
const { chrome, mode } = useChartTheme();
const isExecutive = mode === 'executive';

// Grid: dashed + low opacity in executive
<GridRows
  stroke={chrome.gridLine}
  strokeDasharray={isExecutive ? '2,4' : undefined}
  strokeOpacity={isExecutive ? 0.5 : 1}
/>

// Axes: hidden stroke in executive
<AxisLeft
  stroke={isExecutive ? 'transparent' : chrome.axisPrimary}
  tickLabelProps={() => ({
    fontFamily: isExecutive ? 'Inter, sans-serif' : 'monospace',
    fontWeight: isExecutive ? 500 : 400,
  })}
/>
```

### Function API

```typescript
import { getChartColors, getChromeColors } from '@variscout/charts';

// Get data colors
const colors = getChartColors('executive'); // executiveColors
const colors = getChartColors('technical'); // chartColors (default)

// Get chrome colors (executive ignores isDark)
const chrome = getChromeColors(true, 'executive'); // executiveChrome
const chrome = getChromeColors(false, 'executive'); // executiveChrome
const chrome = getChromeColors(true, 'technical'); // chromeColors (dark)
const chrome = getChromeColors(false, 'technical'); // chromeColorsLight
```

## Background Colors

- **Azure App**: Pure white (`#ffffff`) background recommended for executive reports
- **PWA**: Context-aware (supports both dark/light themes in technical mode)

---

## See Also

- [Colors](./colors.md) - Full color constant reference including executive palette
- [Hooks](./hooks.md) - useChartTheme hook API
- [Overview](./overview.md) - Chart design system overview
