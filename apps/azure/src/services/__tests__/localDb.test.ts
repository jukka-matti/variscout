import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
import { db } from '../../db/schema';
import {
  backfillProjectMetadataInIndexedDB,
  ensureDefaultProcessHubInIndexedDB,
  extractMetadataInputs,
  listEvidenceSnapshotsFromIndexedDB,
  listEvidenceSourcesFromIndexedDB,
  listProcessHubsFromIndexedDB,
  listFromIndexedDB,
  saveEvidenceSnapshotToIndexedDB,
  saveEvidenceSourceToIndexedDB,
  saveProcessHubToIndexedDB,
} from '../localDb';

describe('localDb Process Hub support', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('extracts Process Hub metadata from persisted processContext', () => {
    const metadata = extractMetadataInputs(
      {
        rawData: [{ Value: 1 }],
        findings: [],
        questions: [],
        processContext: {
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'investigating',
          currentUnderstanding: { summary: 'Night shift variation is concentrated.' },
          problemCondition: { summary: 'Cpk is below target.' },
          nextMove: 'Inspect nozzle wear.',
          description: 'Bottle filling from rinse through palletizing.',
          processMap: {
            version: 1,
            nodes: [{ id: 'fill', name: 'Fill', order: 0, ctqColumn: 'Weight' }],
            tributaries: [{ id: 'machine', stepId: 'fill', column: 'Machine' }],
            ctsColumn: 'Weight',
            subgroupAxes: ['machine'],
            hunches: [{ id: 'h1', text: 'Nozzle wear', tributaryId: 'machine' }],
            createdAt: '2026-04-26T00:00:00.000Z',
            updatedAt: '2026-04-26T00:00:00.000Z',
          },
        },
      },
      'local'
    );

    expect(metadata).toMatchObject({
      processHubId: 'line-4',
      investigationDepth: 'focused',
      investigationStatus: 'investigating',
      currentUnderstandingSummary: 'Night shift variation is concentrated.',
      problemConditionSummary: 'Cpk is below target.',
      nextMove: 'Inspect nozzle wear.',
      processDescription: 'Bottle filling from rinse through palletizing.',
      customerRequirementSummary: 'Weight',
      processMapSummary: {
        stepCount: 1,
        tributaryCount: 1,
        ctsColumn: 'Weight',
        subgroupAxisCount: 1,
        hunchCount: 1,
      },
    });
  });

  it('extracts Survey readiness for Process Hub review queues', () => {
    const metadata = extractMetadataInputs(
      {
        rawData: [{ Machine: 'A', Weight: 10 }],
        outcome: 'Weight',
        factors: [],
        findings: [],
        questions: [],
        processContext: { processHubId: 'line-4' },
      },
      'local'
    );

    expect(metadata?.surveyReadiness).toMatchObject({
      recommendationCount: expect.any(Number),
      topRecommendations: expect.any(Array),
    });
    expect(metadata?.surveyReadiness?.recommendationCount).toBeGreaterThan(0);
  });

  it('extracts a hub review signal from saved investigation data', () => {
    const metadata = extractMetadataInputs(
      {
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
        findings: [],
        questions: [],
        processContext: { processHubId: 'line-4' },
      },
      'local'
    );

    expect(metadata?.reviewSignal).toMatchObject({
      rowCount: 4,
      outcome: 'Weight',
      dataFilename: 'line-4.csv',
      latestTimeValue: '2026-04-26T04:00:00Z',
      topFocus: {
        factor: 'Machine',
        value: 'B',
      },
      capability: {
        cpkTarget: 1.33,
        outOfSpecPercentage: 50,
      },
    });
  });

  it('creates and lists the default hub lazily', async () => {
    await ensureDefaultProcessHubInIndexedDB();
    const hubs = await listProcessHubsFromIndexedDB();

    expect(hubs).toHaveLength(1);
    expect(hubs[0].id).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(hubs[0].name).toBe('General / Unassigned');
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
      data: {
        rawData: [{ Machine: 'A', Weight: 10 }],
        outcome: 'Weight',
        factors: ['Machine'],
        findings: [],
        questions: [],
        processContext: {
          processHubId: 'line-4',
          investigationDepth: 'focused',
          description: 'Bottle filling from rinse through palletizing.',
          processMap: {
            version: 1,
            nodes: [{ id: 'fill', name: 'Fill', order: 0, ctqColumn: 'Weight' }],
            tributaries: [{ id: 'machine', stepId: 'fill', column: 'Machine' }],
            ctsColumn: 'Weight',
            subgroupAxes: ['machine'],
            createdAt: '2026-04-26T00:00:00.000Z',
            updatedAt: '2026-04-26T00:00:00.000Z',
          },
        },
      },
    });

    const updated = await backfillProjectMetadataInIndexedDB('local');
    const projects = await listFromIndexedDB('local');

    expect(updated).toBe(1);
    expect(projects[0].metadata).toMatchObject({
      processHubId: 'line-4',
      investigationDepth: 'focused',
      processDescription: 'Bottle filling from rinse through palletizing.',
      customerRequirementSummary: 'Weight',
      surveyReadiness: {
        recommendationCount: expect.any(Number),
      },
    });
  });
});
