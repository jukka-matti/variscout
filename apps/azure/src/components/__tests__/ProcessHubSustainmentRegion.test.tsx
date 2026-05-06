import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcessHubSustainmentRegion from '../ProcessHubSustainmentRegion';
import type {
  ProcessHubCadenceSummary,
  ProcessHubInvestigation,
  ProcessHubRollup,
  SustainmentRecord,
} from '@variscout/core';

const HUB = {
  id: 'hub-1',
  name: 'Line 4',
  createdAt: 1735689600000,
  deletedAt: null,
};

function makeInvestigation(
  overrides: Partial<ProcessHubInvestigation> & { id: string; name: string }
): ProcessHubInvestigation {
  return {
    id: overrides.id,
    name: overrides.name,
    createdAt: 1735689600000,
    updatedAt: 1735689600000,
    deletedAt: null,
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

function makeRecord(
  investigationId: string,
  overrides: Partial<SustainmentRecord> = {}
): SustainmentRecord {
  return {
    id: `rec-${investigationId}`,
    investigationId,
    hubId: 'hub-1',
    cadence: 'monthly',
    createdAt: 1735689600000, // 2026-01-01T00:00:00.000Z
    updatedAt: 1735689600000, // 2026-01-01T00:00:00.000Z
    deletedAt: null,
    ...overrides,
  };
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

  it('renders the overdue bucket when a record is past due, calls onLogReview with the recordId', () => {
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
    const rollup = makeEmptyRollup([inv]);
    rollup.sustainmentRecords = [
      makeRecord('inv-3', {
        id: 'rec-abc',
        nextReviewDue: '2026-04-20T00:00:00.000Z',
        latestVerdict: 'holding',
      }),
    ];
    rollup.controlHandoffs = [
      {
        id: 'ho-1',
        investigationId: 'inv-3',
        hubId: 'hub-1',
        surface: 'qms-procedure',
        systemName: 'QMS',
        operationalOwner: { displayName: 'Alice' },
        handoffDate: 1740787200000, // 2026-03-01T00:00:00.000Z
        description: 'Procedure updated',
        retainSustainmentReview: true,
        createdAt: 1740787200000, // 2026-03-01T00:00:00.000Z (formerly recordedAt)
        deletedAt: null,
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
    expect(screen.getByTestId('sustainment-overdue')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Log overdue sustainment review for Coffee Moisture/,
      })
    );
    expect(onLogReview).toHaveBeenCalledWith('rec-abc');
  });

  it('renders the recently-reviewed bucket for a not-yet-due record with a recent review', () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const inv = makeInvestigation({
      id: 'inv-recent',
      name: 'Pasteurizer Temp',
      metadata: {
        investigationStatus: 'resolved',
        sustainment: {
          recordId: 'rec-recent',
          cadence: 'monthly',
          nextReviewDue: oneMonthFromNow,
          latestVerdict: 'holding',
        },
      },
    });

    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([inv]);
    rollup.sustainmentRecords = [
      makeRecord('inv-recent', {
        id: 'rec-recent',
        nextReviewDue: oneMonthFromNow,
        latestReviewAt: sevenDaysAgo,
        latestVerdict: 'holding',
      }),
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

    expect(screen.getByTestId('sustainment-recently-reviewed')).toBeInTheDocument();
    expect(screen.getByText('Pasteurizer Temp')).toBeInTheDocument();
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

  it('hides all sustainment buckets when a controlled investigation has retainSustainmentReview=false', () => {
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

    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([inv]);
    rollup.sustainmentRecords = [
      makeRecord('inv-5', {
        id: 'rec-xyz',
        cadence: 'quarterly',
        nextReviewDue: '2026-04-01T00:00:00.000Z',
      }),
    ];
    rollup.controlHandoffs = [
      {
        id: 'ho-2',
        investigationId: 'inv-5',
        hubId: 'hub-1',
        surface: 'dashboard-only',
        systemName: 'Dashboard',
        operationalOwner: { displayName: 'Bob' },
        handoffDate: 1742000000000, // 2026-03-15T~
        description: 'Dashboard monitoring in place',
        retainSustainmentReview: false,
        createdAt: 1742000000000, // (formerly recordedAt)
        deletedAt: null,
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

    expect(screen.queryByTestId('sustainment-overdue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sustainment-due')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sustainment-recently-reviewed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sustainment-handoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Set up sustainment cadence')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'No sustainment items yet — investigations move here once resolved or controlled.'
      )
    ).toBeInTheDocument();
  });
});
