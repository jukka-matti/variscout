# Website Design Philosophy

> **"Guided Problem Playground"** — Every page starts with a professional's real problem, proves the solution with a live interactive chart, and offers contextual depth exactly where you need it.

---

## The Philosophy in One Sentence

Showcase (problem-first, Stripe model) + Playground (live charts, Desmos model) + Contextual Learning (Minitab-style progressive disclosure).

---

## Three Pillars

### 1. Problem-First (from Showcase / Stripe)

Every use case page opens with a headline that names the professional's pain:

> "Your average wait time is fine. Your patients' experience isn't."

The visitor immediately sees themselves in the problem — before VariScout is even mentioned. The "job to be done" drives the page structure, not the feature list.

**Anti-pattern:** Generic feature tours without problem context. "Our I-Chart has auto-calculated control limits" means nothing without "Your supplier's data shows a shift at batch 47 — here's what that means."

### 2. Live Proof (from Playground / Desmos)

The demo on every page is NOT a video, NOT a screenshot — it's the actual chart with real data.

- Pre-loaded sample dataset illustrates the exact problem described in the headline
- The visitor can interact: hover for values, see tooltips, understand the data
- One click to "Try with your own data" → opens PWA with the same view

**Anti-pattern:** Screenshots of charts, embed videos, or static illustrations where a live interactive chart could be shown.

### 3. Contextual Depth (from Minitab Assistant + Progressive Disclosure)

Learning is NOT a separate section — it's woven into the experience:

- When you see a Cpk value, there's a (i) HelpTooltip that explains what Cpk means
- "How to read this chart" is a collapsible section ON the chart, not a separate page
- "Why this matters" callouts explain the methodology inline
- The existing Learn pages, Glossary, and Tool pages are the **deep reference layer** — linked from contextual tooltips, not presented as a separate navigation path

**Anti-pattern:** A separate "Academy" or "Learn" section that competes with reference pages for attention. Learning should happen IN context, not BEFORE context.

---

## The Visitor Experience

### A Supplier Quality Engineer searches "how to verify supplier Cpk data"

1. **Lands on** `/use-cases/supplier-ppap` — headline: "Verify supplier capability in minutes, not hours."
2. **Sees the problem** described in 2 sentences (they recognize their situation)
3. **Below:** A live interactive chart showing an I-Chart of supplier data — one point outside limits is highlighted
4. **Scrolls to the journey:** Step 1 I-Chart → Step 2 Capability → Step 3 Performance Mode. Each step has a mini-chart demo.
5. **On the Capability chart**, Cpk = 0.98 is shown. A (i) HelpTooltip explains: "Cpk measures how centered your process is within spec limits. Below 1.0 means the process is producing out-of-spec parts."
6. **"Learn more"** opens the glossary Cpk page for the full formula and thresholds — but the visitor already understood the key insight WITHOUT leaving the page
7. **Before/After table** shows the transformation
8. **CTA:** "Try with your PPAP data" → opens PWA, OR "See the full analysis" → links to relevant case study
9. **Platform fit table:** "For full PPAP review across 25+ characteristics → Azure App"

---

## Dual-Audience Design

Every reference page serves two audiences simultaneously:

| Audience      | Arrives From             | Needs                                 | Content Strategy                        |
| ------------- | ------------------------ | ------------------------------------- | --------------------------------------- |
| Cold searcher | Google search            | Context, explanation, trust           | Problem framing, live demo, methodology |
| Warm app user | HelpTooltip "Learn more" | Focused reference, formula, threshold | Clean definition, interpretation table  |

The same page works for both because:

- **Top section** is definitional (serves the warm user immediately)
- **Middle section** is explanatory (serves the cold searcher)
- **Bottom section** connects to related content (serves both)

---

## How This Differs from Alternatives

### vs Pure Showcase (Stripe)

| Pure Showcase              | Guided Problem Playground    |
| -------------------------- | ---------------------------- |
| Screenshot or illustration | Live interactive chart       |
| "See features" CTA         | "Try with your data" CTA     |
| Learning in docs section   | Learning inline via tooltips |
| Separate product pages     | Product IS the demo          |

### vs Pure Playground (Desmos)

| Pure Playground              | Guided Problem Playground                 |
| ---------------------------- | ----------------------------------------- |
| Tool IS the homepage         | Problem IS the homepage, tool proves it   |
| No narrative context         | Story frames the data                     |
| Learning through exploration | Guided discovery with contextual hints    |
| Weak SEO (no text content)   | Strong SEO (problem narrative + keywords) |

### vs Academy (Moz/Ahrefs)

| Academy                       | Guided Problem Playground                  |
| ----------------------------- | ------------------------------------------ |
| Read → understand → try       | See problem → see proof → dig deeper       |
| Education drives discovery    | Problem drives discovery                   |
| Blog posts as primary content | Use case pages as primary content          |
| "Learn about Cpk"             | "This supplier's Cpk is 0.98 — here's why" |

---

## Minitab Comparison

Minitab uses three separate layers:

| Layer               | Minitab                         | VariScout Equivalent           |
| ------------------- | ------------------------------- | ------------------------------ |
| In-App Assistant    | Desktop decision tree + dialogs | HelpTooltip (i) + useGlossary  |
| support.minitab.com | 4-page reference per topic      | Learn pages + Glossary pages   |
| minitab.com         | Marketing site                  | Use case pages + Product pages |

**Key differences:**

- VariScout puts all three on one domain (better for SEO)
- VariScout Learn/Glossary pages have live interactive charts (Minitab has static images)
- VariScout's help is public and free (Minitab's is for paid users)

---

## Content Principles

1. **Every page starts with a problem, not a feature** — The visitor should recognize their situation before they see VariScout
2. **Every claim has a live interactive proof** — If you can show a chart instead of describing one, show the chart
3. **Learning is contextual, not structural** — Inline tooltips and collapsible sections, not a separate Academy
4. **Reference pages are clean and focused** — No marketing noise on Learn/Glossary pages; they serve dual audiences
5. **Cross-links form a web, not a funnel** — Any page can lead to any other relevant page; don't force linear paths

---

## Anti-Patterns

| Don't                                       | Do Instead                            |
| ------------------------------------------- | ------------------------------------- |
| Feature tours without problem context       | Name the professional's pain first    |
| Screenshots when a live chart can be shown  | Use React island with sample data     |
| Separate "Academy" competing with reference | Embed learning inline with tooltips   |
| Marketing noise on reference pages          | Keep Learn/Glossary clean and focused |
| Force linear funnels                        | Let cross-links form a natural web    |
| Generic "SPC software" messaging            | Industry-specific problem framing     |

---

## See Also

- [ADR-008: Website Content Architecture](../../07-decisions/adr-008-website-content-architecture.md)
- [Content Architecture](content-architecture.md)
- [Website Overview](index.md)
