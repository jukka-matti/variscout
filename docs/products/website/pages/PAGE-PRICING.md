# Page Specification: Pricing

## Overview

| Property       | Value                     |
| -------------- | ------------------------- |
| URL            | `/pricing`                |
| Template       | Pricing page              |
| Content Source | `content/COPY-PRICING.md` |
| Priority       | High                      |

**Note**: This page is **informational only**. No checkout happens on the website. Users upgrade inside the PWA or purchase through Microsoft AppSource/Azure Marketplace.

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    HERO                                             │
│                                                                     │
│              Simple pricing. Start free.                           │
│                                                                     │
│   Use VaRiScout free forever. Upgrade when you're ready —          │
│   inside the app or through Microsoft.                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    PRICING TIERS (5 cards)                          │
│                                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Free   │ │Individual│ │  Team   │ │  Dept   │ │Enterprise│      │
│  │         │ │    ★    │ │         │ │         │ │         │       │
│  │   €0    │ │  €49/yr │ │ €399/yr │ │ €999/yr │ │€1,999/yr│       │
│  │         │ │         │ │         │ │         │ │         │       │
│  │ • ...   │ │ • ...   │ │ • ...   │ │ • ...   │ │ • ...   │       │
│  │         │ │         │ │         │ │         │ │         │       │
│  │ Get via:│ │ Get via:│ │ Get via:│ │ Get via:│ │ Get via:│       │
│  │ /app    │ │ In-app  │ │AppSource│ │AppSource│ │AppSource│       │
│  │         │ │ upgrade │ │         │ │ /Azure  │ │         │       │
│  │         │ │         │ │         │ │         │ │         │       │
│  │[Open    │ │[Start   │ │[View in │ │[Compare │ │[View in │       │
│  │ App]    │ │ Free]   │ │AppSource│ │ Options]│ │AppSource│       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    WHERE TO GET (4 cards)                           │
│                                                                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐│
│  │ 🌐 Web App    │ │ 📊 Excel      │ │ 📈 Power BI   │ │ ☁️ Azure ││
│  │               │ │               │ │               │ │          ││
│  │ Free: /app    │ │ Free:AppSource│ │ €399-€1,999   │ │ €999/yr  ││
│  │ Paid: In-app  │ │ Paid: In-app  │ │ via AppSource │ │ via Azure││
│  │               │ │               │ │               │ │          ││
│  │ [Open App]    │ │ [AppSource]   │ │ [AppSource]   │ │[Azure] → ││
│  └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘│
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    HOW BUYING WORKS                                 │
│                                                                     │
│   Pay once, activated instantly                                    │
│                                                                     │
│   ①─────────────②─────────────③─────────────④                      │
│                                                                     │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│   │ ▶ Try   │   │ 💳 Pay  │   │ ⚡ Instant│  │ ✓ Save  │           │
│   │  Free   │   │ In-App  │   │ Activated│  │  Work   │           │
│   │         │   │         │   │         │   │         │           │
│   │Open app,│   │30-sec   │   │2 seconds│   │Projects │           │
│   │analyze, │   │checkout │   │No email │   │persist, │           │
│   │copy     │   │via      │   │wait     │   │export   │           │
│   │charts   │   │Paddle   │   │         │   │.vrs     │           │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘           │
│                                                                     │
│   🛡 Secure payment    ⚡ Instant         🔄 30-day               │
│      via Paddle         activation         money-back              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    DATA PRIVACY CALLOUT                             │
│                                                                     │
│   🛡️ Your Data Stays Yours                                         │
│                                                                     │
│   VaRiScout runs entirely on your side. Your data never            │
│   leaves your browser, spreadsheet, or network.                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    COMPARISON TABLE                                 │
│                                                                     │
│  ┌───────────────┬──────┬────────┬──────┬──────┬────────┐          │
│  │ Feature       │ Free │ Indiv. │ Team │ Dept │ Enterp │          │
│  ├───────────────┼──────┼────────┼──────┼──────┼────────┤          │
│  │ All charts    │  ✓   │   ✓    │  ✓   │  ✓   │   ✓    │          │
│  │ Full analysis │  ✓   │   ✓    │  ✓   │  ✓   │   ✓    │          │
│  │ Copy/export   │  ✓*  │   ✓    │  ✓   │  ✓   │   ✓    │          │
│  │ Save projects │  –   │   ✓    │  ✓   │  ✓   │   ✓    │          │
│  │ Export .vrs   │  –   │   ✓    │  ✓   │  ✓   │   ✓    │          │
│  │ Templates     │  –   │   ✓    │  ✓   │  ✓   │   ✓    │          │
│  │ Web App       │  ✓   │   ✓    │  –   │Azure │   –    │          │
│  │ Power BI      │  –   │   –    │  ✓   │  ✓   │   ✓    │          │
│  │ Users         │  1   │   1    │  10  │  50  │ Unlim  │          │
│  │ Where to Get  │ /app │ In-app │ MS   │ MS   │   MS   │          │
│  └───────────────┴──────┴────────┴──────┴──────┴────────┘          │
│                                              * with watermark       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    FAQ (accordion)                                  │
│                                                                     │
│  ▶ What's the difference between Free and Individual?              │
│  ▶ How do I upgrade from Free to Individual?                       │
│  ▶ Why are Power BI and Azure purchased through Microsoft?         │
│  ▶ Where does my data go?                                          │
│  ▶ Is there a money-back guarantee?                                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    TEAM OPTIONS                                     │
│                                                                     │
│   Need Team or Enterprise Features?                                │
│                                                                     │
│   ┌─────────────────────────┐  ┌─────────────────────────┐         │
│   │ 📈 Power BI Visuals     │  │ ☁️ Azure Deployment      │         │
│   │                         │  │                         │         │
│   │ For teams using         │  │ For orgs wanting        │         │
│   │ Power BI for reporting  │  │ full control            │         │
│   │                         │  │                         │         │
│   │ • 4 custom visuals      │  │ • Your Azure tenant     │         │
│   │ • Cross-filtering       │  │ • Custom domain         │         │
│   │ • Microsoft certified   │  │ • Custom branding       │         │
│   │ • Billed by Microsoft   │  │ • Unlimited users       │         │
│   │                         │  │                         │         │
│   │ €399 - €1,999/year      │  │ €999/year + hosting     │         │
│   │                         │  │                         │         │
│   │ [View in AppSource] →   │  │ [View in Marketplace] → │         │
│   └─────────────────────────┘  └─────────────────────────┘         │
│                                                                     │
│   Not sure? Individual = just you. Power BI = team dashboards.     │
│   Azure = self-hosted control.                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    ENTERPRISE CTA                                   │
│                                                                     │
│  Enterprise & Training Organizations                                │
│  Volume discounts, training pricing, deployment support.           │
│                                                                     │
│  [Contact Us]                                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    TRUST SIGNALS                                    │
│                                                                     │
│  ✓ 30-day money-back  ✓ Microsoft certified  ✓ Data stays local   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    FINAL CTA                                        │
│                                                                     │
│  Start Free Today                                                  │
│  No signup. No credit card. Just open and analyze.                 │
│                                                                     │
│  [Open VaRiScout]                                                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                    FOOTER                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section Components

### Pricing Tiers

| Property       | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Component      | `PricingTiers`                                              |
| Layout         | 5 cards, responsive grid                                    |
| Highlight      | Individual tier (border or background)                      |
| Mobile         | Stack vertically, highlighted first                         |
| **Key Change** | CTAs link to /app or external Microsoft links, not checkout |

#### Card Structure

```
┌─────────────────────┐
│ [Badge: Popular]    │  ← Optional
│                     │
│ TIER NAME           │
│                     │
│ €XX                 │
│ /year               │
│                     │
│ Description         │
│                     │
│ • Feature 1         │
│ • Feature 2         │
│                     │
│ Get via: [source]   │  ← NEW: Where to get
│                     │
│ [CTA Button]        │  ← Links to /app or AppSource
│ (note)              │  ← e.g. "Billed by Microsoft"
└─────────────────────┘
```

### Where To Get Section

| Property  | Value                                           |
| --------- | ----------------------------------------------- |
| Component | `WhereToGetCards`                               |
| Layout    | 4 cards in row                                  |
| Content   | Product name, description, where free/paid, CTA |

### Data Privacy Callout

| Property  | Value                           |
| --------- | ------------------------------- |
| Component | `CalloutBox`                    |
| Style     | Highlighted, icon (shield)      |
| Position  | Above or below comparison table |

### How Buying Works

| Property  | Value                                 |
| --------- | ------------------------------------- |
| Component | `StepProcess`                         |
| Layout    | 4 steps in horizontal row, connected  |
| Mobile    | Stack vertically                      |
| Icons     | Play, Credit Card, Mail, Check Circle |

#### Step Card Structure

```
┌─────────────────────┐
│      ① [icon]       │
│                     │
│   STEP TITLE        │
│                     │
│   Description       │
│   text here         │
│                     │
│   (detail note)     │
└─────────────────────┘
```

### Trust Badges (under How Buying Works)

| Property  | Value               |
| --------- | ------------------- |
| Component | `TrustBadges`       |
| Layout    | Inline, 3-4 badges  |
| Style     | Icon + text, subtle |

### Comparison Table

| Property     | Value                          |
| ------------ | ------------------------------ |
| Component    | `ComparisonTable`              |
| Layout       | Responsive table               |
| Mobile       | Horizontal scroll or accordion |
| Sticky       | Header row                     |
| **New rows** | "Where to Get", "Billed By"    |

### FAQ

| Property      | Value                   |
| ------------- | ----------------------- |
| Component     | `Accordion`             |
| Schema        | FAQPage structured data |
| Initial State | All collapsed           |

---

## CTA Destinations (No Checkout)

| Tier       | CTA Text          | Destination      | Notes                  |
| ---------- | ----------------- | ---------------- | ---------------------- |
| Free       | Open VaRiScout    | /app             | Direct to PWA          |
| Individual | Start Free First  | /app             | Upgrade happens in-app |
| Team       | View in AppSource | AppSource URL    | External link          |
| Department | View Options      | /product/compare | Internal               |
| Enterprise | View in AppSource | AppSource URL    | External link          |

**Important**: No checkout flows on website. All paid upgrades happen either:

1. Inside the PWA (Individual tier via Paddle)
2. Through Microsoft AppSource (Power BI tiers)
3. Through Azure Marketplace (Azure tier)

---

## External Links

| Product      | Destination                                  |
| ------------ | -------------------------------------------- |
| Excel Add-in | `https://appsource.microsoft.com/...`        |
| Power BI     | `https://appsource.microsoft.com/...`        |
| Azure        | `https://azuremarketplace.microsoft.com/...` |

Use `target="_blank" rel="noopener"` for all external links.

---

## Anchor Links

Support direct linking to sections:

- `/pricing#tiers`
- `/pricing#where-to-get`
- `/pricing#comparison`
- `/pricing#faq`

---

## SEO

| Element | Content                                             |
| ------- | --------------------------------------------------- |
| Title   | VaRiScout Pricing \| Free to Start, Simple to Scale |
| H1      | Simple pricing. Start free.                         |
| Schema  | FAQPage, Product with offers                        |

---

## Analytics Events

| Event                | Trigger                                  |
| -------------------- | ---------------------------------------- |
| `pricing_view`       | Page load                                |
| `tier_click`         | Tier CTA click (with tier name)          |
| `where_to_get_click` | Where to get card clicked (with product) |
| `external_link`      | AppSource/Azure link clicked             |
| `comparison_scroll`  | Table scrolled                           |
| `faq_expand`         | FAQ item opened                          |
| `enterprise_contact` | Contact us click                         |

---

## Mobile Considerations

- Pricing cards: 1 column on mobile, swipeable
- Show highlighted tier first
- Comparison table: horizontal scroll with sticky first column
- Large touch targets on CTAs
- External link icons visible
