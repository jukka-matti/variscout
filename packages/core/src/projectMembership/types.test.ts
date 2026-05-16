import { describe, it, expect } from 'vitest';
import type { ProjectRole, ProjectMember, Invitation } from './types';

describe('ProjectRole', () => {
  it('exhaustively enumerates Lead / Member / Sponsor', () => {
    const roles: ProjectRole[] = ['lead', 'member', 'sponsor'];
    expect(roles).toHaveLength(3);
  });
});

describe('ProjectMember', () => {
  it('has required fields', () => {
    const m: ProjectMember = {
      id: 'pm-1',
      createdAt: 1234567890,
      deletedAt: null,
      userId: 'user@org.com',
      displayName: 'Pat Lee',
      role: 'lead',
      invitedAt: 1234567890,
      acceptedAt: 1234567900,
    };
    expect(m.role).toBe('lead');
  });
});

describe('Invitation', () => {
  it('has required fields with pending state', () => {
    const inv: Invitation = {
      id: 'inv-1',
      createdAt: 1234567890,
      deletedAt: null,
      projectId: 'ip-1',
      userId: 'user@org.com',
      displayName: 'Pat Lee',
      role: 'member',
      invitedAt: 1234567890,
      status: 'pending',
    };
    expect(inv.status).toBe('pending');
  });
});
