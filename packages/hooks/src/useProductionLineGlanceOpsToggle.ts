import { useCallback, useEffect, useState } from 'react';

export type ProductionLineGlanceOpsMode = 'spatial' | 'full';
const PARAM_NAME = 'ops';

function readFromURL(): ProductionLineGlanceOpsMode {
  if (typeof window === 'undefined') return 'spatial';
  const value = new URLSearchParams(window.location.search).get(PARAM_NAME);
  return value === 'full' ? 'full' : 'spatial';
}

function writeToURL(mode: ProductionLineGlanceOpsMode): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (mode === 'spatial') {
    params.delete(PARAM_NAME);
  } else {
    params.set(PARAM_NAME, 'full');
  }
  const next = params.toString();
  const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

export interface UseProductionLineGlanceOpsToggleResult {
  mode: ProductionLineGlanceOpsMode;
  setMode: (next: ProductionLineGlanceOpsMode) => void;
  toggle: () => void;
}

/**
 * URL ?ops state for the LayeredProcessView Operations band's
 * progressive-reveal mode. Default 'spatial'; 'full' reveals the
 * temporal row above the spatial row.
 */
export function useProductionLineGlanceOpsToggle(): UseProductionLineGlanceOpsToggleResult {
  const [mode, setModeState] = useState<ProductionLineGlanceOpsMode>(() => readFromURL());

  useEffect(() => {
    const onPop = () => setModeState(readFromURL());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setMode = useCallback((next: ProductionLineGlanceOpsMode) => {
    setModeState(next);
    writeToURL(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next: ProductionLineGlanceOpsMode = prev === 'spatial' ? 'full' : 'spatial';
      writeToURL(next);
      return next;
    });
  }, []);

  return { mode, setMode, toggle };
}
