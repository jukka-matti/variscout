import { useState, useEffect } from 'react';

/**
 * Common breakpoints for responsive design
 */
export const BREAKPOINTS = {
  /** Mobile devices */
  mobile: 768,
  /** Desktop devices */
  desktop: 1024,
  /** Large desktop */
  large: 1280,
} as const;

/**
 * Hook for responsive media query matching
 *
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook for detecting mobile viewport
 * Uses max-width breakpoint check
 *
 * @param breakpoint - Width breakpoint in pixels (default: 768)
 * @returns Whether viewport is mobile-sized
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * // or with custom breakpoint
 * const isMobile = useIsMobile(640);
 * ```
 */
export function useIsMobile(breakpoint: number = BREAKPOINTS.mobile): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook for detecting desktop viewport
 * Uses min-width breakpoint check
 *
 * @param breakpoint - Width breakpoint in pixels (default: 1024)
 * @returns Whether viewport is desktop-sized
 */
export function useIsDesktop(breakpoint: number = BREAKPOINTS.desktop): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoint;
  });

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= breakpoint);
    checkDesktop();

    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [breakpoint]);

  return isDesktop;
}
