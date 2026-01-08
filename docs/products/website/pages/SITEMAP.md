# Site Map & Navigation

## Overview

Complete site architecture for variscout.com. The **Journey** is the central experience—every page either leads TO, is part OF, or leads FROM the journey.

---

## URL Structure

```
variscout.com
│
├── /                           Home (AVERAGES hook → Journey)
│
├── /journey                    ★ THE JOURNEY (central experience)
│
├── /tools/                     Tool pages (Four Pillars)
│   ├── /i-chart                CHANGE pillar - Patterns over time
│   ├── /boxplot                FLOW pillar - Compare factors
│   ├── /pareto                 FAILURE pillar - Prioritize problems
│   └── /capability             VALUE pillar - Meet specs
│
├── /cases/                     Interactive case studies
│   ├── /bottleneck             Week 1: Process step analysis
│   ├── /hospital-ward          Week 5: Aggregation trap
│   ├── /coffee                 Week 9: Drying bed comparison
│   ├── /packaging              Week 9: Defect analysis
│   └── /avocado                Week 12: Regression analysis
│
├── /learn/                     Conceptual learning
│   ├── /two-voices             Control vs Spec limits
│   ├── /four-pillars           Watson framework
│   ├── /eda-philosophy         Visual exploration
│   └── /staged-analysis        Compare process phases
│
├── /product/
│   ├── /web-app                VaRiScout Web (PWA)
│   ├── /excel                  VaRiScout for Excel
│   ├── /power-bi               VaRiScout for Power BI
│   ├── /azure                  VaRiScout Azure
│   └── /compare                Product comparison
│
├── /use-cases/
│   ├── /lss-training           LSS Training & Projects
│   └── /operations             Quality & Operations
│
├── /pricing                    Pricing page
│
├── /resources/
│   ├── /variation-scouting     #VariationScouting content hub
│   ├── /sample-data            Downloadable datasets
│   └── /tutorials              How-to guides
│
├── /enterprise                 Enterprise information
│
├── /about                      About page
│
├── /contact                    Contact page
│
├── /legal/
│   ├── /privacy                Privacy policy
│   └── /terms                  Terms of service
│
└── /app                        The actual PWA
```

---

## Navigation Structure

### Primary Navigation (Desktop)

Journey is the **primary nav item** (bold, brand color), not hidden in a dropdown.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🔍 VaRiScout   Journey   Explore ▼   Tools ▼   Learn ▼   Product ▼   Pricing  [Try Free]│
└─────────────────────────────────────────────────────────────────────────────────────────┘
                    ↑
              Bold, primary color
```

#### Explore Dropdown

```
┌─────────────────────────────┐
│ Journey                     │ → /journey (See the 46% story)
│ Case Studies                │ → /cases (Practice scenarios)
└─────────────────────────────┘
```

#### Tools Dropdown

```
┌─────────────────────────────┐
│ I-Chart                     │ → /tools/i-chart (Patterns over time)
│ Boxplot                     │ → /tools/boxplot (Compare factors)
│ Pareto                      │ → /tools/pareto (Prioritize problems)
│ Capability                  │ → /tools/capability (Meet specs)
│ ─────────────────────────── │
│ All Tools →                 │ → /tools
└─────────────────────────────┘
```

#### Learn Dropdown

```
┌─────────────────────────────┐
│ Two Voices                  │ → /learn/two-voices (Control vs Spec)
│ Four Pillars                │ → /learn/four-pillars (Watson framework)
│ EDA Philosophy              │ → /learn/eda-philosophy (Visual exploration)
│ Staged Analysis             │ → /learn/staged-analysis (Process phases)
└─────────────────────────────┘
```

#### Product Dropdown

```
┌─────────────────────────────┐
│ Web App                     │ → /product/web-app
│ Excel                       │ → /product/excel
│ Power BI                    │ → /product/power-bi
│ Azure                       │ → /product/azure
│ ─────────────────────────── │
│ Compare All →               │ → /product/compare
└─────────────────────────────┘
```

### Mobile Navigation

Journey is prominently featured at the top of mobile menu.

```
┌─────────────────────────────────┐
│  🔍 VaRiScout            ☰     │
└─────────────────────────────────┘

