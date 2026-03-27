---
title: Tooltip Positioning
audience: [developer]
category: reference
status: stable
related: [tooltip, viewport, positioning, help-tooltip]
---

# Tooltip Positioning

Systematic viewport-aware tooltip positioning across the VariScout UI.

## Problem

Static CSS tooltips (`position: absolute; bottom: 100%`) clip against the viewport when the trigger element is near an edge. The VariationBar tooltip, for example, opens upward into the header when the bar is at the top of the content area.

## Solution: `useTooltipPosition` Hook

A shared hook in `@variscout/hooks` that measures the trigger and tooltip elements, then picks the best direction to avoid viewport clipping.

```tsx
import { useTooltipPosition } from '@variscout/hooks';

const triggerRef = useRef<HTMLElement>(null);
const tooltipRef = useRef<HTMLDivElement>(null);
const [isVisible, setIsVisible] = useState(false);

const { position, style } = useTooltipPosition(triggerRef, tooltipRef, {
  preferred: 'top', // Try this direction first
  gap: 10, // Pixels between trigger and tooltip
  enabled: isVisible, // Only measure when visible
});

<div ref={tooltipRef} style={style}>
  {/* tooltip content */}
  <Arrow direction={position} />
</div>;
```

### How It Works

1. When `enabled` becomes true, measures trigger with `getBoundingClientRect()`
2. Tries the `preferred` direction first
3. If it would clip, tries opposite, then perpendicular directions
4. Returns the resolved `position` (for arrow direction) and `style` (fixed positioning)
5. Horizontal position is always clamped to viewport bounds

### Return Value

| Property   | Type                                     | Description                                                               |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | Resolved direction (use for arrow styling)                                |
| `style`    | `CSSProperties`                          | `{ position: 'fixed', top, left, visibility }` — apply to tooltip element |

## Tooltip Types

| Type                  | Component                | Uses Hook?              | Notes                                             |
| --------------------- | ------------------------ | ----------------------- | ------------------------------------------------- |
| **Chart data**        | visx `TooltipWithBounds` | No (visx built-in)      | Already viewport-aware                            |
| **Glossary help**     | `HelpTooltip`            | Yes (`position='auto'`) | Falls back to static when explicit position given |
| **Variation insight** | `VariationBar` tooltip   | Yes                     | Replaced CSS `group-hover` with controlled state  |
| **AI onboarding**     | `AIOnboardingTooltip`    | Yes                     | One-shot, fixed positioning                       |

## When to Use

- **New tooltip in UI components**: Use `useTooltipPosition` with controlled visibility state
- **Chart tooltips**: Use visx `useTooltip` + `TooltipWithBounds` (existing pattern)
- **Static positions known to be safe**: Can use CSS positioning directly (rare)

## Arrow Pattern

Each tooltip component renders its own arrow. The `position` from the hook tells you which edge the arrow should point from:

| `position` | Arrow location    | Points toward    |
| ---------- | ----------------- | ---------------- |
| `top`      | Bottom of tooltip | Trigger below    |
| `bottom`   | Top of tooltip    | Trigger above    |
| `left`     | Right of tooltip  | Trigger to right |
| `right`    | Left of tooltip   | Trigger to left  |

## Related

- [Help Tooltips](../components/help-tooltip.md) — HelpTooltip component docs
- [Chart Sizing Guide](../charts/chart-sizing-guide.md) — visx chart tooltip patterns
