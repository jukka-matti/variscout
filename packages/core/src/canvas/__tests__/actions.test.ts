import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  addStep,
  connectSteps,
  disconnectSteps,
  groupIntoSubStep,
  placeChipOnStep,
  removeStep,
  renameStep,
  reorderChipInStep,
  unassignChip,
  ungroupSubStep,
} from '../actions';
import type { CanvasActionOf } from '../types';

describe('canvas action factories', () => {
  it('creates chip assignment actions', () => {
    expect(placeChipOnStep({ chipId: 'chip-yield', stepId: 'mix' })).toEqual({
      kind: 'PLACE_CHIP_ON_STEP',
      chipId: 'chip-yield',
      stepId: 'mix',
    });
    expect(unassignChip({ chipId: 'chip-yield' })).toEqual({
      kind: 'UNASSIGN_CHIP',
      chipId: 'chip-yield',
    });
    expect(reorderChipInStep({ chipId: 'chip-yield', stepId: 'mix', toIndex: 2 })).toEqual({
      kind: 'REORDER_CHIP_IN_STEP',
      chipId: 'chip-yield',
      stepId: 'mix',
      toIndex: 2,
    });
  });

  it('creates step mutation actions', () => {
    const positioned = addStep({ stepName: 'Mix', position: { x: 20, y: 40 } });
    const unpositioned = addStep({ stepName: 'Fill' });

    expectTypeOf(positioned).toEqualTypeOf<CanvasActionOf<'ADD_STEP'>>();
    expect(positioned).toEqual({
      kind: 'ADD_STEP',
      stepName: 'Mix',
      position: { x: 20, y: 40 },
    });
    expect(unpositioned).toEqual({
      kind: 'ADD_STEP',
      stepName: 'Fill',
    });
    expect(unpositioned).not.toHaveProperty('position');
    expect(removeStep({ stepId: 'mix' })).toEqual({
      kind: 'REMOVE_STEP',
      stepId: 'mix',
    });
    expect(renameStep({ stepId: 'mix', newName: 'Blend' })).toEqual({
      kind: 'RENAME_STEP',
      stepId: 'mix',
      newName: 'Blend',
    });
  });

  it('creates connection and sub-step actions', () => {
    expect(connectSteps({ fromStepId: 'mix', toStepId: 'fill' })).toEqual({
      kind: 'CONNECT_STEPS',
      fromStepId: 'mix',
      toStepId: 'fill',
    });
    expect(disconnectSteps({ fromStepId: 'mix', toStepId: 'fill' })).toEqual({
      kind: 'DISCONNECT_STEPS',
      fromStepId: 'mix',
      toStepId: 'fill',
    });
    expect(groupIntoSubStep({ stepIds: ['dose', 'blend'], parentStepId: 'mix' })).toEqual({
      kind: 'GROUP_INTO_SUB_STEP',
      stepIds: ['dose', 'blend'],
      parentStepId: 'mix',
    });
    expect(ungroupSubStep({ stepId: 'dose' })).toEqual({
      kind: 'UNGROUP_SUB_STEP',
      stepId: 'dose',
    });
  });
});
