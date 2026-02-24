# Interaction Guidance

A contextual hint that guides users from drill-down analysis to regression for interaction effects.

## Overview

The Interaction Guidance component appears in the Investigation Mindmap when users have selected 2+ factors. It educates users about the limitation of sequential ANOVA (main effects only) and provides a direct link to the Regression Panel.

## Usage

```tsx
import InteractionGuidance from './components/InteractionGuidance';

<InteractionGuidance
  drillFactorCount={selectedFactors.size}
  drillFactors={Array.from(selectedFactors)}
  columnAliases={columnAliases}
  onNavigateToRegression={() => setActiveView('regression')}
/>;
```

## Props

| Prop                   | Type                   | Default   | Description                      |
| ---------------------- | ---------------------- | --------- | -------------------------------- |
| drillFactorCount       | number                 | required  | Number of factors in drill stack |
| drillFactors           | string[]               | []        | Factor names for example text    |
| columnAliases          | Record<string, string> | {}        | Display names for factors        |
| onNavigateToRegression | () => void             | undefined | Navigation callback              |

## Visibility Logic

- **Shows:** When `drillFactorCount >= 2`
- **Hides:** When fewer than 2 factors selected

Note: This same 2+ factor threshold is also used to gate the Interactions mode in the Investigation Mindmap's mode toggle. When fewer than 2 factors are drilled, both InteractionGuidance and the Interactions mode remain unavailable. The Interactions mode additionally requires n >= 5 after filtering.

## Visual Design

```
┌────────────────────────────────────────────────────────────────────┐
│ 💡 Analyzing multiple factors?                                     │
│                                                                    │
│ Your drill-down shows main effects. To check if factors interact  │
│ (e.g., Shift performance varies by Machine), use the Regression   │
│ Panel with "Include interactions".                                │
│                                                                    │
│ [Check Interactions →]                                            │
└────────────────────────────────────────────────────────────────────┘
```

**Structure:**

- Container: Blue accent background (`bg-blue-500/10`) with border (`border-blue-500/30`)
- Icon: Lightbulb (Lucide), 16px, `text-blue-400`
- Title: 14px semi-bold, `text-blue-300`
- Body: 12px, `text-content-secondary` with emphasized spans
- Button: Inline text button with arrow icon, hover effect

## Dynamic Example Text

The component generates contextual example text based on actual factors:

```typescript
// With drillFactors = ['Shift', 'Machine']
'e.g., Shift performance varies by Machine';

// Fallback when fewer factors available
'e.g., Machine C is only problematic on Night shift';
```

Column aliases are applied for user-friendly display names.

## Integration

Located in `InvestigationMindmap.tsx`, within the mindmap conclusion panel:

```tsx
// packages/charts/src/InvestigationMindmap.tsx
<InteractionGuidance
  drillFactorCount={filterStack?.length ?? 0}
  drillFactors={filterStack?.map(f => f.factor) ?? []}
  columnAliases={columnAliases}
  onNavigateToRegression={onNavigateToRegression}
/>
```

## Accessibility

- Button is keyboard accessible with focus states
- Color contrast meets WCAG AA for informational text
- No auto-dismiss behavior — user controls navigation

## Files

| File                                                             | Purpose   |
| ---------------------------------------------------------------- | --------- |
| `apps/pwa/src/components/InteractionGuidance.tsx`                | Component |
| `apps/pwa/src/components/__tests__/InteractionGuidance.test.tsx` | Tests     |

## Related Components

- `InvestigationMindmap.tsx` — Parent component that renders InteractionGuidance
- `MindmapPanel.tsx` — Passes navigation callback through to InvestigationMindmap
- [Regression Panel](../../03-features/analysis/regression.md#interaction-effects) — Target destination

## See Also

- [Drill-Down: When to Check for Interactions](../../03-features/navigation/drill-down.md#when-to-check-for-interactions)
- [Regression: Interaction Effects](../../03-features/analysis/regression.md#interaction-effects)
