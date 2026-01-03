# VariScout Subscription Licensing Architecture

**Status:** Architecture Document
**Date:** December 2024
**Version:** 1.0

---

## Overview

VariScout uses a yearly subscription model (€49/year + VAT) for both the PWA and Excel Add-in. The system uses Paddle for payment processing with **instant activation** — license is delivered directly to the PWA after checkout, with email as backup.

### Key Decisions

| Decision              | Choice                           | Rationale                                  |
| --------------------- | -------------------------------- | ------------------------------------------ |
| **Pricing**           | €49/year + VAT                   | Sustainable revenue, accessible to SMEs    |
| **Payment Processor** | Paddle Billing                   | Merchant of Record handles global VAT/tax  |
| **License Scope**     | Single license for PWA + Excel   | Simpler user experience                    |
| **Activation**        | Instant (POST /license/activate) | License returned directly, no email wait   |
| **Validation**        | Offline-capable (RSA signature)  | Works without internet after activation    |
| **Email**             | Backup only                      | Sent in background for records/new devices |
| **Free Trial**        | None (Community edition)         | Community edition serves as trial          |
| **API Location**      | Cloudflare Workers               | Edge deployment, fast globally             |
| **Database**          | Cloudflare KV                    | Simple key-value storage, edge-native      |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION LICENSING SYSTEM                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                    ┌─────────────────────────────────┐  │
│  │   Paddle.com    │                    │       Vercel Deployment         │  │
│  │   (Billing)     │                    │                                 │  │
│  │                 │   Webhooks         │  ┌───────────────────────────┐  │  │
│  │  • Products     │───────────────────▶│  │   /api/paddle/webhook     │  │  │
│  │  • Subscriptions│                    │  │   (subscription events)   │  │  │
│  │  • Checkout     │                    │  └───────────────────────────┘  │  │
│  │  • VAT handling │                    │             │                   │  │
│  └─────────────────┘                    │             ▼                   │  │
│          │                              │  ┌───────────────────────────┐  │  │
│          │ User checkout                │  │   Vercel KV (Redis)       │  │  │
│          ▼                              │  │                           │  │  │
│  ┌─────────────────┐                    │  │  license:VSL-XXXX → {     │  │  │
│  │   User          │                    │  │    email, status,         │  │  │
│  │                 │                    │  │    expires_at,            │  │  │
│  │  • Pays €49/yr  │                    │  │    subscription_id        │  │  │
│  │  • Gets key     │                    │  │  }                        │  │  │
│  │  • Enters in app│                    │  └───────────────────────────┘  │  │
│  └─────────────────┘                    │             │                   │  │
│          │                              │             │                   │  │
│          │ Enters license key           │             │                   │  │
│          ▼                              │             ▼                   │  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │                        CLIENT APPLICATIONS                           │  │  │
│  │                                                                      │  │  │
│  │  ┌─────────────────────┐      ┌─────────────────────┐               │  │  │
│  │  │   PWA               │      │   Excel Add-in      │               │  │  │
│  │  │   (variscout.com)   │      │   (Task Pane)       │               │  │  │
│  │  │                     │      │                     │               │  │  │
│  │  │  • Settings UI      │      │  • Settings UI      │               │  │  │
│  │  │  • License input    │      │  • License input    │               │  │  │
│  │  │  • Subscribe button │      │  • Subscribe button │               │  │  │
│  │  └─────────┬───────────┘      └─────────┬───────────┘               │  │  │
│  │            │                            │                           │  │  │
│  │            └────────────┬───────────────┘                           │  │  │
│  │                         │                                           │  │  │
│  │                         ▼                                           │  │  │
│  │            ┌─────────────────────────┐                              │  │  │
│  │            │  @variscout/core        │                              │  │  │
│  │            │  license.ts             │                              │  │  │
│  │            │                         │                              │  │  │
│  │            │  • checkLicense()       │───▶ GET /api/license/validate│  │  │
│  │            │  • cacheLicenseStatus() │                              │  │  │
│  │            │  • isValidLicenseFormat()                              │  │  │
│  │            └─────────────────────────┘                              │  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Edition System

VariScout has three editions determined by build-time configuration and runtime license validation:

| Edition       | Price    | Branding                     | How Activated                  |
| ------------- | -------- | ---------------------------- | ------------------------------ |
| **Community** | Free     | "VariScout Lite" footer      | Default                        |
| **ITC**       | Free     | "International Trade Centre" | Build-time: `VITE_EDITION=itc` |
| **Licensed**  | €49/year | No branding                  | Valid subscription license key |

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

