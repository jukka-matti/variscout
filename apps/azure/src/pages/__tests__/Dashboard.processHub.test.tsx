import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import type { CloudProject } from '../../services/storage';
import type { EvidenceSource } from '@variscout/core';

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
      actionCounts: { total: 1, completed: 0, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
      processHubId: 'line-4',
      analyzeDepth: 'focused',
      analyzeStatus: 'investigating',
      processDescription: 'Line 4 filling process.',
      customerRequirementSummary: 'Fill weight must stay inside customer specs.',
      currentUnderstandingSummary: 'Variation is concentrated on night shift.',
      problemConditionSummary: 'Cpk is below target on Heads 5-8.',
      nextMove: 'Inspect nozzle wear.',
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
      actionCounts: { total: 2, completed: 1, overdue: 1 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
      processHubId: 'line-4',
      analyzeDepth: 'quick',
      analyzeStatus: 'verifying',
      processDescription: 'Line 4 filling process.',
      customerRequirementSummary: 'Fill weight must stay inside customer specs.',
      currentUnderstandingSummary: 'Post-action data is ready for comparison.',
      nextMove: 'Compare post-action Cpk after the next batch.',
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
      actionCounts: { total: 1, completed: 1, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
      processHubId: 'line-4',
      analyzeDepth: 'chartered',
      analyzeStatus: 'resolved',
      processDescription: 'Line 4 filling process.',
      customerRequirementSummary: 'Fill weight must stay inside customer specs.',
      currentUnderstandingSummary: 'Nozzle replacement reduced variation.',
      nextMove: 'Review sustainment during the weekly hub cadence.',
    },
  };
}

describe('Dashboard Process Hub home', () => {
  it('renders Process Hub cards before investigation cards and starts work in a hub', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'general-unassigned', name: 'General / Unassigned', createdAt: 0, deletedAt: null },
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByText('Line 4');
    expect(screen.getByText('Night shift overfill')).toBeInTheDocument();

    const hubCard = screen.getAllByTestId('process-hub-card')[0];
    const projectCard = screen.getByTestId('project-card');
    expect(hubCard.compareDocumentPosition(projectCard)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(screen.getByLabelText('Start analyze in Line 4'));
    await waitFor(() => expect(onOpenProject).toHaveBeenCalledWith(undefined, 'line-4'));
  });

  // reviewSignal projection retired in PO-2 Task 6 — the Latest Signals block on
  // ProcessHubCard no longer renders (rollup.reviewSignal is undefined when no
  // analyze-projection computes it). ProcessHubCard itself retires in PO-4.
  // Negative control: guard against accidental re-introduction.
  it('Latest Signals block is absent from Process Hub cards (reviewSignal retired)', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    expect(screen.queryByText('Latest Signals')).not.toBeInTheDocument();
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

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    await screen.findByTestId('process-hub-surface'); // survivor present
    expect(
      screen.queryByRole('region', { name: /Current Process State/i })
    ).not.toBeInTheDocument(); // the retired surface must NOT come back
  });

  it('keeps process hubs visible when search filters the investigation list', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));
    await screen.findByTestId('process-hub-surface');

    fireEvent.change(screen.getByPlaceholderText('Search analyzes...'), {
      target: { value: 'zzzz no matching project' },
    });

    expect(screen.getByLabelText('Open Line 4')).toBeInTheDocument();
    expect(screen.getByTestId('process-hub-surface')).toBeInTheDocument();
    expect(screen.queryByTestId('project-card')).not.toBeInTheDocument();
  });

  it('mounts the thin hub host for a selected hub without investigations', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    // The thin host mounts for an empty hub without crashing; the process-hub
    // surface (Capability orient content) is the surviving keep. PO-3 retired
    // the Current Process State review surface entirely.
    expect(await screen.findByTestId('process-hub-surface')).toBeInTheDocument();
  });

  it('defers evidence loading until a hub is selected', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
      { id: 'line-5', name: 'Line 5', createdAt: 1745539200000, deletedAt: null },
      { id: 'line-6', name: 'Line 6', createdAt: 1745539200000, deletedAt: null },
    ]);
    mockListEvidenceSources.mockClear();
    mockListEvidenceSnapshots.mockClear();

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    expect(mockListEvidenceSources).not.toHaveBeenCalled();
    expect(mockListEvidenceSnapshots).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Open Line 5'));

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

    await waitFor(() => expect(mockSaveProcessHub).toHaveBeenCalledTimes(1));
    const savedHub = mockSaveProcessHub.mock.calls[0][0];
    // useNewHubProvision uses extractHubName('') → '' → fallback 'Untitled hub'
    expect(savedHub.name).toBe('Untitled hub');
    // Incomplete — no processGoal, no outcomes
    expect(savedHub.processGoal).toBeUndefined();
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

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    // Wait for ProcessHubView to render.
    await screen.findByTestId('process-hub-surface');

    // Hub has no processGoal and no outcomes → framing prompt is visible (onEditFraming wired).
    // This confirms that ProcessHubView receives onEditFraming from Dashboard.
    expect(screen.getByTestId('hub-framing-prompt')).toBeInTheDocument();
    // Clicking Add framing triggers onEditFraming which calls onOpenProject.
    // (Full GoalBanner inline-edit saveProcessHub path tested by ProcessHubView.test.tsx)
  });
});
