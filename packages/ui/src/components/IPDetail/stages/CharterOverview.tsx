import type React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import ProjectSignalChips from '../ProjectSignalChips';
import type { ProjectOverviewSignals } from '../projectOverviewSignals';

interface CharterOverviewProps {
  ip: ImprovementProject;
  onOpenInvestigation: () => void;
  onOpenAnalyze: () => void;
  surveyHint?: string;
  onSetGoal?: () => void;
  overviewSignals?: ProjectOverviewSignals;
  /** Current local user id, retained for caller compatibility. */
  currentUserId?: string;
}

function isGoalSet(ip: ImprovementProject): boolean {
  // Legacy first-outcome check — multi-outcome KPI is a later phase (Spec 2 §3.2.2 / PR-CCJ-C1).
  const first = ip.goal.outcomeGoals[0];
  return !!first && first.target > 0 && first.outcomeSpecId !== '';
}

const CharterOverview: React.FC<CharterOverviewProps> = ({
  ip,
  onOpenInvestigation,
  onOpenAnalyze,
  surveyHint,
  onSetGoal,
  overviewSignals,
  currentUserId,
}) => {
  void currentUserId;
  const issueSnapshot = ip.sections.background.snapshotText ?? '—';
  const goalSet = isGoalSet(ip);

  return (
    <div className="space-y-5">
      {/* Stage banner */}
      <div className="rounded-r-md border-l-4 border-[var(--vs-accent)] bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
          Framing in progress
        </div>
        <div className="mt-1 text-sm text-content">
          {surveyHint ??
            'Capture the Issue, set the Goal, link the lead Hypothesis before moving to Approach.'}
        </div>
      </div>

      <ProjectSignalChips signals={overviewSignals} groups={['hypotheses', 'findings']} />

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Issue KPI */}
        <div className="rounded-md border border-edge p-3" data-testid="kpi-issue">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Issue
          </div>
          <div className="mt-1 text-xs text-content">{issueSnapshot}</div>
        </div>

        {/* Goal KPI */}
        <div
          className={`rounded-md border p-3 ${goalSet ? 'border-edge' : 'border-amber-300 bg-amber-50'}`}
          data-testid="kpi-goal"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Goal
          </div>
          {goalSet ? (
            <div className="mt-1 font-mono text-sm text-content">
              {/* Legacy first-outcome read — multi-outcome UI is later phases (Spec 2 §3.2.2 / PR-CCJ-C1). */}
              Target {ip.goal.outcomeGoals[0]?.target}
            </div>
          ) : (
            <>
              <div className="mt-1 text-xs text-amber-800">Not yet set</div>
              <button
                type="button"
                onClick={onSetGoal}
                className="mt-2 rounded-md bg-amber-400 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-500"
                data-testid="kpi-goal-set-cta"
              >
                Set goal →
              </button>
            </>
          )}
        </div>

        {/* Analyze KPI */}
        <div className="rounded-md border border-edge p-3" data-testid="kpi-analyze">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Analyze Wall
          </div>
          <div className="mt-1 text-xs text-content">Hypotheses + findings live on the Wall</div>
        </div>
      </div>

      {/* Jump-outs */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenInvestigation}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
            data-testid="charter-continue-analyze"
          >
            Analyze Wall
          </button>
          <button
            type="button"
            onClick={onOpenAnalyze}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
            data-testid="charter-continue-analyze"
          >
            Analyze · capability check
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharterOverview;
