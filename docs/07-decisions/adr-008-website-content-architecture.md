# ADR-008: Website Content Architecture

**Status**: Accepted

**Date**: 2026-02-13

---

## Context

VariScout's marketing website (variscout.com) needs to evolve from a basic product site into a comprehensive content platform that serves three distinct audiences:

1. **Cold visitors** — Quality professionals searching Google for SPC concepts, capability analysis, or specific industry problems
2. **Warm evaluators** — Professionals comparing tools, looking for proof that VariScout solves their specific use case
3. **App users** — Current PWA/Azure/Excel users who arrive via "Learn more" links from HelpTooltip (i) icons

The 13 strategic use cases identified in `docs/02-journeys/use-cases/` need to become rich, interactive landing pages. The existing tool pages (7), learn topics (10), glossary terms (35+), and case studies (10) need better cross-linking to form a cohesive content web.

### Benchmarks Considered

Six design philosophies were evaluated against world-class benchmarks:

| Philosophy                   | Benchmark                    | Strength                        | Weakness for VariScout  |
| ---------------------------- | ---------------------------- | ------------------------------- | ----------------------- |
| Playground (tool-first)      | Desmos, Observable           | Maximum conversion, viral       | Weak SEO, no narrative  |
| Academy (education-first)    | Moz, Ahrefs, Khan Academy    | Strongest SEO, authority        | Slow conversion         |
| Showcase (problem-first)     | Stripe, Linear, Notion       | Highest professional conversion | Weak for education      |
| Community (user-generated)   | Figma, Canva, Webflow        | Scales organically              | Requires critical mass  |
| Progressive Reveal (layered) | Loom, Mixpanel, Datadog      | Serves all intents              | Complex navigation      |
| Swiss Army (tool collection) | Ahrefs Tools, OmniCalculator | Maximum SEO surface             | Fragments product story |

### Minitab's Three-Layer Architecture

Minitab separates content across three properties:

1. **In-App Assistant** — Decision trees, simplified dialogs, embedded definitions
2. **support.minitab.com** — 4-page reference per topic (Before You Start -> How To -> Interpret -> Methods)
3. **minitab.com** — Marketing site with product pages, pricing, testimonials

VariScout unifies all three on one domain (better for SEO) and adds interactive charts (which Minitab lacks on the web).

---

## Decision

Adopt the **"Guided Problem Playground"** philosophy — a hybrid of Showcase + Playground + Contextual Learning — organized into **three content surfaces** on one domain.

### Three Surfaces

**Surface 1: Showcase (Acquisition)**

- Pages: Homepage, 13 use case pages, product pages, pricing
- Audience: Cold visitors from search, referrals, social
- Character: Problem-first headlines, live interactive demos, professional framing
- Primary CTA: "Try with your data" -> PWA

**Surface 2: Reference (Learning & Help)**

- Pages: 7 tool pages, 10 learn topics, 35+ glossary terms
- Audience: Both cold searchers AND warm app users (via HelpTooltip "Learn more")
- Character: Clean, focused, reference-first with live charts
- Primary CTA: "See this in context" -> relevant use case or case study

**Surface 3: Proof (Case Studies)**

- Pages: 10 case studies
- Audience: Evaluators comparing tools, curious visitors
- Character: 3-act narrative with interactive data exploration
- Primary CTA: "Try it yourself" -> PWA with same dataset

### Three Pillars

1. **Problem-First** — Every use case page opens with a professional's pain point, not a feature list
2. **Live Proof** — The demo is the actual chart with real data, not a screenshot or video
3. **Contextual Depth** — Learning is woven in via HelpTooltip (i) and collapsible sections, not a separate academy

### Cross-Linking Strategy

All content types link bidirectionally:

- Use cases -> tool pages, case studies, glossary terms
- Tool pages -> case studies ("See it in action"), use cases ("Industries using this")
- Learn pages -> case studies ("See it in practice")
- Case studies -> use cases, tool pages
- Glossary -> tool pages, learn pages (already exists)

### Data Architecture

Content follows the established TypeScript data file pattern:

- `useCaseData.ts` — 13 use case entries (new)
- `toolsData.ts` — 7 tools (add `relatedCases` field)
- `learnData.ts` — 10 topics (add `relatedCases` field)
- `glossaryData.ts` — 35+ terms (unchanged for now)

---

## Consequences

### Positive

- 13 new SEO-optimized landing pages targeting high-value keyword clusters
- Bidirectional cross-links increase time-on-site and internal link equity
- Live chart demos differentiate from competitors (Minitab, JMP have static screenshots)
- Existing content (tools, learn, glossary, cases) gains new traffic through cross-links
- "Guided Problem Playground" serves both education and professional audiences

### Negative

- 6 new sample datasets needed for use cases without matching data
- Significant content effort per use case (problem narrative, journey, before/after)
- Navigation complexity increases with "Solutions" dropdown
- Cross-link maintenance burden grows as content types multiply

### Risks

- Use case pages may cannibalize existing tool page traffic (mitigated: different intent)
- Navigation could become confusing with three surfaces (mitigated: clear URL structure and dropdown design)

---

## Alternatives Rejected

- **Pure Academy** — Too slow for professional conversion; education should be embedded, not structural
- **Pure Playground** — Weak SEO; no narrative context for search traffic
- **Community model** — Requires critical mass that VariScout doesn't yet have
- **Separate subdomain** — Splits domain authority; one domain is better for SEO

---

## References

- [Use Cases Documentation](../02-journeys/use-cases/index.md)
- [Website Design Philosophy](../08-products/website/design-philosophy.md)
- [Website Content Architecture](../08-products/website/content-architecture.md)
