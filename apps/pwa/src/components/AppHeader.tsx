import React, { useState } from 'react';
import {
  Activity,
  Settings,
  Download,
  Save,
  FolderOpen,
  RefreshCw,
  HardDrive,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Table,
  MoreVertical,
} from 'lucide-react';
import MobileMenu from './MobileMenu';

interface AppHeaderProps {
  currentProjectName: string | null;
  hasUnsavedChanges: boolean;
  hasData: boolean;
  dataFilename: string | null;
  rowCount: number;
  isLargeMode: boolean;
  isSaving: boolean;
  onSaveToBrowser: () => void;
  onOpenProjects: () => void;
  onOpenDataTable: () => void;
  onDownloadFile: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onToggleLargeMode: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

/**
 * Application header with logo, project name, and toolbar buttons
 * Shows different controls based on whether data is loaded
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  currentProjectName,
  hasUnsavedChanges,
  hasData,
  dataFilename,
  rowCount,
  isLargeMode,
  isSaving,
  onSaveToBrowser,
  onOpenProjects,
  onOpenDataTable,
  onDownloadFile,
  onExportCSV,
  onExportImage,
  onToggleLargeMode,
  onOpenSettings,
  onReset,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-900/50 backdrop-blur-md z-10">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Activity className="text-white" size={18} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VariScout <span className="font-light text-slate-500">Lite</span>
          </h1>
          {(currentProjectName || dataFilename) && (
            <span className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none flex items-center gap-1">
              {currentProjectName ? (
                <>
                  {currentProjectName}
                  {hasUnsavedChanges && ' *'}
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

      <div className="flex items-center gap-1 sm:gap-2">
        {hasData && (
          <>
            {/* Save to browser button - always visible */}
            <button
              onClick={onSaveToBrowser}
              disabled={isSaving}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 touch-feedback"
              title="Save to Browser"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <HardDrive size={18} />
            </button>

            {/* View Data Table - always visible */}
            <button
              onClick={onOpenDataTable}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors touch-feedback"
              title="View Data"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Table size={18} />
            </button>

            {/* Mobile: More menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors touch-feedback"
              title="More options"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <MoreVertical size={18} />
            </button>

            {/* Desktop: Individual buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Open saved projects */}
              <button
                onClick={onOpenProjects}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Open Saved Projects"
              >
                <FolderOpen size={18} />
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              {/* Download as file */}
              <button
                onClick={onDownloadFile}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Download as File"
              >
                <Save size={18} />
              </button>
              {/* Export as CSV */}
              <button
                onClick={onExportCSV}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Export as CSV"
              >
                <FileSpreadsheet size={18} />
              </button>
              {/* Export image */}
              <button
                onClick={onExportImage}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Export as Image"
              >
                <Download size={18} />
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              {/* Large Mode toggle */}
              <button
                onClick={onToggleLargeMode}
                className={`p-2 rounded-lg transition-colors ${
                  isLargeMode
                    ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isLargeMode ? 'Exit Large Mode' : 'Large Mode (for presentations)'}
              >
                {isLargeMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              {/* Reset */}
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                <span>Reset</span>
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
              onToggleLargeMode={onToggleLargeMode}
              onOpenSettings={onOpenSettings}
              onReset={onReset}
              isLargeMode={isLargeMode}
            />
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
