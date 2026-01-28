# Color System

VariScout uses CSS variables with Tailwind semantic classes for theme-aware styling.

## Theme Support

| Edition       | Dark | Light | System Pref | Company Accent |
| ------------- | :--: | :---: | :---------: | :------------: |
| Community/ITC |  ✓   |   -   |      -      |       -        |
| Licensed      |  ✓   |   ✓   |      ✓      |       ✓        |

## CSS Variables

Defined in `apps/pwa/src/index.css`, these variables use RGB format for alpha support:

```css
:root,
[data-theme='dark'] {
  --surface-primary: 15 23 42; /* slate-900 */
  --surface-secondary: 30 41 59; /* slate-800 */
  --surface-tertiary: 51 65 85; /* slate-700 */
  --content-primary: 226 232 240; /* slate-200 */
  --content-secondary: 148 163 184; /* slate-400 */
  --content-muted: 100 116 139; /* slate-500 */
  --edge-primary: 51 65 85; /* slate-700 */
}

[data-theme='light'] {
  --surface-primary: 248 250 252; /* slate-50 */
  --surface-secondary: 241 245 249; /* slate-100 */
  --surface-tertiary: 226 232 240; /* slate-200 */
  --content-primary: 15 23 42; /* slate-900 */
  --content-secondary: 71 85 105; /* slate-600 */
  --content-muted: 100 116 139; /* slate-500 */
  --edge-primary: 226 232 240; /* slate-200 */
}
```

## Semantic Tailwind Classes

Configured in `packages/ui/tailwind.config.cjs`:

### Surface Colors (Backgrounds)

| Semantic Class         | CSS Variable          | Dark      | Light     | Usage                 |
| ---------------------- | --------------------- | --------- | --------- | --------------------- |
| `bg-surface`           | `--surface-primary`   | `#0f172a` | `#f8fafc` | App background        |
| `bg-surface-secondary` | `--surface-secondary` | `#1e293b` | `#f1f5f9` | Cards, panels         |
| `bg-surface-tertiary`  | `--surface-tertiary`  | `#334155` | `#e2e8f0` | Hover states, inputs  |
| `bg-surface-elevated`  | `--surface-elevated`  | `#475569` | `#ffffff` | Active/pressed states |

### Content Colors (Text)

| Semantic Class           | CSS Variable          | Dark      | Light     | Usage                 |
| ------------------------ | --------------------- | --------- | --------- | --------------------- |
| `text-content`           | `--content-primary`   | `#e2e8f0` | `#0f172a` | Main text, headings   |
| `text-content-secondary` | `--content-secondary` | `#94a3b8` | `#475569` | Labels, descriptions  |
| `text-content-muted`     | `--content-muted`     | `#64748b` | `#64748b` | Placeholder, disabled |

### Edge Colors (Borders)

| Semantic Class          | CSS Variable       | Dark      | Light     | Usage        |
| ----------------------- | ------------------ | --------- | --------- | ------------ |
| `border-edge`           | `--edge-primary`   | `#334155` | `#e2e8f0` | Card borders |
| `border-edge-secondary` | `--edge-secondary` | `#475569` | `#cbd5e1` | Dividers     |

## Status Colors (Universal)

These colors have **consistent semantic meaning** across both themes:

| Token   | Hex       | Tailwind Class   | Usage                           |
| ------- | --------- | ---------------- | ------------------------------- |
| success | `#22c55e` | `text-green-500` | Pass, in-spec, valid            |
| danger  | `#ef4444` | `text-red-500`   | Fail, out of spec (high), error |
| warning | `#f59e0b` | `text-amber-500` | Warning, out of spec (low)      |

### Status Usage in Data Analysis

| Scenario                 | Color             | Meaning              |
| ------------------------ | ----------------- | -------------------- |
| Value within spec limits | Green (`#22c55e`) | Pass                 |
| Value > USL              | Red (`#ef4444`)   | Fail (too high)      |
| Value < LSL              | Amber (`#f59e0b`) | Fail (too low)       |
| Cpk >= 1.33              | Green             | Excellent capability |
| Cpk 1.0-1.33             | Amber             | Acceptable, monitor  |
| Cpk < 1.0                | Red               | Needs improvement    |

## Brand Colors

| Token         | Hex       | Tailwind Class      | Usage                    |
| ------------- | --------- | ------------------- | ------------------------ |
| brand-primary | `#3b82f6` | `bg-blue-600`       | Primary buttons, accents |
| brand-hover   | `#2563eb` | `hover:bg-blue-700` | Hover state              |
| brand-light   | `#60a5fa` | `text-blue-400`     | Links, highlights        |

### Company Accent (Licensed Only)

Licensed users can customize the accent color via Settings > Appearance:

```tsx
// ThemeContext applies custom accent as CSS variable
document.documentElement.style.setProperty('--company-accent', '#8b5cf6');
```

## Chart Colors

See [Charts > Colors](../charts/colors.md) for data visualization colors.

Charts use the `useChartTheme()` hook for theme-aware chrome colors:

```tsx
import { useChartTheme } from '@variscout/charts';

const { isDark, chrome } = useChartTheme();
// chrome.gridLine, chrome.labelPrimary, chrome.tooltipBg, etc.
```

## Implementation Examples

### PWA Component

```jsx
// Theme-aware card
<div className="bg-surface-secondary border border-edge rounded-lg p-4">
  <h2 className="text-content font-semibold">Title</h2>
  <p className="text-content-secondary">Description</p>
  <span className="text-content-muted text-sm">Metadata</span>
</div>

// Status display
<span className="text-green-500">In Spec</span>
<span className="text-red-500">Out of Spec</span>
```

### Excel Add-in

```tsx
import { darkTheme } from '../lib/darkTheme';

const styles = {
  card: {
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderColor: darkTheme.colorNeutralStroke1,
  },
  successText: {
    color: darkTheme.colorStatusSuccess,
  },
};
```

### Chart SVG

```tsx
import { useChartTheme, chartColors } from '@variscout/charts';

const { chrome } = useChartTheme();

// Theme-aware chrome
<Line stroke={chrome.gridLine} />
<text fill={chrome.labelPrimary}>Axis Label</text>

// Universal data colors
const getPointColor = (value: number, usl?: number, lsl?: number) => {
  if (usl !== undefined && value > usl) return chartColors.fail;    // Red
  if (lsl !== undefined && value < lsl) return chartColors.fail;    // Red (treat as failure)
  return chartColors.mean; // Blue (In Control)
};
```

## Accessibility

All color combinations meet WCAG AA contrast requirements:

- Text on background: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio
- UI components: minimum 3:1 ratio

| Combination                                    | Dark Ratio | Light Ratio | Pass |
| ---------------------------------------------- | ---------- | ----------- | ---- |
| text-content on bg-surface                     | 13.5:1     | 15.4:1      | AAA  |
| text-content-secondary on bg-surface-secondary | 5.2:1      | 4.8:1       | AA   |
| green-500 on bg-surface-secondary              | 4.8:1      | 4.5:1       | AA   |
| red-500 on bg-surface-secondary                | 4.6:1      | 4.3:1       | AA   |
