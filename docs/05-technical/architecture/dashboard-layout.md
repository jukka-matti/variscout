---
title: Dashboard Layout Architecture
audience: [developer]
category: architecture
status: stable
related: [dashboard, layout, css-grid, responsive, charts]
---

# Dashboard Layout Architecture

Developer reference for how the **Analysis** dashboard is structured and why its height chain and panel ownership matter.

The product contract is **laptop-first**:

- full-screen laptop is the baseline
- the hero I-Chart is always visible
- the lower row is two panels, not three competing cards
- the right-hand card is an adaptive lens, not a fixed histogram-only slot

For user-facing intent and panel meaning, see [Analysis Dashboard Pattern](../../06-design-system/patterns/analysis-dashboard.md).

---

## Height Chain

Every container from the app root to the chart SVG must have a **definite height**. If any link breaks, `withParentSize` measures unconstrained content and the chart expands incorrectly.

```
h-screen (flex layout)                     ← App.tsx root div
  ├─ h-11 (44px header)                   ← AppHeader, flex-shrink-0
  ├─ flex-1 overflow-hidden               ← main content area
  │  └─ flex-1 overflow-hidden flex-col   ← workspace wrapper
  │     └─ h-full flex-col                ← Dashboard container
  │        ├─ sticky flex-shrink-0        ← ProcessHealthBar + SelectionPanel
  │        └─ flex-1 flex-col min-h-0     ← DashboardLayoutBase
  │           └─ lg:h-full lg:grid        ← DashboardGrid
  │              lg:grid-rows-[55fr_45fr]
  │              ├─ min-h-0 overflow-hidden  ← Row 1: I-Chart hero
  │              └─ min-h-0 overflow-hidden  ← Row 2: Variation Sources + Adaptive Lens
  └─ h-8 (footer)                         ← AppFooter, flex-shrink-0
```

### Why each property matters

| Property                | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `h-screen`              | Establishes the viewport constraint at the root                 |
| `flex-1`                | Distributes remaining space after fixed-height siblings         |
| `min-h-0`               | Lets flex/grid children shrink below content size               |
| `overflow-hidden`       | Prevents child content from expanding the measured container    |
| `h-full`                | Gives the grid a definite height so `fr` rows resolve correctly |
| `flex-shrink-0`         | Prevents sticky toolbar chrome from collapsing                  |
| `grid-rows-[55fr_45fr]` | Preserves a larger hero chart and a smaller support row         |

---

## Laptop Baseline Layout

The desktop baseline is a two-row grid:

```
┌──────────────────────────────────────────────────────────────┐
│  I-Chart hero                                         55fr   │
├───────────────────────────────┬──────────────────────────────┤
│  Variation Sources            │  Adaptive Lens               │
│  Boxplot or guided empty      │  Probability                 │
│  state                        │  Distribution/Capability     │
│                               │  Pareto when meaningful      │
└───────────────────────────────┴──────────────────────────────┘
```

Notes:

- The left lower panel stays about **subgroup drill-down**
- The right lower panel stays about **distribution/spec/ranking**
- The normal dashboard does **not** render a separate desktop Pareto card anymore
- If subgroup data is missing, the left panel stays visible as a guided empty state

---

## Layout Modes

| Mode               | Description                                    | Overflow                     |
| ------------------ | ---------------------------------------------- | ---------------------------- |
| **Grid** (default) | Laptop-first overview: hero + 2 support panels | `overflow-hidden` on desktop |
| **Scroll**         | Full-width stacked review                      | `overflow-y-auto`            |

**Grid mode** is the normal analysis dashboard.

**Scroll mode** is for detailed reading and smaller widths. The same chart roles remain, but panels are stacked vertically.

Layout choice persists in `displayOptions.dashboardLayout`. Mobile stays on the dedicated mobile dashboard flow.

---

## Region Ownership In Code

| Region            | Primary component / source                                                   | Responsibility                                              |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Top strip         | `ProcessHealthBar`                                                           | shared stats, filters, factor entry, specs shortcut, export |
| I-Chart hero      | `DashboardLayoutBase` + `DashboardChartCard` + app `renderIChartContent`     | always-visible orientation chart                            |
| Variation Sources | `DashboardLayoutBase` boxplot card                                           | subgroup factor selector, boxplot, empty-state guidance     |
| Adaptive Lens     | `VerificationCard` inside `DashboardLayoutBase`                              | Probability, Distribution/Capability, optional Pareto       |
| Focus mode        | `FocusedViewOverlay`, `FocusedChartView`, histogram/probability focused card | detailed reading and export-heavy chart workflows           |

