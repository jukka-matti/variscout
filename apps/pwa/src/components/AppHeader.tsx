import React, { useState, useCallback } from 'react';
import {
  Activity,
  Settings,
  Save,
  FolderOpen,
  Share2,
  Eye,
  FileDown,
  FileSpreadsheet,
  Image,
  Table,
  MoreVertical,
  Presentation,
  Plus,
  Check,
} from 'lucide-react';
import MobileMenu from './MobileMenu';
import ToolbarDropdown, { DropdownItem } from './ToolbarDropdown';

interface AppHeaderProps {
  currentProjectName: string | null;
  hasUnsavedChanges: boolean;
  hasData: boolean;
  dataFilename: string | null;
  rowCount: number;
  isSaving: boolean;
  onSaveToBrowser: () => void;
  onOpenProjects: () => void;
  onOpenDataTable: () => void;
  onDownloadFile: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onEnterPresentationMode: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

/**
 * Application header with contextual toolbar
 *
 * Design principles:
 * - Clear for first-time users (labels on buttons)
 * - Efficient for power users (keyboard shortcuts shown)
 * - Context-aware (different actions when no data vs data loaded)
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  currentProjectName,
  hasUnsavedChanges,
  hasData,
  dataFilename,
  rowCount,
  isSaving,
  onSaveToBrowser,
  onOpenProjects,
  onOpenDataTable,
  onDownloadFile,
  onExportCSV,
  onExportImage,
  onEnterPresentationMode,
  onOpenSettings,
  onReset,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Handle save with success feedback
  const handleSave = useCallback(() => {
    onSaveToBrowser();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  }, [onSaveToBrowser]);

  // Detect Mac for shortcut display
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl+';

  // Export dropdown items
  const exportItems: DropdownItem[] = [
    {
      id: 'download',
      label: 'Download Project (.vrs)',
      icon: <FileDown size={16} />,
      onClick: onDownloadFile,
    },
    {
      id: 'csv',
      label: 'Export as CSV',
      icon: <FileSpreadsheet size={16} />,
      onClick: onExportCSV,
    },
    {
      id: 'image',
      label: 'Export as Image',
      icon: <Image size={16} />,
      onClick: onExportImage,
    },
  ];

  // View dropdown items
  const viewItems: DropdownItem[] = [
    {
      id: 'datatable',
      label: 'Data Table',
      icon: <Table size={16} />,
      onClick: onOpenDataTable,
    },
    {
      id: 'presentation',
      label: 'Presentation Mode',
      icon: <Presentation size={16} />,
      onClick: onEnterPresentationMode,
    },
    {
      id: 'projects',
      label: 'Open Project',
      icon: <FolderOpen size={16} />,
      shortcut: `${cmdKey}O`,
      onClick: onOpenProjects,
      dividerBefore: true,
    },
    {
      id: 'new',
      label: 'New Analysis',
      icon: <Plus size={16} />,
      onClick: onReset,
    },
  ];

  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-900/50 backdrop-blur-md z-10">
      {/* Logo and project name */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Activity className="text-white" size={18} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VariScout <span className="font-light text-slate-500">Lite</span>
          </h1>
          {hasData && (currentProjectName || dataFilename) && (
            <span className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none flex items-center gap-1">
              {currentProjectName ? (
                <>
                  {currentProjectName}
                  {hasUnsavedChanges && <span className="text-amber-500">*</span>}
                </>
              ) : dataFilename ? (
                <>
                  {dataFilename}
                  {rowCount > 0 && (
                    <span className="text-slate-600">({rowCount.toLocaleString()} rows)</span>
                  )}
                </>
              ) : null}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 sm:gap-2">
        {hasData ? (
          <>
            {/* Desktop: Full toolbar with labels */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Save button with label and shortcut */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all
                  ${
                    showSaveSuccess
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={`Save to Browser (${cmdKey}S)`}
                style={{ minHeight: 44 }}
              >
                {showSaveSuccess ? <Check size={18} /> : <Save size={18} />}
                <span className="text-sm font-medium">{showSaveSuccess ? 'Saved' : 'Save'}</span>
                {!showSaveSuccess && (
                  <span className="text-xs text-slate-600 font-mono ml-1">{cmdKey}S</span>
                )}
              </button>

              {/* Export dropdown */}
              <ToolbarDropdown label="Export" icon={<Share2 size={18} />} items={exportItems} />

              {/* View dropdown */}
              <ToolbarDropdown label="View" icon={<Eye size={18} />} items={viewItems} />

              {/* Settings - icon only */}
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Settings"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Mobile: Save button + menu */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  p-2 rounded-lg transition-all touch-feedback
                  ${
                    showSaveSuccess
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                  disabled:opacity-50
                `}
                title="Save"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                {showSaveSuccess ? <Check size={18} /> : <Save size={18} />}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors touch-feedback"
                title="Menu"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Mobile Menu */}
            <MobileMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              onOpenProjects={onOpenProjects}
              onDownloadFile={onDownloadFile}
              onExportCSV={onExportCSV}
              onExportImage={onExportImage}
              onEnterPresentationMode={onEnterPresentationMode}
              onOpenSettings={onOpenSettings}
              onReset={onReset}
              onOpenDataTable={onOpenDataTable}
            />
          </>
        ) : (
          /* No data: Minimal toolbar */
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={`Open Project (${cmdKey}O)`}
              style={{ minHeight: 44 }}
            >
              <FolderOpen size={18} />
              <span className="hidden sm:inline text-sm font-medium">Open Project</span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono ml-1">
                {cmdKey}O
              </span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Settings"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Settings size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
