export interface CanvasPosition {
  x: number;
  y: number;
}

export type CanvasAction =
  | {
      kind: 'PLACE_CHIP_ON_STEP';
      chipId: string;
      stepId: string;
    }
  | {
      kind: 'UNASSIGN_CHIP';
      chipId: string;
    }
  | {
      kind: 'REORDER_CHIP_IN_STEP';
      chipId: string;
      stepId: string;
      toIndex: number;
    }
  | {
      kind: 'ADD_STEP';
      stepName: string;
      position?: CanvasPosition;
    }
  | {
      kind: 'REMOVE_STEP';
      stepId: string;
    }
  | {
      kind: 'RENAME_STEP';
      stepId: string;
      newName: string;
    }
  | {
      kind: 'CONNECT_STEPS';
      fromStepId: string;
      toStepId: string;
    }
  | {
      kind: 'DISCONNECT_STEPS';
      fromStepId: string;
      toStepId: string;
    }
  | {
      kind: 'GROUP_INTO_SUB_STEP';
      stepIds: string[];
      parentStepId: string;
    }
  | {
      kind: 'UNGROUP_SUB_STEP';
      stepId: string;
    };

export type CanvasActionOf<K extends CanvasAction['kind']> = Extract<CanvasAction, { kind: K }>;
