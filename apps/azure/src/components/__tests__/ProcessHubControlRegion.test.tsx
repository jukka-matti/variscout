import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ControlRecord, ControlHandoff } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { useSustainmentComparison } from '@variscout/hooks';
import ProcessHubControlRegion from '../ProcessHubControlRegion';

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    ControlVerificationBand: (props: {
      record: ControlRecord;
      rawData?: unknown[];
      timeColumn?: string | null;
      onLogReview?: (recordId: string) => void;
    }) =>
      React.createElement(
        'section',
        { 'data-testid': 'verification-band' },
        React.createElement('p', null, props.record.title),
        React.createElement('p', null, `Rows ${props.rawData?.length ?? 0}`),
        React.createElement('p', null, `Time ${props.timeColumn ?? 'none'}`),
        React.createElement(
          'button',
          { type: 'button', onClick: () => props.onLogReview?.(props.record.id) },
          'Band log re-check'
        )
      ),
  };
});

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useSustainmentComparison: vi.fn(),
  };
});

// Single-project Control status — the region now accepts a single `project` prop
// (not an array). All status derivation uses per-record predicates directly.

function makeProject({
  id,
  title,
  ...overrides
}: Partial<ImprovementProject> & { id: string; title: string }): ImprovementProject {
  return {
    id,
    hubId: 'hub-1',
    createdAt: 1735689600000,
    updatedAt: 1735689600000,
    deletedAt: null,
    status: 'active',
    goal: { outcomeGoals: [] },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
    metadata: { title, ...(overrides.metadata ?? {}) },
  };
}

function makeRecord(projectId: string, overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: `rec-${projectId}`,
    title: 'Control cadence',
    projectId: `inv-${projectId}`,
    improvementProjectId: projectId,
    hubId: 'hub-1',
    status: 'verifying',
    improvementDate: '2026-04-01T00:00:00.000Z',
    baseline: {
      capturedAt: 1735689600000,
      window: {
        startISO: '2026-03-01T00:00:00.000Z',
        endISO: '2026-03-31T23:59:59.999Z',
      },
      measure: 'metric',
      n: 12,
      mean: 1,
      sigma: 0.1,
    },
    ladder: [7, 30, 90],
    ladderStep: 0,
    lastEvaluatedSnapshotId: undefined,
    createdAt: 1735689600000, // 2026-01-01T00:00:00.000Z
    updatedAt: 1735689600000,
    deletedAt: null,
    ...overrides,
  };
}

function makeHandoff(projectId: string, overrides: Partial<ControlHandoff> = {}): ControlHandoff {
  return {
    id: `ho-${projectId}`,
    projectId,
    hubId: 'hub-1',
    surface: 'qms-procedure',
    systemName: 'QMS',
    operationalOwner: { displayName: 'Alice' },
    handoffDate: 1740787200000,
    description: 'Procedure updated',
    createdAt: 1740787200000,
    deletedAt: null,
    recordedBy: { displayName: 'Alice' },
    ...overrides,
  };
}

const noOp = vi.fn();
// Anchor for deterministic status math.
const NOW = new Date('2026-05-01T00:00:00.000Z');
const mockUseSustainmentComparison = vi.mocked(useSustainmentComparison);

