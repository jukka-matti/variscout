# VaRiScout Website Specification

## Project Overview

This specification defines the complete variscout.com marketing website. The site serves as:

- Product introduction and value proposition
- Entry point to the VaRiScout PWA (/app)
- Conversion funnel from free to paid
- Information hub for all product variants

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

## Core Messaging

**Universal Hook:** "Find what's driving variation. In minutes."

**Value Proposition (1-1-1):**

- 1 minute to insight
- 1 minute to adjust
- 1 minute to present

**Positioning:** "Simple enough for anyone. Rigorous enough for experts."

## Products Covered

| Product            | Deployment        | Target            |
| ------------------ | ----------------- | ----------------- |
| VaRiScout Web      | PWA at /app       | Individual users  |
| VaRiScout Excel    | AppSource add-in  | Excel power users |
| VaRiScout Power BI | AppSource visuals | BI teams          |
| VaRiScout Azure    | Azure Marketplace | Enterprise IT     |

## Internationalization

The website supports **local routing** (e.g., `/de/`, `/es/`) for Tier 1 languages to maximize global SEO reach.

- **Default Locale**: `en` (redirects from `/` to `/en/`)
- **Supported Locales**: `en`, `de`, `es`, `fr`, `pt`
- **Routing Strategy**: `/[lang]/...` directory structure
- **Implementation**: Astro i18n with custom `ui.ts` dictionary and explicit static paths.

## File Structure

```
/variscout-website/
│
├── README.md                    ← You are here
│
├── /design-system/
│   ├── TOKENS.md                # Colors, fonts, spacing
│   ├── COMPONENTS.md            # UI components
│   └── ICONS.md                 # Icon specifications
│
├── /content/
│   ├── MESSAGING.md             # Core messaging framework
│   ├── COPY-HOME.md             # Homepage copy
│   ├── COPY-PRODUCT-*.md        # Product page copy
│   ├── COPY-USE-CASE-*.md       # Use case page copy
│   ├── COPY-PRICING.md          # Pricing page copy
│   └── COPY-RESOURCES.md        # Resources page copy
│
├── /pages/
│   ├── SITEMAP.md               # Site architecture
│   ├── PAGE-HOME.md             # Homepage spec
│   ├── PAGE-PRODUCT-*.md        # Product page specs
│   ├── PAGE-USE-CASE-*.md       # Use case page specs
│   ├── PAGE-PRICING.md          # Pricing page spec
│   └── PAGE-RESOURCES.md        # Resources page spec
│
├── /flows/
│   ├── FLOW-FREE-TO-PAID.md     # Conversion journey
│   ├── FLOW-FIRST-USE.md        # First-time user flow
│   └── FLOW-PRODUCT-SELECTION.md
│
└── /technical/
    ├── TECH-STACK.md            # Technology choices
    ├── TECH-SEO.md              # SEO requirements
    ├── TECH-ANALYTICS.md        # Tracking setup
    └── TECH-INTEGRATION.md      # PWA & external links
```

## How to Use This Specification

### For AI Coding Agents

1. Start with `TECH-STACK.md` — understand framework and setup
   - [Design System Tokens](file:///Users/jukka-mattiturtiainen/Projects/VariScout_lite/docs/products/website/design-system/TOKENS.md)
   - [Technical Integration Strategy](file:///Users/jukka-mattiturtiainen/Projects/VariScout_lite/docs/products/website/technical/TECH-INTEGRATION.md)
   - [Shared UI Strategy (Cross-App Embedding)](file:///Users/jukka-mattiturtiainen/Projects/VariScout_lite/docs/technical/SHARED_UI_STRATEGY.md)
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

## Related Documents

| Document              | Location                                           | Purpose                               |
| --------------------- | -------------------------------------------------- | ------------------------------------- |
| **PWA Specification** | `variscout-pwa/`                                   | Technical spec for the actual PWA app |
| Product Specification | `variscout-pwa/VaRiScout-Product-Specification.md` | Product features, pricing, roadmap    |
| Licensing System      | `variscout-pwa/technical/TECH-LICENSING.md`        | Paddle + offline license keys         |
| PWA Storage           | `variscout-pwa/technical/TECH-PWA-STORAGE.md`      | IndexedDB, .vrs files                 |
| Feature Specification | VaRiScout-Feature-Specification.md                 | Detailed feature spec                 |
| GTM Strategy          | VaRiScout-GTM-Strategy-2026.md                     | Business plan                         |
| User Journeys         | VaRiScout-User-Journeys.md                         | Persona stories                       |

## Version

- Version: 1.0
- Date: January 2026
- Status: Initial specification
