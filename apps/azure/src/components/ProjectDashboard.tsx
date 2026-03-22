import React, { useCallback } from 'react';
import { Play, Upload, FileText, ListChecks } from 'lucide-react';

import { useDataStateCtx } from '../context/DataContext';
import { useJourneyPhase } from '@variscout/hooks';
import { useAIStore } from '../features/ai/aiStore';

import ProjectStatusCard from './ProjectStatusCard';
import DashboardSummaryCard from './DashboardSummaryCard';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProjectDashboardProps {
  projectName: string;
  lastEdited?: string;
  onNavigate: (target: string, targetId?: string) => void;
  onAddData: () => void;
  onResumeAnalysis: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projectName,
  lastEdited,
  onNavigate,
  onAddData,
  onResumeAnalysis,
}) => {
  // Data context
  const { findings, hypotheses, filterStack, viewState, rawData, aiEnabled } = useDataStateCtx();

  // Journey phase
  const hasData = rawData != null && rawData.length > 0;
  const journeyPhase = useJourneyPhase(hasData, findings);

  // AI narration from store
  const narration = useAIStore(s => s.narration);
  const setPendingDashboardQuestion = useAIStore(s => s.setPendingDashboardQuestion);

  // Navigation callbacks
  const handleNavigateToFindings = useCallback(
    (status?: string) => {
      onNavigate('findings', status);
    },
    [onNavigate]
  );

  const handleNavigateToHypothesis = useCallback(
    (id: string) => {
      onNavigate('hypothesis', id);
    },
    [onNavigate]
  );

  const handleNavigateToActions = useCallback(() => {
    onNavigate('actions');
  }, [onNavigate]);

  const handleAskCoScout = useCallback(
    (question: string) => {
      setPendingDashboardQuestion(question);
      onNavigate('coscout');
    },
    [setPendingDashboardQuestion, onNavigate]
  );

  // Determine which quick actions to show
  const hasFindings = findings.length > 0;
  const hasActions = findings.some(f => f.actions && f.actions.length > 0);

  return (
    <div
      className="flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto"
      data-testid="project-dashboard"
    >
      {/* Left column: Project Status */}
      <div className="flex-1 min-w-0">
        <ProjectStatusCard
          projectName={projectName}
          lastEdited={lastEdited}
          journeyPhase={journeyPhase}
          findings={findings}
          hypotheses={hypotheses}
          filterStack={filterStack}
          viewState={viewState}
          onNavigateToFindings={handleNavigateToFindings}
          onNavigateToHypothesis={handleNavigateToHypothesis}
          onNavigateToActions={handleNavigateToActions}
          onResumeAnalysis={onResumeAnalysis}
        />
      </div>

      {/* Right column: AI Summary + Quick Actions */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* AI Summary Card */}
        <DashboardSummaryCard
          summary={narration?.narrative ?? null}
          isLoading={narration?.isLoading ?? false}
          isAIAvailable={aiEnabled}
          onAskCoScout={handleAskCoScout}
        />

        {/* Quick Actions */}
        <div
          className="rounded-lg border border-edge bg-surface-secondary p-5 space-y-3"
          data-testid="quick-actions"
        >
          <h3 className="text-sm font-medium text-content-secondary">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onResumeAnalysis}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              data-testid="action-resume"
            >
              <Play size={14} />
              Continue analysis
            </button>
            <button
              onClick={onAddData}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-edge bg-surface-primary text-content text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              data-testid="action-add-data"
            >
              <Upload size={14} />
              Add data
            </button>
            {hasFindings && (
              <button
                onClick={() => onNavigate('report')}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-edge bg-surface-primary text-content text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="action-report"
              >
                <FileText size={14} />
                View report
              </button>
            )}
            {hasActions && (
              <button
                onClick={handleNavigateToActions}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-edge bg-surface-primary text-content text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="action-review-actions"
              >
                <ListChecks size={14} />
                Review actions
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
