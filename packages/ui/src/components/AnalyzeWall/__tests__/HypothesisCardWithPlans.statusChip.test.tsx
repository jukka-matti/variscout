/**
 * HypothesisCardWithPlans — FSJ-8 status ladder tests.
 *
 * Stored hub.status remains the authority. Proposal chips are advisory gestures
 * that call onSetStatus; no derived status writes happen here.
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
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HypothesisCardWithPlans } from '../HypothesisCardWithPlans';
import type { Hypothesis, Finding } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';

const supportFinding: Finding = {
  id: 'f-support',
  text: 'Shift A runs hotter',
  evidenceType: 'data',
  validationStatus: 'supports',
  refutes: false,
} as Finding;

const refutingFinding: Finding = {
  id: 'f-refute',
  text: 'Shift B also runs hot',
  evidenceType: 'data',
  validationStatus: 'contradicts',
  refutes: true,
} as Finding;

const hub: Hypothesis = {
  id: 'h1',
  name: 'Night shift runs hot',
  synthesis: '',
  findingIds: ['f-support'],
  status: 'proposed',
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
  members: [] as ProjectMember[],
  currentUserId: null,
  findings: [supportFinding] as Finding[],
  onAddPlan: vi.fn(),
  onLinkFinding: vi.fn(),
  onEditPlan: vi.fn(),
};

describe('FSJ-8 — status ladder presentation', () => {
  it('renders the epistemic ladder labels and teaching microcopy', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} onSetStatus={vi.fn()} />);

    const ladder = within(screen.getByTestId('status-ladder'));
    expect(ladder.getByText('Proposed')).toBeInTheDocument();
    expect(ladder.getByText('Evidenced')).toBeInTheDocument();
    expect(ladder.getByText('Needs disconfirmation')).toBeInTheDocument();
    expect(ladder.getByText('Supported')).toBeInTheDocument();
    expect(ladder.getAllByText(/Refuted/).length).toBeGreaterThanOrEqual(1);
    expect(ladder.getByText('Supported - survived an attempt to break it')).toBeInTheDocument();
  });

  it('keeps the override select with all five stored statuses', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} onSetStatus={vi.fn()} />);

    const control = screen.getByTestId('analyst-set-status-control') as HTMLSelectElement;
    const values = Array.from(control.options).map(o => o.value);
    expect(values).toEqual(
      expect.arrayContaining([
        'proposed',
        'evidenced',
        'needs-disconfirmation',
        'evidence-survived-test',
        'refuted',
      ])
    );
  });

  it('override select calls onSetStatus with the chosen state', () => {
    const onSetStatus = vi.fn();
    renderInSvg(<HypothesisCardWithPlans {...baseProps} onSetStatus={onSetStatus} />);

    fireEvent.change(screen.getByTestId('analyst-set-status-control'), {
      target: { value: 'refuted' },
    });

    expect(onSetStatus).toHaveBeenCalledWith('h1', 'refuted');
  });
});

describe('FSJ-8 — status proposal chips', () => {
  it('proposes Evidenced when a proposed hub has one supporting finding', () => {
    const onSetStatus = vi.fn();
    renderInSvg(<HypothesisCardWithPlans {...baseProps} onSetStatus={onSetStatus} />);

    const chip = screen.getByTestId('status-proposal-chip');
    expect(chip).toHaveTextContent('1 supporting finding - mark Evidenced?');
    fireEvent.click(chip);
    expect(onSetStatus).toHaveBeenCalledWith('h1', 'evidenced');
  });

  it('proposes Needs disconfirmation for evidenced hubs with no survived attempt', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{ ...hub, status: 'evidenced' }}
        displayStatus="evidenced"
        onSetStatus={vi.fn()}
      />
    );

    expect(screen.getByTestId('status-proposal-chip')).toHaveTextContent(
      'Evidence logged - mark Needs disconfirmation?'
    );
  });

  it('proposes Supported when a needs-disconfirmation hub has one survived break attempt', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{
          ...hub,
          status: 'needs-disconfirmation',
          disconfirmationAttempts: [
            {
              id: 'd1',
              attemptedAt: '2026-06-07T00:00:00Z',
              attemptedBy: { kind: 'user', userId: 'u1' },
              description: 'Checked the suspected mechanism against Shift B',
              verdict: 'survived',
              linkedFindingIds: ['f-support'],
            },
          ],
        }}
        displayStatus="needs-disconfirmation"
        onSetStatus={vi.fn()}
      />
    );

    expect(screen.getByTestId('status-proposal-chip')).toHaveTextContent(
      '1 survived break attempt - mark Supported?'
    );
  });

  it('prioritizes Refuted when counter evidence is present', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{
          ...hub,
          status: 'needs-disconfirmation',
          findingIds: ['f-support', 'f-refute'],
          counterFindingIds: ['f-refute'],
          disconfirmationAttempts: [
            {
              id: 'd1',
              attemptedAt: '2026-06-07T00:00:00Z',
              attemptedBy: { kind: 'user', userId: 'u1' },
              description: 'Checked the suspected mechanism against Shift B',
              verdict: 'survived',
              linkedFindingIds: ['f-support'],
            },
          ],
        }}
        findings={[supportFinding, refutingFinding]}
        displayStatus="needs-disconfirmation"
        onSetStatus={vi.fn()}
      />
    );

    expect(screen.getByTestId('status-proposal-chip')).toHaveTextContent(
      '1 refuting finding - mark Refuted?'
    );
  });

  it('hides ladder and proposal chip when onSetStatus is not wired', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} />);

    expect(screen.queryByTestId('status-proposal-chip')).toBeNull();
    expect(screen.queryByTestId('analyst-set-status-control')).toBeNull();
  });
});
