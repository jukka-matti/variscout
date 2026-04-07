import { describe, it, expect } from 'vitest';
import { mapRelationshipType } from '../relationshipTypeMapping';

describe('mapRelationshipType', () => {
  it('maps interactive to interact', () => {
    expect(mapRelationshipType('interactive')).toBe('interact');
  });

  it('maps synergistic to interact', () => {
    expect(mapRelationshipType('synergistic')).toBe('interact');
  });

  it('maps overlapping to overlap', () => {
    expect(mapRelationshipType('overlapping')).toBe('overlap');
  });

  it('maps independent to independent', () => {
    expect(mapRelationshipType('independent')).toBe('independent');
  });

  it('maps redundant to independent', () => {
    expect(mapRelationshipType('redundant')).toBe('independent');
  });

  it('returns guidance for each type', () => {
    expect(mapRelationshipType('interactive', true)).toEqual({
      label: 'Interact',
      guidance: 'Optimize together',
    });
    expect(mapRelationshipType('overlapping', true)).toEqual({
      label: 'Overlap',
      guidance: 'Shared variation — investigate what connects them',
    });
    expect(mapRelationshipType('independent', true)).toEqual({
      label: 'Independent',
      guidance: 'Optimize separately',
    });
  });
});
