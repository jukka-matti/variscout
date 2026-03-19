// CRITICAL: vi.mock() calls MUST be placed BEFORE the hook import
// to ensure stable mock references and prevent OOM in useEffect deps.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @variscout/core
vi.mock('@variscout/core', () => ({
  parseText: vi.fn(),
  detectColumns: vi.fn(),
  validateData: vi.fn(),
  detectWideFormat: vi.fn(),
}));

// Mock useDataMerge helpers (direct function exports)
vi.mock('../useDataMerge', () => ({
  detectMergeStrategy: vi.fn(),
  mergeRows: vi.fn(),
  mergeColumns: vi.fn(),
}));

import { parseText, detectColumns, validateData, detectWideFormat } from '@variscout/core';
import { detectMergeStrategy, mergeRows, mergeColumns } from '../useDataMerge';
import { useEditorDataFlow } from '../useEditorDataFlow';
import type { UseEditorDataFlowOptions } from '../useEditorDataFlow';

// Cast mocks for easier usage
const mockParseText = parseText as ReturnType<typeof vi.fn>;
const mockDetectColumns = detectColumns as ReturnType<typeof vi.fn>;
const mockValidateData = validateData as ReturnType<typeof vi.fn>;
const mockDetectWideFormat = detectWideFormat as ReturnType<typeof vi.fn>;
const mockDetectMergeStrategy = detectMergeStrategy as ReturnType<typeof vi.fn>;
const mockMergeRows = mergeRows as ReturnType<typeof vi.fn>;
const mockMergeColumns = mergeColumns as ReturnType<typeof vi.fn>;

function createMockOptions(
  overrides: Partial<UseEditorDataFlowOptions> = {}
): UseEditorDataFlowOptions {
  return {
    rawData: [],
    outcome: null,
    factors: [],
    specs: {},
    columnAliases: {},
    dataFilename: null,
    isPerformanceMode: false,
    measureColumns: null,
    measureLabel: null,
    setRawData: vi.fn(),
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setSpecs: vi.fn(),
    setDataFilename: vi.fn(),
    setDataQualityReport: vi.fn(),
    setColumnAliases: vi.fn(),
    setPerformanceMode: vi.fn(),
    setMeasureColumns: vi.fn(),
    setMeasureLabel: vi.fn(),
    loadProject: vi.fn(),
    handleFileUpload: vi.fn().mockResolvedValue(true),
    processFile: vi.fn().mockResolvedValue(true),
    loadSample: vi.fn(),
    applyTimeExtraction: vi.fn(),
    ...overrides,
  };
}

