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

describe('canAccess', () => {
  it('Lead can edit any project surface', () => {
    expect(canAccess('lead@org', members, 'edit-charter')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-approach')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-improve')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-sustainment')).toBe(true);
    expect(canAccess('lead@org', members, 'manage-membership')).toBe(true);
    expect(canAccess('lead@org', members, 'view-report')).toBe(true);
  });

  it('Member can edit working surfaces but not manage membership', () => {
    expect(canAccess('member@org', members, 'edit-charter')).toBe(true);
    expect(canAccess('member@org', members, 'edit-approach')).toBe(true);
    expect(canAccess('member@org', members, 'edit-improve')).toBe(true);
    expect(canAccess('member@org', members, 'edit-sustainment')).toBe(true);
    expect(canAccess('member@org', members, 'manage-membership')).toBe(false);
    expect(canAccess('member@org', members, 'view-report')).toBe(true);
  });

  it('Sponsor sees Report-only, nothing else', () => {
    expect(canAccess('sponsor@org', members, 'view-report')).toBe(true);
    expect(canAccess('sponsor@org', members, 'edit-charter')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-approach')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-improve')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-sustainment')).toBe(false);
    expect(canAccess('sponsor@org', members, 'manage-membership')).toBe(false);
  });

  it('Non-member has no access', () => {
    expect(canAccess('stranger@org', members, 'view-report')).toBe(false);
    expect(canAccess('stranger@org', members, 'edit-charter')).toBe(false);
  });
});
