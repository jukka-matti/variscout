/**
 * WallCanvas re-ingest pending-match SEAM test (PR-CS-11 Task 6, Step 1).
 *
 * Proves the three new planning props — `pendingMatchByPlanId`, `onSetPlanStatus`,
 * `onDismissPendingMatch` — are threaded through the PRODUCTION WallCanvas path to
 * the REAL MeasurementPlanChip (via the real HypothesisCardWithPlans). NOT a leaf
 * with injected props: WallCanvas receives the planning bag, filters plans to the
 * hub, and mounts the chip.
 *
 * The chip↔callback contract itself is covered by MeasurementPlanChip.pendingMatch
 * (Task 5). This file is the WALL-LEVEL seam: a dead pass-through (prop dropped in
 * WallCanvas / HypothesisCardWithPlans) FAILS these even though the chip test stays
 * green.
 *
 * Negative control: a pending match keyed on a DIFFERENT plan id must NOT surface a
 * prompt on this plan — proves the planId→{id,column} keying is honoured end-to-end,
 * not a "render the prompt whenever any match exists" stub.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasPlanningProps } from '../WallCanvas';
import {
  getCanvasViewportInitialState,
  useViewStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { DataRow, Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState({ focusedWallEntityId: null });
});

function makeHub(): Hypothesis {
  const hub = createHypothesis('Night shift runs hot', '', []);
  return {
    ...hub,
    id: 'hub-1',
    condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
  };
}

function rows(): DataRow[] {
  return [
    { SHIFT: 'Day', Y: 10 },
    { SHIFT: 'Night', Y: 30 },
  ];
}

function planFor(hubId: string): MeasurementPlan {
  return {
    id: 'plan-1',
    createdAt: 100,
    deletedAt: null,
    hypothesisId: hubId,
    outcome: 'Y',
    primaryFactor: 'spindle vibration',
    neededFactors: ['nozzle-temp'],
    method: 'sensor',
    sampleSize: 30,
    owner: 'pm-alice',
    status: 'planned',
    scope: [],
    processLocation: '',
  };
}

function basePlanningProps(overrides?: Partial<WallCanvasPlanningProps>): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [], // open-access (V1 single-user)
    currentUserId: null,
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

describe('WallCanvas — re-ingest pending-match seam', () => {
  it('threads pendingMatchByPlanId through to the real chip prompt (keyed by planId)', () => {
    const hub = makeHub();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({
          plans: [planFor(hub.id)],
          onSetPlanStatus: vi.fn(),
          onDismissPendingMatch: vi.fn(),
          pendingMatchByPlanId: { 'plan-1': { id: 'plan-1:nozzle-temp', column: 'nozzle-temp' } },
        })}
      />
    );
    const prompt = screen.getByTestId('pending-match-prompt');
    expect(prompt).toBeTruthy();
    // The arrived column name reached the chip through the production path.
    expect(prompt.textContent).toMatch(/nozzle-temp/);
  });

  it('NEGATIVE CONTROL: a match keyed on a different plan id surfaces no prompt here', () => {
    const hub = makeHub();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({
          plans: [planFor(hub.id)],
          onSetPlanStatus: vi.fn(),
          onDismissPendingMatch: vi.fn(),
          // Match keyed on a plan that is NOT plan-1 → this chip stays quiet.
          pendingMatchByPlanId: {
            'other-plan': { id: 'other-plan:nozzle-temp', column: 'nozzle-temp' },
          },
        })}
      />
    );
    expect(screen.queryByTestId('pending-match-prompt')).toBeNull();
  });

  it('fires onSetPlanStatus(planId, status) from the threaded status select', () => {
    const onSetPlanStatus = vi.fn();
    const hub = makeHub();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({
          plans: [planFor(hub.id)],
          onSetPlanStatus,
          onDismissPendingMatch: vi.fn(),
          pendingMatchByPlanId: {},
        })}
      />
    );
    // NEGATIVE CONTROL — no auto-anything: mounting must not dispatch.
    expect(onSetPlanStatus).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('plan-status-select'), {
      target: { value: 'complete' },
    });
    expect(onSetPlanStatus).toHaveBeenCalledWith('plan-1', 'complete');
  });

  it('fires onDismissPendingMatch(id) from the threaded prompt dismiss control', () => {
    const onDismissPendingMatch = vi.fn();
    const hub = makeHub();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({
          plans: [planFor(hub.id)],
          onSetPlanStatus: vi.fn(),
          onDismissPendingMatch,
          pendingMatchByPlanId: { 'plan-1': { id: 'plan-1:nozzle-temp', column: 'nozzle-temp' } },
        })}
      />
    );
    fireEvent.click(screen.getByTestId('pending-match-dismiss'));
    expect(onDismissPendingMatch).toHaveBeenCalledWith('plan-1:nozzle-temp');
  });

  it('no prompt + no status select when the planning props are omitted (quiet default)', () => {
    const hub = makeHub();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({ plans: [planFor(hub.id)] })}
      />
    );
    expect(screen.queryByTestId('pending-match-prompt')).toBeNull();
    expect(screen.queryByTestId('plan-status-select')).toBeNull();
  });
});
