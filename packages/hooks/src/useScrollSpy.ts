/**
 * useScrollSpy — Tracks which report section is currently in the viewport.
 *
 * Uses IntersectionObserver to update activeId as sections scroll into view.
 * Returns a ref map keyed by sectionId for consumers to attach to DOM elements.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseScrollSpyOptions {
  sectionIds: string[];
  /**
   * IntersectionObserver rootMargin.
   * Default '-20% 0px -70% 0px' activates when section enters top 30% of viewport.
   */
  rootMargin?: string;
}

export interface UseScrollSpyReturn {
  activeId: string | null;
  refs: Record<string, React.RefObject<HTMLDivElement | null>>;
}

// ============================================================================
// Hook
// ============================================================================

export function useScrollSpy({
  sectionIds,
  rootMargin = '-20% 0px -70% 0px',
}: UseScrollSpyOptions): UseScrollSpyReturn {
  const [activeId, setActiveId] = useState<string | null>(
    sectionIds.length > 0 ? sectionIds[0] : null
  );

  // Create a stable ref object keyed by id.
  // Using useRef to hold the map so refs themselves don't change identity.
  const refsMapRef = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

  // Ensure all current sectionIds have a ref entry.
  for (const id of sectionIds) {
    if (!refsMapRef.current[id]) {
      refsMapRef.current[id] = { current: null };
    }
  }

  // Stable refs snapshot for the effect — recalculated only when sectionIds change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refs = useMemo(() => ({ ...refsMapRef.current }), [sectionIds]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        // Find the first intersecting entry (in document order) and activate it.
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const matchedId = sectionIds.find(
              id => refsMapRef.current[id]?.current === entry.target
            );
            if (matchedId !== undefined) {
              setActiveId(matchedId);
            }
            break;
          }
        }
      },
      { rootMargin }
    );

    // Observe all section elements that have been mounted.
    for (const id of sectionIds) {
      const el = refsMapRef.current[id]?.current;
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, rootMargin]);

  return { activeId, refs };
}
