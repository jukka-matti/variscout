import React from 'react';

export type WorkflowTabId =
  | 'home'
  | 'project'
  | 'process'
  | 'explore'
  | 'analyze'
  | 'improvement'
  | 'report';

export interface WorkflowTab {
  id: WorkflowTabId;
  label: string;
}

export const workflowTabs: readonly WorkflowTab[] = [
  { id: 'home', label: 'Home' },
  { id: 'project', label: 'Project' },
  { id: 'process', label: 'Process' },
  { id: 'explore', label: 'Explore' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'improvement', label: 'Improve' },
  { id: 'report', label: 'Report' },
];

export interface WorkflowNavProps {
  activeTab: WorkflowTabId;
  onTabChange: (tab: WorkflowTabId) => void;
  badges?: Partial<Record<WorkflowTabId, number>>;
  variant?: 'azure' | 'pwa';
  className?: string;
  testId?: string;
  tabTestIdPrefix?: string;
}

const badgeClass =
  'ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';

const tabClass = (variant: 'azure' | 'pwa', isActive: boolean): string => {
  if (variant === 'pwa') {
    return `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
        : 'text-content-secondary hover:text-content hover:bg-surface-secondary border border-transparent'
    }`;
  }

  return `px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
    isActive
      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
      : 'text-content-secondary hover:text-content'
  }`;
};

export const WorkflowNav: React.FC<WorkflowNavProps> = ({
  activeTab,
  onTabChange,
  badges,
  variant = 'azure',
  className,
  testId = 'workflow-nav',
  tabTestIdPrefix = 'workflow-tab',
}) => (
  <nav
    aria-label="Workspace phases"
    data-testid={testId}
    className={className ?? 'flex items-center flex-1 min-w-0 overflow-x-auto'}
  >
    <div role="tablist" aria-label="Workspace phases" className="flex items-center gap-0.5">
      {workflowTabs.map(tab => {
        const badge = badges?.[tab.id];
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={tabClass(variant, activeTab === tab.id)}
            onClick={() => onTabChange(tab.id)}
            data-testid={`${tabTestIdPrefix}-${tab.id}`}
          >
            {tab.label}
            {badge != null && badge > 0 ? <span className={badgeClass}>{badge}</span> : null}
          </button>
        );
      })}
    </div>
  </nav>
);
