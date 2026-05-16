import { describe, it, expect } from 'vitest';
import { migrateImprovementProjectMetadata } from '../migrateMetadata';
import type { ImprovementProject } from '../types';

describe('migrateImprovementProjectMetadata', () => {
  const baseIP: ImprovementProject = {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Test IP' },
    goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.5, target: 1.33 } },
    sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
  };

  it('migrates legacy team[] to members[] when members is absent', () => {
    const legacy: ImprovementProject = {
      ...baseIP,
      metadata: {
        ...baseIP.metadata,
        team: [
          { role: 'projectLead', person: { displayName: 'Lead', upn: 'lead@org' } },
          { role: 'teamMember', person: { displayName: 'Mira' } },
        ],
      },
    };
    const out = migrateImprovementProjectMetadata(legacy, 1234);
    expect(out.metadata.members).toBeDefined();
    expect(out.metadata.members).toHaveLength(2);
    expect(out.metadata.members?.[0].role).toBe('lead');
    expect(out.metadata.members?.[1].role).toBe('member');
    expect(out.metadata.team).toBeDefined(); // legacy preserved
  });

  it('does not migrate when members[] already populated', () => {
    const alreadyMigrated: ImprovementProject = {
      ...baseIP,
      metadata: {
        ...baseIP.metadata,
        team: [{ role: 'projectLead', person: { displayName: 'Lead', upn: 'lead@org' } }],
        members: [
          {
            id: 'pm-existing',
            createdAt: 100,
            deletedAt: null,
            userId: 'someone-else@org',
            displayName: 'Someone Else',
            role: 'lead',
            invitedAt: 100,
          },
        ],
      },
    };
    const out = migrateImprovementProjectMetadata(alreadyMigrated, 1234);
    expect(out.metadata.members).toHaveLength(1);
    expect(out.metadata.members?.[0].userId).toBe('someone-else@org');
  });

  it('is a no-op when neither team nor members exist', () => {
    const out = migrateImprovementProjectMetadata(baseIP, 1234);
    expect(out.metadata.members).toBeUndefined();
    expect(out).toEqual(baseIP);
  });

  it('returns a new object (does not mutate input)', () => {
    const legacy: ImprovementProject = {
      ...baseIP,
      metadata: {
        ...baseIP.metadata,
        team: [{ role: 'projectLead', person: { displayName: 'Lead', upn: 'lead@org' } }],
      },
    };
    const out = migrateImprovementProjectMetadata(legacy, 1234);
    expect(out).not.toBe(legacy);
    expect(legacy.metadata.members).toBeUndefined();
  });
});
