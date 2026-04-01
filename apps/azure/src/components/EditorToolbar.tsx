import React, { useState, useEffect } from 'react';
import { hasTeamFeatures, downloadCSV } from '@variscout/core';
import type { DataRow, SpecLimits } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import {
  Upload,
  ArrowLeft,
  Save,
  Cloud,
  CloudOff,
  PenLine,
  ClipboardPaste,
  Table2,
  Pencil,
  Plus,
  ClipboardList,
  Beaker,
  Download,
  ChevronDown,
  FileText,
  Maximize2,
  EllipsisVertical,
  FolderUp,
  Lightbulb,
  Share2,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { ShareDropdown } from './ShareDropdown';
import type { SyncNotification } from '../services/storage';
export interface ToolbarDataState {
  hasData: boolean;
  hasOutcome: boolean;
  hasFactors: boolean;
  filteredData: DataRow[];
  outcome: string | null;
  specs: SpecLimits;
}

export interface ToolbarSyncState {
  syncStatus: { status: string; message?: string };
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onSave: () => void;
  /** Save to a custom SharePoint location (Team only, ADR-030) */
  onSaveAs?: () => void;
}

export interface ToolbarPanelState {
  isFindingsOpen: boolean;
  isImprovementOpen?: boolean;
  findingsCount: number;
  onToggleFindings: () => void;
  onToggleDataPanel: () => void;
  /** CoScout AI panel toggle */
  isCoScoutOpen?: boolean;
  onToggleCoScout?: () => void;
  /** Stats sidebar toggle */
  isStatsSidebarOpen?: boolean;
  onToggleStatsSidebar?: () => void;
}

export interface ToolbarDataActions {
  onAddPasteData: () => void;
  onAddFileData: () => void;
  onAddManualData: () => void;
  onOpenDataTable: () => void;
  onOpenWhatIf: () => void;
  onOpenImprovement: () => void;
  onOpenReport: () => void;
  onOpenPresentation: () => void;
}

interface EditorToolbarProps {
  onBack: () => void;
  projectName: string;
  hasUnsavedChanges: boolean;
  dataState: ToolbarDataState;
  syncState: ToolbarSyncState;
  panelState: ToolbarPanelState;
  dataActions: ToolbarDataActions;
  /** When false, hide the phone overflow menu (replaced by MobileTabBar). Default true. */
  showOverflowMenu?: boolean;
  /** Share callbacks — when provided, Share button appears in toolbar */
  shareState?: {
    deepLinkUrl: string;
    isInTeams: boolean;
    showPublishReport: boolean;
    onShareTeams: () => void;
    onPublishReport: () => void;
    onToast: (notif: Omit<SyncNotification, 'id'>) => void;
  };
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onBack,
  projectName,
  hasUnsavedChanges,
  dataState: { hasData, hasOutcome, hasFactors, filteredData, outcome, specs },
  syncState: { syncStatus, saveStatus, onSave, onSaveAs },
  panelState: {
    isFindingsOpen,
    isImprovementOpen,
    findingsCount,
    onToggleFindings,
    onToggleDataPanel,
    isCoScoutOpen,
    onToggleCoScout,
    isStatsSidebarOpen,
    onToggleStatsSidebar,
  },
  dataActions: {
    onAddPasteData,
    onAddFileData,
    onAddManualData,
    onOpenDataTable,
    onOpenWhatIf,
    onOpenImprovement,
    onOpenReport,
    onOpenPresentation,
  },
  showOverflowMenu = true,
  shareState,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const { t } = useTranslation();
  const hasActiveData = hasData && hasOutcome;

  // Add Data dropdown state
  const [addDataOpen, setAddDataOpen] = useState(false);
  const addDataRef = React.useRef<HTMLDivElement>(null);

  // Overflow menu state (phone only)
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!addDataOpen && !overflowOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addDataOpen && addDataRef.current && !addDataRef.current.contains(e.target as Node)) {
        setAddDataOpen(false);
      }
      if (overflowOpen && overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addDataOpen, overflowOpen]);

  // Sync status icon
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

  return (
    <div className="flex justify-between items-center mb-4 px-2">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onBack}
          aria-label={t('nav.backToDashboard')}
          className="flex items-center gap-1 text-content-muted hover:text-content transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
          {!isPhone && <span>{t('nav.backToDashboard')}</span>}
        </button>
        <h2 className={`font-semibold text-content truncate ${isPhone ? 'text-base' : 'text-xl'}`}>
          {projectName}
          {hasUnsavedChanges && <span className="text-amber-400 ml-2">•</span>}
        </h2>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Compact sync icon on phone — Team plan only */}
        {isPhone && hasTeamFeatures() && (
          <div
            className={`flex-shrink-0 ${syncColor}`}
            title={syncStatus.message || syncStatus.status}
          >
            <SyncIcon
              size={18}
              className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''}
            />
          </div>
        )}
        {/* Sync Status — Team plan only, full label on desktop */}
        {!isPhone &&
          hasTeamFeatures() &&
          (syncStatus.status === 'error' ? (
            <button
              onClick={() => {
                window.location.href = '/.auth/login/aad';
              }}
              className={`flex items-center gap-1.5 text-sm ${syncColor} hover:text-red-300 transition-colors`}
              title={t('error.auth')}
            >
              <SyncIcon size={16} />
              <span className="underline underline-offset-2">
                {syncStatus.message || t('error.auth')}
              </span>
            </button>
          ) : (
            <div className={`flex items-center gap-1.5 text-sm ${syncColor}`}>
              <SyncIcon
                size={16}
                className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''}
              />
              <span className="text-content-secondary">
                {syncStatus.message || syncStatus.status}
              </span>
            </div>
          ))}

        {/* ===== Desktop toolbar (hidden on phone) ===== */}
        {!isPhone && (
          <>
            {/* Add Data Dropdown */}
            {hasActiveData && (
              <div ref={addDataRef} className="relative">
                <button
                  onClick={() => setAddDataOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                  title={t('toolbar.addMore')}
                  data-testid="btn-add-data"
                >
                  <Plus size={16} />
                  <span className="text-sm">{t('toolbar.addMore')}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${addDataOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {addDataOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1">
                    <button
                      onClick={() => {
                        setAddDataOpen(false);
                        onAddPasteData();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:text-content hover:bg-surface-tertiary transition-colors"
                      data-testid="add-data-paste"
                    >
                      <ClipboardPaste size={15} />
                      {t('data.pasteData')}
                    </button>
                    <button
                      onClick={() => {
                        setAddDataOpen(false);
                        onAddFileData();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:text-content hover:bg-surface-tertiary transition-colors"
                      data-testid="add-data-file"
                    >
                      <Upload size={15} />
                      {t('data.uploadFile')}
                    </button>
                    <button
                      onClick={() => {
                        setAddDataOpen(false);
                        onAddManualData();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:text-content hover:bg-surface-tertiary transition-colors"
                      data-testid="add-data-manual"
                    >
                      <PenLine size={15} />
                      {t('data.manualEntry')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Edit Data */}
            {hasActiveData && (
              <button
                onClick={onOpenDataTable}
                className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title={t('data.editTable')}
                data-testid="btn-edit-data"
              >
                <Pencil size={18} />
              </button>
            )}

            {/* CSV Export */}
            {hasActiveData && (
              <button
                onClick={() => downloadCSV(filteredData, outcome!, specs)}
                className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title={t('export.csvFiltered')}
                data-testid="btn-csv-export"
              >
                <Download size={18} />
              </button>
            )}

            {/* What-If Simulator */}
            {hasActiveData && (
              <button
                onClick={onOpenWhatIf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title={t('panel.whatIf')}
                data-testid="btn-what-if"
              >
                <Beaker size={16} />
                <span>{t('panel.whatIf')}</span>
              </button>
            )}

            {/* Improvement Workspace */}
            {hasActiveData && hasFactors && (
              <button
                onClick={onOpenImprovement}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isImprovementOpen
                    ? 'bg-purple-600 text-white'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title={t('improve.title')}
                data-testid="btn-improvement"
              >
                <Lightbulb size={16} />
                <span className="hidden lg:inline">{t('improve.title')}</span>
              </button>
            )}

            {/* Scouting Report */}
            {hasActiveData && (
              <button
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title={t('report.scouting')}
                data-testid="btn-report"
              >
                <FileText size={16} />
                <span>{t('report.scouting')}</span>
              </button>
            )}

            {/* Presentation Mode */}
            {hasActiveData && (
              <button
                onClick={onOpenPresentation}
                className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title={t('nav.presentationMode')}
                data-testid="btn-presentation"
              >
                <Maximize2 size={18} />
              </button>
            )}

            {/* Share */}
            {hasActiveData && shareState && <ShareDropdown {...shareState} />}

            {/* Findings Toggle */}
            {hasActiveData && hasFactors && (
              <button
                onClick={onToggleFindings}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isFindingsOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title={isFindingsOpen ? t('nav.hideFindings') : t('panel.findings')}
                data-testid="btn-findings"
              >
                <ClipboardList size={16} />
                <span className="hidden lg:inline">
                  {t('panel.findings')}
                  {findingsCount > 0 && ` (${findingsCount})`}
                </span>
              </button>
            )}

            {/* Stats Sidebar Toggle */}
            {hasActiveData && onToggleStatsSidebar && (
              <button
                onClick={onToggleStatsSidebar}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isStatsSidebarOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title={isStatsSidebarOpen ? 'Hide stats panel' : 'Show stats panel'}
                data-testid="btn-stats-sidebar"
              >
                <BarChart3 size={16} />
                <span className="hidden lg:inline">Stats</span>
              </button>
            )}

            {/* CoScout AI Toggle */}
            {hasActiveData && onToggleCoScout && (
              <button
                onClick={onToggleCoScout}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isCoScoutOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title={isCoScoutOpen ? 'Hide AI assistant' : 'Ask AI assistant'}
                data-testid="btn-coscout"
              >
                <MessageSquare size={16} />
                <span className="hidden lg:inline">AI</span>
              </button>
            )}

            {/* Data Table Toggle */}
            {hasActiveData && (
              <button
                onClick={onToggleDataPanel}
                className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title={t('data.showDataTable')}
                data-testid="btn-data-panel"
              >
                <Table2 size={18} />
              </button>
            )}
          </>
        )}

        {/* Save Button (always visible) */}
        <button
          onClick={onSave}
          disabled={!hasData || saveStatus === 'saving'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            saveStatus === 'saved'
              ? 'bg-green-600 text-white'
              : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          data-testid="btn-save"
        >
          <Save size={16} />
          {!isPhone &&
            (saveStatus === 'saving'
              ? t('toolbar.saving')
              : saveStatus === 'saved'
                ? t('toolbar.saved')
                : saveStatus === 'error'
                  ? t('toolbar.saveFailed')
                  : t('action.save'))}
        </button>

        {/* Save As... for Team plans (ADR-030) */}
        {!isPhone && hasTeamFeatures() && onSaveAs && hasData && (
          <button
            onClick={onSaveAs}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
            title="Save to SharePoint folder..."
          >
            <FolderUp size={14} />
            {t('toolbar.saveAs')}
          </button>
        )}

        {/* ===== Phone overflow menu (hidden when MobileTabBar active) ===== */}
        {showOverflowMenu && isPhone && hasActiveData && (
          <div ref={overflowRef} className="relative">
            <button
              onClick={() => setOverflowOpen(prev => !prev)}
              className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              title={t('nav.moreActions')}
              aria-label={t('nav.moreActions')}
              data-testid="btn-overflow"
            >
              <EllipsisVertical size={20} />
            </button>
            {overflowOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1 animate-fade-in">
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onAddPasteData();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Plus size={16} />
                  {t('toolbar.addMore')}
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenDataTable();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Pencil size={16} />
                  {t('data.editData')}
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    downloadCSV(filteredData, outcome!, specs);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Download size={16} />
                  {t('export.asCsv')}
                </button>
                <div className="border-t border-edge my-1" />
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenWhatIf();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Beaker size={16} />
                  {t('panel.whatIf')}
                </button>
                {hasFactors && (
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      onOpenImprovement();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Lightbulb size={16} />
                    {t('improve.title')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenReport();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <FileText size={16} />
                  {t('report.scouting')}
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenPresentation();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Maximize2 size={16} />
                  {t('nav.presentationMode')}
                </button>
                {/* Share */}
                {shareState && (
                  <>
                    <div className="border-t border-edge my-1" />
                    <button
                      onClick={() => {
                        setOverflowOpen(false);
                        navigator.clipboard.writeText(shareState.deepLinkUrl).then(
                          () =>
                            shareState.onToast({
                              type: 'success',
                              message: 'Link copied to clipboard',
                              dismissAfter: 3000,
                            }),
                          () =>
                            shareState.onToast({
                              type: 'error',
                              message: "Couldn't copy link. Try again.",
                            })
                        );
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                    >
                      <Share2 size={16} />
                      Copy link
                    </button>
                    {shareState.isInTeams && (
                      <button
                        onClick={() => {
                          setOverflowOpen(false);
                          shareState.onShareTeams();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                      >
                        <MessageSquare size={16} />
                        Share in Teams
                      </button>
                    )}
                    {shareState.showPublishReport && (
                      <button
                        onClick={() => {
                          setOverflowOpen(false);
                          shareState.onPublishReport();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                      >
                        <Upload size={16} />
                        Publish report
                      </button>
                    )}
                  </>
                )}
                {hasFactors && (
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      onToggleFindings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <ClipboardList size={16} />
                    {t('panel.findings')}
                    {findingsCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[0.625rem] bg-blue-500/20 text-blue-400 rounded">
                        {findingsCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onToggleDataPanel();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Table2 size={16} />
                  {t('panel.dataTable')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
