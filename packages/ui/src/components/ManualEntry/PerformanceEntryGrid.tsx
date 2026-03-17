import React from 'react';
import { Play, Plus, Trash2, RotateCcw, Clipboard } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

interface ChannelStat {
  column: string;
  count: number;
  mean: number;
  cpk: number | null;
  status: 'good' | 'warning' | 'bad' | 'none';
}

export interface PerformanceEntryGridProps {
  rows: Record<string, string>[];
  measureColumns: string[];
  channelCount: number;
  measureLabel: string;
  usl: string;
  lsl: string;
  appendMode: boolean;
  existingRowCount: number;
  channelStats: ChannelStat[];
  performanceRowCount: number;
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

const PerformanceEntryGrid: React.FC<PerformanceEntryGridProps> = ({
  rows,
  measureColumns,
  channelCount,
  usl,
  lsl,
  appendMode,
  existingRowCount,
  channelStats,
  performanceRowCount,
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
  const { formatStat } = useTranslation();
  return (
    <div className="flex flex-col h-screen bg-surface text-content">
      {/* Header */}
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
                {appendMode ? 'Add More Data' : 'Manual Entry'} - Performance Mode
              </h2>
              <div className="text-xs text-content-secondary">
                {channelCount} channels
                {(lsl || usl) && (
                  <span className="ml-2 text-content-muted">
                    Specs: [{lsl || '\u2212\u221E'} to {usl || '+\u221E'}]
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
              disabled={performanceRowCount === 0}
              className="bg-green-600 hover:bg-green-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white font-bold rounded-lg px-6 py-3 flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              <Play size={18} fill="currentColor" aria-hidden="true" />{' '}
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
                        n={stat.count}, {'\u03BC'}={formatStat(stat.mean)}
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
                          Cpk={formatStat(stat.cpk)}
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
                            id={`perf-entry-${col}-${idx}`}
                            name={col}
                            ref={el => {
                              if (el) inputRefs.current.set(`${idx}-${col}`, el);
                            }}
                            className="w-full bg-transparent px-4 py-4 min-h-[56px] text-white text-base font-mono outline-none focus:bg-blue-900/20 transition-colors text-center"
                            value={row[col] || ''}
                            onChange={e => onUpdateRow(idx, col, e.target.value)}
                            type="number"
                            placeholder="0.00"
                            onKeyDown={e => onKeyDown(e, idx, colIdx, measureColumns)}
                            aria-label={`${col} value for row ${idx + 1}`}
                          />
                        </td>
                      );
                    })}
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
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={onAddRow}
            className="w-full p-4 min-h-[56px] text-center text-content-secondary hover:text-white hover:bg-surface-tertiary/50 transition-colors border-t border-edge text-base font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} aria-hidden="true" /> Add Row
          </button>
        </div>

        <div className="max-w-5xl mx-auto mt-4 text-center text-content-muted text-sm">
          <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs">
            Tab
          </kbd>{' '}
          /{' '}
          <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs">
            Enter
          </kbd>{' '}
          to move between cells.{' '}
          <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs">
            ↑
          </kbd>{' '}
          <kbd className="bg-surface-secondary px-2 py-1 rounded border border-edge-secondary font-mono text-xs">
            ↓
          </kbd>{' '}
          between rows. New rows are added automatically at the end.
        </div>
      </div>
    </div>
  );
};

export default PerformanceEntryGrid;
