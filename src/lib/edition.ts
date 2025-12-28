/**
 * Edition configuration for VariScout Lite
 *
 * Editions:
 * - community: Free with branding (default)
 * - itc: ITC-branded version (separate build)
 * - pro: Paid version, no branding (license key required)
 */

import { hasValidLicense } from './license';

export type Edition = 'community' | 'itc' | 'pro';

/**
 * Get the current edition based on build config and license status
 */
export function getEdition(): Edition {
  // Check build-time environment variable first
  const buildEdition = import.meta.env.VITE_EDITION as Edition | undefined;

  if (buildEdition === 'itc') {
    return 'itc';
  }

  if (buildEdition === 'pro') {
    return 'pro';
  }

  // For community builds, check if user has activated a license
  if (hasValidLicense()) {
    return 'pro';
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
    case 'itc':
      return 'International Trade Centre';
    case 'pro':
      return ''; // No branding for pro
    case 'community':
    default:
      return 'VariScout Lite';
  }
}

/**
 * Check if this is the ITC edition
 */
export function isITCEdition(): boolean {
  return getEdition() === 'itc';
}

/**
 * Get the signature text for the current edition
 */
export function getSignatureText(): string {
  const edition = getEdition();

  switch (edition) {
    case 'itc':
      return 'ITC';
    case 'pro':
      return ''; // Hidden for pro
    case 'community':
    default:
      return 'VariScout';
  }
}
