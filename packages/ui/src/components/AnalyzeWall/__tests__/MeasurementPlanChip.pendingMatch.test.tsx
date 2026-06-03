/**
 * MeasurementPlanChip — PR-CS-11 Task 5 SEAM tests. The chip is the ONE place the
 * analyst APPLIES a pending re-ingest match ("hints navigate, chips apply") and
 * owns the plan status. Renders the REAL chip and asserts on REAL output:
 *   · the pending-match prompt renders ONLY when a match is supplied + canEdit;
 *   · "Mark in-progress" calls onSetPlanStatus(planId, 'in-progress') — and
 *     rendering alone NEVER calls it (negative control — no auto-anything);
 *   · "Mark in-progress" is absent once the plan is already in-progress;
 *   · the 4-state analyst-owned status select offers every state + dispatches the
 *     free choice with no gate, no validation;
 *   · dismiss calls onDismissPendingMatch with the match id;
 *   · no prompt + no select without edit rights;
 *   · no prompt at all in the quiet default (no pending match).
 * A dead feature FAILS these.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeasurementPlanChip } from '../MeasurementPlanChip';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

const basePlan: MeasurementPlan = {
  id: 'p1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  outcome: 'Fill Weight',
  primaryFactor: 'spindle vibration',
  neededFactors: ['nozzle-temp'],
  method: 'sensor',
  sampleSize: 30,
  owner: 'pm-alice',
  status: 'planned',
  scope: [],
  processLocation: '',
};

const pendingMatch = { id: 'p1:nozzle-temp', column: 'nozzle-temp' };

describe('MeasurementPlanChip — pending-match prompt (apply surface)', () => {
  it('renders the pending-match prompt when a needed factor arrived', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        pendingMatch={pendingMatch}
        onSetPlanStatus={vi.fn()}
        onDismissPendingMatch={vi.fn()}
      />
    );
    const prompt = screen.getByTestId('pending-match-prompt');
    expect(prompt).toBeInTheDocument();
    // Copy names the arrived column.
    expect(prompt.textContent).toMatch(/nozzle-temp/);
    // Link finding… + Mark in-progress + a dismiss control are all present.
    // (Use the prompt-scoped testid — a planned chip ALSO renders the existing
    // chip-body "Link Finding…" affordance, so a role query would be ambiguous.)
    expect(screen.getByTestId('pending-link-finding')).toBeInTheDocument();
    expect(screen.getByTestId('pending-mark-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('pending-match-dismiss')).toBeInTheDocument();
  });

  it('Mark in-progress calls onSetPlanStatus(planId, "in-progress") — rendering alone calls it ZERO times', () => {
    const onSetPlanStatus = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        pendingMatch={pendingMatch}
        onSetPlanStatus={onSetPlanStatus}
        onDismissPendingMatch={vi.fn()}
      />
    );
    // NEGATIVE CONTROL — no auto-anything: mounting must not dispatch.
    expect(onSetPlanStatus).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('pending-mark-in-progress'));
    expect(onSetPlanStatus).toHaveBeenCalledWith('p1', 'in-progress');
  });

  it('Mark in-progress is absent when the plan is already in-progress (only Link + dismiss remain)', () => {
    render(
      <MeasurementPlanChip
        plan={{ ...basePlan, status: 'in-progress' }}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        pendingMatch={pendingMatch}
        onSetPlanStatus={vi.fn()}
        onDismissPendingMatch={vi.fn()}
      />
    );
    expect(screen.queryByTestId('pending-mark-in-progress')).toBeNull();
    // The other two prompt affordances survive.
    expect(screen.getByTestId('pending-link-finding')).toBeInTheDocument();
    expect(screen.getByTestId('pending-match-dismiss')).toBeInTheDocument();
  });

  it('Link finding… in the prompt opens the existing picker flow (calls onLinkFinding with the planId)', () => {
    const onLinkFinding = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={onLinkFinding}
        pendingMatch={pendingMatch}
        onSetPlanStatus={vi.fn()}
        onDismissPendingMatch={vi.fn()}
      />
    );
    // The prompt's Link finding affordance reuses the chip's existing
    // onLinkFinding path (which the card maps to opening LinkFindingPicker).
    fireEvent.click(screen.getByTestId('pending-link-finding'));
    expect(onLinkFinding).toHaveBeenCalledWith('p1');
  });

  it('dismiss calls onDismissPendingMatch with the match id', () => {
    const onDismissPendingMatch = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        pendingMatch={pendingMatch}
        onSetPlanStatus={vi.fn()}
        onDismissPendingMatch={onDismissPendingMatch}
      />
    );
    fireEvent.click(screen.getByTestId('pending-match-dismiss'));
    expect(onDismissPendingMatch).toHaveBeenCalledWith('p1:nozzle-temp');
  });

  it('no prompt when there is no pending match (the quiet default)', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        pendingMatch={null}
        onSetPlanStatus={vi.fn()}
        onDismissPendingMatch={vi.fn()}
      />
    );
    expect(screen.queryByTestId('pending-match-prompt')).toBeNull();
  });

  it('no prompt without edit rights', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit={false}
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        pendingMatch={pendingMatch}
        onSetPlanStatus={vi.fn()}
        onDismissPendingMatch={vi.fn()}
      />
    );
    expect(screen.queryByTestId('pending-match-prompt')).toBeNull();
  });
});

describe('MeasurementPlanChip — analyst-owned 4-state plan-status select (free choice)', () => {
  it('renders the status select when canEdit and onSetPlanStatus is wired', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        onSetPlanStatus={vi.fn()}
      />
    );
    expect(screen.getByTestId('plan-status-select')).toBeInTheDocument();
  });

  it('the analyst-owned status select offers all 4 states', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        onSetPlanStatus={vi.fn()}
      />
    );
    const select = screen.getByTestId('plan-status-select') as HTMLSelectElement;
    const values = Array.from(select.options).map(o => o.value);
    expect(values).toEqual(
      expect.arrayContaining(['planned', 'in-progress', 'complete', 'skipped'])
    );
  });

  it('dispatches the free choice with no gate, no validation (planned → complete)', () => {
    const onSetPlanStatus = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        onSetPlanStatus={onSetPlanStatus}
      />
    );
    fireEvent.change(screen.getByTestId('plan-status-select'), {
      target: { value: 'complete' },
    });
    expect(onSetPlanStatus).toHaveBeenCalledWith('p1', 'complete');
  });

  it('no select without edit rights', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit={false}
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
        onSetPlanStatus={vi.fn()}
      />
    );
    expect(screen.queryByTestId('plan-status-select')).toBeNull();
  });

  it('no select when onSetPlanStatus is not wired', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    expect(screen.queryByTestId('plan-status-select')).toBeNull();
  });
});
