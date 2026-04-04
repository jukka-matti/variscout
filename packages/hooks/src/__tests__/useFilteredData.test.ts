import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useFilteredData } from '../useFilteredData';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('useFilteredData', () => {
  const sampleData = [
    { weight: 100, machine: 'A' },
    { weight: 105, machine: 'B' },
    { weight: 110, machine: 'A' },
    { weight: 95, machine: 'B' },
  ];

  it('returns all rows when no filters are active', () => {
    useProjectStore.setState({ rawData: sampleData, filters: {} });
    const { result } = renderHook(() => useFilteredData());
    expect(result.current.filteredData).toHaveLength(4);
    expect(result.current.filteredIndexMap.size).toBe(4);
  });

  it('filters by single column value', () => {
    useProjectStore.setState({
      rawData: sampleData,
      filters: { machine: ['A'] },
    });
    const { result } = renderHook(() => useFilteredData());
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.every(r => r.machine === 'A')).toBe(true);
  });

  it('builds correct index map from filtered to raw indices', () => {
    useProjectStore.setState({
      rawData: sampleData,
      filters: { machine: ['B'] },
    });
    const { result } = renderHook(() => useFilteredData());
    // B rows are at rawData indices 1 and 3
    expect(result.current.filteredIndexMap.get(0)).toBe(1);
    expect(result.current.filteredIndexMap.get(1)).toBe(3);
  });

  it('returns empty when no rows match', () => {
    useProjectStore.setState({
      rawData: sampleData,
      filters: { machine: ['C'] },
    });
    const { result } = renderHook(() => useFilteredData());
    expect(result.current.filteredData).toHaveLength(0);
  });

  it('returns empty for empty rawData', () => {
    useProjectStore.setState({ rawData: [], filters: {} });
    const { result } = renderHook(() => useFilteredData());
    expect(result.current.filteredData).toHaveLength(0);
  });

  it('handles multiple filter columns', () => {
    const data = [
      { weight: 100, machine: 'A', shift: 'day' },
      { weight: 105, machine: 'A', shift: 'night' },
      { weight: 110, machine: 'B', shift: 'day' },
    ];
    useProjectStore.setState({
      rawData: data,
      filters: { machine: ['A'], shift: ['day'] },
    });
    const { result } = renderHook(() => useFilteredData());
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].weight).toBe(100);
  });
});
