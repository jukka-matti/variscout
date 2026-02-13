# Website Content Architecture

Technical specification for how content is organized, cross-linked, and rendered on the VariScout website.

---

## Three Surfaces

```
ACQUISITION              REFERENCE              PROOF
(Problem-first)          (Method-first)         (Story-first)

Use Case Page ---------> Tool Page              Case Study
"Your supplier            "How Capability        "The supplier said
 Cpk is wrong"            analysis works"        Cpk = 1.72. We
       |                        |               found 0.98."
       |                  (i) tooltips               |
       |                        |                    |
       |                  Glossary Term              |
       |                  "Cpk = min(CPU,CPL)"       |
       |                        ^                    |
       |                        |                    |
       +--------> PWA <---------+--------------------+
              "Try it"    "Learn more"       "Try it"
                          (from HelpTooltip)
```

---

## Content Type Inventory

| Content Type | Data File          | Count | Template                        | URL Pattern                          |
| ------------ | ------------------ | ----- | ------------------------------- | ------------------------------------ |
| Use Cases    | `useCaseData.ts`   | 13    | `[lang]/use-cases/[slug].astro` | `/en/use-cases/supplier-performance` |
| Tools        | `toolsData.ts`     | 7     | `[lang]/tools/[tool].astro`     | `/en/tools/i-chart`                  |
| Learn Topics | `learnData.ts`     | 10    | `[lang]/learn/[topic].astro`    | `/en/learn/two-voices`               |
| Glossary     | `glossaryData.ts`  | 35+   | `[lang]/glossary/[term].astro`  | `/en/glossary/cpk`                   |
| Case Studies | inline in template | 10    | `[lang]/cases/[slug].astro`     | `/en/cases/bottleneck`               |
| Products     | inline in template | 3+    | `[lang]/product/[slug].astro`   | `/en/product/azure`                  |

All content types multiply by 5 languages (en, de, es, fr, pt).

---

## Cross-Linking Graph

| From \ To     | Tools        | Learn         | Glossary          | Cases                    | Use Cases |
| ------------- | ------------ | ------------- | ----------------- | ------------------------ | --------- |
| **Tools**     | nextTools    | relatedLearn  | —                 | relatedCases             | —         |
| **Learn**     | relatedTools | relatedTopics | —                 | relatedCases             | —         |
| **Glossary**  | relatedTools | relatedLearn  | relatedTerms      | —                        | —         |
| **Cases**     | tools        | —             | —                 | relatedCases (WhatsNext) | —         |
| **Use Cases** | relatedTools | relatedLearn  | (inline tooltips) | relatedCases             | —         |

---

## Data File Pattern

All data files follow the same conventions:

```typescript
// 1. Export interface
export interface ContentType { ... }

// 2. Export const array
export const ITEMS: ContentType[] = [ ... ];

// 3. Export helper functions
export function getBySlug(slug: string): ContentType | undefined;
export function getAllSlugs(): string[];
```

### useCaseData.ts (NEW)

```typescript
export interface UseCase {
  slug: string;
  title: string;
  subtitle: string;
  industry: string;
  role: string;
  problem: {
    headline: string;
    description: string;
    misleadingMetric: string;
    reality: string;
  };
  demo: {
    sampleKey: string;
    chartType: 'i-chart' | 'boxplot' | 'capability' | 'pareto' | 'performance';
    caption: string;
  };
  journey: Array<{
    step: number;
    tool: string;
    title: string;
    description: string;
    insight: string;
  }>;
  ahaQuote: string;
  beforeAfter: Array<{ before: string; after: string }>;
  relatedCases: string[];
  relatedTools: string[];
  relatedLearn: string[];
  platformFit: Array<{
    stage: string;
    product: 'pwa' | 'excel' | 'azure';
    reason: string;
  }>;
  keywords: string[];
  metaDescription: string;
}
```

### toolsData.ts (EXTENDED)

Add field:

```typescript
relatedCases?: string[];  // Case study slugs for "See It in Action"
```

### learnData.ts (EXTENDED)

