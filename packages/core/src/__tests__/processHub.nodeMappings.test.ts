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
  });

  it('accepts node mappings', () => {
    const meta: ProcessHubAnalyzeMetadata = {
      processHubId: 'hub-1',
      nodeMappings: [
        { nodeId: 'n1', measurementColumn: 'mix_weight' },
        { nodeId: 'n2', measurementColumn: 'press_hardness' },
      ],
    };
    expect(meta.nodeMappings).toHaveLength(2);
  });
});
