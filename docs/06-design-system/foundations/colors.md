# Color System

VariScout uses CSS variables with Tailwind semantic classes for theme-aware styling.

## Theme Support

| Product    | Dark | Light | System Pref | Company Accent |
| ---------- | :--: | :---: | :---------: | :------------: |
| PWA (Free) |  ✓   |   -   |      -      |       -        |
| Azure App  |  ✓   |   ✓   |      ✓      |       ✓        |

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

| Scenario                 | Color             | Meaning                                |
| ------------------------ | ----------------- | -------------------------------------- |
| Value within spec limits | Green (`#22c55e`) | Pass                                   |
| Value > USL              | Red (`#ef4444`)   | Fail (too high)                        |
| Value < LSL              | Amber (`#f59e0b`) | Fail (too low)                         |
| Cpk >= target            | Green             | Meets capability target (default 1.33) |
| Cpk >= 75% of target     | Amber             | Approaching target, monitor            |
| Cpk < 75% of target      | Red               | Needs improvement                      |

## Brand Colors

| Token         | Hex       | Tailwind Class      | Usage                    |
| ------------- | --------- | ------------------- | ------------------------ |
| brand-primary | `#3b82f6` | `bg-blue-600`       | Primary buttons, accents |
| brand-hover   | `#2563eb` | `hover:bg-blue-700` | Hover state              |
| brand-light   | `#60a5fa` | `text-blue-400`     | Links, highlights        |

### Company Accent (Azure App Only)

Azure App users can customize the accent color via Settings > Appearance. The `useThemeState` hook sets two CSS variables on `<html>`:

| Variable       | Format      | Example      | Usage                                        |
| -------------- | ----------- | ------------ | -------------------------------------------- |
| `--accent`     | RGB triplet | `139 92 246` | Tailwind `rgb(var(--accent))` utilities      |
| `--accent-hex` | Hex string  | `#8b5cf6`    | Inline `style` where `rgb()` isn't practical |

When no accent is set, both variables are removed and consumers fall back to their defaults.

**Surfaces that consume `--accent-hex`:**

| Component          | Property                  | Fallback                           |
| ------------------ | ------------------------- | ---------------------------------- |
| `ChartSourceBar`   | Branding dot fill         | `accentColor` prop (blue-500)      |
| `FilterContextBar` | Variation percentage text | `#60a5fa` (blue-400)               |
| `ChartCard`        | Hover border color        | `var(--color-edge-hover, #475569)` |

PWA has no accent set, so these surfaces always use their fallback values.

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
  if (lsl !== undefined && value < lsl) return chartColors.warning; // Amber
  return chartColors.pass; // Green
};
```

## Shared Component Color Schemes

Components in `@variscout/ui` use a **colorScheme prop pattern** for platform-agnostic styling:

### Pattern Overview

```tsx
// Component defines color scheme interface
interface ComponentColorScheme {
  containerBg: string; // Tailwind class for background
  border: string; // Tailwind class for borders
  textMuted: string; // Tailwind class for muted text
  // ... component-specific color slots
}

// Default uses PWA semantic tokens
const defaultColorScheme: ComponentColorScheme = {
  containerBg: 'bg-surface-secondary',
  border: 'border-edge',
  textMuted: 'text-content-muted',
};
```

### Color Scheme Mapping

Both PWA and Azure use the same semantic tokens. The Slate equivalents are shown for historical reference (Azure previously used hardcoded Slate classes before the visual convergence migration):

| Semantic Token           | Resolved Value (Dark)  | Usage               |
| ------------------------ | ---------------------- | ------------------- |
| `bg-surface`             | `bg-slate-900`         | Main container      |
| `bg-surface-secondary`   | `bg-slate-800`         | Cards, panels       |
| `bg-surface-tertiary/50` | `bg-slate-700/50`      | Hover backgrounds   |
| `border-edge`            | `border-slate-700`     | Primary borders     |
| `border-edge-secondary`  | `border-slate-600`     | Secondary borders   |
| `text-content`           | `text-white`           | Primary text        |
| `text-content-secondary` | `text-slate-400`       | Secondary text      |
| `text-content-muted`     | `text-slate-500`       | Muted/disabled text |
| `hover:text-content`     | `hover:text-slate-300` | Hover text          |

### Available Color Schemes

Each component exports a single `defaultColorScheme` using semantic tokens. Both PWA and Azure apps use these defaults:

| Component                   | Default Export                            | Notes                              |
| --------------------------- | ----------------------------------------- | ---------------------------------- |
| `FilterBreadcrumb`          | `filterBreadcrumbDefaultColorScheme`      | Semantic tokens, used by both apps |
| `FilterChipDropdown`        | `filterChipDropdownDefaultColorScheme`    | Semantic tokens, used by both apps |
| `VariationBar`              | `variationBarDefaultColorScheme`          | Semantic tokens, used by both apps |
| `AnovaResults`              | `anovaDefaultColorScheme`                 | Semantic tokens, used by both apps |
| `YAxisPopover`              | `yAxisPopoverDefaultColorScheme`          | Semantic tokens, used by both apps |
| `PerformanceSetupPanelBase` | `performanceSetupPanelDefaultColorScheme` | Semantic tokens, used by both apps |

### Usage in Apps

Both PWA and Azure use the default color scheme (semantic tokens). No explicit `colorScheme` prop is needed:

```tsx
import { FilterBreadcrumb } from '@variscout/ui';

// Default colorScheme uses semantic tokens — works for both PWA and Azure
<FilterBreadcrumb {...props} />;
```

### Nested Color Schemes

Some components contain other themeable components. They use nested color schemes:

```tsx
interface FilterBreadcrumbColorScheme {
  containerBg: string;
  border: string;
  // Nested schemes for child components
  variationBar: VariationBarColorScheme;
  dropdown: FilterChipDropdownColorScheme;
}
```

### Creating New Color Schemes

When extracting a component to `@variscout/ui`:

1. **Identify color slots** needed by the component
2. **Create interface** with all color slots
3. **Define default scheme** using semantic tokens
4. **Export** from component index and main package index

```tsx
// packages/ui/src/components/MyComponent/MyComponent.tsx
export interface MyComponentColorScheme {
  background: string;
  text: string;
  border: string;
}

export const defaultColorScheme: MyComponentColorScheme = {
  background: 'bg-surface-secondary',
  text: 'text-content',
  border: 'border-edge',
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
