/**
 * CS-13 — WallCanvas explore-jump threading + the data-presence gate.
 * Owner-locked rule: "explore what exists; plan what doesn't" — a hub whose
 * factor is absent from activeColumns renders NO → (the measurement-plan chip
 * owns that case). The same test seeds a present-factor hub that DOES render
 * the →, so the absence assertion is load-bearing.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
  getViewInitialState,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { Hypothesis } from '@variscout/core';

const makeHub = (id: string, name: string, column: string, value: string): Hypothesis => ({
  ...createHypothesis(name, '', [], 'inv-test'),
  id,
  condition: { kind: 'leaf', column, op: 'eq', value },
});

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState(getViewInitialState());
});

describe('WallCanvas — explore-jump threading + data-presence gate (CS-13)', () => {
  it('gates the card → on data presence: present-factor hub renders it, absent-factor hub does not', () => {
    const onExploreFactor = vi.fn();
    render(
      <WallCanvas
        hubs={[
          makeHub('h-present', 'Shift drives it', 'SHIFT', 'Night'),
          makeHub('h-absent', 'Humidity drives it', 'HUMIDITY', 'High'),
        ]}
        findings={[]}
        problemCpk={1}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'Y']}
        outcomeColumn="Y"
        onExploreFactor={onExploreFactor}
      />
    );
    // Only h-present (SHIFT in activeColumns) renders the jump button.
    // h-absent (HUMIDITY not in activeColumns) renders none.
    expect(screen.getAllByTestId('hub-explore-jump')).toHaveLength(1);
  });

  it('clicking the card → fires onExploreFactor with the hub primary factor', () => {
    const onExploreFactor = vi.fn();
    render(
      <WallCanvas
        hubs={[makeHub('h-present', 'Shift drives it', 'SHIFT', 'Night')]}
        findings={[]}
        problemCpk={1}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'Y']}
        outcomeColumn="Y"
        onExploreFactor={onExploreFactor}
      />
    );
    fireEvent.click(screen.getByTestId('hub-explore-jump'));
    expect(onExploreFactor).toHaveBeenCalledWith('SHIFT');
  });

  it('renders no → anywhere when onExploreFactor is omitted (legacy mounts unchanged)', () => {
    render(
      <WallCanvas
        hubs={[makeHub('h-present', 'Shift drives it', 'SHIFT', 'Night')]}
        findings={[]}
        problemCpk={1}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'Y']}
        outcomeColumn="Y"
      />
    );
    expect(screen.queryByTestId('hub-explore-jump')).toBeNull();
  });
});
