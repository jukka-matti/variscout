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
import { render, screen, fireEvent } from '@testing-library/react';
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

const gembaSupportFinding: Finding = {
  id: 'f-gemba-support',
  text: 'Operators see extra heat on Shift A',
  evidenceType: 'gemba',
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

describe('L-2 — display status presentation', () => {
  it('removes the five-rung teaching ladder and shows plain display-state copy', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} onSetStatus={vi.fn()} />);

    expect(screen.queryByTestId('status-ladder')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-summary')).toHaveTextContent('Displayed state');
    expect(screen.getByTestId('status-summary')).toHaveTextContent(
      'Suspected causes stay suspected'
    );
    expect(screen.queryByText('Proposed - named mechanism to check')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Supported - survived an attempt to break it')
    ).not.toBeInTheDocument();
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
  it('proposes a suspected stored state when a proposed hub has one supporting finding', () => {
    const onSetStatus = vi.fn();
    renderInSvg(<HypothesisCardWithPlans {...baseProps} onSetStatus={onSetStatus} />);

    const chip = screen.getByTestId('status-proposal-chip');
    expect(chip).toHaveTextContent('1 supporting finding - mark Suspected?');
    fireEvent.click(chip);
    expect(onSetStatus).toHaveBeenCalledWith('h1', 'evidenced');
  });

  it('does not propose the triangulated suspected stored state from only one evidence type', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{ ...hub, status: 'evidenced' }}
        displayStatus="evidenced"
        onSetStatus={vi.fn()}
      />
    );

    expect(screen.queryByTestId('status-proposal-chip')).not.toBeInTheDocument();
  });

  it('proposes the triangulated suspected stored state once evidenced hubs have two evidence types', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{ ...hub, findingIds: ['f-support', 'f-gemba-support'], status: 'evidenced' }}
        displayStatus="evidenced"
        findings={[supportFinding, gembaSupportFinding]}
        onSetStatus={vi.fn()}
      />
    );

    expect(screen.getByTestId('status-proposal-chip')).toHaveTextContent(
      'Evidence logged - keep marked Suspected'
    );
  });

  it('does not propose verified from only one evidence type', () => {
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
              attemptedBy: { userId: 'u1', displayName: 'Analyst' },
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

    expect(screen.queryByTestId('status-proposal-chip')).not.toBeInTheDocument();
  });

  it('proposes verified once a two-evidence hub has one survived break attempt', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        hub={{
          ...hub,
          findingIds: ['f-support', 'f-gemba-support'],
          status: 'needs-disconfirmation',
          disconfirmationAttempts: [
            {
              id: 'd1',
              attemptedAt: '2026-06-07T00:00:00Z',
              attemptedBy: { userId: 'u1', displayName: 'Analyst' },
              description: 'Checked the suspected mechanism against Shift B',
              verdict: 'survived',
              linkedFindingIds: ['f-support'],
            },
          ],
        }}
        displayStatus="needs-disconfirmation"
        findings={[supportFinding, gembaSupportFinding]}
        onSetStatus={vi.fn()}
      />
    );

    expect(screen.getByTestId('status-proposal-chip')).toHaveTextContent(
      '1 survived break attempt - mark Verified?'
    );
  });

  it('prioritizes ruled out when counter evidence is present', () => {
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
              attemptedBy: { userId: 'u1', displayName: 'Analyst' },
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
      '1 refuting finding - mark Ruled out?'
    );
  });

  it('hides ladder and proposal chip when onSetStatus is not wired', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} />);

    expect(screen.queryByTestId('status-proposal-chip')).toBeNull();
    expect(screen.queryByTestId('analyst-set-status-control')).toBeNull();
  });
});
