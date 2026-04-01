import React from 'react';
import { usePanelsStore } from '../../features/panels/panelsStore';

type WorkspaceView = 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';

interface WorkspaceTabsProps {
  activeView: WorkspaceView;
  /** Number of open investigation questions (shown as badge on Investigation tab) */
  openQuestionCount?: number;
  /** Number of selected improvement ideas (shown as badge on Improvement tab) */
  selectedIdeaCount?: number;
}

const tabClass = (isActive: boolean) =>
  `px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
      : 'text-content-secondary hover:text-content'
  }`;

/**
 * Workspace tab navigation for the Azure app (ADR-055).
 *
 * Renders: Overview | Analysis | Investigation | Improvement | Report
 * Overview is the project dashboard landing page.
 * The four workspace tabs switch the center content area.
 */
const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  activeView,
  openQuestionCount,
  selectedIdeaCount,
}) => {
  return (
    <div className="flex border-b border-edge flex-shrink-0" data-testid="view-toggle">
      <button
        className={tabClass(activeView === 'dashboard')}
        onClick={() => usePanelsStore.getState().showDashboard()}
        data-testid="view-toggle-overview"
      >
        Overview
      </button>
      <button
        className={tabClass(activeView === 'analysis')}
        onClick={() => usePanelsStore.getState().showAnalysis()}
        data-testid="view-toggle-analysis"
      >
        Analysis
      </button>
      <button
        className={tabClass(activeView === 'investigation')}
        onClick={() => usePanelsStore.getState().showInvestigation()}
        data-testid="view-toggle-investigation"
      >
        Investigation
        {openQuestionCount != null && openQuestionCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {openQuestionCount}
          </span>
        )}
      </button>
      <button
        className={tabClass(activeView === 'improvement')}
        onClick={() => usePanelsStore.getState().showImprovement()}
        data-testid="view-toggle-improvement"
      >
        Improvement
        {selectedIdeaCount != null && selectedIdeaCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {selectedIdeaCount}
          </span>
        )}
      </button>
      <button
        className={tabClass(activeView === 'report')}
        onClick={() => usePanelsStore.getState().showReport()}
        data-testid="view-toggle-report"
      >
        Report
      </button>
    </div>
  );
};

export default WorkspaceTabs;
