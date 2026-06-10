import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ControlRecord } from '@variscout/core';
import ControlOverview, { type ControlClosureInputs } from '../ControlOverview';

const record: ControlRecord = {
  id: 'sr-1',
  createdAt: 0,
  deletedAt: null,
  updatedAt: 0,
  hubId: 'hub-1',
  projectId: 'inv-1',
  improvementProjectId: 'ip-1',
  status: 'confirmed-sustained',
  title: 'Sustain Heads 5-8',
  improvementDate: '2026-05-01T00:00:00.000Z',
  baseline: {
    capturedAt: 0,
    window: {
      startISO: '2026-04-01T00:00:00.000Z',
      endISO: '2026-04-30T23:59:59.999Z',
    },
    measure: 'heads',
    n: 12,
    mean: 1,
    sigma: 0.1,
  },
  ladder: [7, 30, 90],
  ladderStep: 1,
  nextCheckSuggestedAt: '2026-06-01T00:00:00.000Z',
  lastEvaluatedSnapshotId: undefined,
};

const allDone: ControlClosureInputs = {
  controlPlanDocumented: true,
  trainingDelivered: true,
  cadenceAssigned: true,
  processOwnerAcknowledged: true,
};

const pendingAck: ControlClosureInputs = {
  ...allDone,
  processOwnerAcknowledged: false,
};

describe('ControlOverview', () => {
  it('renders the re-check ladder state', () => {
    render(
      <ControlOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getByTestId('control-ladder-step')).toHaveTextContent('Step 2 of 3');
  });

  it('enables Control closeout CTA when sustainment is analyst-confirmed', () => {
    render(
      <ControlOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
    expect(screen.getByTestId('sustainment-start-handoff')).toHaveTextContent(/start closure/i);
    expect(screen.queryByText(/Start Handoff/i)).not.toBeInTheDocument();
  });

  it('disables Control closeout CTA while verification is still in progress', () => {
    const r2: ControlRecord = { ...record, status: 'verifying' };
    render(
      <ControlOverview
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
      <ControlOverview
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
// Control closure panel (folded in from former Handoff stage)
// ---------------------------------------------------------------------------

describe('ControlOverview — closure panel', () => {
  it('shows 4 of 4 items complete when all done', () => {
    render(
      <ControlOverview
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
      <ControlOverview
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
      <ControlOverview
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
      <ControlOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.queryByText(/Control closure/i)).not.toBeInTheDocument();
  });
});
