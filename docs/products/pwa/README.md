# VaRiScout Technical Documentation

## Overview

Technical specifications for VaRiScout implementation. These documents are designed to be used by developers (human or AI) building the product.

---

## Documents

| Document              | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `TECH-LICENSING.md`   | Paddle integration, license key generation, validation |
| `TECH-PWA-STORAGE.md` | IndexedDB schema, project storage, offline capability  |
| `TECH-STACK.md`       | Framework choices, dependencies, build setup           |
| `TECH-SEO.md`         | Search optimization requirements                       |
| `TECH-ANALYTICS.md`   | Tracking and metrics setup                             |

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
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
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

---

## Security Notes

| Component      | Security Level | Notes                         |
| -------------- | -------------- | ----------------------------- |
| User data      | High           | Never leaves browser          |
| License keys   | Medium         | Signed, but client-verifiable |
| Private key    | Critical       | Server-only, never exposed    |
| Paddle secrets | Critical       | Server-only                   |

For €49 product, we accept that determined users could bypass client-side checks. Focus on making the product worth paying for.
