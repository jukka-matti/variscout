# Website User Flows: Overview

> Holistic picture of how users find, navigate, and convert on variscout.com
>
> For detailed journey implementations, see individual flow files:
>
> - [1-SEO-LEARNER.md](./1-SEO-LEARNER.md) - Google search → Tool page → Product
> - [2-SOCIAL-DISCOVERY.md](./2-SOCIAL-DISCOVERY.md) - LinkedIn → Case → Product
> - [3-CONTENT-YOUTUBE.md](./3-CONTENT-YOUTUBE.md) - YouTube/Content → Website → Product
> - [4-ENTERPRISE.md](./4-ENTERPRISE.md) - Referral → Enterprise evaluation
> - [5-RETURN-VISITOR.md](./5-RETURN-VISITOR.md) - Existing user → App

---

## Personas Summary

| Persona             | Role                           | Goal                         | Knowledge Level                | Entry Point                       |
| ------------------- | ------------------------------ | ---------------------------- | ------------------------------ | --------------------------------- |
| **Green Belt Gary** | Quality Engineer, GB certified | Find better tools than Excel | Knows basics, wants efficiency | Google search, LinkedIn, YouTube  |
| **OpEx Olivia**     | OpEx Manager                   | Find tools for team          | Strategic, evaluates ROI       | Referral, LinkedIn                |
| **Curious Carlos**  | Operations Supervisor          | Understand variation better  | Interested but not trained     | YouTube, TikTok, Instagram        |
| **Student Sara**    | LSS student / trainee          | Learn methodology            | Learning, needs guidance       | Course link, Google, YouTube      |
| **Evaluator Erik**  | IT/Procurement                 | Assess for organization      | Technical, security-focused    | Direct link from colleague        |
| **Trainer Tina**    | LSS Trainer / Consultant       | Tools for courses & clients  | Expert, evaluates for students | LinkedIn, YouTube, Watson network |

**Secondary:** Consultant Chris, Academic Anna, Coffee Coop Carmen

---

## Entry Points

```
                                ┌─────────────────┐
                                │   variscout.com │
                                └────────┬────────┘
                                         │
    ┌────────────────┬───────────────────┼───────────────────┬────────────────┐
    │                │                   │                   │                │
    ▼                ▼                   ▼                   ▼                ▼
┌───────────┐ ┌───────────┐ ┌───────────────┐ ┌───────────┐ ┌───────────┐
│  Google   │ │ LinkedIn  │ │   YouTube /   │ │  Referral │ │  Direct   │
│  Search   │ │           │ │   Social      │ │           │ │   URL     │
└─────┬─────┘ └─────┬─────┘ └───────┬───────┘ └─────┬─────┘ └─────┬─────┘
      │             │               │               │             │
      ▼             ▼               ▼               ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────────┐ ┌───────────┐ ┌───────────┐
│ Tool Page │ │ Homepage  │ │ Blog / Tool   │ │ Homepage  │ │ Homepage  │
│ /tools/X  │ │     /     │ │    Page       │ │     /     │ │  or /app  │
└───────────┘ └───────────┘ └───────────────┘ └───────────┘ └───────────┘
```

### First Impression by Entry

| Entry Point                  | Lands On            | First Question                  | Must Answer in 5 Seconds        |
| ---------------------------- | ------------------- | ------------------------------- | ------------------------------- |
| Google "how to read boxplot" | /tools/boxplot      | "Does this answer my question?" | Yes - with visual + explanation |
| LinkedIn post about case     | /cases/bottleneck   | "Is this relevant to me?"       | Yes - industry recognition      |
| YouTube video link           | /blog/X or /tools/X | "Is there more?"                | Yes - deeper content + CTA      |
| TikTok/Instagram clip        | /tools/X or /       | "What is this tool?"            | Clear value prop + demo         |
| Colleague referral           | / (homepage)        | "What is this?"                 | Clear value prop + demo         |
| Return visit                 | / or /app           | "Where was I?"                  | Easy navigation to app/cases    |

---

## Site Architecture

