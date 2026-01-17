# VariScout Design System

A unified design system for VariScout Lite covering both PWA and Excel Add-in platforms.

## Principles

1. **Theme-aware** - Supports dark/light modes (light mode for Licensed edition)
2. **Data-focused** - Colors prioritize data visibility and status communication
3. **Consistent semantics** - Same meaning for colors across platforms
4. **Responsive** - Adapts to screen size without losing functionality
5. **Accessible** - WCAG AA compliant contrast ratios

## Platform Differences

| Aspect     | PWA                       | Excel Add-in                 |
| ---------- | ------------------------- | ---------------------------- |
| Styling    | Tailwind semantic classes | Fluent UI tokens + CSS-in-JS |
| Theme      | CSS variables + Tailwind  | darkTheme token system       |
| Icons      | Lucide React              | Fluent UI icons              |
| Components | Custom + Tailwind         | Fluent UI components         |

Both platforms share the same **color values** and **semantic meanings**.

## Theming (PWA)

The PWA uses CSS variables for theming, enabling runtime theme switching:

| Feature           | Community/ITC | Licensed |
| ----------------- | ------------- | -------- |
| Dark mode         | ✓ (default)   | ✓        |
| Light mode        | -             | ✓        |
| System preference | -             | ✓        |
| Company accent    | -             | ✓        |

### Semantic Color Classes

Components use semantic Tailwind classes that adapt to the active theme:

| Semantic Class           | Dark Mode | Light Mode |
| ------------------------ | --------- | ---------- |
| `bg-surface`             | slate-900 | slate-50   |
| `bg-surface-secondary`   | slate-800 | slate-100  |
| `text-content`           | slate-200 | slate-900  |
| `text-content-secondary` | slate-400 | slate-600  |
| `border-edge`            | slate-700 | slate-200  |

See [Colors](./tokens/colors.md) for the complete mapping.

## Quick Reference

### Tokens

- [Colors](./tokens/colors.md) - Color palette and semantic usage
- [Typography](./tokens/typography.md) - Fonts, sizes, weights
- [Spacing](./tokens/spacing.md) - Spacing scale and units

### Charts

- [Overview](./charts/overview.md) - Chart styling principles
- [Colors](./charts/colors.md) - Data visualization palette
- [Responsive](./charts/responsive.md) - Breakpoints and scaling

### Components

- [Buttons](./components/buttons.md) - Button variants
- [Cards](./components/cards.md) - Cards and panels
- [Modals](./components/modals.md) - Modal patterns
- [Forms](./components/forms.md) - Form elements

### Patterns

- [Layout](./patterns/layout.md) - Page layouts
- [Feedback](./patterns/feedback.md) - Status and loading states

## Platform-Specific Docs

For detailed Excel Add-in patterns using Fluent UI:

- [Excel Add-in Design System](../EXCEL_ADDIN_DESIGN_SYSTEM.md)

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

### Excel Add-in (darkTheme)

```tsx
import { darkTheme } from '../lib/darkTheme';

const styles = {
  button: {
    backgroundColor: darkTheme.colorBrandBackground,
    color: darkTheme.colorNeutralForeground1,
  },
};
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
