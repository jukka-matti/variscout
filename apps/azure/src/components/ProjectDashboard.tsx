import React, { useCallback, useEffect, useRef } from 'react';
import { Play, Plus, Upload, FileText, ListChecks } from 'lucide-react';

import { useProjectStore, useInvestigationStore, usePreferencesStore } from '@variscout/stores';
import { useJourneyPhase } from '@variscout/hooks';
import { useAIStore } from '../features/ai/aiStore';
import type { CloudProject } from '../services/storage';

import ProjectStatusCard from './ProjectStatusCard';
import DashboardSummaryCard from './DashboardSummaryCard';
import WhatsNewSection from './WhatsNewSection';
import OtherProjectsList from './OtherProjectsList';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProjectDashboardProps {
  projectName: string;
  lastEdited?: string;
  onNavigate: (target: string, targetId?: string) => void;
  onAddData: () => void;
  onResumeAnalysis: () => void;
  /** Epoch ms — when the current user last viewed this project */
  lastViewedAt?: number;
  /** All projects in the portfolio (for "Other projects" section) */
  projects?: CloudProject[];
  /** Navigate back to portfolio view */
  onViewPortfolio?: () => void;
  /** Called once on mount to update the lastViewedAt timestamp */
  onUpdateLastViewed?: () => void;
  /** Mode B entry point — start framing a new investigation hub */
  onNewHub?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projectName,
  lastEdited,
  onNavigate,
  onAddData,
  onResumeAnalysis,
  lastViewedAt,
  projects,
  onViewPortfolio,
  onUpdateLastViewed,
  onNewHub,
}) => {
  // Store selectors (replaces useDataStateCtx)
  const rawData = useProjectStore(s => s.rawData);
  const filterStack = useProjectStore(s => s.filterStack);
  const viewState = useProjectStore(s => s.viewState);
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const aiEnabled = usePreferencesStore(s => s.aiEnabled);

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

  const handleNavigateToQuestion = useCallback(
    (id: string) => {
      onNavigate('question', id);
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

  // Update lastViewedAt on mount (once)
  const lastViewedUpdatedRef = useRef(false);
  useEffect(() => {
    if (!lastViewedUpdatedRef.current) {
      lastViewedUpdatedRef.current = true;
      onUpdateLastViewed?.();
    }
  }, [onUpdateLastViewed]);

  // Determine which quick actions to show
  const hasFindings = findings.length > 0;
  const hasActions = findings.some(f => f.actions && f.actions.length > 0);

  return (
    <div
      className="flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto"
      data-testid="project-dashboard"
    >
      {/* What's New — top on mobile for maximum visibility */}
      {lastViewedAt != null && lastViewedAt > 0 && (
        <div className="lg:hidden">
          <WhatsNewSection findings={findings} questions={questions} lastViewedAt={lastViewedAt} />
        </div>
      )}

      {/* Left column: Project Status */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* What's New — above status card on desktop */}
        {lastViewedAt != null && lastViewedAt > 0 && (
          <div className="hidden lg:block">
            <WhatsNewSection
              findings={findings}
              questions={questions}
              lastViewedAt={lastViewedAt}
            />
          </div>
        )}

        <ProjectStatusCard
          projectName={projectName}
          lastEdited={lastEdited}
          journeyPhase={journeyPhase}
          findings={findings}
          questions={questions}
          filterStack={filterStack}
          viewState={viewState}
          onNavigateToFindings={handleNavigateToFindings}
          onNavigateToQuestion={handleNavigateToQuestion}
          onNavigateToActions={handleNavigateToActions}
          onResumeAnalysis={onResumeAnalysis}
        />
      </div>

      {/* Right column: AI Summary + Quick Actions + Other Projects */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* AI Summary Card */}
        {/* TODO: Extend dashboard AI summary with "what's new" context (deferred from ADR-043).
         * Create packages/core/src/ai/prompts/whatsNew.ts to inject recent changes into CoScout's summary.
         */}
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
            {onNewHub && (
              <button
                onClick={onNewHub}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-edge bg-surface-primary text-content text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="action-new-hub"
              >
                <Plus size={14} />
                New Hub
              </button>
            )}
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

        {/* Other Projects */}
        {projects && projects.length > 1 && (
          <OtherProjectsList
            projects={projects}
            currentProjectId={projectName}
            onViewPortfolio={onViewPortfolio}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
