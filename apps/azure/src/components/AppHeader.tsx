import React, { useState, useEffect } from 'react';
import { useTranslation } from '@variscout/hooks';
import {
  WorkspaceProjectChip,
  PersistentScopeChip,
  WorkflowNav,
  useIsMobile,
  BREAKPOINTS,
  type WorkflowTabId,
} from '@variscout/ui';
import {
  Activity,
  Cloud,
  CloudOff,
  Plus,
  ChevronDown,
  ClipboardPaste,
  Upload,
  PenLine,
  MessageSquare,
  BarChart3,
  Settings,
  Download,
  FolderUp,
} from 'lucide-react';
import { usePanelsStore } from '../features/panels/panelsStore';

export type WorkspaceView =
  | 'home'
  | 'frame'
  | 'explore'
  | 'analyze'
  | 'projects'
  | 'improvement'
  | 'report';

export interface AppHeaderProps {
  mode: 'portfolio' | 'project';
  onNavigateToPortfolio?: () => void;
  onOpenSettings?: () => void;
  canNavigateBack?: boolean;
  projectName?: string;
  rowCount?: number;
  // Sync & save
  syncStatus?: { status: string; message?: string };
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  hasData?: boolean;
  // Workspace
  activeView?: WorkspaceView;
  openQuestionCount?: number;
  selectedIdeaCount?: number;
  // Cross-cutting panel toggles
  isPISidebarOpen?: boolean;
  onTogglePISidebar?: () => void;
  isCoScoutOpen?: boolean;
  onToggleCoScout?: () => void;
  // Primary action: Analysis
  onAddPasteData?: () => void;
  onAddFileData?: () => void;
  onAddManualData?: () => void;
  // Primary action: Improvement
  onConvertToActions?: () => void;
  hasSelectedIdeas?: boolean;
  /** Rename the project */
  onRenameProject?: () => void;
  /** Export data as CSV */
  onExportCSV?: () => void;
  /** Save As to a different location (Team only) */
  onSaveAs?: () => void;
  workspaceProjectTitle?: string | null;
  onOpenWorkspaceProject?: () => void;
}

/** Save status dot color */
const statusDotColor = (
  saveStatus: 'idle' | 'saving' | 'saved' | 'error',
  syncStatus: { status: string }
): string => {
  if (saveStatus === 'error') return 'bg-red-400';
  if (saveStatus === 'saving') return 'bg-blue-400 animate-pulse';
  if (saveStatus === 'saved') return 'bg-green-400';
  // Idle: reflect sync status for Team plans
  if (syncStatus.status === 'synced') return 'bg-green-400';
  if (syncStatus.status === 'syncing') return 'bg-blue-400 animate-pulse';
  if (syncStatus.status === 'error') return 'bg-red-400';
  if (syncStatus.status === 'conflict') return 'bg-amber-400';
  return 'bg-content-muted';
};

const toggleBtnClass = (isActive: boolean) =>
  `p-1.5 rounded-md text-xs font-medium transition-colors ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
  }`;

