import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import type { CloudProject } from '../../services/storage';
import type { EvidenceSource } from '@variscout/core';

const mockListProjects = vi.fn();
const mockListProcessHubs = vi.fn();
const mockSaveProcessHub = vi.fn();
const mockListEvidenceSources = vi.fn<(hubId: string) => Promise<EvidenceSource[]>>();
const mockListEvidenceSnapshots = vi.fn(() => Promise.resolve([]));
const mockListSustainmentRecords = vi.fn();
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
    listSustainmentRecords: mockListSustainmentRecords,
    listControlHandoffs: mockListControlHandoffs,
    syncStatus: { status: 'synced', message: 'Synced' },
  }),
}));

beforeEach(() => {
  mockListEvidenceSources.mockResolvedValue([]);
  mockListEvidenceSnapshots.mockResolvedValue([]);
  mockListSustainmentRecords.mockResolvedValue([]);
  mockListControlHandoffs.mockResolvedValue([]);
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
      phase: 'investigate',
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 1, completed: 0, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
      processHubId: 'line-4',
      investigationDepth: 'focused',
      investigationStatus: 'investigating',
      processDescription: 'Line 4 filling process.',
      customerRequirementSummary: 'Fill weight must stay inside customer specs.',
      currentUnderstandingSummary: 'Variation is concentrated on night shift.',
      problemConditionSummary: 'Cpk is below target on Heads 5-8.',
      nextMove: 'Inspect nozzle wear.',
      reviewSignal: {
        rowCount: 125,
        outcome: 'Weight',
        dataFilename: 'line-4.csv',
        computedAt: '2026-04-26T09:00:00.000Z',
        topFocus: { factor: 'Machine', value: 'B', variationPct: 48.2 },
        capability: { cpk: 0.82, cpkTarget: 1.33, outOfSpecPercentage: 4.8 },
        changeSignals: {
          total: 2,
          outOfControlCount: 1,
          nelsonRule2Count: 1,
          nelsonRule3Count: 0,
        },
        latestTimeValue: '2026-04-26T08:00:00Z',
      },
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
      investigationDepth: 'quick',
      investigationStatus: 'verifying',
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
      investigationDepth: 'chartered',
      investigationStatus: 'resolved',
      processDescription: 'Line 4 filling process.',
      customerRequirementSummary: 'Fill weight must stay inside customer specs.',
      currentUnderstandingSummary: 'Nozzle replacement reduced variation.',
      nextMove: 'Review sustainment during the weekly hub cadence.',
    },
  };
}

function makeReadinessProject(index = 1): CloudProject {
  return {
    id: `line-4-readiness-${index}`,
    name: `Frame missing process context ${index}`,
    modified: `2026-04-26T0${index}:00:00.000Z`,
    location: 'personal',
    metadata: {
      phase: 'frame',
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 0, completed: 0, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
      processHubId: 'line-4',
      investigationDepth: 'focused',
      investigationStatus: 'framing',
      surveyReadiness: {
        possibilityStatus: 'ask-for-next',
        powerStatus: 'can-do-with-caution',
        trustStatus: 'ask-for-next',
        recommendationCount: 2,
        topRecommendations: ['Map one customer-felt outcome.'],
      },
    },
  };
}

