import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CanvasAction, CanvasActionOf } from '../types';

describe('CanvasAction', () => {
  it('narrows place-chip actions by discriminant', () => {
    const action: CanvasAction = {
      kind: 'PLACE_CHIP_ON_STEP',
      chipId: 'chip-yield',
      stepId: 'mix',
    };

    if (action.kind === 'PLACE_CHIP_ON_STEP') {
      expectTypeOf(action).toEqualTypeOf<CanvasActionOf<'PLACE_CHIP_ON_STEP'>>();
      expect(action.chipId).toBe('chip-yield');
      expect(action.stepId).toBe('mix');
    }
  });

  it('narrows connect-step actions by discriminant', () => {
    const action: CanvasAction = {
      kind: 'CONNECT_STEPS',
      fromStepId: 'mix',
      toStepId: 'fill',
    };

    if (action.kind === 'CONNECT_STEPS') {
      expectTypeOf(action).toEqualTypeOf<CanvasActionOf<'CONNECT_STEPS'>>();
      expect(action.fromStepId).toBe('mix');
      expect(action.toStepId).toBe('fill');
    }
  });

  it('narrows sub-step grouping actions by discriminant', () => {
    const action: CanvasAction = {
      kind: 'GROUP_INTO_SUB_STEP',
      stepIds: ['dose', 'blend'],
      parentStepId: 'mix',
    };

    if (action.kind === 'GROUP_INTO_SUB_STEP') {
      expectTypeOf(action.stepIds).toEqualTypeOf<string[]>();
      expect(action.parentStepId).toBe('mix');
    }
  });
});
