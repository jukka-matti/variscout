import { describe, it, expect } from 'vitest';
import { reduceProjectMembers, type MembershipAction } from './actions';
import type { ProjectMember } from './types';

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

  it('rejects PROJECT_MEMBER_UPDATE patch attempting to change id / userId / invitedAt / createdAt / deletedAt', () => {
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
    const badAction = {
      kind: 'PROJECT_MEMBER_UPDATE' as const,
      projectId: 'ip-1',
      memberId: 'pm-1',
      patch: { id: 'pm-99' } as unknown as Partial<ProjectMember>,
    };
    expect(() => reduceProjectMembers(start, badAction as MembershipAction)).toThrow();
  });
});
