---
title: Dashboard Layout Architecture
audience: [developer]
category: architecture
status: stable
related: [dashboard, layout, css-grid, responsive, charts]
---

# Dashboard Layout Architecture

Single reference for how the dashboard fits all charts into the viewport on desktop while remaining scrollable on mobile.

## Height Chain

Every container from the root to the chart SVG must have a **definite height**. If any link breaks (becomes `auto`), `withParentSize` measures unconstrained content and the chart expands infinitely.

```
h-dvh (100dvh)                            ← App.tsx root div (dvh adapts to mobile browser chrome)
  ├─ h-14 (header)                        ← AppHeader, flex-shrink-0
  ├─ flex-1 overflow-hidden               ← <main>, computed height
  │  └─ flex-1 overflow-hidden flex-col   ← content wrapper
  │     └─ h-full flex-col                ← Dashboard container
  │        │  lg:overflow-hidden
  │        ├─ sticky flex-shrink-0        ← Sticky nav (filter breadcrumb, toolbar)
  │        └─ flex-1 flex-col min-h-0     ← DashboardLayoutBase
  │           └─ lg:h-full lg:grid        ← DashboardGrid
  │              lg:grid-rows-[55fr_45fr]
  │              ├─ min-h-0 overflow-hidden  ← I-Chart row (55fr)
  │              │  └─ h-full flex-col min-h-0  ← DashboardChartCard
  │              │     └─ flex-1 min-h-0 relative  ← chart content area
  │              │        └─ absolute inset-0      ← defense-in-depth wrapper
  │              │           └─ withParentSize     ← visx measures absolute container
  │              │              └─ <svg>           ← renders at measured size
  │              └─ min-h-0 overflow-hidden  ← Bottom row (45fr)
  │                 ├─ flex-1 (Boxplot + Pareto side-by-side)
  │                 └─ lg:w-[340px] (Stats panel, fixed width)
  └─ h-8 (footer)                         ← AppFooter, flex-shrink-0
```

### Why each property matters

| Property                | Purpose                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `h-dvh`                 | Establishes the viewport constraint at the root (dvh adapts to mobile browser chrome, identical to vh on desktop) |
| `flex-1`                | Distributes remaining space after fixed-height siblings                                                           |
| `min-h-0`               | Overrides flex default `min-height: auto` so children can shrink below content size                               |
| `overflow-hidden`       | Prevents content from expanding its container; breaks circular sizing with `withParentSize`                       |
| `h-full`                | Gives the grid a definite height (100% of flex-computed parent) so `fr` units can compute pixel values            |
| `flex-shrink-0`         | Prevents sticky nav from being compressed by flex algorithm                                                       |
| `grid-rows-[55fr_45fr]` | Splits available height: 55% I-Chart, 45% bottom row                                                              |

## Layout Modes

The dashboard supports two layout modes, toggled via a segmented control in the toolbar:

| Mode               | Description                           | Overflow                     | Charts                              |
| ------------------ | ------------------------------------- | ---------------------------- | ----------------------------------- |
| **Grid** (default) | 2x2 viewport-fit CSS Grid (55fr/45fr) | `overflow-hidden` on desktop | All visible simultaneously          |
| **Scroll**         | Full-width stacked, natural scroll    | `overflow-y-auto`            | Sequential review, each chart large |

**Grid mode**: Best for overview — see all 4 charts at once. Matches the height chain pattern.

**Scroll mode**: Best for detailed review — each chart at comfortable height (I-Chart ~500px, others ~400px). Stats panel goes full-width below charts.

Layout choice persists in `displayOptions.dashboardLayout` (survives navigation). Mobile always uses scroll layout (toggle hidden).

**Implementation**: `DashboardGrid` accepts a `layout: 'grid' | 'scroll'` prop. When `scroll`, it renders a `flex flex-col gap-4 overflow-y-auto` container with `min-h-[400px]` per chart card.

## Grid Slot Mapping

```
Desktop (lg+):
┌──────────────────────────────────────────────────┐
│  I-Chart (full width)                      55fr  │
├───────────────┬───────────────┬──────────────────┤
│   Boxplot     │    Pareto     │  Stats (340px)   │
│   (flex-1)    │    (flex-1)   │  flex-shrink-0   │
└───────────────┴───────────────┘──────────────────┘
                      45fr

Mobile (<640px):            Tablet (640-1024px):
MobileChartCarousel         flex-col scroll
(one chart at a time,       (all charts stacked,
 swipe navigation)           natural overflow)
```

### Key files

| Component           | File                                                               | Purpose                                              |
| ------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| DashboardGrid       | `packages/ui/src/components/DashboardBase/DashboardGrid.tsx`       | CSS Grid layout, responsive switching                |
| DashboardChartCard  | `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx`  | Card container with header, controls, export buttons |
| DashboardLayoutBase | `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` | Orchestrates grid vs focused view, wires chart data  |
| PWA Dashboard       | `apps/pwa/src/components/Dashboard.tsx`                            | App-level wrapper, sticky nav, view mode routing     |
| Azure Dashboard     | `apps/azure/src/components/Dashboard.tsx`                          | Same + tab system (analysis/performance/yamazumi)    |
| MobileDashboard     | `apps/pwa/src/components/MobileDashboard.tsx`                      | Carousel layout for phone                            |

## Responsive Breakpoints

| Breakpoint              | Layout                   | Grid          | Charts             | Overflow          |
| ----------------------- | ------------------------ | ------------- | ------------------ | ----------------- |
| **< 640px** (phone)     | `MobileChartCarousel`    | No grid       | One at a time      | Natural scroll    |
| **640-1023px** (tablet) | `DashboardGrid` flex-col | No grid       | Stacked vertically | `overflow-y-auto` |
| **>= 1024px** (desktop) | `DashboardGrid` CSS Grid | `55fr / 45fr` | All visible        | `overflow-hidden` |