## License Key Format

### Format: `VSL-XXXX-XXXX-XXXX`

- **Prefix:** `VSL-` (VariScout License)
- **Payload:** 8 alphanumeric characters (first two groups)
- **Checksum:** 4 characters (last group, derived from payload)

### Validation

```typescript
// Offline validation (checksum)
function isValidLicenseFormat(key: string): boolean {
  const pattern = /^VSL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(key.toUpperCase())) return false;

  const parts = key.toUpperCase().split('-');
  const payload = parts[1] + parts[2];
  const checksum = parts[3];

  return checksum === calculateChecksum(payload);
}

// Online validation (subscription status + expiry)
async function checkLicense(key: string): Promise<LicenseStatus> {
  // Try online first
  // Fall back to cache if offline
  // Return status with expiry info
}
```

---

## Instant Activation Flow

**CRITICAL:** License is delivered directly to the PWA after Paddle checkout — no waiting for email.

```
INSTANT ACTIVATION
─────────────────────────────────────────────────────────────────

User clicks "Upgrade" in PWA
         │
         ▼
Paddle checkout overlay
         │
         ▼
User completes payment
         │
         ▼
Paddle returns success → { transactionId: "txn_abc123" }
         │
         ▼
PWA calls: POST api.variscout.com/license/activate
  Body: { transactionId: "txn_abc123" }
         │
         ▼
Server (Cloudflare Worker):
  1. Verify transaction with Paddle API ✓
  2. Generate signed license key (RSA-SHA256)
  3. Store in KV (idempotent by transactionId)
  4. Send backup email (async, don't wait)
  5. Return license to PWA
         │
         ▼
PWA stores in IndexedDB
         │
         ▼
✅ Activated! (2-3 seconds total)
```

### Why Instant Activation?

| Benefit           | How                                       |
| ----------------- | ----------------------------------------- |
| No email wait     | License returned directly to PWA          |
| No copy/paste     | Key stored automatically in IndexedDB     |
| Works immediately | Features unlock in 2 seconds              |
| Email as backup   | For new devices, still sent in background |

### Server-Side: License Generation (RSA Signature)

```javascript
// generateLicense.js - Cloudflare Worker

import { createSign } from 'crypto';

export function generateLicenseKey(data) {
  const payload = {
    v: 1,
    email: data.email,
    product: data.product, // 'variscout-lite' or 'variscout-excel'
    issued: new Date().toISOString(),
    expires: data.expires, // ISO string or null for lifetime
    paddle_sub: data.subscriptionId,
    paddle_txn: data.transactionId,
  };

  // Sign the payload (RSA-SHA256)
  const sign = createSign('RSA-SHA256');
  sign.update(JSON.stringify(payload));
  const signature = sign.sign(process.env.LICENSE_PRIVATE_KEY, 'base64');

  payload.sig = signature;

  // Encode to base64url, format as VSL-XXXX-XXXX-XXXX-XXXX
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return formatLicenseKey(encoded);
}
```

### Client-Side: License Validation (Web Crypto API)

```javascript
// licenseValidator.js - Runs in PWA (browser), works OFFLINE

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhki... (embedded in app, safe to expose)
-----END PUBLIC KEY-----`;

