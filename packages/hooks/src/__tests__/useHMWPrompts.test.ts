import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHMWPrompts } from '../useHMWPrompts';

describe('useHMWPrompts', () => {
  it('returns 4 HMW prompts for a cause with problem statement', () => {
    const { result } = renderHook(() => useHMWPrompts('Shift (Night)', 'fill weight variation'));
    expect(result.current.prevent).toContain('prevent');
    expect(result.current.prevent).toContain('Shift (Night)');
    expect(result.current.detect).toContain('detect');
    expect(result.current.simplify).toContain('simplify');
    expect(result.current.eliminate).toContain('eliminate');
  });

  it('returns stable reference when inputs unchanged', () => {
    const { result, rerender } = renderHook(({ cause, problem }) => useHMWPrompts(cause, problem), {
      initialProps: { cause: 'Shift', problem: 'variation' },
    });
    const first = result.current;
    rerender({ cause: 'Shift', problem: 'variation' });
    expect(result.current).toBe(first);
  });

  it('updates when cause changes', () => {
    const { result, rerender } = renderHook(({ cause }) => useHMWPrompts(cause), {
      initialProps: { cause: 'Machine A' },
    });
    expect(result.current.prevent).toContain('Machine A');
    rerender({ cause: 'Machine B' });
    expect(result.current.prevent).toContain('Machine B');
  });
});
