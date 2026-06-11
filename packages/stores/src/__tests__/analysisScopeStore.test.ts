import { beforeEach, describe, expect, it } from 'vitest';
import type { ConditionLeaf } from '@variscout/core';
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  STORE_LAYER,
} from '../analysisScopeStore';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

describe('useAnalysisScopeStore — skeleton', () => {
  it('declares STORE_LAYER as view', () => {
    expect(STORE_LAYER).toBe('view');
  });

  it('initialises all fields to undefined / empty', () => {
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
    expect(s.conditionLeaves).toEqual([]);
  });

  it('getAnalysisScopeInitialState returns a fresh state object each call', () => {
    const a = getAnalysisScopeInitialState();
    const b = getAnalysisScopeInitialState();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.categoricalFilters).not.toBe(b.categoricalFilters);
  });

  it('exposes getInitialState returning the state-only shape (no action keys)', () => {
    const fn = (useAnalysisScopeStore as unknown as { getInitialState: () => unknown })
      .getInitialState;
    expect(typeof fn).toBe('function');
    const state = fn() as Record<string, unknown>;
    expect(state).not.toHaveProperty('setY');
    expect(state).not.toHaveProperty('addCategoricalValue');
    expect(state).toHaveProperty('categoricalFilters');
  });
});

describe('useAnalysisScopeStore — single-value setters', () => {
  it('setY assigns yColumn', () => {
    useAnalysisScopeStore.getState().setY('yield_pct');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('yield_pct');
  });

  it('setY(undefined) clears yColumn', () => {
    useAnalysisScopeStore.setState({ yColumn: 'yield_pct' });
    useAnalysisScopeStore.getState().setY(undefined);
    expect(useAnalysisScopeStore.getState().yColumn).toBeUndefined();
  });

  it('setBoxplotFactor assigns boxplotFactor', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('vessel');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
  });

  it('setBoxplotFactor(undefined) clears boxplotFactor', () => {
    useAnalysisScopeStore.setState({ boxplotFactor: 'vessel' });
    useAnalysisScopeStore.getState().setBoxplotFactor(undefined);
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('setStepId assigns stepId', () => {
    useAnalysisScopeStore.getState().setStepId('pack');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });

  it('setStepId(undefined) clears stepId', () => {
    useAnalysisScopeStore.setState({ stepId: 'pack' });
    useAnalysisScopeStore.getState().setStepId(undefined);
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
  });

  it('setting Y does not touch boxplotFactor / stepId', () => {
    useAnalysisScopeStore.setState({ boxplotFactor: 'vessel', stepId: 'pack' });
    useAnalysisScopeStore.getState().setY('yield_pct');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });

  it('setting boxplotFactor does not touch yColumn / stepId', () => {
    useAnalysisScopeStore.setState({ yColumn: 'yield_pct', stepId: 'pack' });
    useAnalysisScopeStore.getState().setBoxplotFactor('vessel');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('yield_pct');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });

  it('setting stepId does not touch yColumn / boxplotFactor', () => {
    useAnalysisScopeStore.setState({ yColumn: 'yield_pct', boxplotFactor: 'vessel' });
    useAnalysisScopeStore.getState().setStepId('pack');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('yield_pct');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
  });
});

describe('useAnalysisScopeStore — addCategoricalValue', () => {
  it('creates filter entry when column is new', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('appends value when column already has a filter', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'B');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });

  it('is a no-op (dedupe) when value already present', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('handles numeric values', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('lot', 42);
    useAnalysisScopeStore.getState().addCategoricalValue('lot', 43);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'lot', values: [42, 43] },
    ]);
  });

  it('keeps multiple columns independent', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('operator', 'Jane');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toHaveLength(2);
  });
});

describe('useAnalysisScopeStore — removeCategoricalValue', () => {
  it('drops the value from the column entry', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A', 'B'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['B'] },
    ]);
  });

  it('drops the entire entry when values become empty', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('is a no-op when value not present', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'B');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('is a no-op when column not present', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'operator', values: ['Jane'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'operator', values: ['Jane'] },
    ]);
  });

  it('leaves bystander columns untouched', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [
        { column: 'vessel', values: ['A', 'B'] },
        { column: 'operator', values: ['Jane'] },
      ],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['B'] },
      { column: 'operator', values: ['Jane'] },
    ]);
  });
});

