import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CharterOverview from '../CharterOverview';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const baseIP: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'X' },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('CharterOverview', () => {
  it('shows Goal status as set when outcomeGoal has a target', () => {
    render(<CharterOverview ip={baseIP} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-goal')).toHaveTextContent(/1\.33/);
  });

  it('shows Goal as pending when outcomeSpecId empty and target falsy', () => {
    const ip: ImprovementProject = {
      ...baseIP,
      goal: { outcomeGoal: { outcomeSpecId: '', target: 0 } },
    };
    render(<CharterOverview ip={ip} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-goal')).toHaveTextContent(/not yet set/i);
  });

  it('counts hypotheses + findings linked', () => {
    const ip: ImprovementProject = {
      ...baseIP,
      sections: {
        ...baseIP.sections,
        investigationLineage: { hypothesisIds: ['h1', 'h2'], findingIds: ['f1', 'f2', 'f3'] },
      },
    };
    render(<CharterOverview ip={ip} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-investigation')).toHaveTextContent(/2 hypotheses · 3 findings/);
  });
});
