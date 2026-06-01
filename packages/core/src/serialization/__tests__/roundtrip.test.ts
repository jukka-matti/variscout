// packages/core/src/serialization/__tests__/roundtrip.test.ts
import { describe, expect, it } from 'vitest';
import { vrsExport } from '../vrsExport';
import { vrsImport } from '../vrsImport';
import { VRS_VERSION } from '../vrsFormat';
import { DEFAULT_PROCESS_HUB } from '../../processHub';
import type { ImprovementProject } from '../../improvementProject';

describe('vrs roundtrip', () => {
  const hub = {
    ...DEFAULT_PROCESS_HUB,
    processGoal: 'We mold barrels.',
    outcomes: [
      {
        id: 'outcome-1',
        hubId: DEFAULT_PROCESS_HUB.id,
        createdAt: 1714000000000,
        deletedAt: null,
        columnName: 'weight_g',
        characteristicType: 'nominalIsBest' as const,
        target: 4.5,
        cpkTarget: 1.33,
      },
    ],
    primaryScopeDimensions: ['product_id', 'shift'],
  };
  const rawData = [{ weight_g: 4.5 }, { weight_g: 4.4 }];

  it('exports a valid VrsFile JSON string', () => {
    const json = vrsExport(hub, rawData, { exportSource: 'pwa', appVersion: 'test' });
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(VRS_VERSION);
    expect(parsed.hub.processGoal).toBe('We mold barrels.');
  });

  it('round-trips hub + rawData with deep equality', () => {
    const exported = vrsExport(hub, rawData);
    const imported = vrsImport(exported);
    expect(imported.hub).toEqual(hub);
    expect(imported.rawData).toEqual(rawData);
  });

  it('round-trips optional documentSnapshot payloads', () => {
    const documentSnapshot = {
      schemaVersion: 1,
      hubId: hub.id,
      project: { rawData, outcome: 'weight_g' },
      analyze: { scopes: [] },
      canvas: { canonicalMap: { nodes: [] } },
      improvementProject: null,
    };

    const exported = vrsExport(hub, rawData, undefined, documentSnapshot);
    const imported = vrsImport(exported);

    expect(imported.documentSnapshot).toEqual(documentSnapshot);
  });

  it('rejects unsupported version with a clear error', () => {
    const bad = JSON.stringify({ version: '0.9', exportedAt: new Date().toISOString(), hub });
    expect(() => vrsImport(bad)).toThrow(/unsupported.*version/i);
  });

  it('rejects missing hub field', () => {
    const bad = JSON.stringify({ version: VRS_VERSION, exportedAt: new Date().toISOString() });
    expect(() => vrsImport(bad)).toThrow(/missing.*hub/i);
  });

  it('handles export without rawData (Hub-only scenarios)', () => {
    const json = vrsExport(hub);
    const imported = vrsImport(json);
    expect(imported.hub).toEqual(hub);
    expect(imported.rawData).toBeUndefined();
  });
});

describe('vrs roundtrip — improvementProject (1:1)', () => {
  const richIP: ImprovementProject = {
    id: 'ip-1',
    hubId: DEFAULT_PROCESS_HUB.id,
    createdAt: 1_714_000_000_000,
    deletedAt: null,
    status: 'active',
    metadata: {
      title: 'Heads 5-8 lift',
      businessCase: 'Expected $80k/yr',
      financialImpact: { amount: 80000, currency: 'USD' },
      members: [
        {
          id: 'pm-lead',
          createdAt: 1_714_000_000_000,
          deletedAt: null,
          userId: 'a.lead@org',
          displayName: 'A. Lead',
          role: 'lead',
          invitedAt: 1_714_000_000_000,
        },
      ],
    },
    goal: {
      outcomeGoals: [
        {
          outcomeSpecId: 'outcome-1',
          baseline: 0.91,
          target: 1.33,
          deadline: '2026-09-01',
        },
      ],
      factorControls: [
        { factor: 'NOZZLE.TEMP', targetCondition: 'in control 95±2°C', linkedHypothesisId: 'h-1' },
      ],
    },
    sections: {
      background: { snapshotText: 'Cpk 0.91 over 12wk', snapshottedAt: '2026-05-01T00:00:00Z' },
      investigationLineage: { hypothesisIds: ['h-1', 'h-2'], findingIds: ['f-1'] },
      approach: {
        improvementIdeaIds: ['idea-1'],
        actionItemIds: ['ai-1'],
        narrative: 'Replace thermostat',
      },
      outcomeReference: {},
    },
    updatedAt: 1_714_500_000_000,
    signoff: { requestedAt: 1_714_400_000_000 },
  };

  it('round-trips hub carrying a single improvementProject', () => {
    const hub = {
      ...DEFAULT_PROCESS_HUB,
      improvementProject: richIP,
    };
    const exported = vrsExport(hub);
    const imported = vrsImport(exported);
    expect(imported.hub.improvementProject).toEqual(richIP);
  });

  it('legacy .vrs without improvementProject imports cleanly with field undefined', () => {
    const legacyJson = JSON.stringify({
      version: VRS_VERSION,
      exportedAt: new Date().toISOString(),
      hub: { ...DEFAULT_PROCESS_HUB },
    });
    const imported = vrsImport(legacyJson);
    expect(imported.hub.improvementProject).toBeUndefined();
  });
});
