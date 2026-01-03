# Site Map & Navigation

## Overview

Complete site architecture for variscout.com.

---

## URL Structure

```
variscout.com
│
├── /                           Home
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

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔍 VaRiScout    Product ▼    Use Cases ▼    Pricing    [Try Free] │
└─────────────────────────────────────────────────────────────────────┘
```

#### Product Dropdown

```
┌─────────────────────┐
│ Web App             │ → /product/web-app
│ Excel               │ → /product/excel
│ Power BI            │ → /product/power-bi
│ Azure               │ → /product/azure
│ ─────────────────── │
│ Compare All →       │ → /product/compare
└─────────────────────┘
```

#### Use Cases Dropdown

```
┌─────────────────────────┐
│ LSS Training & Projects │ → /use-cases/lss-training
│ Quality & Operations    │ → /use-cases/operations
└─────────────────────────┘
```

### Mobile Navigation

```
┌─────────────────────────────────┐
│  🔍 VaRiScout            ☰     │
└─────────────────────────────────┘

(Expanded)
┌─────────────────────────────────┐
│ Product                     ▼   │
│   Web App                       │
│   Excel                         │
│   Power BI                      │
│   Azure                         │
│   Compare                       │
│ Use Cases                   ▼   │
│   LSS Training                  │
│   Operations                    │
│ Pricing                         │
│ Resources                   ▼   │
│   #VariationScouting            │
│   Sample Data                   │
│   Tutorials                     │
│ ─────────────────────────────── │
│ [Try Free]                      │
└─────────────────────────────────┘
```

---

## Footer Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  🔍 VaRiScout                                                       │
│                                                                     │
│  Product           Use Cases        Resources        Company        │
│  ─────────         ──────────       ─────────        ───────        │
│  Web App           LSS Training     Tutorials        About          │
│  Excel             Operations       Sample Data      Contact        │
│  Power BI                           #VariationScouting              │
│  Azure                                                              │
│  Pricing                                                            │
│  Compare                                                            │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  © 2026 RDMAIC Oy    Privacy  |  Terms  |  AppSource  |  Azure     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Page Priority & SEO Focus

### High Priority (Core Pages)

| Page         | Primary Keyword    | Secondary Keywords                    |
| ------------ | ------------------ | ------------------------------------- |
| Home         | variation analysis | SPC, control charts, Lean Six Sigma   |
| Web App      | online SPC tool    | control chart online, boxplot tool    |
| Power BI     | Power BI SPC       | Power BI control chart, custom visual |
| Pricing      | VaRiScout pricing  | SPC software cost                     |
| LSS Training | Six Sigma tools    | Green Belt software, training         |

### Medium Priority

| Page       | Primary Keyword          |
| ---------- | ------------------------ |
| Excel      | Excel SPC add-in         |
| Azure      | Azure SPC deployment     |
| Operations | quality management tools |
| Compare    | SPC software comparison  |

### Supporting Pages

| Page        | Purpose                  |
| ----------- | ------------------------ |
| Resources   | Content hub, SEO landing |
| Tutorials   | Long-tail keywords       |
| Sample Data | Lead generation          |

---

## Internal Linking Strategy

### From Homepage

```
Homepage
├── → /product/web-app (primary CTA)
├── → /product/* (product cards)
├── → /use-cases/* (use case cards)
├── → /pricing (pricing preview)
└── → /resources (demo/content)
```

### From Product Pages

```
Product Page (e.g., /product/web-app)
├── → /app (primary CTA)
├── → /pricing (pricing section)
├── → /product/compare (comparison link)
├── → /resources/tutorials (help link)
└── → Other products (cross-sell)
```

### From Use Case Pages

```
Use Case Page (e.g., /use-cases/lss-training)
├── → /app (primary CTA)
├── → /product/* (relevant products)
├── → /resources/sample-data (sample data)
└── → /pricing (pricing link)
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
