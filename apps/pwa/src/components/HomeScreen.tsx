import React from 'react';
import { BarChart2, PenLine } from 'lucide-react';
import type { SampleDataset } from '@variscout/data';
import SampleSection from './SampleSection';
import InstallPrompt from './InstallPrompt';

interface HomeScreenProps {
  onLoadSample: (sample: SampleDataset) => void;
  onOpenManualEntry: () => void;
  onOpenSettings?: () => void;
}

/**
 * Landing screen shown when no data is loaded
 *
 * Free training tool: sample datasets + paste from Excel
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ onLoadSample, onOpenManualEntry }) => {
  return (
    <div className="h-full flex flex-col items-center justify-start p-4 sm:p-8 overflow-auto animate-in fade-in duration-500">
      <div className="max-w-xl w-full space-y-6 sm:space-y-8 py-4">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-surface-secondary/50 rounded-full border border-edge">
            <BarChart2 size={40} className="text-blue-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Explore Variation Analysis</h2>
          <p className="text-sm text-content-secondary max-w-md mx-auto">
            Free SPC training tool. Visualize variability, calculate capability, and identify root
            causes — right in your browser.
          </p>
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
              or
            </span>
          </div>
        </div>

        {/* Paste from Excel button */}
        <button
          onClick={onOpenManualEntry}
          className="w-full flex items-center justify-center gap-3 p-5 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500 rounded-2xl transition-all group"
        >
          <PenLine
            size={24}
            className="text-content-muted group-hover:text-blue-400 transition-colors"
          />
          <div className="text-left">
            <span className="text-sm font-semibold text-white block">Paste from Excel</span>
            <span className="text-xs text-content-muted">
              Copy rows from Excel or Google Sheets
            </span>
          </div>
        </button>

        {/* Install prompt */}
        <InstallPrompt />
      </div>
    </div>
  );
};

export default HomeScreen;
