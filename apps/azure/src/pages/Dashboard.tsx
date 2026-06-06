import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { normalizeProcessHubId } from '@variscout/core';
import type {
  ProcessHub,
  ProcessStepCapabilityMember,
  ProcessStepCapabilitySource,
} from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import { useStorage, type CloudProject, downloadFileFromGraph } from '../services/storage';
import { useNewHubProvision } from '../features/hubCreation/useNewHubProvision';
import { useUnsavedHubsStore } from '../features/hubs/unsavedHubsStore';
import { getEasyAuthUser } from '../auth/easyAuth';
import { RefreshCw, Cloud, CloudOff, FolderOpen, Search, FlaskConical } from 'lucide-react';
import { FileBrowseButton, type FilePickerResult } from '../components/FileBrowseButton';
import ProjectCard from '../components/ProjectCard';
import ProcessHubEvidencePanel from '../components/ProcessHubEvidencePanel';
import ProcessHubView from '../components/ProcessHubView';
import SampleDataPicker from '../components/SampleDataPicker';

interface DashboardProps {
  onOpenProject: (id?: string, processHubId?: string, startPaste?: boolean) => void;
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
  const { listProjects, listProcessHubs, saveProcessHub, loadProject, saveProject, syncStatus } =
    useStorage();

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

