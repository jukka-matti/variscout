import React from 'react';

export interface StepDefectIndicatorProps {
  /** Total defect count for this step. */
  defectCount: number;
  /** Optional cost total. */
  costTotal?: number;
  /** Optional duration total. */
  durationTotal?: number;
  /** Optional click handler (e.g., to filter Pareto by step). */
  onClick?: () => void;
  /** Optional human-readable step name for the title attr. */
  stepLabel?: string;
}

const buildTitle = (
  defectCount: number,
  stepLabel: string | undefined,
  costTotal: number | undefined,
  durationTotal: number | undefined
): string => {
  const parts: string[] = [`${defectCount} defects` + (stepLabel ? ` at ${stepLabel}` : '')];
  if (costTotal !== undefined) parts.push(`cost: ${costTotal.toLocaleString()}`);
  if (durationTotal !== undefined) parts.push(`duration: ${durationTotal.toLocaleString()}`);
  return parts.join(' · ');
};

const baseClasses =
  'inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700';

/**
 * StepDefectIndicator — a count badge showing per-step defect totals.
 *
 * Renders as a `<button>` when `onClick` is provided (interactive step drill-down),
 * or as a `<span>` when used in display-only contexts.
 *
 * Designed for future mounting on ProcessMapBase step-card nodes once per-node
 * chip integration is implemented (see docs/investigations.md P2.5 deferral entry).
 */
export const StepDefectIndicator: React.FC<StepDefectIndicatorProps> = ({
  defectCount,
  costTotal,
  durationTotal,
  onClick,
  stepLabel,
}) => {
  const title = buildTitle(defectCount, stepLabel, costTotal, durationTotal);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} cursor-pointer hover:bg-red-500/20`}
        title={title}
        data-testid="step-defect-indicator"
      >
        <span aria-hidden="true">●</span>
        <span>{defectCount}</span>
      </button>
    );
  }

  return (
    <span className={baseClasses} title={title} data-testid="step-defect-indicator">
      <span aria-hidden="true">●</span>
      <span>{defectCount}</span>
    </span>
  );
};
