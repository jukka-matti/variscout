# Licensing & Payment System

## Overview

VaRiScout uses Paddle as merchant of record with **instant activation** and offline-capable license key validation. After payment, the PWA immediately retrieves the license — no waiting for email.

## Architecture Decision

```
DESIGN PRINCIPLES
─────────────────────────────────────────────────────────────────

✓ Instant activation: License issued immediately after payment
✓ Offline-first: License validation works without internet
✓ No user database: We don't store user data
✓ GDPR simple: Paddle is merchant of record
✓ Email as backup: License also sent via email for records
```

## Activation Flow

```
INSTANT ACTIVATION (Primary)
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
  2. Generate signed license key
  3. Send backup email (async, don't wait)
  4. Return license to PWA
         │
         ▼
PWA stores in IndexedDB
         │
         ▼
✅ Activated! (2-3 seconds total)


EMAIL BACKUP (for records & new devices)
─────────────────────────────────────────────────────────────────

Email sent in background with:
  - License key
  - Invoice link
  - Activation instructions (for new devices)
```

---

## Payment Provider: Paddle

### Why Paddle

| Feature                 | Benefit                           |
| ----------------------- | --------------------------------- |
| Merchant of Record      | Paddle handles VAT/tax globally   |
| Checkout overlay        | No redirect, stays on our site    |
| Subscription management | Auto-renewals, cancellations      |
| License key delivery    | Built-in or via webhook           |
| EU VAT handling         | Critical for selling from Finland |

### Paddle Account Setup

```
Paddle Dashboard Configuration
─────────────────────────────────────────────────────────────────

Products:
  - VaRiScout Lite PWA (€49/year, subscription)
  - VaRiScout Excel Add-in (€49/year, subscription)

Webhook URL: https://api.variscout.com/webhook/paddle
Webhook Events:
  - subscription.activated
  - subscription.canceled
  - subscription.updated

Note: transaction.completed handled via /license/activate endpoint
      Webhook still useful for renewals and cancellations
```

### API Endpoints

| Endpoint                      | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `POST /license/activate`      | Instant activation after Paddle checkout     |
| `POST /webhook/paddle`        | Handle subscription events (renewal, cancel) |
| `GET /license/lookup?email=x` | Support tool: resend license                 |

### Environment Variables

```bash
# Paddle Configuration
PADDLE_VENDOR_ID=your_vendor_id
PADDLE_API_KEY=your_api_key
PADDLE_WEBHOOK_SECRET=your_webhook_secret
PADDLE_ENVIRONMENT=production  # or sandbox for testing

# License Generation
LICENSE_PRIVATE_KEY=your_rsa_private_key_base64
LICENSE_PUBLIC_KEY=your_rsa_public_key_base64  # Also embedded in PWA
```

---

## License Key System

### Key Structure

License keys are self-contained and cryptographically signed, enabling offline validation.

```
LICENSE KEY FORMAT
─────────────────────────────────────────────────────────────────

Human-readable: VSL-XXXX-XXXX-XXXX-XXXX

Decoded structure (JSON):
{
  "v": 1,                           // Schema version
  "email": "user@example.com",      // Customer email
  "product": "variscout-lite",      // Product identifier
  "issued": "2026-01-03T12:00:00Z", // Issue timestamp
  "expires": "2027-01-03T12:00:00Z",// Expiry (null = lifetime)
  "paddle_sub": "sub_abc123",       // Paddle subscription ID
  "paddle_txn": "txn_xyz789",       // Paddle transaction ID
  "sig": "base64_signature..."      // RSA signature
}

Encoding: Base64URL(JSON) → formatted as VSL-XXXX-XXXX-XXXX-XXXX
```

### Key Generation (Server-side)

```javascript
// generateLicense.js - Cloudflare Worker / Vercel Edge Function

import { createSign } from 'crypto';

const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY;

export function generateLicenseKey(data) {
  const payload = {
    v: 1,
    email: data.email,
    product: data.product,
    issued: new Date().toISOString(),
    expires: data.expires, // ISO string or null
    paddle_sub: data.subscriptionId,
    paddle_txn: data.transactionId,
  };

  // Sign the payload (excluding signature field)
  const sign = createSign('RSA-SHA256');
  sign.update(JSON.stringify(payload));
  const signature = sign.sign(PRIVATE_KEY, 'base64');

  payload.sig = signature;

  // Encode to base64url
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Format as human-readable key
  return formatLicenseKey(encoded);
}

function formatLicenseKey(encoded) {
  // VSL-XXXX-XXXX-XXXX-XXXX format
  const chunks = encoded.match(/.{1,4}/g) || [];
  return 'VSL-' + chunks.slice(0, 4).join('-');
  // Note: Full key stored, short version for display
}
```

