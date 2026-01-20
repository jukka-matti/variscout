# VaRiScout Technical Documentation

## Overview

Technical specifications for VaRiScout implementation. These documents are designed to be used by developers (human or AI) building the product.

---

## Documents

| Document                                | Description                                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| `PWA_STORAGE.md`                        | IndexedDB schema, project storage, offline capability            |
| `TESTING_STRATEGY.md`                   | Testing philosophy, patterns, ownership by package (incl. Azure) |
| `DATA_INPUT.md`                         | CSV/Excel parsing, validation, auto-mapping                      |
| `INTERNATIONALIZATION_STRATEGY.md`      | i18next setup, language detection, translation workflow          |
| `ADR.md`                                | Architecture Decision Records (key technical decisions)          |
| `DEPLOYMENT.md`                         | CI/CD placeholder, build commands, deployment targets            |
| `../concepts/SUBSCRIPTION_LICENSING.md` | Paddle integration, license key generation, validation           |

---

## Architecture Summary

```
VARISCOUT ARCHITECTURE
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    REACT APPLICATION                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ I-Chart │  │ Boxplot │  │ Pareto  │  │Capability│      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  │                      │                                     │ │
│  │                      ↓                                     │ │
│  │              ┌───────────────┐                            │ │
│  │              │ Analysis Core │ (statistics, calculations)  │ │
│  │              └───────────────┘                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      IndexedDB                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │ │
│  │  │ Projects │  │ Settings │  │ License  │                │ │
│  │  └──────────┘  └──────────┘  └──────────┘                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Service Worker                           │ │
│  │              (offline caching, PWA)                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (only for license activation)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐        ┌─────────────────┐               │
│  │     Paddle      │        │  Webhook API    │               │
│  │   (payments)    │───────→│ (license gen)   │               │
│  └─────────────────┘        └─────────────────┘               │
│                                      │                          │
│                                      ↓                          │
│                             ┌─────────────────┐               │
│                             │  Email (Resend) │               │
│                             │  License key    │               │
│                             └─────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions

| Decision                 | Choice            | Rationale                             |
| ------------------------ | ----------------- | ------------------------------------- |
| No backend for user data | Client-only       | GDPR simplicity, no hosting costs     |
| IndexedDB for storage    | Dexie.js          | Large data support, async, persistent |
| License validation       | Signed keys       | Offline-capable, no server roundtrip  |
| Payment provider         | Paddle            | VAT handling, merchant of record      |
| Hosting                  | Vercel/Cloudflare | Static files, edge caching            |

---

## Development Setup

```bash
# Clone repo
git clone https://github.com/your-org/variscout-lite.git
cd variscout-lite

# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Environment Variables

### Development (.env.local)

```bash
# Paddle (use sandbox for dev)
VITE_PADDLE_TOKEN=test_xxx
VITE_PADDLE_ENVIRONMENT=sandbox

# License public key (safe to expose)
VITE_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
```

### Production (hosting provider secrets)

```bash
# Paddle
PADDLE_API_KEY=live_xxx
PADDLE_WEBHOOK_SECRET=whsec_xxx

# License generation (server-side only)
LICENSE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Email
RESEND_API_KEY=re_xxx
```

---

## Deployment

### PWA (Vercel)

```bash
# Deploy
npx vercel

# Production
npx vercel --prod
```

### Webhook API (Cloudflare Workers)

```bash
cd api/
npx wrangler publish
```

---

## Testing Checklist

> See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for complete testing philosophy and patterns.

### License System

- [ ] Generate license key
- [ ] Validate valid key
- [ ] Reject expired key
- [ ] Reject invalid signature
- [ ] Offline validation works
- [ ] License persists in IndexedDB
- [ ] Watermark appears/disappears correctly

### Storage System

- [ ] Create project
- [ ] Auto-save works
- [ ] Load saved project
- [ ] Export .vrs file
- [ ] Import .vrs file
- [ ] Settings persist
- [ ] Recent files tracked

### PWA

- [ ] Offline mode works
- [ ] Install prompt appears
- [ ] Service worker caches correctly
- [ ] Updates apply correctly

### Azure Team App

- [ ] MSAL login/logout works
- [ ] Tab navigation (Analysis, Regression, Gage R&R)
- [ ] All charts render correctly
- [ ] ANOVA results display below Boxplot
- [ ] Offline indicator updates
- [ ] Sync to OneDrive works when online

---

## Security Notes

| Component      | Security Level | Notes                         |
| -------------- | -------------- | ----------------------------- |
| User data      | High           | Never leaves browser          |
| License keys   | Medium         | Signed, but client-verifiable |
| Private key    | Critical       | Server-only, never exposed    |
| Paddle secrets | Critical       | Server-only                   |

For €49 product, we accept that determined users could bypass client-side checks. Focus on making the product worth paying for.
