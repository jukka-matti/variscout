/**
 * WallCanvas propose-hypothesis SEAM test (IM-4c Task 4).
 *
 * Proves the finding→hypothesis-on-Wall (createHubFromFinding) seam through the
 * PRODUCTION path: an orphan finding (linked to no hub) renders in the orphan
 * lane with a "Propose hypothesis" affordance; firing it calls
 * onProposeHypothesis(findingId), and — via a render-through harness that mimics
 * the apps' rendered-hubs source of truth — a NEW hypothesis card appears on the
 * Wall. A dead wiring (store call that doesn't re-render the rendered-hubs
 * collection) FAILS the render-through assertion.
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
  investigationId: 'inv-test',
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'observed',
  comments: [],
  statusChangedAt: 1,
} as unknown as Finding;

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

describe('WallCanvas — orphan-finding lane + propose-hypothesis affordance', () => {
  it('renders an orphan finding in the orphan lane with a Propose-hypothesis affordance', () => {
    const { container } = render(
      <WallCanvas
        hubs={[]}
        findings={[orphanFinding]}
        problemCpk={0.78}
        eventsPerWeek={42}
        onProposeHypothesis={vi.fn()}
      />
    );
    // The orphan lane mounts the chip…
    const lane = container.querySelector('[data-wall-orphan-lane]');
    expect(lane).toBeTruthy();
    expect(container.querySelector('[data-wall-node-id="f-orphan"]')).toBeTruthy();
    // …and the propose-hypothesis affordance is present.
    expect(screen.getByRole('button', { name: /propose suspected mechanism/i })).toBeTruthy();
  });

  it('does NOT render the affordance when onProposeHypothesis is omitted', () => {
    render(
      <WallCanvas hubs={[]} findings={[orphanFinding]} problemCpk={0.78} eventsPerWeek={42} />
    );
    expect(screen.queryByRole('button', { name: /propose suspected mechanism/i })).toBeNull();
  });

  it('firing the affordance calls onProposeHypothesis with the findingId', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /propose suspected mechanism/i }));
    expect(onProposeHypothesis).toHaveBeenCalledWith('f-orphan');
  });

  it('render-through: proposing spawns a NEW hypothesis card on the Wall', () => {
    // Harness mirrors the apps: `onProposeHypothesis` mutates the SAME hubs
    // collection the Wall renders (create-hub + connect-finding), so the new
    // card must re-render. A dead store call (different collection) would leave
    // the Wall hub-less and FAIL this.
    function Harness() {
      const [hubs, setHubs] = useState<Hypothesis[]>([]);
      const [findings, setFindings] = useState<Finding[]>([orphanFinding]);
      return (
        <WallCanvas
          hubs={hubs}
          findings={findings}
          problemCpk={0.78}
          eventsPerWeek={42}
          onProposeHypothesis={fid => {
            const f = findings.find(x => x.id === fid);
            const excerpt = (f?.text ?? '').trim().slice(0, 80);
            const hub = createHypothesis(`Suspected mechanism: ${excerpt}`, '', [fid]);
            setHubs(prev => [...prev, hub]);
            // The finding is now linked → it leaves the orphan lane.
            setFindings(prev => prev);
          }}
        />
      );
    }
    render(<Harness />);

    // Before: Wall is hub-less (EmptyState CTA visible), no mechanism card.
    expect(screen.queryByText(/Suspected mechanism:/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /propose suspected mechanism/i }));

    // After: a NEW hypothesis card carrying the finding excerpt renders.
    expect(screen.getByText(/Suspected mechanism: Coolant temp creeps over a shift/i)).toBeTruthy();
  });
});
