import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
import type { DocumentSnapshot } from '@variscout/stores';
import { db } from '../../db/schema';
import {
  backfillProjectMetadataInIndexedDB,
  canAccessProjectRecord,
  ensureDefaultProcessHubInIndexedDB,
  extractDocumentAccess,
  extractMetadataInputs,
  listEvidenceSnapshotsFromIndexedDB,
  listEvidenceSourcesFromIndexedDB,
  listProcessHubsFromIndexedDB,
  listFromIndexedDB,
  saveEvidenceSnapshotToIndexedDB,
  saveEvidenceSourceToIndexedDB,
  saveProcessHubToIndexedDB,
} from '../localDb';

function snapshot(overrides: Partial<DocumentSnapshot['project']> = {}): DocumentSnapshot {
  return {
    schemaVersion: 1,
    hubId: 'line-4',
    hub: {
      id: 'line-4',
      name: 'Line 4',
      createdAt: 1,
      deletedAt: null,
    },
    project: {
      projectId: '',
      projectName: '',
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      analysisMode: 'standard',
      dataFilename: null,
      timeColumn: null,
      processContext: null,
      entryScenario: null,
      filters: {},
      filterStack: [],
      axisSettings: {},
      displayOptions: undefined,
      columnAliases: {},
      valueLabels: {},
      measureSpecs: {},
      stageColumn: null,
      stageOrderMode: 'auto',
      measureColumns: [],
      measureLabel: 'Measure',
      selectedMeasure: null,
      chartTitles: {},
      paretoMode: 'derived',
      paretoAggregation: 'count',
      separateParetoData: null,
      separateParetoFilename: null,
      ...overrides,
    },
    analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
    canvas: {
      canonicalMap: {
        version: 1,
        nodes: [],
        tributaries: [],
        assignments: {},
        arrows: [],
        createdAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
      },
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: 'v1',
    },
    improvementProject: null,
  };
}

