# Journey Page Specification

> The signature 7-section scroll experience that teaches VaRiScout's methodology.

**Route**: `/[lang]/journey`

---

## Purpose

The Journey Page is the "aha moment" generator - a scroll-driven narrative that transforms how visitors think about averages and variation. Unlike case studies (which are practice exercises), the Journey is the conceptual revelation.

**Narrative arc**: Hook (mystery) → Journey (discovery) → Payoff (opportunity) → CTA (desire)

---

## The 7 Sections

| #   | Section  | Question                            | Visual                       | Insight                                     |
| --- | -------- | ----------------------------------- | ---------------------------- | ------------------------------------------- |
| 1   | AVERAGES | "What does the dashboard show?"     | Bar chart comparing averages | "Everything looks fine at 95%"              |
| 2   | CHANGE   | "What patterns does time reveal?"   | I-Chart                      | "But the pattern tells a different story"   |
| 3   | FLOW     | "Which factors drive variation?"    | Boxplot                      | "Factor C has 3x the variation"             |
| 4   | FAILURE  | "Where do problems concentrate?"    | Pareto                       | "And it causes 46% of all defects"          |
| 5   | VALUE    | "Does it meet customer specs?"      | Capability histogram         | "Before: Cpk 0.8 → After: Cpk 1.5"          |
| 6   | CLARITY  | "Where should Lean thinking focus?" | Breadcrumb trail + math      | "46% of improvement potential in one place" |
| 7   | CLOSE    | "Where's YOUR 46%?"                 | CTA buttons                  | Product conversion                          |

---

## Section Details

### Section 1: AVERAGES

**Purpose**: Hook - establish the false confidence of averages

**Content**:

```
"The dashboard says 95% pass rate."

[Bar chart showing Factor A: 96%, Factor B: 94%, Factor C: 95%]

"Everything looks fine. Management is satisfied."

"But is it?"
```

**Visual**: Simple bar chart (not PWA - this is the "misleading" view)
**Scroll trigger**: Fade up on enter

---

### Section 2: CHANGE (I-Chart)

**Purpose**: Reveal time-based patterns

**Content**:

```
"What if we look at time?"

[PWA Embed: I-Chart showing Factor C with pattern]

"Factor C has a pattern the average hides."

"Something changed around observation 15."
```

**Visual**: Embedded PWA with I-Chart highlighted
**Scroll trigger**: Chart fades in → data points animate → insight text appears

---

### Section 3: FLOW (Boxplot)

**Purpose**: Compare factors

**Content**:

```
"Where is the variation hiding?"

[PWA Embed: Boxplot comparing all factors]

"Factor C has 3x the variation of the others."

"The average was the same. The spread was not."
```

**Visual**: Embedded PWA with Boxplot, Factor C highlighted
**Scroll trigger**: Boxes appear one by one → Factor C pulses

---

### Section 4: FAILURE (Pareto)

**Purpose**: Show concentration

**Content**:

```
"What's the impact?"

[PWA Embed: Pareto chart of defects by factor]

"46% of all defects come from Factor C."

"One factor. Nearly half the problem."
```

**Visual**: Embedded PWA with Pareto, Factor C bar highlighted
**Scroll trigger**: Bars grow from zero → cumulative line draws → "46%" callout

---

### Section 5: VALUE (Capability)

**Purpose**: Show the business impact

**Content**:

```
"What happens when you fix it?"

[Before/After Capability comparison]

BEFORE: Cpk 0.8 (red zone)
AFTER:  Cpk 1.5 (green zone)

"The same process. Just focused on the right thing."
```

**Visual**: Side-by-side histograms with spec limits
**Scroll trigger**: Left histogram → transforms → right histogram

---

### Section 6: CLARITY

**Purpose**: Summarize the methodology

**Content**:

```
"The VaRiScout Journey"

1. AVERAGES said "95% - all good"
2. CHANGE revealed the hidden pattern
3. FLOW found where variation hides
4. FAILURE showed where problems concentrate
5. VALUE proved the business case

"46% of improvement potential in one place."

"Find it. Fix it. Check it. Continue."
```

