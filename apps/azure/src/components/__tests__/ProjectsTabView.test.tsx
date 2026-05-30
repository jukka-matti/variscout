import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { getImprovementProjectInitialState, useImprovementProjectStore } from '@variscout/stores';
import ProjectsTabView from '../ProjectsTabView';

const baseHub: ProcessHub = {
  id: 'hub-1',
  name: 'Filling Line 3',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  outcomes: [],
  // no improvementProject by default (empty hub)
};

function makeIP(overrides?: Partial<ImprovementProject>): ImprovementProject {
  return {
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
    ...overrides,
  };
}

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

    fireEvent.click(screen.getByText(/start your first project/i));
    expect(onStartNewProject).toHaveBeenCalledTimes(1);
  });

  it('routes the list CTA to new IP creation', () => {
    const onStartNewProject = vi.fn();
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP(),
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
      improvementProject: makeIP(),
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
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')?.signoff).toEqual(
      expect.objectContaining({ requestedAt: expect.any(Number) })
    );
  });

  it('threads currentUserId into IPDetailPage — charter team section is visible', () => {
    // Use 'draft' status so charter is the default active stage (deriveStageState returns
    // charter: 'current' for drafts, approach: 'current' for active which shifts the default).
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP({ status: 'draft', metadata: { title: 'Azure project' } }),
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
      improvementProject: makeIP({
        status: 'draft',
        metadata: { title: 'Azure members test' },
        goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
      }),
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
      useImprovementProjectStore.getState().getProjectForHub('hub-1')?.metadata.members
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'lead@contoso.com', role: 'lead' }),
      ])
    );
  });

  it('sets collaboratedAt once on the first invite (roster grows from solo)', () => {
    const onProjectPatch = vi.fn();
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP({ status: 'draft', metadata: { title: 'First invite' } }),
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

    fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'lead@contoso.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'lead' } });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));

    expect(onProjectPatch).toHaveBeenCalledWith(
      'ip-1',
      expect.objectContaining({ collaboratedAt: expect.any(Number) })
    );
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')?.collaboratedAt).toEqual(
      expect.any(Number)
    );
  });

  it('does not re-stamp collaboratedAt on a second invite (idempotent)', () => {
    const onProjectPatch = vi.fn();
    const existingMarker = 1_700_000_000_000;
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP({
        status: 'draft',
        metadata: {
          title: 'Already collaborative',
          members: [
            {
              id: 'pm-lead',
              createdAt: 0,
              deletedAt: null,
              userId: 'analyst@contoso.com',
              displayName: 'Analyst Lead',
              role: 'lead',
              invitedAt: 0,
            },
          ],
        },
        collaboratedAt: existingMarker,
      }),
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

    fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'member@contoso.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'member' } });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));

    // The second invite patches members but must NOT carry a collaboratedAt key
    // (the marker is set-once; re-stamping would move the durable timestamp).
    const lastPatch = onProjectPatch.mock.calls.at(-1)?.[1] ?? {};
    expect(lastPatch).not.toHaveProperty('collaboratedAt');
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')?.collaboratedAt).toBe(
      existingMarker
    );
  });

  it('does not clear collaboratedAt when a member is removed (durable marker)', () => {
    const onProjectPatch = vi.fn();
    const existingMarker = 1_700_000_000_000;
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP({
        status: 'draft',
        metadata: {
          title: 'Removal keeps marker',
          members: [
            {
              id: 'pm-lead',
              createdAt: 0,
              deletedAt: null,
              userId: 'analyst@contoso.com',
              displayName: 'Analyst Lead',
              role: 'lead',
              invitedAt: 0,
            },
            {
              id: 'pm-member',
              createdAt: 0,
              deletedAt: null,
              userId: 'member@contoso.com',
              displayName: 'Member',
              role: 'member',
              invitedAt: 0,
            },
          ],
        },
        collaboratedAt: existingMarker,
      }),
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

    fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

    const lastPatch = onProjectPatch.mock.calls.at(-1)?.[1] ?? {};
    expect(lastPatch).not.toHaveProperty('collaboratedAt');
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')?.collaboratedAt).toBe(
      existingMarker
    );
  });
});
