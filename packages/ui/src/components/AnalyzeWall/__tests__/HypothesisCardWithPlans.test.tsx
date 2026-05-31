/**
 * HypothesisCardWithPlans — integration tests.
 *
 * Tests: plan rows, ACL gate, + Add Plan button, AddPlanForm open/close/save,
 * LinkFindingPicker open/confirm, empty-members open-access escape.
 */

vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisCardWithPlans } from '../HypothesisCardWithPlans';
import type { Hypothesis, Finding } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';

// ── fixtures ──────────────────────────────────────────────────────────────────

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  findingIds: ['f1', 'f2'],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-1',
};

const finding1: Finding = {
  id: 'f1',
  text: 'Temperature spike at 02:00',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 1,
  investigationId: 'inv-1',
  createdAt: 1,
  deletedAt: null,
};

const finding2: Finding = {
  id: 'f2',
  text: 'Night crew uses manual settings',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 2,
  investigationId: 'inv-1',
  createdAt: 2,
  deletedAt: null,
};

const leadMember: ProjectMember = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Alice Lead',
  role: 'lead',
  invitedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const sponsorMember: ProjectMember = {
  id: 'm2',
  userId: 'user-sponsor',
  displayName: 'Bob Sponsor',
  role: 'sponsor',
  invitedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const plan1: MeasurementPlan = {
  id: 'mp1',
  hypothesisId: 'h1',
  outcome: 'Fill Weight',
  primaryFactor: 'Temperature',
  neededFactors: [],
  method: 'sensor',
  sampleSize: 30,
  owner: 'm1',
  status: 'planned',
  scope: [],
  processLocation: '',
  linkedFindingIds: [],
  createdAt: 1,
  deletedAt: null,
};

const plan2: MeasurementPlan = {
  id: 'mp2',
  hypothesisId: 'h1',
  outcome: 'Fill Weight',
  primaryFactor: 'Manual settings',
  neededFactors: [],
  method: 'gemba-walk',
  sampleSize: 10,
  owner: 'm1',
  status: 'complete',
  scope: [],
  processLocation: '',
  linkedFindingIds: ['f1'],
  createdAt: 2,
  deletedAt: null,
};

// Helper: render inside SVG context (HypothesisCard renders SVG elements)
function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('HypothesisCardWithPlans — plan rows', () => {
  it('renders a MeasurementPlanChip row per plan in plans prop', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1, plan2]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[finding1, finding2]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Manual settings')).toBeInTheDocument();
  });

  it('shows owner display name resolved from members', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByText('Alice Lead')).toBeInTheDocument();
  });

  it('falls back to (unknown) when owner id is not in members', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[{ ...plan1, owner: 'nobody' }]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByText('(unknown)')).toBeInTheDocument();
  });

  it('shows no chip rows when plans is empty', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    // chip-body is the data-testid on MeasurementPlanChip row
    expect(document.querySelectorAll('[data-testid="chip-body"]').length).toBe(0);
  });
});

describe('HypothesisCardWithPlans — + Add Plan button', () => {
  it('shows + Add Plan button when canEdit is true (lead member)', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });

  it('shows + Add Plan button for Sponsor — plans are contributions per 2-tier ACL', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember, sponsorMember]}
        currentUserId="user-sponsor"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });

  it('shows + Add Plan button with empty members (open-access escape)', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[]}
        currentUserId="user-any"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });

  it('shows + Add Plan button even when there are existing plans', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });
});

describe('HypothesisCardWithPlans — AddPlanForm open/close/save', () => {
  it('clicking + Add Plan opens AddPlanForm', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add plan/i }));
    // AddPlanForm has a "Primary factor" label
    expect(screen.getByLabelText(/primary factor/i)).toBeInTheDocument();
  });

  it('form Cancel closes the form without calling onAddPlan', () => {
    const onAddPlan = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={onAddPlan}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add plan/i }));
    expect(screen.getByLabelText(/primary factor/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByLabelText(/primary factor/i)).toBeNull();
    expect(onAddPlan).not.toHaveBeenCalled();
  });

  it('form Save fires onAddPlan with the new plan shape (no id/createdAt/deletedAt)', () => {
    const onAddPlan = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={onAddPlan}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add plan/i }));

    // Fill in primary factor (required)
    fireEvent.change(screen.getByLabelText(/primary factor/i), {
      target: { value: 'Nozzle temp' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onAddPlan).toHaveBeenCalledOnce();
    const payload = onAddPlan.mock.calls[0][0];
    // Must have hypothesisId, primaryFactor, method, sampleSize, owner, status
    expect(payload.hypothesisId).toBe('h1');
    expect(payload.primaryFactor).toBe('Nozzle temp');
    expect(payload.status).toBe('planned');
    // Must NOT have id, createdAt, deletedAt (parent stamps)
    expect(payload).not.toHaveProperty('id');
    expect(payload).not.toHaveProperty('createdAt');
    expect(payload).not.toHaveProperty('deletedAt');
  });
});