  // Sort by recency — newest activity first (work-item sort keys shed per spec §3)
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aModified = new Date(a.modified).getTime();
      const bModified = new Date(b.modified).getTime();
      return bModified - aModified;
    });
  }, [projects]);

  const selectedHub = useMemo(
    () => processHubs.find(hub => hub.id === selectedHubId),
    [processHubs, selectedHubId]
  );

  const capabilitySource = useMemo<ProcessStepCapabilitySource | undefined>(() => {
    if (!selectedHub) return undefined;
    return {
      hub: selectedHub,
      members: sortedProjects
        .filter(p => normalizeProcessHubId(p.metadata?.processHubId) === selectedHub.id)
        .map(p => ({ id: p.id || p.name, name: p.name, metadata: p.metadata })),
    };
  }, [selectedHub, sortedProjects]);

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

  /**
   * Persist a mutated per-step capability member back to storage.
   * The member is a lightweight projection of the underlying project;
   * we load the full project, merge the updated metadata fields (nodeMappings,
   * migrationDeclinedAt), then save it back. Fires-and-forgets; refreshes the
   * project list on success.
   */
  const handlePersistInvestigation = useCallback(
    (next: ProcessStepCapabilityMember): void => {
      const projectMeta = projects.find(p => (p.id || p.name) === next.id);
      if (!projectMeta) return;
      void (async () => {
        try {
          const project = await loadProject(projectMeta.name, projectMeta.location);
          if (!project) return;
          const existingContext = project.project.processContext ?? {};
          const updatedMeta = next.metadata
            ? {
                ...existingContext,
                ...(next.metadata.nodeMappings !== undefined
                  ? { nodeMappings: next.metadata.nodeMappings }
                  : {}),
                ...(next.metadata.migrationDeclinedAt !== undefined
                  ? { migrationDeclinedAt: next.metadata.migrationDeclinedAt }
                  : {}),
              }
            : existingContext;
          await saveProject(
            {
              ...project,
              project: {
                ...project.project,
                processContext: updatedMeta,
              },
            },
            projectMeta.name,
            projectMeta.location
          );
          await loadProjects();
        } catch (err) {
          console.error('[Dashboard] persistInvestigation failed:', err);
        }
      })();
    },
    [projects, loadProject, saveProject, loadProjects]
  );

  // Word-style hub writes (FSJ-3a, spec §3) — mirrors Editor.tsx commitHubChange:
  // unsaved hubs mutate in-memory; persisted hubs keep the optimistic-update +
  // immediate saveProcessHub.
  // Intentional divergence: sync + explicit error log here vs Editor's async — both fire-and-forget at call sites.
  const commitHubChange = useCallback(
    (updated: ProcessHub) => {
      const unsaved = useUnsavedHubsStore.getState();
      if (unsaved.isUnsaved(updated.id)) {
        unsaved.upsertHub(updated);
        return;
      }
      setCatalogHubs(prev => prev.map(h => (h.id === updated.id ? updated : h)));
      void saveProcessHub(updated).catch(err => {
        console.error('[Dashboard] hub commit failed:', err);
      });
    },
    [saveProcessHub]
  );

  /**
   * Persist a hub-level Cpk target default. Writes to
   * `processHub.reviewSignal.capability.cpkTarget` — the "hub" level of the
   * Cpk-target cascade (see capability-target-cascade.md). Mirrors the
   * `setMeasureSpec(column, partial)` partial-update pattern used at the
   * column level. `undefined` clears the hub-level default.
   */
  const handleHubCpkTargetCommit = useCallback(
    (hubId: string, next: number | undefined): void => {
      const hub = processHubs.find(h => h.id === hubId);
      if (!hub) return;
      const prevSignal = hub.reviewSignal;
      const prevCapability = prevSignal?.capability;
      const nextCapability =
        next === undefined
          ? prevCapability
            ? { ...prevCapability, cpkTarget: undefined }
            : undefined
          : {
              ...(prevCapability ?? { outOfSpecPercentage: 0 }),
              cpkTarget: next,
            };
      const nextSignal = prevSignal
        ? { ...prevSignal, capability: nextCapability }
        : nextCapability
          ? {
              rowCount: 0,
              outcome: '',
              computedAt: new Date().toISOString(),
              changeSignals: {
                total: 0,
                outOfControlCount: 0,
                nelsonRule2Count: 0,
                nelsonRule3Count: 0,
              },
              capability: nextCapability,
            }
          : undefined;
      const updated: ProcessHub = {
        ...hub,
        reviewSignal: nextSignal,
        updatedAt: Date.now(),
      };
      commitHubChange(updated);
    },
    [processHubs, commitHubChange]
  );

  /**
   * Persist an inline goal-narrative edit from GoalBanner back to the Hub.
   * Mirrors handleHubCpkTargetCommit's optimistic-update + async-save pattern.
   */
  const handleHubGoalChange = useCallback(
    (hubId: string, nextGoal: string): void => {
      const hub = processHubs.find(h => h.id === hubId);
      if (!hub) return;
      const updated: ProcessHub = {
        ...hub,
        processGoal: nextGoal,
        updatedAt: Date.now(),
      };
      commitHubChange(updated);
    },
    [processHubs, commitHubChange]
  );

  /**
   * "Edit framing" / "Add framing" CTA: re-open the Editor on the hub's
   * analyze to surface HubCreationFlow. For incomplete Hubs this
   * opens a new Editor entry (Mode B); for complete Hubs it could be used
   * to re-enter Stage 3.  We navigate via onOpenProject with the hub id so
   * the Editor picks up the existing Hub context.
   */
  const handleEditFraming = useCallback(
    (hubId: string): void => {
      // startPaste=true so the Editor opens directly into PasteScreen
      // rather than stopping at EditorEmptyState.
      onOpenProject(undefined, hubId, true);
    },
    [onOpenProject]
  );

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
   * as the fallback name. onCreated updates processHubs + selectedHubId so
   * ProcessHubView's empty-state panel picks up the new hub immediately.
   */
  const handleCreateHub = useCallback(async (): Promise<void> => {
    // Pass empty narrative — extractHubName returns '' → useNewHubProvision falls back to 'Untitled hub'
    await createHubFromGoal('');
  }, [createHubFromGoal]);

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
          <h2 className="text-2xl font-bold text-content">Process Hubs</h2>
          <p className="text-content-secondary text-sm mt-1">
            Scan process contexts and the analyzes inside them
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
          New Hub
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
            placeholder="Search analyzes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={loadProjects}
          disabled={isLoading}
          className="p-2 text-content-secondary hover:text-content hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          title="Refresh analyzes"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Process Hub List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="text-content-muted animate-spin" />
        </div>
      ) : sortedProjects.length === 0 && processHubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-content-muted mb-4" />
          <h3 className="text-lg font-medium text-content mb-2">
            {projects.length === 0 ? 'No analyzes yet' : 'No matching analyzes'}
          </h3>
          <p className="text-content-secondary text-sm max-w-md">
            {projects.length === 0
              ? 'Create your first analyze to start exploring variation data with your team.'
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
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-content">Process Hubs</h3>
            </div>
            <select
              aria-label="Select process hub"
              value={selectedHubId ?? ''}
              onChange={e => setSelectedHubId(e.target.value || null)}
              className="w-full max-w-md rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content"
            >
              <option value="">All process hubs</option>
              {processHubs.map(hub => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </section>

          {selectedHub && capabilitySource && (
            <>
              <ProcessHubView
                source={capabilitySource}
                persistInvestigation={handlePersistInvestigation}
                onHubCpkTargetCommit={handleHubCpkTargetCommit}
                onHubGoalChange={handleHubGoalChange}
                onEditFraming={handleEditFraming}
              />
              <ProcessHubEvidencePanel hubId={selectedHub.id} />
            </>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-content">
              {selectedHub ? `Investigations in ${selectedHub.name}` : 'Investigations'}
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
