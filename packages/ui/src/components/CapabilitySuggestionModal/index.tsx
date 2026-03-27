/**
 * CapabilitySuggestionModal - Decision-support modal for capability view
 *
 * Shows detected spec limits (editable), live Cpk/Cp summary with traffic-light
 * status, dataset context, and Cpk target. Designed for experienced quality
 * engineers who need to verify specs and assess capability before choosing a view.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';
import type { SpecLimits, StatsResult } from '@variscout/core';

export interface CapabilitySuggestionModalProps {
  onStartCapability: (subgroupConfig: {
    method: 'column' | 'fixed-size';
    column?: string;
    size?: number;
  }) => void;
  onStartStandard: () => void;
  factorColumns: string[];
  /** Dataset filename for context */
  dataFilename: string | null;
  /** Outcome column name */
  outcome: string | null;
  /** Total row count */
  rowCount: number;
  /** Detected specification limits */
  specs: SpecLimits;
  /** Pre-computed stats (mean, sigmaWithin, cp, cpk) */
  stats: StatsResult | null;
  /** Current Cpk target */
  cpkTarget: number | undefined;
  /** Callback to update specs in DataContext */
  onSpecsChange: (specs: SpecLimits) => void;
  /** Callback to update Cpk target in DataContext */
  onCpkTargetChange: (target: number | undefined) => void;
}

/** Recalculate Cp/Cpk from stats + edited spec values (no raw data needed) */
function recalcCpk(
  mean: number,
  sigmaWithin: number,
  usl?: number,
  lsl?: number
): { cp?: number; cpk?: number } {
  if (sigmaWithin === 0) return {};

  let cp: number | undefined;
  let cpk: number | undefined;

  if (usl !== undefined && lsl !== undefined) {
    cp = (usl - lsl) / (6 * sigmaWithin);
    const cpu = (usl - mean) / (3 * sigmaWithin);
    const cpl = (mean - lsl) / (3 * sigmaWithin);
    cpk = Math.min(cpu, cpl);
  } else if (usl !== undefined) {
    cpk = (usl - mean) / (3 * sigmaWithin);
  } else if (lsl !== undefined) {
    cpk = (mean - lsl) / (3 * sigmaWithin);
  }

  return { cp, cpk };
}

/** Traffic-light color for Cpk vs target */
function getCpkColor(cpk: number | undefined, target: number): string {
  if (cpk === undefined) return 'text-content-muted';
  if (cpk >= target) return 'text-green-400';
  if (cpk >= 1.0) return 'text-amber-400';
  return 'text-red-400';
}

function getCpkDotColor(cpk: number | undefined, target: number): string {
  if (cpk === undefined) return 'bg-content-muted';
  if (cpk >= target) return 'bg-green-400';
  if (cpk >= 1.0) return 'bg-amber-400';
  return 'bg-red-400';
}

function getCpkVerdict(cpk: number | undefined, target: number): string {
  if (cpk === undefined) return 'insufficient data';
  if (cpk >= target) return `meets ${target} target`;
  if (cpk >= 1.0) return `marginal (below ${target})`;
  return `below ${target} target`;
}

