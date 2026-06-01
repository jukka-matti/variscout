import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import {
  buildDocumentSnapshotVrs,
  isDocumentSnapshotVrsFile,
  parseDocumentSnapshotVrs,
} from '../documentSnapshotVrs';
import { getAnalyzeInitialState, useAnalyzeStore } from '../analyzeStore';
import { useCanvasStore } from '../canvasStore';
import {
  getImprovementProjectInitialState,
  useImprovementProjectStore,
} from '../improvementProjectStore';
import { getProjectInitialState, useProjectStore } from '../projectStore';

const now = 1_714_000_000_000;

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Barrel molding',
  processGoal: 'Reduce molding scrap.',
  createdAt: now,
  deletedAt: null,
  outcomes: [
    {
      id: 'outcome-1',
      hubId: 'hub-1',
      columnName: 'yield',
      characteristicType: 'largerIsBetter',
      createdAt: now,
      deletedAt: null,
    },
  ],
  primaryScopeDimensions: ['line'],
};

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
});

describe('document snapshot .vrs helpers', () => {
  it('builds an additive .vrs file with legacy fields and documentSnapshot', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      projectName: 'Snapshot project',
      rawData: [{ yield: 91, line: 'A' }],
      outcome: 'yield',
      factors: ['line'],
    });
    useAnalyzeStore.getState().loadAnalyzeState({
      scopes: [
        {
          id: 'scope-1',
          investigationId: 'inv-1',
          outcome: 'yield',
          predicates: [],
          hypothesisIds: [],
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ],
    });

    const json = buildDocumentSnapshotVrs({
      activeHub: hub,
      exportedAt: '2026-06-01T00:00:00.000Z',
      metadata: { exportSource: 'pwa', appVersion: 'test' },
    });
    const parsed = JSON.parse(json);

    expect(parsed).toMatchObject({
      version: '1.0',
      exportedAt: '2026-06-01T00:00:00.000Z',
      hub: { id: 'hub-1', processGoal: 'Reduce molding scrap.' },
      rawData: [{ yield: 91, line: 'A' }],
      metadata: { exportSource: 'pwa', appVersion: 'test' },
      documentSnapshot: {
        schemaVersion: 1,
        hubId: 'hub-1',
        project: { rawData: [{ yield: 91, line: 'A' }], outcome: 'yield' },
        analyze: { scopes: [expect.objectContaining({ id: 'scope-1' })] },
      },
    });
  });

  it('parses snapshot and legacy .vrs files', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const snapshotFile = parseDocumentSnapshotVrs(
      buildDocumentSnapshotVrs({ activeHub: hub, exportedAt: '2026-06-01T00:00:00.000Z' })
    );

    expect(isDocumentSnapshotVrsFile(snapshotFile)).toBe(true);
    if (isDocumentSnapshotVrsFile(snapshotFile)) {
      expect(snapshotFile.documentSnapshot.hubId).toBe('hub-1');
    }

    const legacyFile = parseDocumentSnapshotVrs(
      JSON.stringify({
        version: '1.0',
        exportedAt: '2026-06-01T00:00:00.000Z',
        hub,
        rawData: [{ yield: 88 }],
      })
    );
    expect(isDocumentSnapshotVrsFile(legacyFile)).toBe(false);
    expect(legacyFile.rawData).toEqual([{ yield: 88 }]);
  });

  it('rejects malformed documentSnapshot payloads', () => {
    const malformed = JSON.stringify({
      version: '1.0',
      exportedAt: '2026-06-01T00:00:00.000Z',
      hub,
      documentSnapshot: { schemaVersion: 2, hubId: 'hub-1' },
    });

    expect(() => parseDocumentSnapshotVrs(malformed)).toThrow(/invalid.*documentSnapshot/i);
  });
});
