import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useSpecsForMeasure } from '../useSpecsForMeasure';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('useSpecsForMeasure', () => {
  it('returns global specs when no per-measure override exists', () => {
    useProjectStore.setState({
      specs: { lsl: 90, usl: 110 },
      measureSpecs: {},
    });
    const { result } = renderHook(() => useSpecsForMeasure());
    expect(result.current('head1')).toEqual({ lsl: 90, usl: 110 });
  });

  it('returns per-measure override when it exists', () => {
    useProjectStore.setState({
      specs: { lsl: 90, usl: 110 },
      measureSpecs: { head1: { lsl: 95, usl: 105 } },
    });
    const { result } = renderHook(() => useSpecsForMeasure());
    expect(result.current('head1')).toEqual({ lsl: 95, usl: 105 });
  });

  it('falls back to global for measures without override', () => {
    useProjectStore.setState({
      specs: { lsl: 90, usl: 110 },
      measureSpecs: { head1: { lsl: 95, usl: 105 } },
    });
    const { result } = renderHook(() => useSpecsForMeasure());
    expect(result.current('head2')).toEqual({ lsl: 90, usl: 110 });
  });
});
