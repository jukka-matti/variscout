import { useAnalysisScopeStore } from '@variscout/stores';
import type { DataRow, OutcomeSpec } from '@variscout/core';

export interface OutcomeSummaryPillProps {
  readonly rawData?: readonly DataRow[];
  readonly outcomeSpecs?: readonly OutcomeSpec[];
  readonly onOutcomeSpecApply?: (updated: OutcomeSpec) => void;
}

export function OutcomeSummaryPill(_props: OutcomeSummaryPillProps) {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);

  if (!yColumn) return null;

  return (
    <span
      data-testid="outcome-summary-pill"
      className="inline-flex items-center gap-2 rounded-full bg-surface-secondary border border-edge px-3 py-1 text-sm text-content-secondary"
    >
      Active outcome: <span className="text-content font-medium">{yColumn}</span>
      <span aria-hidden="true">·</span>
      Cpk —
    </span>
  );
}
