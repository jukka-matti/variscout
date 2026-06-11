import React, { useState, useRef } from 'react';
import {
  Activity,
  Settings,
  MoreVertical,
  Share2,
  ClipboardList,
  Beaker,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import {
  WorkspaceProjectChip,
  PersistentScopeChip,
  WorkflowNav,
  type WorkflowTabId,
} from '@variscout/ui';
import {
  useAnalyzeStore,
  useProjectStore,
  useAnalysisScopeStore,
  useViewStore,
} from '@variscout/stores';
import MobileMenu from './MobileMenu';
import SharePopover from '../SharePopover';

const share2Icon = <Share2 size={18} />;
const settingsIcon = <Settings size={18} />;

interface HeaderIconButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon,
  title,
  onClick,
  isActive,
  buttonRef,
}) => (
  <button
    ref={buttonRef}
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? 'text-blue-400 bg-blue-400/10'
        : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
    }`}
    title={title}
    aria-label={title}
    aria-pressed={isActive}
    style={{ minWidth: 44, minHeight: 44 }}
  >
    {icon}
  </button>
);

/**
 * PhaseId — UI-layer enum for the 7-tab workflow nav.
 *
 * Per wedge V1 vocabulary rename (2026-05-27), the canonical order is:
 *   Home · Project · Process · Explore · Analyze · Improve · Report
 *
 * NOTE: PhaseId values map to `panelsStore.activeView` via
 * `App.tsx#handlePhaseChange` (e.g. 'explore' → panels.showExplore()).
 */
export type PhaseId = WorkflowTabId;

interface AppHeaderProps {
  hasData: boolean;
  dataFilename: string | null;
  rowCount: number;
  isFindingsPanelOpen?: boolean;
  onNewAnalysis: () => void;
  onToggleFindingsPanel?: () => void;
  onOpenDataTable: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenSpecEditor?: () => void;
  onOpenWhatIf?: () => void;
  isWhatIfOpen?: boolean;
  isPISidebarOpen?: boolean;
  onTogglePISidebar?: () => void;
  /** Hide findings toggle when in Investigation workspace (workspace IS findings) */
  hideFindings?: boolean;
  /** Phase tabs rendered inside the app bar between filename and toolbar */
  activePhase?: PhaseId;
  onPhaseChange?: (phase: PhaseId) => void;
  workspaceProjectTitle?: string | null;
  onOpenWorkspaceProject?: () => void;
}

