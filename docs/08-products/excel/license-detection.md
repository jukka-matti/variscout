# License Detection via Graph API

How the Excel Add-in detects whether the user's tenant has VariScout Azure App deployed.

---

## Overview

The Excel Add-in uses a **freemium model**:

- **Free tier**: Available to all AppSource users
- **Full tier**: Automatically unlocks when tenant has Azure App

Detection is performed via Microsoft Graph API by checking for the VariScout App Registration in the user's tenant.

---

## Detection Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXCEL ADD-IN STARTUP                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. Check localStorage cache                                      │
│     - If cached and not expired → use cached tier                │
│     - If no cache or expired → continue to Graph API             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Get MSAL token (silent or interactive)                       │
│     - Scope: Application.Read.All (delegated)                    │
│     - Falls back to free tier if auth fails                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Query Graph API for VariScout App Registration               │
│     GET /applications?$filter=displayName eq 'VariScout'         │
└──────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
           ┌───────────────┐   ┌───────────────┐
           │ App Found     │   │ App Not Found │
           │ → Full Tier   │   │ → Free Tier   │
           └───────────────┘   └───────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. Cache result in localStorage (24h expiry)                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. Apply feature gating based on tier                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### License Detection Service

```typescript
// apps/excel-addin/src/lib/licenseDetection.ts

import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphClient } from './auth';

export interface LicenseStatus {
  tier: 'free' | 'full';
  licensed: boolean;
  checkedAt: number;
  expiresAt: number;
}

const CACHE_KEY = 'variscout_license_status';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function checkLicense(): Promise<LicenseStatus> {
  // 1. Check cache first
  const cached = getCachedLicense();
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  // 2. Query Graph API
  try {
    const graphClient = await getGraphClient();
    const status = await checkAzureAppRegistration(graphClient);

    // 3. Cache result
    cacheLicense(status);
    return status;
  } catch (error) {
    console.warn('License check failed, defaulting to free tier:', error);
    return {
      tier: 'free',
      licensed: false,
      checkedAt: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION_MS,
    };
  }
}

async function checkAzureAppRegistration(client: Client): Promise<LicenseStatus> {
  // Query for VariScout app registration
  const response = await client
    .api('/applications')
    .filter("displayName eq 'VariScout'")
    .select('id,displayName,appId')
    .top(1)
    .get();

  const hasApp = response.value && response.value.length > 0;

  return {
    tier: hasApp ? 'full' : 'free',
    licensed: hasApp,
    checkedAt: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION_MS,
  };
}

function getCachedLicense(): LicenseStatus | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function cacheLicense(status: LicenseStatus): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(status));
  } catch {
    // localStorage may be unavailable
  }
}

export function clearLicenseCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
```

### MSAL Configuration

```typescript
// apps/excel-addin/src/lib/auth.ts

import { PublicClientApplication, Configuration } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const graphScopes = ['Application.Read.All'];

export async function getGraphClient(): Promise<Client> {
  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    // Interactive login for first-time users
    await msalInstance.loginPopup({ scopes: graphScopes });
  }

  const response = await msalInstance.acquireTokenSilent({
    scopes: graphScopes,
    account: accounts[0],
  });

  return Client.init({
    authProvider: done => {
      done(null, response.accessToken);
    },
  });
}
```

---

## Graph API Permissions

### Required Permissions

| Permission             | Type      | Admin Consent | Purpose                          |
| ---------------------- | --------- | ------------- | -------------------------------- |
| `Application.Read.All` | Delegated | Yes           | Read app registrations in tenant |

### Permission Request

The permission requires admin consent. Options:

1. **Tenant Admin**: Pre-consents when deploying the Add-in organization-wide
2. **User Request**: User requests admin consent via popup
3. **Fallback**: If consent not granted, assume free tier

### Consent Flow

```typescript
async function requestAdminConsent(): Promise<void> {
  const adminConsentUrl =
    `https://login.microsoftonline.com/common/adminconsent` +
    `?client_id=${import.meta.env.VITE_AZURE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(window.location.origin)}`;

  window.open(adminConsentUrl, '_blank');
}
```

---

## Feature Gating

### Using License Status

```typescript
// apps/excel-addin/src/hooks/useLicense.ts

import { useState, useEffect } from 'react';
import { checkLicense, LicenseStatus } from '../lib/licenseDetection';

export function useLicense() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLicense()
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  return { status, loading };
}
```

### Feature Limits

```typescript
// apps/excel-addin/src/lib/featureLimits.ts

import { LicenseStatus } from './licenseDetection';