Normal dashboard cards use **maximize-only** utility chrome. Copy/download/share remain available in focused view and export flows.

---

## Adaptive Lens Contract

The adaptive lens is a single card with explicit tabs.

| Context                    | Tabs shown                                |
| -------------------------- | ----------------------------------------- |
| No subgroup data, no specs | `Probability` + `Distribution`            |
| No subgroup data, specs    | `Probability` + `Capability`              |
| Subgroup data, no specs    | `Probability` + `Distribution` + `Pareto` |
| Subgroup data, specs       | `Probability` + `Capability` + `Pareto`   |

Implementation detail:

- The card is still rendered by `VerificationCard`
- The component now accepts a generic tab list rather than a hard-coded histogram/probability pair
- The current active tab determines the focused-chart target (`probability-plot`, `histogram`, or `pareto`)

---

## Duplication Rules

The layout intentionally removes several forms of dashboard chrome duplication:

- summary stats live in `ProcessHealthBar`, not both there and in the I-Chart header
- spec entry shortcut belongs to the top strip, not both the top strip and a normal I-Chart header popover
- per-card copy/download/share are hidden in the normal dashboard
- chart-local selectors remain local, but they render in a subheader row beneath the title instead of competing with utility actions

---

## Responsive Behavior

| Breakpoint         | Layout                 | Notes                                                                |
| ------------------ | ---------------------- | -------------------------------------------------------------------- |
| **< 640px**        | `MobileDashboard`      | chart switching handled by the phone-specific flow                   |
| **640-1023px**     | stacked desktop layout | same card roles, natural vertical scroll                             |
| **>= 1024px**      | 2-row CSS grid         | laptop-first baseline                                                |
| **Very wide / XL** | future expansion path  | may expose more simultaneous content without changing region meaning |

The product intent is that **XL layouts extend the laptop model**; they do not redefine what each panel is for.

---

## Key Files

| Component           | File                                                               | Purpose                                                     |
| ------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| DashboardGrid       | `packages/ui/src/components/DashboardBase/DashboardGrid.tsx`       | 2-row CSS grid / stacked scroll layout                      |
| DashboardChartCard  | `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx`  | shared card shell with separated utility actions            |
| DashboardLayoutBase | `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` | wires hero chart, subgroup panel, and adaptive lens         |
| VerificationCard    | `packages/ui/src/components/VerificationCard/VerificationCard.tsx` | generic adaptive lens tab card                              |
| ProcessHealthBar    | `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` | sticky shared summary strip                                 |
| PWA Dashboard       | `apps/pwa/src/components/Dashboard.tsx`                            | app-level dashboard state, adaptive lens tabs, empty states |
| MobileDashboard     | `apps/pwa/src/components/MobileDashboard.tsx`                      | phone-specific chart workflow                               |

---

## Chart Export

Focused and export flows still use dedicated chart export sizes from `useChartCopy.ts`.

| Chart            | Export Width | Export Height |
| ---------------- | ------------ | ------------- |
| I-Chart          | 1200px       | 540px         |
| Boxplot          | 1200px       | 800px         |
| Pareto           | 1200px       | 720px         |
| Histogram        | 800px        | 600px         |
| Probability Plot | 800px        | 700px         |
| Dashboard        | 1600px       | auto          |

The normal dashboard intentionally minimizes export chrome; focused view remains the detailed export surface.

---

## Tailwind v4 `@source` Requirement

Tailwind v4 (`@tailwindcss/vite`) does not reliably scan linked workspace packages in this pnpm monorepo without explicit `@source` directives.

Required in each app `index.css` after `@import 'tailwindcss'`:

```css
@source "../../../packages/ui/src/**/*.tsx";
@source "../../../packages/charts/src/**/*.tsx";
@source "../../../packages/hooks/src/**/*.ts";
```

If the dashboard renders as a vertical stack on desktop when it should be using the 2-row grid, verify the compiled CSS includes the expected `lg:` utilities first.