export async function validateLicense(licenseKey) {
  try {
    const decoded = decodeLicenseKey(licenseKey);
    const { sig, ...payload } = decoded;

    // Verify signature using Web Crypto API
    const isValid = await verifySignature(JSON.stringify(payload), sig, PUBLIC_KEY);

    if (!isValid) return { valid: false, reason: 'invalid_signature' };

    // Check expiry
    if (decoded.expires && new Date(decoded.expires) < new Date()) {
      return { valid: false, reason: 'expired', expiredAt: decoded.expires };
    }

    return {
      valid: true,
      email: decoded.email,
      product: decoded.product,
      expires: decoded.expires,
      isLifetime: !decoded.expires,
    };
  } catch (error) {
    return { valid: false, reason: 'malformed' };
  }
}
```

### PWA Integration: After Checkout

```javascript
// Called by Paddle.js successCallback
async function activateLicenseFromTransaction(transactionId) {
  const response = await fetch('https://api.variscout.com/license/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId }),
  });

  if (!response.ok) {
    // Fallback: Ask user to check email
    return { success: false, fallback: 'Check your email for the license key' };
  }

  const { license, email, expires } = await response.json();

  // Store in IndexedDB
  await db.settings.bulkPut([
    { key: 'license', value: license },
    { key: 'licenseValidated', value: Date.now() },
    { key: 'licenseEmail', value: email },
    { key: 'licenseExpires', value: expires },
  ]);

  return { success: true, email, expires };
}
```

---

## API Endpoints

### Location: Cloudflare Workers

Edge-deployed serverless functions for license management.

### Endpoints

| Method | Path                    | Purpose                                     |
| ------ | ----------------------- | ------------------------------------------- |
| `POST` | `/api/paddle/webhook`   | Handle Paddle subscription events           |
| `GET`  | `/api/license/validate` | Validate license key, return status         |
| `POST` | `/api/license/activate` | Activate license for email (after checkout) |

### POST /api/paddle/webhook

Handles subscription lifecycle events from Paddle:

```typescript
// Webhook events handled:
// - subscription.created → Create license record
// - subscription.updated → Update status/expiry
// - subscription.canceled → Mark as canceled (grace period)
// - subscription.past_due → Mark as past_due
```

**Security:** Verify Paddle webhook signature before processing.

### GET /api/license/validate

```
GET /api/license/validate?key=VSL-XXXX-XXXX-XXXX

Response:
{
  "valid": true,
  "status": "active",
  "expiresAt": "2025-12-30T00:00:00Z",
  "daysRemaining": 365
}
```

### POST /api/license/activate

Called after successful Paddle checkout to create license:

```
POST /api/license/activate
{
  "email": "user@example.com",
  "paddle_subscription_id": "sub_xxx"
}

Response:
{
  "license_key": "VSL-XXXX-XXXX-XXXX",
  "expiresAt": "2025-12-30T00:00:00Z"
}
```

---

## Database Schema (Vercel KV)

### Key Structure

```
license:{key}     → License record JSON
email:{email}     → License key (for lookups by email)
sub:{sub_id}      → License key (for webhook updates)
```

### License Record

```json
{
  "key": "VSL-A1B2-C3D4-E5F6",
  "email": "user@example.com",
  "paddle_subscription_id": "sub_xxx",
  "status": "active",
  "created_at": "2024-12-30T00:00:00Z",
  "expires_at": "2025-12-30T00:00:00Z",
  "updated_at": "2024-12-30T00:00:00Z"
}
```

### Status Values

| Status     | Meaning                                   |
| ---------- | ----------------------------------------- |
| `active`   | Subscription active, license valid        |
| `past_due` | Payment failed, in grace period           |
| `canceled` | Subscription canceled, valid until expiry |
| `expired`  | Subscription ended, license invalid       |

---

## Hybrid Validation Strategy

The system supports offline-first usage while ensuring subscription validity.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HYBRID VALIDATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  App Launch / License Check                                              │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────┐                               │
│  │  1. Try online validation             │                               │
│  │     GET /api/license/validate         │                               │
│  └──────────────────────────────────────┘                               │
│       │                                                                  │
│       ├─── Success ───────────────────────────────────────┐             │
│       │                                                   │             │
│       │    ┌────────────────────────────────────────────┐ │             │
│       │    │  2a. Cache result in localStorage          │ │             │
│       │    │      - License status                      │ │             │
│       │    │      - Expiry date                         │ │             │
│       │    │      - Cached timestamp                    │ │             │
│       │    └────────────────────────────────────────────┘ │             │
│       │                                                   │             │
│       │                                                   ▼             │
│       │                                         ┌────────────────────┐  │
│       │                                         │  Return: VALID     │  │
│       │                                         │  (with expiry)     │  │
│       │                                         └────────────────────┘  │
│       │                                                                  │
│       └─── Offline/Error ─────────────────────────────────┐             │
│                                                           │             │
│            ┌────────────────────────────────────────────┐ │             │
│            │  2b. Check localStorage cache              │ │             │
│            │      - Is cache < 7 days old?              │ │             │
│            │      - Is cached expiry in future?         │ │             │
│            └────────────────────────────────────────────┘ │             │
│                 │                                         │             │
│                 ├─── Cache valid ──▶ Return: VALID (cached)             │
│                 │                                                        │
│                 └─── Cache expired/missing ──▶ Return: NEEDS_ONLINE     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cache Structure (localStorage)

```typescript
interface CachedLicenseStatus {
  key: string;
  valid: boolean;
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  expiresAt: string; // ISO date
  cachedAt: string; // ISO date when cached
  daysRemaining: number;
}

