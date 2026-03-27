---
title: Help Tooltips
audience: [analyst, engineer]
category: components
status: stable
related: [glossary, contextual-help, onboarding]
---

# Help Tooltips

Contextual help throughout the VariScout interface.

---

## Purpose

Provide in-context explanations for statistical terms and concepts without interrupting the analysis workflow.

---

## Implementation

The `HelpTooltip` component from `@variscout/ui`:

```tsx
import { HelpTooltip } from '@variscout/ui';

<span>
  Cpk <HelpTooltip termId="cpk" />
</span>;
```

---

## Tooltip Content

| Element           | Source                       |
| ----------------- | ---------------------------- |
| Term label        | `glossaryTerm.label`         |
| Definition        | `glossaryTerm.definition`    |
| "Learn more" link | `glossaryTerm.learnMorePath` |

---

## Design

```
┌─────────────────────────────────────┐
│ Cpk                                 │
│                                     │
│ Process Capability Index. Like Cp,  │
│ but accounts for how well centered  │
│ the process is. ≥1.33 is good.     │
│                                     │
│ Learn more →                        │
└─────────────────────────────────────┘
```

---

## Platform Variants

| Platform  | Component                   |
| --------- | --------------------------- |
| PWA/Azure | `@variscout/ui` HelpTooltip |

---

## Viewport-Aware Positioning

HelpTooltip defaults to `position="auto"`, which uses the `useTooltipPosition` hook from `@variscout/hooks` to automatically flip direction when the tooltip would clip against the viewport edge. Pass an explicit position (`"top"`, `"bottom"`, `"left"`, `"right"`) to override auto-detection.

See [Tooltip Positioning](../patterns/tooltip-positioning.md) for the full pattern documentation.

## See Also

- [Glossary Feature](../../03-features/learning/glossary.md)
- [Foundational Patterns](foundational-patterns.md)
- [Tooltip Positioning Pattern](../patterns/tooltip-positioning.md)
