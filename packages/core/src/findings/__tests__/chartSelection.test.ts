import { describe, it, expect } from 'vitest';
import type { ChartSelection } from '../chartSelection';

describe('ChartSelection', () => {
  it('constructs a range selection', () => {
    const sel: ChartSelection = { kind: 'range', chartType: 'ichart', startIdx: 2, endIdx: 7 };
    expect(sel.kind).toBe('range');
    if (sel.kind === 'range') {
      expect(sel.chartType).toBe('ichart');
      expect(sel.startIdx).toBe(2);
      expect(sel.endIdx).toBe(7);
    }
  });

  it('constructs a category selection', () => {
    const sel: ChartSelection = { kind: 'category', chartType: 'boxplot', category: 'Supplier A' };
    expect(sel.kind).toBe('category');
    if (sel.kind === 'category') {
      expect(sel.chartType).toBe('boxplot');
      expect(sel.category).toBe('Supplier A');
    }
  });

  it('switch over kind is exhaustive (both variants compile)', () => {
    const check = (sel: ChartSelection): string => {
      switch (sel.kind) {
        case 'range':
          return `range:${sel.startIdx}-${sel.endIdx}`;
        case 'category':
          return `category:${sel.category}`;
      }
    };
    const a: ChartSelection = { kind: 'range', chartType: 'ichart', startIdx: 0, endIdx: 3 };
    const b: ChartSelection = { kind: 'category', chartType: 'boxplot', category: 'B' };
    expect(check(a)).toBe('range:0-3');
    expect(check(b)).toBe('category:B');
  });
});