// Storage keys
const LICENSE_KEY = 'variscout_license'; // The license key itself
const LICENSE_CACHE = 'variscout_license_cache'; // Cached validation result
```

### Validation Rules

| Scenario       | Online Result   | Cache Age       | Action                              |
| -------------- | --------------- | --------------- | ----------------------------------- |
| Online success | Valid           | Any             | Use online result, update cache     |
| Online success | Invalid/Expired | Any             | Clear cache, downgrade to Community |
| Offline        | N/A             | < 7 days, valid | Use cache, show "offline" indicator |
| Offline        | N/A             | > 7 days        | Show "connect to verify" message    |
| Offline        | N/A             | No cache        | Community edition                   |

### Grace Periods

| Event                | Grace Period             |
| -------------------- | ------------------------ |
| Subscription expires | 7 days before downgrade  |
| Payment fails        | 14 days (Paddle default) |
| Offline cache        | 7 days validity          |

---

## Purchase Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION PURCHASE FLOW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User in PWA or Excel Add-in                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────┐                               │
│  │  Settings → License → "Subscribe"    │                               │
│  │                                       │                               │
│  │  Shows: €49/year + VAT               │                               │
│  │  Button: [Subscribe with Paddle]     │                               │
│  └──────────────────────────────────────┘                               │
│       │                                                                  │
│       │ User clicks Subscribe                                            │
│       ▼                                                                  │
│  ┌──────────────────────────────────────┐                               │
│  │  2. Paddle.js Checkout Overlay       │                               │
│  │                                       │                               │
│  │  • Email                             │                               │
│  │  • Payment method (card/PayPal/etc)  │                               │
│  │  • VAT handled automatically         │                               │
│  │  • Regional pricing shown            │                               │
│  └──────────────────────────────────────┘                               │
│       │                                                                  │
│       │ Payment successful                                               │
│       ▼                                                                  │
│  ┌──────────────────────────────────────┐     ┌──────────────────────┐  │
│  │  3. Paddle sends webhook             │────▶│ /api/paddle/webhook  │  │
│  │     subscription.created             │     │                      │  │
│  └──────────────────────────────────────┘     │ • Generate key       │  │
│                                               │ • Store in Vercel KV │  │
│                                               │ • Link to sub ID     │  │
│                                               └──────────────────────┘  │
│       │                                                                  │
│       │ Paddle checkout success callback                                 │
│       ▼                                                                  │
│  ┌──────────────────────────────────────┐                               │
│  │  4. App calls /api/license/activate  │                               │
│  │     with email from checkout         │                               │
│  │                                       │                               │
│  │  Response: { license_key: "VSL-..." }│                               │
│  └──────────────────────────────────────┘                               │
│       │                                                                  │
│       │ Auto-fill or user enters key                                     │
│       ▼                                                                  │
│  ┌──────────────────────────────────────┐                               │
│  │  5. License Activated                 │                               │
│  │                                       │                               │
│  │  • Key stored in localStorage        │                               │
│  │  • Branding removed                  │                               │
│  │  • Subscription status shown         │                               │
│  │  • Renewal date displayed            │                               │
│  └──────────────────────────────────────┘                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Settings UI

### License Section (PWA & Excel Add-in)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  License                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ COMMUNITY EDITION (No License) ───────────────────────────────────┐ │
│  │                                                                     │ │
│  │  Status: Community (Free)                                          │ │
│  │  Charts include "VariScout Lite" branding                          │ │
│  │                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  Upgrade to remove branding                                  │   │ │
│  │  │                                                              │   │ │
│  │  │  €49/year + VAT                                              │   │ │
│  │  │  • Remove chart branding                                     │   │ │
│  │  │  • Support development                                       │   │ │
│  │  │  • Works on PWA + Excel Add-in                               │   │ │
│  │  │                                                              │   │ │
│  │  │  [Subscribe with Paddle]                                     │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │                                                                     │ │
│  │  Already have a license?                                           │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │ VSL-____-____-____                                          │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  [Activate]                                                        │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─ LICENSED EDITION (Active Subscription) ───────────────────────────┐ │
│  │                                                                     │ │
│  │  Status: Licensed ✓                                                │ │
│  │  License: VSL-A1B2-C3D4-E5F6                                       │ │
│  │  Renewal: December 30, 2025 (365 days remaining)                   │ │
│  │                                                                     │ │
│  │  [Manage Subscription]  →  Opens Paddle customer portal            │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─ EXPIRING SOON (< 30 days) ────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  ⚠️ Status: Licensed (Expiring Soon)                               │ │
│  │  License: VSL-A1B2-C3D4-E5F6                                       │ │
│  │  Expires: January 15, 2025 (16 days remaining)                     │ │
│  │                                                                     │ │
│  │  Your subscription will renew automatically.                       │ │
│  │  [Manage Subscription]                                             │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Paddle Configuration

### Product Setup

| Setting           | Value                           |
| ----------------- | ------------------------------- |
| **Product Name**  | VariScout Pro                   |
| **Price**         | €49/year                        |
| **Billing Cycle** | Annual                          |
| **Currency**      | EUR (with regional equivalents) |
| **Tax Category**  | Software                        |

### Webhook Configuration

| Setting         | Value                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| **Webhook URL** | `https://variscout.com/api/paddle/webhook`                              |
| **Events**      | `subscription.created`, `subscription.updated`, `subscription.canceled` |
| **Secret**      | Generated by Paddle (stored in `PADDLE_WEBHOOK_SECRET`)                 |

