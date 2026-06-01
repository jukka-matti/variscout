import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { buildDocumentSnapshotVrs, parseDocumentSnapshotVrs } from '../documentSnapshotVrs';
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
  it('builds a snapshot-only .vrs file without legacy hub or rawData fields', () => {
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
      kind: 'variscout.document',
      version: 1,
      exportedAt: '2026-06-01T00:00:00.000Z',
      metadata: { exportSource: 'pwa', appVersion: 'test' },
      documentSnapshot: {
        schemaVersion: 1,
        hubId: 'hub-1',
        hub: { id: 'hub-1', processGoal: 'Reduce molding scrap.' },
        project: { rawData: [{ yield: 91, line: 'A' }], outcome: 'yield' },
        analyze: { scopes: [expect.objectContaining({ id: 'scope-1' })] },
      },
    });
    expect(parsed).not.toHaveProperty('hub');
    expect(parsed).not.toHaveProperty('rawData');
  });

  it('parses only snapshot .vrs files', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const snapshotFile = parseDocumentSnapshotVrs(
      buildDocumentSnapshotVrs({ activeHub: hub, exportedAt: '2026-06-01T00:00:00.000Z' })
    );

    expect(snapshotFile.documentSnapshot.hubId).toBe('hub-1');

    expect(() =>
      parseDocumentSnapshotVrs(
        JSON.stringify({
          version: '1.0',
          exportedAt: '2026-06-01T00:00:00.000Z',
          hub,
          rawData: [{ yield: 88 }],
        })
      )
    ).toThrow(/invalid file format/i);
  });

  it('rejects raw legacy analysis-state JSON', () => {
    expect(() =>
      parseDocumentSnapshotVrs(
        JSON.stringify({
          rawData: [{ yield: 88 }],
          outcome: 'yield',
          factors: [],
          version: '1.0.0',
        })
      )
    ).toThrow(/invalid file format/i);
  });

  it('rejects malformed documentSnapshot payloads', () => {
    const malformed = JSON.stringify({
      kind: 'variscout.document',
      version: 1,
      exportedAt: '2026-06-01T00:00:00.000Z',
      documentSnapshot: { schemaVersion: 2, hubId: 'hub-1' },
    });

    expect(() => parseDocumentSnapshotVrs(malformed)).toThrow(/invalid.*documentSnapshot/i);
  });

  it('rejects snapshot files that still use top-level hub/rawData fields', () => {
    expect(() =>
      parseDocumentSnapshotVrs(
        JSON.stringify({
          kind: 'variscout.document',
          version: 1,
          exportedAt: '2026-06-01T00:00:00.000Z',
          hub,
          rawData: [{ yield: 88 }],
          documentSnapshot: {
            schemaVersion: 1,
            hubId: 'hub-1',
            hub: { id: 'hub-1', name: 'Hub', createdAt: now, deletedAt: null },
            project: {},
            analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
            canvas: { canonicalMap: { version: 1, nodes: [], tributaries: [] } },
            improvementProject: null,
          },
        })
      )
    ).toThrow(/invalid file format/i);
  });
});
