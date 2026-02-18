import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataTablePagination } from '../useDataTablePagination';

const makeData = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }));

describe('useDataTablePagination', () => {
  it('returns all data on page 0 when under threshold', () => {
    const data = makeData(10);
    const { result } = renderHook(() => useDataTablePagination(data, 100));

    expect(result.current.needsPagination).toBe(false);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageData).toHaveLength(10);
    expect(result.current.currentPage).toBe(0);
  });

  it('paginates when data exceeds rowsPerPage', () => {
    const data = makeData(250);
    const { result } = renderHook(() => useDataTablePagination(data, 100));

    expect(result.current.needsPagination).toBe(true);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageData).toHaveLength(100);
    expect(result.current.pageData[0]).toEqual({ id: 0 });
  });

  it('returns correct slice on page 1', () => {
    const data = makeData(250);
    const { result } = renderHook(() => useDataTablePagination(data, 100));

    act(() => result.current.setCurrentPage(1));

    expect(result.current.pageData).toHaveLength(100);
    expect(result.current.pageData[0]).toEqual({ id: 100 });
  });

  it('returns partial last page', () => {
    const data = makeData(250);
    const { result } = renderHook(() => useDataTablePagination(data, 100));

    act(() => result.current.setCurrentPage(2));

    expect(result.current.pageData).toHaveLength(50);
    expect(result.current.pageData[0]).toEqual({ id: 200 });
  });

  it('handles empty data', () => {
    const { result } = renderHook(() => useDataTablePagination([], 100));

    expect(result.current.needsPagination).toBe(false);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.pageData).toHaveLength(0);
  });

  it('handles exactly rowsPerPage items', () => {
    const data = makeData(100);
    const { result } = renderHook(() => useDataTablePagination(data, 100));

    expect(result.current.needsPagination).toBe(false);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageData).toHaveLength(100);
  });
});
