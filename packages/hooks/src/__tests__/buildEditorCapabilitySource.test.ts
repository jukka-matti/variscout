import { describe, expect, it } from 'vitest';
import { buildEditorCapabilitySource } from '../buildEditorCapabilitySource';
import type { DataRow } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type { ImprovementProject } from '@variscout/core/improvementProject';

function makeMap(overrides: Partial<ProcessMap> = {}): ProcessMap {
  return {
    version: 1,
    nodes: [
      {
        id: 'step-mix',
        name: 'Mix',
        order: 0,
        ctqColumn: 'Mix_Temp',
        capabilityScope: { specRules: [{ specs: { lsl: 60, usl: 70, target: 65 } }] },
      },
      {
        id: 'step-fill',
        name: 'Fill',
        order: 1,
        ctqColumn: 'Fill_Weight',
        capabilityScope: { specRules: [{ specs: { lsl: 498, usl: 502, target: 500 } }] },
      },
      { id: 'step-pack', name: 'Pack', order: 2 },
    ],
    tributaries: [],
    arrows: [],
    createdAt: '2026-06-08T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  };
}

function makeActiveIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'active',
    createdAt: 1_717_800_000_000,
    updatedAt: 1_717_800_000_000,
    goal: {
      title: 'Reduce overfill',
      outcome: 'Fill_Weight',
      target: '500 g',
      factorControls: [],
    },
    team: { lead: null, members: [], sponsor: null },
    charter: {},
    sections: {},
    metadata: { title: 'Line 4 overfill', members: [] },
    ...overrides,
  } as ImprovementProject;
}

const rows: DataRow[] = [
  { Mix_Temp: 63, Fill_Weight: 501 },
  { Mix_Temp: 66, Fill_Weight: 505 },
];

describe('buildEditorCapabilitySource', () => {
  it('builds a single editor member with live rows for an active project and process map', () => {
    const result = buildEditorCapabilitySource({
      hubId: 'hub-1',
      hubName: 'Line 4',
      processMap: makeMap(),
      activeIP: makeActiveIP(),
      rows,
    });

    expect(result.hub.id).toBe('hub-1');
    expect(result.hub.name).toBe('Line 4');
    expect(result.hub.canonicalProcessMap?.nodes.map(node => node.id)).toEqual([
      'step-mix',
      'step-fill',
      'step-pack',
    ]);
    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({
      id: 'ip-1',
      name: 'Line 4 overfill',
      metadata: { processHubId: 'hub-1' },
    });
    expect(result.rowsByAnalyze.get('ip-1')).toBe(rows);
  });

  it('derives node mappings from step ctqColumn values only', () => {
    const result = buildEditorCapabilitySource({
      hubId: 'hub-1',
      hubName: 'Line 4',
      processMap: makeMap(),
      activeIP: makeActiveIP(),
      rows,
    });

    expect(result.members[0]?.metadata?.nodeMappings).toEqual([
      { nodeId: 'step-mix', measurementColumn: 'Mix_Temp' },
      { nodeId: 'step-fill', measurementColumn: 'Fill_Weight' },
    ]);
  });

  it('returns an empty safe source when active project or process map is absent', () => {
    const withoutIp = buildEditorCapabilitySource({
      hubId: 'hub-1',
      hubName: 'Line 4',
      processMap: makeMap(),
      activeIP: null,
      rows,
    });
    expect(withoutIp.members).toEqual([]);
    expect(withoutIp.rowsByAnalyze.size).toBe(0);

    const withoutMap = buildEditorCapabilitySource({
      hubId: 'hub-1',
      hubName: 'Line 4',
      processMap: null,
      activeIP: makeActiveIP(),
      rows,
    });
    expect(withoutMap.hub.canonicalProcessMap).toBeUndefined();
    expect(withoutMap.members).toEqual([]);
    expect(withoutMap.rowsByAnalyze.size).toBe(0);
  });
});
