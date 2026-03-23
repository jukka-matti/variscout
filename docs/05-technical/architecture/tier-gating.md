---
title: Tier & Plan Gating System
audience: [developer]
category: architecture
status: stable
related: [pricing, marketplace, feature-flags]
---

# Tier & Plan Gating System

## Overview

VariScout uses a two-dimensional gating system:

- **Tier** (`LicenseTier`): `free` | `enterprise` — controls feature availability
- **Plan** (`MarketplacePlan`): `standard` | `team` — controls collaboration features within enterprise tier

| Product        | Tier       | Plan     | Price        |
| -------------- | ---------- | -------- | ------------ |
| PWA            | free       | —        | Free forever |
| Azure Standard | enterprise | standard | €79/month    |
| Azure Team     | enterprise | team     | €199/month   |

## Core Tier Functions

All exported from `@variscout/core/tier` (`packages/core/src/tier.ts`):

| Function                  | Returns              | Purpose                                              |
| ------------------------- | -------------------- | ---------------------------------------------------- |
| `configureTier(tier)`     | void                 | Set tier at app startup                              |
| `getTier()`               | `LicenseTier`        | Current tier (default: `free`)                       |
| `isPaidTier()`            | boolean              | `true` if enterprise                                 |
| `configurePlan(plan)`     | void                 | Set marketplace plan at startup                      |
| `getPlan()`               | `MarketplacePlan`    | Current plan (default: `standard`)                   |
| `hasTeamFeatures()`       | boolean              | `true` if team plan                                  |
| `hasKnowledgeBase()`      | boolean              | `true` if team plan (KB is team-only)                |
| `isTeamPlan()`            | boolean              | `true` if team plan                                  |
| `isAIAvailable()`         | boolean              | Checks AI endpoint (not plan — AI in all paid plans) |
| `getMaxChannels(tier?)`   | number               | free: 5, enterprise: 1500                            |
| `validateChannelCount(n)` | `ChannelLimitResult` | Limit check + warning threshold                      |

## Initialization

### PWA

```typescript
// PWA is always free tier — no initialization needed
// Default tier is 'free'
```

### Azure App

```typescript
// apps/azure/src/lib/tierConfig.ts
// Initializes on module load — determines tier + plan from:
// 1. Dev mode localStorage override (testing only)
// 2. VITE_LICENSE_TIER / VITE_VARISCOUT_PLAN env vars
// 3. Defaults: enterprise tier, standard plan
initializeTier(); // called automatically on import
```

## Dev Mode Overrides

In development, tier and plan can be overridden via localStorage for testing:

```typescript
import { setDevTierOverride, setDevPlanOverride } from './lib/tierConfig';

setDevTierOverride('free'); // Test free tier UI
setDevPlanOverride('team'); // Test team features
setDevTierOverride(null); // Reset to default
```

The `DevTierSwitcher` component in Settings provides UI for this.

## Feature Gating Examples

```typescript
// Show upgrade prompt for free tier
if (!isPaidTier()) return <UpgradePrompt />;

// Team-only features
if (hasTeamFeatures()) {
  // Show Teams integration, OneDrive sync, channel sharing
}

// Knowledge Base (team plan only)
if (hasKnowledgeBase()) {
  // Show KB folder picker, document search
}

// AI available (checks endpoint, not plan — AI in all paid plans)
if (isAIAvailable()) {
  // Show CoScout, NarrativeBar, chart insights
}

// Channel limits
const result = validateChannelCount(channelCount);
if (result.exceeded) showLimitError();
if (result.showWarning) showPerformanceWarning();
```

## Key Files

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `packages/core/src/tier.ts`                              | Core tier/plan state + gate functions                |
| `packages/core/src/types.ts`                             | `LicenseTier`, `MarketplacePlan`, `TierLimits` types |
| `apps/azure/src/lib/tierConfig.ts`                       | Azure-specific initialization + dev overrides        |
| `apps/azure/src/components/settings/DevTierSwitcher.tsx` | Dev UI for tier/plan switching                       |

## Related

- [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-033: Pricing Simplification](../../07-decisions/adr-033-pricing-simplification.md)
- [Feature Parity Matrix](../../08-products/feature-parity.md)
