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
