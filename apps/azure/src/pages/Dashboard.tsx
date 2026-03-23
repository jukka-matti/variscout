import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { hasTeamFeatures } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import { useStorage, type CloudProject, downloadFileFromGraph } from '../services/storage';
import { getEasyAuthUser } from '../auth/easyAuth';
import {
  Plus,
  RefreshCw,
  Cloud,
  CloudOff,
  FolderOpen,
  Search,
  FlaskConical,
  Upload,
} from 'lucide-react';
import { FileBrowseButton, type FilePickerResult } from '../components/FileBrowseButton';
import ProjectCard from '../components/ProjectCard';
import SampleDataPicker from '../components/SampleDataPicker';

interface DashboardProps {
  onOpenProject: (id?: string) => void;
  /** Load a .vrs project file (from SharePoint download) */
  onLoadProjectFile?: (file: File) => void;
  /** Load a sample dataset directly into a new analysis */
  onLoadSample?: (sample: SampleDataset) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenProject,
  onLoadProjectFile,
  onLoadSample,
}) => {
  const { listProjects, syncStatus } = useStorage();

  const [userId, setUserId] = useState('local');
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSamplePickerOpen, setIsSamplePickerOpen] = useState(false);

  // Fetch current user ID for task ownership display
  useEffect(() => {
    getEasyAuthUser().then(user => {
      if (user?.userId) setUserId(user.userId);
    });
  }, []);

  const handleOpenFromSharePoint = useCallback(
    async (items: FilePickerResult[]) => {
      const item = items[0];
      if (!item || !onLoadProjectFile) return;
      try {
        const file = await downloadFileFromGraph(
          item['@sharePoint.endpoint'],
          item.parentReference.driveId,
          item.id
        );
        onLoadProjectFile(file);
      } catch (err) {
        console.error('[Dashboard] SharePoint project open failed:', err);
      }
    },
    [onLoadProjectFile]
  );

  // Load projects on mount
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const projectList = await listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort projects: overdue tasks first, then assigned tasks, then by modified date
  const sortedProjects = useMemo(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      // 1. Has overdue tasks first
      const aHasOverdue = a.metadata?.hasOverdueTasks ?? false;
      const bHasOverdue = b.metadata?.hasOverdueTasks ?? false;
      if (aHasOverdue !== bHasOverdue) return aHasOverdue ? -1 : 1;

      // 2. Has assigned tasks
      const aHasTasks = (a.metadata?.assignedTaskCount ?? 0) > 0;
      const bHasTasks = (b.metadata?.assignedTaskCount ?? 0) > 0;
      if (aHasTasks !== bHasTasks) return aHasTasks ? -1 : 1;

      // 3. Recently modified
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });
  }, [projects, searchQuery]);

  const handleSampleSelect = (sample: SampleDataset): void => {
    if (onLoadSample) {
      onLoadSample(sample);
    } else {
      // Fallback: open a new analysis (user will pick sample from EditorEmptyState)
      onOpenProject();
    }
  };

  // Native file input for Standard plan "Open from Computer"
  const handleLocalFileOpen = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vrs';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file && onLoadProjectFile) {
        onLoadProjectFile(file);
      }
    };
    input.click();
  };

  // Get sync status display
  const getSyncStatusDisplay = (): React.ReactNode => {
    const isOnline = navigator.onLine;
    const Icon = isOnline ? Cloud : CloudOff;
    const color =
      syncStatus.status === 'synced'
        ? 'text-green-400'
        : syncStatus.status === 'syncing'
          ? 'text-blue-400'
          : 'text-content-muted';

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary/50 ${color}`}
      >
        <Icon size={16} className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''} />
        <span className="text-sm">
          {syncStatus.status === 'syncing' ? 'Syncing...' : isOnline ? 'Connected' : 'Offline'}
        </span>
        {syncStatus.pendingChanges && syncStatus.pendingChanges > 0 && (
          <span className="text-xs text-amber-400">({syncStatus.pendingChanges} pending)</span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-content">Analyses</h2>
          <p className="text-content-secondary text-sm mt-1">Manage your saved analyses</p>
        </div>
        <div className="flex items-center gap-3">{hasTeamFeatures() && getSyncStatusDisplay()}</div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => onOpenProject()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium sm:w-auto w-full"
        >
          <Plus size={18} />
          New Analysis
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSamplePickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-edge rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors font-medium"
          >
            <FlaskConical size={16} />
            Try a Sample
          </button>
          {hasTeamFeatures() && onLoadProjectFile ? (
            <FileBrowseButton
              mode="files"
              filters={['.vrs']}
              onPick={handleOpenFromSharePoint}
              label="Open from SharePoint"
              size="sm"
            />
          ) : onLoadProjectFile ? (
            <button
              onClick={handleLocalFileOpen}
              className="flex items-center gap-2 px-4 py-2 border border-edge rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors font-medium"
            >
              <Upload size={16} />
              Open File
            </button>
          ) : null}
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
          />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={loadProjects}
          disabled={isLoading}
          className="p-2 text-content-secondary hover:text-content hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          title="Refresh analyses"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Analyses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="text-content-muted animate-spin" />
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-content-muted mb-4" />
          <h3 className="text-lg font-medium text-content mb-2">
            {projects.length === 0 ? 'No analyses yet' : 'No matching analyses'}
          </h3>
          <p className="text-content-secondary text-sm max-w-md">
            {projects.length === 0
              ? 'Create your first analysis to start exploring variation data with your team.'
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          {projects.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={() => onOpenProject()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                New Analysis
              </button>
              <button
                onClick={() => setIsSamplePickerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-edge rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors font-medium"
              >
                <FlaskConical size={16} />
                Try a Sample
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedProjects.map(project => (
            <ProjectCard
              key={project.id || project.name}
              project={project}
              currentUserId={userId}
              onClick={() => onOpenProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Sample Data Picker Modal */}
      <SampleDataPicker
        isOpen={isSamplePickerOpen}
        onClose={() => setIsSamplePickerOpen(false)}
        onSelectSample={handleSampleSelect}
      />
    </div>
  );
};
