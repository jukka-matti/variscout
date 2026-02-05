# ADR-007: Azure Marketplace Distribution Strategy

**Status**: Accepted

**Date**: 2026-02-05

---

## Context

VariScout has evolved from a single PWA product to a multi-platform offering. The previous licensing model used:

- **Paddle** for payment processing (€99/year PWA license)
- **Custom license keys** for feature gating
- **Backend webhook** for key generation and validation

This approach had several limitations:

1. **Backend dependency** - Required server infrastructure for license validation
2. **Payment complexity** - Paddle's fees plus VAT handling complexity
3. **No enterprise support** - Single-user licensing only
4. **Limited distribution** - Manual installation via URL

Meanwhile, our Azure App has demonstrated strong product-market fit with Microsoft 365 enterprise customers who:

- Already have Azure subscriptions
- Prefer Microsoft-integrated purchasing
- Require multi-user licensing
- Need data to stay in their tenant

---

## Decision

**Adopt Azure Marketplace as the primary distribution and billing channel:**

```
┌─────────────────────────────────────────────────────────────┐
│  VariScout on Azure Marketplace                             │
│                                                             │
│  Individual Plan     €99/year    Single user               │
│  Team Plan           €499/year   Up to 10 users            │
│  Enterprise Plan     €1,790/year Unlimited tenant users    │
│                                                             │
│  Billing: Microsoft (3% fee)                               │
│  License Detection: Graph API (deployment = licensed)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Excel Add-in on AppSource (FREE)                          │
│                                                             │
│  • Free tier: Basic features for all users                 │
│  • Full tier: Auto-unlocks when tenant has Azure App       │
│  • Detection: Graph API checks for Azure App registration  │
└─────────────────────────────────────────────────────────────┘
```

### Product Hierarchy

| Product          | Role                   | Distribution      | Price                  |
| ---------------- | ---------------------- | ----------------- | ---------------------- |
| **Azure App**    | PRIMARY                | Azure Marketplace | €99/€499/€1,790        |
| **Excel Add-in** | SECONDARY (companion)  | AppSource (FREE)  | Unlocks with Azure App |
| **PWA**          | DEPRECATED (demo only) | Internal/website  | N/A                    |

### Pricing Rationale

| Tier       | Price/Year | Users     | Target Customer                 |
| ---------- | ---------- | --------- | ------------------------------- |
| Individual | €99        | 1         | Quality engineers, consultants  |
| Team       | €499       | Up to 10  | Small QA teams, departments     |
| Enterprise | €1,790     | Unlimited | Manufacturing companies, plants |

**Enterprise pricing logic**: €1,790 ≈ 18 users at Individual rate, breakeven at ~4 users at Team rate. Attractive for any team >3 users.

---

## Consequences

### Benefits

1. **No backend required**
   - License = Azure App Registration exists in tenant
   - Graph API checks for deployment status
   - Zero infrastructure to maintain

2. **Microsoft handles billing**
   - 3% transaction fee (lower than Paddle's ~5% + VAT complexity)
   - Automatic VAT handling in all Microsoft markets
   - Enterprise procurement integration (purchase orders, invoicing)

3. **Multi-user licensing**
   - Team and Enterprise tiers enable organization-wide deployment
   - Per-tenant licensing aligns with Azure deployment model

4. **Distribution advantage**
   - Azure Marketplace visibility to enterprise buyers
   - AppSource visibility for Excel Add-in
   - Trust signal from Microsoft certification

5. **Data sovereignty**
   - App deploys to customer's Azure tenant
   - Data never leaves their environment
   - Meets enterprise compliance requirements

### Trade-offs

1. **Microsoft platform dependency**
   - Tied to Azure/Microsoft 365 ecosystem
   - Subject to Microsoft certification requirements
   - Marketplace listing approval process

2. **PWA deprecation**
   - Existing PWA users need migration path
   - Community edition concept deprecated
   - PWA remains as reference implementation only

3. **License key removal**
   - No more portable license keys
   - License tied to Azure deployment
   - Simpler but less flexible

4. **New certification burden**
   - Azure Marketplace certification required
   - AppSource certification for Excel Add-in
   - Ongoing compliance maintenance

---

## License Detection Mechanism

### Azure App (Primary)

License tier detected from Azure deployment parameters:

```typescript
// Deployment writes tier to app configuration
const tier = import.meta.env.VITE_LICENSE_TIER; // 'individual' | 'team' | 'enterprise'
const maxUsers = getTierUserLimit(tier);
```

### Excel Add-in (Secondary)

Graph API checks if Azure App exists in tenant:

```typescript
async function checkAzureLicense(): Promise<LicenseStatus> {
  const graphClient = await getGraphClient();

  // Check for VariScout Azure App registration
  const apps = await graphClient.api('/applications').filter("displayName eq 'VariScout'").get();

  if (apps.value.length > 0) {
    return { licensed: true, tier: apps.value[0].tier };
  }

  return { licensed: false, tier: 'free' };
}
```

---

## Migration Path

### For Existing PWA License Holders

1. Existing €99 licenses honored until expiry
2. Offer free upgrade to Individual Azure tier
3. Provide migration documentation
4. PWA continues to function for demo/evaluation

### For New Customers

1. Direct to Azure Marketplace for purchase
2. Excel Add-in available free on AppSource
3. PWA available for evaluation only (no licensing)

---

## Implementation Phases

### Phase 1: Documentation (Current)

- Update all documentation to reflect new model
- Archive Paddle-related documentation
- Create Azure Marketplace and AppSource guides

### Phase 2: Azure Marketplace (Q2 2026)

- Partner Center account setup
- Azure Application offer creation
- Pricing tier configuration
- Certification and launch

### Phase 3: Excel AppSource (Q2 2026)

- Partner Center submission
- Free tier implementation
- Graph API license detection
- Certification and launch

### Phase 4: Code Cleanup (Post-Launch)

- Remove `packages/core/src/license.ts`
- Update `packages/core/src/edition.ts` for Graph API
- Create licensing services for Azure and Excel apps

---

## Related Decisions

- [ADR-006: Edition System](adr-006-edition-system.md) - Updated for new tier model
- [ADR-004: Offline-First](adr-004-offline-first.md) - Unchanged, still applies

---

## See Also

- [Azure Marketplace Guide](../08-products/azure/marketplace.md)
- [Pricing Tiers](../08-products/azure/pricing-tiers.md)
- [Excel AppSource Guide](../08-products/excel/appsource.md)
- [License Detection](../08-products/excel/license-detection.md)
