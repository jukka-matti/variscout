/**
 * Task 3 — HypothesisCardWithPlans: ActionItem tasks on hypotheses (RED tests).
 *
 * Encodes the acceptance oracle for the UI layer:
 *   - When hub.actions has items, the card renders them (assignee + text + status).
 *   - "+ Add Task" button visible when canEdit is true.
 *   - "+ Add Task" button hidden when canEdit is false (non-member user).
 *   - Adding a task fires `onAddHypothesisAction(hypothesisId, text, assignee?)`.
 *   - Completing a task fires `onCompleteHypothesisAction(hypothesisId, actionId)`.
 *   - Open task renders "open" label / incomplete marker; done task renders "done".
 *   - Empty members → open-access → button visible.
 *   - Sponsor member can add tasks (edit-contributions ACL).
 *   - Distinct from Measurement Plan rows: action item rows use different
 *     data-testid ("action-item-row") vs plan chips ("chip-body").
 *
 * These tests FAIL today because:
 *   1. HypothesisCardWithPlans does not accept onAddHypothesisAction /
 *      onCompleteHypothesisAction props yet.
 *   2. No action item rows are rendered from hub.actions.
 *   3. No "+ Add Task" button exists.
 */

// vi.mock MUST come before component imports per project convention.
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
import type { Hypothesis, ActionItem } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';

// ── fixtures ──────────────────────────────────────────────────────────────────

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  findingIds: ['f1'],
  status: 'proposed',
  createdAt: 1_748_649_600_000,
  updatedAt: 1_748_649_600_000,
  deletedAt: null,
};

const openAction: ActionItem = {
  id: 'ai-1',
  text: '@Jane: validate against night-shift data',
  assignee: { upn: 'jane@contoso.com', displayName: 'Jane Analyst' },
  dueDate: '2026-06-15',
  createdAt: 1_748_649_600_000,
  deletedAt: null,
  // completedAt absent → open
};

const doneAction: ActionItem = {
  id: 'ai-2',
  text: 'Reviewed temperature log',
  assignee: { upn: 'bob@contoso.com', displayName: 'Bob Sponsor' },
  createdAt: 1_748_649_600_000,
  deletedAt: null,
  completedAt: 1_748_736_000_000, // done
};

const hubWithActions: Hypothesis = {
  ...hub,
  actions: [openAction, doneAction],
};

const leadMember: ProjectMember = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Alice Lead',
  role: 'lead',
  invitedAt: 1_748_649_600_000,
  createdAt: 1_748_649_600_000,
  deletedAt: null,
};

const sponsorMember: ProjectMember = {
  id: 'm2',
  userId: 'user-sponsor',
  displayName: 'Bob Sponsor',
  role: 'sponsor',
  invitedAt: 1_748_649_600_000,
  createdAt: 1_748_649_600_000,
  deletedAt: null,
};

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

// ── Rendering action item rows ─────────────────────────────────────────────────

describe('HypothesisCardWithPlans — action item rows from hub.actions', () => {
  it('renders one row per action item in hub.actions', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hubWithActions}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    // Each action item renders with its text
    expect(screen.getByText('@Jane: validate against night-shift data')).toBeInTheDocument();
    expect(screen.getByText('Reviewed temperature log')).toBeInTheDocument();
  });

  it('renders assignee name on each action item row', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hubWithActions}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(screen.getByText('Jane Analyst')).toBeInTheDocument();
    expect(screen.getByText('Bob Sponsor')).toBeInTheDocument();
  });

  it('shows open status indicator for incomplete action items', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={{ ...hub, actions: [openAction] }}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    // Open action — aria-label or text indicating "open" or "to-do"
    const row = document.querySelector('[data-testid="action-item-row"][data-status="open"]');
    expect(row).toBeTruthy();
  });

  it('shows done status indicator for completed action items', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={{ ...hub, actions: [doneAction] }}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    // Done action — data-status="done" on the row
    const row = document.querySelector('[data-testid="action-item-row"][data-status="done"]');
    expect(row).toBeTruthy();
  });

  it('renders no action item rows when hub.actions is absent', () => {
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(document.querySelectorAll('[data-testid="action-item-row"]').length).toBe(0);
  });

  it('action item rows are visually distinct from plan chip rows', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={{ ...hub, actions: [openAction] }}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    // Plan chip rows use data-testid="chip-body"; action item rows use "action-item-row"
    expect(document.querySelectorAll('[data-testid="action-item-row"]').length).toBe(1);
    expect(document.querySelectorAll('[data-testid="chip-body"]').length).toBe(0);
  });
});

