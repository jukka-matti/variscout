import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import type { ProjectMetadata } from '@variscout/core';
import { buildDocumentSnapshot, getProjectInitialState, useProjectStore } from '@variscout/stores';
import { exportToFile, importFromFile, saveProjectLocally } from '../persistence';
import { db } from '../../db/schema';

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Hub 1',
  createdAt: 1_714_000_000_000,
  deletedAt: null,
};

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('Azure persistence .vrs import/export', () => {
  it('exports a snapshot-only document .vrs when activeHub is supplied', async () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    HTMLAnchorElement.prototype.click = vi.fn();

    exportToFile('snapshot.vrs', { activeHub: hub });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const parsed = JSON.parse(await blob.text());
    expect(parsed.kind).toBe('variscout.document');
    expect(parsed.version).toBe(1);
    expect(parsed.metadata.exportSource).toBe('azure');
    expect(parsed).not.toHaveProperty('rawData');
    expect(parsed).not.toHaveProperty('hub');
    expect(parsed.documentSnapshot.project.outcome).toBe('yield');
  });

  it('exports .vrs without marking the document saved or changing Azure identity', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      projectId: null,
      projectName: null,
      hasUnsavedChanges: true,
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn<(blob: Blob) => string>(() => 'blob:mock'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    HTMLAnchorElement.prototype.click = vi.fn();

    exportToFile('backup.vrs', { activeHub: hub });

    expect(useProjectStore.getState()).toMatchObject({
      projectId: null,
      projectName: null,
      hasUnsavedChanges: true,
    });
  });

  it('throws when exporting without an active hub', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    HTMLAnchorElement.prototype.click = vi.fn();

    expect(() => exportToFile('no-active-hub.vrs', { activeHub: null })).toThrow(/active hub/i);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('imports snapshot .vrs files as document snapshot imports', async () => {
    const file = new File(
      [
        JSON.stringify({
          kind: 'variscout.document',
          version: 1,
          exportedAt: '2026-06-01T00:00:00.000Z',
          documentSnapshot: {
            schemaVersion: 1,
            hubId: 'hub-1',
            hub: { id: 'hub-1', name: 'Hub 1', createdAt: 1_714_000_000_000, deletedAt: null },
            project: {
              projectId: '',
              projectName: 'Snapshot',
              rawData: [],
              outcome: null,
              factors: [],
              specs: {},
              analysisMode: 'standard',
            },
            analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
            canvas: {
              canonicalMap: { version: 1, nodes: [], tributaries: [], assignments: {}, arrows: [] },
              outcomes: [],
              primaryScopeDimensions: [],
            },
            improvementProject: null,
          },
        }),
      ],
      'snapshot.vrs',
      { type: 'application/json' }
    );

    const imported = await importFromFile(file);

    expect(imported).toMatchObject({
      kind: 'document-snapshot',
      file: { documentSnapshot: { hubId: 'hub-1' } },
    });
  });

  it('rejects non-snapshot JSON imports', async () => {
    const file = new File(
      [
        JSON.stringify({
          version: '1.0.0',
          rawData: [],
          outcome: null,
          factors: [],
          specs: {},
        }),
      ],
      'top-level-state.vrs',
      { type: 'application/json' }
    );

    await expect(importFromFile(file)).rejects.toThrow(/invalid file format/i);
  });
});

describe('PO-8b: adapter saves preserve Workspace metadata + access', () => {
  it('saveProjectLocally no longer wipes record.meta / record.access', async () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const state = buildDocumentSnapshot({ activeHub: hub });

    const meta: ProjectMetadata = {
      phase: 'scout',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
      sustainment: {
        recordId: 'cr-1',
        ladderStep: 1,
        nextCheckSuggestedAt: '2026-07-01T00:00:00.000Z',
        status: 'verifying',
      },
    };
    const access = {
      ownerUserId: 'u1',
      memberUserIds: ['u1'],
      hubId: 'hub-1',
      projectId: null,
    };
    await db.projects.put({
      name: 'keep-meta',
      location: 'personal',
      modified: new Date(),
      synced: true,
      data: state,
      meta,
      access,
    });

    await saveProjectLocally('keep-meta', state, 'personal');

    const record = await db.projects.get('keep-meta');
    expect(record?.meta).toEqual(meta); // preserved, not wiped
    expect(record?.access).toEqual(access);
    expect(record?.synced).toBe(false); // save still marks unsynced
    await db.projects.delete('keep-meta');
  });
});
