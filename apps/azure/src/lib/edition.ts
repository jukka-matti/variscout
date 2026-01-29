/**
 * Edition configuration for VariScout Azure app
 *
 * Azure deployments are always licensed (team subscription)
 * so no branding is shown on charts.
 */

import {
  configureEdition,
  getEdition as getCoreEdition,
  shouldShowBranding as coreShouldShowBranding,
  getBrandingText as coreGetBrandingText,
  getSignatureText as coreGetSignatureText,
  type Edition,
} from '@variscout/core';

// Azure deployments are always licensed (team subscription)
configureEdition('licensed');

// Re-export everything from core for convenience
export type { Edition };
export const getEdition = getCoreEdition;
export const shouldShowBranding = coreShouldShowBranding;
export const getBrandingText = coreGetBrandingText;
export const getSignatureText = coreGetSignatureText;
