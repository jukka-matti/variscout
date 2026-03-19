---
title: 'VariScout Design System'
---

# VariScout Design System

A unified design system for VariScout covering PWA and Azure App platforms.

## Principles

1. **Theme-aware** - Supports dark/light/system modes across all platforms
2. **Data-focused** - Colors prioritize data visibility and status communication
3. **Consistent semantics** - Same meaning for colors across platforms
4. **Responsive** - Adapts to screen size without losing functionality
5. **Accessible** - WCAG AA compliant contrast ratios

## Theming

All platforms use CSS variables for theming with runtime theme switching. Default is system preference (typically light).

| Feature           | PWA (Free)  | Azure App (Paid) |
| ----------------- | ----------- | ---------------- |
| Dark mode         | ✓           | ✓                |
| Light mode        | ✓           | ✓                |
| System preference | ✓ (default) | ✓ (default)      |
| Company accent    | -           | ✓                |

### Semantic Color Classes

Components use semantic Tailwind classes that adapt to the active theme:

| Semantic Class           | Dark Mode | Light Mode |
| ------------------------ | --------- | ---------- |
| `bg-surface`             | slate-900 | slate-50   |
| `bg-surface-secondary`   | slate-800 | slate-100  |
| `text-content`           | slate-200 | slate-900  |
| `text-content-secondary` | slate-400 | slate-600  |
| `border-edge`            | slate-700 | slate-200  |

See [Colors](./foundations/colors.md) for the complete mapping.

## Quick Reference

### Foundations

- [Colors](./foundations/colors.md) - Color palette and semantic usage
- [Typography](./foundations/typography.md) - Fonts, sizes, weights
- [Spacing](./foundations/spacing.md) - Spacing scale and units
- [Accessibility](./foundations/accessibility.md) - WCAG AA guidelines, keyboard navigation, screen readers

### Charts

- [Overview](./charts/overview.md) - Chart styling principles
- [Colors](./charts/colors.md) - Data visualization palette
- [Responsive](./charts/responsive.md) - Breakpoints and scaling
- [Hooks](./charts/hooks.md) - Chart hooks (useChartTheme, useChartScale)
- [I-Chart](./charts/ichart.md) - Individuals control chart design
- [Boxplot](./charts/boxplot.md) - Boxplot and violin mode design
- [Pareto](./charts/pareto.md) - Pareto chart design
- [Capability](./charts/capability.md) - Capability histogram design
- [Probability Plot](./charts/probability-plot.md) - Probability plot design
- [Performance Mode](./charts/performance-mode.md) - Multi-channel chart design
- [Shared Components](./charts/shared-components.md) - ChartSourceBar, EditableChartTitle, etc.

### Components

- [Foundational Patterns](./components/foundational-patterns.md) - Buttons, forms, cards, modals
- [VariationBar](./components/variation-funnel.md) - Variation scope progress bar
- [What-If Simulator](./components/what-if-simulator.md) - Process improvement exploration
- [Findings](./components/findings.md) - Investigation findings, board view, actions
- [AI Components](./components/ai-components.md) - NarrativeBar, ChartInsightChip, CoScoutPanel
- [Help Tooltip](./components/help-tooltip.md) - Contextual help with glossary integration

### Patterns

- [Layout](./patterns/layout.md) - Page layouts
- [Feedback](./patterns/feedback.md) - Status and loading states
- [Navigation](./patterns/navigation.md) - Navigation patterns and breadcrumbs
- [Interactions](./patterns/interactions.md) - Interaction patterns (inline edit, grids, selection cards)
- [Panels and Drawers](./patterns/panels-and-drawers.md) - Panel decision framework, drawer types, z-index scale

## Usage

### PWA (Tailwind with Semantic Classes)

```jsx
// Use semantic classes for theme-aware styling
<div className="bg-surface border border-edge rounded-lg p-4">
  <h2 className="text-content font-semibold">Title</h2>
  <p className="text-content-secondary">Description</p>
</div>

// Primary button (brand colors don't change with theme)
<button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
  Primary Button
</button>
```

### Charts (Visx)

```tsx
import { useChartTheme } from '@variscout/charts';

// Chrome colors adapt to theme
const { chrome } = useChartTheme();
<text fill={chrome.labelPrimary}>Axis Label</text>

// Data colors remain universal (pass/fail/warning)
<Circle fill="#22c55e" /> // In-spec point
<Circle fill="#ef4444" /> // Out of spec (high)
```
