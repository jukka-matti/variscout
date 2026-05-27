import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcessHubControlRegion from '../ProcessHubControlRegion';
import type {
  ProcessHubCadenceSummary,
  ProcessHubAnalyze,
  ProcessHubRollup,
  ControlRecord,
} from '@variscout/core';

const HUB = {
  id: 'hub-1',
  name: 'Line 4',
  createdAt: 1735689600000,
  deletedAt: null,
};

function makeInvestigation(
  overrides: Partial<ProcessHubAnalyze> & { id: string; name: string }
): ProcessHubAnalyze {
  return {
    id: overrides.id,
    name: overrides.name,
    createdAt: 1735689600000,
    updatedAt: 1735689600000,
    deletedAt: null,
    metadata: overrides.metadata,
  };
}

function makeEmptyCadence(): ProcessHubCadenceSummary<ProcessHubAnalyze> {
  const emptyQueue = { totalCount: 0, hiddenCount: 0, items: [] };
  return {
    hub: HUB,
    activeAnalyzeCount: 0,
    latestActivity: null,
    snapshot: {
      active: 0,
      readiness: 0,
      verification: 0,
      overdueActions: 0,
      control: 0,
      latestSignals: 0,
      nextMoves: 0,
    },
    latestSignals: emptyQueue,
    latestEvidenceSignals: { totalCount: 0, hiddenCount: 0, items: [] },
    readiness: emptyQueue,
    verification: emptyQueue,
    actions: emptyQueue,
    control: emptyQueue,
    nextMoves: emptyQueue,
    activeWork: {
      quick: emptyQueue,
      focused: emptyQueue,
      chartered: emptyQueue,
    },
  } as ProcessHubCadenceSummary<ProcessHubAnalyze>;
}

function makeEmptyRollup(analyzes: ProcessHubAnalyze[] = []): ProcessHubRollup<ProcessHubAnalyze> {
  return {
    hub: HUB,
    analyzes,
    activeAnalyzeCount: analyzes.length,
    statusCounts: {},
    depthCounts: {},
    overdueActionCount: 0,
    latestActivity: null,
    evidenceSnapshots: [],
    controlRecords: [],
    controlHandoffs: [],
  } as ProcessHubRollup<ProcessHubAnalyze>;
}

function makeRecord(analyzeId: string, overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: `rec-${analyzeId}`,
    title: 'Control cadence',
    investigationId: analyzeId,
    hubId: 'hub-1',
    status: 'pending',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'monthly',
    createdAt: 1735689600000, // 2026-01-01T00:00:00.000Z
    updatedAt: 1735689600000, // 2026-01-01T00:00:00.000Z
    deletedAt: null,
    ...overrides,
  };
}

const noOp = vi.fn();

describe('ProcessHubControlRegion', () => {
  it('renders the empty-state line when there are no eligible analyzes', () => {
    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([
      makeInvestigation({
        id: 'inv-1',
        name: 'Fill Weight',
        metadata: { analyzeStatus: 'scouting' },
      }),
    ]);

    render(
      <ProcessHubControlRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(
      screen.getByText('No control items yet — analyzes move here once resolved or controlled.')
    ).toBeInTheDocument();
  });

  it('renders the setup prompt for a resolved analyze with no control metadata', () => {
    const onSetupControl = vi.fn();
    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([
      makeInvestigation({
        id: 'inv-2',
        name: 'Syringe Barrel',
        metadata: { analyzeStatus: 'resolved' },
      }),
    ]);

    render(
      <ProcessHubControlRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupControl={onSetupControl}
        onLogReview={noOp}
      />
    );

    expect(screen.getByText('Syringe Barrel')).toBeInTheDocument();
    expect(screen.getByText('Set up control cadence')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Set up control cadence for Syringe Barrel/ })
    );
    expect(onSetupControl).toHaveBeenCalledWith('inv-2');
  });

  it('renders the overdue bucket when a record is past due, calls onLogReview with the recordId', () => {
    const onLogReview = vi.fn();
    const inv = makeInvestigation({
      id: 'inv-3',
      name: 'Coffee Moisture',
      metadata: {
        analyzeStatus: 'controlled',
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
    rollup.controlRecords = [
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
        status: 'operational',
        surface: 'qms-procedure',
        systemName: 'QMS',
        operationalOwner: { displayName: 'Alice' },
        handoffDate: 1740787200000, // 2026-03-01T00:00:00.000Z
        description: 'Procedure updated',
        retainControlReview: true,
        createdAt: 1740787200000, // 2026-03-01T00:00:00.000Z (formerly recordedAt)
        deletedAt: null,
        recordedBy: { displayName: 'Alice' },
      },
    ];

    render(
      <ProcessHubControlRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupControl={noOp}
        onLogReview={onLogReview}
      />
    );

    expect(screen.getByText('Coffee Moisture')).toBeInTheDocument();
    expect(screen.getByText(/Holding/)).toBeInTheDocument();
    expect(screen.getByTestId('control-overdue')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Log overdue control review for Coffee Moisture/,
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
        analyzeStatus: 'resolved',
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
    rollup.controlRecords = [
      makeRecord('inv-recent', {
        id: 'rec-recent',
        nextReviewDue: oneMonthFromNow,
        latestReviewAt: sevenDaysAgo,
        latestVerdict: 'holding',
      }),
    ];

    render(
      <ProcessHubControlRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(screen.getByTestId('control-recently-reviewed')).toBeInTheDocument();
    expect(screen.getByText('Pasteurizer Temp')).toBeInTheDocument();
  });

  it('hides all control buckets when a controlled analyze has retainControlReview=false', () => {
    const inv = makeInvestigation({
      id: 'inv-5',
      name: 'Pressure Drop',
      metadata: {
        analyzeStatus: 'controlled',
        sustainment: {
          recordId: 'rec-xyz',
          cadence: 'quarterly',
          nextReviewDue: '2026-04-01T00:00:00.000Z',
        },
      },
    });

    const cadence = makeEmptyCadence();
    const rollup = makeEmptyRollup([inv]);
    rollup.controlRecords = [
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
        status: 'operational',
        surface: 'dashboard-only',
        systemName: 'Dashboard',
        operationalOwner: { displayName: 'Bob' },
        handoffDate: 1742000000000, // 2026-03-15T~
        description: 'Dashboard monitoring in place',
        retainControlReview: false,
        createdAt: 1742000000000, // (formerly recordedAt)
        deletedAt: null,
        recordedBy: { displayName: 'Bob' },
      },
    ];

    render(
      <ProcessHubControlRegion
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(screen.queryByTestId('control-overdue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-due')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-recently-reviewed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-handoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Set up control cadence')).not.toBeInTheDocument();
    expect(
      screen.getByText('No control items yet — analyzes move here once resolved or controlled.')
    ).toBeInTheDocument();
  });
});
