# Chart Export Reference

## Contents

1. [Export dimensions table](#export-dimensions)
2. [Group semantics](#group-semantics)
3. [Dashboard auto-height mode](#dashboard-auto-height-mode)
4. [Pixel ratio and font breakpoint](#pixel-ratio-and-font-breakpoint)
5. [Components and implementation](#components-and-implementation)

---

## Export dimensions

All fixed dimensions live in `EXPORT_SIZES` in `packages/hooks/src/useChartCopy.ts`.

| Group     | Chart / Key  | Width (px) | Height (px) | Aspect ratio  |
|-----------|--------------|------------|-------------|---------------|
| Wide      | `ichart`     | 1200       | 540         | 2.2 : 1       |
| Wide      | `boxplot`    | 1200       | 800         | 3 : 2         |
| Wide      | `pareto`     | 1200       | 720         | 5 : 3         |
| Wide      | `scatter`    | 1200       | 800         | 3 : 2         |
| Wide      | `yamazumi`   | 1200       | 800         | 3 : 2         |
| Text      | `stats`      | 1200       | 400         | 3 : 1         |
| Compact   | `histogram`  | 800        | 600         | 4 : 3         |
| Compact   | `probability`| 800        | 700         | ~1.14 : 1     |
| Composite | `dashboard`  | 1600       | auto (0)    | 16 : 9 target |
| Slide     | `slide`      | 1920       | 1080        | 16 : 9        |

> **Source:** `EXPORT_SIZES` constant in `packages/hooks/src/useChartCopy.ts` line 6-17.
> The table in `rules/charts.md` omits `scatter` and `slide` — trust this file as the canonical list.

---

## Group semantics

**Wide (1200 px):** Standard analysis charts. During export the container is temporarily placed off-screen at the export width; visx `withParentSize` fires its `ResizeObserver`, React re-renders at the new size, then the capture runs. Wide charts render at the desktop font breakpoint (≥ 768 px) regardless of the source view's actual width.

**Compact (800 px):** Histogram and probability plot. Same resize-wait-capture flow. Desktop font breakpoint still applies.

**Text (1200 × 400):** Stats panel export. Tall enough for summary KPIs, wide enough to avoid text wrapping.

**Composite (1600 px, auto height):** Dashboard capture. See [Dashboard auto-height mode](#dashboard-auto-height-mode) below.

**Slide (1920 × 1080):** Full-bleed presentation slide export. Not wired to a standard chart type; available for explicit key `'slide'`.

---

## Dashboard auto-height mode

Dashboard uses `height: 0` in `EXPORT_SIZES`, which triggers auto-height capture:

- The container receives `height: auto !important; overflow: visible !important;` during export
- Capture reads `scrollHeight` to capture the full scrollable content
- Width is fixed at 1600 px, which triggers the `lg:flex-row` Tailwind breakpoint for side-by-side chart layout
- Navigation bar elements that should not appear in the export must be marked `data-export-hide`; `useChartCopy` hides them during capture

---

## Pixel ratio and font breakpoint

All exports use `pixelRatio: 2` — the captured bitmap is double the logical pixel dimensions (2400 × 1080 for a 1200 × 540 export). This produces retina-quality output suitable for slides and print.

Wide charts (≥ 1200 px wide) render at the desktop font breakpoint (≥ 768 px) during export. Charts that would normally render at mobile font sizes on a narrow screen will use desktop font sizes when exported.

Default background: `#0f172a` (slate-950 / dark theme). Supply `getBackgroundColor` callback to `useChartCopy` options to override (e.g., for light-theme export).

---

## Components and implementation

### `useChartCopy` (hook)

Location: `packages/hooks/src/useChartCopy.ts`

```typescript
import { useChartCopy } from '@variscout/hooks';

const { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg } = useChartCopy({
  getBackgroundColor: () => isDark ? '#0f172a' : '#ffffff',
});
```

Returns:
- `copyFeedback: string | null` — set to chart name for 2 s after successful copy/download; use to drive Check-icon feedback
- `handleCopyChart(containerId, chartName)` — copies PNG to clipboard
- `handleDownloadPng(containerId, chartName)` — downloads PNG file
- `handleDownloadSvg(containerId, chartName)` — downloads SVG file

All three methods: find element by `containerId`, resize to `EXPORT_SIZES[chartName]`, await two `requestAnimationFrame` + 100 ms settle, capture, restore original styles.

### `ChartDownloadMenu` (component)

Location: `packages/ui/src/` (exported from `@variscout/ui`)

Dropdown offering PNG and SVG download options. Uses `colorScheme` pattern for theming. Compose with a separate inline copy button (Check feedback icon on success, `size={14}` for all icons).

### Resize mechanics

1. Element located by `containerId`
2. Parent `minHeight` locked to prevent layout jump
3. Element moved off-screen (`position: fixed; left: -9999px`) at export dimensions
4. Two `requestAnimationFrame` calls + 100 ms timeout to allow visx `ResizeObserver` + React re-render
5. Capture runs (clipboard write or link click for download)
6. Original `style.cssText` restored; parent `minHeight` restored
7. One final `requestAnimationFrame` to settle layout
