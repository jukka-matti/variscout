import React, { useState, useEffect } from 'react';
import { Upload, FolderOpen, ArrowRight, BarChart2, FileUp, Clock, PenLine } from 'lucide-react';
import type { SampleDataset } from '@variscout/data';
import { useData } from '../context/DataContext';
import { useIsInstalled } from '../hooks/useIsInstalled';
import SampleSection from './SampleSection';
import InstallPrompt from './InstallPrompt';
import SessionWarning from './SessionWarning';
import type { SavedProject } from '../lib/persistence';

interface HomeScreenProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenProjects: () => void;
  onLoadSample: (sample: SampleDataset) => void;
  onOpenManualEntry: () => void;
  onOpenSettings?: () => void;
}

// Format relative time (e.g., "2h ago", "yesterday")
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Landing screen shown when no data is loaded
 *
 * Two variants based on user state:
 * - Web browser (not installed): Demo mode, samples only, install CTA
 * - Installed PWA: Upload/Manual entry, session warning (PWA is demo-only)
 */
const HomeScreen: React.FC<HomeScreenProps> = ({
  onFileUpload,
  onImportFile,
  onOpenProjects,
  onLoadSample,
  onOpenManualEntry,
  onOpenSettings,
}) => {
  const { listProjects, loadProject } = useData();
  const isInstalled = useIsInstalled();

  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);

  // Load recent projects on mount (for installed PWA)
  useEffect(() => {
    if (isInstalled) {
      listProjects().then(projects => {
        setRecentProjects(projects.slice(0, 3)); // Top 3 most recent
      });
    }
  }, [listProjects, isInstalled]);

  const handleLoadProject = async (id: string) => {
    await loadProject(id);
  };

  // Determine user state: web browser or installed PWA
  const userState: 'web' | 'installed' = isInstalled ? 'installed' : 'web';

  // Web browser (Demo Mode) - samples only, install CTA
  if (userState === 'web') {
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
              See what's hiding in your data. Visualize variability, calculate capability, and
              identify root causes.
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

          {/* Install prompt */}
          <InstallPrompt />
        </div>
      </div>
    );
  }

  // Installed PWA - Upload/Manual entry, recent projects, session warning
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="max-w-xl w-full space-y-6">
        {/* Recent Projects (if any) */}
        {recentProjects.length > 0 && (
          <div className="bg-surface-secondary border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Clock size={16} className="text-content-secondary" />
                <span>Recent Projects</span>
              </div>
            </div>
            <div className="space-y-2">
              {recentProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleLoadProject(project.id)}
                  className="w-full flex items-center gap-3 p-3 bg-surface hover:bg-surface-tertiary border border-edge/50 hover:border-edge-secondary rounded-xl text-left transition-all group"
                >
                  <div className="p-2 bg-surface-secondary rounded-lg text-content-secondary group-hover:text-white transition-colors">
                    <FolderOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{project.name}</div>
                    <div className="text-xs text-content-muted">
                      {project.rowCount} rows · {formatRelativeTime(project.savedAt)}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-content-muted group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-edge">
              <button
                onClick={onOpenProjects}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-content-secondary hover:text-white hover:bg-surface transition-colors rounded-lg"
              >
                <FolderOpen size={14} />
                <span>See all projects</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-content-secondary hover:text-white hover:bg-surface transition-colors rounded-lg cursor-pointer">
                <FileUp size={14} />
                <span>Import .vrs</span>
                <input type="file" accept=".vrs" onChange={onImportFile} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* No recent projects - show projects options inline */}
        {recentProjects.length === 0 && (
          <div className="flex items-center justify-center gap-4 pb-2">
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-2 px-4 py-2 text-sm text-content-secondary hover:text-white hover:bg-surface-secondary transition-colors rounded-lg"
            >
              <FolderOpen size={16} />
              <span>Open Saved Projects</span>
            </button>
            <label className="flex items-center gap-2 px-4 py-2 text-sm text-content-secondary hover:text-white hover:bg-surface-secondary transition-colors rounded-lg cursor-pointer">
              <FileUp size={16} />
              <span>Import .vrs</span>
              <input type="file" accept=".vrs" onChange={onImportFile} className="hidden" />
            </label>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-edge"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-surface text-xs text-content-muted uppercase tracking-wider">
              or start new
            </span>
          </div>
        </div>

        {/* Upload and Manual Entry - Equal prominence */}
        <div className="grid grid-cols-2 gap-3">
          {/* Upload file */}
          <label className="flex flex-col items-center justify-center p-6 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500 border-dashed rounded-2xl cursor-pointer transition-all group">
            <Upload
              size={28}
              className="text-content-muted group-hover:text-blue-400 mb-3 transition-colors"
            />
            <span className="text-sm font-semibold text-white mb-1">Upload File</span>
            <span className="text-xs text-content-muted text-center">CSV or Excel</span>
            <input type="file" accept=".csv,.xlsx" onChange={onFileUpload} className="hidden" />
          </label>

          {/* Manual entry */}
          <button
            onClick={onOpenManualEntry}
            className="flex flex-col items-center justify-center p-6 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500 rounded-2xl transition-all group"
          >
            <PenLine
              size={28}
              className="text-content-muted group-hover:text-blue-400 mb-3 transition-colors"
            />
            <span className="text-sm font-semibold text-white mb-1">Enter Manually</span>
            <span className="text-xs text-content-muted text-center">Paste from Excel</span>
          </button>
        </div>

        {/* Session warning - PWA is demo only */}
        <SessionWarning onUpgradeClick={onOpenSettings} />

        {/* Sample datasets section - collapsed */}
        <SampleSection onLoadSample={onLoadSample} variant="installed" />
      </div>
    </div>
  );
};

export default HomeScreen;
