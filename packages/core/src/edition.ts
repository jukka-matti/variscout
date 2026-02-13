/**
 * Edition configuration for VariScout
 *
 * @deprecated This module is superseded by tier.ts.
 * All branding helpers now live in tier.ts. This file is kept only for
 * backward compatibility — new code should import from tier.ts directly.
 *
 * Editions (legacy, maps to tiers):
 * - community: Free tier with branding (maps from 'free')
 * - licensed: Enterprise tier, no branding (maps from 'enterprise')
 */

import { getTier, isPaidTier, BRANDING_COLORS, type LicenseTier } from './tier';

export type Edition = 'community' | 'licensed';

/**
 * Brand accent colors
 * @deprecated Use BRANDING_COLORS from tier.ts instead
 */
export const EDITION_COLORS = BRANDING_COLORS;

// Edition can be set by the app (e.g., from environment variables)
// This is kept for backward compatibility - prefer configureTier() for new code
let configuredEdition: Edition | null = null;

/**
 * Configure the edition at app startup
 * Call this from your app's initialization code
 *
 * @deprecated Use configureTier() from tier.ts instead
 */
export function configureEdition(edition: Edition | null): void {
  configuredEdition = edition;
}

/**
 * Map a license tier to the legacy edition system
 *
 * @deprecated Use isPaidTier() from tier.ts instead
 * @param tier - The license tier
 * @returns The corresponding edition
 */
export function tierToEdition(tier: LicenseTier): Edition {
  return tier === 'free' ? 'community' : 'licensed';
}

/**
 * Get the current edition based on tier or configuration
 *
 * @deprecated Use getTier() / isPaidTier() from tier.ts instead
 *
 * Priority:
 * 1. If tier is configured (not 'free'), use tier-based edition
 * 2. If legacy configuredEdition is set, use that
 * 3. Default to community
 */
export function getEdition(): Edition {
  // Check tier system first (new approach)
  const tier = getTier();
  if (isPaidTier(tier)) {
    return 'licensed';
  }

  // Check configured edition (legacy, set by app from env vars)
  if (configuredEdition === 'licensed') {
    return 'licensed';
  }

  return 'community';
}

/**
 * Check if branding should be shown on charts
 * @deprecated Use shouldShowBranding() from tier.ts instead
 */
export function shouldShowBranding(): boolean {
  return getEdition() === 'community';
}

/**
 * Get the branding text for the current edition
 * @deprecated Use getBrandingText() from tier.ts instead
 */
export function getBrandingText(): string {
  return getEdition() === 'licensed' ? '' : 'VariScout Lite';
}

/**
 * Get the signature text for the current edition
 * @deprecated Use getSignatureText() from tier.ts instead
 */
export function getSignatureText(): string {
  return getEdition() === 'licensed' ? '' : 'VariScout';
}

/**
 * Check if theming features are enabled (Licensed edition only)
 * @deprecated Use isPaidTier() from tier.ts instead
 */
export function isThemingEnabled(): boolean {
  return getEdition() === 'licensed';
}
