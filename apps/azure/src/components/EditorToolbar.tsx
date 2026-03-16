import React, { useState, useEffect } from 'react';
import { hasTeamFeatures, downloadCSV } from '@variscout/core';
import type { DataRow, SpecLimits } from '@variscout/core';
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
} from 'lucide-react';
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
}

export interface ToolbarPanelState {
  isFindingsOpen: boolean;
  isDataPanelOpen: boolean;
  findingsCount: number;
  onToggleFindings: () => void;
  onToggleDataPanel: () => void;
}

export interface ToolbarDataActions {
  onAddPasteData: () => void;
  onAddFileData: () => void;
  onAddManualData: () => void;
  onOpenDataTable: () => void;
  onOpenWhatIf: () => void;
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
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onBack,
  projectName,
  hasUnsavedChanges,
  dataState: { hasData, hasOutcome, hasFactors, filteredData, outcome, specs },
  syncState: { syncStatus, saveStatus, onSave },
  panelState: {
    isFindingsOpen,
    isDataPanelOpen,
    findingsCount,
    onToggleFindings,
    onToggleDataPanel,
  },
  dataActions: {
    onAddPasteData,
    onAddFileData,
    onAddManualData,
    onOpenDataTable,
    onOpenWhatIf,
    onOpenReport,
    onOpenPresentation,
  },
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
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
          aria-label="Back to dashboard"
          className="flex items-center gap-1 text-content-muted hover:text-content transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
          {!isPhone && <span>Back</span>}
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
              title="Click to re-authenticate"
            >
              <SyncIcon size={16} />
              <span className="underline underline-offset-2">
                {syncStatus.message || 'Auth error'}
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
                  title="Add more data"
                  data-testid="btn-add-data"
                >
                  <Plus size={16} />
                  <span className="text-sm">Add Data</span>
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
                      Paste Data
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
                      Upload File
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
                      Manual Entry
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
                title="Edit Data Table"
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
                title="Export filtered data as CSV"
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
                title="What-If Simulator"
                data-testid="btn-what-if"
              >
                <Beaker size={16} />
                <span>What-If</span>
              </button>
            )}

            {/* Scouting Report */}
            {hasActiveData && (
              <button
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title="Scouting Report"
                data-testid="btn-report"
              >
                <FileText size={16} />
                <span>Report</span>
              </button>
            )}

            {/* Presentation Mode */}
            {hasActiveData && (
              <button
                onClick={onOpenPresentation}
                className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                title="Presentation Mode"
                data-testid="btn-presentation"
              >
                <Maximize2 size={18} />
              </button>
            )}

            {/* Findings Toggle */}
            {hasActiveData && hasFactors && (
              <button
                onClick={onToggleFindings}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isFindingsOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title={isFindingsOpen ? 'Hide Findings' : 'Show Findings'}
                data-testid="btn-findings"
              >
                <ClipboardList size={16} />
                <span className="hidden lg:inline">
                  Findings
                  {findingsCount > 0 && ` (${findingsCount})`}
                </span>
              </button>
            )}

            {/* Data Panel Toggle */}
            {hasActiveData && (
              <button
                onClick={onToggleDataPanel}
                className={`p-2 rounded-lg transition-colors ${
                  isDataPanelOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title={isDataPanelOpen ? 'Hide Data Panel' : 'Show Data Panel'}
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
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'error'
                  ? 'Save Failed'
                  : 'Save')}
        </button>

        {/* ===== Phone overflow menu ===== */}
        {isPhone && hasActiveData && (
          <div ref={overflowRef} className="relative">
            <button
              onClick={() => setOverflowOpen(prev => !prev)}
              className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              title="More actions"
              aria-label="More actions"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Plus size={16} />
                  Add Data
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenDataTable();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Pencil size={16} />
                  Edit Data
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    downloadCSV(filteredData, outcome!, specs);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <div className="border-t border-edge my-1" />
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenWhatIf();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Beaker size={16} />
                  What-If
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenReport();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <FileText size={16} />
                  Scouting Report
                </button>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    onOpenPresentation();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Maximize2 size={16} />
                  Presentation
                </button>
                {hasFactors && (
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      onToggleFindings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <ClipboardList size={16} />
                    Findings
                    {findingsCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                >
                  <Table2 size={16} />
                  Data Table
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
