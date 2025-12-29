/**
 * Edition configuration for VariScout Lite PWA
 *
 * This is a thin wrapper around @variscout/core that configures
 * the edition from Vite environment variables.
 */

import {
  configureEdition,
  getEdition as getCoreEdition,
  shouldShowBranding as coreShouldShowBranding,
  getBrandingText as coreGetBrandingText,
  isITCEdition as coreIsITCEdition,
  getSignatureText as coreGetSignatureText,
  type Edition,
} from '@variscout/core';

// Configure edition from Vite environment variable on module load
const buildEdition = import.meta.env.VITE_EDITION as Edition | undefined;
if (buildEdition === 'itc' || buildEdition === 'licensed') {
  configureEdition(buildEdition);
}

// Re-export everything from core for convenience
export type { Edition };
export const getEdition = getCoreEdition;
export const shouldShowBranding = coreShouldShowBranding;
export const getBrandingText = coreGetBrandingText;
export const isITCEdition = coreIsITCEdition;
export const getSignatureText = coreGetSignatureText;
