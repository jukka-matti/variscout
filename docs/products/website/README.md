# VaRiScout Website & Marketing - Master Plan

> **"See What's Driving Variation"**
>
> EDA for process improvement. Built at the gemba, not in the boardroom.

---

## About the Founder

### Jukka-Matti "Jukkis" Turtiainen

**Lean Six Sigma Master Black Belt** | RDMAIC Oy, Finland

Jukkis is a quality improvement professional who has spent over a decade making Lean Six Sigma accessible to practitioners worldwide. His work bridges academic rigor with practical gemba reality.

**Background:**

- **Master's Degree** (2019) from LUT University (Lappeenranta-Lahti University of Technology)
- Thesis: _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_
- Co-creator of the **ESTIEM Lean Six Sigma Green Belt** program (1000+ students trained across 10+ European countries, 100+ trainers in the network)
- Head Instructor for the **ESTIEM Black Belt** program
- Collaborated extensively with **Dr. Gregory H. Watson** on training methodology and Quality 4.0 courses

**The RDMAIC-Watson Connection:**

RDMAIC Oy delivers **BEST Lean Six Sigma** training in Finland, working closely with Dr. Gregory H. Watson—the only Westerner to receive a JUSE Deming Medal for promoting Japanese quality methods. Watson was the original designer of Six Sigma training for the American Society for Quality (ASQ) and instrumental in developing both the ASQ Black Belt and Master Black Belt certification programs. This lineage connects VaRiScout directly to the historical roots of Six Sigma methodology.

---

## The EDA Methodology: History & Philosophy

### What is EDA?

**Exploratory Data Analysis** is an approach to analyzing data that emphasizes _looking at data first_ before applying formal statistical models. It was championed by **John W. Tukey** at Bell Labs, culminating in his landmark 1977 book _"Exploratory Data Analysis."_

> _"Exploratory data analysis is detective work... The data must be looked at."_
> — John Tukey

### The Lineage

```
1924  Walter Shewhart      Control charts at Bell Labs
1950s W. Edwards Deming    Analytical vs. enumerative studies
1970s John Tukey           EDA methodology, box plots
1980s Dorian Shainin       Progressive Search, Red X
1986  Bill Smith/Motorola  Six Sigma metric
1997  Gregory Watson/ASQ   Six Sigma body of knowledge
2019  Turtiainen thesis    Mental model for EDA in DMAIC
2026  VaRiScout            EDA-first variation analysis tool
```

### VaRiScout's Philosophy

VaRiScout operationalizes this EDA-first philosophy:

```
TRADITIONAL TOOLS          VARISCOUT
─────────────────          ─────────
1. Enter data              1. Enter data
2. Choose analysis         2. SEE the data (I-Chart, Boxplot, Pareto)
3. Get p-value             3. EXPLORE patterns (click to filter)
4. "Significant?"          4. UNDERSTAND what's driving variation
                           5. Stats when you need them
```

**The core belief:** Practitioners don't need more statistics—they need to _see_ their data. The pattern tells the story. Stats confirm what your eyes already found.

---

## Quick Reference

| Item                | Decision                                    |
| ------------------- | ------------------------------------------- |
| **Domain**          | variscout.com                               |
| **Primary CTA**     | "Try VaRiScout"                             |
| **Tagline**         | "See What's Driving Variation"              |
| **Philosophy**      | Explore first. Stats when you need them.    |
| **Login required?** | No - 100% client-side, license in IndexedDB |
| **Sales process?**  | No - fully self-serve (Paddle / AppSource)  |

---

## Target Audience

### Primary: Practitioners (Do the Analysis)

- LSS Trainers
- Green Belts
- Analysts

### Expanding: Decision-Makers (Use the Analysis)

- Supervisors
- Quality Managers
- Operations Leads
- CI Teams

---

## Products Covered

