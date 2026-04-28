import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionLineGlanceFilter } from '../useProductionLineGlanceFilter';

const setLocation = (search: string) => {
  window.history.replaceState(null, '', `/test${search ? `?${search}` : ''}`);
};

describe('useProductionLineGlanceFilter', () => {
  beforeEach(() => setLocation(''));
  afterEach(() => setLocation(''));

  it('returns empty filter when URL has no relevant params', () => {
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    expect(result.current.value).toEqual({});
  });

  it('reads filter values from URL on mount', () => {
    setLocation('product=Coke12oz&supplier=TightCorp');
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    expect(result.current.value).toEqual({
      product: 'Coke12oz',
      supplier: 'TightCorp',
    });
  });

  it('writes filter changes back to URL via replaceState', () => {
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({ product: 'Coke12oz' }));
    expect(window.location.search).toContain('product=Coke12oz');
  });

  it('removes URL params when value is cleared', () => {
    setLocation('product=Coke12oz');
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({}));
    expect(window.location.search).not.toContain('product=');
  });

  it('preserves reserved URL params (e.g. ops=full) untouched on write', () => {
    setLocation('ops=full&product=Coke12oz');
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({ product: 'Sprite' }));
    expect(window.location.search).toContain('ops=full');
    expect(window.location.search).toContain('product=Sprite');
    expect(window.location.search).not.toContain('Coke12oz');
  });

  it('does not push history entries (uses replaceState)', () => {
    const initialLength = window.history.length;
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({ product: 'A' }));
    act(() => result.current.onChange({ product: 'B' }));
    act(() => result.current.onChange({ product: 'C' }));
    expect(window.history.length).toBe(initialLength);
  });
});
