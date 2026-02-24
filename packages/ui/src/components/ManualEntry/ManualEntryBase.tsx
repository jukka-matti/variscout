import React, { useState, useMemo, useRef } from 'react';
import type { DataRow } from '@variscout/core';
import ManualEntrySetupBase from './ManualEntrySetupBase';
import StandardEntryGrid from './StandardEntryGrid';
import PerformanceEntryGrid from './PerformanceEntryGrid';

type EntryMode = 'standard' | 'performance';

export interface ManualEntryConfig {
  outcome: string;
  factors: string[];
  specs?: { usl?: number; lsl?: number };
  isPerformanceMode?: boolean;
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
  const [step, setStep] = useState<'setup' | 'grid'>('setup');

  // Mode State - use existing config if in append mode
  const [mode, setMode] = useState<EntryMode>(
    appendMode && existingConfig?.isPerformanceMode ? 'performance' : 'standard'
  );

  // Standard Mode Config State - pre-fill from existing config in append mode
  const [outcomeName, setOutcomeName] = useState(
    appendMode && existingConfig && !existingConfig.isPerformanceMode
      ? existingConfig.outcome
      : 'Weight'
  );
  const [factors, setFactors] = useState<string[]>(
    appendMode && existingConfig && !existingConfig.isPerformanceMode
      ? existingConfig.factors
      : ['Operator', 'Machine']
  );

  // Performance Mode Config State - pre-fill from existing config in append mode
  const [measureLabel, setMeasureLabel] = useState(
    appendMode && existingConfig?.isPerformanceMode ? existingConfig.measureLabel || 'Head' : 'Head'
  );
  const [channelCount, setChannelCount] = useState(
    appendMode && existingConfig?.isPerformanceMode && existingConfig.measureColumns
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

  // Grid Helpers
  const addRow = () => {
    const newRow: Record<string, string> = {};
    if (mode === 'standard') {
      newRow[outcomeName] = '';
      factors.forEach(f => (newRow[f] = ''));
    } else {
      measureColumns.forEach(col => (newRow[col] = ''));
    }
    setRows([...rows, newRow]);

    // Auto-focus first input of new row after render
    setTimeout(() => {
      const firstCol =
        mode === 'standard' ? (factors.length > 0 ? factors[0] : outcomeName) : measureColumns[0];
      const key = `${rows.length}-${firstCol}`;
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
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const newRows = lines.map(line => {
        const values = line.split(/\t/);
        const row: Record<string, string> = {};

        if (mode === 'standard') {
          const cols = [...factors, outcomeName];
          cols.forEach((col, i) => {
            if (values[i]) row[col] = values[i].trim();
            else row[col] = '';
          });
        } else {
          measureColumns.forEach((col, i) => {
            if (values[i]) row[col] = values[i].trim();
            else row[col] = '';
          });
        }
        return row;
      });
      setRows([...rows, ...newRows]);
    } catch (err) {
      console.error('Failed to paste:', err);
      alert('Could not paste from clipboard. Please allow permissions.');
    }
  };

  const handleAnalyze = () => {
    if (mode === 'standard') {
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
        const row: Record<string, any> = { ...r };
        row[outcomeName] = parseFloat(r[outcomeName]);
        for (const factor of numericFactors) {
          row[factor] = parseFloat(row[factor]);
        }
        return row;
      });

      const specs =
        usl || lsl
          ? {
              usl: usl ? parseFloat(usl) : undefined,
              lsl: lsl ? parseFloat(lsl) : undefined,
            }
          : undefined;

      onAnalyze(formattedData, { outcome: outcomeName, factors, specs });
    } else {
      const validRows = rows.filter(r =>
        measureColumns.some(col => r[col] && r[col] !== '' && !isNaN(parseFloat(r[col])))
      );

      const formattedData = validRows.map(r => {
        const newRow: Record<string, any> = {};
        measureColumns.forEach(col => {
          const val = parseFloat(r[col]);
          newRow[col] = isNaN(val) ? null : val;
        });
        return newRow;
      });

      const specs =
        usl || lsl
          ? {
              usl: usl ? parseFloat(usl) : undefined,
              lsl: lsl ? parseFloat(lsl) : undefined,
            }
          : undefined;

      onAnalyze(formattedData, {
        outcome: measureColumns[0],
        factors: [],
        specs,
        isPerformanceMode: true,
        measureColumns,
        measureLabel,
      });
    }
  };

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
        isPerformanceMode={mode === 'performance'}
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
