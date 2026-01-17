import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions {
  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes */
  onSaveComplete?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  /** Whether auto-save is currently in progress */
  isSaving: boolean;
  /** Last auto-save timestamp */
  lastSaved: Date | null;
  /** Manually trigger a save */
  triggerSave: () => void;
}

/**
 * Hook for auto-saving project state with debouncing.
 *
 * Usage:
 * ```tsx
 * const { isSaving, lastSaved, triggerSave } = useAutoSave({
 *   hasUnsavedChanges,
 *   currentProjectName,
 *   saveProject,
 * });
 * ```
 */
export function useAutoSave(
  hasUnsavedChanges: boolean,
  currentProjectName: string | null,
  saveProject: (name: string) => Promise<unknown>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const { delay = 2000, enabled = true, onSaveStart, onSaveComplete, onSaveError } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef(false);

  // Perform the save operation
  const performSave = useCallback(async () => {
    if (!currentProjectName || saveInProgressRef.current) return;

    saveInProgressRef.current = true;
    setIsSaving(true);
    onSaveStart?.();

    try {
      await saveProject(currentProjectName);
      setLastSaved(new Date());
      onSaveComplete?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      onSaveError?.(error instanceof Error ? error : new Error('Auto-save failed'));
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  }, [currentProjectName, saveProject, onSaveStart, onSaveComplete, onSaveError]);

  // Debounced auto-save effect
  useEffect(() => {
    // Only auto-save if:
    // 1. Auto-save is enabled
    // 2. There are unsaved changes
    // 3. There's a project name to save under
    // 4. Not currently saving
    if (!enabled || !hasUnsavedChanges || !currentProjectName || saveInProgressRef.current) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, hasUnsavedChanges, currentProjectName, delay, performSave]);

  // Manual trigger function
  const triggerSave = useCallback(() => {
    // Clear any pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave();
  }, [performSave]);

  return {
    isSaving,
    lastSaved,
    triggerSave,
  };
}

export default useAutoSave;
