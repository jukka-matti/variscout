// vi.mock calls must be at the module top level, before any imports.
// useNewHubProvision calls getCurrentUser internally; without this mock the
// easyAuth module bindings fail in the jsdom test environment.
vi.mock('../../auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({ name: 'Analyst', email: 'analyst@contoso.com' })),
}));

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import type { CloudProject } from '../../services/storage';
import type { EvidenceSource, ProcessHub } from '@variscout/core';
import { createNewIP } from '@variscout/core/improvementProject';
import { useUnsavedHubsStore } from '../../features/hubs/unsavedHubsStore';

const mockListProjects = vi.fn();
const mockListProcessHubs = vi.fn();
const mockSaveProcessHub = vi.fn();
const mockListEvidenceSources = vi.fn<(hubId: string) => Promise<EvidenceSource[]>>();
const mockListEvidenceSnapshots = vi.fn(() => Promise.resolve([]));
const mockListControlRecords = vi.fn();
const mockListControlHandoffs = vi.fn();

vi.mock('../../services/storage', () => ({
  useStorage: () => ({
    listProjects: mockListProjects,
    listProcessHubs: mockListProcessHubs,
    saveProcessHub: mockSaveProcessHub,
    listEvidenceSources: mockListEvidenceSources,
    saveEvidenceSource: vi.fn(),
    listEvidenceSnapshots: mockListEvidenceSnapshots,
    saveEvidenceSnapshot: vi.fn(),
    listControlRecords: mockListControlRecords,
    listControlHandoffs: mockListControlHandoffs,
    syncStatus: { status: 'synced', message: 'Synced' },
  }),
}));

beforeEach(() => {
  mockListEvidenceSources.mockResolvedValue([]);
  mockListEvidenceSnapshots.mockResolvedValue([]);
  mockListControlRecords.mockResolvedValue([]);
  mockListControlHandoffs.mockResolvedValue([]);
  // Reset Word-style in-memory hub store between tests so unsaved hubs from
  // one test don't leak into the merged processHubs list of the next.
  useUnsavedHubsStore.setState(useUnsavedHubsStore.getInitialState(), true);
});

vi.mock('../../auth/easyAuth', () => ({
  getEasyAuthUser: vi.fn(() => Promise.resolve({ userId: 'local' })),
}));

vi.mock('../../components/SampleDataPicker', () => ({
  default: () => null,
}));

function makeProject(): CloudProject {
  return {
    id: 'line-4-a',
    name: 'Night shift overfill',
    modified: '2026-04-24T00:00:00.000Z',
    location: 'personal',
    metadata: {
      phase: 'analyze',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
      processHubId: 'line-4',
    },
  };
}

function makeVerificationProject(): CloudProject {
  return {
    id: 'line-4-b',
    name: 'Post-action shift check',
    modified: '2026-04-25T00:00:00.000Z',
    location: 'personal',
    metadata: {
      phase: 'improve',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
      processHubId: 'line-4',
    },
  };
}

function makeResolvedProject(): CloudProject {
  return {
    id: 'line-4-c',
    name: 'Nozzle replacement verified',
    modified: '2026-04-26T00:00:00.000Z',
    location: 'personal',
    metadata: {
      phase: 'improve',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
      processHubId: 'line-4',
    },
  };
}

function makeProjectWithId(id: string, name: string, modifiedDay: number): CloudProject {
  return {
    ...makeProject(),
    id,
    name,
    modified: `2026-04-${String(modifiedDay).padStart(2, '0')}T00:00:00.000Z`,
  };
}

function makeHubWithWorkspaceTitle(): ProcessHub {
  return {
    id: 'line-4',
    name: 'Line 4 hub',
    createdAt: 1745539200000,
    updatedAt: 1745539200000,
    deletedAt: null,
    improvementProject: createNewIP({
      id: 'line-4-ip',
      hubId: 'line-4',
      title: 'Line 4 Workspace',
      currentUserId: 'analyst@contoso.com',
      now: () => 1745539200000,
    }),
  };
}

async function selectHub(hubId: string): Promise<void> {
  fireEvent.change(screen.getByLabelText('Filter by Workspace'), { target: { value: hubId } });
}

