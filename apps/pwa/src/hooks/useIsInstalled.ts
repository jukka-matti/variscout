import { useState, useEffect } from 'react';

/**
 * Detect if the PWA is installed (running in standalone mode) vs web browser
 *
 * This hook checks:
 * 1. Standard display-mode: standalone (Chrome, Firefox, Edge)
 * 2. iOS Safari standalone property (navigator.standalone)
 *
 * Use this to show different UI for web visitors (demo mode) vs installed users.
 */
export function useIsInstalled(): boolean {
  const [isInstalled, setIsInstalled] = useState(() => {
    // Initial check on mount
    if (typeof window === 'undefined') return false;

    // Check standard display-mode media query
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check iOS Safari standalone property
    const isIOSStandalone = (window.navigator as any).standalone === true;

    return isStandalone || isIOSStandalone;
  });

  useEffect(() => {
    // Listen for display mode changes (in case user installs while on the page)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches || (window.navigator as any).standalone === true);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isInstalled;
}

/**
 * Hook to capture and trigger the PWA install prompt
 *
 * Returns:
 * - canInstall: boolean - whether install prompt is available
 * - triggerInstall: () => Promise<void> - function to show install prompt
 */
export function useInstallPrompt(): {
  canInstall: boolean;
  triggerInstall: () => Promise<boolean>;
} {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    // Show the install prompt
    installPrompt.prompt();

    // Wait for user response
    const { outcome } = await installPrompt.userChoice;

    // Clear the stored prompt (can only be used once)
    setInstallPrompt(null);

    return outcome === 'accepted';
  };

  return {
    canInstall: installPrompt !== null,
    triggerInstall,
  };
}
