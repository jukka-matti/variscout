import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterHandlers } from '../useFilterHandlers';

describe('useFilterHandlers', () => {
  const createMocks = () => ({
    clearFilters: vi.fn(),
    removeFilter: vi.fn(),
    updateFilterValues: vi.fn(),
  });

  it('delegates handleClearAllFilters to clearFilters', () => {
    const mocks = createMocks();
    const { result } = renderHook(() => useFilterHandlers(mocks));
    act(() => result.current.handleClearAllFilters());
    expect(mocks.clearFilters).toHaveBeenCalledOnce();
  });

  it('delegates handleRemoveFilter to removeFilter', () => {
    const mocks = createMocks();
    const { result } = renderHook(() => useFilterHandlers(mocks));
    act(() => result.current.handleRemoveFilter('Machine'));
    expect(mocks.removeFilter).toHaveBeenCalledWith('Machine');
  });

  it('delegates handleUpdateFilterValues to updateFilterValues', () => {
    const mocks = createMocks();
    const { result } = renderHook(() => useFilterHandlers(mocks));
    act(() => result.current.handleUpdateFilterValues('Shift', ['A', 'B']));
    expect(mocks.updateFilterValues).toHaveBeenCalledWith('Shift', ['A', 'B']);
  });

  it('returns stable references across re-renders', () => {
    const mocks = createMocks();
    const { result, rerender } = renderHook(() => useFilterHandlers(mocks));
    const first = result.current;
    rerender();
    expect(result.current.handleClearAllFilters).toBe(first.handleClearAllFilters);
    expect(result.current.handleRemoveFilter).toBe(first.handleRemoveFilter);
    expect(result.current.handleUpdateFilterValues).toBe(first.handleUpdateFilterValues);
  });

  it('updates references when deps change', () => {
    const mocks1 = createMocks();
    const mocks2 = createMocks();
    const { result, rerender } = renderHook(({ opts }) => useFilterHandlers(opts), {
      initialProps: { opts: mocks1 },
    });
    const first = result.current.handleClearAllFilters;
    rerender({ opts: mocks2 });
    expect(result.current.handleClearAllFilters).not.toBe(first);
  });

  it('passes empty newValues array correctly', () => {
    const mocks = createMocks();
    const { result } = renderHook(() => useFilterHandlers(mocks));
    act(() => result.current.handleUpdateFilterValues('Machine', []));
    expect(mocks.updateFilterValues).toHaveBeenCalledWith('Machine', []);
  });
});