Breakpoints defined in `packages/ui/src/hooks/useMediaQuery.ts`:

- `BREAKPOINTS.phone = 640` (triggers MobileChartCarousel)
- `BREAKPOINTS.desktop = 1024` (triggers CSS Grid via `lg:` prefix)

## View Modes

The dashboard has 4 mutually exclusive rendering paths (PWA):

| Mode             | Trigger                           | Renders                                       | Grid visible? |
| ---------------- | --------------------------------- | --------------------------------------------- | ------------- |
| **Normal**       | Default                           | `DashboardLayoutBase` + `DashboardGrid`       | Yes           |
| **Focused**      | Maximize button on chart          | `FocusedViewOverlay` (replaces grid entirely) | No            |
| **Presentation** | `isPresentationMode` prop         | `PresentationView` fullscreen                 | No            |
| **Embed**        | `embedFocusChart` prop (PWA only) | `EmbedFocusView` single chart                 | No            |

Focused view is **not an overlay** — it replaces the grid in `DashboardLayoutBase` line 480:

```tsx
{focusedChart && renderFocusedView ? renderFocusedView : <DashboardGrid ... />}
```

## Panel Interactions

Panels that affect the dashboard layout:

| Panel                                   | Where rendered                          | Effect on dashboard                            |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Sticky nav (FilterBreadcrumb + toolbar) | Inside Dashboard container              | `flex-shrink-0`, reduces grid available height |
| SelectionPanel                          | Inside sticky nav (when points brushed) | Expands sticky nav height                      |
| FindingsPanel                           | Parent (App.tsx / Editor.tsx)           | Beside dashboard, not inside it                |
| CoScoutPanel                            | Parent                                  | Beside dashboard                               |
| SettingsPanel                           | Parent                                  | Overlay, no layout shift                       |
| SpecEditor                              | Inside Dashboard, absolute positioned   | Overlay, no layout shift                       |

## Chart Export

Export uses fixed off-screen dimensions (from `EXPORT_SIZES` in `useChartCopy.ts`):

| Chart     | Export Width | Export Height       |
| --------- | ------------ | ------------------- |
| I-Chart   | 1200px       | 540px               |
| Boxplot   | 1200px       | 800px               |
| Pareto    | 1200px       | 720px               |
| Stats     | 1200px       | 400px               |
| Dashboard | 1600px       | auto (scrollHeight) |

Dashboard export temporarily enables `overflow: visible; height: auto` to capture full content, then restores the grid layout.

## Defense-in-Depth: `absolute inset-0` Chart Wrapper

Inside `DashboardChartCard`, the chart content area uses the "absolute fill" pattern:

```tsx
<div className="flex-1 min-h-0 relative">
  {' '}
  {/* sized by flex algorithm */}
  <div className="absolute inset-0">
    {' '}
    {/* fills parent, cannot influence its size */}
    {children} {/* withParentSize chart */}
  </div>
</div>
```

This is the industry-standard defense against ResizeObserver circular sizing ([visx #881](https://github.com/airbnb/visx/issues/881)). An absolute-positioned child is removed from document flow, so it physically cannot expand its parent — breaking the feedback loop even if intermediate containers forget `min-h-0`.

## Tailwind v4 `@source` Requirement

Tailwind v4 (`@tailwindcss/vite`) uses automatic content detection via the Vite module graph, but in a pnpm monorepo it does **not** reliably scan linked workspace packages. Without explicit `@source` directives, responsive utility classes (`lg:grid`, `lg:flex-row`, `lg:h-full`, etc.) from `packages/ui/`, `packages/charts/`, and `packages/hooks/` will be silently missing from the CSS output — breaking the entire desktop grid layout.

**Required in each app's `index.css`** (after `@import 'tailwindcss'`):

```css
@source "../../../packages/ui/src/**/*.tsx";
@source "../../../packages/charts/src/**/*.tsx";
@source "../../../packages/hooks/src/**/*.ts";
```

**Diagnosis**: If the dashboard renders as a vertical stack on desktop (>1024px), check the compiled CSS for `lg:` rules. Zero `lg:` rules = missing `@source`.

## Body and Root Styles (PWA)

The PWA `index.css` must constrain `body` and `#root` to the viewport. Vite's default scaffold includes `min-height: 100vh` + `display: flex` + `place-items: center` on body — these must be replaced for a full-viewport app:

```css
body {
  margin: 0;
  min-width: 320px;
  height: 100dvh;
  overflow: hidden;
}

#root {
  width: 100%;
  height: 100%;
}
```

## Common Pitfalls

1. **Missing `@source` directives** — Tailwind v4 won't generate responsive classes from workspace packages, silently breaking the desktop grid
2. **Vite scaffold body styles** — `min-height: 100vh` + `place-items: center` allow body to grow beyond viewport
3. **Adding `min-height` to chart cards** — breaks grid constraint, chart expands beyond `fr` allocation
4. **Removing `overflow-hidden` from grid items** — allows `withParentSize` to measure unconstrained content
5. **Forgetting `min-h-0` on flex children** — flex default `min-height: auto` prevents shrinking
6. **Missing `h-full` on grid container** — `fr` units need definite height to compute pixel values
7. **Sticky nav without `flex-shrink-0`** — nav height becomes variable in flex calculation
8. **Using `h-screen` instead of `h-dvh`** — on mobile Safari, `100vh` includes area behind URL bar causing overflow
