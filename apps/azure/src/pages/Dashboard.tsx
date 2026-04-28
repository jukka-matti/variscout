import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DEFAULT_PROCESS_HUB_ID,
  buildProcessHubRollups,
  hasTeamFeatures,
  normalizeProcessHubId,
} from '@variscout/core';
import type { ProcessHub, SustainmentRecord, ControlHandoff } from '@variscout/core';
import type { EvidenceSnapshot } from '@variscout/core';
import type {
  ProcessStateItem,
  ProcessStateNote,
  ProcessStateNoteKind,
  ResponsePathAction,
} from '@variscout/core';
import { actionToHref } from '../lib/processHubRoutes';
import { safeTrackEvent } from '../lib/appInsights';
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
import ProcessHubCard from '../components/ProcessHubCard';
import ProcessHubEvidencePanel from '../components/ProcessHubEvidencePanel';
import ProcessHubReviewPanel from '../components/ProcessHubReviewPanel';
import SampleDataPicker from '../components/SampleDataPicker';
import StateItemNotesDrawer from '../components/StateItemNotesDrawer';

interface DashboardProps {
  onOpenProject: (id?: string, processHubId?: string) => void;
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
  const {
    listProjects,
    listProcessHubs,
    saveProcessHub,
    loadProject,
    saveProject,
    listEvidenceSources,
    listEvidenceSnapshots,
    listSustainmentRecords,
    listControlHandoffs,
    syncStatus,
  } = useStorage();