Add field:

```typescript
relatedCases?: string[];  // Case study slugs for "See It in Practice"
```

---

## Use Case Template Anatomy

The `[lang]/use-cases/[slug].astro` template renders 6 sections:

### Section 1: Hero

- Industry badge (Manufacturing, Healthcare, etc.)
- Role context ("Supplier Quality Engineer")
- SEO headline (problem-first, keyword-targeted)
- Subtitle (2 sentences of context)

### Section 2: The Problem

- Misleading metric callout ("Your dashboard says...")
- Reality statement ("But actually...")
- 2-3 sentence problem description

### Section 3: Interactive Demo

- React island chart with pre-loaded sample data
- Caption explaining what the chart shows
- Same chart components used in the real product

### Section 4: The Journey

- Numbered steps (1-4) with tool badges
- Each step: tool name, title, description, insight
- "Aha" quote at the end

### Section 5: Before / After

- Two-column comparison table
- Concrete transformations (e.g., "Gut-feeling priorities" -> "Data-driven Pareto ranking")

### Section 6: What's Next

- Related case studies ("See the proof")
- Related tools (linked cards)
- Platform fit table (PWA vs Excel vs Azure)
- Primary CTA: "Try with your data"

---

## Sample Data Requirements

| Use Case             | Sample Key      | Status | Notes                 |
| -------------------- | --------------- | ------ | --------------------- |
| Assembly Bottleneck  | `bottleneck`    | Exists | Perfect match         |
| University SPC       | `coffee`        | Exists | Good fit for training |
| Supplier PPAP        | `mango-export`  | Exists | Reuse for capability  |
| Supplier Performance | `journey`       | Exists | Multiple factors      |
| COPQ Drill-Down      | `packaging`     | Exists | Defect types + shifts |
| Customer Complaint   | `cookie-weight` | Exists | Before/after pattern  |
| Patient Wait Time    | `hospital-ward` | Exists | Phase 2               |
| Call Center          | `call-wait`     | Exists | Phase 2               |
| On-Time Delivery     | `delivery`      | Exists | Phase 2               |
| Batch Consistency    | `packaging`     | Exists | Phase 3, reuse        |
| Consultant Delivery  | `journey`       | Exists | Phase 3, reuse        |
| Pharma OOS           | —               | Needed | Phase 3               |
| Lead Time Variation  | —               | Needed | Phase 3               |

---

## Navigation Structure

### Header

```
[Home] [Journey] [Methods v] [Solutions v] [Product v] [Pricing] [Try Now]

Solutions dropdown:
+-- By Industry
|   +-- Manufacturing
|   +-- Automotive
|   +-- Healthcare
|   +-- Education
|   +-- Service Operations
+-- By Challenge
|   +-- Cost of Poor Quality
|   +-- Customer Complaints
|   +-- Supplier Capability
+-- All Use Cases
```

### Footer

Expand "Use Cases" section from 2 items to industry groupings matching the Solutions dropdown.

---

## How to Add a New Use Case

1. Add entry to `apps/website/src/data/useCaseData.ts`
2. Ensure sample dataset exists in `@variscout/data` (or reuse existing)
3. Add any new i18n strings to `src/i18n/ui.ts` if needed for nav
4. Update footer links if adding to a new industry grouping
5. Run `pnpm --filter @variscout/website build` to verify

The template auto-generates pages for all languages. No template changes needed.

---

## i18n Considerations

- Use case data is English-only (no translation of problem descriptions, journey steps, etc.)
- Navigation labels (Solutions, industry names) need translation in `ui.ts`
- URL slugs remain English across all languages (`/de/use-cases/supplier-performance`)
- Chart content comes from `@variscout/data` which is language-neutral (numbers, chart labels)

---

## See Also

- [ADR-008: Website Content Architecture](../../07-decisions/adr-008-website-content-architecture.md)
- [Design Philosophy](design-philosophy.md)
- [Website Overview](index.md)
- [Use Cases Documentation](../../02-journeys/use-cases/index.md)