export const AppHeader: React.FC<AppHeaderProps> = ({
  mode,
  onNavigateToPortfolio,
  onOpenSettings,
  canNavigateBack,
  projectName = '',
  rowCount = 0,
  syncStatus = { status: 'idle' },
  saveStatus = 'idle',
  hasData = false,
  activeView = 'explore',
  openQuestionCount,
  selectedIdeaCount,
  isPISidebarOpen,
  onTogglePISidebar,
  isCoScoutOpen,
  onToggleCoScout,
  onAddPasteData,
  onAddFileData,
  onAddManualData,
  onConvertToActions,
  hasSelectedIdeas,
  onRenameProject,
  onExportCSV,
  onSaveAs,
  workspaceProjectTitle,
  onOpenWorkspaceProject,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const { t } = useTranslation();

  // Add Data dropdown state (must be before any early returns — Rules of Hooks)
  const [addDataOpen, setAddDataOpen] = useState(false);
  const addDataRef = React.useRef<HTMLDivElement>(null);

  // Project name dropdown state (must be before any early returns — Rules of Hooks)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!addDataOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addDataRef.current && !addDataRef.current.contains(e.target as Node)) {
        setAddDataOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addDataOpen]);

  // Close project menu on outside click
  useEffect(() => {
    if (!projectMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [projectMenuOpen]);

  // ── Portfolio mode ────────────────────────────────────────────────────
  if (mode === 'portfolio') {
    return (
      <div className="flex items-center h-11 px-4 border-b border-edge bg-surface flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="text-white" size={14} />
          </div>
          <h1 className="text-lg font-bold text-content">VariScout</h1>
        </div>
        <div className="flex-1" />
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
            title={t('nav.settings')}
            aria-label={t('nav.settings')}
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    );
  }

  // Sync status icon (Team plan only, desktop)
  const SyncIcon =
    syncStatus.status === 'synced' || syncStatus.status === 'syncing' ? Cloud : CloudOff;
  const syncColor =
    syncStatus.status === 'synced'
      ? 'text-green-400'
      : syncStatus.status === 'syncing'
        ? 'text-blue-400'
        : syncStatus.status === 'error'
          ? 'text-red-400'
          : syncStatus.status === 'conflict'
            ? 'text-amber-400'
            : 'text-content-muted';

  const dotColor = statusDotColor(saveStatus, syncStatus);
  const activeWorkflowTab: WorkflowTabId =
    activeView === 'home'
      ? 'home'
      : activeView === 'projects'
        ? 'project'
        : activeView === 'frame'
          ? 'process'
          : activeView === 'improvement'
            ? 'improvement'
            : activeView;
  const handleWorkflowTabChange = (tab: WorkflowTabId) => {
    const panels = usePanelsStore.getState();
    if (tab === 'home') panels.showHome();
    else if (tab === 'project') panels.showProjects();
    else if (tab === 'process') panels.showFrame();
    else if (tab === 'explore') panels.showExplore();
    else if (tab === 'analyze') panels.showAnalyze();
    else if (tab === 'improvement') panels.showImprovement();
    else panels.showReport();
  };

  // Logo mark element (reused in phone and desktop)
  const logoMark = (
    <div
      role={canNavigateBack ? 'button' : undefined}
      tabIndex={canNavigateBack ? 0 : undefined}
      onClick={canNavigateBack ? onNavigateToPortfolio : undefined}
      onKeyDown={
        canNavigateBack
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onNavigateToPortfolio?.();
            }
          : undefined
      }
      aria-label={canNavigateBack ? t('nav.backToDashboard') : undefined}
      className={`w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 ${canNavigateBack ? 'cursor-pointer hover:bg-blue-700 transition-colors' : ''}`}
    >
      <Activity className="text-white" size={14} />
    </div>
  );

  // ── Phone layout ────────────────────────────────────────────────────────
  if (isPhone) {
    return (
      <div className="flex items-center justify-between h-11 px-2 border-b border-edge bg-surface flex-shrink-0 sticky top-0 z-50">
        {/* Left: logo mark + title + dot */}
        <div className="flex items-center gap-2 min-w-0">
          {logoMark}
          <h2 className="text-sm font-semibold text-content truncate">{projectName}</h2>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        </div>

        {/* Right: panel toggles + settings */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Sync icon on phone */}
          <div
            className={`flex-shrink-0 ${syncColor}`}
            title={syncStatus.message || syncStatus.status}
          >
            <SyncIcon
              size={16}
              className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''}
            />
          </div>
          {hasData && onTogglePISidebar && (
            <button
              onClick={onTogglePISidebar}
              className={toggleBtnClass(!!isPISidebarOpen)}
              title="Process Intelligence"
              data-testid="btn-stats-sidebar"
            >
              <BarChart3 size={16} />
            </button>
          )}
          {hasData && onToggleCoScout && (
            <button
              onClick={onToggleCoScout}
              className={toggleBtnClass(!!isCoScoutOpen)}
              title="AI assistant"
              data-testid="btn-coscout"
            >
              <MessageSquare size={16} />
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              title={t('nav.settings')}
              aria-label={t('nav.settings')}
              data-testid="btn-settings"
            >
              <Settings size={16} />
            </button>
          )}
          {hasData && workspaceProjectTitle && onOpenWorkspaceProject && (
            <WorkspaceProjectChip
              title={workspaceProjectTitle}
              onTitleClick={onOpenWorkspaceProject}
            />
          )}
          {/* PR-CS-3a: persistent live-scope chip (self-hides when no scope). */}
          {hasData && <PersistentScopeChip onOpen={() => handleWorkflowTabChange('explore')} />}
        </div>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────
  return (
    <div className="flex items-center h-11 px-3 border-b border-edge bg-surface flex-shrink-0 gap-1 sticky top-0 z-50">
      {/* ── Left zone: Logo mark + Project name + row count + status dot ── */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        {logoMark}
        {onRenameProject || onExportCSV || onSaveAs ? (
          <div ref={projectMenuRef} className="relative">
            <button
              onClick={() => setProjectMenuOpen(prev => !prev)}
              className="text-sm font-semibold text-content truncate max-w-[200px] hover:text-blue-400 transition-colors flex items-center gap-1"
              title="Project menu"
              aria-label="Project menu"
            >
              {projectName}
              <ChevronDown
                size={12}
                className={`text-content-muted transition-transform ${projectMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {projectMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 w-48 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1"
                onKeyDown={e => {
                  if (e.key === 'Escape') setProjectMenuOpen(false);
                }}
              >
                {onRenameProject && (
                  <button
                    onClick={() => {
                      setProjectMenuOpen(false);
                      onRenameProject();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <PenLine size={14} />
                    Rename...
                  </button>
                )}
                {onExportCSV && (
                  <button
                    onClick={() => {
                      setProjectMenuOpen(false);
                      onExportCSV();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                )}
                {onSaveAs && (
                  <>
                    <div className="my-1 border-t border-edge" />
                    <button
                      onClick={() => {
                        setProjectMenuOpen(false);
                        onSaveAs();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                    >
                      <FolderUp size={14} />
                      Save As...
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <h2 className="text-sm font-semibold text-content truncate max-w-[200px]">
            {projectName}
          </h2>
        )}
        {hasData && <span className="text-xs text-content-muted flex-shrink-0">({rowCount})</span>}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
          title={
            saveStatus === 'saving'
              ? t('toolbar.saving')
              : saveStatus === 'saved'
                ? t('toolbar.saved')
                : saveStatus === 'error'
                  ? t('toolbar.saveFailed')
                  : syncStatus.message || syncStatus.status
          }
        />
        {/* Sync status label */}
        {syncStatus.status === 'error' ? (
          <button
            onClick={() => {
              window.location.href = '/.auth/login/aad';
            }}
            className={`flex items-center gap-1 text-xs ${syncColor} hover:text-red-300 transition-colors`}
            title={t('error.auth')}
          >
            <SyncIcon size={14} />
            <span className="underline underline-offset-2">
              {syncStatus.message || t('error.auth')}
            </span>
          </button>
        ) : (
          <div className={`flex items-center gap-1 text-xs ${syncColor}`}>
            <SyncIcon
              size={14}
              className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''}
            />
            <span className="text-content-secondary">
              {syncStatus.message || syncStatus.status}
            </span>
          </div>
        )}
      </div>

      {/* ── Separator ── */}
      <div className="w-px h-5 bg-edge mx-1 flex-shrink-0" />

      {/* ── Center zone: Workspace tabs ── */}
      {/* Tab order per wedge V1 amendment (2026-05-16, vocabulary rename 2026-05-27): Home · Project · Process · Explore · Analyze · Improve · Report */}
      {/* Display copy + testids follow the wedge naming; internal `activeView` enum stays stable (panelsStore key). */}
      {hasData && (
        <WorkflowNav
          activeTab={activeWorkflowTab}
          onTabChange={handleWorkflowTabChange}
          badges={{
            analyze: openQuestionCount,
            improvement: selectedIdeaCount,
          }}
          variant="azure"
        />
      )}

      {/* Spacer when no data (tabs hidden) */}
      {!hasData && <div className="flex-1" />}

      {/* ── Separator ── */}
      <div className="w-px h-5 bg-edge mx-1 flex-shrink-0" />

      {hasData && workspaceProjectTitle && onOpenWorkspaceProject ? (
        <>
          <WorkspaceProjectChip
            title={workspaceProjectTitle}
            onTitleClick={onOpenWorkspaceProject}
          />
          <div className="w-px h-5 bg-edge mx-1 flex-shrink-0" />
        </>
      ) : null}

      {/* PR-CS-3a: always-visible live analysis-scope chip (self-hides when no scope). */}
      {hasData && <PersistentScopeChip onOpen={() => handleWorkflowTabChange('explore')} />}

      {/* ── Right zone: panel toggles + primary action + settings ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Stats Sidebar Toggle */}
        {hasData && onTogglePISidebar && (
          <button
            onClick={onTogglePISidebar}
            className={toggleBtnClass(!!isPISidebarOpen)}
            title={isPISidebarOpen ? 'Hide Process Intelligence' : 'Show Process Intelligence'}
            data-testid="btn-stats-sidebar"
          >
            <BarChart3 size={16} />
          </button>
        )}

        {/* CoScout AI Toggle */}
        {hasData && onToggleCoScout && (
          <button
            onClick={onToggleCoScout}
            className={toggleBtnClass(!!isCoScoutOpen)}
            title={isCoScoutOpen ? 'Hide AI assistant' : 'Ask AI assistant'}
            data-testid="btn-coscout"
          >
            <MessageSquare size={16} />
          </button>
        )}

        {/* Primary action: Analysis — Add Data dropdown */}
        {activeView === 'explore' && hasData && onAddPasteData && (
          <div
            ref={addDataRef}
            className="relative"
            onKeyDown={e => {
              if (e.key === 'Escape') setAddDataOpen(false);
            }}
          >
            <button
              onClick={() => setAddDataOpen(prev => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              title={t('toolbar.addMore')}
              data-testid="btn-add-data"
            >
              <Plus size={14} />
              <span>{t('toolbar.addMore')}</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${addDataOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {addDataOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => {
                    setAddDataOpen(false);
                    onAddPasteData();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  data-testid="add-data-paste"
                >
                  <ClipboardPaste size={14} />
                  {t('data.pasteData')}
                </button>
                {onAddFileData && (
                  <button
                    onClick={() => {
                      setAddDataOpen(false);
                      onAddFileData();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                    data-testid="add-data-file"
                  >
                    <Upload size={14} />
                    {t('data.uploadFile')}
                  </button>
                )}
                {onAddManualData && (
                  <button
                    onClick={() => {
                      setAddDataOpen(false);
                      onAddManualData();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                    data-testid="add-data-manual"
                  >
                    <PenLine size={14} />
                    {t('data.manualEntry')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Primary action: Improvement — Convert to Actions */}
        {activeView === 'improvement' && onConvertToActions && (
          <button
            onClick={onConvertToActions}
            disabled={!hasSelectedIdeas}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Convert selected ideas to actions"
          >
            Convert → Actions
          </button>
        )}

        {/* Settings gear */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
            title={t('nav.settings')}
            aria-label={t('nav.settings')}
            data-testid="btn-settings"
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export { AppHeader as default };