| Product            | Deployment        | Target            |
| ------------------ | ----------------- | ----------------- |
| VaRiScout Web      | PWA at /app       | Individual users  |
| VaRiScout Excel    | AppSource add-in  | Excel power users |
| VaRiScout Power BI | AppSource visuals | BI teams          |
| VaRiScout Azure    | Azure Marketplace | Enterprise IT     |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         variscout.com                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MARKETING WEBSITE              │        PWA APPLICATION               │
│   (Astro static site)            │        (React app)                   │
│                                  │                                      │
│   /                              │        /app                          │
│   /journey                       │        - I-Chart                     │
│   /cases/*                       │        - Boxplot                     │
│   /tools/*                       │        - Pareto                      │
│   /learn/*                       │        - Capability                  │
│   /products/*                    │                                      │
│   /pricing                       │        100% client-side              │
│   /blog/*                        │        IndexedDB storage             │
│   /about/*                       │        Offline-capable               │
│   /support/*                     │                                      │
│                                  │                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
/docs/products/website/
│
├── README.md                    ← You are here
│
├── ────────────────────────────── CORE SPECIFICATIONS ──────────────────────
├── JOURNEY_PAGE.md              # Journey page 7-section scroll experience ⭐
├── TOOL_PAGES.md                # Tool pages 10-section template (6 tools) ⭐
├── LEARN_SECTION.md             # Learn pages (Two Voices, Four Pillars, EDA) ⭐
├── BRAND_MESSAGING.md           # Messaging framework ("46%", CTAs, voice) ⭐
│
├── ────────────────────────────── DESIGN SYSTEM ────────────────────────────
├── /design-system/
│   ├── TOKENS.md                # Colors, fonts, spacing
│   ├── COMPONENTS.md            # UI components
│   └── ICONS.md                 # Icon specifications
│
├── ────────────────────────────── CONTENT ──────────────────────────────────
├── /content/
│   ├── MESSAGING.md             # Extended messaging reference
│   ├── COPY-HOME.md             # Homepage copy
│   ├── COPY-PRODUCT-*.md        # Product page copy
│   ├── COPY-USE-CASE-*.md       # Use case page copy
│   ├── COPY-PRICING.md          # Pricing page copy
│   └── COPY-RESOURCES.md        # Resources page copy
│
├── ────────────────────────────── PAGES ────────────────────────────────────
├── /pages/
│   ├── SITEMAP.md               # Site architecture
│   ├── PAGE-HOME.md             # Homepage spec
│   ├── JOURNEY.md               # Legacy journey reference
│   ├── TOOL-PAGES-CONCEPT.md    # Tool pages concept
│   ├── TOOL-PAGES-TEMPLATE.md   # Tool pages template
│   ├── TOOL-PAGES-UI-UX.md      # Tool pages UI/UX
│   └── PAGE-*.md                # Other page specs
│
├── ────────────────────────────── COMPONENTS ───────────────────────────────
├── /components/
│   └── CASE-COMPONENTS.md       # Case study page components
│
├── ────────────────────────────── USER FLOWS ───────────────────────────────
├── /flows/
│   ├── OVERVIEW.md              # Holistic picture (personas, architecture, CTAs)
│   ├── 1-SEO-LEARNER.md         # Google → Tool → Product (Green Belt Gary)
│   ├── 2-SOCIAL-DISCOVERY.md    # LinkedIn → Case → Product (Curious Carlos)
│   ├── 3-CONTENT-YOUTUBE.md     # YouTube → Website → Product
│   ├── 4-ENTERPRISE.md          # Referral → Enterprise (OpEx Olivia)
│   ├── 5-RETURN-VISITOR.md      # Existing user → App
│   ├── CONTENT-STRATEGY.md      # 16-week marketing campaign
│   ├── STORY-PAGE.md            # /about/story page specification
│   ├── FLOW-FREE-TO-PAID.md     # Conversion journey (legacy)
│   ├── FLOW-FIRST-USE.md        # First-time user flow (legacy)
│   └── FLOW-PRODUCT-SELECTION.md # Product selection (legacy)
│
├── ────────────────────────────── MARKETING ────────────────────────────────
├── /marketing/
│   ├── README.md                # Marketing campaign overview
│   ├── STRATEGY.md              # 16-week campaign strategy
│   ├── METHODOLOGY.md           # Content production methodology
│   ├── CALENDAR.md              # Weekly publishing calendar
│   ├── /weekly/                 # Monthly content briefs (m1-w1 through m5-w5)
│   └── /themes/                 # Weekly theme templates
│
├── ────────────────────────────── TECHNICAL ────────────────────────────────
├── /technical/
│   ├── TECH-STACK.md            # Technology choices
│   ├── TECH-SEO.md              # SEO requirements
│   ├── TECH-ANALYTICS.md        # Tracking setup
│   └── TECH-INTEGRATION.md      # PWA & external links
│
├── EXPERIENCE-STRATEGIES.md     # Landing page strategies
└── HOLISTIC-EVALUATION.md       # UX strategy review
```

### ⭐ Core Specifications (Start Here)

| Document                                   | Purpose                                        |
| ------------------------------------------ | ---------------------------------------------- |
| [JOURNEY_PAGE.md](./JOURNEY_PAGE.md)       | The signature 7-section scroll experience      |
| [TOOL_PAGES.md](./TOOL_PAGES.md)           | 10-section template for 6 tool education pages |
| [LEARN_SECTION.md](./LEARN_SECTION.md)     | Two Voices, Four Pillars, EDA Philosophy pages |
| [BRAND_MESSAGING.md](./BRAND_MESSAGING.md) | "46%" framework, CTAs, voice & tone            |

---

## Site Map Summary

```
variscout.com
│
├── / ────────────────────────────── Homepage
├── /journey ─────────────────────── Full scroll experience
│
├── /cases ───────────────────────── Case library hub
│   ├── /cases/cookie-weight ─────── ESTIEM classic (I-Chart, Capability)
│   ├── /cases/coffee-moisture ───── Africa: Drying bed comparison
│   ├── /cases/packaging-defects ─── Africa: Two-week diagnostic journey
│   ├── /cases/avocado-coating ───── Regression: Process optimization
│   └── ...
│
├── /tools ───────────────────────── Tools hub
│   ├── /tools/i-chart
│   ├── /tools/boxplot
│   ├── /tools/pareto
│   ├── /tools/capability
│   ├── /tools/regression
│   └── /tools/gage-rr ───────────── MSA for Green Belts
│
├── /learn ───────────────────────── Learning hub
│   ├── /learn/four-pillars
│   ├── /learn/two-voices
│   ├── /learn/eda-philosophy
│   └── /learn/variation-types
│
├── /products ────────────────────── Products hub
│   ├── /products/pwa
│   ├── /products/excel
│   └── /products/enterprise
│
├── /pricing ─────────────────────── Pricing page
├── /app ─────────────────────────── PWA application
├── /blog ────────────────────────── Content marketing
├── /about ───────────────────────── About hub
├── /support ─────────────────────── Support hub
└── /legal
```

---

## Key User Flows

### Flow 1: SEO → Tool Page → Product

```
Google "how to read boxplot" → /tools/boxplot → Demo → /products → Purchase
```

### Flow 2: Social → Case → Product

```
LinkedIn post → /cases/cookie → Explore → /products → Purchase
```

### Flow 3: YouTube/Content → Website → Product

```
YouTube video → Blog/Tool page → Demo → /products → Purchase
```

### Flow 4: Enterprise (Self-Serve)

```
Referral → /products/enterprise → Documentation → Self-deploy (ARM template)
```

---

## Content Marketing Campaign

### Narrative Arc (21 weeks)

```
MONTH 1-3: THE LEARNINGS
─────────────────────────────────────────────────
Month 1: ESTIEM    → "What students taught me"
Month 2: ABB       → "What practitioners taught me"
Month 3: Africa    → "What simplicity really means"

MONTH 4: THE SYNTHESIS
─────────────────────────────────────────────────
"I built VaRiScout from all of this.
 It's what I use in every training I deliver."

MONTH 5: GB TOOLKIT (Advanced Features)
─────────────────────────────────────────────────
Capability, Gage R&R, Regression + AI Comparison
```

### Content Engine

```
1 VIDEO (5-10 min)
        │
        ├── YouTube (full video)
        ├── Blog post (transcript)
        ├── LinkedIn (2-3 posts)
        ├── TikTok (3-5 clips)
        └── Instagram (reels + carousel)
```

---

## Internationalization

The website supports **local routing** (e.g., `/de/`, `/es/`) for Tier 1 languages to maximize global SEO reach.

- **Default Locale**: `en` (redirects from `/` to `/en/`)
- **Supported Locales**: `en`, `de`, `es`, `fr`, `pt`
- **Routing Strategy**: `/[lang]/...` directory structure
- **Implementation**: Astro i18n with custom `ui.ts` dictionary

---

## How to Use This Specification

### For AI Coding Agents

1. Start with `TECH-STACK.md` — understand framework and setup
2. Read `design-system/TOKENS.md` — generate CSS variables
3. Build components from `design-system/COMPONENTS.md`
4. Follow `pages/SITEMAP.md` — create page structure
5. For each page:
   - Read `pages/PAGE-*.md` for layout/structure
   - Pull content from `content/COPY-*.md`
6. Implement flows from `flows/FLOW-*.md`
7. Configure SEO and analytics from `technical/`

### For Human Review

- Start with this README for context
- Review `content/MESSAGING.md` for brand voice
- Check `pages/SITEMAP.md` for site architecture
- Individual page specs show wireframes and section breakdowns

---

## Related Documents

| Document          | Location              | Purpose                                                     |
| ----------------- | --------------------- | ----------------------------------------------------------- |
| Case Studies      | `docs/cases/`         | Demo data and teaching cases                                |
| Concepts          | `docs/concepts/`      | Methodology (Four Pillars, Two Voices, Case-Based Learning) |
| PWA Specification | `docs/products/pwa/`  | Technical spec for the PWA app                              |
| Design System     | `docs/design-system/` | Colors, typography, components                              |

---

## Version

- Version: 2.0
- Date: January 2026
- Status: Comprehensive specification with marketing campaign
