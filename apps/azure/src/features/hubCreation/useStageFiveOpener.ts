import { useState, useCallback } from 'react';

export type StageFiveMode = 'mode-b' | 'mode-a-on-demand';

export function useStageFiveOpener() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<StageFiveMode>('mode-b');

  const openModeB = useCallback(() => {
    setMode('mode-b');
    setOpen(true);
  }, []);

  const openOnDemand = useCallback(() => {
    setMode('mode-a-on-demand');
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { open, mode, openModeB, openOnDemand, close };
}
