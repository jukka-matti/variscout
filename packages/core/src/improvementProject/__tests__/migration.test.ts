import { describe, it, expect } from 'vitest';
import { migrateTeamToMembers } from '../migration';

describe('migrateTeamToMembers', () => {
  it('maps each legacy role to the wedge role enum', () => {
    const legacyTeam = [
      { role: 'champion' as const, person: { userId: 'u1', displayName: 'C', upn: 'c@org' } },
      { role: 'sponsor' as const, person: { userId: 'u2', displayName: 'S', upn: 's@org' } },
      { role: 'projectLead' as const, person: { userId: 'u3', displayName: 'L', upn: 'l@org' } },
      { role: 'teamMember' as const, person: { userId: 'u4', displayName: 'M', upn: 'm@org' } },
      { role: 'processOwner' as const, person: { userId: 'u5', displayName: 'P', upn: 'p@org' } },
    ];
    const result = migrateTeamToMembers(legacyTeam, 1000);
    expect(result).toHaveLength(5);
    expect(result[0].role).toBe('sponsor');
    expect(result[1].role).toBe('sponsor');
    expect(result[2].role).toBe('lead');
    expect(result[3].role).toBe('member');
    expect(result[4].role).toBe('member');
    result.forEach(m => {
      expect(m.invitedAt).toBe(1000);
      expect(m.createdAt).toBe(1000); // EntityBase
      expect(m.deletedAt).toBeNull(); // EntityBase
    });
  });

  it('drops the RACI field entirely', () => {
    const legacyTeam = [
      {
        role: 'projectLead' as const,
        raci: 'R' as const,
        person: { userId: 'u1', displayName: 'L', upn: 'l@org' },
      },
    ];
    const result = migrateTeamToMembers(legacyTeam, 1000);
    expect(result[0]).not.toHaveProperty('raci');
  });

  it('handles empty / undefined team', () => {
    expect(migrateTeamToMembers([], 1)).toEqual([]);
    expect(migrateTeamToMembers(undefined, 1)).toEqual([]);
  });
});
