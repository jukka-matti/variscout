import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectsTabView from '../ProjectsTabView';
import type { ProcessHub } from '@variscout/core';
import { getImprovementProjectInitialState, useImprovementProjectStore } from '@variscout/stores';

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

  it('renders an empty-state CTA when the hub has no IPs', () => {
    const onStartNewProject = vi.fn();
    render(
      <ProjectsTabView
        activeHub={baseHub}
        selectedProjectId={null}
        onSelectProject={() => {}}
        onStartNewProject={onStartNewProject}
      />
    );
    fireEvent.click(screen.getByText(/start your first project/i));
    expect(onStartNewProject).toHaveBeenCalledTimes(1);
  });

  it('renders a list of IP cards when projects exist', () => {
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
          goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }] },
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
    fireEvent.click(screen.getByText(/new project/i));
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
          goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }] },
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

  it('threads PWA_USER_ID into IPDetailPage — charter team section is visible', () => {
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
          metadata: { title: 'PWA project' },
          goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
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
      />
    );

    // charter-team-section appears when onInvite is wired (requires onMembersChange to be passed)
    expect(screen.getByTestId('charter-team-section')).toBeInTheDocument();
  });

  it('onMembersChange flows through applyProjectPatch for the PWA app', () => {
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
          metadata: { title: 'PWA members test' },
          goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
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

    // Open invite modal and submit a new member
    fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'lead@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'lead' } });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));

    expect(onProjectPatch).toHaveBeenCalledWith(
      'ip-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ userId: 'lead@example.com', role: 'lead' }),
          ]),
        }),
      })
    );
    expect(
      useImprovementProjectStore.getState().getProjectsForHub('hub-1')[0]?.metadata.members
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'lead@example.com', role: 'lead' }),
      ])
    );
  });
});