/**
 * Minimal icon-based header for maximum chart space
 *
 * Design principles:
 * - Icons only for efficiency
 * - Logo clickable → new analysis (home screen)
 * - Data panel toggle persists
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  hasData,
  dataFilename,
  rowCount,
  isFindingsPanelOpen = false,
  onNewAnalysis,
  onToggleFindingsPanel,
  onOpenDataTable,
  onExportCSV,
  onExportImage,
  onOpenSettings,
  onReset,
  onOpenSpecEditor,
  onOpenWhatIf,
  isWhatIfOpen = false,
  isPISidebarOpen = false,
  onTogglePISidebar,
  hideFindings = false,
  activePhase,
  onPhaseChange,
  workspaceProjectTitle,
  onOpenWorkspaceProject,
}) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  // PO-6 §4.4: useAnalyzeStore.findings is the single findings source
  const findingsCount = useAnalyzeStore(s => s.findings.length);

  const showPhaseTabs = hasData && activePhase !== undefined && onPhaseChange !== undefined;

  return (
    <header className="border-b border-edge bg-surface/50 backdrop-blur-md z-10 flex items-center gap-x-2 px-4 sm:px-6 h-12">
      {/* Logo and dataset name - clickable to start new analysis */}
      <button
        onClick={onNewAnalysis}
        className="flex items-center gap-2 sm:gap-3 group hover:opacity-90 transition-opacity py-2"
        title={t('nav.newAnalysis')}
        aria-label={t('nav.newAnalysis')}
      >
        <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
          <Activity className="text-white" size={18} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-content-secondary bg-clip-text text-transparent">
            VariScout
          </h1>
          {hasData && dataFilename && (
            <span className="text-[0.625rem] sm:text-xs text-content-muted truncate max-w-[150px] sm:max-w-none flex items-center gap-1.5">
              {dataFilename}
              {rowCount > 0 && (
                <span className="text-content-muted">({rowCount.toLocaleString()} rows)</span>
              )}
            </span>
          )}
        </div>
      </button>

      {/* Phase tabs — inline between filename and toolbar */}
      {showPhaseTabs && (
        <WorkflowNav
          activeTab={activePhase}
          onTabChange={onPhaseChange}
          variant="pwa"
          className="flex items-center gap-0.5 py-1"
        />
      )}

      <div className="flex-1" />

      {hasData && workspaceProjectTitle && onOpenWorkspaceProject ? (
        <WorkspaceProjectChip title={workspaceProjectTitle} onTitleClick={onOpenWorkspaceProject} />
      ) : null}

      {/* PR-CS-3a: always-visible live analysis-scope chip (self-hides when no scope). */}
      {hasData && (
        <PersistentScopeChip
          onOpen={onPhaseChange ? () => onPhaseChange('explore') : undefined}
          // ER-4: the chip's × is the coherent clear (filters + the filter-stack
          // breadcrumbs + scope store + transient highlight) — fixes the
          // pre-existing scope-store-only clear.
          onClear={() => {
            useProjectStore.getState().setFilters({});
            useProjectStore.getState().setFilterStack([]);
            useAnalysisScopeStore.getState().clearScope();
            useViewStore.getState().setTransientHighlight(null);
          }}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1">
        {hasData ? (
          <>
            {/* Desktop: Icon toolbar */}
            <nav aria-label="Analysis tools">
              <div className="hidden sm:flex items-center gap-1">
                {/* Stats Sidebar Toggle */}
                {onTogglePISidebar && (
                  <button
                    onClick={onTogglePISidebar}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      isPISidebarOpen
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
                    }`}
                    title={
                      isPISidebarOpen ? 'Hide Process Intelligence' : 'Show Process Intelligence'
                    }
                    aria-label={
                      isPISidebarOpen ? 'Hide Process Intelligence' : 'Show Process Intelligence'
                    }
                    aria-pressed={isPISidebarOpen}
                  >
                    <BarChart3 size={16} />
                  </button>
                )}

                {/* Findings Toggle (hidden when in Investigation workspace) */}
                {onToggleFindingsPanel && !hideFindings && (
                  <button
                    onClick={onToggleFindingsPanel}
                    className={`relative p-2 rounded-lg text-xs font-medium transition-colors ${
                      isFindingsPanelOpen
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
                    }`}
                    title={isFindingsPanelOpen ? t('nav.hideFindings') : t('panel.findings')}
                    aria-label={isFindingsPanelOpen ? t('nav.hideFindings') : t('panel.findings')}
                    aria-pressed={isFindingsPanelOpen}
                  >
                    <ClipboardList size={16} />
                    {findingsCount > 0 && (
                      <span
                        data-testid="findings-count-badge"
                        className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        {findingsCount > 99 ? '99+' : findingsCount}
                      </span>
                    )}
                  </button>
                )}

                {/* What-If Simulator */}
                {onOpenWhatIf && (
                  <button
                    onClick={onOpenWhatIf}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      isWhatIfOpen
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
                    }`}
                    title={t('panel.whatIf')}
                    aria-label={t('panel.whatIf')}
                  >
                    <Beaker size={16} />
                  </button>
                )}

                {/* Fullscreen / Presentation Mode */}
                {/* Export */}
                <HeaderIconButton
                  icon={share2Icon}
                  title={t('nav.export')}
                  onClick={() => setIsShareOpen(true)}
                  buttonRef={shareButtonRef}
                />

                {/* Settings */}
                <HeaderIconButton
                  icon={settingsIcon}
                  title={t('nav.settings')}
                  onClick={onOpenSettings}
                />
              </div>
            </nav>

            {/* Mobile: Menu button */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-content-secondary hover:text-white hover:bg-surface-secondary rounded-lg transition-colors touch-feedback"
                title={t('nav.menu')}
                aria-label={t('nav.menu')}
                aria-expanded={isMobileMenuOpen}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Share Popover */}
            <SharePopover
              isOpen={isShareOpen}
              onClose={() => setIsShareOpen(false)}
              onExportCSV={onExportCSV}
              onExportImage={onExportImage}
              anchorRef={shareButtonRef}
            />

            {/* Mobile Menu */}
            <MobileMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              onExportCSV={onExportCSV}
              onExportImage={onExportImage}
              onOpenSettings={onOpenSettings}
              onReset={onReset}
              onOpenDataTable={onOpenDataTable}
              onOpenSpecEditor={onOpenSpecEditor}
            />
          </>
        ) : null}
      </div>
    </header>
  );
};

export default AppHeader;