describe('useEditorDataFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock returns
    mockDetectColumns.mockReturnValue({
      outcome: null,
      factors: [],
      timeColumn: null,
      columnAnalysis: [],
    });
    mockValidateData.mockReturnValue({ issues: [], warnings: [] });
    mockDetectWideFormat.mockReturnValue({ isWideFormat: false, channels: [] });
  });

  describe('initial state', () => {
    it('returns idle state with no active flows', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.isManualEntry).toBe(false);
      expect(result.current.appendMode).toBe(false);
      expect(result.current.isPasteMode).toBe(false);
      expect(result.current.pasteError).toBeNull();
      expect(result.current.isMapping).toBe(false);
      expect(result.current.isMappingReEdit).toBe(false);
      expect(result.current.isParsingFile).toBe(false);
      expect(result.current.isLoadingProject).toBe(false);
      expect(result.current.drillFromPerformance).toBeNull();
      expect(result.current.appendFeedback).toBeNull();
      expect(result.current.timeExtractionPrompt).toBeNull();
    });

    it('returns undefined mappingColumnAnalysis when no data', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.mappingColumnAnalysis).toBeUndefined();
    });

    it('returns undefined existingConfig when no outcome', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.existingConfig).toBeUndefined();
    });
  });

  describe('mappingColumnAnalysis', () => {
    it('computes column analysis when rawData is provided', () => {
      const mockAnalysis = [{ name: 'Weight', type: 'numeric', sampleValues: ['10', '12'] }];
      mockDetectColumns.mockReturnValue({
        outcome: 'Weight',
        factors: [],
        timeColumn: null,
        columnAnalysis: mockAnalysis,
      });

      const options = createMockOptions({
        rawData: [{ Weight: 10 }, { Weight: 12 }],
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.mappingColumnAnalysis).toEqual(mockAnalysis);
      expect(mockDetectColumns).toHaveBeenCalledWith([{ Weight: 10 }, { Weight: 12 }]);
    });
  });

  describe('existingConfig', () => {
    it('returns config when outcome is set', () => {
      const options = createMockOptions({
        outcome: 'Weight',
        factors: ['Operator'],
        specs: { usl: 15, lsl: 5 },
        isPerformanceMode: false,
        measureColumns: null,
        measureLabel: null,
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.existingConfig).toEqual({
        outcome: 'Weight',
        factors: ['Operator'],
        specs: { usl: 15, lsl: 5 },
        isPerformanceMode: false,
        measureColumns: [],
        measureLabel: 'Channel',
      });
    });

    it('omits specs when neither USL nor LSL is set', () => {
      const options = createMockOptions({
        outcome: 'Weight',
        factors: [],
        specs: {},
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.existingConfig?.specs).toBeUndefined();
    });
  });

  describe('paste flow (handlePasteAnalyze)', () => {
    it('parses text, detects columns, and transitions to mapping', async () => {
      const parsedData = [{ Weight: 10, Operator: 'A' }];
      mockParseText.mockResolvedValue(parsedData);
      mockDetectColumns.mockReturnValue({
        outcome: 'Weight',
        factors: ['Operator'],
        timeColumn: null,
        columnAnalysis: [],
      });

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('Weight\tOperator\n10\tA');
      });

      expect(mockParseText).toHaveBeenCalledWith('Weight\tOperator\n10\tA');
      expect(options.setRawData).toHaveBeenCalledWith(parsedData);
      expect(options.setDataFilename).toHaveBeenCalledWith('Pasted Data');
      expect(options.setOutcome).toHaveBeenCalledWith('Weight');
      expect(options.setFactors).toHaveBeenCalledWith(['Operator']);
      expect(mockValidateData).toHaveBeenCalledWith(parsedData, 'Weight');
      expect(options.setDataQualityReport).toHaveBeenCalled();
      expect(result.current.isPasteMode).toBe(false);
      expect(result.current.isMapping).toBe(true);
    });

    it('sets pasteError when parsing fails', async () => {
      mockParseText.mockRejectedValue(new Error('Invalid format'));

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('bad data');
      });

      expect(result.current.pasteError).toBe('Invalid format');
      expect(result.current.isMapping).toBe(false);
    });

    it('sets generic error message for non-Error throws', async () => {
      mockParseText.mockRejectedValue('string error');

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('bad data');
      });

      expect(result.current.pasteError).toBe('Failed to parse data');
    });

    it('detects wide format and enables performance mode', async () => {
      const parsedData = [{ Ch1: 10, Ch2: 11, Ch3: 12 }];
      mockParseText.mockResolvedValue(parsedData);
      mockDetectColumns.mockReturnValue({
        outcome: null,
        factors: [],
        timeColumn: null,
        columnAnalysis: [],
      });
      mockDetectWideFormat.mockReturnValue({
        isWideFormat: true,
        channels: [{ id: 'Ch1' }, { id: 'Ch2' }, { id: 'Ch3' }],
      });

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('Ch1\tCh2\tCh3\n10\t11\t12');
      });

      expect(options.setMeasureColumns).toHaveBeenCalledWith(['Ch1', 'Ch2', 'Ch3']);
      expect(options.setMeasureLabel).toHaveBeenCalledWith('Channel');
      expect(options.setPerformanceMode).toHaveBeenCalledWith(true);
    });

    it('does not enable performance mode for fewer than 3 channels', async () => {
      mockParseText.mockResolvedValue([{ Ch1: 10, Ch2: 11 }]);
      mockDetectColumns.mockReturnValue({
        outcome: null,
        factors: [],
        timeColumn: null,
        columnAnalysis: [],
      });
      mockDetectWideFormat.mockReturnValue({
        isWideFormat: true,
        channels: [{ id: 'Ch1' }, { id: 'Ch2' }],
      });

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('Ch1\tCh2\n10\t11');
      });

      expect(options.setPerformanceMode).not.toHaveBeenCalled();
    });

    it('prompts confirm when replacing existing data', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const options = createMockOptions({
        rawData: [{ Weight: 10 }],
        outcome: 'Weight',
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('Weight\n20');
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockParseText).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('sets time extraction prompt when time column is detected', async () => {
      mockParseText.mockResolvedValue([{ Date: '2024-01-01T10:00', Weight: 10 }]);
      mockDetectColumns.mockReturnValue({
        outcome: 'Weight',
        factors: [],
        timeColumn: 'Date',
        columnAnalysis: [
          {
            name: 'Date',
            type: 'date',
            sampleValues: ['2024-01-01T10:00'],
          },
        ],
      });

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handlePasteAnalyze('Date\tWeight\n2024-01-01T10:00\t10');
      });

      expect(result.current.timeExtractionPrompt).toEqual({
        timeColumn: 'Date',
        hasTimeComponent: true,
      });
    });
  });

  describe('handlePasteCancel', () => {
    it('resets paste state', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.startAppendPaste();
      });

      act(() => {
        result.current.handlePasteCancel();
      });

      expect(result.current.isPasteMode).toBe(false);
      expect(result.current.appendMode).toBe(false);
      expect(result.current.pasteError).toBeNull();
    });
  });

  describe('handleLoadSample', () => {
    it('calls loadSample and transitions to mapping', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      const mockSample = { id: 'coffee', name: 'Coffee' } as never;
      act(() => {
        result.current.handleLoadSample(mockSample);
      });

      expect(options.loadSample).toHaveBeenCalledWith(mockSample);
      expect(result.current.isMapping).toBe(true);
    });

    it('prompts confirm when replacing existing data', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const options = createMockOptions({
        rawData: [{ Weight: 10 }],
        outcome: 'Weight',
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleLoadSample({ id: 'coffee' } as never);
      });

      expect(options.loadSample).not.toHaveBeenCalled();
      expect(result.current.isMapping).toBe(false);
      confirmSpy.mockRestore();
    });
  });

  describe('handleMappingConfirm', () => {
    it('sets outcome, factors, specs and exits mapping', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      // Enter mapping state via sample load flow
      act(() => {
        result.current.handleLoadSample({ id: 'coffee' } as never);
      });

      act(() => {
        result.current.handleMappingConfirm('Weight', ['Operator'], { usl: 15, lsl: 5 });
      });

      expect(options.setOutcome).toHaveBeenCalledWith('Weight');
      expect(options.setFactors).toHaveBeenCalledWith(['Operator']);
      expect(options.setSpecs).toHaveBeenCalledWith({ usl: 15, lsl: 5 });
      expect(result.current.isMapping).toBe(false);
    });

    it('does not call setSpecs when no specs provided', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleMappingConfirm('Weight', ['Operator']);
      });

      expect(options.setSpecs).not.toHaveBeenCalled();
    });

    it('applies time extraction when prompt is active', async () => {
      mockParseText.mockResolvedValue([{ Date: '2024-01-01', Weight: 10 }]);
      mockDetectColumns.mockReturnValue({
        outcome: 'Weight',
        factors: [],
        timeColumn: 'Date',
        columnAnalysis: [{ name: 'Date', type: 'date', sampleValues: ['2024-01-01'] }],
      });

      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      // Trigger paste to set time extraction prompt
      await act(async () => {
        await result.current.handlePasteAnalyze('Date\tWeight\n2024-01-01\t10');
      });

      // Now confirm mapping
      act(() => {
        result.current.handleMappingConfirm('Weight', []);
      });

      expect(options.applyTimeExtraction).toHaveBeenCalledWith(
        'Date',
        expect.objectContaining({ extractYear: true, extractMonth: true })
      );
      expect(result.current.timeExtractionPrompt).toBeNull();
    });

    it('clears re-edit flag on confirm', () => {
      const options = createMockOptions({ factors: ['Operator'] });
      const { result } = renderHook(() => useEditorDataFlow(options));

      // Enter re-edit mode
      act(() => {
        result.current.openFactorManager();
      });
      expect(result.current.isMappingReEdit).toBe(true);

      act(() => {
        result.current.handleMappingConfirm('Weight', ['Operator', 'Shift']);
      });

      expect(result.current.isMappingReEdit).toBe(false);
      expect(result.current.isMapping).toBe(false);
    });
  });

  describe('handleMappingCancel', () => {
    it('wipes data on first-time cancel (not re-edit)', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      // Enter fresh mapping via sample load
      act(() => {
        result.current.handleLoadSample({ id: 'coffee' } as never);
      });

      act(() => {
        result.current.handleMappingCancel();
      });

      expect(options.setRawData).toHaveBeenCalledWith([]);
      expect(options.setOutcome).toHaveBeenCalledWith(null);
      expect(options.setFactors).toHaveBeenCalledWith([]);
      expect(options.setDataFilename).toHaveBeenCalledWith(null);
      expect(options.setDataQualityReport).toHaveBeenCalledWith(null);
      expect(result.current.isMapping).toBe(false);
    });

    it('does not wipe data on re-edit cancel', () => {
      const options = createMockOptions({ factors: ['Operator'] });
      const { result } = renderHook(() => useEditorDataFlow(options));

      // Enter re-edit mode
      act(() => {
        result.current.openFactorManager();
      });

      act(() => {
        result.current.handleMappingCancel();
      });

      expect(options.setRawData).not.toHaveBeenCalled();
      expect(options.setOutcome).not.toHaveBeenCalled();
      expect(result.current.isMapping).toBe(false);
      expect(result.current.isMappingReEdit).toBe(false);
    });
  });

  describe('openFactorManager (re-edit)', () => {
    it('enters mapping in re-edit mode', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.openFactorManager();
      });

      expect(result.current.isMapping).toBe(true);
      expect(result.current.isMappingReEdit).toBe(true);
    });
  });

  describe('handleColumnRename', () => {
    it('adds alias for a column', () => {
      const options = createMockOptions({ columnAliases: {} });
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleColumnRename('Weight', 'Mass');
      });

      expect(options.setColumnAliases).toHaveBeenCalledWith({ Weight: 'Mass' });
    });

    it('removes alias when empty string provided', () => {
      const options = createMockOptions({ columnAliases: { Weight: 'Mass' } });
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleColumnRename('Weight', '');
      });

      expect(options.setColumnAliases).toHaveBeenCalledWith({});
    });
  });

  describe('performance mode drill navigation', () => {
    it('handleDrillToMeasure sets drill state and outcome', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleDrillToMeasure('Ch1');
      });

      expect(result.current.drillFromPerformance).toBe('Ch1');
      expect(options.setOutcome).toHaveBeenCalledWith('Ch1');
    });

    it('handleBackToPerformance clears drill state', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleDrillToMeasure('Ch1');
      });

      act(() => {
        result.current.handleBackToPerformance();
      });

      expect(result.current.drillFromPerformance).toBeNull();
    });
  });

  describe('handleFileChange', () => {
    it('calls handleFileUpload and transitions to mapping', async () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      const mockEvent = { target: { value: 'file.csv' } } as never;
      await act(async () => {
        await result.current.handleFileChange(mockEvent);
      });

      expect(options.handleFileUpload).toHaveBeenCalledWith(mockEvent);
      expect(result.current.isMapping).toBe(true);
      expect(result.current.isParsingFile).toBe(false);
    });

    it('aborts when user declines replace confirmation', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const options = createMockOptions({
        rawData: [{ Weight: 10 }],
        outcome: 'Weight',
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      const mockEvent = { target: { value: '' } } as never;
      await act(async () => {
        await result.current.handleFileChange(mockEvent);
      });

      expect(options.handleFileUpload).not.toHaveBeenCalled();
      expect(result.current.isMapping).toBe(false);
      confirmSpy.mockRestore();
    });
  });

  describe('handleManualEntryCancel', () => {
    it('clears manual entry and append mode', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.startAppendManual();
      });

      act(() => {
        result.current.handleManualEntryCancel();
      });

      expect(result.current.isManualEntry).toBe(false);
      expect(result.current.appendMode).toBe(false);
    });
  });

  describe('handleAddMoreData', () => {
    it('enters append + manual entry mode', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.handleAddMoreData();
      });

      expect(result.current.appendMode).toBe(true);
      expect(result.current.isManualEntry).toBe(true);
    });
  });

  describe('handleAppendPaste', () => {
    it('appends rows when merge strategy is "rows"', async () => {
      const existingData = [{ Weight: 10, Operator: 'A' }];
      const parsedData = [{ Weight: 14, Operator: 'C' }];
      const mergedData = [...existingData, ...parsedData];

      mockParseText.mockResolvedValue(parsedData);
      mockDetectMergeStrategy.mockReturnValue('rows');
      mockMergeRows.mockReturnValue(mergedData);

      const options = createMockOptions({
        rawData: existingData,
        outcome: 'Weight',
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handleAppendPaste('Weight\tOperator\n14\tC');
      });

      expect(mockMergeRows).toHaveBeenCalledWith(existingData, parsedData);
      expect(options.setRawData).toHaveBeenCalledWith(mergedData);
      expect(result.current.isPasteMode).toBe(false);
      expect(result.current.appendMode).toBe(false);
    });

    it('adds columns when merge strategy is "columns"', async () => {
      const existingData = [{ Weight: 10 }];
      const parsedData = [{ Shift: 'Morning' }];
      const mergedData = [{ Weight: 10, Shift: 'Morning' }];

      mockParseText.mockResolvedValue(parsedData);
      mockDetectMergeStrategy.mockReturnValue('columns');
      mockMergeColumns.mockReturnValue({ data: mergedData, addedColumns: ['Shift'] });

      const options = createMockOptions({
        rawData: existingData,
        outcome: 'Weight',
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handleAppendPaste('Shift\nMorning');
      });

      expect(mockMergeColumns).toHaveBeenCalledWith(existingData, parsedData);
      expect(options.setRawData).toHaveBeenCalledWith(mergedData);
      expect(result.current.isMapping).toBe(true);
      expect(result.current.isPasteMode).toBe(false);
      expect(result.current.appendMode).toBe(false);
    });

    it('sets error when append paste fails', async () => {
      mockParseText.mockRejectedValue(new Error('Parse error'));

      const options = createMockOptions({
        rawData: [{ Weight: 10 }],
        outcome: 'Weight',
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      await act(async () => {
        await result.current.handleAppendPaste('bad data');
      });

      expect(result.current.pasteError).toBe('Parse error');
    });
  });

  describe('handleAppendFile', () => {
    it('calls handleFileUpload and transitions to mapping', async () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      const mockEvent = { target: { value: 'file.csv' } } as never;
      await act(async () => {
        await result.current.handleAppendFile(mockEvent);
      });

      expect(options.handleFileUpload).toHaveBeenCalledWith(mockEvent);
      expect(result.current.appendMode).toBe(false);
      expect(result.current.isMapping).toBe(true);
      expect(result.current.isParsingFile).toBe(false);
    });

    it('does not transition to mapping when file upload fails', async () => {
      const options = createMockOptions({
        handleFileUpload: vi.fn().mockResolvedValue(false),
      });
      const { result } = renderHook(() => useEditorDataFlow(options));

      const mockEvent = { target: { value: '' } } as never;
      await act(async () => {
        await result.current.handleAppendFile(mockEvent);
      });

      expect(result.current.isMapping).toBe(false);
      expect(result.current.isParsingFile).toBe(false);
    });
  });

  describe('time extraction config', () => {
    it('has sensible defaults', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      expect(result.current.timeExtractionConfig).toEqual({
        extractYear: true,
        extractMonth: true,
        extractWeek: false,
        extractDayOfWeek: true,
        extractHour: false,
      });
    });

    it('allows updating config', () => {
      const options = createMockOptions();
      const { result } = renderHook(() => useEditorDataFlow(options));

      act(() => {
        result.current.setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      });

      expect(result.current.timeExtractionConfig.extractHour).toBe(true);
    });
  });
});
