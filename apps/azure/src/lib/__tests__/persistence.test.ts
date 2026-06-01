import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { getProjectInitialState, useProjectStore } from '@variscout/stores';
import { exportToFile, importFromFile } from '../persistence';

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
  it('exports a document snapshot .vrs when activeHub is supplied', async () => {
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

    exportToFile(
      {
        rawData: [{ stale: true }],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
      },
      'snapshot.vrs',
      { activeHub: hub }
    );

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const parsed = JSON.parse(await blob.text());
    expect(parsed.metadata.exportSource).toBe('azure');
    expect(parsed.rawData).toEqual([{ yield: 91 }]);
    expect(parsed.documentSnapshot.project.outcome).toBe('yield');
  });

  it('keeps legacy AnalysisState export when activeHub is not supplied', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    HTMLAnchorElement.prototype.click = vi.fn();

    exportToFile(
      {
        rawData: [{ yield: 91 }],
        outcome: 'yield',
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
      },
      'legacy.vrs'
    );

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const parsed = JSON.parse(await blob.text());
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.documentSnapshot).toBeUndefined();
  });

  it('imports snapshot .vrs files as document snapshot imports', async () => {
    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exportedAt: '2026-06-01T00:00:00.000Z',
          hub,
          documentSnapshot: {
            schemaVersion: 1,
            hubId: 'hub-1',
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
});
