/**
 * Edition configuration for VariScout PWA
 *
 * Thin wrapper that re-exports branding helpers from @variscout/core (tier-based).
 * The VITE_EDITION env var is no longer used — branding is determined by the
 * configured tier (free = branding, enterprise = no branding).
 */

import {
  shouldShowBranding as coreShouldShowBranding,
  getBrandingText as coreGetBrandingText,
  getSignatureText as coreGetSignatureText,
} from '@variscout/core';

import type { Edition } from '@variscout/core';

// Re-export for chart components that import from this file
export type { Edition };
export const shouldShowBranding = coreShouldShowBranding;
export const getBrandingText = coreGetBrandingText;
export const getSignatureText = coreGetSignatureText;
