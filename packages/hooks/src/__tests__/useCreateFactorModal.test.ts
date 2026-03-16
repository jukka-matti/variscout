import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateFactorModal } from '../useCreateFactorModal';

// Mock createFactorFromSelection
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    createFactorFromSelection: vi.fn((data, _points, factorName) =>
      data.map((row: Record<string, unknown>, i: number) => ({
        ...row,
        [factorName]: `group-${i}`,
      }))
    ),
  };
});

describe('useCreateFactorModal', () => {
  const createOptions = () => ({
    rawData: [{ val: 1 }, { val: 2 }, { val: 3 }],
    selectedPoints: new Set([0, 2]),
    filters: { Shift: ['A'] },
    setRawData: vi.fn(),
    setFilters: vi.fn(),
    clearSelection: vi.fn(),
  });

  it('starts with modal closed', () => {
    const { result } = renderHook(() => useCreateFactorModal(createOptions()));
    expect(result.current.showCreateFactorModal).toBe(false);
  });

  it('opens modal on handleOpenCreateFactorModal', () => {
    const { result } = renderHook(() => useCreateFactorModal(createOptions()));
    act(() => result.current.handleOpenCreateFactorModal());
    expect(result.current.showCreateFactorModal).toBe(true);
  });

  it('closes modal on handleCloseCreateFactorModal', () => {
    const { result } = renderHook(() => useCreateFactorModal(createOptions()));
    act(() => result.current.handleOpenCreateFactorModal());
    act(() => result.current.handleCloseCreateFactorModal());
    expect(result.current.showCreateFactorModal).toBe(false);
  });

  it('creates factor and updates state correctly', () => {
    const opts = createOptions();
    const { result } = renderHook(() => useCreateFactorModal(opts));
    act(() => result.current.handleCreateFactor('MyFactor'));

    expect(opts.setRawData).toHaveBeenCalledOnce();
    expect(opts.setFilters).toHaveBeenCalledWith({
      Shift: ['A'],
      MyFactor: ['MyFactor'],
    });
    expect(opts.clearSelection).toHaveBeenCalledOnce();
    expect(result.current.showCreateFactorModal).toBe(false);
  });

  it('closes modal after factor creation', () => {
    const opts = createOptions();
    const { result } = renderHook(() => useCreateFactorModal(opts));
    act(() => result.current.handleOpenCreateFactorModal());
    expect(result.current.showCreateFactorModal).toBe(true);
    act(() => result.current.handleCreateFactor('Test'));
    expect(result.current.showCreateFactorModal).toBe(false);
  });
});