### Key Validation (Client-side, Offline)

```javascript
// licenseValidator.js - Runs in PWA (browser)

// Public key embedded in app (safe to expose)
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhki...
-----END PUBLIC KEY-----`;

export async function validateLicense(licenseKey) {
  try {
    // 1. Decode the key
    const decoded = decodeLicenseKey(licenseKey);

    // 2. Extract signature and create unsigned payload
    const { sig, ...payload } = decoded;

    // 3. Verify signature using Web Crypto API
    const isValid = await verifySignature(JSON.stringify(payload), sig, PUBLIC_KEY);

    if (!isValid) {
      return { valid: false, reason: 'invalid_signature' };
    }

    // 4. Check expiry
    if (decoded.expires) {
      const expiryDate = new Date(decoded.expires);
      if (expiryDate < new Date()) {
        return {
          valid: false,
          reason: 'expired',
          expiredAt: decoded.expires,
        };
      }
    }

    // 5. Check product
    const validProducts = ['variscout-lite', 'variscout-excel'];
    if (!validProducts.includes(decoded.product)) {
      return { valid: false, reason: 'wrong_product' };
    }

    // 6. Success!
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

// Web Crypto API signature verification
async function verifySignature(data, signature, publicKeyPem) {
  const publicKey = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = base64ToArrayBuffer(signature);
  const dataBuffer = new TextEncoder().encode(data);

  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signatureBuffer, dataBuffer);
}
```

---

## Instant Activation Endpoint

### Implementation (Cloudflare Worker)

```javascript
// /license/activate - Called by PWA immediately after Paddle checkout

export async function handleActivate(request, env) {
  const { transactionId } = await request.json();

  if (!transactionId) {
    return Response.json({ error: 'Transaction ID required' }, { status: 400 });
  }

  try {
    // 1. Verify transaction with Paddle API
    const paddleResponse = await fetch(`https://api.paddle.com/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paddleResponse.ok) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = await paddleResponse.json();

    // 2. Verify transaction is completed
    if (transaction.data.status !== 'completed') {
      return Response.json({ error: 'Transaction not completed' }, { status: 400 });
    }

    // 3. Check if already activated (idempotent)
    const existingLicense = await env.LICENSES.get(`txn:${transactionId}`);
    if (existingLicense) {
      const cached = JSON.parse(existingLicense);
      return Response.json({
        license: cached.license,
        email: cached.email,
        expires: cached.expires,
        cached: true,
      });
    }

    // 4. Generate signed license key
    const productId = transaction.data.items[0]?.price?.product_id;
    const product = mapPaddleProduct(productId);
    const expires = calculateExpiry(transaction.data);
    const email = transaction.data.customer?.email;

    const license = generateLicenseKey({
      email,
      product,
      expires,
      subscriptionId: transaction.data.subscription_id,
      transactionId,
    });

    // 5. Store in KV for idempotency and support lookups
    const licenseData = {
      license,
      email,
      product,
      expires,
      transactionId,
      subscriptionId: transaction.data.subscription_id,
      created: new Date().toISOString(),
    };

    await env.LICENSES.put(`txn:${transactionId}`, JSON.stringify(licenseData));
    await env.LICENSES.put(`email:${email}`, JSON.stringify(licenseData));

    // 6. Send backup email (don't await - fire and forget)
    sendLicenseEmail({
      to: email,
      licenseKey: license,
      product: 'VaRiScout Lite',
      expires,
      env,
    }).catch(err => console.error('Email failed:', err));

    // 7. Return license immediately to PWA
    return Response.json({
      license,
      email,
      expires,
      product,
    });
  } catch (error) {
    console.error('Activation error:', error);
    return Response.json({ error: 'Activation failed' }, { status: 500 });
  }
}

function mapPaddleProduct(paddleProductId) {
  const mapping = {
    pro_pwa_xxx: 'variscout-lite',
    pro_excel_xxx: 'variscout-excel',
  };
  return mapping[paddleProductId] || 'variscout-lite';
}

function calculateExpiry(transaction) {
  // For subscriptions: 1 year from now
  // For one-time: null (lifetime)
  if (transaction.subscription_id) {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toISOString();
  }
  return null;
}
```

### PWA Integration

```javascript
// In PWA: Call after Paddle checkout success

async function activateLicenseFromTransaction(transactionId) {
  try {
    const response = await fetch('https://api.variscout.com/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Activation failed');
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
  } catch (error) {
    console.error('Activation error:', error);
    return {
      success: false,
      error: error.message,
      fallback: 'Check your email for the license key',
    };
  }
}
```

---

## Webhook Endpoint

Handles subscription lifecycle events (renewals, cancellations). Initial activation is handled by `/license/activate`.

### Implementation (Cloudflare Worker)

```javascript
// worker.js - Paddle webhook handler

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route to appropriate handler
    if (url.pathname === '/license/activate' && request.method === 'POST') {
      return handleActivate(request, env);
    }

    if (url.pathname === '/webhook/paddle' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleWebhook(request, env) {
  const body = await request.text();
  const event = JSON.parse(body);

  // Verify Paddle signature
  const signature = request.headers.get('Paddle-Signature');
  if (!verifyPaddleSignature(body, signature, env.PADDLE_WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Handle subscription events
  switch (event.event_type) {
    case 'subscription.updated':
      // Renewal: Update expiry in KV
      await handleSubscriptionRenewal(event.data, env);
      break;

    case 'subscription.canceled':
      // Optional: Send "sorry to see you go" email
      await handleSubscriptionCanceled(event.data, env);
      break;
  }

  return new Response('OK', { status: 200 });
}

async function handleSubscriptionRenewal(data, env) {
  const email = data.customer?.email;
  if (!email) return;

  // Get existing license data
  const existing = await env.LICENSES.get(`email:${email}`);
  if (!existing) return;

  const licenseData = JSON.parse(existing);

  // Generate new license with extended expiry
  const newExpiry = new Date();
  newExpiry.setFullYear(newExpiry.getFullYear() + 1);

  const newLicense = generateLicenseKey({
    email,
    product: licenseData.product,
    expires: newExpiry.toISOString(),
    subscriptionId: data.id,
    transactionId: data.transaction_id,
  });

  // Update KV
  const updatedData = {
    ...licenseData,
    license: newLicense,
    expires: newExpiry.toISOString(),
    renewed: new Date().toISOString(),
  };

  await env.LICENSES.put(`email:${email}`, JSON.stringify(updatedData));

  // Send renewal confirmation email with new key
  await sendRenewalEmail({
    to: email,
    licenseKey: newLicense,
    expires: newExpiry,
    env,
  });
}

async function handleSubscriptionCanceled(data, env) {
  const email = data.customer?.email;
  if (!email) return;

  // Send cancellation confirmation
  // Note: License still valid until expiry date
  await sendCancellationEmail({
    to: email,
    expiresAt: data.current_billing_period?.ends_at,
    env,
  });
}
```

### Email Templates

Email is sent as **backup** after instant activation. User already has the license in their PWA.

```javascript
async function sendLicenseEmail({ to, licenseKey, product, expires, env }) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VaRiScout <license@variscout.com>',
      to: [to],
      subject: `Your ${product} License Key`,
      html: generateLicenseEmailHtml({ licenseKey, product, expires }),
    }),
  });
}
```

```html
<!-- License delivery email (backup) -->
<h1>Welcome to VaRiScout! 🎉</h1>

<p>Thank you for your purchase. Your license is already active in your browser!</p>

<p>Keep this email as a backup. You'll need this license key if you:</p>
<ul>
  <li>Set up VaRiScout on a new device</li>
  <li>Clear your browser data</li>
  <li>Reinstall the app</li>
</ul>

<div
  style="background: #f5f5f5; padding: 20px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0;"
>
  VSL-XXXX-XXXX-XXXX-XXXX
</div>

<p><strong>License valid until:</strong> January 3, 2027</p>

<h2>Need to activate on a new device?</h2>
<ol>
  <li>Open <a href="https://variscout.com/app">VaRiScout</a></li>
  <li>Click Settings (⚙️)</li>
  <li>Click "Enter License Key"</li>
  <li>Paste the key above</li>
</ol>

<p>Questions? Reply to this email.</p>

<p>— The VaRiScout Team</p>
```

<p>Questions? Reply to this email.</p>
```

---

## PWA Storage (IndexedDB)

### Database Schema

```javascript
// db.js - Dexie.js wrapper for IndexedDB

import Dexie from 'dexie';

export const db = new Dexie('VaRiScoutDB');

db.version(1).stores({
  // License storage
  settings: 'key',

  // Project storage
  projects: '++id, name, created, updated',

  // Recent files (for quick access)
  recentFiles: '++id, name, lastOpened',
});

// Settings keys:
// - license: the full license key
// - licenseValidated: timestamp of last validation
// - licenseEmail: email from license (for display)
// - licenseExpires: expiry date (for UI warnings)
```

### License Storage Functions

```javascript
// licenseStorage.js

import { db } from './db';
import { validateLicense } from './licenseValidator';

export async function activateLicense(licenseKey) {
  const result = await validateLicense(licenseKey);

  if (result.valid) {
    await db.settings.bulkPut([
      { key: 'license', value: licenseKey },
      { key: 'licenseValidated', value: Date.now() },
      { key: 'licenseEmail', value: result.email },
      { key: 'licenseExpires', value: result.expires },
    ]);
  }

  return result;
}

export async function getLicenseStatus() {
  const license = await db.settings.get('license');

  if (!license?.value) {
    return { active: false, reason: 'no_license' };
  }

  // Re-validate (handles expiry check)
  const result = await validateLicense(license.value);

  if (!result.valid) {
    // License expired or invalid - clear it
    if (result.reason === 'expired') {
      return {
        active: false,
        reason: 'expired',
        expiredAt: result.expiredAt,
      };
    }
    await clearLicense();
    return { active: false, reason: result.reason };
  }

  return {
    active: true,
    email: result.email,
    expires: result.expires,
    isLifetime: result.isLifetime,
    daysRemaining: result.expires
      ? Math.ceil((new Date(result.expires) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

export async function clearLicense() {
  await db.settings.bulkDelete(['license', 'licenseValidated', 'licenseEmail', 'licenseExpires']);
}
```

---

## UI Components

### License Status Badge

```jsx
// LicenseStatusBadge.jsx

function LicenseStatusBadge({ status }) {
  if (status.active) {
    if (status.daysRemaining && status.daysRemaining < 30) {
      return (
        <div className="badge badge-warning">
          License expires in {status.daysRemaining} days
          <button onClick={openRenewal}>Renew</button>
        </div>
      );
    }
    return null; // No badge when everything is fine
  }

  return (
    <div className="badge badge-free">
      Free Edition
      <button onClick={openUpgrade}>Upgrade</button>
    </div>
  );
}
```

### License Entry Dialog

```jsx
// LicenseDialog.jsx

function LicenseDialog({ isOpen, onClose }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    setError(null);

    const result = await activateLicense(key);

    if (result.valid) {
      onClose({ success: true });
    } else {
      setError(getErrorMessage(result.reason));
    }

    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Activate License</DialogTitle>

      <DialogContent>
        <p>Enter your license key to remove the watermark.</p>

        <input
          type="text"
          placeholder="VSL-XXXX-XXXX-XXXX-XXXX"
          value={key}
          onChange={e => setKey(e.target.value)}
          className="license-input"
        />

        {error && <p className="error">{error}</p>}

        <p className="help-text">
          Don't have a key?{' '}
          <a href="#" onClick={openPaddleCheckout}>
            Buy now €49/year
          </a>
        </p>
      </DialogContent>

      <DialogActions>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleActivate} disabled={loading || !key}>
          {loading ? 'Validating...' : 'Activate'}
        </button>
      </DialogActions>
    </Dialog>
  );
}
```

### Paddle Checkout Integration (with Instant Activation)

```jsx
// PaddleCheckout.jsx

import { initializePaddle } from '@paddle/paddle-js';
import { db } from './db';

// Initialize Paddle (do once at app startup)
let paddle;

export async function initPaddle() {
  paddle = await initializePaddle({
    environment: import.meta.env.VITE_PADDLE_ENVIRONMENT || 'production',
    token: import.meta.env.VITE_PADDLE_TOKEN,
  });
}

export function openPaddleCheckout({ product = 'variscout-lite', onSuccess, onError }) {
  const priceIds = {
    'variscout-lite': 'pri_abc123',
    'variscout-excel': 'pri_def456',
  };

  paddle.Checkout.open({
    items: [{ priceId: priceIds[product], quantity: 1 }],

    // Success callback - Paddle checkout completed
    successCallback: async data => {
      try {
        // Instant activation!
        const result = await activateLicenseFromTransaction(data.transaction_id);

        if (result.success) {
          onSuccess?.({
            email: result.email,
            expires: result.expires,
            message: 'License activated!',
          });
        } else {
          // Fallback: Ask user to check email
          onSuccess?.({
            email: result.email,
            fallback: true,
            message: 'Check your email for your license key',
          });
        }
      } catch (error) {
        onError?.(error);
      }
    },

    // Closed without completing
    closeCallback: () => {
      console.log('Checkout closed');
    },
  });
}

async function activateLicenseFromTransaction(transactionId) {
  const response = await fetch('https://api.variscout.com/license/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error: error.error,
      fallback: true,
    };
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

### Success UI

```jsx
// ActivationSuccess.jsx

function ActivationSuccess({ result, onClose }) {
  if (result.fallback) {
    // Rare case: API failed, email is backup
    return (
      <Dialog open onClose={onClose}>
        <DialogContent>
          <h2>Almost there!</h2>
          <p>Check your email for your license key. Then enter it in Settings.</p>
          <button onClick={onClose}>OK</button>
        </DialogContent>
      </Dialog>
    );
  }

  // Normal case: Instant activation worked
  return (
    <Dialog open onClose={onClose}>
      <DialogContent>
        <div className="success-icon">✓</div>
        <h2>You're all set!</h2>
        <p>Your license is now active.</p>

        <ul className="features-unlocked">
          <li>✓ Save projects</li>
          <li>✓ Export .vrs files</li>
          <li>✓ No watermark</li>
        </ul>

        <p className="fine-print">A backup of your license key was sent to {result.email}</p>

        <button onClick={onClose} className="primary">
          Start Using VaRiScout
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Watermark Behavior

### Implementation

```jsx
// Watermark.jsx

function ChartWatermark({ licenseStatus }) {
  // No watermark for licensed users
  if (licenseStatus.active) {
    return null;
  }

  return (
    <div className="watermark">
      <span>VaRiScout Lite</span>
    </div>
  );
}

// CSS
.watermark {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  user-select: none;
}
```

### Export Watermark

```javascript
// When exporting PNG
function exportChartAsPng(chartElement, licenseStatus) {
  const canvas = await html2canvas(chartElement);

  if (!licenseStatus.active) {
    const ctx = canvas.getContext('2d');
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText('VaRiScout Lite', canvas.width - 100, canvas.height - 10);
  }

  return canvas.toDataURL('image/png');
}
```

---

## Security Considerations

### What's Protected

| Item                    | Location         | Security       |
| ----------------------- | ---------------- | -------------- |
| Private signing key     | Server env only  | Never exposed  |
| Public verification key | Embedded in PWA  | Safe to expose |
| License key             | User's IndexedDB | Per-device     |
| Paddle webhook secret   | Server env only  | Never exposed  |

### What's NOT Protected (By Design)

At €49/year, we accept:

- Technically savvy users could bypass client-side checks
- License keys could be shared
- Cost of over-engineering > lost revenue

### Mitigation

- Signed keys prevent forgery
- Expiry dates are in the signature (can't be modified)
- Paddle handles refunds/chargebacks
- Focus energy on making product worth paying for

---

## Testing

### Local Development

```bash
# Use Paddle Sandbox environment
PADDLE_ENVIRONMENT=sandbox

# Generate test license keys
npm run generate-test-license

# Test webhook locally
npx paddle-webhooks-simulator
```

### Test Cases

| Scenario                                | Expected Result                             |
| --------------------------------------- | ------------------------------------------- |
| Complete Paddle checkout                | Transaction ID returned to PWA              |
| Call /license/activate with valid txn   | License returned, stored in IndexedDB       |
| Call /license/activate twice (same txn) | Same license returned (idempotent)          |
| Call /license/activate with invalid txn | 404 error                                   |
| Valid license key (manual entry)        | Watermark removed, features unlocked        |
| Expired license key                     | Error: "License expired", watermark shown   |
| Invalid signature                       | Error: "Invalid license key"                |
| Wrong product                           | Error: "License not valid for this product" |
| Malformed key                           | Error: "Invalid license key format"         |
| Offline validation                      | Works without internet                      |
| Clear license                           | Watermark returns, save blocked             |
| Network error during activation         | Fallback to email message                   |

---

## Deployment Checklist

- [ ] Paddle account created and verified
- [ ] Products configured in Paddle
- [ ] RSA key pair generated
- [ ] Cloudflare Worker deployed with:
  - [ ] /license/activate endpoint
  - [ ] /webhook/paddle endpoint
- [ ] KV namespace created (LICENSES)
- [ ] Environment variables set
- [ ] Email templates created (Resend)
- [ ] Test: Complete checkout flow in Paddle sandbox
- [ ] Test: Instant activation returns license
- [ ] Test: Email backup is sent
- [ ] Test: License validation works offline
- [ ] Test: Renewal webhook updates license
- [ ] Production webhook URL configured in Paddle
