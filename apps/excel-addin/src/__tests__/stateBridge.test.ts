import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, updateState, type AddInState } from '../lib/stateBridge';

describe('stateBridge', () => {
  describe('createInitialState', () => {
    it('should create state with required fields', () => {
      const state = createInitialState('Sheet1!A1:D100', 'Sheet1', 'DataTable1', 'Value');

      expect(state.dataRange).toBe('Sheet1!A1:D100');
      expect(state.dataSheetName).toBe('Sheet1');
      expect(state.tableName).toBe('DataTable1');
      expect(state.outcomeColumn).toBe('Value');
      expect(state.factorColumns).toEqual([]);
      expect(state.specs).toEqual({});
      expect(state.slicerNames).toEqual([]);
      expect(state.version).toBe(1);
    });

    it('should create state with factor columns', () => {
      const state = createInitialState('Sheet1!A1:D100', 'Sheet1', 'DataTable1', 'Value', [
        'Machine',
        'Operator',
        'Shift',
      ]);

      expect(state.factorColumns).toEqual(['Machine', 'Operator', 'Shift']);
    });

    it('should set lastUpdated timestamp', () => {
      const before = new Date().toISOString();
      const state = createInitialState('A1:B10', 'Sheet1', 'Table1', 'Value');
      const after = new Date().toISOString();

      expect(state.lastUpdated >= before).toBe(true);
      expect(state.lastUpdated <= after).toBe(true);
    });
  });

  describe('updateState', () => {
    let baseState: AddInState;

    beforeEach(() => {
      baseState = {
        version: 1,
        dataRange: 'A1:D100',
        dataSheetName: 'Sheet1',
        tableName: 'Table1',
        outcomeColumn: 'Value',
        factorColumns: ['Factor1'],
        specs: { usl: 10 },
        slicerNames: ['Slicer1'],
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };
    });

    it('should increment version number', () => {
      const updated = updateState(baseState, { outcomeColumn: 'NewValue' });
      expect(updated.version).toBe(2);
    });

    it('should update specified fields', () => {
      const updated = updateState(baseState, {
        outcomeColumn: 'NewOutcome',
        factorColumns: ['NewFactor'],
      });

      expect(updated.outcomeColumn).toBe('NewOutcome');
      expect(updated.factorColumns).toEqual(['NewFactor']);
    });

    it('should preserve non-updated fields', () => {
      const updated = updateState(baseState, { outcomeColumn: 'NewValue' });

      expect(updated.dataRange).toBe('A1:D100');
      expect(updated.dataSheetName).toBe('Sheet1');
      expect(updated.tableName).toBe('Table1');
      expect(updated.specs).toEqual({ usl: 10 });
      expect(updated.slicerNames).toEqual(['Slicer1']);
    });

    it('should update lastUpdated timestamp', () => {
      const updated = updateState(baseState, { outcomeColumn: 'NewValue' });
      expect(updated.lastUpdated).not.toBe(baseState.lastUpdated);
    });

    it('should handle spec updates', () => {
      const updated = updateState(baseState, {
        specs: { usl: 15, lsl: 5, target: 10 },
      });

      expect(updated.specs).toEqual({ usl: 15, lsl: 5, target: 10 });
    });

    it('should handle stage column updates', () => {
      const updated = updateState(baseState, {
        stageColumn: 'Phase',
        stageOrderMode: 'auto',
      });

      expect(updated.stageColumn).toBe('Phase');
      expect(updated.stageOrderMode).toBe('auto');
    });

    it('should not mutate original state', () => {
      const original = { ...baseState };
      updateState(baseState, { outcomeColumn: 'Changed' });

      expect(baseState.outcomeColumn).toBe(original.outcomeColumn);
      expect(baseState.version).toBe(original.version);
    });
  });

  describe('AddInState interface', () => {
    it('should allow all optional spec fields', () => {
      const state = createInitialState('A1:B10', 'Sheet1', 'Table1', 'Value');
      state.specs = {
        usl: 100,
        lsl: 0,
        target: 50,
        cpkTarget: 1.33,
      };

      expect(state.specs.usl).toBe(100);
      expect(state.specs.lsl).toBe(0);
      expect(state.specs.target).toBe(50);
      expect(state.specs.cpkTarget).toBe(1.33);
    });

    it('should allow stage configuration', () => {
      const state = createInitialState('A1:B10', 'Sheet1', 'Table1', 'Value');
      state.stageColumn = 'Stage';
      state.stageOrderMode = 'data-order';

      expect(state.stageColumn).toBe('Stage');
      expect(state.stageOrderMode).toBe('data-order');
    });
  });
});
