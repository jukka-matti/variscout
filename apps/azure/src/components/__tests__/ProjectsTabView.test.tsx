import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core';
import ProjectsTabView from '../ProjectsTabView';

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
  it('routes the empty-state CTA to new IP creation', () => {
    const onStartNewProject = vi.fn();

    render(
      <ProjectsTabView
        activeHub={baseHub}
        selectedProjectId={null}
        onSelectProject={() => {}}
        onStartNewProject={onStartNewProject}
      />
    );

    fireEvent.click(screen.getByText(/start your first improvement project/i));
    expect(onStartNewProject).toHaveBeenCalledTimes(1);
  });

  it('routes the list CTA to new IP creation', () => {
    const onStartNewProject = vi.fn();
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

    render(
      <ProjectsTabView
        activeHub={hub}
        selectedProjectId={null}
        onSelectProject={() => {}}
        onStartNewProject={onStartNewProject}
      />
    );

    expect(screen.getByText('Heads 5-8 Cpk shortfall')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/new improvement project/i));
    expect(onStartNewProject).toHaveBeenCalledTimes(1);
  });
});
