---
title: 'Glossary Feature'
---

# Glossary Feature

Contextual term definitions throughout the application.

---

## Purpose

Help users understand statistical terms without leaving their analysis.

---

## Implementation

Terms are defined in `packages/core/src/glossary/terms.ts` and accessed via the `useGlossary` hook.

```typescript
import { useGlossary } from '@variscout/ui';

const { getTerm, hasTerm } = useGlossary();

const cpkTerm = getTerm('cpk');
// { id: 'cpk', label: 'Cpk', definition: '...', description: '...' }
```

---

## Term Structure

```typescript
interface GlossaryTerm {
  id: string; // Unique identifier
  label: string; // Display label
  definition: string; // Short definition
  description: string; // Detailed explanation
  category: string; // Grouping category
  learnMorePath?: string; // Link to deeper content
  relatedTerms?: string[]; // Related term IDs
}
```

---

## Categories

| Category       | Terms                                   |
| -------------- | --------------------------------------- |
| control-limits | UCL, LCL, USL, LSL, Target              |
| capability     | Cp, Cpk, Pass Rate, Rejected            |
| statistics     | Mean, Std Dev, F-Statistic, p-value, η² |
| regression     | R², Slope, Intercept, VIF               |
| charts         | Violin Plot                             |
| methodology    | Staged Analysis, Probability Plot       |

---

## See Also

- [Help Tooltips](help-tooltips.md)
- [Full Glossary](../../glossary.md)