### Environment Variables

```bash
# Paddle
PADDLE_VENDOR_ID=xxxxx
PADDLE_API_KEY=pdl_xxx...
PADDLE_WEBHOOK_SECRET=whsec_xxx...
PADDLE_PRODUCT_ID=pri_xxx...

# Vercel KV
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=xxx...
```

---

## Security Considerations

### Webhook Security

```typescript
// Verify Paddle webhook signature
import crypto from 'crypto';

function verifyPaddleSignature(rawBody: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
```

### License Key Security

- Keys are generated server-side only
- Checksum prevents random guessing
- Online validation prevents key sharing (one subscription = one key)
- Keys tied to email for account recovery

### Data Privacy

- License keys stored in Vercel KV (encrypted at rest)
- No personal data stored except email
- Paddle handles all payment data (PCI compliant)
- No usage tracking or telemetry

---

## Files to Create/Modify

### New Files

| File                                      | Purpose                     |
| ----------------------------------------- | --------------------------- |
| `apps/pwa/api/paddle/webhook.ts`          | Paddle webhook handler      |
| `apps/pwa/api/license/validate.ts`        | License validation endpoint |
| `apps/pwa/api/license/activate.ts`        | License activation endpoint |
| `docs/concepts/SUBSCRIPTION_LICENSING.md` | This document               |

### Modified Files

| File                                                    | Changes                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/core/src/license.ts`                          | Add `checkLicense()`, `cacheLicenseStatus()`, expiration logic |
| `packages/core/src/types.ts`                            | Add `LicenseStatus`, `CachedLicenseStatus` interfaces          |
| `apps/pwa/src/components/SettingsModal.tsx`             | Subscription UI section                                        |
| `apps/excel-addin/src/taskpane/components/Settings.tsx` | Subscription UI section                                        |
| `apps/pwa/package.json`                                 | Add `@vercel/kv` dependency                                    |

---

## Implementation Phases

### Phase 1: Backend Setup

1. Create `/api/paddle/webhook.ts`
2. Create `/api/license/validate.ts`
3. Create `/api/license/activate.ts`
4. Set up Vercel KV storage
5. Add environment variables

### Phase 2: Core License Updates

1. Add `LicenseStatus` interface to types
2. Update `license.ts` with online validation
3. Implement caching logic
4. Add expiration handling

### Phase 3: Paddle Configuration

1. Create Paddle account
2. Create product "VariScout Pro"
3. Configure webhooks
4. Test in sandbox mode

### Phase 4: UI Updates

1. Update PWA Settings with subscription UI
2. Update Excel Add-in Settings
3. Add Paddle.js checkout integration
4. Implement expiration warnings

### Phase 5: Testing & Launch

1. End-to-end purchase flow testing
2. Offline validation testing
3. Webhook event testing
4. Production deployment

---

## Related Documentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Technical architecture
- [MONOREPO_ARCHITECTURE.md](../MONOREPO_ARCHITECTURE.md) - Package structure
