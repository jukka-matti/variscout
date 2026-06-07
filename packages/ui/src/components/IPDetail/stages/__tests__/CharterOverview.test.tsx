import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CharterOverview from '../CharterOverview';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProjectMember } from '@variscout/core/projectMembership';

const baseIP: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'X' },
  goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
  sections: { background: {}, approach: {}, outcomeReference: {} },
};

describe('CharterOverview', () => {
  it('shows Goal status as set when outcomeGoal has a target', () => {
    render(<CharterOverview ip={baseIP} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-goal')).toHaveTextContent(/1\.33/);
  });

  it('shows Goal as pending when outcomeSpecId empty and target falsy', () => {
    const ip: ImprovementProject = {
      ...baseIP,
      goal: { outcomeGoals: [{ outcomeSpecId: '', target: 0 }] },
    };
    render(<CharterOverview ip={ip} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-goal')).toHaveTextContent(/not yet set/i);
  });

  it('points the Investigation KPI to the Wall (PO-5 — no lineage counts)', () => {
    render(<CharterOverview ip={baseIP} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-analyze')).toHaveTextContent(
      /Hypotheses \+ findings live on the Wall/
    );
  });

  describe('Team section', () => {
    const twoMembers: ProjectMember[] = [
      {
        id: 'pm-1',
        createdAt: 1,
        deletedAt: null,
        userId: 'lead@org',
        displayName: 'Lead Pat',
        role: 'lead',
        invitedAt: 1,
      },
      {
        id: 'pm-2',
        createdAt: 1,
        deletedAt: null,
        userId: 'member@org',
        displayName: 'Member Mira',
        role: 'member',
        invitedAt: 1,
      },
    ];

    it('renders an "Invite team" button when onInvite is provided', () => {
      render(
        <CharterOverview
          ip={baseIP}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="lead@org"
          onInvite={() => {}}
        />
      );
      expect(screen.getByRole('button', { name: /invite team/i })).toBeInTheDocument();
    });

    it('clicking "Invite team" opens the InviteModal dialog', () => {
      render(
        <CharterOverview
          ip={baseIP}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="lead@org"
          onInvite={() => {}}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
      expect(screen.getByRole('dialog', { name: /invite teammate/i })).toBeInTheDocument();
    });

    it('keeps Invite team visible but disabled when save and rename are required', () => {
      const onInvite = vi.fn();
      render(
        <CharterOverview
          ip={baseIP}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="lead@org"
          onInvite={onInvite}
          inviteDisabledReason="Save and rename this project before inviting others."
        />
      );

      const invite = screen.getByRole('button', { name: /invite team/i });
      expect(invite).toBeDisabled();
      expect(
        screen.getByText('Save and rename this project before inviting others.')
      ).toBeInTheDocument();
      fireEvent.click(invite);
      expect(onInvite).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog', { name: /invite teammate/i })).not.toBeInTheDocument();
    });

    it('renders existing members via MemberList when members are supplied', () => {
      const ip: ImprovementProject = {
        ...baseIP,
        metadata: { ...baseIP.metadata, members: twoMembers },
      };
      render(
        <CharterOverview
          ip={ip}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="lead@org"
          onInvite={() => {}}
          onMemberRemove={() => {}}
        />
      );
      expect(screen.getByText('Lead Pat')).toBeInTheDocument();
      expect(screen.getByText('Member Mira')).toBeInTheDocument();
    });

    it('calls onInvite with email + role when modal form is submitted', () => {
      const onInvite = vi.fn();
      render(
        <CharterOverview
          ip={baseIP}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="lead@org"
          onInvite={onInvite}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /invite team/i }));
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@org.com' } });
      fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'member' } });
      fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
      expect(onInvite).toHaveBeenCalledWith({ email: 'new@org.com', role: 'member' });
    });

    it('calls onMemberRemove with memberId when a lead removes a member', () => {
      const onMemberRemove = vi.fn();
      const ip: ImprovementProject = {
        ...baseIP,
        metadata: { ...baseIP.metadata, members: twoMembers },
      };
      render(
        <CharterOverview
          ip={ip}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="lead@org"
          onInvite={() => {}}
          onMemberRemove={onMemberRemove}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Remove Member Mira' }));
      expect(onMemberRemove).toHaveBeenCalledWith('pm-2');
    });

    it('does not render the Team section when onInvite is not provided', () => {
      render(
        <CharterOverview ip={baseIP} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />
      );
      expect(screen.queryByRole('button', { name: /invite team/i })).not.toBeInTheDocument();
    });

    it('hides the Invite button for non-Lead viewers even when onInvite is provided', () => {
      const charterIPWithMembers: ImprovementProject = {
        ...baseIP,
        metadata: { ...baseIP.metadata, members: twoMembers },
      };
      render(
        <CharterOverview
          ip={charterIPWithMembers}
          onOpenInvestigation={() => {}}
          onOpenAnalyze={() => {}}
          currentUserId="member@org"
          onInvite={() => {}}
          onMemberRemove={() => {}}
        />
      );
      expect(screen.queryByRole('button', { name: /invite team/i })).not.toBeInTheDocument();
    });
  });
});
