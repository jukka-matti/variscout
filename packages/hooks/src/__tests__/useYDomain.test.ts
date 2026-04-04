import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useYDomain } from '../useYDomain';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('useYDomain', () => {
  const sampleData = [{ weight: 100 }, { weight: 110 }, { weight: 90 }];

  it('returns null when no outcome is set', () => {
    useProjectStore.setState({ rawData: sampleData, outcome: null });
    const { result } = renderHook(() => useYDomain());
    expect(result.current.fullDataYDomain).toBeNull();
    expect(result.current.yDomainForCharts).toBeUndefined();
  });

  it('computes domain from raw data with 10% padding', () => {
    useProjectStore.setState({
      rawData: sampleData,
      outcome: 'weight',
      specs: {},
    });
    const { result } = renderHook(() => useYDomain());
    const domain = result.current.fullDataYDomain!;
    // Range is 90-110, padding = 2
    expect(domain.min).toBeCloseTo(88, 0);
    expect(domain.max).toBeCloseTo(112, 0);
  });

  it('includes spec limits in domain', () => {
    useProjectStore.setState({
      rawData: sampleData,
      outcome: 'weight',
      specs: { lsl: 80, usl: 120 },
    });
    const { result } = renderHook(() => useYDomain());
    const domain = result.current.fullDataYDomain!;
    // Range expands to 80-120, padding = 4
    expect(domain.min).toBeCloseTo(76, 0);
    expect(domain.max).toBeCloseTo(124, 0);
  });

  it('returns fullDataYDomain as yDomainForCharts when lockYAxisToFullData is true', () => {
    useProjectStore.setState({
      rawData: sampleData,
      outcome: 'weight',
      specs: {},
      displayOptions: { lockYAxisToFullData: true },
    });
    const { result } = renderHook(() => useYDomain());
    expect(result.current.yDomainForCharts).toEqual(result.current.fullDataYDomain);
  });

  it('returns undefined yDomainForCharts when lockYAxisToFullData is false', () => {
    useProjectStore.setState({
      rawData: sampleData,
      outcome: 'weight',
      specs: {},
      displayOptions: { lockYAxisToFullData: false },
    });
    const { result } = renderHook(() => useYDomain());
    expect(result.current.yDomainForCharts).toBeUndefined();
  });

  it('returns null for empty rawData', () => {
    useProjectStore.setState({ rawData: [], outcome: 'weight' });
    const { result } = renderHook(() => useYDomain());
    expect(result.current.fullDataYDomain).toBeNull();
  });
});
