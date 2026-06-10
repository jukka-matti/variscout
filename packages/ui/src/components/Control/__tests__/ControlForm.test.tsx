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
  it('renders sustainment sections with status, ladder, review history, and goal summary', () => {
    render(<ControlForm record={record} reviews={reviews} />);

    expect(screen.getByRole('button', { name: 'Metadata' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Current status' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Review history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Goal carry-forward' })).toBeInTheDocument();

    expect(screen.getByLabelText('Title')).toHaveValue('Reduce scrap sustained');
    expect(screen.getByText('confirmed sustained')).toBeInTheDocument();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('reject-rate · n=30')).toBeInTheDocument();
    expect(screen.getByText('Signal remained centered for the weekly check.')).toBeInTheDocument();
    expect(screen.getByText('One shift had a weak handoff.')).toBeInTheDocument();
    expect(screen.getByText('Y-level outcome target')).toBeInTheDocument();
    expect(screen.getByText('reject-rate')).toBeInTheDocument();
    expect(screen.getByText('X-level factor controls')).toBeInTheDocument();
    expect(screen.getByText('Oven temperature')).toBeInTheDocument();
    expect(screen.getByText('x-level mechanism goals')).toBeInTheDocument();
    expect(screen.getByText('Operators follow first-piece confirmation')).toBeInTheDocument();
  });

  it('calls record update callback for title and target summary changes', () => {
    const onRecordChange = vi.fn();
    render(<ControlForm record={record} reviews={[]} onRecordChange={onRecordChange} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated sustainment' } });
    fireEvent.change(screen.getByLabelText('Target summary'), {
      target: { value: 'Updated target summary' },
    });

    expect(onRecordChange).toHaveBeenNthCalledWith(1, { title: 'Updated sustainment' });
    expect(onRecordChange).toHaveBeenNthCalledWith(2, {
      targetSummary: 'Updated target summary',
    });
  });
});
