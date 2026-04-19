/**
 * useWallBreakpoint — Local media-query hook for the Investigation Wall.
 *
 * Detects the 768px mobile breakpoint so WallCanvas can swap its 2000×1400
 * SVG for a vertical card list at narrow viewports. Lives here (rather than
 * importing from `@variscout/ui`) because `@variscout/charts` must not
 * depend on `@variscout/ui` — the monorepo dependency flow is
 * core → hooks → ui → apps, and charts stays at the core/hooks tier.
 *
 * Shares the `BREAKPOINTS.mobile = 768` value with `useIsMobile` in
 * `@variscout/ui`, so PWA and Azure apps switch at the same width.
 */
import { useEffect, useState } from 'react';

/**
 * Mobile breakpoint in px. Matches `BREAKPOINTS.mobile` in
 * `@variscout/ui/hooks/useMediaQuery.ts`. Kept in sync manually — no
 * cross-package import is permitted from this file.
 */
export const WALL_MOBILE_BREAKPOINT = 768;

/**
 * Returns `true` when the viewport is at or below `WALL_MOBILE_BREAKPOINT`
 * (default 768px). SSR-safe: returns `false` when `window` is undefined.
 *
 * Subscribes to `matchMedia` `change` events so callers re-render when the
 * user rotates the device or resizes the window across the breakpoint.
 */
export function useWallIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${WALL_MOBILE_BREAKPOINT}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${WALL_MOBILE_BREAKPOINT}px)`);
    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
