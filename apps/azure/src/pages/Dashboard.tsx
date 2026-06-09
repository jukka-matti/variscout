import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { normalizeProcessHubId } from '@variscout/core';
import type { ProcessHub } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import { deriveWorkspaceViewModel } from '@variscout/hooks';
import { getAnalysisScopeInitialState } from '@variscout/stores';
import { useStorage, type CloudProject, downloadFileFromGraph } from '../services/storage';
import { useNewHubProvision } from '../features/hubCreation/useNewHubProvision';
import { useUnsavedHubsStore } from '../features/hubs/unsavedHubsStore';
import { getEasyAuthUser } from '../auth/easyAuth';
import { RefreshCw, Cloud, CloudOff, FolderOpen, Search, FlaskConical, Play } from 'lucide-react';
import { FileBrowseButton, type FilePickerResult } from '../components/FileBrowseButton';
import ProjectCard from '../components/ProjectCard';
import ProcessHubEvidencePanel from '../components/ProcessHubEvidencePanel';
import SampleDataPicker from '../components/SampleDataPicker';

interface DashboardProps {
  onOpenProject: (id?: string, processHubId?: string, startPaste?: boolean) => void;
  /** Load a .vrs project file (from SharePoint download) */
  onLoadProjectFile?: (file: File) => void;
  /** Load a sample dataset directly into a new analysis */
  onLoadSample?: (sample: SampleDataset) => void;
}