describe('useAnalysisScopeStore — setCategoricalValues', () => {
  it('replaces full values array for an existing column', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['B', 'C']);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['B', 'C'] },
    ]);
  });

  it('creates a filter entry for a new column', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A', 'B']);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });

  it('empty array drops the entry (matches FilterChipDropdown uncheck-all UX)', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', []);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('empty array on a missing column is a no-op', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', []);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('leaves other columns untouched', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [
        { column: 'vessel', values: ['A'] },
        { column: 'operator', values: ['Jane'] },
      ],
    });
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['X']);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['X'] },
      { column: 'operator', values: ['Jane'] },
    ]);
  });

  it('copies the input array (caller-mutation safety)', () => {
    const input: (string | number)[] = ['A', 'B'];
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', input);
    input.push('C');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });
});

describe('useAnalysisScopeStore — removeCategoricalFilter', () => {
  it('drops the entire entry for the column', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [
        { column: 'vessel', values: ['A', 'B'] },
        { column: 'operator', values: ['Jane'] },
      ],
    });
    useAnalysisScopeStore.getState().removeCategoricalFilter('vessel');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'operator', values: ['Jane'] },
    ]);
  });

  it('is a no-op when column not present', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'operator', values: ['Jane'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalFilter('vessel');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'operator', values: ['Jane'] },
    ]);
  });
});

describe('useAnalysisScopeStore — clearScope', () => {
  it('resets all fields to the initial state', () => {
    const rangLeaf: ConditionLeaf = {
      kind: 'leaf',
      column: 'Temp',
      op: 'between',
      value: [100, 200],
    };
    useAnalysisScopeStore.setState({
      yColumn: 'yield_pct',
      boxplotFactor: 'vessel',
      stepId: 'pack',
      categoricalFilters: [{ column: 'vessel', values: ['A', 'B'] }],
      conditionLeaves: [rangLeaf],
    });
    useAnalysisScopeStore.getState().clearScope();
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
    expect(s.conditionLeaves).toEqual([]);
  });

  it('is a no-op when scope already empty', () => {
    useAnalysisScopeStore.getState().clearScope();
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
    expect(s.conditionLeaves).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// conditionLeaves slot
// ---------------------------------------------------------------------------

describe('useAnalysisScopeStore — conditionLeaves slot', () => {
  const rangeLeaf: ConditionLeaf = {
    kind: 'leaf',
    column: 'Temp',
    op: 'between',
    value: [100, 200],
  };
  const eqLeaf: ConditionLeaf = { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' };

  it('defaults to empty array from getAnalysisScopeInitialState', () => {
    expect(getAnalysisScopeInitialState().conditionLeaves).toEqual([]);
  });

  it('setConditionLeaves replaces the leaves array', () => {
    useAnalysisScopeStore.getState().setConditionLeaves([rangeLeaf]);
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([rangeLeaf]);
  });

  it('setConditionLeaves with multiple leaves stores all of them', () => {
    useAnalysisScopeStore.getState().setConditionLeaves([rangeLeaf, eqLeaf]);
    expect(useAnalysisScopeStore.getState().conditionLeaves).toHaveLength(2);
    expect(useAnalysisScopeStore.getState().conditionLeaves[0]).toEqual(rangeLeaf);
    expect(useAnalysisScopeStore.getState().conditionLeaves[1]).toEqual(eqLeaf);
  });

  it('setConditionLeaves([]) clears the slot', () => {
    useAnalysisScopeStore.setState({ conditionLeaves: [rangeLeaf] });
    useAnalysisScopeStore.getState().setConditionLeaves([]);
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([]);
  });

  it('setConditionLeaves does not affect other fields', () => {
    useAnalysisScopeStore.setState({
      yColumn: 'yield_pct',
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().setConditionLeaves([rangeLeaf]);
    expect(useAnalysisScopeStore.getState().yColumn).toBe('yield_pct');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toHaveLength(1);
  });

  it('clearScope resets conditionLeaves to []', () => {
    useAnalysisScopeStore.setState({ conditionLeaves: [rangeLeaf, eqLeaf] });
    useAnalysisScopeStore.getState().clearScope();
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([]);
  });

  it('getInitialState includes conditionLeaves: []', () => {
    const fn = (
      useAnalysisScopeStore as unknown as { getInitialState: () => Record<string, unknown> }
    ).getInitialState;
    const state = fn();
    expect(state).toHaveProperty('conditionLeaves');
    expect(state.conditionLeaves).toEqual([]);
  });

  it('copies the input array (caller-mutation safety)', () => {
    const input: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Temp', op: 'gte', value: 100 },
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Day' },
    ];
    useAnalysisScopeStore.getState().setConditionLeaves(input);
    input.push({ kind: 'leaf', column: 'Pressure', op: 'lte', value: 50 });
    expect(useAnalysisScopeStore.getState().conditionLeaves).toHaveLength(2);
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([
      { kind: 'leaf', column: 'Temp', op: 'gte', value: 100 },
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Day' },
    ]);
  });
});
