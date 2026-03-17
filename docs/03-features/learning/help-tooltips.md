---
title: 'Help Tooltips'
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

## See Also

- [Glossary Feature](glossary.md)
- [Design System: HelpTooltip](../../06-design-system/components/modals.md)