(Expanded)
┌─────────────────────────────────┐
│ ★ Take the Journey              │ → /journey (highlighted, primary color)
│ ─────────────────────────────── │
│ EXPLORE                         │
│   Journey                       │
│   Case Studies                  │
│ TOOLS                           │
│   I-Chart                       │
│   Boxplot                       │
│   Pareto                        │
│   Capability                    │
│ LEARN                           │
│   Two Voices                    │
│   Four Pillars                  │
│   EDA Philosophy                │
│   Staged Analysis               │
│ PRODUCT                         │
│   Web App                       │
│   Excel                         │
│   Power BI                      │
│   Azure                         │
│ ─────────────────────────────── │
│ Pricing                         │
│ [🌐 EN | FI | SV]               │
│ [Try Free]                      │
└─────────────────────────────────┘
```

---

## Footer Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 VaRiScout                                                                   │
│  Find it. Fix it. Check it. Continue.                                           │
│                                                                                 │
│  Explore          Tools            Learn            Product         Company     │
│  ────────         ──────           ──────           ────────        ───────     │
│  Journey          I-Chart          Two Voices       Web App         About       │
│  Case Studies     Boxplot          Four Pillars     Excel           Contact     │
│                   Pareto           EDA Philosophy   Power BI                    │
│                   Capability       Staged Analysis  Azure                       │
│                                                     Pricing                     │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  © 2026 RDMAIC Oy    Privacy  |  Terms  |  AppSource  |  Azure                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Page Priority & SEO Focus

### High Priority (Core Pages)

| Page         | Primary Keyword                 | Secondary Keywords                    |
| ------------ | ------------------------------- | ------------------------------------- |
| Home         | variation analysis              | SPC, control charts, Lean Six Sigma   |
| **Journey**  | **variation analysis tutorial** | **learn SPC, Six Sigma journey**      |
| Web App      | online SPC tool                 | control chart online, boxplot tool    |
| Power BI     | Power BI SPC                    | Power BI control chart, custom visual |
| Pricing      | VaRiScout pricing               | SPC software cost                     |
| LSS Training | Six Sigma tools                 | Green Belt software, training         |

### Medium Priority

| Page        | Primary Keyword             |
| ----------- | --------------------------- |
| I-Chart     | control chart tool          |
| Boxplot     | boxplot comparison tool     |
| Pareto      | pareto chart analysis       |
| Capability  | process capability analysis |
| Excel       | Excel SPC add-in            |
| Azure       | Azure SPC deployment        |
| Operations  | quality management tools    |
| Compare     | SPC software comparison     |
| Cases (hub) | SPC case studies, examples  |

### Supporting Pages

| Page         | Purpose                  |
| ------------ | ------------------------ |
| Learn pages  | Conceptual SEO content   |
| Case studies | Long-tail + engagement   |
| Resources    | Content hub, SEO landing |
| Tutorials    | Long-tail keywords       |
| Sample Data  | Lead generation          |

---

## Internal Linking Strategy

The Journey is central—every page connects to it.

### From Homepage

```
Homepage
├── → /journey (primary path - "Take the Journey")
├── → /app (secondary CTA - "Try Free")
├── → /tools/* (Four Pillars cards)
├── → /use-cases/* (use case cards)
└── → /product/* (product cards)
```

### From Journey Page

```
Journey Page (/journey)
├── → /app (primary CTA - "Try with Your Data")
├── → /tools/* (each pillar links to tool page)
├── → /cases/* (practice scenarios)
└── → /learn/* (deeper concepts)
```

### From Tool Pages

```
Tool Page (e.g., /tools/i-chart)
├── → /journey (see tool in context)
├── → /app (primary CTA)
├── → /cases/* (related case studies)
├── → Other tools (Four Pillars cross-links)
└── → /learn/* (related concepts)
```

### From Case Study Pages

```
Case Study Page (e.g., /cases/coffee)
├── → /app (primary CTA - embedded PWA)
├── → /journey (see methodology)
├── → /tools/* (tools used in case)
└── → Other cases (related scenarios)
```

### From Product Pages

```
Product Page (e.g., /product/web-app)
├── → /app (primary CTA)
├── → /journey (see methodology)
├── → /pricing (pricing section)
├── → /product/compare (comparison link)
└── → Other products (cross-sell)
```

### From Learn Pages

```
Learn Page (e.g., /learn/four-pillars)
├── → /journey (see concepts in action)
├── → /tools/* (related tools)
├── → /app (try it yourself)
└── → Other learn pages (related concepts)
```

---

## Redirects

| From      | To               | Reason            |
| --------- | ---------------- | ----------------- |
| /products | /product/compare | Plural redirect   |
| /product  | /product/compare | Missing page      |
| /demo     | /app             | Demo is the app   |
| /try      | /app             | Alternative entry |
| /free     | /app             | Alternative entry |

---

## Canonical URLs

| Pattern           | Canonical        |
| ----------------- | ---------------- |
| /product/web-app/ | /product/web-app |
| /PRODUCT/web-app  | /product/web-app |
| /?utm_source=...  | /                |

All URLs should:

- Be lowercase
- Have no trailing slash
- Strip tracking parameters for canonical

---

## 404 Handling

Custom 404 page with:

- Friendly message
- Search box
- Links to main sections
- CTA to /app

---

## Sitemap.xml

Auto-generate including:

- All public pages
- Last modified dates
- Change frequency
- Priority weights

Exclude:

- /app (separate app)
- /legal/\*
- Query parameters

---

## Analytics Events

Track navigation:

- Nav item clicks
- Dropdown opens
- Mobile menu toggle
- CTA clicks
- Footer link clicks

See `TECH-ANALYTICS.md` for full event spec.