describe('HypothesisCardWithPlans — LinkFindingPicker', () => {
  it('clicking Link Finding on a chip opens LinkFindingPicker for that plan', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[finding1, finding2]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    // MeasurementPlanChip has "Link finding" button (only shown when canEdit + plan is planned/in-progress)
    const linkBtn = screen.getByRole('button', { name: /link finding/i });
    fireEvent.click(linkBtn);
    // LinkFindingPicker renders a dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('picker Cancel closes the picker without firing onLinkFinding', () => {
    const onLinkFinding = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[finding1, finding2]}
        onAddPlan={vi.fn()}
        onLinkFinding={onLinkFinding}
        onEditPlan={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /link finding/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onLinkFinding).not.toHaveBeenCalled();
  });

  it('picker confirm fires onLinkFinding(planId, findingId) per chosen finding', () => {
    const onLinkFinding = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[finding1, finding2]}
        onAddPlan={vi.fn()}
        onLinkFinding={onLinkFinding}
        onEditPlan={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /link finding/i }));

    // Select finding1
    const checkbox = screen.getByLabelText(/Temperature spike/i);
    fireEvent.click(checkbox);

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /link selected/i }));

    // onLinkFinding should be called once per selected finding
    expect(onLinkFinding).toHaveBeenCalledWith('mp1', 'f1');
  });

  it('shows Link Finding button on chips for Sponsor — link is a contribution per 2-tier ACL', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[plan1]}
        members={[leadMember, sponsorMember]}
        currentUserId="user-sponsor"
        findings={[finding1]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /link finding/i })).toBeInTheDocument();
  });
});

describe('HypothesisCardWithPlans — ACL gate', () => {
  it('canEdit is false when user is not in members list (non-empty members)', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-not-a-member"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /add plan/i })).toBeNull();
  });

  it('canEdit is true when members is empty regardless of userId', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[]}
        currentUserId="user-totally-unknown"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });

  it('canEdit is true when currentUserId is null and members is empty', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[]}
        currentUserId={null}
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add plan/i })).toBeInTheDocument();
  });
});

describe('HypothesisCardWithPlans — disconfirmation gesture (IM-4a)', () => {
  it('shows the disconfirmation gesture when canEdit + onRecordDisconfirmation provided', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="needs-disconfirmation"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
        onRecordDisconfirmation={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /gemba or expert/i })).toBeInTheDocument();
  });

  it('hides the disconfirmation gesture when canEdit is false', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="needs-disconfirmation"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-not-a-member"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
        onRecordDisconfirmation={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /gemba or expert/i })).toBeNull();
  });

  it('omits the gesture entirely when onRecordDisconfirmation is not provided', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="needs-disconfirmation"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /gemba or expert/i })).toBeNull();
  });

  it('fires onRecordDisconfirmation with description + verdict on save', () => {
    const onRecord = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="needs-disconfirmation"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
        onRecordDisconfirmation={onRecord}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /gemba or expert/i }));
    fireEvent.change(screen.getByLabelText(/what did you try/i), {
      target: { value: 'Re-ran on day shift; effect persisted' },
    });
    fireEvent.change(screen.getByLabelText(/did it hold/i), { target: { value: 'survived' } });
    fireEvent.click(screen.getByRole('button', { name: /^record$/i }));
    expect(onRecord).toHaveBeenCalledTimes(1);
    expect(onRecord).toHaveBeenCalledWith('h1', {
      description: 'Re-ran on day shift; effect persisted',
      verdict: 'survived',
    });
  });
});
