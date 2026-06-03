/**
 * PR-CS-9 focus-gate seam: the per-factor stat chart renders ONLY for the focused
 * hub. Two hubs naming distinct factors; focusing one must surface its chart and
 * NOT the other's (the load-bearing negative control — an always-on render fails).
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasPlanningProps } from '../WallCanvas';
import {
  getCanvasViewportInitialState,
  useViewStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { DataRow, Hypothesis } from '@variscout/core';

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState({ focusedWallEntityId: null });
});

// Hub A names SHIFT (categorical → boxplot); Hub B names TEMP (continuous → scatter).
function hubA(): Hypothesis {
  const h = createHypothesis('Night shift runs hot', '', []);
  return {
    ...h,
    id: 'hub-A',
    condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
  };
}
function hubB(): Hypothesis {
  const h = createHypothesis('Hotter runs vary', '', []);
  return { ...h, id: 'hub-B', condition: { kind: 'leaf', column: 'TEMP', op: 'gte', value: 30 } };
}
function rows(): DataRow[] {
  return [
    { SHIFT: 'Day', TEMP: 20.4, Y: 10 },
    { SHIFT: 'Day', TEMP: 21.7, Y: 11 },
    { SHIFT: 'Day', TEMP: 22.1, Y: 12 },
    { SHIFT: 'Day', TEMP: 23.9, Y: 13 },
    { SHIFT: 'Day', TEMP: 24.3, Y: 14 },
    { SHIFT: 'Night', TEMP: 30.6, Y: 30 },
    { SHIFT: 'Night', TEMP: 31.2, Y: 31 },
    { SHIFT: 'Night', TEMP: 32.8, Y: 32 },
    { SHIFT: 'Night', TEMP: 33.5, Y: 33 },
    { SHIFT: 'Night', TEMP: 34.1, Y: 34 },
  ];
}
function planningProps(overrides?: Partial<WallCanvasPlanningProps>): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [],
    currentUserId: null,
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

describe('WallCanvas — triad chart focus gate (PR-CS-9)', () => {
  it('renders triad charts ONLY for the focused hub', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hubA(), hubB()]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={planningProps({ onEvaluateFactor: vi.fn() })}
      />
    );
    // No hub focused → no charts anywhere.
    expect(screen.queryByTestId('triad-chart-SHIFT')).toBeNull();
    expect(screen.queryByTestId('triad-chart-TEMP')).toBeNull();

    // Focus hub A → A's SHIFT chart appears; B's TEMP chart does NOT (the gate).
    act(() => {
      useViewStore.setState({ focusedWallEntityId: 'hub-A' });
    });
    expect(screen.getByTestId('triad-chart-SHIFT')).toBeInTheDocument();
    expect(screen.queryByTestId('triad-chart-TEMP')).toBeNull();
  });
});