  const [userId, setUserId] = useState('local');
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [processHubs, setProcessHubs] = useState<ProcessHub[]>([]);
  const [evidenceSnapshots, setEvidenceSnapshots] = useState<EvidenceSnapshot[]>([]);
  const [sustainmentRecords, setSustainmentRecords] = useState<SustainmentRecord[]>([]);
  const [controlHandoffs, setControlHandoffs] = useState<ControlHandoff[]>([]);
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSamplePickerOpen, setIsSamplePickerOpen] = useState(false);
  const [notesDrawerState, setNotesDrawerState] = useState<
    | { mode: 'add'; item: ProcessStateItem; hubId: string }
    | { mode: 'edit'; item: ProcessStateItem; note: ProcessStateNote; hubId: string }
    | null
  >(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

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
      setProcessHubs(hubList);
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

  const loadEvidenceForHub = useCallback(
    async (hubId: string): Promise<void> => {
      try {
        const sources = await listEvidenceSources(hubId);
        const snapshotLists = await Promise.all(
          sources.map(source => listEvidenceSnapshots(hubId, source.id).catch(() => []))
        );
        setEvidenceSnapshots(snapshotLists.flat());
      } catch (error) {
        console.error('Failed to load evidence for hub:', error);
        setEvidenceSnapshots([]);
      }
    },
    [listEvidenceSources, listEvidenceSnapshots]
  );

  const loadSustainmentForHub = useCallback(
    async (hubId: string): Promise<void> => {
      try {
        const [records, handoffs] = await Promise.all([
          listSustainmentRecords(hubId),
          listControlHandoffs(hubId),
        ]);
        setSustainmentRecords(records);
        setControlHandoffs(handoffs);
      } catch (error) {
        console.error('Failed to load sustainment for hub:', error);
        setSustainmentRecords([]);
        setControlHandoffs([]);
      }
    },
    [listSustainmentRecords, listControlHandoffs]
  );

  useEffect(() => {
    if (!selectedHubId) {
      setEvidenceSnapshots([]);
      setSustainmentRecords([]);
      setControlHandoffs([]);
      return;
    }
    loadEvidenceForHub(selectedHubId);
    loadSustainmentForHub(selectedHubId);
  }, [selectedHubId, loadEvidenceForHub, loadSustainmentForHub]);

  // Sort projects: overdue tasks first, then assigned tasks, then by modified date
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
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
  }, [projects]);

  const hubRollups = useMemo(() => {
    return buildProcessHubRollups(
      processHubs,
      sortedProjects.map(project => ({
        id: project.id || project.name,
        name: project.name,
        modified: project.modified,
        metadata: project.metadata,
      })),
      { evidenceSnapshots, sustainmentRecords, controlHandoffs }
    );
  }, [evidenceSnapshots, sustainmentRecords, controlHandoffs, processHubs, sortedProjects]);

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

  const selectedHubRollup = hubRollups.find(rollup => rollup.hub.id === selectedHubId);
  const selectedHub = selectedHubRollup?.hub ?? processHubs.find(hub => hub.id === selectedHubId);

  const handleSetupSustainment = useCallback(
    (investigationId: string) => {
      onOpenProject(investigationId);
    },
    [onOpenProject]
  );

  const handleLogReview = useCallback(
    (recordId: string) => {
      const record = sustainmentRecords.find(r => r.id === recordId);
      if (record) onOpenProject(record.investigationId);
    },
    [sustainmentRecords, onOpenProject]
  );

  const handleRecordHandoff = useCallback(
    (investigationId: string) => {
      onOpenProject(investigationId);
    },
    [onOpenProject]
  );

  const handleResponsePathAction = useCallback(
    (item: ProcessStateItem, action: ResponsePathAction, hubId: string) => {
      const href = actionToHref(action);
      if (!href) return; // unsupported

      safeTrackEvent('process_hub.response_path_click', {
        hubId,
        responsePath: item.responsePath,
        lens: item.lens,
        severity: item.severity,
      });

      // Dashboard already exposes onOpenProject for investigation navigation.
      // For now, route through that callback by extracting the investigation
      // id from the action. Full URL routing (intent + sustainment surface
      // query params) is a follow-up — see plan PR #4 Task 12 note.
      if (action.kind === 'open-investigation' || action.kind === 'open-sustainment') {
        onOpenProject(action.investigationId);
      }
    },
    [onOpenProject, safeTrackEvent]
  );

  const handleRequestAddNote = useCallback((item: ProcessStateItem, hubId: string) => {
    setNotesDrawerState({ mode: 'add', item, hubId });
  }, []);

  const handleRequestEditNote = useCallback(
    (item: ProcessStateItem, note: ProcessStateNote, hubId: string) => {
      setNotesDrawerState({ mode: 'edit', item, note, hubId });
    },
    []
  );

  const handleSaveNote = useCallback(
    async (kind: ProcessStateNoteKind, text: string) => {
      if (!notesDrawerState) return;
      if (isSavingNote) return;
      setIsSavingNote(true);
      try {
        const { item, hubId } = notesDrawerState;
        // Find a target investigation: prefer item's first linked, fall back to
        // the most-recent investigation in the hub.
        const hubProjects = projects.filter(
          p => normalizeProcessHubId(p.metadata?.processHubId) === normalizeProcessHubId(hubId)
        );
        const targetInvestigationId =
          item.investigationIds?.[0] ??
          hubProjects.sort((a, b) => (b.modified ?? '').localeCompare(a.modified ?? ''))[0]?.id;
        if (!targetInvestigationId) {
          setNotesDrawerState(null);
          return;
        }
        // Find the project for loadProject (it takes name + location)
        const targetProjectMeta = hubProjects.find(p => p.id === targetInvestigationId);
        if (!targetProjectMeta) {
          setNotesDrawerState(null);
          return;
        }
        const project = await loadProject(targetProjectMeta.name, targetProjectMeta.location);
        if (!project) {
          setNotesDrawerState(null);
          return;
        }
        // Project is `unknown`; access processContext safely
        const p = project as Record<string, unknown>;
        const processContext =
          p.processContext && typeof p.processContext === 'object'
            ? (p.processContext as Record<string, unknown>)
            : {};
        const existingNotes = Array.isArray(processContext.stateNotes)
          ? (processContext.stateNotes as ProcessStateNote[])
          : [];
        const nowIso = new Date().toISOString();

        let nextNotes: ProcessStateNote[];
        if (notesDrawerState.mode === 'add') {
          const newNote: ProcessStateNote = {
            id: `note-${crypto.randomUUID()}`,
            itemId: item.id,
            kind,
            text,
            author: userId,
            createdAt: nowIso,
          };
          nextNotes = [...existingNotes, newNote];
          safeTrackEvent('process_hub.state_note_added', {
            hubId,
            kind,
            severity: item.severity,
            lens: item.lens,
          });
        } else {
          // mode === 'edit'
          const noteId = notesDrawerState.note.id;
          nextNotes = existingNotes.map(n =>
            n.id === noteId ? { ...n, text, kind, updatedAt: nowIso } : n
          );
          safeTrackEvent('process_hub.state_note_edited', { hubId, kind });
        }

        const nextProject = {
          ...p,
          processContext: {
            ...processContext,
            stateNotes: nextNotes,
          },
        };
        await saveProject(nextProject, targetProjectMeta.name, targetProjectMeta.location);
        await loadProjects();
      } catch (err) {
        console.error('[Dashboard] State note save failed:', err);
        // Keep the drawer open so the user can retry.
        return;
      } finally {
        setIsSavingNote(false);
      }
      setNotesDrawerState(null);
    },
    [notesDrawerState, isSavingNote, projects, loadProject, saveProject, userId, loadProjects]
  );

  const handleDeleteNote = useCallback(
    async (item: ProcessStateItem, noteId: string, hubId: string) => {
      if (isSavingNote) return;
      setIsSavingNote(true);
      try {
        const hubProjects = projects.filter(
          p => normalizeProcessHubId(p.metadata?.processHubId) === normalizeProcessHubId(hubId)
        );
        const targetInvestigationId =
          item.investigationIds?.[0] ??
          hubProjects.sort((a, b) => (b.modified ?? '').localeCompare(a.modified ?? ''))[0]?.id;
        if (!targetInvestigationId) return;
        const targetProjectMeta = hubProjects.find(p => p.id === targetInvestigationId);
        if (!targetProjectMeta) return;
        const project = await loadProject(targetProjectMeta.name, targetProjectMeta.location);
        if (!project) return;
        const p = project as Record<string, unknown>;
        const processContext =
          p.processContext && typeof p.processContext === 'object'
            ? (p.processContext as Record<string, unknown>)
            : {};
        const existingNotes = Array.isArray(processContext.stateNotes)
          ? (processContext.stateNotes as ProcessStateNote[])
          : [];
        const note = existingNotes.find(n => n.id === noteId);
        if (!note) return;
        const nextNotes = existingNotes.filter(n => n.id !== noteId);
        const nextProject = {
          ...p,
          processContext: {
            ...processContext,
            stateNotes: nextNotes,
          },
        };
        await saveProject(nextProject, targetProjectMeta.name, targetProjectMeta.location);
        safeTrackEvent('process_hub.state_note_deleted', { hubId, kind: note.kind });
        await loadProjects();
      } catch (err) {
        console.error('[Dashboard] State note delete failed:', err);
      } finally {
        setIsSavingNote(false);
      }
    },
    [isSavingNote, projects, loadProject, saveProject, loadProjects]
  );

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

  const handleCreateHub = async (): Promise<void> => {
    const name = window.prompt('Process Hub name');
    const trimmed = name?.trim();
    if (!trimmed) return;
    const id = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const now = new Date().toISOString();
    const hub: ProcessHub = { id: id || `hub-${Date.now()}`, name: trimmed, createdAt: now };
    await saveProcessHub(hub);
    setSelectedHubId(hub.id);
    await loadProjects();
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
          <h2 className="text-2xl font-bold text-content">Process Hubs</h2>
          <p className="text-content-secondary text-sm mt-1">
            Scan process contexts and the investigations inside them
          </p>
        </div>
        <div className="flex items-center gap-3">{hasTeamFeatures() && getSyncStatusDisplay()}</div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => onOpenProject(undefined, selectedHubId ?? DEFAULT_PROCESS_HUB_ID)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium sm:w-auto w-full"
        >
          <Plus size={18} />
          New Investigation
        </button>
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
            placeholder="Search investigations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={loadProjects}
          disabled={isLoading}
          className="p-2 text-content-secondary hover:text-content hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          title="Refresh investigations"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Process Hub List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="text-content-muted animate-spin" />
        </div>
      ) : sortedProjects.length === 0 && hubRollups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-content-muted mb-4" />
          <h3 className="text-lg font-medium text-content mb-2">
            {projects.length === 0 ? 'No investigations yet' : 'No matching investigations'}
          </h3>
          <p className="text-content-secondary text-sm max-w-md">
            {projects.length === 0
              ? 'Create your first investigation to start exploring variation data with your team.'
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          {projects.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={() => onOpenProject(undefined, selectedHubId ?? DEFAULT_PROCESS_HUB_ID)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                New Investigation
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
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-content">Process Hubs</h3>
              {selectedHubId && (
                <button
                  type="button"
                  onClick={() => setSelectedHubId(null)}
                  className="text-xs text-content-secondary hover:text-content"
                >
                  Show all investigations
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {hubRollups.map(rollup => (
                <ProcessHubCard
                  key={rollup.hub.id}
                  rollup={rollup}
                  isSelected={selectedHubId === rollup.hub.id}
                  onOpen={() => setSelectedHubId(rollup.hub.id)}
                  onStartInvestigation={() => onOpenProject(undefined, rollup.hub.id)}
                />
              ))}
            </div>
          </section>

          {selectedHubRollup && (
            <>
              <ProcessHubReviewPanel
                rollup={selectedHubRollup}
                onOpenInvestigation={id => onOpenProject(id)}
                onStartInvestigation={() => onOpenProject(undefined, selectedHubRollup.hub.id)}
                onSetupSustainment={handleSetupSustainment}
                onLogReview={handleLogReview}
                onRecordHandoff={handleRecordHandoff}
                onResponsePathAction={handleResponsePathAction}
                onRequestAddNote={handleRequestAddNote}
                onRequestEditNote={handleRequestEditNote}
                onDeleteNote={handleDeleteNote}
                currentUserId={userId}
              />
              <ProcessHubEvidencePanel
                hubId={selectedHubRollup.hub.id}
                onEvidenceChanged={() => loadEvidenceForHub(selectedHubRollup.hub.id)}
              />
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

      {/* Team notes drawer — overlays the review panel */}
      {notesDrawerState && (
        <StateItemNotesDrawer
          open={true}
          initialKind={notesDrawerState.mode === 'edit' ? notesDrawerState.note.kind : 'question'}
          initialText={notesDrawerState.mode === 'edit' ? notesDrawerState.note.text : ''}
          onSave={handleSaveNote}
          onCancel={() => setNotesDrawerState(null)}
          disabled={isSavingNote}
        />
      )}
    </div>
  );
};
