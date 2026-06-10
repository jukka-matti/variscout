import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ControlRecord, ControlReview } from '@variscout/core';
import { ControlForm } from '../ControlForm';

const record: ControlRecord = {
  id: 'sustain-1',
  createdAt: Date.UTC(2026, 4, 1),
  deletedAt: null,
  projectId: 'investigation-1',
  hubId: 'hub-1',
  status: 'confirmed-sustained',
  title: 'Reduce scrap sustained',
  improvementDate: '2026-05-01T00:00:00.000Z',
  baseline: {
    capturedAt: Date.UTC(2026, 4, 1),
    window: {
      startISO: '2026-04-01T00:00:00.000Z',
      endISO: '2026-04-30T23:59:59.999Z',
    },
    measure: 'reject-rate',
    n: 30,
    mean: 4.2,
    sigma: 0.7,
  },
  ladder: [7, 30, 90],
  ladderStep: 1,
  nextCheckSuggestedAt: '2026-06-11T00:00:00.000Z',
  goal: {
    outcomeGoals: [
      {
        outcomeSpecId: 'reject-rate',
        baseline: 8.4,
        target: 3.2,
        deadline: '2026-06-30',
      },
    ],
    factorControls: [{ factor: 'Oven temperature', targetCondition: 'Keep between 180 and 185 C' }],
    mechanismGoals: [{ description: 'Operators follow first-piece confirmation' }],
    freeText: 'Hold the improved reject-rate baseline through ramp-up.',
  },
  targetSummary: 'Reject rate stays below 3.2%',
  lastEvaluatedSnapshotId: 'snapshot-2',
  latestReviewAt: '2026-05-12',
  latestReviewId: 'review-2',
  owner: { userId: 'owner-1', displayName: 'Avery Lee' },
  updatedAt: Date.UTC(2026, 4, 12),
};

const reviews: ControlReview[] = [
  {
    id: 'review-2',
    createdAt: Date.UTC(2026, 4, 12),
    deletedAt: null,
    recordId: 'sustain-1',
    projectId: 'investigation-1',
    hubId: 'hub-1',
    reviewedAt: Date.UTC(2026, 4, 12),
    reviewer: { userId: 'reviewer-1', displayName: 'Jordan Chen' },
    verdict: 'holding',
    snapshotId: 'snapshot-2',
    nowStats: {
      window: {
        startISO: '2026-05-01T00:00:00.000Z',
        endISO: '2026-05-31T23:59:59.999Z',
      },
      n: 20,
      mean: 3,
      sigma: 0.5,
    },
    dataStamp: { rowCount: 50, snapshotId: 'snapshot-2' },
    observation: 'Signal remained centered for the weekly check.',
  },
  {
    id: 'review-1',
    createdAt: Date.UTC(2026, 4, 5),
    deletedAt: null,
    recordId: 'sustain-1',
    projectId: 'investigation-1',
    hubId: 'hub-1',
    reviewedAt: Date.UTC(2026, 4, 5),
    reviewer: { userId: 'reviewer-2', displayName: 'Samira Patel' },
    verdict: 'drifted',
    snapshotId: 'snapshot-1',
    nowStats: {
      window: {
        startISO: '2026-05-01T00:00:00.000Z',
        endISO: '2026-05-31T23:59:59.999Z',
      },
      n: 20,
      mean: 4,
      sigma: 0.8,
    },
    dataStamp: { rowCount: 50, snapshotId: 'snapshot-1' },
    observation: 'One shift had a weak handoff.',
  },
];

