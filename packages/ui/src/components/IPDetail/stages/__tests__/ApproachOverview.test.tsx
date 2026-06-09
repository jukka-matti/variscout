import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { CauseProjectionInputs } from '../causeProjection';
import ApproachOverview from '../ApproachOverview';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'Heads 5-8 Cpk shortfall' },
  goal: {
    outcomeGoals: [{ outcomeSpecId: 'o-1', baseline: 0.61, target: 1.33 }],
    factorControls: [],
  },
  sections: { background: {}, approach: {}, outcomeReference: {} },
};

const causeInputs: CauseProjectionInputs = {
  hypotheses: [],
  ideas: [],
  actions: [],
};

describe('ApproachOverview', () => {
  it('renders project action and hypothesis signal chips', () => {
    render(
      <ApproachOverview
        ip={ip}
        causeInputs={causeInputs}
        onOpenWorkbench={() => {}}
        onOpenWall={() => {}}
        onOpenAnalyze={() => {}}
        onOpenProcess={() => {}}
        overviewSignals={{
          hypotheses: { total: 4, supported: 2, untested: 2 },
          findings: { total: 3, analyzed: 3 },
          measurementPlans: { total: 1, planned: 1 },
          actions: { total: 5, open: 1, inProgress: 2, done: 2 },
          team: { total: 3, lead: 1, member: 1, sponsor: 1 },
        }}
      />
    );

    expect(screen.getByTestId('project-signal-hypotheses')).toHaveTextContent(/4 hypotheses/i);
    expect(screen.getByTestId('project-signal-actions')).toHaveTextContent(/5 actions/i);
  });
});
