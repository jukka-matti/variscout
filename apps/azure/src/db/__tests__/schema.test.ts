import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, openDb } from '../schema';

describe('IndexedDB clean pre-launch schema', () => {
  beforeEach(async () => {
    await db.delete();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('opens at version 1 from clean state', async () => {
    await openDb();
    expect(db.verno).toBe(1);
  });

  it('declares the Azure overlay and current hub-domain stores only', async () => {
    await openDb();
    const storeNames = db.tables.map(t => t.name).sort();
    expect(storeNames).toEqual([
      'actionItems',
      'controlHandoffs',
      'controlRecords',
      'controlReviews',
      'evidenceSnapshots',
      'evidenceSourceCursors',
      'evidenceSources',
      'improvementProjects',
      'measurementPlans',
      'processHubs',
      'projects',
    ]);
    expect(storeNames).not.toContain('syncQueue');
    expect(storeNames).not.toContain('syncState');
    expect(storeNames).not.toContain('photoQueue');
    expect(storeNames).not.toContain('channelDriveCache');
  });

  it('round-trips an ImprovementProject blob with the new E1 fields through the dedicated improvementProjects table', async () => {
    // IPs live in the dedicated `improvementProjects` Dexie table (1:1 with a hub per IM-0a).
    // Exercise that the blob write/read survives the clean schema.
    // processSteps is no longer a stored field (removed per IM-0b / ADR-087 —
    // the canonical step structure lives in ProcessMap; processSteps was a
    // vestigial read-only projection that no write path ever persisted).
    await openDb();
    const ipRecord = {
      id: 'ip-e1',
      hubId: 'hub-e1',
      status: 'draft' as const,
      metadata: { title: 'E1 round-trip' },
      goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }] },
      sections: {
        background: {},
        approach: {},
        outcomeReference: {},
      },
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      // E1 additive fields:
      issueStatement: 'yields dropping',
      stepTimings: [
        {
          kind: 'paired' as const,
          stepId: 'step-1',
          startColumn: 'start_ts',
          endColumn: 'end_ts',
        },
      ],
      formulaBindings: [
        {
          id: 'f-1',
          name: 'Yield_pct',
          numerator: [{ kind: 'column' as const, column: 'good', sign: '+' as const }],
          denominator: [{ kind: 'column' as const, column: 'total', sign: '+' as const }],
          multiplier: 100,
        },
      ],
      timeDecompositionBindings: [
        { id: 'td-1', sourceColumn: 'date', dimensions: ['year', 'month'] },
      ],
    };
    await db.table('improvementProjects').put(ipRecord);

    const ip = await db.table('improvementProjects').get('ip-e1');
    expect(ip?.issueStatement).toBe('yields dropping');
    expect(ip?.stepTimings?.[0]?.kind).toBe('paired');
    expect(ip?.formulaBindings?.[0]?.name).toBe('Yield_pct');
    expect(ip?.timeDecompositionBindings?.[0]?.dimensions).toEqual(['year', 'month']);
  });
});
