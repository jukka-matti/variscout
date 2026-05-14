import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IPDetailPage from '../IPDetailPage';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'Heads 5-8 Cpk shortfall' },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.61, target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('IPDetailPage', () => {
  it('renders header + stage tabs + mode toggle + team rail', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('ip-detail-title')).toHaveTextContent('Heads 5-8 Cpk shortfall');
    expect(screen.getByTestId('stage-tab-charter')).toBeInTheDocument();
    expect(screen.getByTestId('mode-overview')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('ip-detail-team-rail')).toBeInTheDocument();
  });

  it('defaults to the current stage when one is set', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('stage-tab-approach')).toHaveAttribute('aria-selected', 'true');
  });

  it('renders stage placeholder body until later PRs fill in content', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('stage-body-approach')).toBeInTheDocument();
  });
});
