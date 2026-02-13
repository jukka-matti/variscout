# Spacing

VariScout uses a 4px base unit spacing scale.

## Scale

| Token | Value | PWA (Tailwind) | Excel (darkTheme) | Usage          |
| ----- | ----- | -------------- | ----------------- | -------------- |
| xs    | 4px   | `p-1`, `gap-1` | `spacingXS`       | Minimal gaps   |
| sm    | 8px   | `p-2`, `gap-2` | `spacingS`        | Tight spacing  |
| md    | 12px  | `p-3`, `gap-3` | `spacingM`        | Default gaps   |
| lg    | 16px  | `p-4`, `gap-4` | `spacingL`        | Card padding   |
| xl    | 24px  | `p-6`, `gap-6` | `spacingXL`       | Section gaps   |
| 2xl   | 32px  | `p-8`, `gap-8` | `spacingXXL`      | Major sections |

## Common Patterns

### Card Padding

```jsx
// Standard card
<div className="p-6">...</div>

// Compact card
<div className="p-4">...</div>

// Header/footer
<div className="px-4 py-3">...</div>
```

### Gap Spacing

```jsx
// Button group
<div className="flex gap-2">...</div>

// Form fields
<div className="flex flex-col gap-4">...</div>

// Section layout
<div className="flex flex-col gap-6">...</div>
```

### Margins

```jsx
// Between sections
<div className="mb-6">...</div>

// Between related items
<div className="mb-2">...</div>

// Card margin in grid
<div className="m-4">...</div>
```

## Border Radius

| Token | Value  | PWA (Tailwind) | Usage                  |
| ----- | ------ | -------------- | ---------------------- |
| sm    | 4px    | `rounded`      | Small elements, badges |
| md    | 8px    | `rounded-lg`   | Buttons, inputs        |
| lg    | 12px   | `rounded-xl`   | Cards                  |
| xl    | 16px   | `rounded-2xl`  | Modals, large cards    |
| full  | 9999px | `rounded-full` | Pills, circular        |

## Component Spacing

### Buttons

```jsx
// PWA — default (app context, mouse-primary)
<button className="px-4 py-2">...</button>

// PWA — small
<button className="px-3 py-1.5">...</button>

// PWA — icon button
<button className="p-2">...</button>
```

```html
<!-- Website — default (marketing site, larger touch targets) -->
<a class="btn btn-primary">...</a>
<!-- py-2.5, ~40px height -->

<!-- Website — CTA override for 44px+ touch target -->
<a class="btn btn-primary py-3">...</a>
```

### Inputs

```jsx
<input className="px-3 py-2" />
```

### Filter Chips

```jsx
<span className="px-2.5 py-1">...</span>
```

### Modal

```jsx
<div className="p-6">        {/* Header */}
<div className="p-6">        {/* Body */}
<div className="px-6 py-4">  {/* Footer */}
```

## Chart Margins

See [Charts > Responsive](../charts/responsive.md) for chart-specific margins.

## Excel Add-in

```tsx
import { darkTheme } from '../lib/darkTheme';

const styles = {
  container: {
    padding: darkTheme.spacingL, // 16px
    gap: darkTheme.spacingM, // 12px
  },
  header: {
    marginBottom: darkTheme.spacingXL, // 24px
  },
};
```