describe('localDb Process Hub support', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('extracts the KEEP-set Process Hub metadata from persisted processContext', () => {
    const metadata = extractMetadataInputs(
      snapshot({
        rawData: [{ Value: 1 }],
        processContext: {
          processHubId: 'line-4',
          nodeMappings: [{ nodeId: 'fill', measurementColumn: 'Weight' }],
          migrationDeclinedAt: '2026-04-28T10:00:00.000Z',
        },
      }),
      'local'
    );

    // PO-4: the narrative/work-item projection fields were shed from
    // ProjectMetadata. Only the KEEP set survives.
    expect(metadata).toMatchObject({
      phase: 'scout',
      processHubId: 'line-4',
      nodeMappings: [{ nodeId: 'fill', measurementColumn: 'Weight' }],
      migrationDeclinedAt: '2026-04-28T10:00:00.000Z',
    });
    expect((metadata as unknown as Record<string, unknown>)?.analyzeStatus).toBeUndefined();
    expect((metadata as unknown as Record<string, unknown>)?.surveyReadiness).toBeUndefined();
    expect((metadata as unknown as Record<string, unknown>)?.nextMove).toBeUndefined();
  });

  it('does not include a hub review signal in extracted metadata (projection retired — PO-2)', () => {
    const metadata = extractMetadataInputs(
      snapshot({
        rawData: [
          { Machine: 'A', Timestamp: '2026-04-26T01:00:00Z', Weight: 10 },
          { Machine: 'A', Timestamp: '2026-04-26T02:00:00Z', Weight: 11 },
          { Machine: 'B', Timestamp: '2026-04-26T03:00:00Z', Weight: 20 },
          { Machine: 'B', Timestamp: '2026-04-26T04:00:00Z', Weight: 21 },
        ],
        outcome: 'Weight',
        factors: ['Machine'],
        specs: { lsl: 9, usl: 15 },
        cpkTarget: 1.33,
        timeColumn: 'Timestamp',
        dataFilename: 'line-4.csv',
        processContext: { processHubId: 'line-4' },
      }),
      'local'
    );

    // reviewSignal is no longer saved into ProjectMetadata (PO-2 retirement);
    // buildHubReviewSignal still lives in core but is no longer called on save.
    expect(metadata).not.toBeNull();
    expect((metadata as unknown as Record<string, unknown>)?.reviewSignal).toBeUndefined();
  });

  it('creates and lists the default hub lazily', async () => {
    await ensureDefaultProcessHubInIndexedDB();
    const hubs = await listProcessHubsFromIndexedDB();

    expect(hubs).toHaveLength(1);
    expect(hubs[0].id).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(hubs[0].name).toBe('General / Unassigned');
  });

  it('derives private-owner access for quick analysis snapshots', () => {
    const access = extractDocumentAccess(snapshot(), 'owner@contoso.com');

    expect(access).toEqual({
      ownerUserId: 'owner@contoso.com',
      memberUserIds: ['owner@contoso.com'],
      hubId: 'line-4',
      projectId: null,
    });
  });

  it('derives formal Project access from the member roster', () => {
    const doc = {
      ...snapshot(),
      improvementProject: {
        id: 'ip-1',
        hubId: 'line-4',
        status: 'active',
        metadata: {
          title: 'Project',
          members: [
            {
              id: 'lead',
              userId: 'lead@contoso.com',
              displayName: 'Lead',
              role: 'lead',
              invitedAt: 1,
              createdAt: 1,
              deletedAt: null,
            },
            {
              id: 'member',
              userId: 'member@contoso.com',
              displayName: 'Member',
              role: 'member',
              invitedAt: 1,
              createdAt: 1,
              deletedAt: null,
            },
          ],
        },
        goal: { outcomeGoals: [] },
        sections: { background: {}, approach: {}, outcomeReference: {} },
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      },
    } satisfies DocumentSnapshot;

    const access = extractDocumentAccess(doc, 'creator@contoso.com');

    expect(access.ownerUserId).toBe('lead@contoso.com');
    expect(access.memberUserIds).toEqual(['lead@contoso.com', 'member@contoso.com']);
    expect(
      canAccessProjectRecord(
        {
          name: 'Project',
          location: 'personal',
          modified: new Date(),
          synced: false,
          data: doc,
          access,
        },
        'member@contoso.com'
      )
    ).toBe(true);
  });

  it('filters local project listings to owner/member access', async () => {
    await db.projects.bulkPut([
      {
        name: 'visible',
        location: 'personal',
        modified: new Date('2026-04-26T00:00:00.000Z'),
        synced: true,
        data: snapshot(),
        access: {
          ownerUserId: 'owner@contoso.com',
          memberUserIds: ['owner@contoso.com', 'member@contoso.com'],
          hubId: 'line-4',
          projectId: null,
        },
      },
      {
        name: 'hidden',
        location: 'personal',
        modified: new Date('2026-04-26T00:00:00.000Z'),
        synced: true,
        data: snapshot(),
        access: {
          ownerUserId: 'other@contoso.com',
          memberUserIds: ['other@contoso.com'],
          hubId: 'line-4',
          projectId: null,
        },
      },
    ]);

    const projects = await listFromIndexedDB('member@contoso.com');

    expect(projects.map(project => project.name)).toEqual(['visible']);
  });

  it('stores named Process Hubs locally', async () => {
    await saveProcessHubToIndexedDB({
      id: 'line-4',
      name: 'Line 4',
      createdAt: 1745539200000,
      deletedAt: null,
    });

    const hubs = await listProcessHubsFromIndexedDB();
    expect(hubs.map(h => h.name)).toContain('Line 4');
  });

  it('stores Evidence Sources and Snapshots locally in Dexie v5 tables', async () => {
    await saveEvidenceSourceToIndexedDB({
      id: 'source-1',
      hubId: 'line-4',
      name: 'Agent review log',
      cadence: 'weekly',
      profileId: 'agent-review-log',
      createdAt: 1745625600000,
      deletedAt: null,
      updatedAt: 1745625600000,
    });

    await saveEvidenceSnapshotToIndexedDB({
      id: 'snapshot-1',
      hubId: 'line-4',
      sourceId: 'source-1',
      capturedAt: '2026-04-26T12:00:00.000Z',
      rowCount: 3,
      origin: 'evidence-source:source-1',
      importedAt: 1745668800000,
      createdAt: 1745668800000,
      deletedAt: null,
    });

    await expect(listEvidenceSourcesFromIndexedDB('line-4')).resolves.toHaveLength(1);
    await expect(listEvidenceSnapshotsFromIndexedDB('line-4', 'source-1')).resolves.toHaveLength(1);
  });

  it('backfills missing metadata for existing local analyses', async () => {
    await db.projects.put({
      name: 'legacy-line-4',
      location: 'personal',
      modified: new Date('2026-04-26T00:00:00.000Z'),
      synced: true,
      data: snapshot({
        rawData: [{ Machine: 'A', Weight: 10 }],
        outcome: 'Weight',
        factors: ['Machine'],
        processContext: {
          processHubId: 'line-4',
          nodeMappings: [{ nodeId: 'fill', measurementColumn: 'Weight' }],
        },
      }),
    });

    const updated = await backfillProjectMetadataInIndexedDB('local');
    const projects = await listFromIndexedDB('local');

    expect(updated).toBe(1);
    // PO-4: only the KEEP-set metadata is backfilled.
    expect(projects[0].metadata).toMatchObject({
      processHubId: 'line-4',
      nodeMappings: [{ nodeId: 'fill', measurementColumn: 'Weight' }],
    });
  });
});