```
variscout.com
│
├── / (Homepage)
│   ├── Hero: "See Beyond Averages" + featured case journey
│   ├── Value prop section
│   ├── Tool overview (4 pillars visual)
│   ├── Case teaser (3 cases)
│   ├── Product comparison
│   └── CTA: "Find YOUR 46%"
│
├── /journey ─────────────────── Full scroll experience (7 sections)
│
├── /cases ───────────────────── Case library hub
│   ├── /cases/bottleneck
│   ├── /cases/hospital-ward
│   ├── /cases/coffee
│   ├── /cases/packaging
│   └── /cases/avocado
│
├── /tools ───────────────────── Tools hub
│   ├── /tools/i-chart
│   ├── /tools/boxplot
│   ├── /tools/pareto
│   ├── /tools/capability
│   ├── /tools/regression
│   └── /tools/gage-rr
│
├── /learn ───────────────────── Learning hub
│   ├── /learn/four-pillars
│   ├── /learn/two-voices
│   ├── /learn/eda-philosophy
│   └── /learn/variation-types
│
├── /products ────────────────── Products hub
│   ├── /products/pwa
│   ├── /products/excel
│   └── /products/enterprise
│
├── /pricing ─────────────────── Pricing page
│
├── /app ─────────────────────── PWA application (no login)
│
├── /about
│   ├── /about/story ─────────── THE WHY (see [STORY-PAGE.md](./STORY-PAGE.md))
│   └── /about/team
│
├── /support
│   ├── /support/getting-started
│   ├── /support/faq
│   └── /support/contact
│
├── /blog ────────────────────── Content marketing hub
│
└── /legal
    ├── /legal/privacy
    └── /legal/terms
```

### Navigation

**Header:**

```
[Logo: VaRiScout]   Journey  Cases  Tools ▼  Learn ▼  Pricing  [Try VaRiScout]
```

**Footer:**

```
PRODUCT        LEARN            COMPANY       CONNECT
─────────      ─────            ───────       ───────
PWA            Four Pillars     About         YouTube
Excel Add-in   Two Voices       Team          LinkedIn
Enterprise     EDA Philosophy   Support       @variationscouting
Pricing        Case Library                   Newsletter
```

---

## Cross-Linking Strategy

```
                ┌─────────────┐
                │  Homepage   │
                └──────┬──────┘
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ▼                ▼                ▼
┌───────────┐    ┌───────────┐    ┌───────────┐
│  Journey  │    │   Cases   │    │   Tools   │
└─────┬─────┘    └─────┬─────┘    └─────┬─────┘
      │                │                │
      └────────────────┼────────────────┘
                       │
            CROSS-LINKS:
            Journey ←→ Cases (same methodology)
            Cases ←→ Tools (tool used in case)
            Tools ←→ Learn (deeper concepts)
            Tools ←→ Tools (workflow: I-Chart→Box)
            All ──→ Products (CTA)
                       │
                       ▼
                ┌─────────────┐
                │  Products   │ → Pricing → CONVERSION
                └─────────────┘
```

### Tool Page Links

| From              | Links To          | Reason                             |
| ----------------- | ----------------- | ---------------------------------- |
| /tools/i-chart    | /tools/boxplot    | "Next: find which factor"          |
| /tools/i-chart    | /tools/capability | "Check: does it meet specs?"       |
| /tools/i-chart    | /learn/two-voices | "Deep dive: Two Voices"            |
| /tools/boxplot    | /tools/pareto     | "Next: where problems concentrate" |
| /tools/pareto     | /tools/capability | "Next: impact on capability"       |
| /tools/capability | /tools/i-chart    | "First: check stability"           |

---

## CTA Strategy

### By Page Type

