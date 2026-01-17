# VaRiScout: Contextual Learning System

> "Help where you need it - not buried in documentation you'll never read."

---

## The Philosophy

**Learning should happen in context, not in separate documentation.**

Traditional software documentation follows the "manual" paradigm:

| Traditional Approach           | Contextual Learning (VaRiScout)   |
| ------------------------------ | --------------------------------- |
| Documentation lives separately | Help appears where you need it    |
| Read first, then use           | Learn while doing                 |
| User must search for answers   | Answers appear at point of need   |
| Static text explains concepts  | Interactive tooltips + deep dives |
| "Read the manual"              | "See the (i) icon? Hover it."     |

**The insight:** Quality professionals aren't looking for reading material. They're trying to understand what Cpk means _while looking at their Cpk value_.

---

## The Two-Layer Model

VaRiScout's learning system has two interconnected layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: TOOLTIPS                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  (i) Cpk                                                             │    │
│  │  ─────────────────────────────────────────────────────────────────   │    │
│  │  Process Capability Index. Like Cp, but accounts for how well        │    │
│  │  centered the process is. ≥1.33 is good.                             │    │
│  │                                                                       │    │
│  │  Learn more →                                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  • Appears on hover/focus                                                   │
│  • 50-100 character definition                                              │
│  • Link to deep content                                                     │
│  • Consistent across PWA, Excel, Website                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 2: DEEP CONTENT                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  /glossary/cpk                                                       │    │
│  │  ─────────────────────────────────────────────────────────────────   │    │
│  │  • Full definition and context                                       │    │
│  │  • Formula: Cpk = min(CPU, CPL)                                      │    │
│  │  • Interpretation guide (grades, thresholds)                         │    │
│  │  • Practical tips                                                    │    │
│  │  • Related terms: Cp, USL, LSL, Mean                                 │    │
│  │  • Related tools: /tools/capability                                  │    │
│  │  • Related learning: /learn/two-voices                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  OR                                                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  /learn/two-voices                                                   │    │
│  │  ─────────────────────────────────────────────────────────────────   │    │
│  │  • Conceptual article (Voice of Process vs Voice of Customer)        │    │
│  │  • Multiple sections with visuals                                    │    │
│  │  • Related tools and topics                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  OR                                                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  /tools/capability                                                   │    │
│  │  ─────────────────────────────────────────────────────────────────   │    │
│  │  • Interactive tool guide with live chart                            │    │
│  │  • When to use, how to read, patterns to find                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Tooltips (Immediate Context)

**Purpose:** Answer "what does this mean?" without leaving the current task.

**Characteristics:**

- Appears on hover (mouse) or focus (keyboard)
- Short definition (50-100 characters)
- Optional "Learn more" link to Layer 2
- Consistent visual design (ⓘ icon)
- Accessible (keyboard navigable, ARIA labels)

**Implementation:** `HelpTooltip` component from `@variscout/ui`

### Layer 2: Deep Content (Extended Learning)

**Purpose:** Provide comprehensive understanding when the user wants to learn more.

**Three types of deep content:**

| Content Type       | Purpose                    | Example Path        |
| ------------------ | -------------------------- | ------------------- |
| **Glossary Pages** | Term definitions + context | `/glossary/cpk`     |
| **Learn Topics**   | Conceptual articles        | `/learn/two-voices` |
| **Tool Guides**    | Interactive how-to guides  | `/tools/capability` |

---

## Term Categories

