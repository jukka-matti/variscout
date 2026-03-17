/**
 * Tier configuration for VariScout Azure app
 *
 * Azure Managed Application — single enterprise tier, all features.
 *
 * Tier is determined by:
 * 1. Dev mode localStorage override (for testing)
 * 2. VITE_LICENSE_TIER environment variable
 * 3. Default: 'enterprise' (Azure deployments always have subscription)
 */

import {
  configureTier,
  getTier as getCoreTier,
  getSignatureText as coreGetSignatureText,
  isPaidTier as coreIsPaidTier,
  getMaxChannels as coreGetMaxChannels,
  validateChannelCount as coreValidateChannelCount,
  getTierDescription as coreGetTierDescription,
  getUpgradeUrl as coreGetUpgradeUrl,
  configurePlan,
  getPlan as getCorePlan,
  hasTeamFeatures as coreHasTeamFeatures,
  isTeamAIPlan as coreIsTeamAIPlan,
  isTeamPlan as coreIsTeamPlan,
  type LicenseTier,
  type ChannelLimitResult,
  type MarketplacePlan,
} from '@variscout/core';

/**
 * LocalStorage key for dev mode tier override
 */
const DEV_TIER_OVERRIDE_KEY = 'variscout_dev_tier_override';

/**
 * LocalStorage key for dev mode plan override
 */
const DEV_PLAN_OVERRIDE_KEY = 'variscout_dev_plan_override';

/**
 * Check if running in development mode
 */
function isDevelopmentMode(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * Get tier override from localStorage (dev mode only)
 */
function getDevTierOverride(): LicenseTier | null {
  if (!isDevelopmentMode()) return null;

  try {
    const override = localStorage.getItem(DEV_TIER_OVERRIDE_KEY);
    if (override && ['free', 'enterprise'].includes(override)) {
      return override as LicenseTier;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

/**
 * Set tier override in localStorage (dev mode only)
 */
export function setDevTierOverride(tier: LicenseTier | null): void {
  if (!isDevelopmentMode()) {
    console.warn('Dev tier override only available in development mode');
    return;
  }

  try {
    if (tier === null) {
      localStorage.removeItem(DEV_TIER_OVERRIDE_KEY);
    } else {
      localStorage.setItem(DEV_TIER_OVERRIDE_KEY, tier);
    }
    // Re-initialize tier after override change
    initializeTier();
  } catch {
    console.warn('Failed to set dev tier override');
  }
}

/**
 * Get current dev tier override (dev mode only)
 */
export function getDevTierOverrideValue(): LicenseTier | null {
  return getDevTierOverride();
}

/**
 * Get plan override from localStorage (dev mode only)
 */
function getDevPlanOverride(): MarketplacePlan | null {
  if (!isDevelopmentMode()) return null;

  try {
    const override = localStorage.getItem(DEV_PLAN_OVERRIDE_KEY);
    if (override && ['standard', 'team', 'team-ai'].includes(override)) {
      return override as MarketplacePlan;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

/**
 * Set plan override in localStorage (dev mode only)
 */
export function setDevPlanOverride(plan: MarketplacePlan | null): void {
  if (!isDevelopmentMode()) {
    console.warn('Dev plan override only available in development mode');
    return;
  }

  try {
    if (plan === null) {
      localStorage.removeItem(DEV_PLAN_OVERRIDE_KEY);
    } else {
      localStorage.setItem(DEV_PLAN_OVERRIDE_KEY, plan);
    }
    // Re-initialize after override change
    initializeTier();
  } catch {
    console.warn('Failed to set dev plan override');
  }
}

/**
 * Get current dev plan override (dev mode only)
 */
export function getDevPlanOverrideValue(): MarketplacePlan | null {
  return getDevPlanOverride();
}

/**
 * Determine the marketplace plan for this Azure deployment
 */
function determinePlan(): MarketplacePlan {
  // 1. Check dev mode override first
  const devOverride = getDevPlanOverride();
  if (devOverride) {
    console.info(`[VariScout] Using dev plan override: ${devOverride}`);
    return devOverride;
  }

  // 2. Check environment variable
  const envPlan = import.meta.env.VITE_VARISCOUT_PLAN as string | undefined;
  if (envPlan && ['standard', 'team', 'team-ai'].includes(envPlan)) {
    return envPlan as MarketplacePlan;
  }

  // 3. Default to 'standard'
  return 'standard';
}

/**
 * Determine the license tier for this Azure deployment
 */
function determineTier(): LicenseTier {
  // 1. Check dev mode override first
  const devOverride = getDevTierOverride();
  if (devOverride) {
    console.info(`[VariScout] Using dev tier override: ${devOverride}`);
    return devOverride;
  }

  // 2. Check environment variable
  const envTier = import.meta.env.VITE_LICENSE_TIER as string | undefined;
  if (envTier && ['free', 'enterprise'].includes(envTier)) {
    return envTier as LicenseTier;
  }

  // 3. Default to 'enterprise' for Azure deployments
  // Azure Managed Application always has a subscription
  return 'enterprise';
}

/**
 * Initialize the tier system
 * Call this early in app initialization
 */
export function initializeTier(): void {
  const tier = determineTier();
  configureTier(tier);

  const plan = determinePlan();
  configurePlan(plan);
}

// Initialize on module load
initializeTier();

// Re-export everything from core for convenience
export type { LicenseTier, ChannelLimitResult, MarketplacePlan };
export const getTier = getCoreTier;

export const getSignatureText = coreGetSignatureText;
export const isPaidTier = coreIsPaidTier;
export const getMaxChannels = coreGetMaxChannels;
export const validateChannelCount = coreValidateChannelCount;
export const getTierDescription = coreGetTierDescription;
export const getUpgradeUrl = coreGetUpgradeUrl;
export const getPlan = getCorePlan;
export const hasTeamFeatures = coreHasTeamFeatures;
export const isTeamAIPlan = coreIsTeamAIPlan;
export const isTeamPlan = coreIsTeamPlan;
export { isDevelopmentMode };
