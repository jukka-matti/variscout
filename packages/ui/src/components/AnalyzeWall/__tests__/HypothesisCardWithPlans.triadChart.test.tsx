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
import { render, screen } from '@testing-library/react';
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
  displayStatus: hub.status,
  x: 100,
  y: 100,
  plans: [],
  members: [] as ProjectMember[],
  currentUserId: null,
  findings,
  onAddPlan: vi.fn(),
  onLinkFinding: vi.fn(),
  onEditPlan: vi.fn(),
};

describe('HypothesisCardWithPlans — triad inline chart (PR-CS-9)', () => {
  it('renders a chart ONLY for ready factors that carry a chart payload', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      {
        factor: 'TEMP',
        readiness: 'ready',
        tool: 'regression',
        chart: {
          kind: 'scatter',
          points: [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 5 },
          ],
          fittedLine: [
            { x: 1, y: 2 },
            { x: 3, y: 5 },
          ],
          isSignificant: true,
        },
      },
      // NEGATIVE CONTROL A: ready but NO chart payload (e.g. hub not focused) → no chart.
      { factor: 'SHIFT', readiness: 'ready', tool: 'two-sample' },
      // NEGATIVE CONTROL B: a gap factor → the plan affordance, never a chart.
      { factor: 'OPERATOR', readiness: 'gap', tool: null },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    expect(screen.getByTestId('triad-chart-TEMP')).toBeInTheDocument();
    expect(screen.getByTestId('mini-scatter-fit')).toBeInTheDocument();
    expect(screen.queryByTestId('triad-chart-SHIFT')).toBeNull();
    expect(screen.queryByTestId('triad-chart-OPERATOR')).toBeNull();
    expect(screen.getByTestId('plan-factor-OPERATOR')).toBeInTheDocument();
  });

  it('renders a boxplot chart for a two-sample factor that carries a boxplot payload', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      {
        factor: 'SHIFT',
        readiness: 'ready',
        tool: 'two-sample',
        chart: {
          kind: 'boxplot',
          groups: [
            { category: 'Day', values: [10, 11, 12, 13, 14, 15, 16] },
            { category: 'Night', values: [30, 31, 32, 33, 34, 35, 36] },
          ],
        },
      },
    ];
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps}
        testPlanFactors={testPlanFactors}
        onEvaluateFactor={vi.fn()}
      />
    );
    const wrap = screen.getByTestId('triad-chart-SHIFT');
    expect(wrap).toBeInTheDocument();
    expect(screen.getByLabelText('mini boxplot')).toBeInTheDocument();
  });
});
