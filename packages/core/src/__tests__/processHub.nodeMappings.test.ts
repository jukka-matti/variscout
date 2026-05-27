import { describe, it, expect } from 'vitest';
import type { ProcessHubAnalyzeMetadata, AnalyzeNodeMapping } from '../processHub';

describe('AnalyzeNodeMapping', () => {
  it('is a per-node mapping with optional spec override', () => {
    const m: AnalyzeNodeMapping = {
      nodeId: 'n1',
      measurementColumn: 'mix_weight',
    };
    expect(m.specsOverride).toBeUndefined();
  });

  it('accepts a flagged spec override', () => {
    const m: AnalyzeNodeMapping = {
      nodeId: 'n1',
      measurementColumn: 'mix_weight',
      specsOverride: { usl: 10, lsl: 0 },
    };
    expect(m.specsOverride).toEqual({ usl: 10, lsl: 0 });
  });
});

describe('ProcessHubAnalyzeMetadata.nodeMappings', () => {
  it('is optional', () => {
    const minimal: ProcessHubAnalyzeMetadata = {};
    expect(minimal.nodeMappings).toBeUndefined();
    expect(minimal.canonicalMapVersion).toBeUndefined();
  });

  it('accepts node mappings and version pin', () => {
    const meta: ProcessHubAnalyzeMetadata = {
      processHubId: 'hub-1',
      canonicalMapVersion: '2026-04-28T10:00:00Z',
      nodeMappings: [
        { nodeId: 'n1', measurementColumn: 'mix_weight' },
        { nodeId: 'n2', measurementColumn: 'press_hardness' },
      ],
    };
    expect(meta.nodeMappings).toHaveLength(2);
    expect(meta.canonicalMapVersion).toBe('2026-04-28T10:00:00Z');
  });
});