Glossary terms map to VaRiScout's analytical structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GLOSSARY CATEGORIES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │  CONTROL    │  │ CAPABILITY  │  │ STATISTICS  │                         │
│  │   LIMITS    │  │             │  │             │                         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤                         │
│  │ UCL, LCL    │  │ Cp, Cpk     │  │ Mean, StdDev│                         │
│  │ USL, LSL    │  │ Pass Rate   │  │ F-Statistic │                         │
│  │ Target      │  │ Rejected    │  │ p-value     │                         │
│  │             │  │             │  │ η², R²      │                         │
│  │             │  │             │  │ GRR metrics │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐                                          │
│  │   CHARTS    │  │ METHODOLOGY │                                          │
│  ├─────────────┤  ├─────────────┤                                          │
│  │ I-Chart     │  │ Four Pillars│                                          │
│  │ Boxplot     │  │ Two Voices  │                                          │
│  │ Pareto      │  │ Drill-down  │                                          │
│  │ Histogram   │  │ EDA         │                                          │
│  └─────────────┘  └─────────────┘                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Category Mapping to Four Pillars

| Category       | Primary Pillar | Primary Tool     | Primary Learn Topic |
| -------------- | -------------- | ---------------- | ------------------- |
| control-limits | CHANGE, VALUE  | I-Chart, Capable | Two Voices          |
| capability     | VALUE          | Capability       | Two Voices          |
| statistics     | (all)          | (varies)         | EDA Philosophy      |
| charts         | (all)          | (varies)         | Four Pillars        |
| methodology    | (all)          | (all)            | Four Pillars        |

---

## GlossaryTerm Structure

The core glossary term interface lives in `@variscout/core`:

```typescript
interface GlossaryTerm {
  /** Unique identifier (e.g., 'cp', 'ucl', 'pValue') */
  id: string;

  /** Display label (e.g., 'Cp', 'UCL', 'p-value') */
  label: string;

  /** Short definition for tooltip (50-100 chars) */
  definition: string;

  /** Extended explanation for expanded views */
  description?: string;

  /** Category for grouping */
  category: GlossaryCategory;

  /** Path to learn more content */
  learnMorePath?: string;

  /** IDs of related terms */
  relatedTerms?: string[];
}
```

### Design Decisions

**Why `id` vs `label`?**

- `id` is machine-friendly: `cpk`, `ucl`, `pValue`
- `label` is human-friendly: `Cpk`, `UCL`, `p-value`
- IDs never change; labels can be localized

**Why `definition` vs `description`?**

- `definition` is the tooltip text (short, scannable)
- `description` is the expanded explanation (detailed, contextual)
- Tooltip shows definition; glossary page shows both

**Why `learnMorePath` vs separate routing?**

- Flexibility: some terms link to `/tools/`, some to `/learn/`, some to `/glossary/`
- Explicit: the data knows where each term's deep content lives
- Future-proof: new content types can be added without schema changes

---

## Integration Strategy

### Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT INTERCONNECTION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌──────────┐                                   │
│                              │  TOOLS   │                                   │
│                              │ /tools/* │                                   │
│                              └────┬─────┘                                   │
│                                   │                                          │
│                      tooltips on "How to Read"                              │
│                                   │                                          │
│                                   ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        GLOSSARY                                       │   │
│  │                       /glossary/*                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │ Each term page contains:                                     │     │   │
│  │  │ • Definition + Description                                   │     │   │
│  │  │ • Related Terms (→ other glossary pages)                     │     │   │
│  │  │ • Related Tools (→ tool guides)                              │     │   │
│  │  │ • Related Learn (→ concept articles)                         │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│                              ┌──────────┐                                   │
│                              │  LEARN   │                                   │
│                              │ /learn/* │                                   │
│                              └──────────┘                                   │
│                                                                              │
│  BIDIRECTIONAL: Tools ↔ Glossary ↔ Learn                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### PWA Integration

In the PWA app, tooltips appear next to metrics and labels:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stats Panel                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Mean (i)         Cpk (i)         Pass Rate (i)                             │
│   12.34            1.45             97.3%                                   │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Hover (i) → Tooltip with definition                                        │
│  Click "Learn more" → Opens website glossary page                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Excel Add-in Integration

Excel uses the same glossary data with Fluent UI styling:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Excel Task Pane                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [?] Cpk                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Process Capability Index. Like Cp, but accounts for centering.        │  │
│  │                                                                       │  │
│  │ [Learn more]  ← Opens in browser                                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Website Integration

Website pages use tooltips for technical terms:

| Page Type   | Integration Point                 | Example                        |
| ----------- | --------------------------------- | ------------------------------ |
| Tool pages  | "How to Read" elements            | UCL/LCL on I-Chart page        |
| Learn pages | Key terms in section content      | "Control limits" in Two Voices |
| Glossary    | Related terms section             | Links between Cp → Cpk         |
| Cases       | Technical terms in analysis steps | "Cpk" in coffee case           |

---

## Website Glossary Pages

### Route Structure

```
/[lang]/glossary/              → Index page (all terms by category)
/[lang]/glossary/[term]        → Individual term page
```

### Index Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ /en/glossary/                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GLOSSARY                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Your guide to quality and statistical terms.                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CONTROL LIMITS                                              [🎯]    │    │
│  │ Boundaries that define expected process behavior                     │    │
│  │                                                                       │    │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐                      │    │
│  │ │ UCL  │ │ LCL  │ │ USL  │ │ LSL  │ │ Target │                      │    │
│  │ └──────┘ └──────┘ └──────┘ └──────┘ └────────┘                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CAPABILITY                                                  [📊]    │    │
│  │ Metrics that compare process performance to requirements             │    │
│  │                                                                       │    │
│  │ ┌──────┐ ┌──────┐ ┌───────────┐ ┌──────────┐                        │    │
│  │ │ Cp   │ │ Cpk  │ │ Pass Rate │ │ Rejected │                        │    │
│  │ └──────┘ └──────┘ └───────────┘ └──────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  (more categories...)                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Term Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ /en/glossary/cpk                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ← Glossary  /  Capability                                                  │
│                                                                              │
│  Cpk                                                         [CAPABILITY]   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Process Capability Index                                                   │
│                                                                              │
│  DEFINITION                                                                 │
│  Process Capability Index. Like Cp, but accounts for how well centered      │
│  the process is. ≥1.33 is good.                                             │
│                                                                              │
│  EXTENDED EXPLANATION                                                       │
│  Cpk considers both spread and centering. It takes the minimum of CPU       │
│  and CPL. A Cpk much lower than Cp indicates the process mean is shifted    │
│  toward one spec limit.                                                     │
│                                                                              │
│  FORMULA                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Cpk = min(CPU, CPL)                                                   │  │
│  │  where:                                                                │  │
│  │    CPU = (USL - Mean) / 3σ                                             │  │
│  │    CPL = (Mean - LSL) / 3σ                                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  INTERPRETATION                                                             │
│  • Cpk ≥ 1.67  →  Excellent                                                │
│  • Cpk ≥ 1.33  →  Good (industry standard)                                 │
│  • Cpk ≥ 1.00  →  Marginal                                                 │
│  • Cpk < 1.00  →  Not capable                                              │
│                                                                              │
│  💡 PRACTICAL TIP                                                           │
│  If Cpk is much lower than Cp, focus on centering the process.             │
│  If they're similar, focus on reducing variation.                          │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  RELATED TERMS                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                       │
│  │ Cp   │ │ USL  │ │ LSL  │ │ Mean │                                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                                       │
│                                                                              │
│  RELATED TOOLS                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [📊] Capability Analysis                                            │    │
│  │      See if your process meets customer requirements                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  CONTINUE LEARNING                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [🎭] Two Voices - Control vs Specification                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [Try VaRiScout Free]                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Internationalization (i18n)

### Locale File Structure

```
packages/core/src/glossary/
├── types.ts         # GlossaryTerm, GlossaryCategory, GlossaryLocale
├── terms.ts         # English terms (default)
├── index.ts         # Exports + getLocalizedTerm()
└── locales/
    ├── de.ts        # German translations
    ├── es.ts        # Spanish translations
    ├── fr.ts        # French translations
    └── pt.ts        # Portuguese translations
```

### Locale Data Structure

```typescript
// packages/core/src/glossary/locales/de.ts
export const deGlossary: GlossaryLocale = {
  locale: 'de',
  terms: {
    cpk: {
      label: 'Cpk',
      definition:
        'Prozessfähigkeitsindex. Wie Cp, berücksichtigt aber die Zentrierung. ≥1,33 ist gut.',
      description: 'Cpk berücksichtigt sowohl die Streuung als auch die Zentrierung...',
    },
    // ... more terms
  },
};
```

### Localized Term Lookup

```typescript
// Usage
import { getLocalizedTerm } from '@variscout/core';

const term = getLocalizedTerm('cpk', 'de');
// Returns term with German label/definition/description
// Falls back to English if translation missing
```

---

## SEO Considerations

### Schema.org Markup

Glossary pages should use `DefinedTerm` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": "Cpk",
  "description": "Process Capability Index. Like Cp, but accounts for how well centered the process is.",
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "VaRiScout Quality Glossary",
    "url": "https://variscout.com/en/glossary/"
  }
}
```

### Meta Tags

```html
<title>Cpk - Process Capability Index | VaRiScout Glossary</title>
<meta
  name="description"
  content="Cpk measures process capability accounting for centering. Learn what Cpk means, how to calculate it, and when your process is capable."
/>
```

---

## Future Expansion

### Adding New Terms

1. Add term to `packages/core/src/glossary/terms.ts`
2. Add translations to locale files (if i18n active)
3. Term automatically appears in glossary index
4. Optionally add website extensions for rich content

### Adding New Categories

1. Add category to `GlossaryCategory` type
2. Add category metadata to `GLOSSARY_CATEGORIES`
3. Add terms with new category
4. Category section appears on index page

### Adding New Languages

1. Create `packages/core/src/glossary/locales/[lang].ts`
2. Export from glossary index
3. Add language to `apps/website/src/i18n/ui.ts`
4. Routes automatically work via `[lang]` parameter

### Content Guidelines

**Definition (tooltip text):**

- 50-100 characters
- One sentence
- Active voice
- No jargon (or define it)

**Description (extended explanation):**

- 2-3 sentences
- Provides context
- Explains "why it matters"
- References related concepts

**Practical Tip:**

- Actionable advice
- "If X, then Y" format
- Connects theory to practice

---

## Implementation Checklist

### Core Package (`@variscout/core`)

- [ ] `glossary/types.ts` - GlossaryTerm, GlossaryCategory, GlossaryLocale
- [ ] `glossary/terms.ts` - ~20 terms covering all categories
- [ ] `glossary/index.ts` - getTerm, getTermsByCategory, getLocalizedTerm
- [ ] `glossary/locales/*.ts` - Translation files (de, es, fr, pt)

### UI Package (`@variscout/ui`)

- [ ] `HelpTooltip` - React tooltip component
- [ ] `useGlossary` - Hook for accessing terms
- [ ] CSS theming via custom properties

### Website (`apps/website`)

- [ ] `data/glossaryData.ts` - Website-specific extensions
- [ ] `pages/[lang]/glossary/index.astro` - Glossary index page
- [ ] `pages/[lang]/glossary/[term].astro` - Term page template
- [ ] `components/GlossaryTooltip.astro` - Static tooltip
- [ ] `components/islands/GlossaryTooltipIsland.tsx` - React island
- [ ] Update `toolsData.ts` - Add termId to howToRead elements
- [ ] Update `i18n/ui.ts` - Glossary UI strings

### PWA (`apps/pwa`)

- [ ] Add HelpTooltip to StatsPanel metrics
- [ ] Add HelpTooltip to chart element labels
- [ ] Configure websiteUrl for "Learn more" links

### Excel Add-in (`apps/excel-addin`)

- [ ] Create Fluent UI HelpTooltip variant
- [ ] Add tooltips to task pane metrics
- [ ] Configure browser opening for "Learn more"

---

_This document describes VaRiScout's contextual learning system - the philosophy, architecture, and implementation strategy for help tooltips and glossary pages._
