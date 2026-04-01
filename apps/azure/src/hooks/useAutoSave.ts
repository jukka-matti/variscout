import { useEffect, useRef } from 'react';

/**
 * Auto-save hook: triggers save callback when dependencies change.
 * Debounces by `debounceMs` (default 2000ms). Skips the initial render
 * so loading a project does not immediately trigger a save.
 *
 * @param onSave - The save callback (e.g. handleSave from Editor)
 * @param deps - Dependency array whose changes trigger auto-save
 * @param enabled - Gate: only auto-save when true (e.g. hasData && projectId)
 * @param debounceMs - Debounce delay in milliseconds (default 2000)
 */
export function useAutoSave(
  onSave: () => void,
  deps: unknown[],
  enabled: boolean = true,
  debounceMs: number = 2000
): void {
  const isInitializedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    // Skip the first render cycle (project load)
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // Clear previous debounce timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}
