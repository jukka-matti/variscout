import React, { useMemo } from 'react';
import { ArrowLeft, Beaker } from 'lucide-react';
import {
  calculateStats,
  type DataRow,
  type SpecLimits,
  type MultiRegressionResult,
} from '@variscout/core';
import WhatIfSimulator from '../WhatIfSimulator/WhatIfSimulator';
import type { WhatIfSimulatorColorScheme } from '../WhatIfSimulator/WhatIfSimulator';
import ModelDrivenSimulator from '../WhatIfSimulator/ModelDrivenSimulator';

/**
 * Color scheme for WhatIfPage
 */
export interface WhatIfPageColorScheme {
  /** Page background */
  pageBg: string;
  /** Page text color */
  pageText: string;
  /** Border color */
  border: string;
  /** Back button hover background */
  backHoverBg: string;
  /** Secondary text (back arrow, count) */
  secondaryText: string;
  /** Heading text */
  headingText: string;
  /** Muted text (outcome label, empty state) */
  mutedText: string;
}

export const whatIfPageDefaultColorScheme: WhatIfPageColorScheme = {
  pageBg: 'bg-surface',
  pageText: 'text-content',
  border: 'border-edge',
  backHoverBg: 'hover:bg-surface-tertiary',
  secondaryText: 'text-content-secondary',
  headingText: 'text-content',
  mutedText: 'text-content-muted',
};

export const whatIfPageAzureColorScheme: WhatIfPageColorScheme = {
  pageBg: 'bg-slate-900',
  pageText: 'text-slate-300',
  border: 'border-slate-700',
  backHoverBg: 'hover:bg-slate-800',
  secondaryText: 'text-slate-400',
  headingText: 'text-white',
  mutedText: 'text-slate-500',
};

export interface WhatIfPageBaseProps {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Raw (unfiltered) data rows */
  rawData: DataRow[];
  /** Outcome variable name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Number of active filters */
  filterCount: number;
  /** Active filter descriptions (e.g., "Machine = A", "Shift = Day") */
  filterNames?: string[];
  /** Callback to navigate back */
  onBack: () => void;
  /** Color scheme for the page */
  colorScheme?: WhatIfPageColorScheme;
  /** Color scheme to pass to WhatIfSimulator */
  simulatorColorScheme?: WhatIfSimulatorColorScheme;
  /** Optional regression model for model-driven simulation */
  regressionModel?: MultiRegressionResult;
}

const WhatIfPageBase: React.FC<WhatIfPageBaseProps> = ({
  filteredData,
  rawData,
  outcome,
  specs,
  filterCount,
  filterNames,
  onBack,
  colorScheme = whatIfPageDefaultColorScheme,
  simulatorColorScheme,
  regressionModel,
}) => {
  const c = colorScheme;

  const currentStats = useMemo(() => {
    if (!outcome || filteredData.length === 0) return null;

    const values = filteredData
      .map(row => {
        const val = row[outcome];
        return typeof val === 'number' ? val : parseFloat(String(val));
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return null;
    return calculateStats(values, specs.usl, specs.lsl);
  }, [filteredData, outcome, specs]);

  // Guard: no data or no outcome
  if (!outcome || rawData.length === 0) {
    return (
      <div className={`flex flex-col h-full ${c.pageBg} ${c.pageText}`}>
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${c.border}`}>
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg ${c.backHoverBg} transition-colors`}
          >
            <ArrowLeft size={18} className={c.secondaryText} />
          </button>
          <Beaker size={18} className="text-blue-400" />
          <h1 className={`text-sm font-semibold ${c.headingText}`}>What-If Simulator</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <p className={`text-sm ${c.mutedText} text-center`}>
            Load data and set specification limits first.
          </p>
        </div>
      </div>
    );
  }

  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  return (
    <div className={`flex flex-col h-full ${c.pageBg} ${c.pageText}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${c.border}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg ${c.backHoverBg} transition-colors`}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} className={c.secondaryText} />
          </button>
          <Beaker size={18} className="text-blue-400" />
          <h1 className={`text-sm font-semibold ${c.headingText}`}>What-If Simulator</h1>
        </div>
        <div className={`flex items-center gap-3 text-xs ${c.mutedText}`}>
          <span>{outcome}</span>
          <span className={c.secondaryText}>n = {filteredData.length}</span>
          {filterCount > 0 && (
            <span
              className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded"
              title={filterNames?.join(', ')}
            >
              {filterNames && filterNames.length > 0
                ? filterNames.join(', ')
                : `${filterCount} filter${filterCount !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {!hasSpecs && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
              Set specification limits (USL/LSL) to see Cpk and yield projections.
            </div>
          )}

          {currentStats && regressionModel && (
            <ModelDrivenSimulator
              model={regressionModel}
              filteredData={filteredData}
              currentStats={currentStats}
              specs={specs}
              colorScheme={simulatorColorScheme}
            />
          )}

          {currentStats && (
            <WhatIfSimulator
              currentStats={currentStats}
              specs={specs}
              defaultExpanded={!regressionModel}
              colorScheme={simulatorColorScheme}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfPageBase;
