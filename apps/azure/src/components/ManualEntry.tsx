import React, { useState, useMemo, useRef } from 'react';
import { Play, Plus, Trash2, RotateCcw, Clipboard } from 'lucide-react';
import ManualEntrySetup from './ManualEntrySetup';

type EntryMode = 'standard' | 'performance';

interface ManualEntryConfig {
  outcome: string;
  factors: string[];
  specs?: { usl?: number; lsl?: number };
  isPerformanceMode?: boolean;
  measureColumns?: string[];
  measureLabel?: string;
}

interface ManualEntryProps {
  onAnalyze: (data: any[], config: ManualEntryConfig) => void;
  onCancel: () => void;
  appendMode?: boolean;
  existingConfig?: ManualEntryConfig;
  existingRowCount?: number;
}

const ManualEntry = ({
  onAnalyze,
  onCancel,
  appendMode = false,
  existingConfig,
  existingRowCount = 0,
}: ManualEntryProps) => {
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
    if (mode !== 'performance') return [];
    return Array.from({ length: channelCount }, (_, i) => `${measureLabel} ${i + 1}`);
  }, [mode, measureLabel, channelCount]);

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
    if (mode !== 'performance') return [];

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
          // Calculate Cpk inline
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
  }, [rows, measureColumns, usl, lsl, mode]);

  // Total valid rows for Performance Mode
  const performanceRowCount = useMemo(() => {
    if (mode !== 'performance') return 0;
    return rows.filter(r =>
      measureColumns.some(col => r[col] && r[col] !== '' && !isNaN(parseFloat(r[col])))
    ).length;
  }, [rows, measureColumns, mode]);

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
        // Move to next column in same row
        focusCell(rowIdx, nextColIdx, columns);
      } else if (rowIdx < rows.length - 1) {
        // Move to first column of next row
        focusCell(rowIdx + 1, 0, columns);
      } else {
        // Last cell of last row - add new row
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
        const values = line.split(/\t/); // Assume tab-separated like Excel
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
      // Filter empty rows
      const validRows = rows.filter(r => r[outcomeName] && r[outcomeName] !== '');

      // Convert outcome to number
      const formattedData = validRows.map(r => ({
        ...r,
        [outcomeName]: parseFloat(r[outcomeName]),
      }));

      const specs =
        usl || lsl
          ? {
              usl: usl ? parseFloat(usl) : undefined,
              lsl: lsl ? parseFloat(lsl) : undefined,
            }
          : undefined;

      onAnalyze(formattedData, { outcome: outcomeName, factors, specs });
    } else {
      // Performance Mode
      // Filter rows that have at least one valid measurement
      const validRows = rows.filter(r =>
        measureColumns.some(col => r[col] && r[col] !== '' && !isNaN(parseFloat(r[col])))
      );

      // Convert all measure columns to numbers
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
        outcome: measureColumns[0], // First channel as default outcome
        factors: [],
        specs,
        isPerformanceMode: true,
        measureColumns,
        measureLabel,
      });
    }
  };

  // Handle transition from setup to grid
  const handleContinue = () => {
    if (rows.length === 0) addRow();
    setStep('grid');
  };

  // Handle mode change from setup
  const handleModeChange = (newMode: EntryMode) => {
    setMode(newMode);
    // Clear rows when mode changes
    setRows([]);
  };

  // --- RENDER STEPS ---

  if (step === 'setup') {
    return (
      <ManualEntrySetup
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
        isPerformanceMode={mode === 'performance'}
        measureLabel={measureLabel}
        channelCount={channelCount}
        onModeChange={handleModeChange}
        onMeasureLabelChange={setMeasureLabel}
        onChannelCountChange={setChannelCount}
      />
    );
  }

  // GRID STEP - Standard Mode
  if (mode === 'standard') {
    const columns = [...factors, outcomeName];

    return (
      <div className="flex flex-col h-screen bg-surface text-content">
        {/* Header with running stats */}
        <div className="flex-none p-4 border-b border-edge bg-surface-secondary/50">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep('setup')}
                className="bg-surface-secondary p-3 rounded-lg hover:bg-surface-tertiary border border-edge-secondary"
              >
                <RotateCcw size={18} className="text-content-secondary" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {appendMode ? 'Add More Data' : 'Manual Entry'}
                </h2>
                <div className="text-xs text-content-secondary">
                  Targeting: <span className="text-blue-400">{outcomeName}</span>
                  {(lsl || usl) && (
                    <span className="ml-2 text-content-muted">
                      [{lsl || '−∞'} to {usl || '+∞'}]
                    </span>
                  )}
                  {appendMode && existingRowCount > 0 && (
                    <span className="ml-2 text-amber-400">
                      (merging with {existingRowCount} existing rows)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePaste}
                className="px-4 py-3 rounded-lg border border-edge-secondary text-content text-sm hover:bg-surface-tertiary flex items-center gap-2"
              >
                <Clipboard size={18} /> Paste
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-3 rounded-lg text-content-secondary hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!runningStats}
                className="bg-green-600 hover:bg-green-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white font-bold rounded-lg px-6 py-3 flex items-center gap-2 shadow-lg shadow-green-900/20"
              >
                <Play size={18} fill="currentColor" /> {appendMode ? 'Merge & Analyze' : 'Analyze'}
              </button>
            </div>
          </div>

          {/* Running Statistics Bar */}
          {runningStats && (
            <div className="flex gap-6 bg-surface/50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-content-muted">Count:</span>
                <span className="font-mono font-bold text-white">{runningStats.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-content-muted">Mean:</span>
                <span className="font-mono font-bold text-blue-400">
                  {runningStats.mean.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-content-muted">Range:</span>
                <span className="font-mono text-content">
                  {runningStats.min.toFixed(1)} – {runningStats.max.toFixed(1)}
                </span>
              </div>
              {(lsl || usl) && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-content-muted">Pass:</span>
                  <span
                    className={`font-mono font-bold ${runningStats.passCount === runningStats.count ? 'text-green-400' : 'text-amber-400'}`}
                  >
                    {runningStats.passCount}/{runningStats.count}
                  </span>
                  <span className="text-content-muted">
                    ({Math.round((runningStats.passCount / runningStats.count) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-surface-secondary rounded-xl border border-edge overflow-hidden shadow-xl max-w-5xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 border-b border-edge">
                  <th className="p-3 w-12 text-center text-content-muted font-normal">#</th>
                  {factors.map((f, i) => (
                    <th
                      key={i}
                      className="p-3 text-content-secondary font-semibold border-r border-edge/50"
                    >
                      {f} (X)
                    </th>
                  ))}
                  <th className="p-3 text-blue-400 font-bold bg-blue-900/10 border-l border-edge">
                    {outcomeName} (Y)
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const valueStatus = getValueStatus(row[outcomeName] || '');
                  const statusColors = {
                    pass: 'bg-green-900/20 border-l-2 border-l-green-500',
                    fail_usl: 'bg-red-900/20 border-l-2 border-l-red-500',
                    fail_lsl: 'bg-amber-900/20 border-l-2 border-l-amber-500',
                    none: 'bg-blue-900/5 border-l border-edge',
                  };

                  return (
                    <tr
                      key={idx}
                      className="border-b border-edge/50 hover:bg-surface-tertiary/30 group"
                    >
                      <td className="p-3 text-center text-content-muted font-mono text-sm min-h-[56px]">
                        {idx + 1}
                      </td>
                      {factors.map((f, colIdx) => (
                        <td key={colIdx} className="p-0 border-r border-edge/50">
                          <input
                            ref={el => {
                              if (el) inputRefs.current.set(`${idx}-${f}`, el);
                            }}
                            className="w-full bg-transparent px-4 py-4 min-h-[56px] text-white text-base outline-none focus:bg-surface-tertiary/50 transition-colors"
                            value={row[f] || ''}
                            onChange={e => updateRow(idx, f, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, idx, colIdx, columns)}
                            placeholder="..."
                          />
                        </td>
                      ))}
                      <td className={`p-0 ${statusColors[valueStatus]}`}>
                        <input
                          ref={el => {
                            if (el) inputRefs.current.set(`${idx}-${outcomeName}`, el);
                          }}
                          className="w-full bg-transparent px-4 py-4 min-h-[56px] text-white text-base font-mono outline-none focus:bg-blue-900/20 transition-colors text-right"
                          value={row[outcomeName] || ''}
                          onChange={e => updateRow(idx, outcomeName, e.target.value)}
                          type="number"
                          placeholder="0.00"
                          onKeyDown={e => handleKeyDown(e, idx, factors.length, columns)}
                        />
                      </td>
                      <td className="p-0 text-center min-h-[56px]">
                        <button
                          onClick={() => deleteRow(idx)}
                          className="p-3 text-content-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              onClick={addRow}
              className="w-full p-4 min-h-[56px] text-center text-content-secondary hover:text-white hover:bg-surface-tertiary/50 transition-colors border-t border-edge text-base font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Add Row
            </button>
          </div>

          <div className="max-w-5xl mx-auto mt-4 text-center text-content-muted text-sm">
            <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs">
              Enter
            </kbd>{' '}
            or
            <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs ml-1">
              Tab
            </kbd>{' '}
            to move between cells. New rows are added automatically at the end.
          </div>
        </div>
      </div>
    );
  }

  // GRID STEP - Performance Mode
  return (
    <div className="flex flex-col h-screen bg-surface text-content">
      {/* Header */}
      <div className="flex-none p-4 border-b border-edge bg-surface-secondary/50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('setup')}
              className="bg-surface-secondary p-3 rounded-lg hover:bg-surface-tertiary border border-edge-secondary"
            >
              <RotateCcw size={18} className="text-content-secondary" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">
                {appendMode ? 'Add More Data' : 'Manual Entry'} - Performance Mode
              </h2>
              <div className="text-xs text-content-secondary">
                {channelCount} channels
                {(lsl || usl) && (
                  <span className="ml-2 text-content-muted">
                    Specs: [{lsl || '−∞'} to {usl || '+∞'}]
                  </span>
                )}
                {appendMode && existingRowCount > 0 && (
                  <span className="ml-2 text-amber-400">
                    (merging with {existingRowCount} existing rows)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePaste}
              className="px-4 py-3 rounded-lg border border-edge-secondary text-content text-sm hover:bg-surface-tertiary flex items-center gap-2"
            >
              <Clipboard size={18} /> Paste
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-3 rounded-lg text-content-secondary hover:text-white text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={performanceRowCount === 0}
              className="bg-green-600 hover:bg-green-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white font-bold rounded-lg px-6 py-3 flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              <Play size={18} fill="currentColor" />{' '}
              {appendMode
                ? `Merge & Analyze (${performanceRowCount} new)`
                : `Analyze (${performanceRowCount} rows)`}
            </button>
          </div>
        </div>

        {/* Running Stats - Per Channel */}
        {channelStats.length > 0 && channelStats.some(s => s.count > 0) && (
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-xs text-content-muted mb-2 font-semibold">Running Stats:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {channelStats.slice(0, 12).map(stat => (
                <div
                  key={stat.column}
                  className={`p-2 rounded text-xs ${
                    stat.status === 'good'
                      ? 'bg-green-900/20 border border-green-500/30'
                      : stat.status === 'warning'
                        ? 'bg-amber-900/20 border border-amber-500/30'
                        : stat.status === 'bad'
                          ? 'bg-red-900/20 border border-red-500/30'
                          : 'bg-surface-tertiary/50 border border-edge/30'
                  }`}
                >
                  <div className="font-semibold text-content-secondary truncate">{stat.column}</div>
                  {stat.count > 0 ? (
                    <>
                      <div className="text-content-muted">
                        n={stat.count}, μ={stat.mean.toFixed(2)}
                      </div>
                      {stat.cpk !== null && (
                        <div
                          className={`font-mono font-bold ${
                            stat.status === 'good'
                              ? 'text-green-400'
                              : stat.status === 'warning'
                                ? 'text-amber-400'
                                : stat.status === 'bad'
                                  ? 'text-red-400'
                                  : 'text-content'
                          }`}
                        >
                          Cpk={stat.cpk.toFixed(2)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-content-muted">No data</div>
                  )}
                </div>
              ))}
              {channelStats.length > 12 && (
                <div className="p-2 rounded bg-surface-tertiary/50 text-xs text-content-muted flex items-center justify-center">
                  +{channelStats.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-surface-secondary rounded-xl border border-edge overflow-hidden shadow-xl max-w-full mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-surface/50 border-b border-edge">
                  <th className="p-3 w-12 text-center text-content-muted font-normal sticky left-0 bg-surface/50">
                    #
                  </th>
                  {measureColumns.map((col, i) => (
                    <th
                      key={i}
                      className="p-3 text-blue-400 font-semibold border-r border-edge/50 min-w-[100px] text-center"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-edge/50 hover:bg-surface-tertiary/30 group"
                  >
                    <td className="p-3 text-center text-content-muted font-mono text-sm min-h-[56px] sticky left-0 bg-surface-secondary">
                      {idx + 1}
                    </td>
                    {measureColumns.map((col, colIdx) => {
                      const valueStatus = getValueStatus(row[col] || '');
                      const statusColors = {
                        pass: 'bg-green-900/10',
                        fail_usl: 'bg-red-900/20',
                        fail_lsl: 'bg-amber-900/20',
                        none: '',
                      };

                      return (
                        <td
                          key={colIdx}
                          className={`p-0 border-r border-edge/50 ${statusColors[valueStatus]}`}
                        >
                          <input
                            ref={el => {
                              if (el) inputRefs.current.set(`${idx}-${col}`, el);
                            }}
                            className="w-full bg-transparent px-4 py-4 min-h-[56px] text-white text-base font-mono outline-none focus:bg-blue-900/20 transition-colors text-center"
                            value={row[col] || ''}
                            onChange={e => updateRow(idx, col, e.target.value)}
                            type="number"
                            placeholder="0.00"
                            onKeyDown={e => handleKeyDown(e, idx, colIdx, measureColumns)}
                          />
                        </td>
                      );
                    })}
                    <td className="p-0 text-center min-h-[56px]">
                      <button
                        onClick={() => deleteRow(idx)}
                        className="p-3 text-content-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addRow}
            className="w-full p-4 min-h-[56px] text-center text-content-secondary hover:text-white hover:bg-surface-tertiary/50 transition-colors border-t border-edge text-base font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Row
          </button>
        </div>

        <div className="max-w-5xl mx-auto mt-4 text-center text-content-muted text-sm">
          <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs">
            Enter
          </kbd>{' '}
          or
          <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs ml-1">
            Tab
          </kbd>{' '}
          to move between cells. New rows are added automatically at the end.
        </div>
      </div>
    </div>
  );
};

export default ManualEntry;
