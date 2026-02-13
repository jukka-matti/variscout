import React, { useState, useRef } from 'react';
import { Activity, Settings, MoreVertical, Maximize, Table2, Share2, Filter } from 'lucide-react';
import MobileMenu from './MobileMenu';
import SharePopover from './SharePopover';

interface AppHeaderProps {
  hasData: boolean;
  dataFilename: string | null;
  rowCount: number;
  isDataPanelOpen?: boolean;
  isFunnelPanelOpen?: boolean;
  onNewAnalysis: () => void;
  onToggleDataPanel?: () => void;
  onToggleFunnelPanel?: () => void;
  onOpenDataTable: () => void;
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
 * - Logo clickable → new analysis (home screen)
 * - Data panel toggle persists
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  hasData,
  dataFilename,
  rowCount,
  isDataPanelOpen = false,
  isFunnelPanelOpen = false,
  onNewAnalysis,
  onToggleDataPanel,
  onToggleFunnelPanel,
  onOpenDataTable,
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
      {/* Logo and dataset name - clickable to start new analysis */}
      <button
        onClick={onNewAnalysis}
        className="flex items-center gap-2 sm:gap-3 group hover:opacity-90 transition-opacity"
        title="New Analysis"
      >
        <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
          <Activity className="text-white" size={18} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-content-secondary bg-clip-text text-transparent">
            VariScout
          </h1>
          {hasData && dataFilename && (
            <span className="text-[10px] sm:text-xs text-content-muted truncate max-w-[150px] sm:max-w-none flex items-center gap-1.5">
              {dataFilename}
              {rowCount > 0 && (
                <span className="text-content-muted">({rowCount.toLocaleString()} rows)</span>
              )}
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

              {/* Variation Funnel Toggle */}
              {onToggleFunnelPanel && (
                <IconButton
                  icon={<Filter size={18} />}
                  title={isFunnelPanelOpen ? 'Hide Variation Funnel' : 'Show Variation Funnel'}
                  onClick={onToggleFunnelPanel}
                  isActive={isFunnelPanelOpen}
                />
              )}

              {/* Fullscreen / Presentation Mode */}
              <IconButton
                icon={<Maximize size={18} />}
                title="Presentation Mode"
                onClick={onEnterPresentationMode}
              />

              {/* Export */}
              <IconButton
                icon={<Share2 size={18} />}
                title="Export"
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