// ── "+ Add Task" button (ACL gated) ──────────────────────────────────────────

describe('HypothesisCardWithPlans — + Add Task button ACL', () => {
  it('shows "+ Add Task" button when canEdit is true (lead member)', () => {
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('shows "+ Add Task" button for Sponsor — tasks are contributions per 2-tier ACL', () => {
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('shows "+ Add Task" button with empty members (open-access escape)', () => {
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('hides "+ Add Task" button when user is not in members list (canEdit false)', () => {
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /add task/i })).toBeNull();
  });

  it('omits "+ Add Task" button when onAddHypothesisAction is not provided', () => {
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
        // onAddHypothesisAction intentionally omitted
      />
    );
    expect(screen.queryByRole('button', { name: /add task/i })).toBeNull();
  });
});

// ── Add task flow ─────────────────────────────────────────────────────────────

describe('HypothesisCardWithPlans — add task flow', () => {
  it('clicking "+ Add Task" opens the inline add-task form', () => {
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    // Form appears — a text input for the task description
    expect(screen.getByRole('textbox', { name: /task/i })).toBeInTheDocument();
  });

  it('save fires onAddHypothesisAction with hypothesisId + text', () => {
    const onAdd = vi.fn();
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
        onAddHypothesisAction={onAdd}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /task/i }), {
      target: { value: '@Jane: validate against night-shift data' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onAdd).toHaveBeenCalledOnce();
    const [hypothesisId, text] = onAdd.mock.calls[0];
    expect(hypothesisId).toBe('h1');
    expect(text).toBe('@Jane: validate against night-shift data');
  });

  it('save forwards the selected member as the task assignee', () => {
    const onAdd = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus="proposed"
        x={0}
        y={0}
        plans={[]}
        members={[leadMember, sponsorMember]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
        onAddHypothesisAction={onAdd}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /task/i }), {
      target: { value: 'Validate with sponsor' },
    });
    fireEvent.change(screen.getByLabelText(/assignee/i), {
      target: { value: 'user-sponsor' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith('h1', 'Validate with sponsor', {
      upn: 'user-sponsor',
      displayName: 'Bob Sponsor',
    });
  });

  it('cancel closes the form without firing onAddHypothesisAction', () => {
    const onAdd = vi.fn();
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
        onAddHypothesisAction={onAdd}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onAdd).not.toHaveBeenCalled();
    // Form is gone, button is back
    expect(screen.queryByRole('textbox', { name: /task/i })).toBeNull();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });
});

// ── Complete task flow ────────────────────────────────────────────────────────

describe('HypothesisCardWithPlans — complete task flow', () => {
  it('clicking the complete button on an open task fires onCompleteHypothesisAction', () => {
    const onComplete = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        hub={{ ...hub, actions: [openAction] }}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={onComplete}
      />
    );
    // The complete button (checkbox or "Mark done") on the open task row
    const completeBtn = screen.getByRole('button', { name: /mark done|complete/i });
    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith('h1', 'ai-1');
  });

  it('complete button is hidden when canEdit is false', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        hub={{ ...hub, actions: [openAction] }}
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
        onAddHypothesisAction={vi.fn()}
        onCompleteHypothesisAction={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /mark done|complete/i })).toBeNull();
  });
});
