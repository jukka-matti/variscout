import React, { useMemo, useState } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { projectCauses, type CauseProjectionInputs, type CauseRow } from './causeProjection';
import ApproachCauseCard from './ApproachCauseCard';

interface ApproachOverviewProps {
  ip: ImprovementProject;
  causeInputs: CauseProjectionInputs;
  onOpenWorkbench: (cause: CauseRow) => void;
  onOpenWall: () => void;
  onOpenAnalyze: () => void;
  onOpenProcess: () => void;
  surveyHint?: string;
}

const ApproachOverview: React.FC<ApproachOverviewProps> = ({
  ip,
  causeInputs,
  onOpenWorkbench,
  onOpenWall,
  onOpenAnalyze,
  onOpenProcess,
  surveyHint,
}) => {
  const allCauses = useMemo(() => projectCauses(ip, causeInputs), [ip, causeInputs]);
  const [showRuledOut, setShowRuledOut] = useState(false);
  const visible = allCauses.filter(c => showRuledOut || c.causeStatus !== 'ruled-out');
  const ruledOutCount = allCauses.filter(c => c.causeStatus === 'ruled-out').length;

  const resolvedCount = allCauses.filter(c => c.causeStatus === 'resolved').length;
  const totalActiveCauses = allCauses.filter(c => c.causeStatus !== 'ruled-out').length;

  return (
    <div className="space-y-5">
      <div className="rounded-r-md border-l-4 border-[var(--vs-accent)] bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
          Approach in progress · {resolvedCount} of {totalActiveCauses} causes addressed
        </div>
        {surveyHint ? <div className="mt-1 text-sm text-content">{surveyHint}</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-edge p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Goal · Y
          </div>
          <div className="mt-1 font-mono text-sm text-content">
            {/* Legacy first-outcome read — multi-outcome KPI is a later phase (PR-CCJ-C1). */}
            {ip.goal.outcomeGoals[0]?.baseline ?? '—'} → {ip.goal.outcomeGoals[0]?.target ?? '—'}
          </div>
        </div>
        <div className="rounded-md border border-edge p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Survey
          </div>
          <div className="mt-1 text-xs text-content">{surveyHint ?? 'No active hints'}</div>
        </div>
        <div className="rounded-md border border-edge p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Next milestone
          </div>
          <div className="mt-1 text-xs text-content">
            {/* Legacy first-outcome read — multi-outcome UI is later phases (Spec 2 §3.2.2 / PR-CCJ-C1). */}
            {ip.goal.outcomeGoals[0]?.deadline ?? '—'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map(cause => (
          <ApproachCauseCard key={cause.factor} cause={cause} onOpenWorkbench={onOpenWorkbench} />
        ))}
        {ruledOutCount > 0 && !showRuledOut && (
          <button
            type="button"
            onClick={() => setShowRuledOut(true)}
            className="w-full rounded-md border border-edge px-3 py-2 text-xs text-content-secondary hover:bg-slate-50"
            data-testid="show-ruled-out"
          >
            Show ruled out · {ruledOutCount}
          </button>
        )}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenWall}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
            data-testid="approach-continue-wall"
          >
            Wall · {ip.sections.investigationLineage.hypothesisIds?.length ?? 0} hypotheses
          </button>
          <button
            type="button"
            onClick={onOpenAnalyze}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
            data-testid="approach-continue-analyze"
          >
            Analyze · Flow Focus
          </button>
          <button
            type="button"
            onClick={onOpenProcess}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
            data-testid="approach-continue-process"
          >
            Process · L2 Flow View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproachOverview;
