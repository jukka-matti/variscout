# Technical: Integration

## Overview

Integration points between the marketing website and external systems.

---

## PWA Integration

### Architecture

```
variscout.com (Marketing)     variscout.com/app (PWA)
        │                              │
        │      Same domain             │
        │◄─────────────────────────────►│
        │                              │
   Static pages                   SPA (React/Vue)
   Astro-generated                Client-side only
```

### URL Structure

| Path         | Content            | Build               |
| ------------ | ------------------ | ------------------- |
| `/`          | Marketing homepage | Astro SSG           |
| `/product/*` | Product pages      | Astro SSG           |
| `/pricing`   | Pricing page       | Astro SSG           |
| `/app`       | PWA entry          | SPA bundle          |
| `/app/*`     | PWA routes         | Client-side routing |

### Shared Assets

```
/public
  /favicon.svg          ← Shared
  /logo.svg             ← Shared
  /og/                  ← Marketing only
  /app/                 ← PWA assets
    /manifest.json
    /service-worker.js
    /icons/
```

### Build Configuration

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'static',
  build: {
    // Exclude /app from Astro build
    // PWA builds separately
  },
});
```

### Cross-Linking

Marketing → App:

```html
<a href="/app">Try Free</a> <a href="/app?sample=pizza">Try Sample Data</a>
```

App → Marketing:

```html
<a href="/pricing">Upgrade</a> <a href="/">VaRiScout Home</a>
```

---

## AppSource Links

### Power BI Visuals

```yaml
base_url: 'https://appsource.microsoft.com/en-us/product/power-bi-visuals'

visuals:
  - name: 'VaRiScout I-Chart'
    id: 'WA123456789' # Placeholder
    url: '{base_url}/WA123456789'

  - name: 'VaRiScout Boxplot'
    id: 'WA123456790'
    url: '{base_url}/WA123456790'

  - name: 'VaRiScout Pareto'
    id: 'WA123456791'
    url: '{base_url}/WA123456791'

  - name: 'VaRiScout Capability'
    id: 'WA123456792'
    url: '{base_url}/WA123456792'
```

### Excel Add-in

```yaml
excel_addin:
  name: 'VaRiScout for Excel'
  id: 'WA987654321' # Placeholder
  url: 'https://appsource.microsoft.com/en-us/product/office/WA987654321'
```

### Link Component

```astro
---
// AppSourceButton.astro
interface Props {
  product: 'powerbi' | 'excel';
}

const urls = {
  powerbi: 'https://appsource.microsoft.com/...',
  excel: 'https://appsource.microsoft.com/...'
};

const { product } = Astro.props;
---

<a
  href={urls[product]}
  target="_blank"
  rel="noopener"
  class="btn btn-primary"
  data-track="appsource"
  data-product={product}
>
  Get from AppSource
  <ExternalLinkIcon />
</a>
```

---

## Azure Marketplace

### Listing

```yaml
azure_marketplace:
  name: 'VaRiScout'
  publisher: 'RDMAIC Oy'
  url: 'https://azuremarketplace.microsoft.com/en-us/marketplace/apps/rdmaic.variscout'
  offer_id: 'variscout'
```

### Deploy Button

```html
<a href="https://portal.azure.com/#create/rdmaic.variscout">
  <img src="https://aka.ms/deploytoazurebutton" alt="Deploy to Azure" />
</a>
```

---

## Payment Integration

### Website Does NOT Handle Payments

The marketing website is **static and informational only**. No checkout, no payment processing.

```
PAYMENT FLOW SUMMARY
─────────────────────────────────────────────────────