describe('Dashboard Workspace home', () => {
  it('offers resume-last Workspace for the most recently modified project', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([makeProject(), makeVerificationProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByTestId('resume-last-workspace');
    expect(screen.getAllByText('Post-action shift check').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByTestId('resume-last-workspace'));
    expect(onOpenProject).toHaveBeenCalledWith('line-4-b');
  });

  it('prefers the current user last-viewed Workspace over modified recency', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([
      {
        ...makeProject(),
        metadata: {
          ...makeProject().metadata!,
          lastViewedAt: { local: 200 },
        },
      },
      {
        ...makeVerificationProject(),
        metadata: {
          ...makeVerificationProject().metadata!,
          lastViewedAt: { local: 100 },
        },
      },
    ]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByTestId('resume-last-workspace');
    expect(screen.getAllByText('Night shift overfill').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByTestId('resume-last-workspace'));
    expect(onOpenProject).toHaveBeenCalledWith('line-4-a');
  });

  it('keeps more than five Workspaces discoverable in open-another list', async () => {
    mockListProjects.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) =>
        makeProjectWithId(`workspace-${index + 1}`, `Workspace ${index + 1}`, 20 + index)
      )
    );
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Workspace 1');
    expect(screen.getAllByText('Workspace 6').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('project-card')).toHaveLength(6);
  });

  it('renders a Workspace filter and starts work in a Workspace via the project card', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'general-unassigned', name: 'General / Unassigned', createdAt: 0, deletedAt: null },
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByLabelText('Filter by Workspace');
    expect(screen.getAllByText('Night shift overfill').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getAllByTestId('project-card')[0]!);
    await waitFor(() => expect(onOpenProject).toHaveBeenCalledWith('line-4-a'));
  });

  // IM-0a: the Workspace-card grid + the per-card "Start work in <name>" / "Open
  // <name>" affordances retire in PO-4. A minimal <select> replaces them.
  // Negative control: guard against accidental re-introduction.
  it('renders no Workspace cards and no start-analyze affordance (IM-0a)', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Filter by Workspace'); // survivor present
    expect(screen.queryByTestId('process-Workspace-card')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start work in/ })).not.toBeInTheDocument();
  });

  it('uses the Workspace title in the Workspace filter when it differs from storage name', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([makeHubWithWorkspaceTitle()]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Filter by Workspace');
    expect(screen.getByRole('option', { name: 'Line 4 Workspace' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Line 4 hub' })).not.toBeInTheDocument();
  });

  // CS-P2: the Dashboard-side 2x2 capability host is retired. The selector and
  // evidence panel remain; per-step capability lives on the shared editor Canvas.
  it('does not mount the retired Dashboard Workspace capability surface', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([
      makeProject(),
      makeVerificationProject(),
      makeResolvedProject(),
    ]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByLabelText('Filter by Workspace');
    await selectHub('line-4');

    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalledWith('line-4'));
    expect(screen.queryByTestId('process-hub-surface')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /Current Process State/i })
    ).not.toBeInTheDocument(); // the retired surface must NOT come back
  });

  it('keeps the Workspace filter visible when search filters the Workspace list', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Filter by Workspace');
    await selectHub('line-4');
    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalledWith('line-4'));

    fireEvent.change(screen.getByPlaceholderText('Search workspaces...'), {
      target: { value: 'zzzz no matching project' },
    });

    expect(screen.getByLabelText('Filter by Workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('process-hub-surface')).not.toBeInTheDocument();
    expect(screen.queryByTestId('project-card')).not.toBeInTheDocument();
  });

  it('does not mount the retired capability host for a selected Workspace without investigations', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Filter by Workspace');
    await selectHub('line-4');

    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalledWith('line-4'));
    expect(screen.queryByTestId('process-hub-surface')).not.toBeInTheDocument();
  });

  it('mounts the EvidencePanel only once a hub is selected', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
      { id: 'line-5', name: 'Line 5', createdAt: 1745539200000, deletedAt: null },
    ]);
    mockListEvidenceSources.mockClear();

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Filter by Workspace');
    // No Workspace selected → EvidencePanel not mounted → no evidence-source reads.
    expect(mockListEvidenceSources).not.toHaveBeenCalled();

    await selectHub('line-5');

    // The mounted ProcessHubEvidencePanel self-loads its own sources for the
    // selected Workspace.
    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalled());
    const calledHubIds = new Set(mockListEvidenceSources.mock.calls.map(call => call[0]));
    expect(calledHubIds).toEqual(new Set(['line-5']));
  });

  it('New Workspace button creates an incomplete Workspace via useNewHubProvision without window.prompt', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([]);
    mockSaveProcessHub.mockResolvedValue(undefined);

    render(<Dashboard onOpenProject={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Home')).toBeInTheDocument());

    // No window.prompt should be called
    const promptSpy = vi.spyOn(window, 'prompt');

    fireEvent.click(screen.getByText('New Workspace'));

    // Word-style durability (FSJ-3a, spec §3): eager persist is retired.
    // Negative control: saveProcessHub must NOT be called on New Workspace click.
    await waitFor(() => expect(useUnsavedHubsStore.getState().hubs).toHaveLength(1));
    expect(mockSaveProcessHub).not.toHaveBeenCalled();

    // The created hub is registered in-memory with the expected shape.
    const createdHub = useUnsavedHubsStore.getState().hubs[0];
    // useNewHubProvision uses extractHubName('') → '' → fallback 'Untitled hub'
    expect(createdHub.name).toBe('Untitled hub');
    // Incomplete — no processGoal
    expect(createdHub.processGoal).toBeUndefined();
    // ensureHubProject runs when getCurrentUser resolves → improvementProject present
    expect(createdHub.improvementProject).toBeTruthy();
    expect(createdHub.improvementProject?.metadata.title).toBe('Untitled project');

    // The hub surfaces in the rendered select via the catalog∪unsaved merge.
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Untitled project' })).toBeInTheDocument()
    );

    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it('does not render the retired Dashboard framing prompt for an incomplete hub', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);
    mockSaveProcessHub.mockClear();
    mockSaveProcessHub.mockResolvedValue(undefined);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Filter by Workspace');
    await selectHub('line-4');

    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalledWith('line-4'));
    expect(screen.queryByTestId('process-hub-surface')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hub-framing-prompt')).not.toBeInTheDocument();
  });
});
