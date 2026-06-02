import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClearScopeOnIPSwitch } from '../useClearScopeOnIPSwitch';

describe('useClearScopeOnIPSwitch', () => {
  let clearFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearFn = vi.fn();
  });

  it('does NOT call clearFn on initial render with a non-null id', () => {
    renderHook(() => useClearScopeOnIPSwitch('A', clearFn));
    expect(clearFn).not.toHaveBeenCalled();
  });

  it('calls clearFn exactly once when switching from A to B', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useClearScopeOnIPSwitch(id, clearFn),
      { initialProps: { id: 'A' } }
    );
    rerender({ id: 'B' });
    expect(clearFn).toHaveBeenCalledTimes(1);
  });

  it('does NOT call clearFn again when id stays the same (B→B)', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useClearScopeOnIPSwitch(id, clearFn),
      { initialProps: { id: 'A' } }
    );
    rerender({ id: 'B' });
    clearFn.mockClear();
    rerender({ id: 'B' });
    expect(clearFn).not.toHaveBeenCalled();
  });

  it('does NOT call clearFn on null→id (activation)', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useClearScopeOnIPSwitch(id, clearFn),
      { initialProps: { id: null } }
    );
    rerender({ id: 'A' });
    expect(clearFn).not.toHaveBeenCalled();
  });

  it('does NOT call clearFn on id→null (deactivation)', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useClearScopeOnIPSwitch(id, clearFn),
      { initialProps: { id: 'A' } }
    );
    rerender({ id: null });
    expect(clearFn).not.toHaveBeenCalled();
  });

  it('calls clearFn exactly once for the sequence null→A→B', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useClearScopeOnIPSwitch(id, clearFn),
      { initialProps: { id: null } }
    );
    // null → A: activation — must NOT fire
    rerender({ id: 'A' });
    expect(clearFn).not.toHaveBeenCalled();
    // A → B: genuine switch — MUST fire
    rerender({ id: 'B' });
    expect(clearFn).toHaveBeenCalledTimes(1);
  });
});
