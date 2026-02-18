import { useState, useCallback, useEffect } from 'react';

export interface UseDrillConfirmationReturn {
  drillConfirmMeasure: string | null;
  handleBoxplotClick: (measureId: string) => void;
  handleConfirmDrill: () => void;
  handleCancelDrill: () => void;
}

export function useDrillConfirmation(
  onDrillToMeasure?: (measureId: string) => void
): UseDrillConfirmationReturn {
  const [drillConfirmMeasure, setDrillConfirmMeasure] = useState<string | null>(null);

  const handleBoxplotClick = useCallback((measureId: string) => {
    setDrillConfirmMeasure(measureId);
  }, []);

  const handleConfirmDrill = useCallback(() => {
    if (drillConfirmMeasure) {
      onDrillToMeasure?.(drillConfirmMeasure);
      setDrillConfirmMeasure(null);
    }
  }, [drillConfirmMeasure, onDrillToMeasure]);

  const handleCancelDrill = useCallback(() => {
    setDrillConfirmMeasure(null);
  }, []);

  useEffect(() => {
    if (!drillConfirmMeasure) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelDrill();
      } else if (e.key === 'Enter') {
        handleConfirmDrill();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drillConfirmMeasure, handleCancelDrill, handleConfirmDrill]);

  return { drillConfirmMeasure, handleBoxplotClick, handleConfirmDrill, handleCancelDrill };
}
