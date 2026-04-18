import { describe, it, expect } from 'vitest';
import { subgroupAxisColumns } from '../subgroupAxes';
import type { ProcessMap } from '../types';

const ISO = '2026-04-18T12:00:00.000Z';

const mapOf = (overrides: Partial<ProcessMap> = {}): ProcessMap => ({
  version: 1,
  nodes: [{ id: 'step-1', name: 'Fill', order: 0 }],
  tributaries: [],
  createdAt: ISO,
  updatedAt: ISO,
  ...overrides,
});

describe('subgroupAxisColumns', () => {
  it('returns [] for null map', () => {
    expect(subgroupAxisColumns(null)).toEqual([]);
  });

  it('returns [] for undefined map', () => {
    expect(subgroupAxisColumns(undefined)).toEqual([]);
  });

  it('returns [] when no subgroupAxes are set', () => {
    expect(subgroupAxisColumns(mapOf())).toEqual([]);
  });

  it('returns the column for each tributary referenced by subgroupAxes', () => {
    const map = mapOf({
      tributaries: [
        { id: 't-mach', stepId: 'step-1', column: 'Machine' },
        { id: 't-shift', stepId: 'step-1', column: 'Shift' },
        { id: 't-lot', stepId: 'step-1', column: 'Lot' },
      ],
      subgroupAxes: ['t-mach', 't-shift'],
    });
    expect(subgroupAxisColumns(map)).toEqual(['Machine', 'Shift']);
  });

  it('preserves the order of subgroupAxes', () => {
    const map = mapOf({
      tributaries: [
        { id: 'a', stepId: 'step-1', column: 'A' },
        { id: 'b', stepId: 'step-1', column: 'B' },
        { id: 'c', stepId: 'step-1', column: 'C' },
      ],
      subgroupAxes: ['c', 'a', 'b'],
    });
    expect(subgroupAxisColumns(map)).toEqual(['C', 'A', 'B']);
  });

  it('drops axes that reference tributaries that no longer exist', () => {
    const map = mapOf({
      tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
      subgroupAxes: ['t-mach', 't-DELETED'],
    });
    expect(subgroupAxisColumns(map)).toEqual(['Machine']);
  });
});
