import { describe, expect, it, vi } from 'vitest';
import { handleOutcomeDrop } from '../handleOutcomeDrop';

describe('handleOutcomeDrop', () => {
  const baseArgs = {
    activeId: 'column:Diameter',
    overId: 'outcome-zone:singleton',
    numericValuesByColumn: { Diameter: [1, 2, 3, 4, 5] },
    onOutcomeSpecAdd: vi.fn(),
  };

  it('routes column → outcome-zone drop to onOutcomeSpecAdd with derived specs', () => {
    const onOutcomeSpecAdd = vi.fn();
    const handled = handleOutcomeDrop({ ...baseArgs, onOutcomeSpecAdd });
    expect(handled).toBe(true);
    expect(onOutcomeSpecAdd).toHaveBeenCalledWith(
      'Diameter',
      expect.objectContaining({ target: 3, cpkTarget: 1.33 })
    );
  });

  it('returns false when overId is not the outcome zone', () => {
    const onOutcomeSpecAdd = vi.fn();
    expect(handleOutcomeDrop({ ...baseArgs, overId: 'step:s-1', onOutcomeSpecAdd })).toBe(false);
    expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
  });

  it('returns false when activeId is not a column drag', () => {
    const onOutcomeSpecAdd = vi.fn();
    expect(handleOutcomeDrop({ ...baseArgs, activeId: 'finding:f-1', onOutcomeSpecAdd })).toBe(
      false
    );
    expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
  });

  it('returns false when overId is undefined (dropped outside any droppable)', () => {
    const onOutcomeSpecAdd = vi.fn();
    expect(handleOutcomeDrop({ ...baseArgs, overId: undefined, onOutcomeSpecAdd })).toBe(false);
    expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
  });

  it('handles missing numericValuesByColumn entry gracefully (no values → target undefined)', () => {
    const onOutcomeSpecAdd = vi.fn();
    const handled = handleOutcomeDrop({
      ...baseArgs,
      numericValuesByColumn: {},
      onOutcomeSpecAdd,
    });
    expect(handled).toBe(true);
    expect(onOutcomeSpecAdd).toHaveBeenCalledWith(
      'Diameter',
      expect.objectContaining({ target: undefined, cpkTarget: 1.33 })
    );
  });
});