export const CapabilitySuggestionModal: React.FC<CapabilitySuggestionModalProps> = ({
  onStartCapability,
  onStartStandard,
  factorColumns,
  dataFilename,
  outcome,
  rowCount,
  specs,
  stats,
  cpkTarget,
  onSpecsChange,
  onCpkTargetChange,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Local editable state (synced to DataContext on confirm)
  const [localUsl, setLocalUsl] = useState(specs.usl?.toString() ?? '');
  const [localLsl, setLocalLsl] = useState(specs.lsl?.toString() ?? '');
  const [localTarget, setLocalTarget] = useState(specs.target?.toString() ?? '');
  const [localCpkTarget, setLocalCpkTarget] = useState(cpkTarget?.toString() ?? '1.33');
  const [localCharType, setLocalCharType] = useState<'nominal' | 'smaller' | 'larger'>(
    specs.characteristicType ?? 'nominal'
  );

  // Parse local values for live recalculation
  const parsedUsl = localUsl ? parseFloat(localUsl) : undefined;
  const parsedLsl = localLsl ? parseFloat(localLsl) : undefined;
  const parsedTarget = localTarget ? parseFloat(localTarget) : undefined;
  const parsedCpkTarget = localCpkTarget ? parseFloat(localCpkTarget) : 1.33;

  // Live Cp/Cpk recalculation from stats + edited specs
  const liveCpk = useMemo(() => {
    if (!stats || !stats.sigmaWithin) return { cp: stats?.cp, cpk: stats?.cpk };
    return recalcCpk(stats.mean, stats.sigmaWithin, parsedUsl, parsedLsl);
  }, [stats, parsedUsl, parsedLsl]);

  // Show modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Handle native dialog close (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => handleDismiss();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  /** Persist spec edits to DataContext */
  const commitSpecs = () => {
    const newSpecs: SpecLimits = {
      usl: parsedUsl !== undefined && !isNaN(parsedUsl) ? parsedUsl : undefined,
      lsl: parsedLsl !== undefined && !isNaN(parsedLsl) ? parsedLsl : undefined,
      target: parsedTarget !== undefined && !isNaN(parsedTarget) ? parsedTarget : undefined,
      characteristicType: localCharType,
    };
    onSpecsChange(newSpecs);

    const cpkVal = parsedCpkTarget;
    onCpkTargetChange(!isNaN(cpkVal) && cpkVal > 0 ? cpkVal : undefined);
  };

  const handleStartCapability = () => {
    commitSpecs();
    // Auto-select subgroup: prefer time-extracted column, else first factor, else fixed n=5
    const timeExtracted = factorColumns.find(c =>
      /_(?:Hour|Year|Month|Week|DayOfWeek|\d+min)$/.test(c)
    );
    if (timeExtracted) {
      onStartCapability({ method: 'column', column: timeExtracted });
    } else if (factorColumns.length > 0) {
      onStartCapability({ method: 'column', column: factorColumns[0] });
    } else {
      onStartCapability({ method: 'fixed-size', size: 5 });
    }
  };

  const handleDismiss = () => {
    commitSpecs();
    onStartStandard();
  };

  // Dataset context string
  const contextParts = [dataFilename, outcome, `${rowCount} rows`].filter(Boolean);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm max-w-none max-h-none w-full h-full m-0 p-0 flex items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          fallbackFocus: '[role="dialog"]',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-surface-secondary border border-edge rounded-2xl shadow-2xl flex flex-col animate-fade-in"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-base font-semibold text-content">
                Specification limits detected
              </h2>
              <button
                onClick={handleDismiss}
                className="text-content-secondary hover:text-content p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors -mr-1.5 -mt-1.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Dataset context */}
            <p className="text-xs text-content-muted mb-4">{contextParts.join(' · ')}</p>

            {/* Editable spec fields */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">
                  USL
                </span>
                <input
                  type="number"
                  step="any"
                  value={localUsl}
                  onChange={e => setLocalUsl(e.target.value)}
                  placeholder="—"
                  className="w-full px-2 py-1.5 text-sm bg-surface-tertiary border border-edge rounded-lg text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">
                  Target
                </span>
                <input
                  type="number"
                  step="any"
                  value={localTarget}
                  onChange={e => setLocalTarget(e.target.value)}
                  placeholder="—"
                  className="w-full px-2 py-1.5 text-sm bg-surface-tertiary border border-edge rounded-lg text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">
                  LSL
                </span>
                <input
                  type="number"
                  step="any"
                  value={localLsl}
                  onChange={e => setLocalLsl(e.target.value)}
                  placeholder="—"
                  className="w-full px-2 py-1.5 text-sm bg-surface-tertiary border border-edge rounded-lg text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </label>
            </div>

            {/* Type + Cpk target row */}
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-1.5 text-xs">
                <span className="text-content-muted">Type:</span>
                <select
                  value={localCharType}
                  onChange={e =>
                    setLocalCharType(e.target.value as 'nominal' | 'smaller' | 'larger')
                  }
                  className="px-1.5 py-1 text-xs bg-surface-tertiary border border-edge rounded text-content focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  <option value="nominal">Nominal</option>
                  <option value="smaller">Smaller-is-better</option>
                  <option value="larger">Larger-is-better</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs ml-auto">
                <span className="text-content-muted">Cpk target:</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="3.0"
                  value={localCpkTarget}
                  onChange={e => setLocalCpkTarget(e.target.value)}
                  className="w-16 px-1.5 py-1 text-xs bg-surface-tertiary border border-edge rounded text-content text-center focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </label>
            </div>

            {/* Cpk summary with traffic light */}
            <div className="bg-surface-tertiary rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getCpkDotColor(liveCpk.cpk, parsedCpkTarget)}`}
                />
                <span
                  className={`text-sm font-semibold ${getCpkColor(liveCpk.cpk, parsedCpkTarget)}`}
                >
                  Cpk {liveCpk.cpk !== undefined ? liveCpk.cpk.toFixed(2) : '—'}
                </span>
                <span className="text-xs text-content-muted">
                  — {getCpkVerdict(liveCpk.cpk, parsedCpkTarget)}
                </span>
              </div>
              {liveCpk.cp !== undefined && (
                <div className="text-xs text-content-muted mt-1 ml-[18px]">
                  Cp {liveCpk.cp.toFixed(2)}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleStartCapability}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Start Capability View
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2 bg-surface-tertiary hover:bg-surface-elevated text-content border border-edge rounded-lg text-sm font-medium transition-colors"
              >
                Standard View
              </button>
            </div>

            <p className="text-[10px] text-content-muted text-center mt-3">
              You can switch anytime using the toggle in the I-Chart header.
            </p>
          </div>
        </div>
      </FocusTrap>
    </dialog>
  );
};
