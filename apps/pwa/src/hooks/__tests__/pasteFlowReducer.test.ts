import { describe, it, expect } from 'vitest';
import {
  pasteFlowReducer,
  initialPasteFlowState,
  type PasteFlowState,
  type PasteFlowAction,
} from '../usePasteImportFlow';
import type { WideFormatDetection } from '@variscout/core';

const reduce = (action: PasteFlowAction, state: PasteFlowState = initialPasteFlowState) =>
  pasteFlowReducer(state, action);

const mockWideFormat = { isWideFormat: true, channels: [] } as unknown as WideFormatDetection;

describe('pasteFlowReducer', () => {
  describe('initial state', () => {
    it('has all flags off', () => {
      expect(initialPasteFlowState).toEqual({
        isPasteMode: false,
        pasteError: null,
        isMapping: false,
        isMappingReEdit: false,
        isManualEntry: false,
        wideFormatDetection: null,
        yamazumiDetection: null,
      });
    });
  });

  describe('paste flow', () => {
    it('START_PASTE enables paste mode and clears error', () => {
      const withError: PasteFlowState = { ...initialPasteFlowState, pasteError: 'old error' };
      const next = reduce({ type: 'START_PASTE' }, withError);
      expect(next.isPasteMode).toBe(true);
      expect(next.pasteError).toBeNull();
    });

    it('PASTE_ERROR sets error message', () => {
      const next = reduce({ type: 'PASTE_ERROR', error: 'bad data' });
      expect(next.pasteError).toBe('bad data');
    });

    it('PASTE_ANALYZED transitions to mapping', () => {
      const pasting: PasteFlowState = { ...initialPasteFlowState, isPasteMode: true };
      const next = reduce({ type: 'PASTE_ANALYZED' }, pasting);
      expect(next.isPasteMode).toBe(false);
      expect(next.isMapping).toBe(true);
    });

    it('PASTE_ANALYZED_WIDE transitions to mapping and sets wide format', () => {
      const pasting: PasteFlowState = { ...initialPasteFlowState, isPasteMode: true };
      const next = reduce({ type: 'PASTE_ANALYZED_WIDE', detection: mockWideFormat }, pasting);
      expect(next.isPasteMode).toBe(false);
      expect(next.isMapping).toBe(true);
      expect(next.wideFormatDetection).toBe(mockWideFormat);
    });

    it('CANCEL_PASTE resets paste mode and error', () => {
      const pasting: PasteFlowState = {
        ...initialPasteFlowState,
        isPasteMode: true,
        pasteError: 'some error',
      };
      const next = reduce({ type: 'CANCEL_PASTE' }, pasting);
      expect(next.isPasteMode).toBe(false);
      expect(next.pasteError).toBeNull();
    });
  });

  describe('manual entry flow', () => {
    it('START_MANUAL_ENTRY enables manual entry', () => {
      const next = reduce({ type: 'START_MANUAL_ENTRY' });
      expect(next.isManualEntry).toBe(true);
    });

    it('CANCEL_MANUAL_ENTRY disables manual entry', () => {
      const entering: PasteFlowState = { ...initialPasteFlowState, isManualEntry: true };
      const next = reduce({ type: 'CANCEL_MANUAL_ENTRY' }, entering);
      expect(next.isManualEntry).toBe(false);
    });

    it('MANUAL_ENTRY_DONE disables manual entry', () => {
      const entering: PasteFlowState = { ...initialPasteFlowState, isManualEntry: true };
      const next = reduce({ type: 'MANUAL_ENTRY_DONE' }, entering);
      expect(next.isManualEntry).toBe(false);
    });
  });

  describe('mapping flow', () => {
    it('OPEN_FACTOR_MANAGER opens mapping in re-edit mode', () => {
      const next = reduce({ type: 'OPEN_FACTOR_MANAGER' });
      expect(next.isMapping).toBe(true);
      expect(next.isMappingReEdit).toBe(true);
    });

    it('CONFIRM_MAPPING closes mapping and clears re-edit', () => {
      const mapping: PasteFlowState = {
        ...initialPasteFlowState,
        isMapping: true,
        isMappingReEdit: true,
      };
      const next = reduce({ type: 'CONFIRM_MAPPING' }, mapping);
      expect(next.isMapping).toBe(false);
      expect(next.isMappingReEdit).toBe(false);
    });

    it('CANCEL_MAPPING closes mapping and clears re-edit', () => {
      const mapping: PasteFlowState = {
        ...initialPasteFlowState,
        isMapping: true,
        isMappingReEdit: true,
      };
      const next = reduce({ type: 'CANCEL_MAPPING' }, mapping);
      expect(next.isMapping).toBe(false);
      expect(next.isMappingReEdit).toBe(false);
    });
  });

  describe('wide format detection', () => {
    it('WIDE_FORMAT_DETECTED sets detection', () => {
      const next = reduce({ type: 'WIDE_FORMAT_DETECTED', detection: mockWideFormat });
      expect(next.wideFormatDetection).toBe(mockWideFormat);
    });

    it('DISMISS_WIDE_FORMAT clears detection', () => {
      const withWide: PasteFlowState = {
        ...initialPasteFlowState,
        wideFormatDetection: mockWideFormat,
      };
      const next = reduce({ type: 'DISMISS_WIDE_FORMAT' }, withWide);
      expect(next.wideFormatDetection).toBeNull();
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged for unknown action type', () => {
      const state = { ...initialPasteFlowState, isPasteMode: true };
      // @ts-expect-error testing unknown action
      const next = reduce({ type: 'UNKNOWN' }, state);
      expect(next).toBe(state);
    });
  });
});
