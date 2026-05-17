import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core';
import { getImprovementProjectInitialState, useImprovementProjectStore } from '@variscout/stores';
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
  beforeEach(() => {
    useImprovementProjectStore.setState(getImprovementProjectInitialState());
  });

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

  it('updates the project store and emits a patch from detail signoff actions', () => {
    const onProjectPatch = vi.fn();
    const hub: ProcessHub = {
      ...baseHub,
      processOwner: { displayName: 'Pat Process', upn: 'pat@example.com' },
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
        selectedProjectId="ip-1"
        onSelectProject={() => {}}
        onProjectPatch={onProjectPatch}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /request approval/i }));

    expect(onProjectPatch).toHaveBeenCalledWith(
      'ip-1',
      expect.objectContaining({
        signoff: expect.objectContaining({ requestedAt: expect.any(Number) }),
      })
    );
    expect(useImprovementProjectStore.getState().getProjectsForHub('hub-1')[0]?.signoff).toEqual(
      expect.objectContaining({ requestedAt: expect.any(Number) })
    );
  });

  it('threads currentUserId into IPDetailPage — charter team section is visible', () => {
    // Use 'draft' status so charter is the default active stage (deriveStageState returns
    // charter: 'current' for drafts, approach: 'current' for active which shifts the default).
    const hub: ProcessHub = {
      ...baseHub,
      improvementProjects: [
        {
          id: 'ip-1',
          hubId: 'hub-1',
          createdAt: 0,
          updatedAt: 0,
          deletedAt: null,
          status: 'draft',
          metadata: { title: 'Azure project' },
          goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
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
        selectedProjectId="ip-1"
        onSelectProject={() => {}}
        onProjectPatch={() => {}}
        currentUserId="analyst@contoso.com"
      />
    );

    // charter-team-section appears when onInvite is wired (requires onMembersChange to be passed)
    expect(screen.getByTestId('charter-team-section')).toBeInTheDocument();
  });

  it('onMembersChange flows through applyProjectPatch for the Azure app', () => {
    const onProjectPatch = vi.fn();
    const hub: ProcessHub = {
      ...baseHub,
      improvementProjects: [
        {
          id: 'ip-1',
          hubId: 'hub-1',
          createdAt: 0,
          updatedAt: 0,
          deletedAt: null,
          status: 'draft',
          metadata: { title: 'Azure members test' },
          goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
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
        selectedProjectId="ip-1"
        onSelectProject={() => {}}
        onProjectPatch={onProjectPatch}
        currentUserId="analyst@contoso.com"
      />
    );

    // Open invite modal and submit a new member
    fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'lead@contoso.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'lead' } });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));

    expect(onProjectPatch).toHaveBeenCalledWith(
      'ip-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ userId: 'lead@contoso.com', role: 'lead' }),
          ]),
        }),
      })
    );
    expect(
      useImprovementProjectStore.getState().getProjectsForHub('hub-1')[0]?.metadata.members
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'lead@contoso.com', role: 'lead' }),
      ])
    );
  });
});
