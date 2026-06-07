/**
 * WallCanvas propose-hypothesis SEAM test (FSJ-8).
 *
 * Proves the finding→hypothesis-on-Wall seam through the production path:
 * findings-forward arrival renders a promotion CTA, WallCanvas prompts for a
 * plain-language name, and the app callback receives (findingId, name). The
 * render-through harness mimics the apps' rendered-hubs source of truth so a
 * dead wiring still fails visibly.
 */
import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { Hypothesis, Finding } from '@variscout/core';

const orphanFinding: Finding = {
  id: 'f-orphan',
  text: 'Coolant temp creeps over a shift',
  evidenceType: 'data',
  createdAt: 1,
  deletedAt: null,
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'observed',
  comments: [],
  statusChangedAt: 1,
} as unknown as Finding;

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

describe('WallCanvas — findings-forward promotion affordance', () => {
  it('renders a findings-forward arrival card with a promotion affordance', () => {
    render(
      <WallCanvas
        hubs={[]}
        findings={[orphanFinding]}
        problemCpk={0.78}
        eventsPerWeek={42}
        onProposeHypothesis={vi.fn()}
      />
    );
    expect(screen.getByTestId('wall-arrival')).toBeTruthy();
    expect(screen.getByText(/You've observed:/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /what might cause this\?/i })).toBeTruthy();
  });

  it('does NOT render the affordance when onProposeHypothesis is omitted', () => {
    render(
      <WallCanvas hubs={[]} findings={[orphanFinding]} problemCpk={0.78} eventsPerWeek={42} />
    );
    expect(screen.queryByRole('button', { name: /what might cause this\?/i })).toBeNull();
  });

  it('prompts for a name before calling onProposeHypothesis', () => {
    const onProposeHypothesis = vi.fn();
    render(
      <WallCanvas
        hubs={[]}
        findings={[orphanFinding]}
        problemCpk={0.78}
        eventsPerWeek={42}
        onProposeHypothesis={onProposeHypothesis}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /what might cause this\?/i }));
    const input = screen.getByLabelText(/what might cause this\?/i);
    expect(input).toHaveValue('');

    const submit = screen.getByRole('button', { name: /create hypothesis/i });
    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: 'Coolant recirculation lag' } });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    expect(onProposeHypothesis).toHaveBeenCalledWith('f-orphan', 'Coolant recirculation lag');
  });

  it('render-through: named promotion spawns a NEW hypothesis card on the Wall', () => {
    function Harness() {
      const [hubs, setHubs] = useState<Hypothesis[]>([]);
      const [findings, setFindings] = useState<Finding[]>([orphanFinding]);
      return (
        <WallCanvas
          hubs={hubs}
          findings={findings}
          problemCpk={0.78}
          eventsPerWeek={42}
          onProposeHypothesis={(fid, name) => {
            const hub = createHypothesis(name, '', [fid]);
            setHubs(prev => [...prev, hub]);
            setFindings(prev => prev);
          }}
        />
      );
    }
    render(<Harness />);

    expect(screen.queryByText(/Coolant recirculation lag/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /what might cause this\?/i }));
    fireEvent.change(screen.getByLabelText(/what might cause this\?/i), {
      target: { value: 'Coolant recirculation lag' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create hypothesis/i }));

    expect(screen.getByText(/Coolant recirculation lag/i)).toBeTruthy();
  });
});