interface DashboardWorkspaceOption {
  workspaceId: string;
  title: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenProject,
  onLoadProjectFile,
  onLoadSample,
}) => {
  const { listProjects, listProcessHubs, syncStatus } = useStorage();

  const [userId, setUserId] = useState('local');
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [catalogHubs, setCatalogHubs] = useState<ProcessHub[]>([]);
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);

  const { createHubFromGoal } = useNewHubProvision({
    onCreated: hub => {
      // DROP append here — the hook already registers in unsavedHubsStore;
      // the merge memo below surfaces it automatically.
      setSelectedHubId(hub.id);
    },
  });

  const unsavedHubs = useUnsavedHubsStore(s => s.hubs);
  // Word-style durability (FSJ-3a, spec §3) — mirrors Editor.tsx's merge: in-memory
  // hubs join the catalog; an id collision prefers the unsaved copy.
  const processHubs = useMemo(() => {
    const unsavedIds = new Set(unsavedHubs.map(h => h.id));
    return [...catalogHubs.filter(h => !unsavedIds.has(h.id)), ...unsavedHubs];
  }, [catalogHubs, unsavedHubs]);
  const workspaceAnalysisScope = useMemo(() => getAnalysisScopeInitialState(), []);
  const workspaces = useMemo<DashboardWorkspaceOption[]>(
    () =>
      processHubs.map(hub => {
        const workspace =
          deriveWorkspaceViewModel({
            hub,
            analysisScope: workspaceAnalysisScope,
          }) ?? null;
        return {
          workspaceId: workspace?.workspaceId ?? hub.id,
          title: workspace?.title ?? hub.name,
        };
      }),
    [processHubs, workspaceAnalysisScope]
  );

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

  const loadProjects = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [projectList, hubList] = await Promise.all([listProjects(), listProcessHubs()]);
      setProjects(projectList);
      setCatalogHubs(hubList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [listProjects, listProcessHubs]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Sort by recency — newest activity first.
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aModified = new Date(a.modified).getTime();
      const bModified = new Date(b.modified).getTime();
      return bModified - aModified;
    });
  }, [projects]);

  const selectedWorkspace = useMemo(
    () => workspaces.find(workspace => workspace.workspaceId === selectedHubId),
    [selectedHubId, workspaces]
  );

  const resumeProject = useMemo(() => {
    if (projects.length === 0) return null;
    return (
      [...projects].sort((a, b) => {
        const aViewed = a.metadata?.lastViewedAt?.[userId] ?? 0;
        const bViewed = b.metadata?.lastViewedAt?.[userId] ?? 0;
        if (aViewed !== bViewed) return bViewed - aViewed;
        return new Date(b.modified).getTime() - new Date(a.modified).getTime();
      })[0] ?? null
    );
  }, [projects, userId]);
  const visibleProjects = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    return sortedProjects.filter(project => {
      const matchesHub =
        !selectedHubId || normalizeProcessHubId(project.metadata?.processHubId) === selectedHubId;
      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearchQuery);
      return matchesHub && matchesSearch;
    });
  }, [searchQuery, selectedHubId, sortedProjects]);

  const handleSampleSelect = (sample: SampleDataset): void => {
    if (onLoadSample) {
      onLoadSample(sample);
    } else {
      // Fallback: open a new analysis (user will pick sample from EditorEmptyState)
      onOpenProject();
    }
  };

  /**
   * Mode B entry — create an incomplete Hub via useNewHubProvision (canonical
   * creator with extractHubName). An empty goal narrative produces 'Untitled hub'
   * as the fallback name. onCreated updates processHubs + selectedHubId so the
   * selector and evidence panel pick up the new hub immediately.
   */
  const handleCreateHub = useCallback(async (): Promise<void> => {
    // Pass empty narrative — extractHubName returns '' → useNewHubProvision falls back to 'Untitled hub'
    await createHubFromGoal('');
  }, [createHubFromGoal]);

  // Get sync status display.
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
          <h2 className="text-2xl font-bold text-content">Home</h2>
          <p className="text-content-secondary text-sm mt-1">
            Resume the last Workspace, start a new one, or open another Workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">{getSyncStatusDisplay()}</div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleCreateHub}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-edge rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors font-medium"
        >
          <FolderOpen size={16} />
          New Workspace
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSamplePickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-edge rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors font-medium"
          >
            <FlaskConical size={16} />
            Try a Sample
          </button>
          {onLoadProjectFile ? (
            <FileBrowseButton
              mode="files"
              filters={['.vrs']}
              onPick={handleOpenFromSharePoint}
              label="Open from SharePoint"
              size="sm"
            />
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
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={loadProjects}
          disabled={isLoading}
          className="p-2 text-content-secondary hover:text-content hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          title="Refresh workspaces"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Workspace List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="text-content-muted animate-spin" />
        </div>
      ) : sortedProjects.length === 0 && processHubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-content-muted mb-4" />
          <h3 className="text-lg font-medium text-content mb-2">
            {projects.length === 0 ? 'No Workspaces yet' : 'No matching Workspaces'}
          </h3>
          <p className="text-content-secondary text-sm max-w-md">
            {projects.length === 0
              ? 'Create your first Workspace to start exploring variation data with your team.'
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          {projects.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
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
        <div className="space-y-6">
          {resumeProject ? (
            <section className="rounded-lg border border-edge bg-surface-secondary p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-content-secondary">
                    Resume last Workspace
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-content">{resumeProject.name}</p>
                  <p className="mt-1 text-sm text-content-secondary">
                    Updated {new Date(resumeProject.modified).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProject(resumeProject.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  data-testid="resume-last-workspace"
                >
                  <Play size={16} />
                  Resume
                </button>
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-content">Open another Workspace</h3>
            </div>
            <select
              aria-label="Filter by Workspace"
              value={selectedHubId ?? ''}
              onChange={e => setSelectedHubId(e.target.value || null)}
              className="w-full max-w-md rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content"
            >
              <option value="">All Workspaces</option>
              {workspaces.map(workspace => (
                <option key={workspace.workspaceId} value={workspace.workspaceId}>
                  {workspace.title}
                </option>
              ))}
            </select>
          </section>

          {selectedWorkspace && <ProcessHubEvidencePanel hubId={selectedWorkspace.workspaceId} />}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-content">
              {selectedWorkspace
                ? `Recent work in ${selectedWorkspace.title}`
                : 'Recent Workspaces'}
            </h3>
            <div className="flex flex-col gap-3">
              {visibleProjects.map(project => (
                <ProjectCard
                  key={project.id || project.name}
                  project={project}
                  currentUserId={userId}
                  onClick={() => onOpenProject(project.id)}
                />
              ))}
            </div>
          </section>
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
