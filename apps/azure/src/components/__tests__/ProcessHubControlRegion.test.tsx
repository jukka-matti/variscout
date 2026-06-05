import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcessHubControlRegion from '../ProcessHubControlRegion';
import type { ControlRecord, ControlHandoff } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

// PR-PO-2: the Control region is project-keyed and reads FACTS (control
// artifacts + lifecycle status), not the free-text analyzeStatus label. The
// Project tab is single-project, so most fixtures pass a single project, but the
// selectors degrade gracefully across any number of projects.

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
    status: 'pending',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'monthly',
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
    status: 'operational',
    surface: 'qms-procedure',
    systemName: 'QMS',
    operationalOwner: { displayName: 'Alice' },
    handoffDate: 1740787200000,
    description: 'Procedure updated',
    retainControlReview: true,
    createdAt: 1740787200000,
    deletedAt: null,
    recordedBy: { displayName: 'Alice' },
    ...overrides,
  };
}

const noOp = vi.fn();
// Anchor for deterministic bucket math.
const NOW = new Date('2026-05-01T00:00:00.000Z');

describe('ProcessHubControlRegion', () => {
  it('renders the empty-state line when no project is control-eligible', () => {
    // active project, no control artifacts → not eligible → empty state.
    const projects = [makeProject({ id: 'p-1', title: 'Fill Weight', status: 'active' })];

    render(
      <ProcessHubControlRegion
        projects={projects}
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
    const projects = [makeProject({ id: 'p-2', title: 'Syringe Barrel', status: 'closed' })];

    render(
      <ProcessHubControlRegion
        projects={projects}
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

  it('renders the overdue bucket when a record is past due, calls onLogReview with the recordId', () => {
    const onLogReview = vi.fn();
    const projects = [makeProject({ id: 'p-3', title: 'Coffee Moisture', status: 'closed' })];
    const records = [
      makeRecord('p-3', {
        id: 'rec-abc',
        nextReviewDue: '2026-04-20T00:00:00.000Z', // before NOW → overdue
        latestVerdict: 'holding',
      }),
    ];
    const handoffs = [makeHandoff('inv-p-3', { retainControlReview: true })];

    render(
      <ProcessHubControlRegion
        projects={projects}
        records={records}
        handoffs={handoffs}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={onLogReview}
      />
    );

    expect(screen.getByText('Coffee Moisture')).toBeInTheDocument();
    expect(screen.getByText(/Holding/)).toBeInTheDocument();
    expect(screen.getByTestId('control-overdue')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Log overdue control review for Coffee Moisture/ })
    );
    expect(onLogReview).toHaveBeenCalledWith('rec-abc');
  });

  it('renders the recently-reviewed bucket for a not-yet-due record with a recent review', () => {
    const sevenDaysAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthFromNow = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const projects = [makeProject({ id: 'p-recent', title: 'Pasteurizer Temp', status: 'closed' })];
    const records = [
      makeRecord('p-recent', {
        id: 'rec-recent',
        nextReviewDue: oneMonthFromNow,
        latestReviewAt: sevenDaysAgo,
        latestVerdict: 'holding',
      }),
    ];

    render(
      <ProcessHubControlRegion
        projects={projects}
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

  it('hides all control buckets when a controlled project has a retainControlReview=false handoff', () => {
    const projects = [makeProject({ id: 'p-5', title: 'Pressure Drop', status: 'closed' })];
    const records = [
      makeRecord('p-5', {
        id: 'rec-xyz',
        cadence: 'quarterly',
        nextReviewDue: '2026-04-01T00:00:00.000Z', // overdue but opted-out
      }),
    ];
    const handoffs = [
      makeHandoff('inv-p-5', {
        id: 'ho-2',
        surface: 'dashboard-only',
        systemName: 'Dashboard',
        operationalOwner: { displayName: 'Bob' },
        retainControlReview: false,
        recordedBy: { displayName: 'Bob' },
      }),
    ];

    render(
      <ProcessHubControlRegion
        projects={projects}
        records={records}
        handoffs={handoffs}
        renderDate={NOW}
        onOpenProject={noOp}
        onSetupControl={noOp}
        onLogReview={noOp}
      />
    );

    expect(screen.queryByTestId('control-overdue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-due')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-recently-reviewed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('control-setup')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'No control items yet — projects move here once they reach the Control stage.'
      )
    ).toBeInTheDocument();
  });

  it('NEGATIVE CONTROL — the label cannot lie: an active project with no record/handoff renders NO setup candidate', () => {
    // Pre-PO-2 a 'resolved' analyzeStatus label could have surfaced a setup
    // prompt. The label is gone: eligibility now reads FACTS, so an 'active'
    // project with zero control artifacts is NOT eligible → no setup candidate,
    // just empty state.
    const projects = [makeProject({ id: 'p-lie', title: 'Label Lies', status: 'active' })];

    render(
      <ProcessHubControlRegion
        projects={projects}
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
