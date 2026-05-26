import { describe, it, expect } from 'vitest';
import { canAccess } from './canAccess';
import type { ProjectMember } from './types';

const members: ProjectMember[] = [
  {
    id: 'pm-1',
    createdAt: 1,
    deletedAt: null,
    userId: 'lead@org',
    displayName: 'L',
    role: 'lead',
    invitedAt: 1,
  },
  {
    id: 'pm-2',
    createdAt: 1,
    deletedAt: null,
    userId: 'member@org',
    displayName: 'M',
    role: 'member',
    invitedAt: 1,
  },
  {
    id: 'pm-3',
    createdAt: 1,
    deletedAt: null,
    userId: 'sponsor@org',
    displayName: 'S',
    role: 'sponsor',
    invitedAt: 1,
  },
];

describe('canAccess (2-tier ACL — Lead + Everyone-else)', () => {
  it('Lead has all four actions (edit + edit-contributions + manage-membership + view-report)', () => {
    expect(canAccess('lead@org', members, 'edit')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-contributions')).toBe(true);
    expect(canAccess('lead@org', members, 'manage-membership')).toBe(true);
    expect(canAccess('lead@org', members, 'view-report')).toBe(true);
  });

  it('Member can edit contributions + view report, but cannot edit structurally or manage membership', () => {
    expect(canAccess('member@org', members, 'edit')).toBe(false);
    expect(canAccess('member@org', members, 'edit-contributions')).toBe(true);
    expect(canAccess('member@org', members, 'manage-membership')).toBe(false);
    expect(canAccess('member@org', members, 'view-report')).toBe(true);
  });

  it('Sponsor can edit contributions + view report (functionally identical to Member at the ACL layer)', () => {
    expect(canAccess('sponsor@org', members, 'edit')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-contributions')).toBe(true);
    expect(canAccess('sponsor@org', members, 'manage-membership')).toBe(false);
    expect(canAccess('sponsor@org', members, 'view-report')).toBe(true);
  });

  it('Member + Sponsor permissions are byte-for-byte identical (intentional — signoff is out-of-band)', () => {
    const actions = ['edit', 'edit-contributions', 'manage-membership', 'view-report'] as const;
    for (const action of actions) {
      expect(canAccess('member@org', members, action)).toBe(
        canAccess('sponsor@org', members, action)
      );
    }
  });

  it("'edit' is the canonical Lead-only structural-write check", () => {
    expect(canAccess('lead@org', members, 'edit')).toBe(true);
    expect(canAccess('member@org', members, 'edit')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit')).toBe(false);
  });

  it('Non-member has no access', () => {
    expect(canAccess('stranger@org', members, 'view-report')).toBe(false);
    expect(canAccess('stranger@org', members, 'edit')).toBe(false);
    expect(canAccess('stranger@org', members, 'edit-contributions')).toBe(false);
    expect(canAccess('stranger@org', members, 'manage-membership')).toBe(false);
  });
});
