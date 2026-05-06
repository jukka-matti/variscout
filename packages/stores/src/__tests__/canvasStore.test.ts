import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../canvasStore';
import type { CanvasAction } from '@variscout/core/actions';

function resetCanvasStore() {
  useCanvasStore.setState(useCanvasStore.getInitialState());
}

function addStepAndGetId(stepName: string): string {
  useCanvasStore.getState().addStep(stepName);
  const node = useCanvasStore
    .getState()
    .canonicalMap.nodes.find(candidate => candidate.name === stepName);
  if (!node) throw new Error(`Expected step "${stepName}" to be added`);
  return node.id;
}

beforeEach(() => {
  resetCanvasStore();
});

describe('canvasStore initial state', () => {
  it('resets via useCanvasStore.setState(useCanvasStore.getInitialState())', () => {
    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBe('step-a');

    resetCanvasStore();

    expect(useCanvasStore.getState().canonicalMap.assignments).toEqual({});
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });

  it('defaults canonicalMap to the extended ProcessMap shape', () => {
    const { canonicalMap, canonicalMapVersion, outcomes, primaryScopeDimensions } =
      useCanvasStore.getState();

    expect(canonicalMap.version).toBe(1);
    expect(canonicalMap.nodes).toEqual([]);
    expect(canonicalMap.tributaries).toEqual([]);
    expect(canonicalMap.assignments).toEqual({});
    expect(canonicalMap.arrows).toEqual([]);
    expect(typeof canonicalMapVersion).toBe('string');
    expect(outcomes).toEqual([]);
    expect(primaryScopeDimensions).toEqual([]);
  });
});

describe('canvasStore chip assignment actions', () => {
  it('places and unassigns a chip', () => {
    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBe('step-a');

    useCanvasStore.getState().unassignChip('chip-a');
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBeUndefined();
  });

  it('treats reorderChipInStep as a deterministic no-op without version bump', () => {
    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    const version = useCanvasStore.getState().canonicalMapVersion;

    useCanvasStore.getState().reorderChipInStep('chip-a', 'step-a', 3);

    expect(useCanvasStore.getState().canonicalMapVersion).toBe(version);
    expect(useCanvasStore.getState().historyDepth()).toBe(1);
  });
});

describe('canvasStore step actions', () => {
  it('adds, renames, and removes a step', () => {
    const stepId = addStepAndGetId('Mix');

    expect(useCanvasStore.getState().canonicalMap.nodes).toMatchObject([
      { id: stepId, name: 'Mix', order: 0 },
    ]);

    useCanvasStore.getState().renameStep(stepId, 'Blend');
    expect(useCanvasStore.getState().canonicalMap.nodes[0]?.name).toBe('Blend');

    useCanvasStore.getState().removeStep(stepId);
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);
  });

  it('removes arrows, child parent refs, and assignments when removing a step', () => {
    const parentId = addStepAndGetId('Parent');
    const childId = addStepAndGetId('Child');
    const nextId = addStepAndGetId('Next');

    useCanvasStore.getState().groupIntoSubStep([childId], parentId);
    useCanvasStore.getState().placeChipOnStep('chip-parent', parentId);
    useCanvasStore.getState().placeChipOnStep('chip-next', nextId);
    useCanvasStore.getState().connectSteps(parentId, nextId);
    useCanvasStore.getState().connectSteps(childId, nextId);

    useCanvasStore.getState().removeStep(parentId);

    expect(useCanvasStore.getState().canonicalMap.nodes.map(node => node.id)).toEqual([
      childId,
      nextId,
    ]);
    expect(
      useCanvasStore.getState().canonicalMap.nodes.find(node => node.id === childId)?.parentStepId
    ).toBeNull();
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-parent']).toBeUndefined();
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-next']).toBe(nextId);
    expect(useCanvasStore.getState().canonicalMap.arrows).toEqual([
      expect.objectContaining({ fromStepId: childId, toStepId: nextId }),
    ]);
  });

  it('creates a step from a chip and assigns the chip in one undoable change', () => {
    useCanvasStore.getState().placeChipOnStep('existing-chip', 'existing-step');
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    useCanvasStore.getState().createStepFromChip('chip-a', '  Inspect  ');

    const [node] = useCanvasStore.getState().canonicalMap.nodes;
    expect(node).toMatchObject({
      id: expect.stringMatching(/^step-inspect-\d+$/),
      name: 'Inspect',
      order: 0,
    });
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBe(node?.id);
    expect(useCanvasStore.getState().historyDepth()).toBe(1);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBeUndefined();
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.nodes).toMatchObject([
      { id: node?.id, name: 'Inspect', order: 0 },
    ]);
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBe(node?.id);
  });

  it('does not create a step from a chip when the step name is blank', () => {
    const version = useCanvasStore.getState().canonicalMapVersion;

    useCanvasStore.getState().createStepFromChip('chip-a', '   ');

    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBeUndefined();
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(version);
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
  });
});

