import { describe, expect, it, vi } from 'vitest';
import { handleFactorDrop } from '../handleFactorDrop';

describe('handleFactorDrop', () => {
  it('routes column → factor-zone:global to onFactorControlAdd(name, undefined)', () => {
    const onFactorControlAdd = vi.fn();
    const handled = handleFactorDrop({
      activeId: 'column:Temperature',
      overId: 'factor-zone:global',
      onFactorControlAdd,
    });
    expect(handled).toBe(true);
    expect(onFactorControlAdd).toHaveBeenCalledWith('Temperature', undefined);
  });

  it('routes column → factor-zone:step:<stepId> to onFactorControlAdd(name, stepId)', () => {
    const onFactorControlAdd = vi.fn();
    const handled = handleFactorDrop({
      activeId: 'column:Pressure',
      overId: 'factor-zone:step:s-mix',
      onFactorControlAdd,
    });
    expect(handled).toBe(true);
    expect(onFactorControlAdd).toHaveBeenCalledWith('Pressure', 's-mix');
  });

  it('returns false when overId is not a factor-zone id', () => {
    const onFactorControlAdd = vi.fn();
    const handled = handleFactorDrop({
      activeId: 'column:Temperature',
      overId: 'outcome-zone:singleton',
      onFactorControlAdd,
    });
    expect(handled).toBe(false);
    expect(onFactorControlAdd).not.toHaveBeenCalled();
  });

  it('returns false when activeId is not a column drag', () => {
    const onFactorControlAdd = vi.fn();
    const handled = handleFactorDrop({
      activeId: 'chip:c-1',
      overId: 'factor-zone:global',
      onFactorControlAdd,
    });
    expect(handled).toBe(false);
    expect(onFactorControlAdd).not.toHaveBeenCalled();
  });

  it('returns false when overId is undefined (dropped outside)', () => {
    const onFactorControlAdd = vi.fn();
    const handled = handleFactorDrop({
      activeId: 'column:Temperature',
      overId: undefined,
      onFactorControlAdd,
    });
    expect(handled).toBe(false);
    expect(onFactorControlAdd).not.toHaveBeenCalled();
  });
});
