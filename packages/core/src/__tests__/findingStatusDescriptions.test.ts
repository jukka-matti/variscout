/**
 * Tests for FINDING_STATUS_DESCRIPTIONS completeness
 */
import { describe, it, expect } from 'vitest';
import { FINDING_STATUS_DESCRIPTIONS, FINDING_STATUSES } from '../findings';

describe('FINDING_STATUS_DESCRIPTIONS', () => {
  it('has descriptions for all 5 statuses', () => {
    expect(Object.keys(FINDING_STATUS_DESCRIPTIONS)).toHaveLength(5);
    for (const status of FINDING_STATUSES) {
      expect(FINDING_STATUS_DESCRIPTIONS[status]).toBeDefined();
    }
  });

  it('descriptions are non-empty strings', () => {
    for (const status of FINDING_STATUSES) {
      const description = FINDING_STATUS_DESCRIPTIONS[status];
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('covers observed, investigating, analyzed, improving, and resolved', () => {
    expect(FINDING_STATUS_DESCRIPTIONS).toHaveProperty('observed');
    expect(FINDING_STATUS_DESCRIPTIONS).toHaveProperty('investigating');
    expect(FINDING_STATUS_DESCRIPTIONS).toHaveProperty('analyzed');
    expect(FINDING_STATUS_DESCRIPTIONS).toHaveProperty('improving');
    expect(FINDING_STATUS_DESCRIPTIONS).toHaveProperty('resolved');
  });
});
