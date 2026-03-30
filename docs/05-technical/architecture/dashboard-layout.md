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
  │        ├─ sticky flex-shrink-0        ← ProcessHealthBar + SelectionPanel
  │        └─ flex-1 flex-col min-h-0     ← DashboardLayoutBase
  │           └─ lg:h-full lg:grid        ← DashboardGrid
  │              lg:grid-rows-[55fr_45fr]
  │              ├─ min-h-0 overflow-hidden  ← Row 1: I-Chart (55fr)
  │              │  └─ h-full flex-col min-h-0  ← DashboardChartCard
  │              │     └─ flex-1 min-h-0 relative  ← chart content area
  │              │        └─ absolute inset-0      ← defense-in-depth wrapper
  │              │           └─ withParentSize     ← visx measures absolute container
  │              │              └─ <svg>           ← renders at measured size
  │              └─ min-h-0 overflow-hidden  ← Row 2: Boxplot + Pareto + VerificationCard (45fr)
  │                 ├─ flex-1 (Boxplot)
  │                 ├─ flex-1 (Pareto, when factor selected)
  │                 └─ flex-1 (VerificationCard: tabbed Histogram | Prob Plot)
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
| `flex-shrink-0`         | Prevents ProcessHealthBar from being compressed by flex algorithm                                                 |
| `grid-rows-[55fr_45fr]` | Splits available height: 55% I-Chart, 45% bottom row (Boxplot + Pareto + VerificationCard)                        |

## Layout Modes

The dashboard supports two layout modes, toggled via a segmented control in the ProcessHealthBar:

| Mode               | Description                             | Overflow                     | Charts                              |
| ------------------ | --------------------------------------- | ---------------------------- | ----------------------------------- |
| **Grid** (default) | 2-row viewport-fit CSS Grid (55fr/45fr) | `overflow-hidden` on desktop | All slots visible simultaneously    |
| **Scroll**         | Full-width stacked, natural scroll      | `overflow-y-auto`            | Sequential review, each chart large |

**Grid mode**: Best for overview — see all charts at once (I-Chart, Boxplot, Pareto, VerificationCard). Row 2 always shows Boxplot + Pareto + tabbed VerificationCard (Histogram / Probability Plot).

**Scroll mode**: Best for detailed review — each chart at comfortable height (I-Chart ~500px, others ~400px). Stats panel uses tabbed layout (Summary/Histogram/Probability Plot) since charts are already stacked sequentially.

Layout choice persists in `displayOptions.dashboardLayout` (survives navigation). Mobile always uses scroll layout (toggle hidden).

**Implementation**: `DashboardGrid` accepts a `layout: 'grid' | 'scroll'` prop. When `scroll`, it renders a `flex flex-col gap-4 overflow-y-auto` container with `min-h-[400px]` per chart card.

## Panel Sidebars

The dashboard supports cross-cutting sidebars that coexist with the chart grid. All sidebars are toggle-able from the header and resizable via drag handles.

```
┌──────┬──────────────────────────────┬────────┐
│Stats │   Charts (center grid)       │Right   │
│/Data │                              │panel(s)│
│(left,│   responsive grid            │(resiz.)│
│resiz)│   or scroll stack            │        │
└──────┴──────────────────────────────┴────────┘
```

| Sidebar        | Side  | Width Range | Default | Content                                                                                                             | Resize      |
| -------------- | ----- | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Stats/Data** | Left  | 280-500px   | 320px   | Summary (stats + target discovery), Data table, What-If (3 tabs). Histogram/ProbPlot in VerificationCard grid slot. | Drag handle |
| **Findings**   | Right | 320-600px   | 384px   | Finding cards, board view, hypothesis tree                                                                          | Drag handle |
| **CoScout**    | Right | 320-600px   | 384px   | AI conversation, phase-adaptive coaching                                                                            | Drag handle |
| **Data Panel** | Right | 280-600px   | 350px   | Data table, row highlighting, violations                                                                            | Drag handle |

### Resize Implementation

All resizable panels use `useResizablePanel(storageKey, min, max, default, side)` from `@variscout/hooks`:

- **Right panels**: width = `window.innerWidth - e.clientX`
- **Left panels**: width = `e.clientX`
- Width persists in `localStorage` per panel
- Drag handle: 1px vertical bar with `GripVertical` icon, highlights blue on hover/drag
- Mobile: sidebars render as full-screen overlays (no resize)

### Grid Adaptation When Sidebars Open

The center chart grid **compresses naturally** via flexbox as sidebars take horizontal space:

| State                    | Center width (1440px screen) | Grid behavior                                               |
| ------------------------ | ---------------------------- | ----------------------------------------------------------- |
| All sidebars closed      | ~1440px                      | Full 2-row grid: I-Chart + Boxplot/Pareto/VerificationCard  |
| Stats sidebar open       | ~1120px                      | VerificationCard stays in row 2; charts compress width      |
| Findings panel open      | ~1060px                      | Grid compresses, charts resize via visx responsive wrappers |
| Both sidebars open       | ~740px                       | Charts at minimum comfortable width                         |
| Very compressed (<600px) | <600px                       | Consider auto-switching to scroll mode (future)             |

