# Chart Utilities

Accessibility and interaction utilities for chart components in `@variscout/charts`.

## Overview

The charts package provides centralized utilities for:

- **Accessibility (A11y)** - ARIA attributes and keyboard support for SVG elements
- **Interaction Styles** - Consistent cursor and hover styles across interactive elements

---

## Accessibility Utilities

**Source:** `packages/charts/src/utils/accessibility.ts`

### Purpose

SVG elements don't have inherent accessibility features. These utilities add proper ARIA attributes and keyboard support to make charts navigable by screen readers and keyboard users.

### `getInteractiveA11yProps(label, onClick)`

Generate accessibility props for any interactive SVG element.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `label` | `string` | Descriptive label for screen readers |
| `onClick` | `() => void \| undefined` | Click handler (returns empty object if undefined) |

**Returns:** `InteractiveA11yProps`

```typescript
interface InteractiveA11yProps {
  role?: 'button';
  'aria-label'?: string;
  tabIndex?: number;
  onKeyDown?: (event: KeyboardEvent) => void;
}
```

**Behavior:**

- When `onClick` is provided:
  - `role="button"` - identifies element as clickable
  - `aria-label` - descriptive label for screen readers
  - `tabIndex={0}` - makes element focusable via keyboard
  - `onKeyDown` - handles Enter and Space key presses
- When `onClick` is undefined: returns empty object

**Example:**

```tsx
<Bar
  onClick={() => onBarClick?.(d.key)}
  {...getInteractiveA11yProps(`Select ${d.key}`, onBarClick ? () => onBarClick(d.key) : undefined)}
/>
```

### Specialized A11y Functions

#### `getDataPointA11yProps(label, value, index, onClick)`

For I-Chart and scatter plot data points.

```tsx
<Circle
  {...getDataPointA11yProps(
    'Measurement',
    d.y,
    i,
    onPointClick ? () => onPointClick(i) : undefined
  )}
/>
// Generates: "Measurement 1: 42.50"
```

#### `getBarA11yProps(key, value, onClick)`

For Pareto and histogram bars.

```tsx
<Bar {...getBarA11yProps(d.key, d.value, onBarClick ? () => onBarClick(d.key) : undefined)} />
// Generates: "Select Machine A (15)" or "Machine A: 15"
```

#### `getBoxplotA11yProps(key, median, n, onClick)`

For boxplot groups with statistical context.

```tsx
<Group
  {...getBoxplotA11yProps(
    d.key,
    d.median,
    d.values.length,
    onBoxClick ? () => onBoxClick(d.key) : undefined
  )}
/>
// Generates: "Select Machine A (median: 42.50, n=30)"
```

#### `getScatterPointA11yProps(x, y, index, onClick)`

For scatter plot points with both coordinates.

```tsx
<Circle
  {...getScatterPointA11yProps(d.x, d.y, i, onPointClick ? () => onPointClick(i) : undefined)}
/>
// Generates: "Select point 1 (x: 10.00, y: 42.50)"
```

---

## Interaction Styles

**Source:** `packages/charts/src/styles/interactionStyles.ts`

### CSS Class Strings

Apply these via `className` prop on SVG elements for consistent visual feedback.

```typescript
import { interactionStyles } from '@variscout/charts';

// Available styles:
interactionStyles.clickable; // cursor-pointer hover:opacity-80 transition-opacity duration-150
interactionStyles.clickableSubtle; // cursor-pointer hover:opacity-90 transition-opacity duration-150
interactionStyles.static; // cursor-default
```

| Style             | Opacity      | Use Case                                           |
| ----------------- | ------------ | -------------------------------------------------- |
| `clickable`       | 80% on hover | Primary interactive elements (bars, boxes, points) |
| `clickableSubtle` | 90% on hover | Secondary elements (labels, text)                  |
| `static`          | No change    | Non-interactive elements                           |

### `getInteractionClass(hasClickHandler, variant)`

Conditionally return interaction class based on whether element is interactive.

```tsx
<Bar className={getInteractionClass(!!onBarClick, 'clickable')} onClick={onBarClick} />
```

### Inline Styles

For SVG elements where `className` hover doesn't work (some visx components):

```typescript
import { interactionInlineStyles } from '@variscout/charts';

<rect style={hasClick ? interactionInlineStyles.clickable : interactionInlineStyles.static} />
```

### Opacity Constants

For programmatic opacity control during selection/hover states:

```typescript
import { hoverOpacity } from '@variscout/charts';

hoverOpacity.default; // 0.8 - Standard hover
hoverOpacity.subtle; // 0.9 - Subtle hover
hoverOpacity.dimmed; // 0.3 - Unselected items
```

---

## Usage Pattern

Combine accessibility and interaction utilities together:

```tsx
import { getBarA11yProps, interactionStyles, hoverOpacity } from '@variscout/charts';

<Bar
  // Visual feedback
  className={onBarClick ? interactionStyles.clickable : ''}
  opacity={hasSelection && !isSelected ? hoverOpacity.dimmed : 1}
  // Click handler
  onClick={() => onBarClick?.(d.key)}
  // Accessibility
  {...getBarA11yProps(d.key, d.value, onBarClick ? () => onBarClick(d.key) : undefined)}
/>;
```

---

## Best Practices

1. **Always add a11y props to clickable elements** - Even if mouse users can click, keyboard users need focus support
2. **Use descriptive labels** - Include the data value in labels, not just "click here"
3. **Conditionally apply props** - Return empty object when not interactive to avoid extra DOM attributes
4. **Combine with visual feedback** - Accessibility and visual interaction go together
5. **Test with keyboard** - Verify Tab navigation and Enter/Space activation work

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Shared Components](./shared-components.md) - ChartTooltip, SpecLimitLine
- [Hooks](./hooks.md) - useSelectionState for opacity management
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Overview](./overview.md) - Chart architecture and common patterns