**Visual**: Breadcrumb trail with icons for each pillar
**Scroll trigger**: Steps appear sequentially with connecting lines

---

### Section 7: CLOSE (CTA)

**Purpose**: Convert to product

**Content**:

```
"Where's YOUR 46%?"

[Three product cards]

PWA: "Try Free" → /app
Excel: "Get Add-in" → AppSource
Enterprise: "Learn More" → /products/enterprise

"No signup required. Your data stays on your device."
```

**Visual**: Product cards with clear CTAs
**Scroll trigger**: Cards scale in with stagger

---

## Technical Implementation

### React Islands Approach

Each chart section uses React Islands with pre-computed data from `@variscout/data`:

```astro
---
import IChartIsland from '../../components/islands/IChartIsland';
import BoxplotIsland from '../../components/islands/BoxplotIsland';
import ParetoIsland from '../../components/islands/ParetoIsland';
---

<IChartIsland client:only="react" sampleKey="journey" height={450} />
<BoxplotIsland client:only="react" sampleKey="journey" height={450} />
<ParetoIsland client:only="react" sampleKey="journey" height={450} />
```

### Chart Interaction

Charts render directly on the page without iframe communication. Scroll-triggered animations use Astro's ScrollReveal component:

```astro
<ScrollReveal animation="fade-up" delay={200}>
  <IChartIsland client:only="react" sampleKey="journey" height={450} />
</ScrollReveal>
```

### Scroll Triggers

Use `ScrollReveal.astro` component with Intersection Observer:

```astro
<ScrollReveal animation="fade-up" threshold={0.3}>
  <JourneySection ... />
</ScrollReveal>
```

### Progress Indicator

Sticky progress bar showing current section:

```
Mobile: ● ○ ○ ○ ○ ○ ○
Desktop: AVERAGES • CHANGE • FLOW • FAILURE • VALUE • CLARITY • CLOSE
                              ^^^^^ (highlighted)
```

---

## Journey Dataset

Create a curated dataset in `sampleData.ts`:

```typescript
{
  urlKey: 'journey',
  name: 'Journey Example',
  description: 'Curated dataset for the journey scroll experience',
  data: [
    // ~30 observations with:
    // - Factor A: stable, low variation
    // - Factor B: stable, low variation
    // - Factor C: pattern change at obs 15, high variation
    // Results in Factor C = 46% of defects
  ],
  specs: { USL: 105, LSL: 95 }
}
```

### Data Requirements

- Factor C must have:
  - Mean shift around observation 15
  - 3x the standard deviation of A and B
  - ~46% of out-of-spec values
  - Clear visual pattern in I-Chart

- After "fix" simulation:
  - Factor C returns to stable
  - Cpk improves from ~0.8 to ~1.5

---

## Mobile Considerations

- Sections are full-viewport height
- Progress indicator uses dots instead of labels
- PWA embeds sized for mobile viewport (min-height: 400px)
- Sticky CTA appears after Section 5

---

## Reduced Motion

When `prefers-reduced-motion: reduce`:

- Skip chart animations
- Show final state immediately
- Progress indicator doesn't animate
- Elements visible without scroll triggers

---

## A11y Requirements

- Each section has proper heading hierarchy (h2)
- Progress indicator uses aria-label for screen readers
- Chart embeds have descriptive titles
- Skip link to main CTA at top

---

## SEO

**Title**: "See Beyond Averages | VaRiScout Journey"
**Meta description**: "Discover how averages hide 46% of your improvement potential. An interactive journey through variation analysis."

---

## Related Files

- `apps/website/src/pages/[lang]/journey.astro` - Page component
- `apps/website/src/components/JourneySection.astro` - Section wrapper
- `apps/website/src/components/JourneyProgress.astro` - Progress indicator
- `apps/pwa/src/data/sampleData.ts` - Journey dataset
- `docs/design-system/ANIMATIONS.md` - Animation system