When stats sidebar is **open**: the sidebar shows the Process Intelligence Panel (3 tabs: Summary with stats + target discovery, Data table, What-If simulator). VerificationCard remains in grid row 2 (tabbed Histogram/ProbPlot). Key stats are always visible in ProcessHealthBar regardless of sidebar state. See [Process Intelligence Panel spec](../../superpowers/specs/2026-03-28-process-intelligence-panel-design.md).

When stats sidebar is **closed**: ProcessHealthBar shows inline stats (Cpk, Pass, Mean, σ, projections). VerificationCard in row 2 provides Histogram/Probability Plot in a tabbed card.

See [Dashboard Chrome Redesign spec](../../superpowers/specs/2026-03-28-dashboard-chrome-redesign.md) for the full workspace navigation model.

## Grid Slot Mapping

The dashboard always uses a 2-row layout (`55fr / 45fr`). Row 2 contains Boxplot, Pareto (when a factor is selected), and the VerificationCard.

```
Desktop (lg+):
┌──────────────────────────────────────────────────────┐
│  I-Chart (full width)                         55fr   │
├───────────┬────────────┬─────────────────────────────┤
│  Boxplot  │  Pareto    │  [Histogram | Prob Plot]    │
│  (flex-1) │  (flex-1)  │  (tabbed card, flex-1) 45fr │
└───────────┴────────────┴─────────────────────────────┘

No factor (1 measure):
┌──────────────────────────────────────────────────────┐
│  I-Chart (full width)                         55fr   │
├───────────────────────┬──────────────────────────────┤
│  Boxplot              │  [Histogram | Prob Plot]     │
│  (flex-1)             │  (tabbed card, flex-1) 45fr  │
└───────────────────────┴──────────────────────────────┘

Mobile (<640px):            Tablet (640-1024px):
MobileChartCarousel         flex-col scroll
(one chart at a time,       (all charts stacked,
 swipe navigation)           natural overflow)
```

Row distribution `55fr/45fr` on a typical 820px content area:

- Row 1 (I-Chart): ~451px
- Row 2 (Boxplot + Pareto + VerificationCard): ~369px

The **VerificationCard** is a `DashboardChartCard` with a tab bar toggling between Histogram and Probability Plot. It has full chart card chrome: copy, PNG/SVG export, maximize.

### Key files

| Component           | File                                                               | Purpose                                                     |
| ------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| DashboardGrid       | `packages/ui/src/components/DashboardBase/DashboardGrid.tsx`       | CSS Grid layout (2-row: 55fr/45fr), responsive switching    |
| DashboardChartCard  | `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx`  | Card container with header, controls, export buttons        |
| DashboardLayoutBase | `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` | Orchestrates grid vs focused view, wires chart data         |
| ProcessHealthBar    | `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` | Sticky adaptive toolbar: stats, filter chips, variation bar |
| VerificationCard    | `packages/ui/src/components/VerificationCard/VerificationCard.tsx` | Tabbed Histogram / Probability Plot card for grid row 2     |
| StatsPanelBase      | `packages/ui/src/components/StatsPanel/StatsPanelBase.tsx`         | Tabbed stats (Summary/Histogram/Probability) for sidebar    |
| useResizablePanel   | `packages/hooks/src/useResizablePanel.ts`                          | Drag-resize with localStorage persistence (left/right)      |
| PWA Dashboard       | `apps/pwa/src/components/Dashboard.tsx`                            | App-level wrapper, sticky nav, view mode routing            |
| Azure Dashboard     | `apps/azure/src/components/Dashboard.tsx`                          | Same + tab system (analysis/performance/yamazumi)           |
| EditorDashboardView | `apps/azure/src/components/editor/EditorDashboardView.tsx`         | Panel sidebar orchestration (stats, findings, CoScout)      |
| MobileDashboard     | `apps/pwa/src/components/MobileDashboard.tsx`                      | Carousel layout for phone                                   |

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

| Panel              | Where rendered                                | Effect on dashboard                                          |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------ |
| ProcessHealthBar   | Inside Dashboard container, sticky            | `flex-shrink-0`, reduces grid available height               |
| SelectionPanel     | Inside ProcessHealthBar (when points brushed) | Expands ProcessHealthBar height                              |
| Stats/Data sidebar | Parent (EditorDashboardView)                  | Left of dashboard, resizable. Key stats remain in toolbar.   |
| FindingsPanel      | Parent (App.tsx / Editor.tsx)                 | Right of dashboard, resizable. Grid compresses horizontally. |
| CoScoutPanel       | Parent                                        | Right of dashboard, resizable                                |
| DataPanel          | Parent                                        | Right of dashboard, resizable                                |
| SettingsPanel      | Parent                                        | Overlay, no layout shift                                     |
| SpecEditor         | Inside Dashboard, absolute positioned         | Overlay, no layout shift                                     |

## Chart Export

Export uses fixed off-screen dimensions (from `EXPORT_SIZES` in `useChartCopy.ts`):

| Chart            | Export Width | Export Height       |
| ---------------- | ------------ | ------------------- |
| I-Chart          | 1200px       | 540px               |
| Boxplot          | 1200px       | 800px               |
| Pareto           | 1200px       | 720px               |
| Histogram        | 800px        | 600px               |
| Probability Plot | 800px        | 700px               |
| Stats            | 1200px       | 400px               |
| Dashboard        | 1600px       | auto (scrollHeight) |

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
