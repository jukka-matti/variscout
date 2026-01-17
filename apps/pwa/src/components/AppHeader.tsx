import React, { useState, useCallback, useRef } from 'react';
import { Activity, Settings, MoreVertical, Maximize, Table2, Share2 } from 'lucide-react';
import MobileMenu from './MobileMenu';
import SharePopover from './SharePopover';

interface AppHeaderProps {
  currentProjectName: string | null;
  hasUnsavedChanges: boolean;
  hasData: boolean;
  dataFilename: string | null;
  rowCount: number;
  isSaving: boolean;
  isDataPanelOpen?: boolean;
  onSaveToBrowser: () => void;
  onOpenProjects: () => void;
  onToggleDataPanel?: () => void;
  onOpenDataTable: () => void;
  onDownloadFile: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onEnterPresentationMode: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenSpecEditor?: () => void;
}

/**
 * Minimal icon-based header for maximum chart space
 *
 * Design principles:
 * - Icons only for efficiency
 * - Logo clickable → project picker
 * - Unsaved indicator dot
 * - Data panel toggle persists
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  currentProjectName,
  hasUnsavedChanges,
  hasData,
  dataFilename,
  rowCount,
  isSaving,
  isDataPanelOpen = false,
  onSaveToBrowser,
  onOpenProjects,
  onToggleDataPanel,
  onOpenDataTable,
  onDownloadFile,
  onExportCSV,
  onExportImage,
  onEnterPresentationMode,
  onOpenSettings,
  onReset,
  onOpenSpecEditor,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  // Icon button component for consistent styling
  const IconButton = ({
    icon,
    title,
    onClick,
    isActive,
    buttonRef,
  }: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    isActive?: boolean;
    buttonRef?: React.RefObject<HTMLButtonElement>;
  }) => (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'text-blue-400 bg-blue-400/10'
          : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
      }`}
      title={title}
      style={{ minWidth: 40, minHeight: 40 }}
    >
      {icon}
    </button>
  );

  return (
    <header className="h-14 border-b border-edge flex items-center justify-between px-4 sm:px-6 bg-surface/50 backdrop-blur-md z-10">
      {/* Logo and project name - clickable to open projects */}
      <button
        onClick={onOpenProjects}
        className="flex items-center gap-2 sm:gap-3 group hover:opacity-90 transition-opacity"
        title="Open Projects"
      >
        <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
          <Activity className="text-white" size={18} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-content-secondary bg-clip-text text-transparent">
            VariScout <span className="font-light text-content-muted">Lite</span>
          </h1>
          {hasData && (currentProjectName || dataFilename) && (
            <span className="text-[10px] sm:text-xs text-content-muted truncate max-w-[150px] sm:max-w-none flex items-center gap-1.5">
              {currentProjectName ? (
                <>
                  {currentProjectName}
                  {/* Save status indicator */}
                  <span
                    className={`inline-block w-2 h-2 rounded-full transition-all ${
                      isSaving
                        ? 'bg-blue-400 animate-pulse'
                        : hasUnsavedChanges
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-blue-500'
                    }`}
                    title={
                      isSaving
                        ? 'Saving...'
                        : hasUnsavedChanges
                          ? 'Unsaved changes'
                          : 'All changes saved'
                    }
                  />
                </>
              ) : dataFilename ? (
                <>
                  {dataFilename}
                  {rowCount > 0 && (
                    <span className="text-content-muted">({rowCount.toLocaleString()} rows)</span>
                  )}
                </>
              ) : null}
            </span>
          )}
        </div>
      </button>

      {/* Toolbar */}
      <div className="flex items-center gap-1">
        {hasData ? (
          <>
            {/* Desktop: Icon toolbar */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Data Table Toggle */}
              {onToggleDataPanel && (
                <IconButton
                  icon={<Table2 size={18} />}
                  title={isDataPanelOpen ? 'Hide Data Table' : 'Show Data Table'}
                  onClick={onToggleDataPanel}
                  isActive={isDataPanelOpen}
                />
              )}

              {/* Fullscreen / Presentation Mode */}
              <IconButton
                icon={<Maximize size={18} />}
                title="Presentation Mode"
                onClick={onEnterPresentationMode}
              />

              {/* Share / Export */}
              <IconButton
                icon={<Share2 size={18} />}
                title="Share & Export"
                onClick={() => setIsShareOpen(true)}
                buttonRef={shareButtonRef}
              />

              {/* Settings */}
              <IconButton icon={<Settings size={18} />} title="Settings" onClick={onOpenSettings} />
            </div>

            {/* Mobile: Menu button */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-content-secondary hover:text-white hover:bg-surface-secondary rounded-lg transition-colors touch-feedback"
                title="Menu"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Share Popover */}
            <SharePopover
              isOpen={isShareOpen}
              onClose={() => setIsShareOpen(false)}
              onDownloadFile={onDownloadFile}
              onExportCSV={onExportCSV}
              onExportImage={onExportImage}
              anchorRef={shareButtonRef}
            />

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
              onOpenSpecEditor={onOpenSpecEditor}
            />
          </>
        ) : (
          /* No data: Settings only */
          <div className="flex items-center gap-1">
            <IconButton icon={<Settings size={18} />} title="Settings" onClick={onOpenSettings} />
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
