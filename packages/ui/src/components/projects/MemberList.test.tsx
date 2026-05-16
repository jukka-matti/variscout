import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemberList } from './MemberList';
import type { ProjectMember } from '@variscout/core/projectMembership';

const members: ProjectMember[] = [
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
  {
    id: 'pm-3',
    createdAt: 1,
    deletedAt: null,
    userId: 'sponsor@org',
    displayName: 'Sponsor Chen',
    role: 'sponsor',
    invitedAt: 1,
  },
];

describe('MemberList', () => {
  it('renders all members with role badges', () => {
    render(<MemberList members={members} currentUserId="lead@org" onRemove={() => {}} />);
    expect(screen.getByText('Lead Pat')).toBeInTheDocument();
    expect(screen.getByText('Member Mira')).toBeInTheDocument();
    expect(screen.getByText('Sponsor Chen')).toBeInTheDocument();
  });

  it('shows Remove button only when current user is Lead (and not for self)', () => {
    render(<MemberList members={members} currentUserId="lead@org" onRemove={() => {}} />);
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(2);
  });

  it('hides Remove button when current user is Member', () => {
    render(<MemberList members={members} currentUserId="member@org" onRemove={() => {}} />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('gives each Remove button an aria-label that includes the displayName', () => {
    render(<MemberList members={members} currentUserId="lead@org" onRemove={() => {}} />);
    expect(screen.getByRole('button', { name: 'Remove Member Mira' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Sponsor Chen' })).toBeInTheDocument();
  });

  it('calls onRemove with memberId on click', () => {
    const onRemove = vi.fn();
    render(<MemberList members={members} currentUserId="lead@org" onRemove={onRemove} />);
    const buttons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledWith('pm-2');
  });
});