describe('Dashboard Process Hub home', () => {
  it('renders Process Hub cards before investigation cards and starts work in a hub', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'general-unassigned', name: 'General / Unassigned', createdAt: '' },
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByText('Line 4');
    expect(screen.getByText('Night shift overfill')).toBeInTheDocument();

    const hubCard = screen.getAllByTestId('process-hub-card')[0];
    const projectCard = screen.getByTestId('project-card');
    expect(hubCard.compareDocumentPosition(projectCard)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(screen.getByLabelText('Start investigation in Line 4'));
    await waitFor(() => expect(onOpenProject).toHaveBeenCalledWith(undefined, 'line-4'));
  });

  it('shows latest hub review signals on Process Hub cards', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Latest Signals');
    expect(screen.getByText('Top focus: Machine / B (48%)')).toBeInTheDocument();
    expect(screen.getByText('Cpk 0.82 vs target 1.33')).toBeInTheDocument();
    expect(screen.getByText('2 change signals')).toBeInTheDocument();
  });

  it('renders an inline Hub Cadence Review panel for the selected hub and opens review items', async () => {
    const onOpenProject = vi.fn();
    mockListProjects.mockResolvedValue([
      makeProject(),
      makeVerificationProject(),
      makeResolvedProject(),
    ]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    const panel = await screen.findByRole('region', { name: 'Line 4 Cadence Review' });
    expect(within(panel).getByText('Cadence Questions')).toBeInTheDocument();
    expect(within(panel).getByText('Are we meeting the requirement?')).toBeInTheDocument();
    expect(
      within(panel).getByText('Fill weight must stay inside customer specs.')
    ).toBeInTheDocument();
    expect(within(panel).getByText('What changed?')).toBeInTheDocument();
    expect(within(panel).getByText('Latest evidence has 2 change signals.')).toBeInTheDocument();
    expect(within(panel).getByText('Where should we focus?')).toBeInTheDocument();
    expect(within(panel).getByText('Focus on Machine / B.')).toBeInTheDocument();
    expect(within(panel).getByText('Daily huddle')).toBeInTheDocument();
    expect(within(panel).getByText('Weekly process review')).toBeInTheDocument();
    expect(within(panel).getByText('Latest Signals')).toBeInTheDocument();
    expect(within(panel).getByText('Active Work')).toBeInTheDocument();
    expect(within(panel).getByText('Quick')).toBeInTheDocument();
    expect(within(panel).getByText('Focused')).toBeInTheDocument();
    expect(within(panel).getByText('Chartered')).toBeInTheDocument();
    expect(within(panel).getByText('Where to Focus')).toBeInTheDocument();
    expect(within(panel).getAllByText('Night shift overfill').length).toBeGreaterThan(0);
    expect(within(panel).getByText('Machine / B')).toBeInTheDocument();
    expect(within(panel).getAllByText('2 change signals').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Cpk 0.82 vs target 1.33').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Verification').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Post-action shift check').length).toBeGreaterThan(0);
    expect(within(panel).getByText('1 overdue action')).toBeInTheDocument();
    expect(
      within(panel).getAllByText('Compare post-action Cpk after the next batch.').length
    ).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Sustainment').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Nozzle replacement verified').length).toBeGreaterThan(0);
    expect(
      within(panel).getByLabelText('Set up sustainment cadence for Nozzle replacement verified')
    ).toBeInTheDocument();

    fireEvent.click(within(panel).getAllByLabelText('Open review item Night shift overfill')[0]);
    expect(onOpenProject).toHaveBeenCalledWith('line-4-a');
  });

  it('shows readiness queue reasons in the cadence review panel', async () => {
    mockListProjects.mockResolvedValue([makeReadinessProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    const panel = await screen.findByRole('region', { name: 'Line 4 Cadence Review' });
    expect(within(panel).getAllByText('Readiness').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Frame missing process context 1').length).toBeGreaterThan(0);
    expect(within(panel).getByText('Complete process context')).toBeInTheDocument();
    expect(within(panel).getByText('Clarify customer requirement')).toBeInTheDocument();
    expect(within(panel).getByText('Survey needs input')).toBeInTheDocument();
    expect(within(panel).getByText('Map one customer-felt outcome.')).toBeInTheDocument();
  });

  it('renders a cadence review board with snapshot metrics and truncated queues', async () => {
    mockListProjects.mockResolvedValue([
      makeProject(),
      makeVerificationProject(),
      makeResolvedProject(),
      makeReadinessProject(1),
      makeReadinessProject(2),
      makeReadinessProject(3),
      makeReadinessProject(4),
      makeReadinessProject(5),
    ]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);
    mockListSustainmentRecords.mockResolvedValue([
      {
        id: 'rec-1',
        investigationId: 'line-4-c',
        hubId: 'line-4',
        cadence: 'monthly',
        nextReviewDue: '2026-04-25T00:00:00.000Z',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    const panel = await screen.findByRole('region', { name: 'Line 4 Cadence Review' });
    expect(within(panel).getByText('Cadence Review Board')).toBeInTheDocument();
    expect(within(panel).getByText('Decision Queues')).toBeInTheDocument();
    expect(within(panel).getByTestId('cadence-snapshot-active')).toHaveTextContent('7');
    expect(within(panel).getByTestId('cadence-snapshot-readiness')).toHaveTextContent('7');
    expect(within(panel).getByTestId('cadence-snapshot-verification')).toHaveTextContent('1');
    expect(within(panel).getByTestId('cadence-snapshot-overdue-actions')).toHaveTextContent('1');
    expect(within(panel).getByTestId('cadence-snapshot-sustainment')).toHaveTextContent('1');
    expect(within(panel).getByText('+3 more')).toBeInTheDocument();
  });

  it('keeps process hubs visible when search filters the investigation list', async () => {
    mockListProjects.mockResolvedValue([makeProject()]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));
    await screen.findByRole('region', { name: 'Line 4 Cadence Review' });

    fireEvent.change(screen.getByPlaceholderText('Search investigations...'), {
      target: { value: 'zzzz no matching project' },
    });

    expect(screen.getByLabelText('Open Line 4')).toBeInTheDocument();
    const panel = screen.getByRole('region', { name: 'Line 4 Cadence Review' });
    expect(within(panel).getByTestId('cadence-snapshot-active')).toHaveTextContent('1');
    expect(screen.queryByTestId('project-card')).not.toBeInTheDocument();
  });

  it('shows empty review states for a selected hub without investigations', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    const panel = await screen.findByRole('region', { name: 'Line 4 Cadence Review' });
    expect(within(panel).getByText('Daily huddle')).toBeInTheDocument();
    expect(within(panel).getByText('Weekly process review')).toBeInTheDocument();
    expect(within(panel).getByText('No latest signals yet')).toBeInTheDocument();
    expect(within(panel).getByText('No active investigations yet')).toBeInTheDocument();
    expect(within(panel).getByText('No active review items yet')).toBeInTheDocument();
    expect(within(panel).getByText('No requirement signal yet')).toBeInTheDocument();
  });

  it('defers evidence loading until a hub is selected', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
      { id: 'line-5', name: 'Line 5', createdAt: '2026-04-25T00:00:00.000Z' },
      { id: 'line-6', name: 'Line 6', createdAt: '2026-04-25T00:00:00.000Z' },
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

  it('renders cadence column labels as eyebrow text, not as duplicate section headings', async () => {
    mockListProjects.mockResolvedValue([]);
    mockListProcessHubs.mockResolvedValue([
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ]);

    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    const panel = await screen.findByRole('region', { name: 'Line 4 Cadence Review' });
    const headings = within(panel)
      .getAllByRole('heading')
      .map(h => h.textContent?.trim());
    expect(headings).not.toContain('Daily huddle');
    expect(headings).not.toContain('Weekly process review');
    expect(headings).toContain('Latest Signals');
    expect(headings).toContain('Active Work');
  });
});