describe('canvasStore document hydration', () => {
  it('hydrates a canvas document without creating history and preserves provided version', () => {
    useCanvasStore.getState().addStep('Draft');
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    useCanvasStore.getState().hydrateCanvasDocument({
      canonicalMap: {
        version: 1,
        nodes: [{ id: 'step-loaded', name: 'Loaded', order: 0 }],
        tributaries: [],
        assignments: { 'chip-a': 'step-loaded' },
        arrows: [],
        createdAt: '2026-05-05T00:00:00.000Z',
        updatedAt: '2026-05-05T00:00:00.000Z',
      },
      outcomes: [
        {
          id: 'o-1',
          hubId: 'hub-loaded',
          createdAt: 1714000000000,
          deletedAt: null,
          columnName: 'yield',
          characteristicType: 'largerIsBetter',
        },
      ],
      primaryScopeDimensions: ['line'],
      canonicalMapVersion: 'snapshot-version',
    });

    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([
      { id: 'step-loaded', name: 'Loaded', order: 0 },
    ]);
    expect(useCanvasStore.getState().canonicalMap.assignments).toEqual({
      'chip-a': 'step-loaded',
    });
    expect(useCanvasStore.getState().outcomes).toEqual([
      {
        id: 'o-1',
        hubId: 'hub-loaded',
        createdAt: 1714000000000,
        deletedAt: null,
        columnName: 'yield',
        characteristicType: 'largerIsBetter',
      },
    ]);
    expect(useCanvasStore.getState().primaryScopeDimensions).toEqual(['line']);
    expect(useCanvasStore.getState().canonicalMapVersion).toBe('snapshot-version');
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });

  it('hydrates older maps with safe document defaults', () => {
    useCanvasStore.getState().hydrateCanvasDocument({
      canonicalMap: {
        version: 1,
        nodes: [{ id: 'step-legacy', name: 'Legacy', order: 0 }],
        tributaries: [],
        createdAt: '2026-05-05T00:00:00.000Z',
        updatedAt: '2026-05-05T00:00:00.000Z',
      },
    });

    expect(useCanvasStore.getState().canonicalMap.assignments).toEqual({});
    expect(useCanvasStore.getState().canonicalMap.arrows).toEqual([]);
    expect(useCanvasStore.getState().outcomes).toEqual([]);
    expect(useCanvasStore.getState().primaryScopeDimensions).toEqual([]);
    expect(useCanvasStore.getState().canonicalMapVersion).toEqual(expect.any(String));
    expect(useCanvasStore.getState().canonicalMapVersion).not.toBe('');
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });

  it('advances generated versions after hydrating a generated map version', () => {
    useCanvasStore.getState().hydrateCanvasDocument({
      canonicalMap: {
        version: 1,
        nodes: [],
        tributaries: [],
        createdAt: '2026-05-05T00:00:00.000Z',
        updatedAt: '2026-05-05T00:00:00.000Z',
      },
      canonicalMapVersion: 'canvas-map-7',
    });

    useCanvasStore.getState().addStep('Next');

    expect(useCanvasStore.getState().canonicalMapVersion).toBe('canvas-map-8');
  });
});

