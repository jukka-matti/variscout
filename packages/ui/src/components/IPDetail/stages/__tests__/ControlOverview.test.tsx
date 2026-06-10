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
  handoffRecorded: true,
  handoffSummary: 'Line SOP · Pat Owner',
  ownerAcceptedDefault: true,
  ladderWalked: true,
  ladderSummary: 'Step 3 of 3 walked',
  sustainmentConfirmed: true,
};

const pendingOwner: ControlClosureInputs = {
  ...allDone,
  ownerAcceptedDefault: false,
};

const needsOverride: ControlClosureInputs = {
  ...allDone,
  ownerAcceptedDefault: true,
  ladderWalked: false,
  ladderSummary: 'Step 2 of 3 walked',
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
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
  });

  it('blocks closeout until operational owner acceptance is checked', () => {
    render(
      <ControlOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
        closureInputs={pendingOwner}
      />
    );
    expect(screen.getByText(/3 of 4 items complete/i)).toBeInTheDocument();
    expect(screen.getByTestId('sustainment-start-handoff')).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/owner accepted the control/i));

    expect(screen.getByText(/4 of 4 items complete/i)).toBeInTheDocument();
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
  });

  it('requires an analyst override reason when the ladder is not fully walked', () => {
    render(
      <ControlOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
        closureInputs={needsOverride}
      />
    );
    expect(screen.getByText(/3 of 4 items complete/i)).toBeInTheDocument();
    expect(screen.getByTestId('sustainment-start-handoff')).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/analyst override reason/i), {
      target: { value: 'Two stable customer releases complete; final 90-day check is not needed.' },
    });

    expect(screen.getByText(/4 of 4 items complete/i)).toBeInTheDocument();
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
  });

  it('does not render retired closure checklist labels', () => {
    render(
      <ControlOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
        closureInputs={allDone}
      />
    );
    expect(screen.queryByText(/Control plan documented/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Training materials delivered/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Monitoring cadence assigned/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Process Owner acknowledgment/i)).not.toBeInTheDocument();
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
