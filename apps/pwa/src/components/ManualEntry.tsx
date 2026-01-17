import React, { useState, useMemo, useRef } from 'react';
import { Play, Plus, Trash2, RotateCcw, Clipboard } from 'lucide-react';
import ManualEntrySetup from './ManualEntrySetup';

interface ManualEntryProps {
  onAnalyze: (data: any[], config: { outcome: string; factors: string[] }) => void;
  onCancel: () => void;
}

const ManualEntry = ({ onAnalyze, onCancel }: ManualEntryProps) => {
  const [step, setStep] = useState<'setup' | 'grid'>('setup');

  // Config State
  const [outcomeName, setOutcomeName] = useState('Weight');
  const [factors, setFactors] = useState<string[]>(['Operator', 'Machine']);

  // Grid State
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  // Spec limits for visual feedback
  const [usl, setUsl] = useState<string>('');
  const [lsl, setLsl] = useState<string>('');

  // Refs for keyboard navigation
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Running statistics
  const runningStats = useMemo(() => {
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
  }, [rows, outcomeName, usl, lsl]);

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
    const newRow: Record<string, string> = { [outcomeName]: '' };
    factors.forEach(f => (newRow[f] = ''));
    setRows([...rows, newRow]);

    // Auto-focus first input of new row after render
    setTimeout(() => {
      const firstCol = factors.length > 0 ? factors[0] : outcomeName;
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

        // Try to map values to columns in order: Factors... then Outcome?
        // Or just assume order: Factor 1, Factor 2, ..., Outcome
        // Let's stick to simple mapping for now:
        // If we match column count, great.
        const cols = [...factors, outcomeName];
        cols.forEach((col, i) => {
          if (values[i]) row[col] = values[i].trim();
          else row[col] = '';
        });
        return row;
      });
      setRows([...rows, ...newRows]);
    } catch (err) {
      console.error('Failed to paste:', err);
      alert('Could not paste from clipboard. Please allow permissions.');
    }
  };

  const handleAnalyze = () => {
    // Filter empty rows
    const validRows = rows.filter(r => r[outcomeName] && r[outcomeName] !== '');

    // Convert outcome to number
    const formattedData = validRows.map(r => ({
      ...r,
      [outcomeName]: parseFloat(r[outcomeName]),
    }));

    onAnalyze(formattedData, { outcome: outcomeName, factors });
  };

  // Handle transition from setup to grid
  const handleContinue = () => {
    if (rows.length === 0) addRow();
    setStep('grid');
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
      />
    );
  }

  // GRID STEP
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
              <h2 className="text-lg font-bold text-white">Manual Entry</h2>
              <div className="text-xs text-content-secondary">
                Targeting: <span className="text-blue-400">{outcomeName}</span>
                {(lsl || usl) && (
                  <span className="ml-2 text-content-muted">
                    [{lsl || '−∞'} to {usl || '+∞'}]
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
              <Play size={18} fill="currentColor" /> Analyze
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
};

export default ManualEntry;
