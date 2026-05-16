import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SustainmentRecord } from '@variscout/core';
import SustainmentOverview, { type SustainmentClosureInputs } from '../SustainmentOverview';

const record: SustainmentRecord = {
  id: 'sr-1',
  createdAt: 0,
  deletedAt: null,
  updatedAt: 0,
  hubId: 'hub-1',
  investigationId: 'inv-1',
  improvementProjectId: 'ip-1',
  status: 'pending',
  title: 'Sustain Heads 5-8',
  cadence: 'weekly',
  consecutiveOnTargetTicks: 4,
  hasOverride: false,
  lastEvaluatedSnapshotId: undefined,
};

const allDone: SustainmentClosureInputs = {
  controlPlanDocumented: true,
  trainingDelivered: true,
  cadenceAssigned: true,
  processOwnerAcknowledged: true,
};

const pendingAck: SustainmentClosureInputs = {
  ...allDone,
  processOwnerAcknowledged: false,
};

describe('SustainmentOverview', () => {
  it('renders 4 cadence tick pills matching consecutiveOnTargetTicks', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getAllByTestId(/^cadence-tick-/)).toHaveLength(4);
  });

  it('enables Start Handoff CTA when consecutiveOnTargetTicks >= 4', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
  });

  it('disables Start Handoff CTA when fewer than 4 ticks', () => {
    const r2: SustainmentRecord = { ...record, consecutiveOnTargetTicks: 2 };
    render(
      <SustainmentOverview
        record={r2}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getByTestId('sustainment-start-handoff')).toBeDisabled();
  });

  it('calls onStartHandoff when CTA clicked', () => {
    const onStart = vi.fn();
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={onStart}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId('sustainment-start-handoff'));
    expect(onStart).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Sustainment closure panel (folded in from former Handoff stage)
// ---------------------------------------------------------------------------

describe('SustainmentOverview — closure panel', () => {
  it('shows 4 of 4 items complete when all done', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
        closureInputs={allDone}
      />
    );
    expect(screen.getByText(/4 of 4 items complete/i)).toBeInTheDocument();
  });

  it('shows 3 of 4 items complete when process-owner acknowledgment is pending', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
        closureInputs={pendingAck}
      />
    );
    expect(screen.getByText(/3 of 4 items complete/i)).toBeInTheDocument();
  });

  it('calls onNudgeOwner when Nudge clicked on pending acknowledgment', () => {
    const onNudge = vi.fn();
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
        closureInputs={pendingAck}
        onNudgeOwner={onNudge}
      />
    );
    fireEvent.click(screen.getByTestId('sustainment-closure-nudge-owner'));
    expect(onNudge).toHaveBeenCalled();
  });

  it('does not render closure panel when closureInputs is absent', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.queryByText(/Sustainment closure/i)).not.toBeInTheDocument();
  });
});
