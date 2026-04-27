import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcessHubSustainmentRegion from '../ProcessHubSustainmentRegion';
import type {
  ProcessHubCadenceSummary,
  ProcessHubInvestigation,
  ProcessHubRollup,
} from '@variscout/core';

const HUB = {
  id: 'hub-1',
  name: 'Line 4',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeInvestigation(
  overrides: Partial<ProcessHubInvestigation> & { id: string; name: string }
): ProcessHubInvestigation {
  return {
    id: overrides.id,
    name: overrides.name,
    modified: '2026-01-01T00:00:00.000Z',
    metadata: overrides.metadata,
  };
}

function makeEmptyCadence(): ProcessHubCadenceSummary<ProcessHubInvestigation> {
  const emptyQueue = { totalCount: 0, hiddenCount: 0, items: [] };
  return {
    hub: HUB,
    activeInvestigationCount: 0,
    latestActivity: null,
    snapshot: {
      active: 0,
      readiness: 0,
      verification: 0,
      overdueActions: 0,
      sustainment: 0,
      latestSignals: 0,
      nextMoves: 0,
    },
    latestSignals: emptyQueue,
    latestEvidenceSignals: { totalCount: 0, hiddenCount: 0, items: [] },
    readiness: emptyQueue,
    verification: emptyQueue,
    actions: emptyQueue,
    sustainment: emptyQueue,
    nextMoves: emptyQueue,
    activeWork: {
      quick: emptyQueue,
      focused: emptyQueue,
      chartered: emptyQueue,
    },
  } as ProcessHubCadenceSummary<ProcessHubInvestigation>;
}

function makeEmptyRollup(
  investigations: ProcessHubInvestigation[] = []
): ProcessHubRollup<ProcessHubInvestigation> {
  return {
    hub: HUB,
    investigations,
    activeInvestigationCount: investigations.length,
    statusCounts: {},
    depthCounts: {},
    overdueActionCount: 0,
    latestActivity: null,
    evidenceSnapshots: [],
    sustainmentRecords: [],
    controlHandoffs: [],
  } as ProcessHubRollup<ProcessHubInvestigation>;
}

const noOp = vi.fn();

describe('ProcessHubSustainmentRegion', () => {
  it('renders the empty-state line when there are no eligible investigations', () => {
    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([
      makeInvestigation({
        id: 'inv-1',
        name: 'Fill Weight',
        metadata: { investigationStatus: 'scouting' },
      }),
    ]);

    render(
      <ProcessHubSustainmentRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupSustainment={noOp}
        onLogReview={noOp}
        onRecordHandoff={noOp}
      />
    );

    expect(
      screen.getByText(
        'No sustainment items yet — investigations move here once resolved or controlled.'
      )
    ).toBeInTheDocument();
  });

  it('renders the setup prompt for a resolved investigation with no sustainment metadata', () => {
    const onSetupSustainment = vi.fn();
    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([
      makeInvestigation({
        id: 'inv-2',
        name: 'Syringe Barrel',
        metadata: { investigationStatus: 'resolved' },
      }),
    ]);

    render(
      <ProcessHubSustainmentRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupSustainment={onSetupSustainment}
        onLogReview={noOp}
        onRecordHandoff={noOp}
      />
    );

    expect(screen.getByText('Syringe Barrel')).toBeInTheDocument();
    expect(screen.getByText('Set up sustainment cadence')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Set up sustainment cadence for Syringe Barrel/ })
    );
    expect(onSetupSustainment).toHaveBeenCalledWith('inv-2');
  });

  it('renders the sustainment-due queue and calls onLogReview when a recordId is present', () => {
    const onLogReview = vi.fn();
    const inv = makeInvestigation({
      id: 'inv-3',
      name: 'Coffee Moisture',
      metadata: {
        investigationStatus: 'controlled',
        sustainment: {
          recordId: 'rec-abc',
          cadence: 'monthly',
          nextReviewDue: '2026-04-20T00:00:00.000Z',
          latestVerdict: 'holding',
        },
      },
    });

    const cadence = makeEmptyCadence();
    cadence.sustainment = {
      totalCount: 1,
      hiddenCount: 0,
      items: [
        {
          investigation: inv,
          reasons: ['sustainment-due'],
          readinessReasons: [],
          overdueActionCount: 0,
          changeSignalCount: 0,
          nextMove: undefined,
        },
      ],
    } as unknown as typeof cadence.sustainment;

    const rollup = makeEmptyRollup([inv]);
    rollup.controlHandoffs = [
      {
        id: 'ho-1',
        investigationId: 'inv-3',
        hubId: 'hub-1',
        surface: 'qms-procedure',
        systemName: 'QMS',
        operationalOwner: { displayName: 'Alice' },
        handoffDate: '2026-03-01T00:00:00.000Z',
        description: 'Procedure updated',
        retainSustainmentReview: true,
        recordedAt: '2026-03-01T00:00:00.000Z',
        recordedBy: { displayName: 'Alice' },
      },
    ];

    render(
      <ProcessHubSustainmentRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupSustainment={noOp}
        onLogReview={onLogReview}
        onRecordHandoff={noOp}
      />
    );

    expect(screen.getByText('Coffee Moisture')).toBeInTheDocument();
    expect(screen.getByText(/Holding/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Log sustainment review for Coffee Moisture/ })
    );
    expect(onLogReview).toHaveBeenCalledWith('rec-abc');
  });

  it('renders handoff candidates and calls onRecordHandoff on click', () => {
    const onRecordHandoff = vi.fn();
    const inv = makeInvestigation({
      id: 'inv-4',
      name: 'Torque Study',
      metadata: { investigationStatus: 'controlled' },
    });

    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([inv]);

    render(
      <ProcessHubSustainmentRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupSustainment={noOp}
        onLogReview={noOp}
        onRecordHandoff={onRecordHandoff}
      />
    );

    expect(screen.getByText('Torque Study')).toBeInTheDocument();
    expect(screen.getByText('Needs control handoff')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Record control handoff for Torque Study/ })
    );
    expect(onRecordHandoff).toHaveBeenCalledWith('inv-4');
  });

  it('hides sustainment-due section when a controlled investigation has retainSustainmentReview=false', () => {
    const inv = makeInvestigation({
      id: 'inv-5',
      name: 'Pressure Drop',
      metadata: {
        investigationStatus: 'controlled',
        sustainment: {
          recordId: 'rec-xyz',
          cadence: 'quarterly',
          nextReviewDue: '2026-04-01T00:00:00.000Z',
        },
      },
    });

    // The sustainment-due queue is empty because selectSustainmentReviews filtered it out
    const cadence = makeEmptyCadence();

    const rollup = makeEmptyRollup([inv]);
    rollup.controlHandoffs = [
      {
        id: 'ho-2',
        investigationId: 'inv-5',
        hubId: 'hub-1',
        surface: 'dashboard-only',
        systemName: 'Dashboard',
        operationalOwner: { displayName: 'Bob' },
        handoffDate: '2026-03-15T00:00:00.000Z',
        description: 'Dashboard monitoring in place',
        retainSustainmentReview: false,
        recordedAt: '2026-03-15T00:00:00.000Z',
        recordedBy: { displayName: 'Bob' },
      },
    ];

    render(
      <ProcessHubSustainmentRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupSustainment={noOp}
        onLogReview={noOp}
        onRecordHandoff={noOp}
      />
    );

    // sustainment-due section should be absent (cadence.sustainment.totalCount === 0)
    expect(screen.queryByText('Sustainment due')).not.toBeInTheDocument();
    // handoff section absent (has a handoff record)
    expect(screen.queryByText('Needs control handoff')).not.toBeInTheDocument();
    // investigation has a sustainment projection, so no setup prompt either
    expect(screen.queryByText('Set up sustainment cadence')).not.toBeInTheDocument();
    // empty state should appear
    expect(
      screen.getByText(
        'No sustainment items yet — investigations move here once resolved or controlled.'
      )
    ).toBeInTheDocument();
  });
});
