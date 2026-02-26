import React from 'react';
import { Play, Plus, Trash2, RotateCcw, Clipboard } from 'lucide-react';

interface RunningStats {
  count: number;
  mean: number;
  min: number;
  max: number;
  passCount: number;
}

export interface StandardEntryGridProps {
  rows: Record<string, string>[];
  factors: string[];
  outcomeName: string;
  usl: string;
  lsl: string;
  appendMode: boolean;
  existingRowCount: number;
  runningStats: RunningStats | null;
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  getValueStatus: (val: string) => 'pass' | 'fail_usl' | 'fail_lsl' | 'none';
  onAddRow: () => void;
  onDeleteRow: (idx: number) => void;
  onUpdateRow: (idx: number, col: string, val: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowIdx: number, colIdx: number, columns: string[]) => void;
  onPaste: () => void;
  onAnalyze: () => void;
  onCancel: () => void;
  onBackToSetup: () => void;
}

const StandardEntryGrid: React.FC<StandardEntryGridProps> = ({
  rows,
  factors,
  outcomeName,
  usl,
  lsl,
  appendMode,
  existingRowCount,
  runningStats,
  inputRefs,
  getValueStatus,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
  onKeyDown,
  onPaste,
  onAnalyze,
  onCancel,
  onBackToSetup,
}) => {
  const columns = [...factors, outcomeName];

  return (
    <div className="flex flex-col h-screen bg-surface text-content">
      {/* Header with running stats */}
      <div className="flex-none p-4 border-b border-edge bg-surface-secondary/50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToSetup}
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
                    [{lsl || '\u2212\u221E'} to {usl || '+\u221E'}]
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
              onClick={onPaste}
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
              onClick={onAnalyze}
              disabled={!runningStats}
              className="bg-green-600 hover:bg-green-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white font-bold rounded-lg px-6 py-3 flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              <Play size={18} fill="currentColor" aria-hidden="true" />{' '}
              {appendMode ? 'Merge & Analyze' : 'Analyze'}
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
                          id={`entry-${f}-${idx}`}
                          name={f}
                          ref={el => {
                            if (el) inputRefs.current.set(`${idx}-${f}`, el);
                          }}
                          className="w-full bg-transparent px-4 py-4 min-h-[56px] text-white text-base outline-none focus:bg-surface-tertiary/50 transition-colors"
                          value={row[f] || ''}
                          onChange={e => onUpdateRow(idx, f, e.target.value)}
                          onKeyDown={e => onKeyDown(e, idx, colIdx, columns)}
                          placeholder="..."
                          aria-label={`${f} value for row ${idx + 1}`}
                        />
                      </td>
                    ))}
                    <td className={`p-0 ${statusColors[valueStatus]}`}>
                      <input
                        id={`entry-${outcomeName}-${idx}`}
                        name={outcomeName}
                        ref={el => {
                          if (el) inputRefs.current.set(`${idx}-${outcomeName}`, el);
                        }}
                        className="w-full bg-transparent px-4 py-4 min-h-[56px] text-white text-base font-mono outline-none focus:bg-blue-900/20 transition-colors text-right"
                        value={row[outcomeName] || ''}
                        onChange={e => onUpdateRow(idx, outcomeName, e.target.value)}
                        type="number"
                        placeholder="0.00"
                        onKeyDown={e => onKeyDown(e, idx, factors.length, columns)}
                        aria-label={`${outcomeName} value for row ${idx + 1}`}
                      />
                    </td>
                    <td className="p-0 text-center min-h-[56px]">
                      <button
                        onClick={() => onDeleteRow(idx)}
                        aria-label={`Delete row ${idx + 1}`}
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
            onClick={onAddRow}
            className="w-full p-4 min-h-[56px] text-center text-content-secondary hover:text-white hover:bg-surface-tertiary/50 transition-colors border-t border-edge text-base font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} aria-hidden="true" /> Add Row
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

export default StandardEntryGrid;
