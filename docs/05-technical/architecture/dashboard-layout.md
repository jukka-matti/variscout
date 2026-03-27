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
h-screen (100vh)                          ← App.tsx root div
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
  │              │     └─ flex-1 min-h-0        ← chart content
  │              │        └─ withParentSize     ← visx measures parent
  │              │           └─ <svg>           ← renders at measured size
  │              └─ min-h-0 overflow-hidden  ← Bottom row (45fr)
  │                 ├─ flex-1 (Boxplot + Pareto side-by-side)
  │                 └─ lg:w-[340px] (Stats panel, fixed width)
  └─ h-8 (footer)                         ← AppFooter, flex-shrink-0
```

### Why each property matters

| Property                | Purpose                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `h-screen`              | Establishes the viewport constraint at the root                                                        |
| `flex-1`                | Distributes remaining space after fixed-height siblings                                                |
| `min-h-0`               | Overrides flex default `min-height: auto` so children can shrink below content size                    |
| `overflow-hidden`       | Prevents content from expanding its container; breaks circular sizing with `withParentSize`            |
| `h-full`                | Gives the grid a definite height (100% of flex-computed parent) so `fr` units can compute pixel values |
| `flex-shrink-0`         | Prevents sticky nav from being compressed by flex algorithm                                            |
| `grid-rows-[55fr_45fr]` | Splits available height: 55% I-Chart, 45% bottom row                                                   |

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

## Common Pitfalls

1. **Adding `min-height` to chart cards** — breaks grid constraint, chart expands beyond `fr` allocation
2. **Removing `overflow-hidden` from grid items** — allows `withParentSize` to measure unconstrained content
3. **Forgetting `min-h-0` on flex children** — flex default `min-height: auto` prevents shrinking
4. **Missing `h-full` on grid container** — `fr` units need definite height to compute pixel values
5. **Sticky nav without `flex-shrink-0`** — nav height becomes variable in flex calculation
