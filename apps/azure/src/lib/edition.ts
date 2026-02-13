/**
 * Edition and Tier configuration for VariScout Azure app
 *
 * Azure Managed Application — single enterprise tier, all features.
 *
 * Tier is determined by:
 * 1. Dev mode localStorage override (for testing)
 * 2. VITE_LICENSE_TIER environment variable
 * 3. Default: 'enterprise' (Azure deployments always have subscription)
 */

import {
  configureEdition,
  configureTier,
  getEdition as getCoreEdition,
  getTier as getCoreTier,
  shouldShowBranding as coreShouldShowBranding,
  getBrandingText as coreGetBrandingText,
  getSignatureText as coreGetSignatureText,
  isPaidTier as coreIsPaidTier,
  getMaxChannels as coreGetMaxChannels,
  validateChannelCount as coreValidateChannelCount,
  getTierDescription as coreGetTierDescription,
  getUpgradeUrl as coreGetUpgradeUrl,
  type Edition,
  type LicenseTier,
  type ChannelLimitResult,
} from '@variscout/core';

/**
 * LocalStorage key for dev mode tier override
 */
const DEV_TIER_OVERRIDE_KEY = 'variscout_dev_tier_override';

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

  // Also set legacy edition for backward compatibility
  configureEdition(tier === 'free' ? 'community' : 'licensed');
}

// Initialize on module load
initializeTier();

// Re-export everything from core for convenience
export type { Edition, LicenseTier, ChannelLimitResult };
export const getEdition = getCoreEdition;
export const getTier = getCoreTier;
export const shouldShowBranding = coreShouldShowBranding;
export const getBrandingText = coreGetBrandingText;
export const getSignatureText = coreGetSignatureText;
export const isPaidTier = coreIsPaidTier;
export const getMaxChannels = coreGetMaxChannels;
export const validateChannelCount = coreValidateChannelCount;
export const getTierDescription = coreGetTierDescription;
export const getUpgradeUrl = coreGetUpgradeUrl;
export { isDevelopmentMode };
