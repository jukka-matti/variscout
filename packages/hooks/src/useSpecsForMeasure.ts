/**
 * useSpecsForMeasure — Derived hook: per-measure spec lookup.
 *
 * Returns a stable callback that resolves the effective SpecLimits for a
 * given measure column (per-measure override or global fallback).
 */

import { useCallback } from 'react';
import type { SpecLimits } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';

export function useSpecsForMeasure(): (measureId: string) => SpecLimits {
  const specs = useProjectStore(s => s.specs);
  const measureSpecs = useProjectStore(s => s.measureSpecs);

  return useCallback(
    (measureId: string): SpecLimits => measureSpecs[measureId] ?? specs,
    [measureSpecs, specs]
  );
}
