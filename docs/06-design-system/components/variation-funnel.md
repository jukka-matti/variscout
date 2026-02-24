# Variation Bar

A visual progress bar showing variation scope in the drill-down breadcrumb.

## Overview

The Variation Bar provides immediate visual feedback about what fraction of total variation is in focus through the current filter path. It appears below the breadcrumb navigation when filters are active.

## Usage

```tsx
import { VariationBar } from '@variscout/ui';

<VariationBar isolatedPct={60} showLabels={true} className="max-w-xs" />;
```

## Props

| Prop        | Type                    | Default            | Description                                                                                                                                                    |
| ----------- | ----------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isolatedPct | number                  | required           | Percentage (0-100) of variation in focus                                                                                                                       |
| showLabels  | boolean                 | true               | Show text labels below bar                                                                                                                                     |
| className   | string                  | ''                 | Additional CSS classes for container                                                                                                                           |
| colorScheme | VariationBarColorScheme | defaultColorScheme | Color scheme (PWA semantic tokens or Azure slate palette)                                                                                                      |
| onClick     | () => void              | undefined          | Click handler --- opens the Investigation Mindmap panel when provided. Adds `cursor-pointer`, `role="button"`, `tabIndex`, and keyboard support (Enter/Space). |

## Visual Design

```
[████████████░░░░░░░░] 60% in focus | 40% outside scope
  ← colored →     ← gray →
```

**Structure:**

- Container: Flexbox column with 4px gap
- Bar: 8px height, full width, rounded-full
- Background: `bg-surface-tertiary/50`
- Left segment: Colored based on impact level
- Labels: 10px text, muted color

## Color Rules

Uses `getVariationImpactLevel()` from `@variscout/core`:

| Threshold | Impact Level | Bar Color      | Text Color       |
| --------- | ------------ | -------------- | ---------------- |
| ≥ 50%     | high         | `bg-green-500` | `text-green-400` |
| 30-50%    | moderate     | `bg-amber-500` | `text-amber-400` |
| < 30%     | low          | `bg-blue-500`  | `text-blue-400`  |

## Responsive Behavior

- **Desktop:** Shows bar + labels below
- **Mobile:** Set `showLabels={false}` to show bar only

```tsx
// Responsive usage in FilterBreadcrumb
<VariationBar isolatedPct={cumulativeVariationPct} showLabels={!isMobile} className="max-w-xs" />
```

## Tooltip

On hover, displays a tooltip with:

1. **Percentage header:** "Focused on 60% of total variation"
2. **Insight text:** From `getVariationInsight()` (e.g., "This combination accounts for more than half your total variation — strong focus.")
3. **Impact description:** "High impact — strong case for action"

**Tooltip styling:**

- Background: `bg-surface-secondary`
- Border: `border-edge`
- Position: Centered above bar
- Arrow: Rotated square pointing down

## Integration

### In FilterBreadcrumb

```tsx
// FilterBreadcrumb uses VariationBar from @variscout/ui
{
  cumulativeVariationPct !== undefined && (
    <VariationBar
      isolatedPct={cumulativeVariationPct}
      showLabels={true}
      className="mt-2"
      onClick={onOpenInvestigation}
    />
  );
}
```

### Core Dependencies

```typescript
import { getVariationImpactLevel, getVariationInsight } from '@variscout/core';

// getVariationImpactLevel(60) → 'high'
// getVariationInsight(60) → "Fix this combination..."
```

## Animations

- Bar width: `transition-all duration-300` for smooth resize
- Tooltip: `opacity-0 invisible` → `opacity-100 visible` on hover

## Accessibility

- Bar has no explicit ARIA role (decorative visual)
- Labels provide text alternative for percentage values
- Tooltip content duplicates label information with more context

## Files

| File                                                       | Purpose                                              |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `packages/ui/src/components/VariationBar/VariationBar.tsx` | Shared component (PWA and Azure)                     |
| `packages/ui/src/components/VariationBar/index.ts`         | Barrel re-export                                     |
| `packages/core/src/navigation.ts`                          | `getVariationImpactLevel()`, `getVariationInsight()` |

## Related Components

- `FilterBreadcrumb.tsx` — Parent component that displays VariationBar
- `InvestigationMindmap.tsx` — Uses same color scheme for node sizing
- `@variscout/core` — Shared threshold constants and insight helpers