Individual (€49):  PWA → Paddle checkout (in-app)
Power BI:          AppSource → Microsoft billing
Azure:             Azure Marketplace → Microsoft billing
```

### Where Payments Happen

| Product              | Payment Handled By | Where                        |
| -------------------- | ------------------ | ---------------------------- |
| VaRiScout Lite (PWA) | Paddle             | Inside PWA (in-app purchase) |
| VaRiScout Excel      | Paddle             | Inside Excel add-in          |
| Power BI Visuals     | Microsoft          | AppSource                    |
| Azure Deployment     | Microsoft          | Azure Marketplace            |

### Why No Website Checkout?

1. **Data privacy** — Users analyze sensitive operational data in the PWA. Don't redirect them to a payment page mid-analysis.
2. **Simplicity** — Static website with no backend. No payment integration to maintain.
3. **Microsoft handles enterprise** — Power BI and Azure customers expect to buy through Microsoft's procurement systems.
4. **GDPR simple** — Website collects no data, processes no payments.

### Implementation Notes

- Paddle checkout is implemented in the **PWA only** — see `variscout-pwa/technical/TECH-LICENSING.md`
- Website pricing page links to `/app` or Microsoft AppSource
- No Paddle SDK or payment code in website codebase

### Webhook API (Separate from Website)

The Paddle webhook handler is a separate Cloudflare Worker, not part of the website:

```
https://api.variscout.com/webhook/paddle
```

This receives Paddle events, generates license keys, and sends emails. It's documented in the PWA spec, not here.

- Issue date
- Expiry date
- RSA signature

Validation:

- PWA has embedded public key
- Verifies signature using Web Crypto API
- Works completely offline
- Stored in IndexedDB

````

> **Full implementation details**: `variscout-pwa/technical/TECH-LICENSING.md`

---

## Social Integration

### LinkedIn

Share buttons with pre-filled content:
```javascript
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
````

### YouTube

Embed for demo videos:

```html
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="VaRiScout Demo"
  loading="lazy"
  allowfullscreen
></iframe>
```

---

## External Resources

### Sample Data CDN

Host sample CSV files:

```
https://variscout.com/data/pizza-delivery.csv
https://variscout.com/data/cycle-time.csv
https://variscout.com/data/supplier-quality.csv
```

Or use GitHub raw:

```
https://raw.githubusercontent.com/variscout/sample-data/main/pizza-delivery.csv
```

### Documentation

If separate docs site:

```
docs.variscout.com → GitBook, Docusaurus, or similar
```

Or integrated:

```
variscout.com/docs → Part of main site
```

---

## Webhook Events

### Paddle Webhooks

## Note: Webhook & Payment Infrastructure

The Paddle webhook handler and license infrastructure is **separate from the website**.

| Component         | Location          | Purpose                             |
| ----------------- | ----------------- | ----------------------------------- |
| Marketing Website | variscout.com     | Static pages (Astro)                |
| PWA               | variscout.com/app | Analysis tool (React)               |
| Webhook API       | api.variscout.com | Paddle webhooks (Cloudflare Worker) |

See `variscout-pwa/technical/TECH-LICENSING.md` for webhook and payment implementation.

---

## Environment Variables (Website Only)

The marketing website is static and needs minimal configuration:

```bash
# Build-time only
PUBLIC_SITE_URL=https://variscout.com
PUBLIC_APP_URL=https://variscout.com/app

# Analytics (if using Plausible)
PUBLIC_PLAUSIBLE_DOMAIN=variscout.com
```

No payment credentials, no API keys, no secrets. It's just static HTML/CSS/JS.

---

## Website Launch Checklist

Before launch:

- [ ] All pages built and tested
- [ ] AppSource links updated with real IDs (when available)
- [ ] Azure Marketplace link updated (when available)
- [ ] Analytics configured (Plausible)
- [ ] SEO meta tags verified
- [ ] Open Graph images created
- [ ] Mobile responsive tested
- [ ] External links verified (AppSource, Azure)
- [ ] Contact form working (if any)
- [ ] DNS configured for variscout.com

### Separate from Website (PWA/API)

These are handled in the PWA spec, not website:

- [ ] Paddle account verified
- [ ] Paddle products/prices created
- [ ] Webhook endpoint deployed
- [ ] License key generation working
- [ ] Email templates created

## Related Documents

| Document                 | Location                                           |
| ------------------------ | -------------------------------------------------- |
| Licensing Implementation | `variscout-pwa/technical/TECH-LICENSING.md`        |
| PWA Storage              | `variscout-pwa/technical/TECH-PWA-STORAGE.md`      |
| PWA Tech Stack           | `variscout-pwa/technical/TECH-STACK.md`            |
| Product Specification    | `variscout-pwa/VaRiScout-Product-Specification.md` |
