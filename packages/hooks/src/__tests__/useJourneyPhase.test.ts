/**
 * Tests for useJourneyPhase hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJourneyPhase } from '../useJourneyPhase';
import type { Finding } from '@variscout/core';

/** Create a minimal Finding for testing */
const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'f-1',
  text: 'Test finding',
  createdAt: 1000,
  context: {
    activeFilters: {},
    cumulativeScope: null,
  },
  status: 'observed',
  comments: [],
  statusChangedAt: 1000,
  ...overrides,
});

describe('useJourneyPhase', () => {
  it('returns "frame" when no data is loaded', () => {
    const { result } = renderHook(() => useJourneyPhase(false, []));
    expect(result.current).toBe('frame');
  });

  it('returns "scout" when data is loaded but no findings exist', () => {
    const { result } = renderHook(() => useJourneyPhase(true, []));
    expect(result.current).toBe('scout');
  });

  it('returns "investigate" when findings exist but none have actions', () => {
    const findings = [makeFinding({ id: 'f-1', text: 'Pattern spotted' })];
    const { result } = renderHook(() => useJourneyPhase(true, findings));
    expect(result.current).toBe('investigate');
  });

  it('returns "improve" when at least one finding has actions', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        text: 'Fix required',
        actions: [{ id: 'a-1', text: 'Adjust calibration', createdAt: 2000 }],
      }),
    ];
    const { result } = renderHook(() => useJourneyPhase(true, findings));
    expect(result.current).toBe('improve');
  });

  it('returns "improve" when only some findings have actions', () => {
    const findings = [
      makeFinding({ id: 'f-1', text: 'No actions yet' }),
      makeFinding({
        id: 'f-2',
        text: 'Has actions',
        actions: [{ id: 'a-1', text: 'Retrain operator', createdAt: 2000 }],
      }),
    ];
    const { result } = renderHook(() => useJourneyPhase(true, findings));
    expect(result.current).toBe('improve');
  });

  it('returns "investigate" when findings have empty actions array', () => {
    const findings = [makeFinding({ id: 'f-1', text: 'Empty actions', actions: [] })];
    const { result } = renderHook(() => useJourneyPhase(true, findings));
    expect(result.current).toBe('investigate');
  });

  it('returns "frame" when hasData is false even if findings exist', () => {
    const findings = [makeFinding({ id: 'f-1' })];
    const { result } = renderHook(() => useJourneyPhase(false, findings));
    expect(result.current).toBe('frame');
  });
});
