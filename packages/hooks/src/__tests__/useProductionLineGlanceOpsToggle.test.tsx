import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionLineGlanceOpsToggle } from '../useProductionLineGlanceOpsToggle';

const setLocation = (search: string) => {
  window.history.replaceState(null, '', `/test${search ? `?${search}` : ''}`);
};

describe('useProductionLineGlanceOpsToggle', () => {
  beforeEach(() => setLocation(''));
  afterEach(() => setLocation(''));

  it('returns "spatial" by default', () => {
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    expect(result.current.mode).toBe('spatial');
  });

  it('reads "full" from ?ops=full', () => {
    setLocation('ops=full');
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    expect(result.current.mode).toBe('full');
  });

  it('writes ops=full to URL via setMode', () => {
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('full'));
    expect(window.location.search).toContain('ops=full');
  });

  it('removes ops param when toggling back to spatial', () => {
    setLocation('ops=full');
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('spatial'));
    expect(window.location.search).not.toContain('ops=');
  });

  it('preserves filter params when toggling ops', () => {
    setLocation('product=Coke&ops=spatial');
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('full'));
    expect(window.location.search).toContain('product=Coke');
    expect(window.location.search).toContain('ops=full');
  });

  it('toggle() flips spatial <-> full', () => {
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    expect(result.current.mode).toBe('spatial');
    act(() => result.current.toggle());
    expect(result.current.mode).toBe('full');
    act(() => result.current.toggle());
    expect(result.current.mode).toBe('spatial');
  });

  it('uses replaceState (no history growth)', () => {
    const initial = window.history.length;
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('full'));
    act(() => result.current.setMode('spatial'));
    expect(window.history.length).toBe(initial);
  });
});
