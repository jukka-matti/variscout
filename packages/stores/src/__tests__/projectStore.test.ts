import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../projectStore';
import type { DataRow, SpecLimits, AnalysisMode } from '@variscout/core';

beforeEach(() => {
  useProjectStore.setState(useProjectStore.getInitialState());
});

describe('projectStore — initial state', () => {
  it('initializes with empty rawData', () => {
    const state = useProjectStore.getState();
    expect(state.rawData).toEqual([]);
  });

  it('initializes with null projectId and projectName', () => {
    const state = useProjectStore.getState();
    expect(state.projectId).toBeNull();
    expect(state.projectName).toBeNull();
  });

  it('initializes hasUnsavedChanges as false', () => {
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);
  });

  it('initializes analysisMode as standard', () => {
    expect(useProjectStore.getState().analysisMode).toBe('standard');
  });

  it('initializes outcome and factors as empty', () => {
    const state = useProjectStore.getState();
    expect(state.outcome).toBeNull();
    expect(state.factors).toEqual([]);
  });

  it('initializes filters as empty object', () => {
    expect(useProjectStore.getState().filters).toEqual({});
  });

  it('initializes specs as empty object', () => {
    expect(useProjectStore.getState().specs).toEqual({});
  });
});

describe('projectStore — setRawData', () => {
  it('updates rawData', () => {
    const rows: DataRow[] = [{ value: 1 }, { value: 2 }];
    useProjectStore.getState().setRawData(rows);
    expect(useProjectStore.getState().rawData).toEqual(rows);
  });

  it('marks unsaved after setRawData', () => {
    useProjectStore.getState().setRawData([{ x: 1 }]);
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('handles empty array', () => {
    useProjectStore.getState().setRawData([{ x: 1 }]);
    useProjectStore.getState().setRawData([]);
    expect(useProjectStore.getState().rawData).toEqual([]);
  });
});

describe('projectStore — setOutcome and setFactors', () => {
  it('setOutcome updates outcome', () => {
    useProjectStore.getState().setOutcome('weight');
    expect(useProjectStore.getState().outcome).toBe('weight');
  });

  it('setOutcome marks unsaved', () => {
    useProjectStore.getState().setOutcome('weight');
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setOutcome accepts null', () => {
    useProjectStore.getState().setOutcome('weight');
    useProjectStore.getState().setOutcome(null);
    expect(useProjectStore.getState().outcome).toBeNull();
  });

  it('setFactors updates factors array', () => {
    useProjectStore.getState().setFactors(['shift', 'machine']);
    expect(useProjectStore.getState().factors).toEqual(['shift', 'machine']);
  });

  it('setFactors marks unsaved', () => {
    useProjectStore.getState().setFactors(['shift']);
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });
});

describe('projectStore — setSpecs', () => {
  it('stores spec limits', () => {
    const specs: SpecLimits = { usl: 10.5, lsl: 9.5, target: 10 };
    useProjectStore.getState().setSpecs(specs);
    expect(useProjectStore.getState().specs).toEqual(specs);
  });

  it('marks unsaved after setSpecs', () => {
    useProjectStore.getState().setSpecs({ usl: 100 });
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('allows partial spec (USL only)', () => {
    useProjectStore.getState().setSpecs({ usl: 5 });
    expect(useProjectStore.getState().specs.usl).toBe(5);
    expect(useProjectStore.getState().specs.lsl).toBeUndefined();
  });
});

describe('projectStore — setFilters', () => {
  it('updates filter state', () => {
    const filters = { shift: ['morning', 'evening'], machine: [1, 2] };
    useProjectStore.getState().setFilters(filters);
    expect(useProjectStore.getState().filters).toEqual(filters);
  });

  it('marks unsaved after setFilters', () => {
    useProjectStore.getState().setFilters({ shift: ['morning'] });
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('replaces previous filters', () => {
    useProjectStore.getState().setFilters({ shift: ['morning'] });
    useProjectStore.getState().setFilters({ machine: [1] });
    const state = useProjectStore.getState();
    expect(state.filters).toEqual({ machine: [1] });
    expect(state.filters.shift).toBeUndefined();
  });
});

describe('projectStore — setAnalysisMode', () => {
  it('changes analysisMode to performance', () => {
    const mode: AnalysisMode = 'performance';
    useProjectStore.getState().setAnalysisMode(mode);
    expect(useProjectStore.getState().analysisMode).toBe('performance');
  });

  it('changes analysisMode to yamazumi', () => {
    useProjectStore.getState().setAnalysisMode('yamazumi');
    expect(useProjectStore.getState().analysisMode).toBe('yamazumi');
  });

  it('marks unsaved after setAnalysisMode', () => {
    useProjectStore.getState().setAnalysisMode('performance');
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });
});

describe('projectStore — newProject', () => {
  it('resets all state to defaults', () => {
    // Set some state
    useProjectStore.getState().setRawData([{ x: 1 }]);
    useProjectStore.getState().setOutcome('weight');
    useProjectStore.getState().setFactors(['shift']);
    useProjectStore.getState().setSpecs({ usl: 100, lsl: 80 });
    useProjectStore.getState().setAnalysisMode('performance');

    // Reset
    useProjectStore.getState().newProject();

    const state = useProjectStore.getState();
    expect(state.rawData).toEqual([]);
    expect(state.outcome).toBeNull();
    expect(state.factors).toEqual([]);
    expect(state.specs).toEqual({});
    expect(state.analysisMode).toBe('standard');
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.projectId).toBeNull();
    expect(state.projectName).toBeNull();
  });

  it('clears filters on newProject', () => {
    useProjectStore.getState().setFilters({ shift: ['day'] });
    useProjectStore.getState().newProject();
    expect(useProjectStore.getState().filters).toEqual({});
  });
});

describe('projectStore — loadProject', () => {
  it('hydrates rawData and outcome from serialized object', () => {
    const rows: DataRow[] = [{ value: 42 }];
    useProjectStore.getState().loadProject({
      projectId: 'proj-123',
      projectName: 'Test Project',
      rawData: rows,
      outcome: 'value',
      factors: ['batch'],
      specs: { usl: 50, lsl: 30 },
      analysisMode: 'standard' as AnalysisMode,
    });

    const state = useProjectStore.getState();
    expect(state.projectId).toBe('proj-123');
    expect(state.projectName).toBe('Test Project');
    expect(state.rawData).toEqual(rows);
    expect(state.outcome).toBe('value');
    expect(state.factors).toEqual(['batch']);
    expect(state.specs).toEqual({ usl: 50, lsl: 30 });
  });

  it('marks saved (hasUnsavedChanges = false) after loadProject', () => {
    useProjectStore.getState().loadProject({
      projectId: 'p1',
      projectName: 'My Project',
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      analysisMode: 'standard' as AnalysisMode,
    });
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);
  });

  it('handles partial serialized data (missing optional fields)', () => {
    useProjectStore.getState().loadProject({
      projectId: 'p2',
      projectName: 'Minimal',
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      analysisMode: 'standard' as AnalysisMode,
    });
    const state = useProjectStore.getState();
    expect(state.filters).toEqual({});
    expect(state.displayOptions).toBeDefined();
  });
});

describe('projectStore — markSaved / markUnsaved', () => {
  it('markUnsaved sets hasUnsavedChanges to true', () => {
    useProjectStore.getState().markUnsaved();
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('markSaved sets hasUnsavedChanges to false', () => {
    useProjectStore.getState().markUnsaved();
    useProjectStore.getState().markSaved();
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);
  });

  it('markSaved after newProject keeps it false', () => {
    useProjectStore.getState().newProject();
    useProjectStore.getState().markSaved();
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);
  });
});

describe('projectStore — additional setters', () => {
  it('setDataFilename updates filename and marks unsaved', () => {
    useProjectStore.getState().setDataFilename('data.csv');
    expect(useProjectStore.getState().dataFilename).toBe('data.csv');
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setProjectName updates name and marks unsaved', () => {
    useProjectStore.getState().setProjectName('My Investigation');
    expect(useProjectStore.getState().projectName).toBe('My Investigation');
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setMeasureColumns updates columns and marks unsaved', () => {
    useProjectStore.getState().setMeasureColumns(['head1', 'head2', 'head3']);
    expect(useProjectStore.getState().measureColumns).toEqual(['head1', 'head2', 'head3']);
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setStageColumn updates stageColumn and marks unsaved', () => {
    useProjectStore.getState().setStageColumn('phase');
    expect(useProjectStore.getState().stageColumn).toBe('phase');
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setDisplayOptions updates displayOptions and marks unsaved', () => {
    useProjectStore.getState().setDisplayOptions({ showViolin: true, showControlLimits: false });
    const opts = useProjectStore.getState().displayOptions;
    expect(opts.showViolin).toBe(true);
    expect(opts.showControlLimits).toBe(false);
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setColumnAliases updates aliases and marks unsaved', () => {
    useProjectStore.getState().setColumnAliases({ head1: 'Fill Head 1' });
    expect(useProjectStore.getState().columnAliases).toEqual({ head1: 'Fill Head 1' });
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  // --- Selection (relocated to useViewStore in F4) ---

  it('does not own selectedPoints (relocated to useViewStore in F4)', () => {
    const state = useProjectStore.getState() as Record<string, unknown>;
    expect('selectedPoints' in state).toBe(false);
    expect('selectionIndexMap' in state).toBe(false);
  });

  it('does not expose selection actions (relocated to useViewStore in F4)', () => {
    const state = useProjectStore.getState() as Record<string, unknown>;
    expect('setSelectedPoints' in state).toBe(false);
    expect('addToSelection' in state).toBe(false);
    expect('removeFromSelection' in state).toBe(false);
    expect('clearSelection' in state).toBe(false);
    expect('togglePointSelection' in state).toBe(false);
    expect('setSelectionIndexMap' in state).toBe(false);
  });

  // --- View state ---

  it('setViewState updates viewState and marks unsaved', () => {
    useProjectStore.getState().setViewState({ activeView: 'investigation', isFindingsOpen: true });
    expect(useProjectStore.getState().viewState).toEqual({
      activeView: 'investigation',
      isFindingsOpen: true,
    });
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('loadProject restores viewState', () => {
    useProjectStore.getState().loadProject({
      projectId: 'p1',
      projectName: 'Test',
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      analysisMode: 'standard',
      viewState: { activeView: 'report' },
    });
    expect(useProjectStore.getState().viewState).toEqual({ activeView: 'report' });
  });
});

describe('projectStore — setMeasureSpec', () => {
  it('creates a new entry when column has no existing spec', () => {
    useProjectStore.getState().setMeasureSpec('Diameter', { usl: 10, lsl: 9 });
    expect(useProjectStore.getState().measureSpecs).toEqual({
      Diameter: { usl: 10, lsl: 9 },
    });
  });

  it('merges partial updates with existing spec', () => {
    useProjectStore.getState().setMeasureSpecs({
      Diameter: { usl: 10, lsl: 9, target: 9.5 },
    });
    useProjectStore.getState().setMeasureSpec('Diameter', { cpkTarget: 1.67 });
    expect(useProjectStore.getState().measureSpecs.Diameter).toEqual({
      usl: 10,
      lsl: 9,
      target: 9.5,
      cpkTarget: 1.67,
    });
  });

  it('overrides specific fields without clobbering siblings', () => {
    useProjectStore.getState().setMeasureSpecs({
      A: { usl: 5 },
      B: { usl: 10 },
    });
    useProjectStore.getState().setMeasureSpec('A', { cpkTarget: 2.0 });
    expect(useProjectStore.getState().measureSpecs).toEqual({
      A: { usl: 5, cpkTarget: 2.0 },
      B: { usl: 10 },
    });
  });

  it('marks the project as unsaved', () => {
    useProjectStore.getState().setMeasureSpec('Diameter', { cpkTarget: 1.33 });
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
  });
});
