import { describe, it, expect } from 'vitest';
import type { ProcessStepCapabilityMemberMetadata, AnalyzeNodeMapping } from '../processHub';

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

describe('ProcessStepCapabilityMemberMetadata.nodeMappings', () => {
  it('is optional', () => {
    const minimal: ProcessStepCapabilityMemberMetadata = {};
    expect(minimal.nodeMappings).toBeUndefined();
  });

  it('accepts node mappings', () => {
    const meta: ProcessStepCapabilityMemberMetadata = {
      processHubId: 'hub-1',
      nodeMappings: [
        { nodeId: 'n1', measurementColumn: 'mix_weight' },
        { nodeId: 'n2', measurementColumn: 'press_hardness' },
      ],
    };
    expect(meta.nodeMappings).toHaveLength(2);
  });
});
