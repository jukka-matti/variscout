/**
 * HypothesisCardWithPlans — FE-2a test-plan triad + per-hypothesis What-If
 * SEAM tests. Renders the REAL card (no injected leaf) and asserts on REAL
 * output: the triad renders the derived factors with the right tool per
 * data-type; tapping Evaluate fires onEvaluateFactor(hubId, factor); a gap
 * factor's "+ Measurement Plan" opens the AddPlanForm with primaryFactor
 * pre-filled; the per-hypothesis What-If renders. A dead feature FAILS these.
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
import { HypothesisCardWithPlans, type TestPlanFactorView } from '../HypothesisCardWithPlans';
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
  investigationId: 'inv-1',
};

const findings: Finding[] = [];

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

const baseProps = {
  hub,
  x: 100,
  y: 100,
  plans: [],
  members: [] as ProjectMember[], // open-access (V1 single-user)
  currentUserId: null,
  findings,
  onAddPlan: vi.fn(),
  onLinkFinding: vi.fn(),
  onEditPlan: vi.fn(),
};

describe('HypothesisCardWithPlans — FE-2a test-plan triad', () => {
  it('renders the derived factors with the auto-suggested tool per data-type', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      { factor: 'SHIFT', readiness: 'ready', tool: 'two-sample' },
      { factor: 'TEMP', readiness: 'ready', tool: 'regression' },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    const shift = screen.getByTestId('test-plan-factor-SHIFT');
    expect(within(shift).getByText('SHIFT')).toBeInTheDocument();
    expect(within(shift).getByText(/Boxplot \+ 2-sample/)).toBeInTheDocument();
    const temp = screen.getByTestId('test-plan-factor-TEMP');
    expect(within(temp).getByText(/Scatter \+ regression/)).toBeInTheDocument();
  });

  it('fires onEvaluateFactor(hubId, factor) when a ready factor is tapped', () => {
    const onEvaluateFactor = vi.fn();
    const testPlanFactors: TestPlanFactorView[] = [
      { factor: 'SHIFT', readiness: 'ready', tool: 'two-sample' },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={onEvaluateFactor}
      />
    );
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
    expect(onEvaluateFactor).toHaveBeenCalledWith('h1', 'SHIFT');
  });

  it('a gap factor opens the AddPlanForm with primaryFactor pre-filled', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      { factor: 'OPERATOR', readiness: 'gap', tool: null },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    // No evaluate CTA for a gap factor — only the plan affordance.
    expect(screen.queryByTestId('evaluate-factor-OPERATOR')).toBeNull();
    fireEvent.click(screen.getByTestId('plan-factor-OPERATOR'));
    const primaryFactor = screen.getByLabelText('Primary factor') as HTMLInputElement;
    expect(primaryFactor.value).toBe('OPERATOR');
  });

  it('renders the empty-state when no factors are derived', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...baseProps} testPlanFactors={[]} onEvaluateFactor={vi.fn()} />
    );
    expect(screen.getByTestId('test-plan-triad')).toBeInTheDocument();
    expect(screen.queryByTestId('evaluate-factor-SHIFT')).toBeNull();
  });

  it('hides the triad entirely when testPlanFactors is undefined', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} />);
    expect(screen.queryByTestId('test-plan-triad')).toBeNull();
  });
});

describe('HypothesisCardWithPlans — FE-2a per-hypothesis What-If', () => {
  it('renders the projected Cpk + coverage when provided', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} whatIf={{ cpk: 1.42, coveragePct: 38 }} />);
    const block = screen.getByTestId('hypothesis-whatif');
    expect(within(block).getByTestId('hypothesis-whatif-value').textContent).toContain('1.42');
    expect(within(block).getByTestId('hypothesis-whatif-value').textContent).toContain('38');
  });

  it('renders the no-projection caption when cpk is null', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...baseProps} whatIf={{ cpk: null, coveragePct: null }} />
    );
    expect(screen.getByTestId('hypothesis-whatif')).toBeInTheDocument();
    expect(screen.queryByTestId('hypothesis-whatif-value')).toBeNull();
  });

  it('hides the What-If block when whatIf is undefined', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps} />);
    expect(screen.queryByTestId('hypothesis-whatif')).toBeNull();
  });
});
