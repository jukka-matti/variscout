import React from 'react';

/**
 * ScopeCoverageBar — the eda-mental-model §3.3 bar, reinterpreted for IM-5
 * (ADR-088 #4). It shows TWO honest figures for the active drilled scope, NEITHER
 * a multiplied-η² chain:
 *
 *  - The BAR is driven by descriptive **coverage %** (prevalence of the scope's
 *    condition, 0–100), banded blue(<30) / amber(30–50) / green(>50). This is a
 *    count fact, not a variance share.
 *  - The TEXT alongside surfaces the **What-If projected Cpk** ("if fixed: Cpk
 *    0.7 → 1.2"), a simulation result from `computeCumulativeProjection`.
 *
 * Stays within ONE homogeneous outcome (ADR-073) — the caller passes a single
 * scope's coverage + projection; this component never aggregates across scopes.
 */

export interface ScopeCoverageBarProps {
  /** Descriptive prevalence % (0–100) of the scope condition. Null/undefined → nothing renders. */
  coverage: number | null | undefined;
  /** Current overall Cpk (before the fix), for the "X → Y" text. */
  currentCpk?: number;
  /** What-If projected overall Cpk if the scope condition were fixed. */
  whatIfCpk?: number;
}

/** Band the coverage % per eda §3.3: <30 blue, 30–50 amber, >50 green. */
function coverageBand(coverage: number): {
  fill: string;
  label: string;
} {
  if (coverage > 50) {
    return { fill: 'bg-green-500', label: 'text-green-700 dark:text-green-400' };
  }
  if (coverage >= 30) {
    return { fill: 'bg-amber-500', label: 'text-amber-700 dark:text-amber-400' };
  }
  return { fill: 'bg-blue-500', label: 'text-blue-700 dark:text-blue-400' };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

const ScopeCoverageBar: React.FC<ScopeCoverageBarProps> = ({ coverage, currentCpk, whatIfCpk }) => {
  if (coverage === null || coverage === undefined || Number.isNaN(coverage)) {
    return null;
  }

  const pct = clampPercent(coverage);
  const band = coverageBand(coverage);

  // What-If text: "if fixed: Cpk 0.7 → 1.2" (or just the projected value when the
  // current Cpk is unknown). Omitted entirely when no projection is available.
  // Guard each value with Number.isFinite before formatting (ADR-069).
  let whatIfText: string | null = null;
  if (whatIfCpk !== undefined && Number.isFinite(whatIfCpk)) {
    const projectedStr = whatIfCpk.toFixed(1);
    whatIfText =
      currentCpk !== undefined && Number.isFinite(currentCpk)
        ? `if fixed: Cpk ${currentCpk.toFixed(1)} → ${projectedStr}`
        : `if fixed: Cpk → ${projectedStr}`;
  }

  return (
    <div className="flex items-center gap-2" data-testid="scope-coverage-bar">
      {/* Coverage % bar */}
      <div className="flex items-center gap-1.5">
        <div
          className="relative h-1.5 w-20 overflow-hidden rounded-full bg-surface-tertiary"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Scope coverage"
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] ${band.fill}`}
            style={{ width: `${pct}%` }}
            data-testid="scope-coverage-fill"
          />
        </div>
        <span className={`font-mono text-[0.625rem] ${band.label}`}>{Math.round(coverage)}%</span>
      </div>

      {/* What-If projected Cpk text */}
      {whatIfText && (
        <span
          className="font-mono text-[0.625rem] text-content-secondary"
          data-testid="scope-whatif-text"
        >
          {whatIfText}
        </span>
      )}
    </div>
  );
};

export { ScopeCoverageBar };
export default ScopeCoverageBar;
