# VariScout Subscription Licensing Architecture

**Status:** Architecture Document
**Date:** December 2024
**Version:** 1.0

---

## Overview

VariScout uses a yearly subscription model (€99/year + VAT) with **separate licenses for each product**. The PWA uses Paddle for payment processing, while the Excel Add-in uses Microsoft AppSource for corporate-friendly purchasing. Both support **instant activation** — license is delivered directly to the app after checkout, with email as backup.

---

## Key Decisions

| Decision          | Choice                           | Rationale                                   |
| ----------------- | -------------------------------- | ------------------------------------------- |
| **Pricing**       | €99/year + VAT (per product)     | Sustainable revenue, premium positioning    |
| **PWA Billing**   | Paddle Billing                   | Merchant of Record handles global VAT/tax   |
| **Excel Billing** | Microsoft AppSource              | Corporate-friendly purchasing (procurement) |
| **License Scope** | Separate licenses per product    | Independent purchase paths, clearer value   |
| **Activation**    | Instant (POST /license/activate) | License returned directly, no email wait    |
| **Validation**    | Offline-capable (RSA signature)  | Works without internet after activation     |
| **Email**         | Backup only                      | Sent in background for records/new devices  |
| **Free Trial**    | None (Community edition)         | Community edition serves as trial           |
| **API Location**  | Cloudflare Workers               | Edge deployment, fast globally              |
| **Database**      | Cloudflare KV                    | Simple key-value storage, edge-native       |

---

## Edition System

VariScout has four editions determined by build-time configuration and runtime license validation:

| Edition               | Price    | Platform | Branding                     | How Activated                     |
| --------------------- | -------- | -------- | ---------------------------- | --------------------------------- |
| **Community**         | Free     | PWA      | "VariScout" footer           | Default                           |
| **Community (Excel)** | Free     | Excel    | "VariScout" footer           | Default                           |
| **ITC**               | Free     | PWA      | "International Trade Centre" | Build-time: `VITE_EDITION=itc`    |
| **Licensed (PWA)**    | €99/year | PWA      | No branding                  | Valid license key (via Paddle)    |
| **Licensed (Excel)**  | €99/year | Excel    | No branding                  | Valid license key (via AppSource) |

### Edition Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDITION DETERMINATION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  App Startup                                                             │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────┐                       │
│  │  Check VITE_EDITION environment variable      │                       │
│  └──────────────────────────────────────────────┘                       │
│       │                                                                  │
│       ├─── "itc" ─────────────▶ ITC Edition (ITC branding)              │
│       │                                                                  │
│       ├─── "licensed" ────────▶ Licensed Edition (pre-licensed builds)  │
│       │                                                                  │
│       └─── undefined/community                                           │
│                   │                                                      │
│                   ▼                                                      │
│       ┌──────────────────────────────────────────────┐                  │
│       │  Check localStorage for license key          │                  │
│       │  + Validate online (or use cache)            │                  │
│       └──────────────────────────────────────────────┘                  │
│                   │                                                      │
│                   ├─── Valid + Not Expired ──▶ Licensed Edition         │
│                   │                                                      │
│                   └─── Invalid/Expired ──────▶ Community Edition        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION LICENSING SYSTEM                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        BILLING CHANNELS                                  │ │
│  │                                                                          │ │
│  │   ┌─────────────────┐              ┌─────────────────┐                  │ │
│  │   │   Paddle.com    │              │  MS AppSource   │                  │ │
│  │   │   (PWA only)    │              │  (Excel only)   │                  │ │
│  │   │                 │              │                 │                  │ │
│  │   │  • €99/year     │              │  • €99/year     │                  │ │
│  │   │  • Individuals  │              │  • Corporate    │                  │ │
│  │   │  • Small biz    │              │  • Procurement  │                  │ │
│  │   │  • VAT handling │              │  • Enterprise   │                  │ │
│  │   └────────┬────────┘              └────────┬────────┘                  │ │
│  │            │ Webhooks                       │ Events                    │ │
│  │            ▼                                ▼                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        VERCEL DEPLOYMENT                                 │ │
│  │                                                                          │ │
│  │   ┌───────────────────────────┐    ┌───────────────────────────┐        │ │
│  │   │   /api/paddle/webhook     │    │  /api/appstore/webhook    │        │ │
│  │   │   (PWA subscriptions)     │    │  (Excel subscriptions)    │        │ │
│  │   └─────────────┬─────────────┘    └─────────────┬─────────────┘        │ │
│  │                 │                                │                      │ │
│  │                 └────────────┬───────────────────┘                      │ │
│  │                              ▼                                          │ │
│  │                 ┌───────────────────────────┐                           │ │
│  │                 │   Vercel KV (Redis)       │                           │ │
│  │                 │                           │                           │ │
│  │                 │  license:VSL-XXXX → {     │                           │ │
│  │                 │    email, status,         │                           │ │
│  │                 │    expires_at, product,   │                           │ │
│  │                 │    source: paddle|appstore│                           │ │
│  │                 │  }                        │                           │ │
│  │                 └───────────────────────────┘                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Note: PWA and Excel licenses are product-specific. Users need separate     │
│  licenses if they want to use both products.                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## See Also

- [Billing Channels](./BILLING-CHANNELS.md) - Paddle, AppSource, Azure
- [License Key](./LICENSE-KEY.md) - Format, generation, validation
- [Activation](./ACTIVATION.md) - Instant flow, API
- [Hybrid Validation](./HYBRID-VALIDATION.md) - Cache strategy
- [Implementation](./IMPLEMENTATION.md) - Files, phases

---

## Related Documentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Technical architecture
- [MONOREPO_ARCHITECTURE.md](../MONOREPO_ARCHITECTURE.md) - Package structure
