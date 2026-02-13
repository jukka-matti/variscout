/**
 * Tier configuration for VariScout distribution
 *
 * Two-tier system:
 * - free: Demo tier (PWA, 5 channels, encourages upgrade)
 * - enterprise: Azure Managed Application (€150/month, all features)
 *
 * Channel limits:
 * - Free: 5 channels (demo only)
 * - Enterprise: 1,500 channels (browser architecture limit)
 *
 * Why 1,500? Conservative limit to ensure smooth browser performance.
 * Soft warning appears at 700 channels.
 */

import type { LicenseTier, TierLimits, ChannelLimitResult } from './types';

// Re-export types for convenience
export type { LicenseTier, TierLimits, ChannelLimitResult };

/**
 * Channel limits by tier
 * - Free tier: 5 channels (demo only)
 * - Enterprise tier: 1,500 channels (browser architecture limit)
 */
export const TIER_LIMITS: Record<LicenseTier, TierLimits> = {
  free: { maxChannels: 5 },
  enterprise: { maxChannels: 1500 },
} as const;

/**
 * Soft warning threshold for performance advisory
 * Shows a warning when approaching limits that may affect browser performance
 */
export const CHANNEL_WARNING_THRESHOLD = 700;

/**
 * Default tier when none is configured
 */
export const DEFAULT_TIER: LicenseTier = 'free';

// Current configured tier (set by the app at startup)
let configuredTier: LicenseTier | null = null;

/**
 * Configure the license tier at app startup
 * Call this from your app's initialization code
 *
 * @param tier - The license tier to set, or null to reset to default
 *
 * @example
 * // In app initialization
 * configureTier('enterprise');
 */
export function configureTier(tier: LicenseTier | null): void {
  configuredTier = tier;
}

/**
 * Get the current configured license tier
 *
 * @returns The current tier, or 'free' if none configured
 */
export function getTier(): LicenseTier {
  return configuredTier ?? DEFAULT_TIER;
}

/**
 * Check if a tier is a paid tier
 *
 * @param tier - The tier to check (uses current tier if not specified)
 * @returns true if the tier is paid (enterprise)
 */
export function isPaidTier(tier?: LicenseTier): boolean {
  const t = tier ?? getTier();
  return t !== 'free';
}

/**
 * Get the maximum number of channels allowed for a tier
 *
 * @param tier - The tier to check (uses current tier if not specified)
 * @returns Maximum channels allowed
 */
export function getMaxChannels(tier?: LicenseTier): number {
  const t = tier ?? getTier();
  return TIER_LIMITS[t].maxChannels;
}

/**
 * Get the tier limits for a specific tier
 *
 * @param tier - The tier to check (uses current tier if not specified)
 * @returns TierLimits object
 */
export function getTierLimits(tier?: LicenseTier): TierLimits {
  const t = tier ?? getTier();
  return TIER_LIMITS[t];
}

/**
 * Check if the channel count exceeds the tier limit
 *
 * @param count - Number of channels to check
 * @param tier - The tier to check against (uses current tier if not specified)
 * @returns true if the count exceeds the limit
 */
export function isChannelLimitExceeded(count: number, tier?: LicenseTier): boolean {
  const maxChannels = getMaxChannels(tier);
  return count > maxChannels;
}

/**
 * Check if a performance warning should be shown
 * Shows warning when approaching browser performance limits
 *
 * @param count - Number of channels to check
 * @returns true if warning should be shown
 */
export function shouldShowChannelWarning(count: number): boolean {
  return count >= CHANNEL_WARNING_THRESHOLD;
}

/**
 * Validate channel count against tier limits
 * Returns comprehensive result for UI display
 *
 * @param count - Number of channels to check
 * @param tier - The tier to check against (uses current tier if not specified)
 * @returns ChannelLimitResult with exceeded, current, max, and showWarning
 */
export function validateChannelCount(count: number, tier?: LicenseTier): ChannelLimitResult {
  const t = tier ?? getTier();
  const maxChannels = getMaxChannels(t);

  return {
    exceeded: count > maxChannels,
    current: count,
    max: maxChannels,
    showWarning: shouldShowChannelWarning(count) && !isChannelLimitExceeded(count, t),
  };
}

/**
 * Get a human-readable description of the tier
 *
 * @param tier - The tier to describe (uses current tier if not specified)
 * @returns Human-readable tier description
 */
export function getTierDescription(tier?: LicenseTier): string {
  const t = tier ?? getTier();
  switch (t) {
    case 'free':
      return 'Free (Demo)';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Unknown';
  }
}

/**
 * Get the upgrade URL for the Azure Marketplace
 *
 * @returns URL to the Azure Marketplace listing
 */
export function getUpgradeUrl(): string {
  // TODO: Replace with actual Azure Marketplace URL when available
  return 'https://azuremarketplace.microsoft.com/en-us/marketplace/apps/variscout';
}
