/**
 * WallCanvas Focus-lens SEAM test (IM-4c Task 5).
 *
 * Renders the PRODUCTION WallCanvas and asserts the Focus lens dims by
 * degree-of-interest, reading the SINGLE viewStore.focusedWallEntityId field
 * (ADR-086 — not a per-renderer focus state). It asserts on REAL rendered
 * `opacity` / `data-doi`, plus the click-to-focus + background-click-to-clear
 * gestures writing the store. A dead lens (no opacity applied / focus held in a
 * local useState) FAILS these.
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import { focusOpacity } from '../wallFocus';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
  getViewInitialState,
} from '@variscout/stores';
import type { Hypothesis, Finding } from '@variscout/core';

const evidenceRows = [
  { SHIFT: 'night', lead_time: 50 },
  { SHIFT: 'day', lead_time: 20 },
];

const hubA: Hypothesis = {
  id: 'hA',
  name: 'Night shift effect',
  synthesis: '',
  condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
  findingIds: ['f-a'],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
};
const hubB: Hypothesis = {
  ...hubA,
  id: 'hB',
  name: 'Operator drift',
  condition: undefined,
  findingIds: [],
};
const findings: Finding[] = [
  {
    id: 'f-a',
    text: 'Night runs spike',
    evidenceType: 'data',
    createdAt: 1,
    deletedAt: null,
    investigationId: 'inv-test',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
  } as unknown as Finding,
];

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState(getViewInitialState());
});

function renderWall() {
  return render(
    <WallCanvas
      hubs={[hubA, hubB]}
      findings={findings}
      problemCpk={0.78}
      eventsPerWeek={42}
      rows={evidenceRows}
    />
  );
}

describe('WallCanvas Focus lens — degree-of-interest dimming pinned to viewStore', () => {
  it('with nothing focused, every node renders vivid (opacity 1)', () => {
    const { container } = renderWall();
    const a = container.querySelector('[data-wall-node-id="hA"]');
    const b = container.querySelector('[data-wall-node-id="hB"]');
    expect(Number(a!.getAttribute('opacity'))).toBeCloseTo(1);
    expect(Number(b!.getAttribute('opacity'))).toBeCloseTo(1);
  });

  it('focusing hA renders hA + its linked finding vivid and the sibling hB dimmed', () => {
    useViewStore.getState().setFocusedWallEntity('hA');
    const { container } = renderWall();

    const a = container.querySelector('[data-wall-node-id="hA"]');
    const fa = container.querySelector('[data-wall-node-id="f-a"]');
    const b = container.querySelector('[data-wall-node-id="hB"]');

    // hA is the focal node → vivid (doi 0).
    expect(a!.getAttribute('data-doi')).toBe('0');
    expect(Number(a!.getAttribute('opacity'))).toBeCloseTo(focusOpacity(0));
    // f-a shares a tether with hA → mid tier (doi 1), still > the dim floor.
    expect(fa!.getAttribute('data-doi')).toBe('1');
    expect(Number(fa!.getAttribute('opacity'))).toBeCloseTo(focusOpacity(1));
    // hB is an unrelated sibling → dimmed (doi >= 2).
    expect(Number(b!.getAttribute('data-doi'))).toBeGreaterThanOrEqual(2);
    expect(Number(b!.getAttribute('opacity'))).toBeCloseTo(focusOpacity(2));
    // …and the sibling is strictly dimmer than the focal node.
    expect(Number(b!.getAttribute('opacity'))).toBeLessThan(Number(a!.getAttribute('opacity')));
  });

  it('clicking a card sets focus in the viewStore (single source)', () => {
    const { container } = renderWall();
    expect(useViewStore.getState().focusedWallEntityId).toBeNull();
    const b = container.querySelector('[data-wall-node-id="hB"]') as Element;
    fireEvent.click(b);
    expect(useViewStore.getState().focusedWallEntityId).toBe('hB');
  });

  it('clicking the empty canvas clears focus', () => {
    useViewStore.getState().setFocusedWallEntity('hA');
    const { container } = renderWall();
    expect(useViewStore.getState().focusedWallEntityId).toBe('hA');
    const bg = container.querySelector('[data-wall-focus-clear]') as Element;
    fireEvent.click(bg);
    expect(useViewStore.getState().focusedWallEntityId).toBeNull();
  });
});
