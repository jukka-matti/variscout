/**
 * HypothesisCardWithPlans — CS-10 analyst-owned status SEAM tests. Renders the
 * REAL card and asserts on REAL output:
 *   · the advisory "mark Supported?" suggestion chip renders only when the
 *     derivation says evidence-survived-test AND the analyst has not yet
 *     promoted the hub (no nagging once promoted).
 *   · the chip + control hide when the analyst lacks edit rights.
 *   · the analyst-set control offers free choice (all 5 states, no gate) and
 *     calls onSetStatus with the chosen state.
 * A dead feature FAILS these.
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
import type { ProjectMember } from '@variscout/core/projectMembership';

const hub: Hypothesis = {
  id: 'h1',
  name: 'Night shift runs hot',
  synthesis: '',
  findingIds: [],
  status: 'evidenced',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

const baseProps = {
  hub,
  displayStatus: hub.status,
  x: 100,
  y: 100,
  plans: [],
  members: [] as ProjectMember[], // open-access (V1 single-user) → canEdit true
  currentUserId: null,
  findings: [] as Finding[],
  onAddPlan: vi.fn(),
  onLinkFinding: vi.fn(),
  onEditPlan: vi.fn(),
};

describe('CS-10 — advisory status suggestion chip', () => {
  it('shows the "mark Supported?" suggestion chip when ready and not yet promoted', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidenced"
        suggestedStatus="evidence-survived-test"
        onSetStatus={vi.fn()}
      />
    );
    expect(screen.getByTestId('status-suggestion-chip')).toBeInTheDocument();
  });

  it('hides the chip once the analyst has set evidence-survived-test (no nagging)', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{ ...hub, status: 'evidence-survived-test' }}
        displayStatus="evidence-survived-test"
        suggestedStatus="evidence-survived-test"
        onSetStatus={vi.fn()}
      />
    );
    expect(screen.queryByTestId('status-suggestion-chip')).toBeNull();
  });

  it('hides the chip when the derivation is not yet at evidence-survived-test', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidenced"
        suggestedStatus="needs-disconfirmation"
        onSetStatus={vi.fn()}
      />
    );
    expect(screen.queryByTestId('status-suggestion-chip')).toBeNull();
  });

  it('clicking the chip calls onSetStatus with evidence-survived-test', () => {
    const onSetStatus = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidenced"
        suggestedStatus="evidence-survived-test"
        onSetStatus={onSetStatus}
      />
    );
    fireEvent.click(screen.getByTestId('status-suggestion-chip'));
    expect(onSetStatus).toHaveBeenCalledWith('h1', 'evidence-survived-test');
  });

  it('hides the chip + control when the analyst lacks edit rights', () => {
    // Non-empty members + a currentUserId that is NOT a member → canEdit false.
    const members: ProjectMember[] = [
      {
        id: 'm-lead',
        userId: 'u-lead',
        displayName: 'Lead',
        role: 'lead',
        invitedAt: 1,
      } as ProjectMember,
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        members={members}
        currentUserId="u-stranger" // not in members → no edit-contributions access
        displayStatus="evidenced"
        suggestedStatus="evidence-survived-test"
        onSetStatus={vi.fn()}
      />
    );
    expect(screen.queryByTestId('status-suggestion-chip')).toBeNull();
    expect(screen.queryByTestId('analyst-set-status-control')).toBeNull();
  });

  it('hides the chip + control when onSetStatus is not wired', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidenced"
        suggestedStatus="evidence-survived-test"
      />
    );
    expect(screen.queryByTestId('status-suggestion-chip')).toBeNull();
    expect(screen.queryByTestId('analyst-set-status-control')).toBeNull();
  });
});

describe('CS-10 — the analyst-set status control (free choice, no gate)', () => {
  it('renders the control when canEdit and onSetStatus is wired', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...baseProps} displayStatus="evidenced" onSetStatus={vi.fn()} />
    );
    expect(screen.getByTestId('analyst-set-status-control')).toBeInTheDocument();
  });

  it('the analyst-set control calls onSetStatus with the chosen state (free choice, no gate)', () => {
    const onSetStatus = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        // the derivation would say evidence-survived-test; the analyst picks 'refuted'
        displayStatus="evidenced"
        suggestedStatus="evidence-survived-test"
        onSetStatus={onSetStatus}
      />
    );
    fireEvent.change(screen.getByTestId('analyst-set-status-control'), {
      target: { value: 'refuted' },
    });
    expect(onSetStatus).toHaveBeenCalledWith('h1', 'refuted');
  });

  it('offers all 5 states as choices (no contradiction warning, owner decision)', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...baseProps} displayStatus="evidenced" onSetStatus={vi.fn()} />
    );
    const control = screen.getByTestId('analyst-set-status-control') as HTMLSelectElement;
    const values = Array.from(control.options).map(o => o.value);
    expect(values).toEqual(
      expect.arrayContaining([
        'proposed',
        'evidenced',
        'evidence-survived-test',
        'refuted',
        'needs-disconfirmation',
      ])
    );
  });
});
