import { useIsInstalled } from './useIsInstalled';

/**
 * Hook to check license status
 *
 * PWA is demo-only, so licensed features are never available.
 * This hook is kept for backward compatibility with existing code.
 */
export function useLicenseStatus() {
  const isPWA = useIsInstalled();

  return {
    /** Whether the app is installed as a PWA */
    isPWA,
    /** Whether a valid license key is stored (always false for PWA) */
    isLicensed: false,
    /** Whether licensed features are available (always false for PWA) */
    canUseLicensedFeatures: false,
  };
}
