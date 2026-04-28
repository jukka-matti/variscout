import { describe, it, expect } from 'vitest';
import { isLegacyInvestigation, suggestNodeMappings } from '../nodeCapabilityMigration';
import type { ProcessHubInvestigationMetadata } from '../../processHub';
import type { ProcessMap } from '../../frame/types';

describe('isLegacyInvestigation', () => {
  it('returns true when nodeMappings is absent', () => {
    expect(isLegacyInvestigation({})).toBe(true);
    expect(isLegacyInvestigation({ processHubId: 'h' })).toBe(true);
  });

  it('returns true when nodeMappings is empty', () => {
    expect(isLegacyInvestigation({ nodeMappings: [] })).toBe(true);
  });

  it('returns false when at least one mapping is present', () => {
    const meta: ProcessHubInvestigationMetadata = {
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'col' }],
    };
    expect(isLegacyInvestigation(meta)).toBe(false);
  });
});

describe('suggestNodeMappings', () => {
  const map: ProcessMap = {
    version: 1,
    nodes: [
      { id: 'n-mix', name: 'Mix', order: 0, ctqColumn: 'mix_weight' },
      { id: 'n-press', name: 'Press', order: 1, ctqColumn: 'press_force' },
      { id: 'n-coat', name: 'Coat', order: 2 }, // no ctqColumn
    ],
    tributaries: [],
    createdAt: '',
    updatedAt: '',
  };

  it('returns a mapping for every node whose ctqColumn appears in the dataset columns', () => {
    const suggestions = suggestNodeMappings(map, ['mix_weight', 'press_force', 'unrelated']);
    expect(suggestions).toEqual([
      { nodeId: 'n-mix', measurementColumn: 'mix_weight' },
      { nodeId: 'n-press', measurementColumn: 'press_force' },
    ]);
  });

  it('skips nodes whose ctqColumn is missing from the dataset', () => {
    const suggestions = suggestNodeMappings(map, ['mix_weight']);
    expect(suggestions).toEqual([{ nodeId: 'n-mix', measurementColumn: 'mix_weight' }]);
  });

  it('returns empty list when no nodes match', () => {
    expect(suggestNodeMappings(map, ['nothing'])).toEqual([]);
    expect(suggestNodeMappings(map, [])).toEqual([]);
  });
});
