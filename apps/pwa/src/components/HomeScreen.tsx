import React, { useRef } from 'react';
import { BarChart2, ClipboardPaste, PenLine, ArrowUpRight } from 'lucide-react';
import type { SampleDataset } from '@variscout/data';
import { useTranslation } from '@variscout/hooks';
import type { DocumentSnapshotVrsFile } from '@variscout/stores/document-snapshot-vrs';
import SampleSection from './data/SampleSection';

/* global __WORKSPACE_ARTIFACTS__ */

const artifactControlsEnabled =
  __WORKSPACE_ARTIFACTS__ || import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true';

interface HomeScreenProps {
  onLoadSample: (sample: SampleDataset) => void;
  onOpenPaste: () => void;
  onOpenManualEntry: () => void;
  onOpenSettings?: () => void;
  onImportVrs?: (imported: DocumentSnapshotVrsFile) => void;
}

/**
 * Landing screen shown when no data is loaded
 *
 * Free training tool: sample datasets + paste from Excel
 */
const HomeScreen: React.FC<HomeScreenProps> = ({
  onLoadSample,
  onOpenPaste,
  onOpenManualEntry,
  onImportVrs,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!artifactControlsEnabled || !file || !onImportVrs) return;
    const { parseVrsFile } = await import('@pwa-artifacts');
    onImportVrs(await parseVrsFile(file));
  };

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 sm:p-8 overflow-auto animate-in fade-in duration-500">
      <div className="max-w-xl w-full space-y-6 sm:space-y-8 py-4">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-surface-secondary/50 rounded-full border border-edge">
            <BarChart2 size={40} className="text-blue-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-content">{t('home.heading')}</h2>
          <p className="text-sm text-content-secondary max-w-md mx-auto">{t('home.description')}</p>
        </div>

        {/* Sample datasets section */}
        <div className="bg-surface-secondary border border-edge rounded-2xl p-5">
          <SampleSection onLoadSample={onLoadSample} variant="web" />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-edge"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-surface text-xs text-content-muted uppercase tracking-wider">
              {t('home.divider')}
            </span>
          </div>
        </div>

        {/* Paste from Excel button — primary action */}
        <button
          data-testid="home-paste-button"
          onClick={onOpenPaste}
          className="w-full flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-400/50 rounded-2xl transition-all group"
        >
          <ClipboardPaste
            size={24}
            className="text-blue-400 group-hover:text-blue-300 transition-colors"
          />
          <div className="text-left">
            <span className="text-sm font-semibold text-content block">{t('data.pasteData')}</span>
            <span className="text-xs text-content-secondary">{t('home.pasteHelper')}</span>
          </div>
        </button>

        {/* Secondary: manual entry + .vrs import */}
        <div className="text-center space-y-2">
          <button
            onClick={onOpenManualEntry}
            className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-content-secondary transition-colors"
          >
            <PenLine size={12} />
            {t('home.manualEntry')}
          </button>
          {artifactControlsEnabled && onImportVrs && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                aria-label="Import .vrs file"
                accept=".vrs,application/json"
                className="hidden"
                onChange={handleImportChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-content-muted hover:text-content-secondary transition-colors"
              >
                Import .vrs file
              </button>
            </div>
          )}
          <div>
            <a
              href="https://variscout.com/en/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-content-muted/60 hover:text-blue-400 transition-colors"
            >
              {t('home.upgradeHint')}
              <ArrowUpRight size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
