/**
 * Branding configuration for VariScout PWA
 *
 * Thin wrapper that re-exports branding helpers from @variscout/core (tier-based).
 * Branding is determined by the configured tier (free = branding, enterprise = no branding).
 */

import {
  shouldShowBranding as coreShouldShowBranding,
  getBrandingText as coreGetBrandingText,
  getSignatureText as coreGetSignatureText,
} from '@variscout/core';

// Re-export for chart components that import from this file
export const shouldShowBranding = coreShouldShowBranding;
export const getBrandingText = coreGetBrandingText;
export const getSignatureText = coreGetSignatureText;
