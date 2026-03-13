import { describe, it, expect } from 'vitest';
import {
  editorFlowReducer,
  initialFlowState,
  type EditorFlowState,
  type EditorFlowAction,
} from '../useEditorDataFlow';

/** Helper to apply a sequence of actions to the initial state. */
function applyActions(actions: EditorFlowAction[], start = initialFlowState): EditorFlowState {
  return actions.reduce(editorFlowReducer, start);
}

describe('editorFlowReducer', () => {
  describe('initial state', () => {
    it('has all booleans false and nullable fields null', () => {
      expect(initialFlowState).toEqual({
        isManualEntry: false,
        appendMode: false,
        isPasteMode: false,
        pasteError: null,
        isMapping: false,
        isMappingReEdit: false,
        isParsingFile: false,
        isLoadingProject: false,
        drillFromPerformance: null,
        appendFeedback: null,
      });
    });
  });

  describe('paste flow', () => {
    it('START_PASTE enters paste mode and clears error', () => {
      const state = editorFlowReducer(
        { ...initialFlowState, pasteError: 'old error' },
        { type: 'START_PASTE' }
      );
      expect(state.isPasteMode).toBe(true);
      expect(state.pasteError).toBeNull();
    });

    it('START_APPEND_PASTE enters paste + append mode', () => {
      const state = editorFlowReducer(initialFlowState, { type: 'START_APPEND_PASTE' });
      expect(state.isPasteMode).toBe(true);
      expect(state.appendMode).toBe(true);
      expect(state.pasteError).toBeNull();
    });

    it('PASTE_ANALYZED transitions paste → mapping', () => {
      const state = applyActions([{ type: 'START_PASTE' }, { type: 'PASTE_ANALYZED' }]);
      expect(state.isPasteMode).toBe(false);
      expect(state.isMapping).toBe(true);
    });

    it('PASTE_ERROR sets error message', () => {
      const state = applyActions([
        { type: 'START_PASTE' },
        { type: 'PASTE_ERROR', error: 'bad data' },
      ]);
      expect(state.pasteError).toBe('bad data');
      expect(state.isPasteMode).toBe(true);
    });

    it('CANCEL_PASTE resets paste + append + error', () => {
      const state = applyActions([
        { type: 'START_APPEND_PASTE' },
        { type: 'PASTE_ERROR', error: 'fail' },
        { type: 'CANCEL_PASTE' },
      ]);
      expect(state.isPasteMode).toBe(false);
      expect(state.appendMode).toBe(false);
      expect(state.pasteError).toBeNull();
    });
  });

  describe('manual entry flow', () => {
    it('START_MANUAL_ENTRY enters manual entry', () => {
      const state = editorFlowReducer(initialFlowState, { type: 'START_MANUAL_ENTRY' });
      expect(state.isManualEntry).toBe(true);
      expect(state.appendMode).toBe(false);
    });

    it('START_APPEND_MANUAL enters manual entry + append', () => {
      const state = editorFlowReducer(initialFlowState, { type: 'START_APPEND_MANUAL' });
      expect(state.isManualEntry).toBe(true);
      expect(state.appendMode).toBe(true);
    });

    it('CANCEL_MANUAL_ENTRY resets both flags', () => {
      const state = applyActions([
        { type: 'START_APPEND_MANUAL' },
        { type: 'CANCEL_MANUAL_ENTRY' },
      ]);
      expect(state.isManualEntry).toBe(false);
      expect(state.appendMode).toBe(false);
    });

    it('MANUAL_ENTRY_DONE resets both flags', () => {
      const state = applyActions([{ type: 'START_APPEND_MANUAL' }, { type: 'MANUAL_ENTRY_DONE' }]);
      expect(state.isManualEntry).toBe(false);
      expect(state.appendMode).toBe(false);
    });
  });

  describe('mapping flow', () => {
    it('OPEN_FACTOR_MANAGER enters mapping in re-edit mode', () => {
      const state = editorFlowReducer(initialFlowState, { type: 'OPEN_FACTOR_MANAGER' });
      expect(state.isMapping).toBe(true);
      expect(state.isMappingReEdit).toBe(true);
    });

    it('OPEN_MAPPING enters fresh mapping', () => {
      const state = editorFlowReducer(initialFlowState, { type: 'OPEN_MAPPING' });
      expect(state.isMapping).toBe(true);
      expect(state.isMappingReEdit).toBe(false);
    });

    it('CONFIRM_MAPPING closes mapping and clears re-edit', () => {
      const state = applyActions([{ type: 'OPEN_FACTOR_MANAGER' }, { type: 'CONFIRM_MAPPING' }]);
      expect(state.isMapping).toBe(false);
      expect(state.isMappingReEdit).toBe(false);
    });

    it('CANCEL_MAPPING closes mapping and clears re-edit', () => {
      const state = applyActions([{ type: 'OPEN_FACTOR_MANAGER' }, { type: 'CANCEL_MAPPING' }]);
      expect(state.isMapping).toBe(false);
      expect(state.isMappingReEdit).toBe(false);
    });
  });

  describe('file parse flow', () => {
    it('START_FILE_PARSE → FILE_PARSED_TO_MAPPING', () => {
      const state = applyActions([
        { type: 'START_FILE_PARSE' },
        { type: 'FILE_PARSED_TO_MAPPING' },
      ]);
      expect(state.isParsingFile).toBe(false);
      expect(state.isMapping).toBe(true);
    });

    it('START_FILE_PARSE → FILE_PARSE_DONE (failure path)', () => {
      const state = applyActions([{ type: 'START_FILE_PARSE' }, { type: 'FILE_PARSE_DONE' }]);
      expect(state.isParsingFile).toBe(false);
      expect(state.isMapping).toBe(false);
    });
  });

  describe('append file flow', () => {
    it('START_APPEND_FILE → APPEND_FILE_TO_MAPPING', () => {
      const state = applyActions([
        { type: 'START_APPEND_FILE' },
        { type: 'APPEND_FILE_TO_MAPPING' },
      ]);
      expect(state.isParsingFile).toBe(false);
      expect(state.appendMode).toBe(false);
      expect(state.isMapping).toBe(true);
    });

    it('START_APPEND_FILE → APPEND_FILE_DONE (failure)', () => {
      const state = applyActions([{ type: 'START_APPEND_FILE' }, { type: 'APPEND_FILE_DONE' }]);
      expect(state.isParsingFile).toBe(false);
      // appendMode stays since the file input was triggered but no data loaded
    });
  });

  describe('append paste results', () => {
    it('APPEND_ROWS_DONE clears paste+append, sets feedback', () => {
      const state = applyActions([
        { type: 'START_APPEND_PASTE' },
        { type: 'APPEND_ROWS_DONE', feedback: 'Appended 5 rows' },
      ]);
      expect(state.isPasteMode).toBe(false);
      expect(state.appendMode).toBe(false);
      expect(state.appendFeedback).toBe('Appended 5 rows');
    });

    it('APPEND_COLUMNS_DONE clears paste+append, opens mapping, sets feedback', () => {
      const state = applyActions([
        { type: 'START_APPEND_PASTE' },
        { type: 'APPEND_COLUMNS_DONE', feedback: 'Added 1 column' },
      ]);
      expect(state.isPasteMode).toBe(false);
      expect(state.appendMode).toBe(false);
      expect(state.isMapping).toBe(true);
      expect(state.appendFeedback).toBe('Added 1 column');
    });

    it('CLEAR_APPEND_FEEDBACK clears feedback', () => {
      const state = applyActions([
        { type: 'APPEND_ROWS_DONE', feedback: 'msg' },
        { type: 'CLEAR_APPEND_FEEDBACK' },
      ]);
      expect(state.appendFeedback).toBeNull();
    });
  });

  describe('project load', () => {
    it('START_PROJECT_LOAD → PROJECT_LOADED', () => {
      const s1 = editorFlowReducer(initialFlowState, { type: 'START_PROJECT_LOAD' });
      expect(s1.isLoadingProject).toBe(true);
      const s2 = editorFlowReducer(s1, { type: 'PROJECT_LOADED' });
      expect(s2.isLoadingProject).toBe(false);
    });
  });

  describe('performance mode drill', () => {
    it('DRILL_TO_MEASURE sets measure id', () => {
      const state = editorFlowReducer(initialFlowState, {
        type: 'DRILL_TO_MEASURE',
        measureId: 'Ch1',
      });
      expect(state.drillFromPerformance).toBe('Ch1');
    });

    it('BACK_TO_PERFORMANCE clears measure id', () => {
      const state = applyActions([
        { type: 'DRILL_TO_MEASURE', measureId: 'Ch1' },
        { type: 'BACK_TO_PERFORMANCE' },
      ]);
      expect(state.drillFromPerformance).toBeNull();
    });
  });

  describe('impossible state prevention', () => {
    it('cannot be in paste mode and mapping simultaneously via paste flow', () => {
      const state = applyActions([{ type: 'START_PASTE' }, { type: 'PASTE_ANALYZED' }]);
      expect(state.isPasteMode).toBe(false);
      expect(state.isMapping).toBe(true);
    });

    it('cancel paste always clears append mode', () => {
      const state = applyActions([{ type: 'START_APPEND_PASTE' }, { type: 'CANCEL_PASTE' }]);
      expect(state.appendMode).toBe(false);
      expect(state.isPasteMode).toBe(false);
    });

    it('manual entry done always clears append mode', () => {
      const state = applyActions([{ type: 'START_APPEND_MANUAL' }, { type: 'MANUAL_ENTRY_DONE' }]);
      expect(state.appendMode).toBe(false);
      expect(state.isManualEntry).toBe(false);
    });

    it('unknown action returns state unchanged', () => {
      const state = editorFlowReducer(initialFlowState, { type: 'UNKNOWN' } as never);
      expect(state).toBe(initialFlowState);
    });
  });
});
