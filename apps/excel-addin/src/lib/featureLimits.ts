/**
 * Feature Limits for Excel Add-in
 *
 * Excel-specific feature gating based on license tier.
 * Maps to the same tier system used by the Azure app.
 *
 * Channel Limits:
 * - Free tier: 5 channels (demo only)
 * - Paid tiers: 1,500 channels (browser architecture limit)
 */

import type { LicenseTier, ChannelLimitResult } from '@variscout/core';
import { getCurrentTier, hasPaidSubscription } from './licenseDetection';

/**
 * Channel limits by tier (mirrors @variscout/core TIER_LIMITS)
 */
export const EXCEL_CHANNEL_LIMITS: Record<LicenseTier, number> = {
  free: 5,
  enterprise: 1500,
} as const;

/**
 * Performance warning threshold
 * Shows advisory when approaching browser limits
 */
export const CHANNEL_WARNING_THRESHOLD = 700;

/**
 * Get the maximum channels allowed for the current tier
 */
export function getMaxChannels(): number {
  const tier = getCurrentTier();
  return EXCEL_CHANNEL_LIMITS[tier];
}

/**
 * Check if a channel count exceeds the current tier limit
 *
 * @param count - Number of channels to check
 * @returns true if count exceeds the limit
 */
export function isChannelLimitExceeded(count: number): boolean {
  return count > getMaxChannels();
}

/**
 * Check if performance warning should be shown
 *
 * @param count - Number of channels
 * @returns true if count >= 700 and not exceeded
 */
export function shouldShowPerformanceWarning(count: number): boolean {
  return count >= CHANNEL_WARNING_THRESHOLD && !isChannelLimitExceeded(count);
}

/**
 * Validate channel count and return comprehensive result
 *
 * @param count - Number of channels to validate
 * @returns Validation result with exceeded, current, max, showWarning
 */
export function validateChannelCount(count: number): ChannelLimitResult {
  const max = getMaxChannels();

  return {
    exceeded: count > max,
    current: count,
    max,
    showWarning: shouldShowPerformanceWarning(count),
  };
}

/**
 * Get a user-friendly message for channel limit status
 *
 * @param count - Number of channels
 * @returns Message string or null if no message needed
 */
export function getChannelLimitMessage(count: number): string | null {
  const validation = validateChannelCount(count);

  if (validation.exceeded) {
    const tier = getCurrentTier();
    if (tier === 'free') {
      return `Free tier is limited to ${validation.max} channels. Upgrade your Azure subscription to analyze more.`;
    }
    return `Maximum ${validation.max} channels allowed. Please reduce your selection.`;
  }

  if (validation.showWarning) {
    return `Analyzing ${count} channels may affect performance. Consider analyzing fewer channels for a smoother experience.`;
  }

  return null;
}

/**
 * Feature availability checks
 */
export const ExcelFeatures = {
  /**
   * Check if performance mode is available
   * Available to all tiers, but channel limit applies
   */
  canUsePerformanceMode: (): boolean => {
    return true; // All tiers can use performance mode
  },

  /**
   * Check if Gage R&R analysis is available
   * Available to all tiers
   */
  canUseGageRR: (): boolean => {
    return true;
  },

  /**
   * Check if branding can be removed
   * Only paid tiers can remove branding
   */
  canRemoveBranding: (): boolean => {
    return hasPaidSubscription();
  },

  /**
   * Check if custom theming is available
   * Only paid tiers have theming
   */
  canUseTheming: (): boolean => {
    return hasPaidSubscription();
  },
} as const;
