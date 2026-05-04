import React from 'react';
import { Target } from 'lucide-react';
// AnalysisBrief is the canonical type from @variscout/core/findings (packages/core/src/findings/types.ts).
// It is the same type used by ColumnMapping and StageFiveModal.
import type { AnalysisBrief } from '@variscout/core/findings';

export type { AnalysisBrief };

export interface ParetoMakeScopeButtonProps {
  /** Active scope-filter factor (X-axis column being Pareto'd). */
  factor: string;
  /**
   * Currently-selected bars from the Pareto chart.
   * When empty, the button renders null (no active selection → no affordance).
   */
  selectedBars: ReadonlyArray<string | number>;
  /**
   * Callback when user clicks "Make this the investigation scope".
   * Receives a partially-populated AnalysisBrief with `issueStatement` auto-filled
   * from the selected factor + bars. The consumer (P4.2) wires this to StageFiveModal.
   */
  onCreateInvestigation: (brief: AnalysisBrief) => void;
  /** Optional className appended to the button's class list. */
  className?: string;
}

/**
 * Builds the auto-filled issue statement from the active Pareto selection.
 * Format: "Top Pareto category in {factor}: {bar1}, {bar2}, …"
 */
export const buildIssueStatement = (
  factor: string,
  bars: ReadonlyArray<string | number>
): string => {
  const barList = bars.map(String).join(', ');
  return `Top Pareto category in ${factor}: ${barList}`;
};

/**
 * Scope-to-investigation affordance for the Pareto chart (spec §9.2).
 *
 * Renders a pill button when ≥1 Pareto bar is selected (scope filter active).
 * On click, builds an AnalysisBrief with auto-filled issueStatement and passes
 * it to onCreateInvestigation. The consumer opens StageFiveModal pre-filled.
 *
 * Blue palette intentionally matches the scope-filter chip in CanvasFilterChips
 * (spec §10) to visually associate both surfaces with the same scope-filter state.
 *
 * Hidden (returns null) when selectedBars is empty.
 */
export const ParetoMakeScopeButton: React.FC<ParetoMakeScopeButtonProps> = ({
  factor,
  selectedBars,
  onCreateInvestigation,
  className,
}) => {
  if (selectedBars.length === 0) {
    return null;
  }

  const handleClick = () => {
    const brief: AnalysisBrief = {
      issueStatement: buildIssueStatement(factor, selectedBars),
    };
    onCreateInvestigation(brief);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="pareto-make-scope-button"
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-500/20 ${className ?? ''}`}
      title="Make this the investigation scope"
    >
      <Target size={12} aria-hidden="true" />
      <span>Make this the investigation scope</span>
    </button>
  );
};
