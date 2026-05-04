import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStageFiveOpener } from '../useStageFiveOpener';

describe('useStageFiveOpener', () => {
  it('starts closed in mode-b', () => {
    const { result } = renderHook(() => useStageFiveOpener());
    expect(result.current.open).toBe(false);
    expect(result.current.mode).toBe('mode-b');
  });

  it('openModeB opens in mode-b', () => {
    const { result } = renderHook(() => useStageFiveOpener());
    act(() => result.current.openModeB());
    expect(result.current.open).toBe(true);
    expect(result.current.mode).toBe('mode-b');
  });

  it('openOnDemand opens in mode-a-on-demand and close resets', () => {
    const { result } = renderHook(() => useStageFiveOpener());
    act(() => result.current.openOnDemand());
    expect(result.current.mode).toBe('mode-a-on-demand');
    act(() => result.current.close());
    expect(result.current.open).toBe(false);
  });
});
