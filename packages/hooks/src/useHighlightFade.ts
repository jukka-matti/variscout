import { useState, useEffect } from 'react';

export interface UseHighlightFadeReturn {
  highlightedRow: number | null;
  setHighlightedRow: React.Dispatch<React.SetStateAction<number | null>>;
}

/**
 * Manages a highlight state that automatically clears after a delay.
 *
 * When `externalIndex` changes to a non-null value, sets `highlightedRow`
 * and clears it after `delay` ms.
 *
 * @param externalIndex - Index to highlight (from external trigger, e.g. chart click)
 * @param delay - Duration in ms before highlight fades (default 3000)
 */
export function useHighlightFade(
  externalIndex: number | null | undefined,
  delay = 3000
): UseHighlightFadeReturn {
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  useEffect(() => {
    if (externalIndex !== null && externalIndex !== undefined) {
      setHighlightedRow(externalIndex);
      const timeout = setTimeout(() => setHighlightedRow(null), delay);
      return () => clearTimeout(timeout);
    }
  }, [externalIndex, delay]);

  return { highlightedRow, setHighlightedRow };
}
