import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseChartFactorsReturn {
  boxplotFactor: string;
  setBoxplotFactor: (factor: string) => void;
  paretoFactor: string;
  setParetoFactor: (factor: string) => void;
  paretoFactorSelectorRef: React.RefObject<HTMLSelectElement>;
}

export function useChartFactors(factors: string[]): UseChartFactorsReturn {
  const [boxplotFactor, setBoxplotFactor] = useState<string>('');
  const [paretoFactor, setParetoFactor] = useState<string>('');
  const paretoFactorSelectorRef = useRef<HTMLSelectElement>(null);

  // Sync factors when they change (initialization + invalid factor reset)
  useEffect(() => {
    if (factors.length > 0) {
      setBoxplotFactor(prev => (!prev || !factors.includes(prev) ? factors[0] : prev));
      setParetoFactor(prev => (!prev || !factors.includes(prev) ? factors[1] || factors[0] : prev));
    }
  }, [factors]);

  return {
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    paretoFactorSelectorRef,
  };
}