export const FEATURE_LIMITS = {
  free: {
    maxChannels: 50,
    maxDrillDownDepth: 2,
    advancedFiltering: false,
  },
  full: {
    maxChannels: Infinity,
    maxDrillDownDepth: Infinity,
    advancedFiltering: true,
  },
} as const;

export function getFeatureLimits(status: LicenseStatus) {
  return FEATURE_LIMITS[status.tier];
}
```

### Gating Example

```typescript
// In Performance Mode setup
const { status } = useLicense();
const limits = getFeatureLimits(status);

if (channels.length > limits.maxChannels) {
  return (
    <UpgradePrompt
      feature="Unlimited Channels"
      current={channels.length}
      limit={limits.maxChannels}
    />
  );
}
```

---

## Caching Strategy

### Why Cache?

- Graph API calls add latency (~100-300ms)
- License status rarely changes
- Reduces Graph API quota usage

### Cache Configuration

| Setting  | Value               | Rationale                         |
| -------- | ------------------- | --------------------------------- |
| Duration | 24 hours            | Balance freshness vs. performance |
| Storage  | localStorage        | Persists across sessions          |
| Refresh  | On expiry or manual | Background refresh on open        |

### Cache Invalidation

Cache is cleared when:

1. User explicitly requests refresh
2. Cache expires (24h)
3. User signs out

```typescript
// Force refresh
clearLicenseCache();
await checkLicense(); // Will query Graph API
```

---

## Offline Fallback

When Graph API is unavailable:

```typescript
async function checkLicense(): Promise<LicenseStatus> {
  // 1. Check cache first (always works offline)
  const cached = getCachedLicense();
  if (cached) {
    // Use cached value even if expired when offline
    if (!navigator.onLine || cached.expiresAt > Date.now()) {
      return cached;
    }
  }

  // 2. If online, try Graph API
  if (navigator.onLine) {
    try {
      // ... Graph API call
    } catch {
      // Fall through to default
    }
  }

  // 3. Default to free tier (conservative)
  return {
    tier: 'free',
    licensed: false,
    checkedAt: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION_MS,
  };
}
```

---

## Security Considerations

### Token Security

- Access tokens stored in memory only
- Refresh tokens in localStorage (MSAL default)
- No tokens sent to VariScout servers

### Spoofing Prevention

Could a user spoof the license check?

**Risk**: Low. Users could modify localStorage to set `tier: 'full'`.

**Mitigation**:

- Server-side validation not needed (no backend)
- Value proposition: If user has Azure App, they're paying
- Business impact: Minimal revenue loss from edge cases

**Philosophy**: Trust the licensing model, focus on product value.

### Data Access

The Add-in only reads app registrations, never:

- User data
- Organization data
- Other applications' data

---

## Testing

### Unit Tests

```typescript
// apps/excel-addin/src/lib/__tests__/licenseDetection.test.ts

describe('License Detection', () => {
  it('returns full tier when Azure App exists', async () => {
    mockGraphClient.api.mockResolvedValue({
      value: [{ id: 'app-id', displayName: 'VariScout' }],
    });

    const status = await checkLicense();
    expect(status.tier).toBe('full');
    expect(status.licensed).toBe(true);
  });

  it('returns free tier when Azure App not found', async () => {
    mockGraphClient.api.mockResolvedValue({ value: [] });

    const status = await checkLicense();
    expect(status.tier).toBe('free');
    expect(status.licensed).toBe(false);
  });

  it('falls back to free tier on error', async () => {
    mockGraphClient.api.mockRejectedValue(new Error('Network error'));

    const status = await checkLicense();
    expect(status.tier).toBe('free');
  });

  it('uses cache when not expired', async () => {
    localStorage.setItem(
      'variscout_license_status',
      JSON.stringify({
        tier: 'full',
        licensed: true,
        checkedAt: Date.now(),
        expiresAt: Date.now() + 1000000,
      })
    );

    const status = await checkLicense();
    expect(mockGraphClient.api).not.toHaveBeenCalled();
    expect(status.tier).toBe('full');
  });
});
```

### Manual Testing

1. **Free tier**: Test with account that has no Azure App
2. **Full tier**: Test with account that has Azure App deployed
3. **Offline**: Disable network, verify cached tier is used
4. **Cache expiry**: Set short expiry, verify refresh

---

## See Also

- [AppSource Guide](appsource.md)
- [Excel Strategy](strategy.md)
- [Azure App](../azure/index.md)
- [Microsoft Graph API Docs](https://docs.microsoft.com/graph/)
