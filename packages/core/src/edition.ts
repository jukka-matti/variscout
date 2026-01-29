/**
 * Edition configuration for VariScout
 *
 * Editions:
 * - community: Free with branding (default)
 * - licensed: Paid version, no branding (license key required)
 */

import { hasValidLicense } from './license';

export type Edition = 'community' | 'licensed';

/**
 * Brand accent colors
 */
export const EDITION_COLORS = {
  variscout: '#3b82f6', // blue-500 (VariScout blue)
} as const;

// Edition can be set by the app (e.g., from environment variables)
let configuredEdition: Edition | null = null;

/**
 * Configure the edition at app startup
 * Call this from your app's initialization code
 */
export function configureEdition(edition: Edition | null): void {
  configuredEdition = edition;
}

/**
 * Get the current edition based on config and license status
 */
export function getEdition(): Edition {
  // Check configured edition first (set by app from env vars)
  if (configuredEdition === 'licensed') {
    return 'licensed';
  }

  // For community builds, check if user has activated a license
  if (hasValidLicense()) {
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
