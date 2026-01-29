import { hasValidLicense } from '@variscout/core';
import { useIsInstalled } from './useIsInstalled';

/**
 * Hook to check license status with PWA installation requirement
 *
 * Licensed features (theming, no branding) require BOTH:
 * 1. A valid license key stored in localStorage
 * 2. The PWA to be installed (running in standalone mode)
 *
 * This encourages users to install the app for the full experience.
 */
export function useLicenseStatus() {
  const isPWA = useIsInstalled();
  const isLicensed = hasValidLicense();

  // Licensed features only work when PWA is installed
  const canUseLicensedFeatures = isPWA && isLicensed;

  return {
    /** Whether the app is installed as a PWA */
    isPWA,
    /** Whether a valid license key is stored */
    isLicensed,
    /** Whether licensed features are available (requires both PWA + license) */
    canUseLicensedFeatures,
  };
}
