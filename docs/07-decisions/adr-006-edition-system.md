# ADR-006: Edition System

**Status**: Superseded by [ADR-007](adr-007-azure-marketplace-distribution.md)

**Date**: 2024-03-01 (Updated: 2026-02-05)

---

## Historical Context

> **Note**: This ADR documents the original Community/Licensed edition system using Paddle for payment processing and license keys. This approach has been superseded by Azure Marketplace distribution. See [ADR-007](adr-007-azure-marketplace-distribution.md) for the current strategy.

The original model supported:

- **Community**: Free, full features, VariScout branding
- **Licensed**: Paid (€99), no branding, theme customization

---

## Current Edition Model

### Tier Structure

| Tier         | Product   | Price       | Users     | Detection                  |
| ------------ | --------- | ----------- | --------- | -------------------------- |
| Free         | Excel     | €0          | All       | Default (no Azure)         |
| Individual   | Azure App | €99/year    | 1         | ARM template param         |
| Team         | Azure App | €499/year   | Up to 10  | ARM template param         |
| Enterprise   | Azure App | €1,790/year | Unlimited | ARM template param         |
| Full (Excel) | Excel     | €0          | All       | Graph API (Azure detected) |

### Detection Mechanism

**Azure App** (Primary Product):

License tier is set at deployment time via ARM template parameters:

```typescript
// packages/core/src/edition.ts
export type Tier = 'free' | 'individual' | 'team' | 'enterprise';

export function getTier(): Tier {
  // Azure App: tier set via environment variable at deployment
  if (import.meta.env.VITE_LICENSE_TIER) {
    return import.meta.env.VITE_LICENSE_TIER as Tier;
  }

  // PWA: demo mode only
  return 'free';
}

export function getMaxUsers(tier: Tier): number {
  switch (tier) {
    case 'individual':
      return 1;
    case 'team':
      return 10;
    case 'enterprise':
      return Infinity;
    default:
      return 1;
  }
}
```

**Excel Add-in** (Secondary Product):

Tier detected via Microsoft Graph API:

```typescript
// apps/excel-addin/src/lib/licenseDetection.ts
export async function checkLicense(): Promise<{ tier: 'free' | 'full' }> {
  const graphClient = await getGraphClient();

  // Check for VariScout Azure App registration in tenant
  const apps = await graphClient.api('/applications').filter("displayName eq 'VariScout'").get();

  return {
    tier: apps.value.length > 0 ? 'full' : 'free',
  };
}
```

---

## Feature Gating

### By Tier

```typescript
export function isFeatureEnabled(feature: Feature, tier: Tier): boolean {
  const featureMatrix: Record<Feature, Tier[]> = {
    'basic-charts': ['free', 'individual', 'team', 'enterprise'],
    'performance-mode': ['free', 'individual', 'team', 'enterprise'],
    'unlimited-channels': ['individual', 'team', 'enterprise'],
    'team-sharing': ['team', 'enterprise'],
    'priority-support': ['enterprise'],
  };

  return featureMatrix[feature].includes(tier);
}
```

### Excel-Specific Limits

```typescript
export const EXCEL_FEATURE_LIMITS = {
  free: {
    maxChannels: 50,
    maxDrillDownDepth: 2,
  },
  full: {
    maxChannels: Infinity,
    maxDrillDownDepth: Infinity,
  },
};
```

---

## Consequences

### Benefits

- **No license keys**: Deployment = licensed (simpler UX)
- **No backend**: Graph API replaces license validation server
- **Microsoft billing**: Trusted, enterprise-ready
- **Clear upgrade path**: Free Excel → Azure App tiers

### Trade-offs

- **Microsoft platform dependency**: Requires Azure deployment
- **Less portable**: License tied to tenant, not user
- **Graph API permission**: Requires Application.Read.All consent

---

## Migration from Old System

Existing Paddle license keys are honored until expiry:

```typescript
// Legacy support (to be removed after migration period)
export function checkLegacyLicense(key: string): boolean {
  // Validate existing VS-XXXX-XXXX-XXXX format keys
  // Returns true if valid and not expired
}
```

---

## Build Commands

The original edition-specific builds are deprecated:

```bash
# DEPRECATED - These commands will be removed
pnpm build:pwa:community  # Community edition
pnpm build:pwa:licensed   # Licensed edition

# CURRENT
pnpm build                # Standard build for all apps
```

Azure App tier is determined at deployment time, not build time.

---

## See Also

- [ADR-007: Azure Marketplace Distribution](adr-007-azure-marketplace-distribution.md) (current strategy)
- [Products Overview](../08-products/index.md)
- [Azure Pricing Tiers](../08-products/azure/pricing-tiers.md)
- [Excel License Detection](../08-products/excel/license-detection.md)
