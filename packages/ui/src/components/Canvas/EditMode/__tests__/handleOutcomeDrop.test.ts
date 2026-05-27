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
      expect.objectContaining({ target: 3, cpkTarget: 1.33 }),
      undefined
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
      expect.objectContaining({ target: undefined, cpkTarget: 1.33 }),
      undefined
    );
  });

  describe('step-bound outcome drops (C3 Task 6)', () => {
    it('drop on outcome-zone:singleton emits stepId === undefined', () => {
      const onOutcomeSpecAdd = vi.fn();
      const handled = handleOutcomeDrop({
        ...baseArgs,
        overId: 'outcome-zone:singleton',
        onOutcomeSpecAdd,
      });
      expect(handled).toBe(true);
      expect(onOutcomeSpecAdd).toHaveBeenCalledTimes(1);
      const [, , stepId] = onOutcomeSpecAdd.mock.calls[0];
      expect(stepId).toBeUndefined();
    });

    it('drop on outcome-zone:step:step-x emits stepId === "step-x"', () => {
      const onOutcomeSpecAdd = vi.fn();
      const handled = handleOutcomeDrop({
        ...baseArgs,
        overId: 'outcome-zone:step:step-x',
        onOutcomeSpecAdd,
      });
      expect(handled).toBe(true);
      expect(onOutcomeSpecAdd).toHaveBeenCalledTimes(1);
      const [, , stepId] = onOutcomeSpecAdd.mock.calls[0];
      expect(stepId).toBe('step-x');
    });

    it('drop on outcome-zone:step: (empty stepId) returns false and does not call callback', () => {
      const onOutcomeSpecAdd = vi.fn();
      const handled = handleOutcomeDrop({
        ...baseArgs,
        overId: 'outcome-zone:step:',
        onOutcomeSpecAdd,
      });
      expect(handled).toBe(false);
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
    });
  });
});