describe('ProcessHubControlRegion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSustainmentComparison.mockReturnValue(null);
  });

  it('renders the empty-state line when no project is control-eligible', () => {
    // active project, no control artifacts → not eligible → empty state.
    const project = makeProject({ id: 'p-1', title: 'Fill Weight', status: 'active' });

    render(
      <ProcessHubControlRegion
        project={project}
        records={[]}
        handoffs={[]}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(
      screen.getByText(
        'No control items yet — projects move here once they reach the Control stage.'
      )
    ).toBeInTheDocument();
  });

  it('renders the empty-state line when project is null', () => {
    render(
      <ProcessHubControlRegion
        project={null}
        records={[]}
        handoffs={[]}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(
      screen.getByText(
        'No control items yet — projects move here once they reach the Control stage.'
      )
    ).toBeInTheDocument();
  });

  it('renders the setup prompt for an eligible-but-not-controlled project (closed, no record)', () => {
    const onSetupControl = vi.fn();
    // Closed lifecycle status makes it control-eligible by FACT, even with no
    // record yet → it surfaces as a setup candidate (facts, not the label).
    const project = makeProject({ id: 'p-2', title: 'Syringe Barrel', status: 'closed' });

    render(
      <ProcessHubControlRegion
        project={project}
        records={[]}
        handoffs={[]}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={onSetupControl}
        onLogReview={noOp}
      />
    );

    expect(screen.getByText('Syringe Barrel')).toBeInTheDocument();
    expect(screen.getByText('Set up control cadence')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Set up control cadence for Syringe Barrel/ })
    );
    expect(onSetupControl).toHaveBeenCalledWith('p-2');
  });

  it('renders the suggested status when a record reaches its re-check suggestion', () => {
    const onLogReview = vi.fn();
    const project = makeProject({ id: 'p-3', title: 'Coffee Moisture', status: 'closed' });
    const records = [
      makeRecord('p-3', {
        id: 'rec-abc',
        nextCheckSuggestedAt: '2026-04-20T00:00:00.000Z',
      }),
    ];
    const handoffs = [makeHandoff('inv-p-3')];

    render(
      <ProcessHubControlRegion
        project={project}
        records={records}
        handoffs={handoffs}
        rawData={[{ captured_at: '2026-04-21T00:00:00.000Z', metric: 1.2 }]}
        timeColumn="captured_at"
        specs={{ lsl: 0, usl: 2 }}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={onLogReview}
      />
    );

    expect(screen.getByText('Coffee Moisture')).toBeInTheDocument();
    expect(screen.getByTestId('control-suggested')).toBeInTheDocument();
    expect(screen.getByTestId('verification-band')).toHaveTextContent('Rows 1');
    expect(mockUseSustainmentComparison).toHaveBeenCalledWith({
      rows: [{ captured_at: '2026-04-21T00:00:00.000Z', metric: 1.2 }],
      timeColumn: 'captured_at',
      specs: { lsl: 0, usl: 2 },
      record: records[0],
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Log control re-check for Coffee Moisture/ })
    );
    expect(onLogReview).toHaveBeenCalledWith('rec-abc');

    fireEvent.click(screen.getByRole('button', { name: 'Band log re-check' }));
    expect(onLogReview).toHaveBeenCalledWith('rec-abc');
  });

  it('renders the recently-reviewed status for a not-yet-due record with a recent review', () => {
    const sevenDaysAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthFromNow = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const project = makeProject({ id: 'p-recent', title: 'Pasteurizer Temp', status: 'closed' });
    const records = [
      makeRecord('p-recent', {
        id: 'rec-recent',
        nextCheckSuggestedAt: oneMonthFromNow,
        latestReviewAt: sevenDaysAgo,
      }),
    ];

    render(
      <ProcessHubControlRegion
        project={project}
        records={records}
        handoffs={[]}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(screen.getByTestId('control-recently-reviewed')).toBeInTheDocument();
    expect(screen.getByText('Pasteurizer Temp')).toBeInTheDocument();
  });

  it('renders suggested state when a controlled project reaches its re-check suggestion', () => {
    const project = makeProject({ id: 'p-5', title: 'Pressure Drop', status: 'closed' });
    const records = [
      makeRecord('p-5', {
        id: 'rec-xyz',
        nextCheckSuggestedAt: '2026-04-01T00:00:00.000Z',
      }),
    ];
    const handoffs = [
      makeHandoff('inv-p-5', {
        id: 'ho-2',
        surface: 'dashboard-only',
        systemName: 'Dashboard',
        operationalOwner: { displayName: 'Bob' },
        recordedBy: { displayName: 'Bob' },
      }),
    ];

    render(
      <ProcessHubControlRegion
        project={project}
        records={records}
        handoffs={handoffs}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(screen.getByTestId('control-suggested')).toBeInTheDocument();
    expect(screen.queryByTestId('control-recently-reviewed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-setup')).not.toBeInTheDocument();
    expect(screen.getByText('Re-check suggested')).toBeInTheDocument();
    expect(screen.getByText('Pressure Drop')).toBeInTheDocument();
  });

  it('NEGATIVE CONTROL — the label cannot lie: an active project with no record/handoff renders NO setup candidate', () => {
    // Pre-PO-2 a 'resolved' analyzeStatus label could have surfaced a setup
    // prompt. The label is gone: eligibility now reads FACTS, so an 'active'
    // project with zero control artifacts is NOT eligible → no setup candidate,
    // just empty state.
    const project = makeProject({ id: 'p-lie', title: 'Label Lies', status: 'active' });

    render(
      <ProcessHubControlRegion
        project={project}
        records={[]}
        handoffs={[]}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(screen.queryByTestId('control-setup')).not.toBeInTheDocument();
    expect(screen.queryByText('Set up control cadence')).not.toBeInTheDocument();
    expect(screen.queryByText('Label Lies')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'No control items yet — projects move here once they reach the Control stage.'
      )
    ).toBeInTheDocument();
  });
});
