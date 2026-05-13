import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ControlHandoff, SustainmentRecord } from '@variscout/core';
import { HandoffForm } from '../HandoffForm';

const handoff: ControlHandoff = {
  id: 'handoff-1',
  createdAt: Date.UTC(2026, 4, 1),
  deletedAt: null,
  investigationId: 'investigation-1',
  hubId: 'hub-1',
  status: 'pending',
  surface: 'qms-procedure',
  systemName: 'QMS-42',
  operationalOwner: { displayName: 'Avery Lee' },
  handoffDate: Date.UTC(2026, 4, 12),
  description: 'Transfer the improved fill-weight control to daily operations.',
  retainSustainmentReview: true,
  recordedBy: { displayName: 'Analyst' },
  escalationPath: 'Escalate misses to the production manager.',
  reactionPlan: 'Restore standard work and open focused investigation if drift repeats.',
};

const sustainmentRecord: SustainmentRecord = {
  id: 'sustain-1',
  createdAt: Date.UTC(2026, 3, 1),
  deletedAt: null,
  investigationId: 'investigation-1',
  hubId: 'hub-1',
  status: 'confirmed-sustained',
  title: 'Hold improved fill weight',
  consecutiveOnTargetTicks: 4,
  hasOverride: false,
  lastEvaluatedSnapshotId: 'snapshot-1',
  cadence: 'weekly',
  latestVerdict: 'holding',
  updatedAt: Date.UTC(2026, 4, 12),
};

describe('HandoffForm', () => {
  it('renders metadata, linked sustainment, acknowledgement, and active paid signoff', () => {
    const onHandoffChange = vi.fn();
    const onAcknowledge = vi.fn();
    const onMarkOperational = vi.fn();
    const onSponsorSignoff = vi.fn();

    render(
      <HandoffForm
        handoff={handoff}
        sustainmentRecord={sustainmentRecord}
        isPaidTier
        onHandoffChange={onHandoffChange}
        onAcknowledge={onAcknowledge}
        onMarkOperational={onMarkOperational}
        onSponsorSignoff={onSponsorSignoff}
      />
    );

    expect(screen.getByLabelText('System name')).toHaveValue('QMS-42');
    expect(screen.getByText('Hold improved fill weight')).toBeInTheDocument();
    expect(screen.getByText('confirmed sustained')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge handoff' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Mark operational' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Run sponsor signoff' })).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Escalation path'), {
      target: { value: 'Escalate to plant manager' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge handoff' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark operational' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run sponsor signoff' }));

    expect(onHandoffChange).toHaveBeenCalledWith({ escalationPath: 'Escalate to plant manager' });
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
    expect(onMarkOperational).toHaveBeenCalledTimes(1);
    expect(onSponsorSignoff).toHaveBeenCalledTimes(1);
  });

  it('shows locked sponsor signoff affordance for free tier', () => {
    render(<HandoffForm handoff={handoff} isPaidTier={false} />);

    const signoff = screen.getByRole('button', { name: 'Sponsor signoff locked' });
    expect(signoff).toBeDisabled();
    expect(signoff).toHaveAttribute(
      'title',
      'Sponsor signoff is available on paid VariScout plans.'
    );
  });
});