describe('canvasStore arrow actions', () => {
  it('connects and disconnects arrows with duplicate prevention', () => {
    const fromStepId = addStepAndGetId('Mix');
    const toStepId = addStepAndGetId('Fill');

    useCanvasStore.getState().connectSteps(fromStepId, toStepId);
    useCanvasStore.getState().connectSteps(fromStepId, toStepId);

    expect(useCanvasStore.getState().canonicalMap.arrows).toHaveLength(1);
    expect(useCanvasStore.getState().canonicalMap.arrows?.[0]).toMatchObject({
      fromStepId,
      toStepId,
    });

    useCanvasStore.getState().disconnectSteps(fromStepId, toStepId);
    expect(useCanvasStore.getState().canonicalMap.arrows).toEqual([]);
  });
});

describe('canvasStore grouping actions', () => {
  it('groups and ungroups a sub-step using parentStepId', () => {
    const parentId = addStepAndGetId('Line');
    const childId = addStepAndGetId('Inspect');

    useCanvasStore.getState().groupIntoSubStep([childId], parentId);
    expect(
      useCanvasStore.getState().canonicalMap.nodes.find(node => node.id === childId)?.parentStepId
    ).toBe(parentId);

    useCanvasStore.getState().ungroupSubStep(childId);
    expect(
      useCanvasStore.getState().canonicalMap.nodes.find(node => node.id === childId)?.parentStepId
    ).toBeNull();
  });

  it('treats ungroupSubStep on a top-level step as a no-op', () => {
    const stepId = addStepAndGetId('Inspect');
    const version = useCanvasStore.getState().canonicalMapVersion;
    const historyDepth = useCanvasStore.getState().historyDepth();
    const nodeBefore = useCanvasStore
      .getState()
      .canonicalMap.nodes.find(candidate => candidate.id === stepId);

    useCanvasStore.getState().ungroupSubStep(stepId);

    const nodeAfter = useCanvasStore
      .getState()
      .canonicalMap.nodes.find(candidate => candidate.id === stepId);
    expect(nodeAfter).toEqual(nodeBefore);
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(version);
    expect(useCanvasStore.getState().historyDepth()).toBe(historyDepth);
  });
});

describe('canvasStore versions and immutable updates', () => {
  it('bumps canonicalMapVersion on changes only', () => {
    const initialVersion = useCanvasStore.getState().canonicalMapVersion;
    useCanvasStore.getState().renameStep('missing-step', 'Nope');
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(initialVersion);

    const stepId = addStepAndGetId('Mix');
    const afterAddVersion = useCanvasStore.getState().canonicalMapVersion;
    expect(afterAddVersion).not.toBe(initialVersion);

    useCanvasStore.getState().disconnectSteps(stepId, 'missing-step');
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(afterAddVersion);

    useCanvasStore.getState().renameStep(stepId, 'Blend');
    expect(useCanvasStore.getState().canonicalMapVersion).not.toBe(afterAddVersion);
  });

  it('updates canonicalMap immutably through Immer', () => {
    const previousMap = useCanvasStore.getState().canonicalMap;
    const previousNodes = previousMap.nodes;

    addStepAndGetId('Mix');

    expect(useCanvasStore.getState().canonicalMap).not.toBe(previousMap);
    expect(useCanvasStore.getState().canonicalMap.nodes).not.toBe(previousNodes);
  });
});

