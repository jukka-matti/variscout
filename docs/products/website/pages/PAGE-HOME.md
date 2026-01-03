# Page Specification: Homepage

## Overview

| Property       | Value                  |
| -------------- | ---------------------- |
| URL            | `/`                    |
| Template       | Landing page           |
| Content Source | `content/COPY-HOME.md` |
| Priority       | High                   |

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                                    │
│  🔍 VaRiScout    Product ▼   Use Cases ▼   Pricing      [Try Free] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    HERO SECTION                                     │
│                                                                     │
│         Find what's driving variation.                              │
│                  In minutes.                                        │
│                                                                     │
│    Simple enough for anyone. Rigorous enough for experts.           │
│                                                                     │
│              [Try Free]    [Watch Demo]                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    HERO IMAGE/ANIMATION                             │
│         (Dashboard screenshot or animation)                         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    VALUE PROPS (3 columns)                          │
│                                                                     │
│   📊 See Variation    🔍 Find the Factor    📋 Present Instantly    │
│   I-Chart, Boxplot,   Click to filter.      One-click copy          │
│   Pareto — all at     Drill down in         to PowerPoint.          │
│   once.               seconds.                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    HOW IT WORKS (4 steps)                           │
│                                                                     │
│      ①              ②              ③              ④                │
│    Upload         Select        Explore         Copy                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    USE CASES (2 columns)                            │
│                                                                     │
│   ┌───────────────────┐   ┌───────────────────┐                     │
│   │ LSS Training      │   │ Quality &         │                     │
│   │ & Projects        │   │ Operations        │                     │
│   │                   │   │                   │                     │
│   │ [Learn More]      │   │ [Learn More]      │                     │
│   └───────────────────┘   └───────────────────┘                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    PRODUCTS (4 cards)                               │
│                                                                     │
│   [Web App]  [Excel]  [Power BI]  [Azure]                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    WHY VARISCOUT (4 items)                          │
│                                                                     │
│   No Installation | No Training | Plain Language | MS Certified    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    PRICING PREVIEW                                  │
│                                                                     │
│       Free €0    |    Individual €49    |    Team from €399        │
│                                                                     │
│                       [See All Pricing]                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    FINAL CTA                                        │
│                                                                     │
│              Start Scouting Variation                               │
│    No signup required. Your data stays in your browser.             │
│                                                                     │
│                    [Open VaRiScout]                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    FOOTER                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Sections Detail

### 1. Header

| Property   | Value                                |
| ---------- | ------------------------------------ |
| Component  | `Header`                             |
| Position   | Sticky top                           |
| Background | White (scrolled) / Transparent (top) |

### 2. Hero Section

| Property   | Value                   |
| ---------- | ----------------------- |
| Component  | `HeroWithCTA`           |
| Content    | `COPY-HOME.md#hero`     |
| Layout     | Centered text           |
| Background | Light gradient or white |
| Padding    | `--space-20` vertical   |

**Content Mapping:**

```yaml
headline: "Find what's driving variation."
headline_emphasis: 'In minutes.' # Different color/weight
subhead: 'Simple enough for anyone. Rigorous enough for experts.'
cta_primary:
  text: 'Try Free'
  url: '/app'
  style: 'primary'
cta_secondary:
  text: 'Watch Demo'
  url: '#demo'
  style: 'secondary'
```

### 3. Hero Image

| Property      | Value                      |
| ------------- | -------------------------- |
| Component     | `HeroImage` or `Animation` |
| Content       | Dashboard screenshot       |
| Max Width     | 1000px                     |
| Shadow        | `--shadow-xl`              |
| Border Radius | `--radius-xl`              |

Options:

- Static screenshot (faster load)
- Animated GIF showing filter interaction
- Live demo embed

### 4. Value Props

| Property  | Value                              |
| --------- | ---------------------------------- |
| Component | `ThreeColumnFeatures`              |
| Content   | `COPY-HOME.md#value_props`         |
| Layout    | 3 columns desktop, 1 column mobile |
| Gap       | `--space-8`                        |

### 5. How It Works

| Property  | Value                                 |
| --------- | ------------------------------------- |
| Component | `StepsHorizontal`                     |
| Content   | `COPY-HOME.md#how_it_works`           |
| Layout    | 4 columns desktop, 2 tablet, 1 mobile |
| Connector | Dashed line between steps             |

### 6. Use Cases

| Property   | Value                        |
| ---------- | ---------------------------- |
| Component  | `TwoColumnCards`             |
| Content    | `COPY-HOME.md#use_cases`     |
| Card Style | Clickable, with hover effect |
| CTA        | "Learn More" ghost button    |

### 7. Products Overview

| Property   | Value                                |
| ---------- | ------------------------------------ |
| Component  | `ProductCards`                       |
| Content    | `COPY-HOME.md#products_overview`     |
| Layout     | 4 columns desktop, 2 tablet          |
| Card Style | Compact with icon, title, price hint |

### 8. Why VaRiScout

| Property  | Value                            |
| --------- | -------------------------------- |
| Component | `FeatureGrid`                    |
| Content   | `COPY-HOME.md#why_variscout`     |
| Layout    | 4 columns desktop, 2 mobile      |
| Style     | Icon + title + short description |

### 9. Pricing Preview

| Property  | Value                          |
| --------- | ------------------------------ |
| Component | `PricingPreview`               |
| Content   | `COPY-HOME.md#pricing_preview` |
| Layout    | 3 tier cards + CTA             |
| Link      | "See All Pricing" → /pricing   |

### 10. Final CTA

| Property   | Value                              |
| ---------- | ---------------------------------- |
| Component  | `CTASection`                       |
| Content    | `COPY-HOME.md#final_cta`           |
| Background | Brand primary (dark) or light gray |
| Text Color | White or dark                      |
| Padding    | `--space-16` vertical              |

### 11. Footer

| Property  | Value                 |
| --------- | --------------------- |
| Component | `Footer`              |
| Content   | `COPY-HOME.md#footer` |

---

## Responsive Behavior

| Breakpoint | Changes                          |
| ---------- | -------------------------------- |
| < 768px    | Stack all multi-column sections  |
| < 768px    | Hero text smaller (`--text-3xl`) |
| < 768px    | Hide product cards, show list    |
| < 1024px   | 2-column for features/products   |

---

## Performance

| Metric | Target  |
| ------ | ------- |
| LCP    | < 2.5s  |
| FID    | < 100ms |
| CLS    | < 0.1   |

Optimizations:

- Lazy load below-fold images
- Preload hero image
- Inline critical CSS
- Defer non-critical JS

---

## SEO

| Element          | Content                                      |
| ---------------- | -------------------------------------------- |
| Title            | "VaRiScout \| Find What's Driving Variation" |
| Meta Description | See `COPY-HOME.md#meta`                      |
| H1               | "Find what's driving variation. In minutes." |
| Schema           | Organization, SoftwareApplication            |

---

## Analytics Events

| Event                | Trigger               |
| -------------------- | --------------------- |
| `hero_cta_click`     | Primary CTA click     |
| `demo_click`         | Demo button click     |
| `use_case_click`     | Use case card click   |
| `product_card_click` | Product card click    |
| `pricing_click`      | Pricing preview click |
| `final_cta_click`    | Final CTA click       |
