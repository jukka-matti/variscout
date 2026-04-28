import { describe, it, expect } from 'vitest';
import type { ProcessMapTributary } from '../types';

describe('ProcessMapTributary.contextColumns', () => {
  it('is optional', () => {
    const minimal: ProcessMapTributary = {
      id: 't1',
      stepId: 'n1',
      column: 'steel_grade',
    };
    expect(minimal.contextColumns).toBeUndefined();
  });

  it('accepts a tributary with input-attached context columns', () => {
    const trib: ProcessMapTributary = {
      id: 't1',
      stepId: 'n1',
      column: 'steel_grade',
      role: 'supplier',
      contextColumns: ['steel_supplier', 'steel_lot'],
    };
    expect(trib.contextColumns).toEqual(['steel_supplier', 'steel_lot']);
  });
});
