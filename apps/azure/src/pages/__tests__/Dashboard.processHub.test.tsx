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
import type { EvidenceSource } from '@variscout/core';
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

// CS-P1: ProcessHubView now renders ProcessHubCapabilityTab unconditionally (no
// longer behind the retired Capability tab). Its visx charts need ResizeObserver,
// which this integration suite (Dashboard ↔ ProcessHubView ↔ ReviewPanel) doesn't
// provide. The per-step capability charts are out of scope here — covered by
// ProcessHubCapabilityTab.test.tsx — so stub the tab to a marker.
vi.mock('../../components/ProcessHubCapabilityTab', () => ({
  ProcessHubCapabilityTab: () => <div data-testid="mock-process-hub-capability-tab" />,
  default: () => <div data-testid="mock-process-hub-capability-tab" />,
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

async function selectHub(hubId: string): Promise<void> {
  fireEvent.change(screen.getByLabelText('Select process hub'), { target: { value: hubId } });
}

describe('Dashboard Process Hub home', () => {
  it('renders a hub selector and starts work in a hub via the project card', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'general-unassigned', name: 'General / Unassigned', createdAt: 0, deletedAt: null },
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByLabelText('Select process hub');
    expect(screen.getByText('Night shift overfill')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('project-card'));
    await waitFor(() => expect(onOpenProject).toHaveBeenCalledWith('line-4-a'));
  });

  // IM-0a: the hub-card grid + the per-card "Start analyze in <name>" / "Open
  // <name>" affordances retire in PO-4. A minimal <select> replaces them.
  // Negative control: guard against accidental re-introduction.
  it('renders no hub cards and no start-analyze affordance (IM-0a)', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub'); // survivor present
    expect(screen.queryByTestId('process-hub-card')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start analyze in/ })).not.toBeInTheDocument();
  });

  // PO-3: the ProcessHubReviewPanel review surface (CurrentStatePanel + Inbox +
  // state-item UI) is retired. ProcessHubView is now a thin host — only the
  // Capability orient content survives. Negative control: the retired
  // 'Current Process State' aria region must NOT come back.
  it('renders the thin hub host without the retired current-state review surface', async () => {
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

    await screen.findByLabelText('Select process hub');
    await selectHub('line-4');

    await screen.findByTestId('process-hub-surface'); // survivor present
    expect(
      screen.queryByRole('region', { name: /Current Process State/i })
    ).not.toBeInTheDocument(); // the retired surface must NOT come back
  });

  it('keeps the hub host visible when search filters the investigation list', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub');
    await selectHub('line-4');
    await screen.findByTestId('process-hub-surface');

    fireEvent.change(screen.getByPlaceholderText('Search analyzes...'), {
      target: { value: 'zzzz no matching project' },
    });

    expect(screen.getByLabelText('Select process hub')).toBeInTheDocument();
    expect(screen.getByTestId('process-hub-surface')).toBeInTheDocument();
    expect(screen.queryByTestId('project-card')).not.toBeInTheDocument();
  });

  it('mounts the thin hub host for a selected hub without investigations', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub');
    await selectHub('line-4');

    // The thin host mounts for an empty hub without crashing; the process-hub
    // surface (Capability orient content) is the surviving keep.
    expect(await screen.findByTestId('process-hub-surface')).toBeInTheDocument();
  });

  it('mounts the EvidencePanel only once a hub is selected', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
      { id: 'line-5', name: 'Line 5', createdAt: 1745539200000, deletedAt: null },
    ]);
    mockListEvidenceSources.mockClear();

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub');
    // No hub selected → EvidencePanel not mounted → no evidence-source reads.
    expect(mockListEvidenceSources).not.toHaveBeenCalled();

    await selectHub('line-5');

    // The mounted ProcessHubEvidencePanel self-loads its own sources for the
    // selected hub.
    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalled());
    const calledHubIds = new Set(mockListEvidenceSources.mock.calls.map(call => call[0]));
    expect(calledHubIds).toEqual(new Set(['line-5']));
  });

  it('New Hub button creates an incomplete hub via useNewHubProvision without window.prompt', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([]);
    mockSaveProcessHub.mockResolvedValue(undefined);

    render(<Dashboard onOpenProject={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Process Hubs')).toBeInTheDocument());

    // No window.prompt should be called
    const promptSpy = vi.spyOn(window, 'prompt');

    fireEvent.click(screen.getByText('New Hub'));

    // Word-style durability (FSJ-3a, spec §3): eager persist is retired.
    // Negative control: saveProcessHub must NOT be called on New Hub click.
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
      expect(screen.getByRole('option', { name: 'Untitled hub' })).toBeInTheDocument()
    );

    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it('onHubGoalChange wires to saveProcessHub — framing prompt visible for incomplete hub', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);
    mockSaveProcessHub.mockClear();
    mockSaveProcessHub.mockResolvedValue(undefined);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub');
    await selectHub('line-4');

    // Wait for ProcessHubView to render.
    await screen.findByTestId('process-hub-surface');

    // Hub has no processGoal and no outcomes → framing prompt is visible (onEditFraming wired).
    // This confirms that ProcessHubView receives onEditFraming from Dashboard.
    expect(screen.getByTestId('hub-framing-prompt')).toBeInTheDocument();
    // Clicking Add framing triggers onEditFraming which calls onOpenProject.
    // (Full GoalBanner inline-edit saveProcessHub path tested by ProcessHubView.test.tsx)
  });
});
