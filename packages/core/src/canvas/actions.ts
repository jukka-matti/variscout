import type { CanvasActionOf } from './types';

export function placeChipOnStep(input: {
  chipId: string;
  stepId: string;
}): CanvasActionOf<'PLACE_CHIP_ON_STEP'> {
  return {
    kind: 'PLACE_CHIP_ON_STEP',
    chipId: input.chipId,
    stepId: input.stepId,
  };
}

export function unassignChip(input: { chipId: string }): CanvasActionOf<'UNASSIGN_CHIP'> {
  return {
    kind: 'UNASSIGN_CHIP',
    chipId: input.chipId,
  };
}

export function reorderChipInStep(input: {
  chipId: string;
  stepId: string;
  toIndex: number;
}): CanvasActionOf<'REORDER_CHIP_IN_STEP'> {
  return {
    kind: 'REORDER_CHIP_IN_STEP',
    chipId: input.chipId,
    stepId: input.stepId,
    toIndex: input.toIndex,
  };
}

export function addStep(
  input: Omit<CanvasActionOf<'ADD_STEP'>, 'kind'>
): CanvasActionOf<'ADD_STEP'> {
  if (input.position === undefined) {
    return {
      kind: 'ADD_STEP',
      stepName: input.stepName,
    };
  }

  return {
    kind: 'ADD_STEP',
    stepName: input.stepName,
    position: input.position,
  };
}

export function removeStep(input: { stepId: string }): CanvasActionOf<'REMOVE_STEP'> {
  return {
    kind: 'REMOVE_STEP',
    stepId: input.stepId,
  };
}

export function renameStep(input: {
  stepId: string;
  newName: string;
}): CanvasActionOf<'RENAME_STEP'> {
  return {
    kind: 'RENAME_STEP',
    stepId: input.stepId,
    newName: input.newName,
  };
}

export function connectSteps(input: {
  fromStepId: string;
  toStepId: string;
}): CanvasActionOf<'CONNECT_STEPS'> {
  return {
    kind: 'CONNECT_STEPS',
    fromStepId: input.fromStepId,
    toStepId: input.toStepId,
  };
}

export function disconnectSteps(input: {
  fromStepId: string;
  toStepId: string;
}): CanvasActionOf<'DISCONNECT_STEPS'> {
  return {
    kind: 'DISCONNECT_STEPS',
    fromStepId: input.fromStepId,
    toStepId: input.toStepId,
  };
}

export function groupIntoSubStep(input: {
  stepIds: string[];
  parentStepId: string;
}): CanvasActionOf<'GROUP_INTO_SUB_STEP'> {
  return {
    kind: 'GROUP_INTO_SUB_STEP',
    stepIds: input.stepIds,
    parentStepId: input.parentStepId,
  };
}

export function ungroupSubStep(input: { stepId: string }): CanvasActionOf<'UNGROUP_SUB_STEP'> {
  return {
    kind: 'UNGROUP_SUB_STEP',
    stepId: input.stepId,
  };
}
