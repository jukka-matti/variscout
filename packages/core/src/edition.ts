/**
 * Edition configuration for VariScout
 *
 * Editions (legacy, maps to tiers):
 * - community: Free tier with branding (maps from 'free')
 * - licensed: Enterprise tier, no branding (maps from 'enterprise')
 *
 * New code should use the tier system directly via tier.ts
 */

import { getTier, isPaidTier, type LicenseTier } from './tier';

export type Edition = 'community' | 'licensed';

/**
 * Brand accent colors
 */
export const EDITION_COLORS = {
  variscout: '#3b82f6', // blue-500 (VariScout blue)
} as const;

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
 * @param tier - The license tier
 * @returns The corresponding edition
 */
export function tierToEdition(tier: LicenseTier): Edition {
  return tier === 'free' ? 'community' : 'licensed';
}

/**
 * Get the current edition based on tier or configuration
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
 */
export function shouldShowBranding(): boolean {
  const edition = getEdition();
  return edition === 'community';
}

/**
 * Get the branding text for the current edition
 */
export function getBrandingText(): string {
  const edition = getEdition();

  switch (edition) {
    case 'licensed':
      return ''; // No branding for licensed
    case 'community':
    default:
      return 'VariScout Lite';
  }
}

/**
 * Get the signature text for the current edition
 */
export function getSignatureText(): string {
  const edition = getEdition();

  switch (edition) {
    case 'licensed':
      return ''; // Hidden for licensed
    case 'community':
    default:
      return 'VariScout';
  }
}

/**
 * Check if theming features are enabled (Licensed edition only)
 */
export function isThemingEnabled(): boolean {
  return getEdition() === 'licensed';
}