describe('ControlForm', () => {
  const rawData = [
    { captured_at: '2026-04-01T00:00:00.000Z', 'reject-rate': 4.1 },
    { captured_at: '2026-04-15T00:00:00.000Z', 'reject-rate': 4.3 },
    { captured_at: '2026-05-02T00:00:00.000Z', 'reject-rate': 3.1 },
    { captured_at: '2026-05-12T00:00:00.000Z', 'reject-rate': 2.9 },
  ];

  it('renders setup, status, re-check logging, review history, and goal summary', () => {
    render(
      <ControlForm
        record={record}
        reviews={reviews}
        rawData={rawData}
        timeColumn="captured_at"
        comparison={{
          before: { source: 'frozen', n: 30, mean: 4.2, sigma: 0.7 },
          after: { n: 2, mean: 3, sigma: 0.2 },
          phases: {
            afterLimits: {
              window: {
                startISO: '2026-05-02T00:00:00.000Z',
                endISO: '2026-05-12T00:00:00.000Z',
              },
              n: 2,
              centerLine: 3,
              ucl: 3.6,
              lcl: 2.4,
            },
          },
          deltas: {},
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Control setup' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Current status' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getAllByRole('button', { name: 'Log re-check' })[0]).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Review history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Goal carry-forward' })).toBeInTheDocument();

    expect(screen.getByLabelText('Title')).toHaveValue('Reduce scrap sustained');
    expect(screen.getByLabelText('Improvement date')).toHaveValue('2026-05-01');
    expect(screen.getByLabelText('Measure binding')).toHaveValue('reject-rate');
    expect(screen.getByLabelText('Ladder interval 1 days')).toHaveValue(7);
    expect(screen.getByLabelText('Ladder interval 2 days')).toHaveValue(30);
    expect(screen.getByLabelText('Ladder interval 3 days')).toHaveValue(90);
    expect(screen.getByText('confirmed sustained')).toBeInTheDocument();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('reject-rate · n=30')).toBeInTheDocument();
    expect(screen.getByText('4 rows · 2026-04-01 to 2026-05-12')).toBeInTheDocument();
    expect(screen.getByText('Signal remained centered for the weekly check.')).toBeInTheDocument();
    expect(screen.getByText('One shift had a weak handoff.')).toBeInTheDocument();
    expect(screen.getByText('Y-level outcome target')).toBeInTheDocument();
    expect(screen.getAllByText('reject-rate').length).toBeGreaterThan(0);
    expect(screen.getByText('X-level factor controls')).toBeInTheDocument();
    expect(screen.getByText('Oven temperature')).toBeInTheDocument();
    expect(screen.getByText('x-level mechanism goals')).toBeInTheDocument();
    expect(screen.getByText('Operators follow first-piece confirmation')).toBeInTheDocument();
  });

  it('freezes the setup preview and sends the saved control patch', () => {
    const onRecordChange = vi.fn();
    render(
      <ControlForm
        record={record}
        reviews={[]}
        rawData={rawData}
        timeColumn="captured_at"
        onRecordChange={onRecordChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated sustainment' } });
    fireEvent.change(screen.getByLabelText('Target summary'), {
      target: { value: 'Updated target summary' },
    });
    fireEvent.change(screen.getByLabelText('Ladder interval 1 days'), { target: { value: '14' } });
    fireEvent.click(screen.getByLabelText('Remove ladder interval 2'));
    fireEvent.click(screen.getByRole('button', { name: 'Save setup and freeze baseline' }));

    expect(onRecordChange).toHaveBeenCalledWith({
      title: 'Updated sustainment',
      targetSummary: 'Updated target summary',
      improvementDate: '2026-05-01T00:00:00.000Z',
      baseline: expect.objectContaining({
        measure: 'reject-rate',
        n: 2,
        mean: expect.closeTo(4.2, 6),
      }),
      ladder: [14, 90],
      ladderStep: 0,
      nextCheckSuggestedAt: '2026-05-15T00:00:00.000Z',
    });
  });

  it('saves setup edits without overwriting the baseline when preview cannot freeze', () => {
    const onRecordChange = vi.fn();
    render(
      <ControlForm record={record} reviews={[]} rawData={[]} onRecordChange={onRecordChange} />
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Metadata only' } });
    fireEvent.change(screen.getByLabelText('Ladder interval 1 days'), { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add interval' }));
    fireEvent.change(screen.getByLabelText('Ladder interval 4 days'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save setup and freeze baseline' }));

    expect(onRecordChange).toHaveBeenCalledWith({
      title: 'Metadata only',
      targetSummary: 'Reject rate stays below 3.2%',
      improvementDate: '2026-05-01T00:00:00.000Z',
      ladder: [21, 30, 90, 120],
      ladderStep: 0,
      nextCheckSuggestedAt: '2026-05-22T00:00:00.000Z',
    });
    expect(onRecordChange.mock.calls[0]?.[0]).not.toHaveProperty('baseline');
  });

  it('logs a re-check with frozen now stats and data stamp', () => {
    const onLogRecheck = vi.fn();
    render(
      <ControlForm
        record={record}
        reviews={[]}
        rawData={rawData}
        timeColumn="captured_at"
        comparison={{
          before: { source: 'frozen', n: 30, mean: 4.2, sigma: 0.7 },
          after: { n: 2, mean: 3, sigma: 0.2 },
          phases: {
            afterLimits: {
              window: {
                startISO: '2026-05-02T00:00:00.000Z',
                endISO: '2026-05-12T00:00:00.000Z',
              },
              n: 2,
              centerLine: 3,
              ucl: 3.6,
              lcl: 2.4,
            },
          },
          deltas: {},
        }}
        onLogRecheck={onLogRecheck}
      />
    );

    expect(screen.queryByLabelText('Snapshot ID')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('drifted'));
    fireEvent.change(screen.getByLabelText('Observation'), {
      target: { value: 'Shift B moved upward.' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Log re-check' }).at(-1)!);

    expect(onLogRecheck).toHaveBeenCalledWith({
      verdict: 'drifted',
      observation: 'Shift B moved upward.',
      nowStats: {
        window: {
          startISO: '2026-05-02T00:00:00.000Z',
          endISO: '2026-05-12T00:00:00.000Z',
        },
        n: 2,
        mean: 3,
        sigma: 0.2,
      },
      dataStamp: {
        rowCount: 4,
        rowTimestampRange: {
          startISO: '2026-04-01T00:00:00.000Z',
          endISO: '2026-05-12T00:00:00.000Z',
        },
      },
    });
  });

  it('does not log a re-check without post-improvement stats', () => {
    const onLogRecheck = vi.fn();
    render(
      <ControlForm
        record={record}
        reviews={[]}
        rawData={rawData.slice(0, 2)}
        timeColumn="captured_at"
        comparison={{
          before: { source: 'frozen', n: 30, mean: 4.2, sigma: 0.7 },
          after: null,
          deltas: {},
        }}
        onLogRecheck={onLogRecheck}
      />
    );

    expect(
      screen.getByText('Re-ingest post-improvement data before logging a re-check.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Log re-check' }).at(-1)!);

    expect(onLogRecheck).not.toHaveBeenCalled();
  });
});