describe('canvasStore history controls', () => {
  it('undoes and redoes chip assignment', () => {
    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBe('step-a');
    expect(useCanvasStore.getState().historyDepth()).toBe(1);

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBeUndefined();
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-a']).toBe('step-a');
    expect(useCanvasStore.getState().historyDepth()).toBe(1);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });

  it('undo and redo restore the full document snapshot including canonicalMapVersion', () => {
    const initialVersion = useCanvasStore.getState().canonicalMapVersion;

    const stepId = addStepAndGetId('Mix');
    const addedVersion = useCanvasStore.getState().canonicalMapVersion;
    expect(addedVersion).not.toBe(initialVersion);

    useCanvasStore.getState().renameStep(stepId, 'Blend');
    const renamedVersion = useCanvasStore.getState().canonicalMapVersion;
    expect(renamedVersion).not.toBe(addedVersion);

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.nodes[0]?.name).toBe('Mix');
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(addedVersion);

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(initialVersion);

    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.nodes[0]?.name).toBe('Mix');
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(addedVersion);

    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.nodes[0]?.name).toBe('Blend');
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(renamedVersion);
  });

  it('undoes and redoes step creation and removal', () => {
    const stepId = addStepAndGetId('Mix');
    expect(useCanvasStore.getState().canonicalMap.nodes.map(node => node.id)).toEqual([stepId]);

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);

    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.nodes.map(node => node.id)).toEqual([stepId]);

    useCanvasStore.getState().removeStep(stepId);
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.nodes.map(node => node.id)).toEqual([stepId]);

    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);
  });

  it('clears redo when a new undoable action runs after undo', () => {
    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    useCanvasStore.getState().placeChipOnStep('chip-b', 'step-b');

    expect(useCanvasStore.getState().redoDepth()).toBe(0);
    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-b']).toBe('step-b');
  });

  it('caps history at 50 undoable actions', () => {
    for (let index = 0; index < 60; index++) {
      useCanvasStore.getState().placeChipOnStep(`chip-${index}`, 'step-a');
    }

    expect(useCanvasStore.getState().historyDepth()).toBe(50);
  });

  it('clears history stacks', () => {
    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    useCanvasStore.getState().clearHistory();

    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });

  it('notifies subscribers when history and redo depths change', () => {
    const observedDepths: Array<[number, number]> = [];
    const unsubscribe = useCanvasStore.subscribe(state => {
      observedDepths.push([state.historyDepth(), state.redoDepth()]);
    });

    useCanvasStore.getState().placeChipOnStep('chip-a', 'step-a');
    useCanvasStore.getState().undo();
    useCanvasStore.getState().redo();
    useCanvasStore.getState().clearHistory();
    unsubscribe();

    expect(observedDepths).toEqual([
      [1, 0],
      [0, 1],
      [1, 0],
      [0, 0],
    ]);
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });

  it('treats empty undo and redo as no-ops', () => {
    const before = useCanvasStore.getState().canonicalMap;

    expect(() => useCanvasStore.getState().undo()).not.toThrow();
    expect(() => useCanvasStore.getState().redo()).not.toThrow();

    expect(useCanvasStore.getState().canonicalMap).toBe(before);
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(0);
  });
});

