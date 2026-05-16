import { describe, it, expect } from 'vitest';
import { reduceProjectMembers, type MembershipAction } from './actions';
import type { ProjectMember, Invitation } from './types';

describe('reduceProjectMembers', () => {
  const initial: ProjectMember[] = [];

  it('adds a member on PROJECT_MEMBER_ADD', () => {
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_ADD',
      projectId: 'ip-1',
      member: {
        id: 'pm-1',
        userId: 'pat@org.com',
        displayName: 'Pat',
        role: 'lead',
        invitedAt: 1,
        createdAt: 1,
        deletedAt: null,
      },
    };
    const next = reduceProjectMembers(initial, action);
    expect(next).toHaveLength(1);
    expect(next[0].role).toBe('lead');
  });

  it('updates a member on PROJECT_MEMBER_UPDATE', () => {
    const start: ProjectMember[] = [
      {
        id: 'pm-1',
        userId: 'p@x',
        displayName: 'P',
        role: 'member',
        invitedAt: 1,
        createdAt: 1,
        deletedAt: null,
      },
    ];
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_UPDATE',
      projectId: 'ip-1',
      memberId: 'pm-1',
      patch: { role: 'lead' },
    };
    const next = reduceProjectMembers(start, action);
    expect(next[0].role).toBe('lead');
  });

  it('removes a member on PROJECT_MEMBER_REMOVE', () => {
    const start: ProjectMember[] = [
      {
        id: 'pm-1',
        userId: 'p@x',
        displayName: 'P',
        role: 'member',
        invitedAt: 1,
        createdAt: 1,
        deletedAt: null,
      },
    ];
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_REMOVE',
      projectId: 'ip-1',
      memberId: 'pm-1',
    };
    const next = reduceProjectMembers(start, action);
    expect(next).toHaveLength(0);
  });
});

describe('reduceProjectMembers — INVITATION_ACCEPT', () => {
  it('appends a synthesized ProjectMember built from the invitation', () => {
    const existingMembers: ProjectMember[] = [];
    const inv: Invitation = {
      id: 'inv-1',
      projectId: 'ip-1',
      createdAt: 100,
      deletedAt: null,
      userId: 'mira@org',
      displayName: 'Mira',
      role: 'member',
      invitedAt: 100,
      status: 'pending',
    };
    const action: MembershipAction = {
      kind: 'INVITATION_ACCEPT',
      projectId: 'ip-1',
      invitation: inv,
      acceptedAt: 200,
    };
    const next = reduceProjectMembers(existingMembers, action);
    expect(next).toHaveLength(1);
    expect(next[0].userId).toBe('mira@org');
    expect(next[0].displayName).toBe('Mira');
    expect(next[0].role).toBe('member');
    expect(next[0].invitedAt).toBe(100);
    expect(next[0].acceptedAt).toBe(200);
    expect(next[0].id).toBeDefined();
    expect(next[0].createdAt).toBe(200);
    expect(next[0].deletedAt).toBeNull();
  });
});

describe('reduceProjectMembers — INVITATION_REVOKE', () => {
  it('does not mutate members[] (invitation status transitions are store-level)', () => {
    const existingMembers: ProjectMember[] = [
      {
        id: 'pm-1',
        createdAt: 1,
        deletedAt: null,
        userId: 'pat@org',
        displayName: 'Pat',
        role: 'lead',
        invitedAt: 1,
      },
    ];
    const action: MembershipAction = {
      kind: 'INVITATION_REVOKE',
      projectId: 'ip-1',
      invitationId: 'inv-1',
      revokedAt: 200,
    };
    const next = reduceProjectMembers(existingMembers, action);
    expect(next).toEqual(existingMembers);
  });
});
