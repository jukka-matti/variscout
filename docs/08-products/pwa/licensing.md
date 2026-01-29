# PWA Licensing

License key system for the paid PWA edition.

---

## License Model

| Tier          | Price    | Features                                                |
| ------------- | -------- | ------------------------------------------------------- |
| **Community** | Free     | Full features, VariScout branding                       |
| **Licensed**  | €99/year | No branding, theme customization (requires PWA install) |

> **PWA-Only Theming**: Theme customization (light/dark/system modes and accent colors) requires installing the app as a PWA (Add to Home Screen). This encourages full app installation for the best experience.

---

## License Key Format

License keys are cryptographically signed JWT-like tokens:

```
VS-XXXX-XXXX-XXXX-XXXX
```

The key contains:

- Edition identifier
- Expiry date
- Email hash (for identification)
- Digital signature

---

## Validation Flow

```
USER                    PWA                      BACKEND
  │                       │                          │
  │── Enter license key ─▶│                          │
  │                       │                          │
  │                       │── Validate signature ───▶│
  │                       │   (one-time, online)     │
  │                       │◀── License details ──────│
  │                       │                          │
  │                       │── Store in IndexedDB ───▶│
  │                       │   (for offline use)      │
  │                       │                          │
  │◀── License active ────│                          │
```

**Key points:**

- Initial validation requires internet
- After validation, works offline
- Expiry checked against local clock

---

## Feature Gating

```typescript
import { getEdition, isThemingEnabled } from '@variscout/core';

// Check edition
const edition = getEdition(); // 'community' | 'licensed'

// Feature gate
if (isThemingEnabled()) {
  // Show theme picker (licensed only)
}
```

---

## Purchase Flow

1. User visits `/pricing` page
2. Clicks "Buy License"
3. Redirected to Paddle checkout
4. Paddle processes payment, handles VAT
5. Webhook triggers license key generation
6. Email sent with license key (via Resend)
7. User enters key in Settings

---

## Integration

| Service            | Purpose                          |
| ------------------ | -------------------------------- |
| Paddle             | Payment processing, VAT handling |
| Cloudflare Workers | License generation webhook       |
| Resend             | Email delivery                   |

---

## Security Notes

| Component      | Security Level | Notes                         |
| -------------- | -------------- | ----------------------------- |
| License keys   | Medium         | Signed, but client-verifiable |
| Private key    | Critical       | Server-only, never exposed    |
| Paddle secrets | Critical       | Server-only                   |

For a €99 product, we accept that determined users could bypass client-side checks. Focus is on making the product worth paying for.

---

## See Also

- [ADR-006: Edition System](../../07-decisions/adr-006-edition-system.md)
