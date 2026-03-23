import React, { useState, useRef } from 'react';
import {
  Activity,
  Settings,
  MoreVertical,
  Maximize,
  Table2,
  Share2,
  ClipboardList,
  Beaker,
} from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import MobileMenu from './MobileMenu';
import SharePopover from '../SharePopover';

const table2Icon = <Table2 size={18} />;
const maximizeIcon = <Maximize size={18} />;
const share2Icon = <Share2 size={18} />;
const settingsIcon = <Settings size={18} />;

interface AppHeaderProps {
  hasData: boolean;
  dataFilename: string | null;
  rowCount: number;
  isDataPanelOpen?: boolean;
  isFindingsPanelOpen?: boolean;
  onNewAnalysis: () => void;
  onToggleDataPanel?: () => void;
  onToggleFindingsPanel?: () => void;
  onOpenDataTable: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onEnterPresentationMode: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenSpecEditor?: () => void;
  onOpenWhatIf?: () => void;
  isWhatIfOpen?: boolean;
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
  isFindingsPanelOpen = false,
  onNewAnalysis,
  onToggleDataPanel,
  onToggleFindingsPanel,
  onOpenDataTable,
  onExportCSV,
  onExportImage,
  onEnterPresentationMode,
  onOpenSettings,
  onReset,
  onOpenSpecEditor,
  onOpenWhatIf,
  isWhatIfOpen = false,
}) => {
  const { t } = useTranslation();
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
    buttonRef?: React.RefObject<HTMLButtonElement | null>;
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

  return (
    <header className="h-14 border-b border-edge flex items-center justify-between px-4 sm:px-6 bg-surface/50 backdrop-blur-md z-10">
      {/* Logo and dataset name - clickable to start new analysis */}
      <button
        onClick={onNewAnalysis}
        className="flex items-center gap-2 sm:gap-3 group hover:opacity-90 transition-opacity"
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
            <span className="text-[10px] sm:text-xs text-content-muted truncate max-w-[150px] sm:max-w-none flex items-center gap-1.5">
              {dataFilename}
              {rowCount > 0 && (
                <span className="text-content-muted">({rowCount.toLocaleString()} rows)</span>
              )}
            </span>
          )}
        </div>
      </button>

      <div className="flex-1" />

      {/* Toolbar */}
      <div className="flex items-center gap-1">
        {hasData ? (
          <>
            {/* Desktop: Icon toolbar */}
            <nav aria-label="Analysis tools">
              <div className="hidden sm:flex items-center gap-1">
                {/* Data Table Toggle */}
                {onToggleDataPanel && (
                  <IconButton
                    icon={table2Icon}
                    title={isDataPanelOpen ? t('data.hideDataTable') : t('data.showDataTable')}
                    onClick={onToggleDataPanel}
                    isActive={isDataPanelOpen}
                  />
                )}

                {/* Findings Toggle */}
                {onToggleFindingsPanel && (
                  <button
                    onClick={onToggleFindingsPanel}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isFindingsPanelOpen
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
                    }`}
                    title={isFindingsPanelOpen ? t('nav.hideFindings') : t('panel.findings')}
                    aria-label={isFindingsPanelOpen ? t('nav.hideFindings') : t('panel.findings')}
                    aria-pressed={isFindingsPanelOpen}
                  >
                    <ClipboardList size={16} />
                    <span className="hidden lg:inline">Findings</span>
                  </button>
                )}

                {/* What-If Simulator */}
                {onOpenWhatIf && (
                  <button
                    onClick={onOpenWhatIf}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isWhatIfOpen
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-content-secondary hover:text-white hover:bg-surface-secondary'
                    }`}
                    title={t('panel.whatIf')}
                    aria-label={t('panel.whatIf')}
                  >
                    <Beaker size={16} />
                    <span className="hidden lg:inline">What-If</span>
                  </button>
                )}

                {/* Fullscreen / Presentation Mode */}
                <IconButton
                  icon={maximizeIcon}
                  title={t('nav.presentationMode')}
                  onClick={onEnterPresentationMode}
                />

                {/* Export */}
                <IconButton
                  icon={share2Icon}
                  title={t('nav.export')}
                  onClick={() => setIsShareOpen(true)}
                  buttonRef={shareButtonRef}
                />

                {/* Settings */}
                <IconButton
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
              onEnterPresentationMode={onEnterPresentationMode}
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
