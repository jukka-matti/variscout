/**
 * HypothesisCardWithPlans — FE-2b disconfirmation-fusion SEAM tests. Renders the
 * REAL card (no injected leaf) and asserts on REAL output:
 *   · the fused "Try to break it" checkbox renders per ready factor; checking it
 *     reveals the premortem prediction field; the fused evaluate carries the
 *     options up (tryToBreakIt + prediction).
 *   · the §4.1 soft caveat renders for an unbacked survived; "back it with a
 *     test →" pre-checks "Try to break it".
 *   · refute → respawn-sharper: the CTA shows ONLY for a refuted hub; the form
 *     seeds H2 (editable name) + shows the carry note; confirm fires onRespawnSharper.
 *   · the confound sign-prompt renders the rival + side-by-side What-If (never
 *     summed) + the "Counts against the rival" action.
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
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  HypothesisCardWithPlans,
  type TestPlanFactorView,
  type ConfoundRivalView,
} from '../HypothesisCardWithPlans';
import type { Hypothesis, Finding } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';

const hub: Hypothesis = {
  id: 'h1',
  name: 'Night shift runs hot',
  synthesis: '',
  findingIds: [],
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
  members: [] as ProjectMember[], // open-access (V1 single-user)
  currentUserId: null,
  findings: [] as Finding[],
  onAddPlan: vi.fn(),
  onLinkFinding: vi.fn(),
  onEditPlan: vi.fn(),
};

const readyFactors: TestPlanFactorView[] = [
  { factor: 'SHIFT', readiness: 'ready', tool: 'two-sample' },
];

describe('FE-2b — the fused "Try to break it" checkbox (the keystone)', () => {
  it('renders the checkbox per ready factor and carries tryToBreakIt:false unchecked', () => {
    const onEvaluateFactor = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={readyFactors}
        onEvaluateFactor={onEvaluateFactor}
      />
    );
    expect(screen.getByTestId('try-break-it-SHIFT')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
    expect(onEvaluateFactor).toHaveBeenCalledWith('h1', 'SHIFT', {
      tryToBreakIt: false,
      prediction: undefined,
    });
  });

  it('checking "Try to break it" reveals the premortem field and carries it up', () => {
    const onEvaluateFactor = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={readyFactors}
        onEvaluateFactor={onEvaluateFactor}
      />
    );
    // The premortem field is hidden until the checkbox is checked.
    expect(screen.queryByTestId('break-it-fields-SHIFT')).toBeNull();
    const checkbox = within(screen.getByTestId('try-break-it-SHIFT')).getByRole('checkbox');
    fireEvent.click(checkbox);
    const fields = screen.getByTestId('break-it-fields-SHIFT');
    fireEvent.change(within(fields).getByRole('textbox'), {
      target: { value: 'day-shift runs should run cool' },
    });
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
    expect(onEvaluateFactor).toHaveBeenCalledWith('h1', 'SHIFT', {
      tryToBreakIt: true,
      prediction: 'day-shift runs should run cool',
    });
  });

  it('does NOT gate the evaluate on a written prediction (checkbox on, blank field)', () => {
    const onEvaluateFactor = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={readyFactors}
        onEvaluateFactor={onEvaluateFactor}
      />
    );
    fireEvent.click(within(screen.getByTestId('try-break-it-SHIFT')).getByRole('checkbox'));
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
    // Evaluate still fires (engine verdict is the real backing) — prediction undefined.
    expect(onEvaluateFactor).toHaveBeenCalledWith('h1', 'SHIFT', {
      tryToBreakIt: true,
      prediction: undefined,
    });
  });
});

describe('FE-2b — the §4.1 soft caveat for an unbacked survived', () => {
  it('renders the caveat + "back it with a test →" pre-checks Try to break it', () => {
    const onEvaluateFactor = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidence-survived-test"
        testPlanFactors={readyFactors}
        onEvaluateFactor={onEvaluateFactor}
        unbackedSurvived
      />
    );
    expect(screen.getByTestId('unbacked-survived-caveat')).toBeInTheDocument();
    // The back-it link pre-checks the first ready factor's checkbox.
    fireEvent.click(screen.getByTestId('back-it-with-test'));
    const checkbox = within(screen.getByTestId('try-break-it-SHIFT')).getByRole(
      'checkbox'
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('hides the caveat when unbackedSurvived is not set', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidence-survived-test"
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    expect(screen.queryByTestId('unbacked-survived-caveat')).toBeNull();
  });
});

describe('FE-2b — refute → respawn-sharper', () => {
  it('shows the sharpen CTA ONLY for a refuted hub and fires onRespawnSharper', () => {
    const onRespawnSharper = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="refuted"
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
        onRespawnSharper={onRespawnSharper}
      />
    );
    fireEvent.click(screen.getByTestId('respawn-sharper-cta'));
    // The carry is shown explicitly (not a silent sign-flip).
    expect(screen.getByTestId('respawn-carry-note')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/new hypothesis/i), {
      target: { value: 'It is the spindle, regardless of shift' },
    });
    fireEvent.click(screen.getByTestId('respawn-confirm'));
    expect(onRespawnSharper).toHaveBeenCalledWith('h1', 'It is the spindle, regardless of shift');
  });

  it('hides the sharpen CTA for a non-refuted hub', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="evidenced"
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
        onRespawnSharper={vi.fn()}
      />
    );
    expect(screen.queryByTestId('respawn-sharper-cta')).toBeNull();
  });

  it('MAJOR-2: a refuted hub that was respawned shows the "superseded by → [H2 name]" trail', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="refuted"
        supersededByName="It is the spindle, regardless of shift"
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
        onRespawnSharper={vi.fn()}
      />
    );
    const trail = screen.getByTestId('superseded-by-trail');
    expect(trail).toBeInTheDocument();
    expect(trail).toHaveTextContent('superseded by →');
    // The trail names the successor (H2) so the analyst doesn't re-walk the dead end.
    expect(trail).toHaveTextContent('It is the spindle, regardless of shift');
  });

  it('hides the superseded-by trail when the refuted hub has no successor', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        displayStatus="refuted"
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
        onRespawnSharper={vi.fn()}
      />
    );
    expect(screen.queryByTestId('superseded-by-trail')).toBeNull();
  });
});

describe('FE-2b — the confound sign-prompt + side-by-side What-If', () => {
  it('renders the rival + two separate What-Ifs (never summed) + the mark-opposite action', () => {
    const onMarkConfoundOpposite = vi.fn();
    const confound: Record<string, ConfoundRivalView> = {
      SHIFT: {
        rivalId: 'h2',
        rivalName: 'Spindle wear',
        sharedFindingId: 'f-shared',
        whatIf: { cpk: 1.1, coveragePct: 40 },
      },
    };
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
        whatIf={{ cpk: 0.95, coveragePct: 60 }}
        confoundByFactor={confound}
        onMarkConfoundOpposite={onMarkConfoundOpposite}
      />
    );
    const prompt = screen.getByTestId('confound-prompt-SHIFT');
    // The rival name appears in the prompt copy + the rival's What-If label.
    expect(within(prompt).getAllByText(/Spindle wear/).length).toBeGreaterThan(0);
    // Two SEPARATE What-If cells — this hub's 0.95 and the rival's 1.10, never a sum.
    expect(
      within(screen.getByTestId('confound-whatif-self-SHIFT')).getByText('0.95')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('confound-whatif-rival-SHIFT')).getByText('1.10')
    ).toBeInTheDocument();
    expect(within(prompt).getByText(/not additive/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confound-mark-opposite-SHIFT'));
    expect(onMarkConfoundOpposite).toHaveBeenCalledWith('h2', 'f-shared');
  });

  it('hides the confound prompt when no rival cites the factor', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={readyFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    expect(screen.queryByTestId('confound-prompt-SHIFT')).toBeNull();
  });
});
