import { describe, it, expect } from 'vitest';
import { getStepColumnAssignments } from '../stepColumns';
import type { ProcessMap } from '../types';

const ISO = '2026-05-13T00:00:00.000Z';

const mapOf = (overrides: Partial<ProcessMap> = {}): ProcessMap => ({
  version: 1,
  nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
  tributaries: [],
  createdAt: ISO,
  updatedAt: ISO,
  ...overrides,
});

describe('getStepColumnAssignments', () => {
  it('returns empty defaults for a map with no assignments/tributaries and a found step', () => {
    const result = getStepColumnAssignments(mapOf(), 'step-1');
    expect(result).toEqual({
      assigned: [],
      stepName: 'Mix',
      ctqColumn: null,
      tributaryColumns: [],
    });
  });

  it('returns stepName: null and empty arrays when focalStepId is not found', () => {
    const result = getStepColumnAssignments(mapOf(), 'step-MISSING');
    expect(result).toEqual({
      assigned: [],
      stepName: null,
      ctqColumn: null,
      tributaryColumns: [],
    });
  });

  it('returns ctqColumn when step has ctqColumn and it is not in assignments', () => {
    const map = mapOf({
      nodes: [{ id: 'step-1', name: 'Fill', order: 0, ctqColumn: 'Fill Weight' }],
    });
    const result = getStepColumnAssignments(map, 'step-1');
    expect(result.ctqColumn).toBe('Fill Weight');
    expect(result.assigned).toEqual([]);
    expect(result.tributaryColumns).toEqual([]);
  });

  it('returns assigned columns for the focal step (excluding other steps)', () => {
    const map = mapOf({
      nodes: [
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Fill', order: 1 },
      ],
      assignments: {
        Machine: 'step-1',
        Operator: 'step-1',
        Lot: 'step-2',
      },
    });
    const result = getStepColumnAssignments(map, 'step-1');
    expect(result.assigned).toEqual(expect.arrayContaining(['Machine', 'Operator']));
    expect(result.assigned).toHaveLength(2);
    expect(result.tributaryColumns).toEqual([]);
  });

  it('returns tributaryColumns for the focal step excluding already-assigned columns', () => {
    const map = mapOf({
      tributaries: [
        { id: 't-machine', stepId: 'step-1', column: 'Machine' },
        { id: 't-shift', stepId: 'step-1', column: 'Shift' },
        { id: 't-other', stepId: 'step-2', column: 'Lot' },
      ],
      nodes: [
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Fill', order: 1 },
      ],
      assignments: {
        Machine: 'step-1',
      },
    });
    const result = getStepColumnAssignments(map, 'step-1');
    // Machine is in assignments so should NOT appear in tributaryColumns
    expect(result.tributaryColumns).toEqual(['Shift']);
    expect(result.assigned).toEqual(['Machine']);
  });

  it('returns ctqColumn: null and does not include ctq in tributaryColumns when ctq is in assignments', () => {
    // CTQ "Temperature" is explicitly assigned to the step
    const map = mapOf({
      nodes: [{ id: 'step-1', name: 'Mix', order: 0, ctqColumn: 'Temperature' }],
      assignments: {
        Temperature: 'step-1',
        Machine: 'step-1',
      },
      tributaries: [
        { id: 't-temp', stepId: 'step-1', column: 'Temperature' },
        { id: 't-shift', stepId: 'step-1', column: 'Shift' },
      ],
    });
    const result = getStepColumnAssignments(map, 'step-1');
    // ctq is in assigned → ctqColumn should be null
    expect(result.ctqColumn).toBeNull();
    // Temperature is in assigned → not in tributaryColumns either
    expect(result.tributaryColumns).not.toContain('Temperature');
    expect(result.tributaryColumns).toEqual(['Shift']);
    expect(result.assigned).toEqual(expect.arrayContaining(['Temperature', 'Machine']));
  });
});
