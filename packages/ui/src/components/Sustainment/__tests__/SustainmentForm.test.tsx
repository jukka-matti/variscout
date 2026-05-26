import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { SustainmentRecord, SustainmentReview } from '@variscout/core';
import { SustainmentForm } from '../SustainmentForm';

const record: SustainmentRecord = {
  id: 'sustain-1',
  createdAt: Date.UTC(2026, 4, 1),
  deletedAt: null,
  investigationId: 'investigation-1',
  hubId: 'hub-1',
  status: 'confirmed-sustained',
  title: 'Reduce scrap sustained',
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
  consecutiveOnTargetTicks: 3,
  hasOverride: false,
  lastEvaluatedSnapshotId: 'snapshot-2',
  cadence: 'weekly',
  nextReviewDue: '2026-05-19',
  latestVerdict: 'holding',
  latestReviewAt: '2026-05-12',
  latestReviewId: 'review-2',
  owner: { userId: 'owner-1', displayName: 'Avery Lee' },
  updatedAt: Date.UTC(2026, 4, 12),
};

const reviews: SustainmentReview[] = [
  {
    id: 'review-2',
    createdAt: Date.UTC(2026, 4, 12),
    deletedAt: null,
    recordId: 'sustain-1',
    investigationId: 'investigation-1',
    hubId: 'hub-1',
    reviewedAt: Date.UTC(2026, 4, 12),
    reviewer: { userId: 'reviewer-1', displayName: 'Jordan Chen' },
    verdict: 'holding',
    snapshotId: 'snapshot-2',
    observation: 'Signal remained centered for the weekly check.',
  },
  {
    id: 'review-1',
    createdAt: Date.UTC(2026, 4, 5),
    deletedAt: null,
    recordId: 'sustain-1',
    investigationId: 'investigation-1',
    hubId: 'hub-1',
    reviewedAt: Date.UTC(2026, 4, 5),
    reviewer: { userId: 'reviewer-2', displayName: 'Samira Patel' },
    verdict: 'drifting',
    snapshotId: 'snapshot-1',
    observation: 'One shift had a weak handoff.',
  },
];

describe('SustainmentForm', () => {
  it('renders sustainment sections with status, 3 of 4 ticks, review history, and goal summary', () => {
    render(<SustainmentForm record={record} reviews={reviews} />);

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
    expect(screen.getByText('holding')).toBeInTheDocument();
    expect(screen.getByText('3 of 4 ticks')).toBeInTheDocument();
    expect(screen.getByText('Signal remained centered for the weekly check.')).toBeInTheDocument();
    expect(screen.getByText('One shift had a weak handoff.')).toBeInTheDocument();
    expect(screen.getByText('Y-level outcome target')).toBeInTheDocument();
    expect(screen.getByText('reject-rate')).toBeInTheDocument();
    expect(screen.getByText('X-level factor controls')).toBeInTheDocument();
    expect(screen.getByText('Oven temperature')).toBeInTheDocument();
    expect(screen.getByText('x-level mechanism goals')).toBeInTheDocument();
    expect(screen.getByText('Operators follow first-piece confirmation')).toBeInTheDocument();
  });

  it('calls record update callback for title, target summary, and cadence changes', () => {
    const onRecordChange = vi.fn();
    render(<SustainmentForm record={record} reviews={[]} onRecordChange={onRecordChange} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated sustainment' } });
    fireEvent.change(screen.getByLabelText('Target summary'), {
      target: { value: 'Updated target summary' },
    });
    fireEvent.change(screen.getByLabelText('Cadence'), { target: { value: 'monthly' } });

    expect(onRecordChange).toHaveBeenNthCalledWith(1, { title: 'Updated sustainment' });
    expect(onRecordChange).toHaveBeenNthCalledWith(2, {
      targetSummary: 'Updated target summary',
    });
    expect(onRecordChange).toHaveBeenNthCalledWith(3, { cadence: 'monthly' });
  });
});
