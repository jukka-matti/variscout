// apps/azure/src/context/__tests__/ToastContext.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../ToastContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current.notifications).toEqual([]);
  });

  it('showToast adds a notification', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast({ type: 'success', message: 'Link copied' });
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Link copied');
    expect(result.current.notifications[0].id).toBeTruthy();
  });

  it('dismissToast removes a notification', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast({ type: 'info', message: 'Test' });
    });
    const id = result.current.notifications[0].id;
    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.notifications).toHaveLength(0);
  });

  it('auto-dismisses after dismissAfter ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast({ type: 'success', message: 'Auto', dismissAfter: 3000 });
    });
    expect(result.current.notifications).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.notifications).toHaveLength(0);
    vi.useRealTimers();
  });

  it('caps at 5 notifications', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.showToast({ type: 'info', message: `Msg ${i}` });
      }
    });
    expect(result.current.notifications.length).toBeLessThanOrEqual(5);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow();
  });
});
