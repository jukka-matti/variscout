import React, { useState, useMemo, useRef } from 'react';
import type { DataRow, DataCellValue, SpecLimits } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import ManualEntrySetupBase from './ManualEntrySetupBase';
import StandardEntryGrid from './StandardEntryGrid';
import PerformanceEntryGrid from './PerformanceEntryGrid';

type EntryMode = 'standard' | 'performance';

export interface ManualEntryConfig {
  outcome: string;
  factors: string[];
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>;
  analysisMode?: 'standard' | 'performance';
  measureColumns?: string[];
  measureLabel?: string;
}

export interface ManualEntryBaseProps {
  onAnalyze: (data: DataRow[], config: ManualEntryConfig) => void;
  onCancel: () => void;
  enablePerformanceMode?: boolean;
  appendMode?: boolean;
  existingConfig?: ManualEntryConfig;
  existingRowCount?: number;
}

const ManualEntryBase = ({
  onAnalyze,
  onCancel,
  enablePerformanceMode = false,
  appendMode = false,
  existingConfig,
  existingRowCount = 0,
}: ManualEntryBaseProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'setup' | 'grid'>('setup');

  // Mode State - use existing config if in append mode
  const [mode, setMode] = useState<EntryMode>(
    appendMode && existingConfig?.analysisMode === 'performance' ? 'performance' : 'standard'
  );

  // Standard Mode Config State - pre-fill from existing config in append mode
  const [outcomeName, setOutcomeName] = useState(
    appendMode && existingConfig && existingConfig.analysisMode !== 'performance'
      ? existingConfig.outcome
      : 'Weight'
  );
  const [factors, setFactors] = useState<string[]>(
    appendMode && existingConfig && existingConfig.analysisMode !== 'performance'
      ? existingConfig.factors
      : ['Operator', 'Machine']
  );

  // Performance Mode Config State - pre-fill from existing config in append mode
  const [measureLabel, setMeasureLabel] = useState(
    appendMode && existingConfig?.analysisMode === 'performance'
      ? existingConfig.measureLabel || 'Head'
      : 'Head'
  );
  const [channelCount, setChannelCount] = useState(
    appendMode && existingConfig?.analysisMode === 'performance' && existingConfig.measureColumns
      ? existingConfig.measureColumns.length
      : 8
  );

  // Grid State
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  // Spec limits for visual feedback - pre-fill from existing config in append mode
  const [usl, setUsl] = useState<string>(
    appendMode && existingConfig?.specs?.usl !== undefined ? String(existingConfig.specs.usl) : ''
  );
  const [lsl, setLsl] = useState<string>(
    appendMode && existingConfig?.specs?.lsl !== undefined ? String(existingConfig.specs.lsl) : ''
  );

  // Refs for keyboard navigation
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Generate measure columns for Performance Mode
  const measureColumns = useMemo(() => {
    if (!enablePerformanceMode || mode !== 'performance') return [];
    return Array.from({ length: channelCount }, (_, i) => `${measureLabel} ${i + 1}`);
  }, [enablePerformanceMode, mode, measureLabel, channelCount]);

  // Running statistics for Standard Mode
  const runningStats = useMemo(() => {
    if (mode !== 'standard') return null;

    const values = rows.map(r => parseFloat(r[outcomeName])).filter(v => !isNaN(v));

    if (values.length === 0) return null;

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Count pass/fail against specs
    const uslNum = parseFloat(usl);
    const lslNum = parseFloat(lsl);
    let passCount = count;

    if (!isNaN(uslNum) || !isNaN(lslNum)) {
      passCount = values.filter(v => {
        if (!isNaN(uslNum) && v > uslNum) return false;
        if (!isNaN(lslNum) && v < lslNum) return false;
        return true;
      }).length;
    }

    return { count, mean, min, max, passCount };
  }, [rows, outcomeName, usl, lsl, mode]);

  // Running statistics for Performance Mode (per channel)
  const channelStats = useMemo(() => {
    if (!enablePerformanceMode || mode !== 'performance') return [];

    const uslNum = parseFloat(usl);
    const lslNum = parseFloat(lsl);

    return measureColumns.map(col => {
      const values = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      if (values.length === 0)
        return { column: col, count: 0, mean: 0, cpk: null, status: 'none' as const };

      const count = values.length;
      const mean = values.reduce((a, b) => a + b, 0) / count;

      // Calculate Cpk if specs are set and we have enough data
      let cpk: number | null = null;
      let status: 'good' | 'warning' | 'bad' | 'none' = 'none';

      if ((!isNaN(uslNum) || !isNaN(lslNum)) && count >= 2) {
        const stdDev = Math.sqrt(
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (count - 1)
        );
        if (stdDev > 0) {
          const cpkValues: number[] = [];
          if (!isNaN(uslNum)) {
            cpkValues.push((uslNum - mean) / (3 * stdDev));
          }
          if (!isNaN(lslNum)) {
            cpkValues.push((mean - lslNum) / (3 * stdDev));
          }
          if (cpkValues.length > 0) {
            cpk = Math.min(...cpkValues);
            if (cpk >= 1.33) status = 'good';
            else if (cpk >= 1.0) status = 'warning';
            else status = 'bad';
          }
        }
      }

      return { column: col, count, mean, cpk, status };
    });
  }, [enablePerformanceMode, rows, measureColumns, usl, lsl, mode]);

  // Total valid rows for Performance Mode
  const performanceRowCount = useMemo(() => {
    if (!enablePerformanceMode || mode !== 'performance') return 0;
    return rows.filter(r =>
      measureColumns.some(col => r[col] && r[col] !== '' && !isNaN(parseFloat(r[col])))
    ).length;
  }, [enablePerformanceMode, rows, measureColumns, mode]);

  // Get spec status for a value
  const getValueStatus = (val: string): 'pass' | 'fail_usl' | 'fail_lsl' | 'none' => {
    const num = parseFloat(val);
    if (isNaN(num)) return 'none';
    const uslNum = parseFloat(usl);
    const lslNum = parseFloat(lsl);
    if (!isNaN(uslNum) && num > uslNum) return 'fail_usl';
    if (!isNaN(lslNum) && num < lslNum) return 'fail_lsl';
    if (!isNaN(uslNum) || !isNaN(lslNum)) return 'pass';
    return 'none';
  };

  // Mode-dispatched row creation (ADR-047 pattern)
  const emptyRowCreators: Record<EntryMode, () => Record<string, string>> = {
    standard: () => {
      const row: Record<string, string> = { [outcomeName]: '' };
      factors.forEach(f => (row[f] = ''));
      return row;
    },
    performance: () => {
      const row: Record<string, string> = {};
      measureColumns.forEach(col => (row[col] = ''));
      return row;
    },
  };

  const firstColumnByMode: Record<EntryMode, () => string> = {
    standard: () => (factors.length > 0 ? factors[0] : outcomeName),
    performance: () => measureColumns[0],
  };

  // Grid Helpers
  const addRow = () => {
    const newRow = emptyRowCreators[mode]();
    setRows([...rows, newRow]);

    // Auto-focus first input of new row after render
    setTimeout(() => {
      const key = `${rows.length}-${firstColumnByMode[mode]()}`;
      inputRefs.current.get(key)?.focus();
    }, 0);
  };

  // Keyboard navigation: move to next cell
  const focusCell = (rowIdx: number, colIdx: number, columns: string[]) => {
    if (colIdx < columns.length) {
      const key = `${rowIdx}-${columns[colIdx]}`;
      inputRefs.current.get(key)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIdx: number,
    colIdx: number,
    columns: string[]
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx < rows.length - 1) {
        focusCell(rowIdx + 1, colIdx, columns);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        focusCell(rowIdx - 1, colIdx, columns);
      }
    } else if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      const nextColIdx = colIdx + 1;
      if (nextColIdx < columns.length) {
        focusCell(rowIdx, nextColIdx, columns);
      } else if (rowIdx < rows.length - 1) {
        focusCell(rowIdx + 1, 0, columns);
      } else {
        addRow();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const prevColIdx = colIdx - 1;
      if (prevColIdx >= 0) {
        focusCell(rowIdx, prevColIdx, columns);
      } else if (rowIdx > 0) {
        focusCell(rowIdx - 1, columns.length - 1, columns);
      }
    }
  };

  const updateRow = (idx: number, col: string, val: string) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [col]: val };
    setRows(newRows);
  };

  const deleteRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  // Mode-dispatched paste column mapping
  const pasteMappers: Record<EntryMode, (values: string[]) => Record<string, string>> = {
    standard: values => {
      const row: Record<string, string> = {};
      const cols = [...factors, outcomeName];
      cols.forEach((col, i) => {
        row[col] = values[i]?.trim() ?? '';
      });
      return row;
    },
    performance: values => {
      const row: Record<string, string> = {};
      measureColumns.forEach((col, i) => {
        row[col] = values[i]?.trim() ?? '';
      });
      return row;
    },
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const mapper = pasteMappers[mode];
      const newRows = lines.map(line => mapper(line.split(/\t/)));
      setRows([...rows, ...newRows]);
    } catch (err) {
      console.error('Failed to paste:', err);
      alert(t('error.generic'));
    }
  };

  // Shared spec parsing
  const parseSpecs = () =>
    usl || lsl
      ? { usl: usl ? parseFloat(usl) : undefined, lsl: lsl ? parseFloat(lsl) : undefined }
      : undefined;

  // Mode-dispatched analyze logic
  const analyzers: Record<EntryMode, () => void> = {
    standard: () => {
      const validRows = rows.filter(r => r[outcomeName] && r[outcomeName] !== '');

      // Detect which factor columns are numeric continuous predictors
      const numericFactors = new Set<string>();
      for (const factor of factors) {
        const values = validRows.map(r => r[factor]).filter(v => v && v.trim() !== '');
        const allNumeric = values.length > 0 && values.every(v => !isNaN(parseFloat(v)));
        if (allNumeric) {
          const uniqueCount = new Set(values).size;
          if (uniqueCount > 10) {
            numericFactors.add(factor);
          }
        }
      }

      const formattedData = validRows.map(r => {
        const row: Record<string, DataCellValue> = { ...r };
        row[outcomeName] = parseFloat(r[outcomeName]);
        for (const factor of numericFactors) {
          row[factor] = parseFloat(row[factor] as string);
        }
        return row;
      });

      onAnalyze(formattedData, { outcome: outcomeName, factors, specs: parseSpecs() });
    },
    performance: () => {
      const validRows = rows.filter(r =>
        measureColumns.some(col => r[col] && r[col] !== '' && !isNaN(parseFloat(r[col])))
      );

      const formattedData = validRows.map(r => {
        const newRow: Record<string, DataCellValue> = {};
        measureColumns.forEach(col => {
          const val = parseFloat(r[col]);
          newRow[col] = isNaN(val) ? null : val;
        });
        return newRow;
      });

      onAnalyze(formattedData, {
        outcome: measureColumns[0],
        factors: [],
        specs: parseSpecs(),
        analysisMode: 'performance' as const,
        measureColumns,
        measureLabel,
      });
    },
  };

  const handleAnalyze = () => analyzers[mode]();

  const handleContinue = () => {
    if (rows.length === 0) addRow();
    setStep('grid');
  };

  const handleModeChange = (newMode: EntryMode) => {
    setMode(newMode);
    setRows([]);
  };

  // --- RENDER STEPS ---

  if (step === 'setup') {
    return (
      <ManualEntrySetupBase
        outcomeName={outcomeName}
        factors={factors}
        usl={usl}
        lsl={lsl}
        onOutcomeChange={setOutcomeName}
        onFactorsChange={setFactors}
        onUslChange={setUsl}
        onLslChange={setLsl}
        onCancel={onCancel}
        onContinue={handleContinue}
        enablePerformanceMode={enablePerformanceMode}
        analysisMode={mode}
        measureLabel={measureLabel}
        channelCount={channelCount}
        onModeChange={handleModeChange}
        onMeasureLabelChange={setMeasureLabel}
        onChannelCountChange={setChannelCount}
      />
    );
  }

  if (mode === 'standard') {
    return (
      <StandardEntryGrid
        rows={rows}
        factors={factors}
        outcomeName={outcomeName}
        usl={usl}
        lsl={lsl}
        appendMode={appendMode}
        existingRowCount={existingRowCount}
        runningStats={runningStats}
        inputRefs={inputRefs}
        getValueStatus={getValueStatus}
        onAddRow={addRow}
        onDeleteRow={deleteRow}
        onUpdateRow={updateRow}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onAnalyze={handleAnalyze}
        onCancel={onCancel}
        onBackToSetup={() => setStep('setup')}
      />
    );
  }

  return (
    <PerformanceEntryGrid
      rows={rows}
      measureColumns={measureColumns}
      channelCount={channelCount}
      measureLabel={measureLabel}
      usl={usl}
      lsl={lsl}
      appendMode={appendMode}
      existingRowCount={existingRowCount}
      channelStats={channelStats}
      performanceRowCount={performanceRowCount}
      inputRefs={inputRefs}
      getValueStatus={getValueStatus}
      onAddRow={addRow}
      onDeleteRow={deleteRow}
      onUpdateRow={updateRow}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onAnalyze={handleAnalyze}
      onCancel={onCancel}
      onBackToSetup={() => setStep('setup')}
    />
  );
};

export default ManualEntryBase;