| Page Type  | Primary CTA                             | Secondary CTA                 |
| ---------- | --------------------------------------- | ----------------------------- |
| Homepage   | "Find YOUR 46%" → /products             | "See how it works" → /journey |
| Journey    | "Where's YOUR pattern?" → /products     | "See more cases" → /cases     |
| Case page  | "Do this with your data" → /products    | "Try another case" → /cases   |
| Tool page  | "Try VaRiScout" → /products             | "See it in a case" → /cases   |
| Learn page | "Apply this with VaRiScout" → /products | "See it in action" → /cases   |
| Products   | [Get PWA] / [Get Excel] / [Enterprise]  | Compare options               |
| Pricing    | [Choose plan]                           | FAQ / Documentation           |

### Email Capture Points

| Location               | Trigger          | Offer                                             |
| ---------------------- | ---------------- | ------------------------------------------------- |
| Case completion        | After Act 3      | "Get more case studies + analysis tips"           |
| Tool page (scroll 70%) | Exit intent      | "Download data collection template"               |
| Homepage               | After journey    | "Subscribe for weekly variation scouting content" |
| Blog post              | End of article   | "Get video + tips in your inbox"                  |
| Pricing page           | If no conversion | "Get notified of discounts"                       |

---

## Analytics Funnel

```
AWARENESS
    │
    ▼
┌─────────────────┐
│ Site Visit      │ ← Entry metric
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Engagement      │ ← >60s on site OR >50% scroll OR demo click
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Interest        │ ← Views product OR pricing page
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Conversion      │ ← Signs up or purchases
└─────────────────┘
```

### Key Events to Track

| Category        | Event                        | Purpose                    |
| --------------- | ---------------------------- | -------------------------- |
| **Entry**       | Landing page by source       | Know where users come from |
| **Engagement**  | Scroll depth (25/50/75/100%) | Content engagement         |
| **Interaction** | Demo clicks                  | Product interest           |
| **Navigation**  | Page-to-page flow            | Understand journeys        |
| **Conversion**  | Product/Pricing page view    | Purchase intent            |
| **Email**       | Email capture                | Lead gen                   |

---

## Gap Analysis

| Gap                      | Impact                               | Priority |
| ------------------------ | ------------------------------------ | -------- |
| Enterprise page content  | Enterprise evaluators need more info | High     |
| Mobile navigation design | Mobile users may struggle            | Medium   |
| Search functionality     | Can't find specific content          | Medium   |
| Breadcrumbs              | Users may feel lost in deep pages    | Medium   |
| Related content (auto)   | Manual cross-links only              | Low      |

---

## Flow Priorities

| Priority | Flow                                | File                                             | Why                             |
| -------- | ----------------------------------- | ------------------------------------------------ | ------------------------------- |
| 1        | SEO → Tool Page → Product           | [1-SEO-LEARNER.md](./1-SEO-LEARNER.md)           | Highest volume potential        |
| 2        | Social → Case → Product             | [2-SOCIAL-DISCOVERY.md](./2-SOCIAL-DISCOVERY.md) | Best conversion story           |
| 3        | YouTube/Content → Website → Product | [3-CONTENT-YOUTUBE.md](./3-CONTENT-YOUTUBE.md)   | Authority + warm leads          |
| 4        | Enterprise evaluation               | [4-ENTERPRISE.md](./4-ENTERPRISE.md)             | Self-serve, documentation-first |
| 5        | Return user → App                   | [5-RETURN-VISITOR.md](./5-RETURN-VISITOR.md)     | Retention/activation            |

---

## Architecture Principles

1. **Multiple entry points** - Every page can be a landing page
2. **Clear paths to conversion** - CTA on every page
3. **Cross-linking** - No dead ends, always "what's next"
4. **Progressive depth** - Surface → Middle → Deep layers
5. **Mobile-first** - Sticky CTAs, simplified navigation
6. **No login needed** - License stored locally, "We don't have your data"

> **The website is a collection of interconnected experiences, not a linear funnel.**
>
> Users can enter anywhere, explore in any order, and convert when ready.
> Every page must stand alone AND connect to the whole.

---

## Related Documents

- [CONTENT-STRATEGY.md](./CONTENT-STRATEGY.md) - 16-week marketing campaign
- [STORY-PAGE.md](./STORY-PAGE.md) - /about/story page specification
