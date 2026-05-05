import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../canvasStore';

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
