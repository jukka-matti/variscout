import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  /** Current focused item (null when not in focus mode) */
  focusedItem: string | null;
  /** Callback when user presses right arrow */
  onNext?: () => void;
  /** Callback when user presses left arrow */
  onPrev?: () => void;
  /** Callback when user presses escape */
  onEscape?: () => void;
  /** Enable/disable the keyboard navigation (default: true when focusedItem is set) */
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation in focus/presentation modes
 *
 * Handles:
 * - ArrowRight: Navigate to next item
 * - ArrowLeft: Navigate to previous item
 * - Escape: Exit focus mode
 *
 * @param options - Navigation options and callbacks
 *
 * @example
 * ```tsx
 * const [focusedChart, setFocusedChart] = useState<string | null>(null);
 *
 * useKeyboardNavigation({
 *   focusedItem: focusedChart,
 *   onNext: () => setFocusedChart(prev => getNextChart(prev)),
 *   onPrev: () => setFocusedChart(prev => getPrevChart(prev)),
 *   onEscape: () => setFocusedChart(null),
 * });
 * ```
 */
export function useKeyboardNavigation({
  focusedItem,
  onNext,
  onPrev,
  onEscape,
  enabled,
}: KeyboardNavigationOptions): void {
  // Default enabled to true when focusedItem is set
  const isEnabled = enabled ?? focusedItem !== null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev?.();
          break;
        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;
      }
    },
    [isEnabled, onNext, onPrev, onEscape]
  );

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, handleKeyDown]);
}

export default useKeyboardNavigation;
