import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
import { db } from '../../db/schema';
import {
  ensureDefaultProcessHubInIndexedDB,
  extractMetadataInputs,
  listProcessHubsFromIndexedDB,
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
    });
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
      createdAt: '2026-04-25T00:00:00.000Z',
    });

    const hubs = await listProcessHubsFromIndexedDB();
    expect(hubs.map(h => h.name)).toContain('Line 4');
  });
});
