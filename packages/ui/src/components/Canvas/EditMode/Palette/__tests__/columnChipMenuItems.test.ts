import { describe, it, expect } from 'vitest';
import { getMenuItemsForKind } from '../columnChipMenuItems';

describe('getMenuItemsForKind', () => {
  it('returns numeric items in spec order', () => {
    const items = getMenuItemsForKind('numeric');
    expect(items.map(i => i.id)).toEqual([
      'use-as-factor',
      'bin-into-categorical',
      'view-in-explore',
      'calculate-from',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns time/date items in spec order', () => {
    const items = getMenuItemsForKind('date');
    expect(items.map(i => i.id)).toEqual([
      'use-as-timestamp',
      'use-as-time-factors',
      'view-in-explore',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns categorical items in spec order', () => {
    const items = getMenuItemsForKind('categorical');
    expect(items.map(i => i.id)).toEqual([
      'use-as-factor',
      'use-as-process-step',
      'view-in-explore',
      'combine-levels',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns id items in spec order', () => {
    const items = getMenuItemsForKind('id');
    expect(items.map(i => i.id)).toEqual([
      'use-as-scope-id',
      'view-uniqueness-in-explore',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns text items (fallback set)', () => {
    const items = getMenuItemsForKind('text');
    expect(items.map(i => i.id)).toEqual(['parsing-and-format', 'rename-column']);
  });

  it('every item has a human label', () => {
    const allKinds = ['numeric', 'date', 'categorical', 'id', 'text'] as const;
    for (const kind of allKinds) {
      for (const item of getMenuItemsForKind(kind)) {
        expect(item.label).toBeTruthy();
        expect(item.id).toBeTruthy();
      }
    }
  });
});
