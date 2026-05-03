// packages/core/src/serialization/__tests__/roundtrip.test.ts
import { describe, expect, it } from 'vitest';
import { vrsExport } from '../vrsExport';
import { vrsImport } from '../vrsImport';
import { VRS_VERSION } from '../vrsFormat';
import { DEFAULT_PROCESS_HUB } from '../../processHub';

describe('vrs roundtrip', () => {
  const hub = {
    ...DEFAULT_PROCESS_HUB,
    processGoal: 'We mold barrels.',
    outcomes: [
      {
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
