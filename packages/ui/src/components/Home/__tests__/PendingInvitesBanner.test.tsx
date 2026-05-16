import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PendingInvitesBanner } from '../PendingInvitesBanner';
import type { Invitation } from '@variscout/core/projectMembership';

const inviteA: Invitation = {
  id: 'inv-A',
  projectId: 'ip-1',
  createdAt: 100,
  deletedAt: null,
  userId: 'mira@org',
  displayName: 'Mira',
  role: 'member',
  invitedAt: 100,
  status: 'pending',
};

const inviteB: Invitation = {
  id: 'inv-B',
  projectId: 'ip-2',
  createdAt: 200,
  deletedAt: null,
  userId: 'mira@org',
  displayName: 'Mira',
  role: 'sponsor',
  invitedAt: 200,
  status: 'pending',
};

describe('PendingInvitesBanner', () => {
  it('renders null when invites is empty', () => {
    const { container } = render(
      <PendingInvitesBanner invites={[]} onAccept={() => {}} onDecline={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a collapsed banner showing the invite count', () => {
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={() => {}} onDecline={() => {}} />);
    expect(screen.getByText(/1 pending invitation/i)).toBeInTheDocument();
  });

  it('uses plural copy for multiple invites', () => {
    render(
      <PendingInvitesBanner invites={[inviteA, inviteB]} onAccept={() => {}} onDecline={() => {}} />
    );
    expect(screen.getByText(/2 pending invitations/i)).toBeInTheDocument();
  });

  it('expands to show per-invite rows when the toggle is clicked', () => {
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={() => {}} onDecline={() => {}} />);
    // Collapsed: per-invite buttons not visible
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    // Click toggle
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    // Expanded: rows now visible
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('calls onAccept with the invite id', () => {
    const onAccept = vi.fn();
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={onAccept} onDecline={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledWith('inv-A');
  });

  it('calls onDecline with the invite id', () => {
    const onDecline = vi.fn();
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={() => {}} onDecline={onDecline} />);
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    fireEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(onDecline).toHaveBeenCalledWith('inv-A');
  });

  it('renders each invite with its role label', () => {
    render(
      <PendingInvitesBanner invites={[inviteA, inviteB]} onAccept={() => {}} onDecline={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    expect(screen.getByText(/member/i)).toBeInTheDocument();
    expect(screen.getByText(/sponsor/i)).toBeInTheDocument();
  });
});
