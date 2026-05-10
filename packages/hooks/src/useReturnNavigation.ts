import { useCallback } from 'react';

export const RETURN_NAVIGATION_STORAGE_KEY = 'variscout:nav:return';

export type ReturnNavigationPrimitive = string | number | boolean | null;
export type ReturnNavigationJson =
  | ReturnNavigationPrimitive
  | { [key: string]: ReturnNavigationJson }
  | ReturnNavigationJson[];
export type ReturnNavigationParams = Record<string, ReturnNavigationJson>;
export type ReturnNavigationUiState = Record<string, ReturnNavigationJson>;

export interface ReturnNavigationScrollPosition {
  x: number;
  y: number;
}

export interface ReturnNavigationTarget<
  TParams extends ReturnNavigationParams = ReturnNavigationParams,
  TUiState extends ReturnNavigationUiState = ReturnNavigationUiState,
> {
  sourceSurface: string;
  params: TParams;
  scrollPosition: ReturnNavigationScrollPosition;
  uiState: TUiState;
}

export interface CaptureReturnTargetArgs<
  TParams extends ReturnNavigationParams = ReturnNavigationParams,
  TUiState extends ReturnNavigationUiState = ReturnNavigationUiState,
> {
  sourceSurface: string;
  params?: TParams;
  scrollPosition?: ReturnNavigationScrollPosition;
  uiState?: TUiState;
}

export interface ReturnToSavedTargetOptions<
  TParams extends ReturnNavigationParams = ReturnNavigationParams,
  TUiState extends ReturnNavigationUiState = ReturnNavigationUiState,
> {
  navigate?: (sourceSurface: string, params: TParams) => void;
  restoreUiState?: (uiState: TUiState) => void;
  restoreScroll?: (scrollPosition: ReturnNavigationScrollPosition) => void;
}

export interface UseReturnNavigationReturn<
  TParams extends ReturnNavigationParams = ReturnNavigationParams,
  TUiState extends ReturnNavigationUiState = ReturnNavigationUiState,
> {
  saveReturnTarget: (target: ReturnNavigationTarget<TParams, TUiState>) => void;
  captureReturnTarget: (args: CaptureReturnTargetArgs<TParams, TUiState>) => void;
  peekReturnTarget: () => ReturnNavigationTarget<TParams, TUiState> | null;
  consumeReturnTarget: () => ReturnNavigationTarget<TParams, TUiState> | null;
  clearReturnTarget: () => void;
  returnToSavedTarget: (
    options?: ReturnToSavedTargetOptions<TParams, TUiState>
  ) => ReturnNavigationTarget<TParams, TUiState> | null;
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function clearStoredTarget(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(RETURN_NAVIGATION_STORAGE_KEY);
  } catch {
    // Fail closed when storage is blocked.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is ReturnNavigationJson {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!isRecord(value)) return false;
  return Object.values(value).every(isJsonValue);
}

function isJsonRecord(value: unknown): value is Record<string, ReturnNavigationJson> {
  if (!isRecord(value)) return false;
  return Object.values(value).every(isJsonValue);
}

function isScrollPosition(value: unknown): value is ReturnNavigationScrollPosition {
  if (!isRecord(value)) return false;
  return typeof value.x === 'number' && typeof value.y === 'number';
}

function isReturnTarget(value: unknown): value is ReturnNavigationTarget {
  if (!isRecord(value)) return false;
  return (
    typeof value.sourceSurface === 'string' &&
    isJsonRecord(value.params) &&
    isScrollPosition(value.scrollPosition) &&
    isJsonRecord(value.uiState)
  );
}

function currentScrollPosition(): ReturnNavigationScrollPosition {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: window.scrollX ?? 0,
    y: window.scrollY ?? 0,
  };
}

function readStoredTarget<
  TParams extends ReturnNavigationParams,
  TUiState extends ReturnNavigationUiState,
>(): ReturnNavigationTarget<TParams, TUiState> | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(RETURN_NAVIGATION_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (isReturnTarget(parsed)) {
      return parsed as ReturnNavigationTarget<TParams, TUiState>;
    }
  } catch {
    // Invalid JSON is cleared below.
  }

  clearStoredTarget();
  return null;
}

function defaultRestoreScroll(scrollPosition: ReturnNavigationScrollPosition): void {
  if (typeof window === 'undefined') return;
  try {
    window.scrollTo(scrollPosition.x, scrollPosition.y);
  } catch {
    // Some test/browser environments expose scrollTo but do not implement it.
  }
}

export function useReturnNavigation<
  TParams extends ReturnNavigationParams = ReturnNavigationParams,
  TUiState extends ReturnNavigationUiState = ReturnNavigationUiState,
>(): UseReturnNavigationReturn<TParams, TUiState> {
  const saveReturnTarget = useCallback((target: ReturnNavigationTarget<TParams, TUiState>) => {
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      storage.setItem(RETURN_NAVIGATION_STORAGE_KEY, JSON.stringify(target));
    } catch {
      // Fail closed when storage is blocked or the target is not serializable.
    }
  }, []);

  const captureReturnTarget = useCallback(
    (args: CaptureReturnTargetArgs<TParams, TUiState>) => {
      saveReturnTarget({
        sourceSurface: args.sourceSurface,
        params: args.params ?? ({} as TParams),
        scrollPosition: args.scrollPosition ?? currentScrollPosition(),
        uiState: args.uiState ?? ({} as TUiState),
      });
    },
    [saveReturnTarget]
  );

  const clearReturnTarget = useCallback(() => {
    clearStoredTarget();
  }, []);

  const peekReturnTarget = useCallback(() => {
    return readStoredTarget<TParams, TUiState>();
  }, []);

  const consumeReturnTarget = useCallback(() => {
    const target = readStoredTarget<TParams, TUiState>();
    clearStoredTarget();
    return target;
  }, []);

  const returnToSavedTarget = useCallback(
    (options: ReturnToSavedTargetOptions<TParams, TUiState> = {}) => {
      const target = consumeReturnTarget();
      if (!target) return null;

      if (options.navigate) {
        saveReturnTarget(target);
        options.navigate(target.sourceSurface, target.params);
        return target;
      }

      options.restoreUiState?.(target.uiState);
      (options.restoreScroll ?? defaultRestoreScroll)(target.scrollPosition);

      return target;
    },
    [consumeReturnTarget, saveReturnTarget]
  );

  return {
    saveReturnTarget,
    captureReturnTarget,
    peekReturnTarget,
    consumeReturnTarget,
    clearReturnTarget,
    returnToSavedTarget,
  };
}