describe('canvasStore dispatch', () => {
  it('PLACE_CHIP_ON_STEP routes through placeChipOnStep', () => {
    useCanvasStore.getState().addStep('Step A');
    const stepId = useCanvasStore.getState().canonicalMap.nodes[0]!.id;

    const action: CanvasAction = { kind: 'PLACE_CHIP_ON_STEP', chipId: 'chip-1', stepId };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-1']).toBe(stepId);
  });

  it('UNASSIGN_CHIP routes through unassignChip', () => {
    useCanvasStore.getState().addStep('Step A');
    const stepId = useCanvasStore.getState().canonicalMap.nodes[0]!.id;
    useCanvasStore.getState().placeChipOnStep('chip-1', stepId);

    const action: CanvasAction = { kind: 'UNASSIGN_CHIP', chipId: 'chip-1' };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.assignments?.['chip-1']).toBeUndefined();
  });

  it('REORDER_CHIP_IN_STEP routes through reorderChipInStep (stable no-op)', () => {
    useCanvasStore.getState().addStep('Step A');
    const stepId = useCanvasStore.getState().canonicalMap.nodes[0]!.id;
    useCanvasStore.getState().placeChipOnStep('chip-1', stepId);
    const version = useCanvasStore.getState().canonicalMapVersion;

    const action: CanvasAction = {
      kind: 'REORDER_CHIP_IN_STEP',
      chipId: 'chip-1',
      stepId,
      toIndex: 2,
    };
    useCanvasStore.getState().dispatch(action);

    // reorderChipInStep is a stable no-op — version must not change
    expect(useCanvasStore.getState().canonicalMapVersion).toBe(version);
  });

  it('ADD_STEP routes through addStep and creates a new node', () => {
    const action: CanvasAction = { kind: 'ADD_STEP', stepName: 'Weld' };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.nodes).toHaveLength(1);
    expect(useCanvasStore.getState().canonicalMap.nodes[0]?.name).toBe('Weld');
  });

  it('REMOVE_STEP routes through removeStep', () => {
    useCanvasStore.getState().addStep('Remove Me');
    const stepId = useCanvasStore.getState().canonicalMap.nodes[0]!.id;

    const action: CanvasAction = { kind: 'REMOVE_STEP', stepId };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.nodes).toHaveLength(0);
  });

  it('RENAME_STEP routes through renameStep', () => {
    useCanvasStore.getState().addStep('Old Name');
    const stepId = useCanvasStore.getState().canonicalMap.nodes[0]!.id;

    const action: CanvasAction = { kind: 'RENAME_STEP', stepId, newName: 'New Name' };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.nodes[0]?.name).toBe('New Name');
  });

  it('CONNECT_STEPS routes through connectSteps', () => {
    useCanvasStore.getState().addStep('From');
    useCanvasStore.getState().addStep('To');
    const [fromNode, toNode] = useCanvasStore.getState().canonicalMap.nodes;
    const fromStepId = fromNode!.id;
    const toStepId = toNode!.id;

    const action: CanvasAction = { kind: 'CONNECT_STEPS', fromStepId, toStepId };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.arrows).toHaveLength(1);
    expect(useCanvasStore.getState().canonicalMap.arrows?.[0]).toMatchObject({
      fromStepId,
      toStepId,
    });
  });

  it('DISCONNECT_STEPS routes through disconnectSteps', () => {
    useCanvasStore.getState().addStep('From');
    useCanvasStore.getState().addStep('To');
    const [fromNode, toNode] = useCanvasStore.getState().canonicalMap.nodes;
    const fromStepId = fromNode!.id;
    const toStepId = toNode!.id;
    useCanvasStore.getState().connectSteps(fromStepId, toStepId);

    const action: CanvasAction = { kind: 'DISCONNECT_STEPS', fromStepId, toStepId };
    useCanvasStore.getState().dispatch(action);

    expect(useCanvasStore.getState().canonicalMap.arrows).toHaveLength(0);
  });

  it('GROUP_INTO_SUB_STEP routes through groupIntoSubStep', () => {
    useCanvasStore.getState().addStep('Parent');
    useCanvasStore.getState().addStep('Child');
    const [parentNode, childNode] = useCanvasStore.getState().canonicalMap.nodes;
    const parentStepId = parentNode!.id;
    const childStepId = childNode!.id;

    const action: CanvasAction = {
      kind: 'GROUP_INTO_SUB_STEP',
      stepIds: [childStepId],
      parentStepId,
    };
    useCanvasStore.getState().dispatch(action);

    const childAfter = useCanvasStore
      .getState()
      .canonicalMap.nodes.find(node => node.id === childStepId);
    expect(childAfter?.parentStepId).toBe(parentStepId);
  });

  it('UNGROUP_SUB_STEP routes through ungroupSubStep', () => {
    useCanvasStore.getState().addStep('Parent');
    useCanvasStore.getState().addStep('Child');
    const [parentNode, childNode] = useCanvasStore.getState().canonicalMap.nodes;
    const parentStepId = parentNode!.id;
    const childStepId = childNode!.id;
    useCanvasStore.getState().groupIntoSubStep([childStepId], parentStepId);

    const action: CanvasAction = { kind: 'UNGROUP_SUB_STEP', stepId: childStepId };
    useCanvasStore.getState().dispatch(action);

    const childAfter = useCanvasStore
      .getState()
      .canonicalMap.nodes.find(node => node.id === childStepId);
    expect(childAfter?.parentStepId).toBeNull();
  });

  it('dispatch produces the same state as the equivalent direct method call', () => {
    // Dispatch ADD_STEP and compare to direct addStep result
    useCanvasStore.getState().dispatch({ kind: 'ADD_STEP', stepName: 'Via Dispatch' });
    const dispatchedNode = useCanvasStore.getState().canonicalMap.nodes[0];

    resetCanvasStore();

    useCanvasStore.getState().addStep('Via Dispatch');
    const directNode = useCanvasStore.getState().canonicalMap.nodes[0];

    // Node names match; ids differ due to sequential counters but shape is the same
    expect(dispatchedNode?.name).toBe(directNode?.name);
    expect(dispatchedNode?.order).toBe(directNode?.order);
  });
});
