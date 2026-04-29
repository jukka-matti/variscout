import { describe, it, expect } from 'vitest';
import { detectScope } from '../scopeDetection';
import type { ProcessHubInvestigation, InvestigationNodeMapping } from '../processHub';

const makeInvestigation = (nodeMappings?: InvestigationNodeMapping[]): ProcessHubInvestigation => ({
  id: 'test',
  name: 'Test Investigation',
  modified: '2026-04-29T00:00:00.000Z',
  metadata: {
    processHubId: 'hub-1',
    nodeMappings,
  },
});

describe('detectScope', () => {
  it('returns b0 when nodeMappings is absent', () => {
    expect(detectScope(makeInvestigation(undefined))).toBe('b0');
  });

  it('returns b0 when nodeMappings is empty', () => {
    expect(detectScope(makeInvestigation([]))).toBe('b0');
  });

  it('returns b2 when nodeMappings has exactly one entry', () => {
    const inv = makeInvestigation([{ nodeId: 'n1', measurementColumn: 'col1' }]);
    expect(detectScope(inv)).toBe('b2');
  });

  it('returns b1 when nodeMappings has more than one entry', () => {
    const inv = makeInvestigation([
      { nodeId: 'n1', measurementColumn: 'col1' },
      { nodeId: 'n2', measurementColumn: 'col2' },
    ]);
    expect(detectScope(inv)).toBe('b1');
  });
});
