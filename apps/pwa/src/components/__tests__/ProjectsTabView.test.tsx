import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectsTabView from '../ProjectsTabView';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { getImprovementProjectInitialState, useImprovementProjectStore } from '@variscout/stores';

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

  it('never exposes a sign-off section — PWA is a Mode-1 solo surface (IM-7 §9.2)', () => {
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
        onProjectPatch={() => {}}
      />
    );

    // Solo project has no collaboratedAt marker → the team-rail sign-off
    // section self-hides, and PWA wires no sign-off callbacks at all.
    expect(screen.queryByRole('button', { name: /request approval/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Signoff' })).not.toBeInTheDocument();
  });

  it('sign-off section stays absent even after collaboratedAt is stamped (no PWA callbacks wired)', () => {
    // After a local invite the PWA stamps collaboratedAt, but PWA never wires
    // onRequestSignoff / onNudgeSignoff / onApproveSignoff (§9.2 solo contract).
    // The team-rail must NOT render the Signoff section in this state — the
    // gating is on callbacks present, not just collaboratedAt.
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP({
        collaboratedAt: 1_700_000_000_000,
        metadata: {
          title: 'Post-invite PWA project',
          members: [
            {
              id: 'pm-1',
              createdAt: 0,
              deletedAt: null,
              userId: 'member@example.com',
              displayName: 'Member',
              role: 'member',
              invitedAt: 0,
            },
          ],
        },
      }),
    };

    render(
      <ProjectsTabView
        activeHub={hub}
        selectedProjectId="ip-1"
        onSelectProject={() => {}}
        onProjectPatch={() => {}}
        // Intentionally no sign-off callbacks — PWA never passes them.
      />
    );

    expect(screen.queryByRole('button', { name: /request approval/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Signoff' })).not.toBeInTheDocument();
  });

  it('threads PWA_USER_ID into IPDetailPage — charter team section is visible', () => {
    // Use 'draft' status so charter is the default active stage (deriveStageState returns
    // charter: 'current' for drafts, approach: 'current' for active which shifts the default).
    const hub: ProcessHub = {
      ...baseHub,
      improvementProject: makeIP({ status: 'draft', metadata: { title: 'PWA project' } }),
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
      improvementProject: makeIP({
        status: 'draft',
        metadata: { title: 'PWA members test' },
        goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
      }),
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
      useImprovementProjectStore.getState().getProjectForHub('hub-1')?.metadata.members
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'lead@example.com', role: 'lead' }),
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
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'lead@example.com' },
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
              userId: 'analyst@local',
              displayName: 'Analyst',
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
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'member@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'member' } });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));

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
              userId: 'analyst@local',
              displayName: 'Analyst',
              role: 'lead',
              invitedAt: 0,
            },
            {
              id: 'pm-member',
              createdAt: 0,
              deletedAt: null,
              userId: 'member@example.com',
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
