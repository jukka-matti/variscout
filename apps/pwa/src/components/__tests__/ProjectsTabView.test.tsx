import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectsTabView from '../ProjectsTabView';
import type { ProcessHub } from '@variscout/core';

const baseHub: ProcessHub = {
  id: 'hub-1',
  name: 'Filling Line 3',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  outcomes: [],
  improvementProjects: [],
};

describe('ProjectsTabView', () => {
  it('renders an empty-state CTA when the hub has no IPs', () => {
    render(
      <ProjectsTabView activeHub={baseHub} selectedProjectId={null} onSelectProject={() => {}} />
    );
    expect(screen.getByText(/start your first improvement project/i)).toBeInTheDocument();
  });

  it('renders a list of IP cards when projects exist', () => {
    const hub: ProcessHub = {
      ...baseHub,
      improvementProjects: [
        {
          id: 'ip-1',
          hubId: 'hub-1',
          createdAt: 0,
          updatedAt: 0,
          deletedAt: null,
          status: 'active',
          metadata: { title: 'Heads 5-8 Cpk shortfall' },
          goal: { outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 } },
          sections: {
            background: {},
            investigationLineage: {},
            approach: {},
            outcomeReference: {},
          },
        },
      ],
    };
    render(<ProjectsTabView activeHub={hub} selectedProjectId={null} onSelectProject={() => {}} />);
    expect(screen.getByText('Heads 5-8 Cpk shortfall')).toBeInTheDocument();
  });
});
