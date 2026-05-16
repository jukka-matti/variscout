import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { usePreferencesStore } from '@variscout/stores';
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

beforeEach(() => {
  usePreferencesStore.setState(usePreferencesStore.getInitialState());
});

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

  it('renders CharterOverview when activeStage = charter and mode = overview', () => {
    const charterIP: ImprovementProject = { ...ip, status: 'draft' };
    render(<IPDetailPage ip={charterIP} onBackToList={() => {}} />);
    expect(screen.getByTestId('kpi-issue')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-goal')).toBeInTheDocument();
  });

  it('renders an empty team roster in the rail', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('ip-detail-team-rail')).toHaveTextContent('Team · 0');
    expect(screen.getByText('No team members yet')).toBeInTheDocument();
  });

  it('renders populated team roster rows with role labels and RACI chips', () => {
    const rosterIP: ImprovementProject = {
      ...ip,
      metadata: {
        ...ip.metadata,
        team: [
          { role: 'projectLead', person: { displayName: 'Alex Lead', upn: 'alex@example.com' } },
          { role: 'teamMember', person: { displayName: 'Blair SME' } },
        ],
      },
    };

    render(<IPDetailPage ip={rosterIP} onBackToList={() => {}} />);

    const leadRow = screen.getByTestId('ip-team-row-0');
    expect(within(leadRow).getByText('Alex Lead')).toBeInTheDocument();
    expect(within(leadRow).getByText('Project lead')).toBeInTheDocument();
    expect(within(leadRow).getByText('R')).toBeInTheDocument();

    const memberRow = screen.getByTestId('ip-team-row-1');
    expect(within(memberRow).getByText('Blair SME')).toBeInTheDocument();
    expect(within(memberRow).getByText('Team member')).toBeInTheDocument();
    expect(within(memberRow).getByText('C')).toBeInTheDocument();
  });

  it('validates invite name and appends a team member through onTeamChange', () => {
    const onTeamChange = vi.fn();
    const rosterIP: ImprovementProject = {
      ...ip,
      metadata: {
        ...ip.metadata,
        team: [{ role: 'sponsor', person: { displayName: 'Morgan Sponsor' } }],
      },
    };

    render(<IPDetailPage ip={rosterIP} onBackToList={() => {}} onTeamChange={onTeamChange} />);

    fireEvent.click(screen.getByTestId('ip-detail-invite'));
    expect(screen.getByRole('dialog', { name: 'Invite team member' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save invite' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(onTeamChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Casey Owner' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'casey@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'processOwner' } });
    fireEvent.change(screen.getByLabelText('RACI assignment'), { target: { value: 'I' } });
    expect(screen.getByTestId('invite-raci-preview')).toHaveTextContent('I');

    fireEvent.click(screen.getByRole('button', { name: 'Save invite' }));

    expect(onTeamChange).toHaveBeenCalledWith([
      { role: 'sponsor', person: { displayName: 'Morgan Sponsor' } },
      {
        role: 'processOwner',
        raci: 'I',
        person: { displayName: 'Casey Owner', upn: 'casey@example.com' },
      },
    ]);
  });

  it('persists the selected invite RACI with the team member', () => {
    const StatefulPage = () => {
      const [currentIP, setCurrentIP] = useState<ImprovementProject>(ip);
      return (
        <IPDetailPage
          key={currentIP.metadata.team?.length ?? 0}
          ip={currentIP}
          onBackToList={() => {}}
          onTeamChange={team =>
            setCurrentIP({ ...currentIP, metadata: { ...currentIP.metadata, team } })
          }
        />
      );
    };

    render(<StatefulPage />);

    fireEvent.click(screen.getByTestId('ip-detail-invite'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Casey Owner' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'processOwner' } });
    fireEvent.change(screen.getByLabelText('RACI assignment'), { target: { value: 'I' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save invite' }));

    const row = screen.getByTestId('ip-team-row-0');
    expect(within(row).getByText('Casey Owner')).toBeInTheDocument();
    expect(within(row).getByText('I')).toBeInTheDocument();
  });

  it('defaults tablet team rail to collapsed and remembers expansion preference', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);

    const expandButton = screen.getByRole('button', { name: 'Expand team rail' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(expandButton);

    expect(usePreferencesStore.getState().isIPTeamRailExpanded).toBe(true);
    expect(screen.getByRole('button', { name: 'Collapse team rail' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('opens and closes the mobile team drawer from the header team button', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);

    expect(screen.queryByRole('dialog', { name: 'Team workspace' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open team workspace' }));

    const drawer = screen.getByRole('dialog', { name: 'Team workspace' });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByTestId('ip-detail-team-rail')).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Close team workspace' }));
    expect(screen.queryByRole('dialog', { name: 'Team workspace' })).not.toBeInTheDocument();
  });

  // Task 8 — wedge members[] wiring via Charter team section
  describe('Charter team section (wedge members[])', () => {
    const charterIP: ImprovementProject = { ...ip, status: 'draft' };

    it('shows the Charter team section when onMembersChange is provided', () => {
      render(
        <IPDetailPage
          ip={charterIP}
          onBackToList={() => {}}
          currentUserId="lead@org"
          onMembersChange={() => {}}
        />
      );
      expect(screen.getByTestId('charter-team-section')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /invite team/i })).toBeInTheDocument();
    });

    it('does not show the Charter team section when onMembersChange is absent', () => {
      render(<IPDetailPage ip={charterIP} onBackToList={() => {}} currentUserId="lead@org" />);
      expect(screen.queryByTestId('charter-team-section')).not.toBeInTheDocument();
    });

    it('calls onMembersChange with a new ProjectMember when invite is submitted', () => {
      const onMembersChange = vi.fn();
      render(
        <IPDetailPage
          ip={charterIP}
          onBackToList={() => {}}
          currentUserId="lead@org"
          onMembersChange={onMembersChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'pat@org.com' } });
      fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'member' } });
      fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));

      expect(onMembersChange).toHaveBeenCalledOnce();
      const [newMembers] = onMembersChange.mock.calls[0] as [
        import('@variscout/core/projectMembership').ProjectMember[],
      ];
      expect(newMembers).toHaveLength(1);
      expect(newMembers[0].userId).toBe('pat@org.com');
      expect(newMembers[0].displayName).toBe('pat');
      expect(newMembers[0].role).toBe('member');
    });

    it('renders existing members[] in Charter and calls onMembersChange on remove', () => {
      const onMembersChange = vi.fn();
      const withMembers: ImprovementProject = {
        ...charterIP,
        metadata: {
          ...charterIP.metadata,
          members: [
            {
              id: 'pm-lead',
              createdAt: 1,
              deletedAt: null,
              userId: 'lead@org',
              displayName: 'Lead Pat',
              role: 'lead',
              invitedAt: 1,
            },
            {
              id: 'pm-member',
              createdAt: 1,
              deletedAt: null,
              userId: 'member@org',
              displayName: 'Member Mira',
              role: 'member',
              invitedAt: 1,
            },
          ],
        },
      };
      render(
        <IPDetailPage
          ip={withMembers}
          onBackToList={() => {}}
          currentUserId="lead@org"
          onMembersChange={onMembersChange}
        />
      );
      expect(screen.getByText('Lead Pat')).toBeInTheDocument();
      expect(screen.getByText('Member Mira')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Member Mira' }));

      expect(onMembersChange).toHaveBeenCalledOnce();
      const [remaining] = onMembersChange.mock.calls[0] as [
        import('@variscout/core/projectMembership').ProjectMember[],
      ];
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('pm-lead');
    });
  });
});
