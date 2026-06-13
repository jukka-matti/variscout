/**
 * ER-5b: Azure useEditorDataFlow defect-dispatch fork tests.
 *
 * Mirrors the PWA usePasteImportFlow.landing.test.ts defect auto-apply coverage.
 * These tests exercise the high-confidence → onHighConfidenceDefect auto-apply
 * path and the medium-confidence → modal-confirm (defectDetection set) path.
 *
 * Azure divergence from PWA landing.test.ts: the Azure hook distinguishes
 * high vs medium confidence (same `handleDefectDetectedFromIngestion` logic);
 * the Azure OLD landing test only checked "ANY isDefectFormat → defectDetection set"
 * because the old code did not have the high|medium fork. This file covers the
 * ER-5b fork explicitly and fails loudly when fixture confidence changes.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ONLY the persistence singleton — detection stays REAL.
vi.mock('../../../persistence', () => ({
  azureHubRepository: {
    dispatch: vi.fn().mockResolvedValue(undefined),
    evidenceSnapshots: {
      listByHub: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { renderHook, act } from '@testing-library/react';
import { parseText, detectColumns, detectDefectFormat } from '@variscout/core';
import { azureHubRepository } from '../../../persistence';
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

// ─── Fixtures ────────────────────────────────────────────────────────────────

// High-confidence defect event-log fixture: pure categorical, no numeric outcome.
// Mirrors the fixture in PWA usePasteImportFlow.landing.test.ts / Azure landing.test.ts.
const highConfidenceDefectRows = [
  { Date: '2024-01-01', Defect_Type: 'Scratch', Line: 'A' },
  { Date: '2024-01-01', Defect_Type: 'Dent', Line: 'B' },
  { Date: '2024-01-02', Defect_Type: 'Scratch', Line: 'A' },
  { Date: '2024-01-02', Defect_Type: 'Crack', Line: 'B' },
];

// Medium-confidence defect fixture: pass-fail column with a numeric outcome also
// present — ambiguous enough to require confirmation.
// Criteria: isDefectFormat = true, confidence = 'medium'.
// We derive this fixture from detection to keep the assertion self-consistent;
// the test verifies the precondition before using it.
const mediumConfidenceDefectRows = Array.from({ length: 20 }, (_, i) => ({
  Batch: `B${i + 1}`,
  Measure: 40 + (i % 10),
  Result: i % 3 === 0 ? 'Fail' : 'Pass',
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tsvOf(rows: Record<string, unknown>[]): string {
  const cols = Object.keys(rows[0]);
  const header = cols.join('\t');
  const body = rows.map(r => cols.map(c => String(r[c])).join('\t')).join('\n');
  return `${header}\n${body}`;
}

function makeOptions(overrides: Partial<UseEditorDataFlowOptions> = {}): UseEditorDataFlowOptions {
  return {
    rawData: [],
    outcome: null,
    factors: [],
    specs: {},
    columnAliases: {},
    dataFilename: null,
    analysisMode: 'standard',
    measureColumns: null,
    measureLabel: null,
    setRawData: vi.fn(),
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setSpecs: vi.fn(),
    setDataFilename: vi.fn(),
    setDataQualityReport: vi.fn(),
    setColumnAliases: vi.fn(),
    setAnalysisMode: vi.fn(),
    setMeasureColumns: vi.fn(),
    setMeasureLabel: vi.fn(),
    loadProject: vi.fn().mockResolvedValue(undefined),
    handleFileUpload: vi.fn().mockResolvedValue(true),
    processFile: vi.fn().mockResolvedValue(true),
    loadSample: vi.fn(),
    applyTimeExtraction: vi.fn(),
    onFreshPasteLanded: vi.fn(),
    onFreshPasteAnalyzed: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(azureHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(azureHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useEditorDataFlow — ER-5b defect dispatch fork', () => {
  it('high-confidence defect: fires onHighConfidenceDefect and leaves defectDetection null (no modal)', async () => {
    // Fixture guard: assert the detection shape the test is built around.
    // Fails loudly if the fixture or detection logic changes.
    const parsed = await parseText(tsvOf(highConfidenceDefectRows));
    const colAnalysis = detectColumns(parsed).columnAnalysis;
    const defect = detectDefectFormat(parsed, colAnalysis);
    expect(defect.isDefectFormat).toBe(true);
    // Fixture guard: if confidence ever stops being 'high', the auto-apply
    // branch below silently exercises the wrong path — fail early instead.
    expect(defect.confidence).toBe('high');

    const onHighConfidenceDefect = vi.fn();
    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();

    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({ onHighConfidenceDefect, onFreshPasteLanded, onFreshPasteAnalyzed })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(highConfidenceDefectRows));
    });

    // ER-5b auto-apply: callback fires with the detection, modal stays closed.
    expect(onHighConfidenceDefect).toHaveBeenCalledTimes(1);
    expect(result.current.defectDetection).toBeNull();
    // The fresh-paste provision callback still fires (wizard path → FSJ-3b §3).
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
  });

  it('medium-confidence defect: sets defectDetection (opens modal), does NOT fire onHighConfidenceDefect', async () => {
    // Fixture guard: confirm medium confidence precondition.
    const parsed = await parseText(tsvOf(mediumConfidenceDefectRows));
    const colAnalysis = detectColumns(parsed).columnAnalysis;
    const defect = detectDefectFormat(parsed, colAnalysis);
    // Skip this test if the fixture isn't actually a medium-confidence defect —
    // surface the mismatch clearly rather than silently passing on the wrong path.
    if (!defect.isDefectFormat || defect.confidence !== 'medium') {
      // Use a conditional expect that surfaces the real values in the failure message.
      expect({ isDefectFormat: defect.isDefectFormat, confidence: defect.confidence }).toEqual({
        isDefectFormat: true,
        confidence: 'medium',
      });
      return;
    }

    const onHighConfidenceDefect = vi.fn();
    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();

    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({ onHighConfidenceDefect, onFreshPasteLanded, onFreshPasteAnalyzed })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(mediumConfidenceDefectRows));
    });

    // Medium path: modal-confirm, NOT auto-apply.
    expect(onHighConfidenceDefect).not.toHaveBeenCalled();
    expect(result.current.defectDetection).not.toBeNull();
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
  });
});
