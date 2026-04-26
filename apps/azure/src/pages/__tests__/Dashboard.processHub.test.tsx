import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import type { CloudProject } from '../../services/storage';

const mockListProjects = vi.fn();
const mockListProcessHubs = vi.fn();
const mockSaveProcessHub = vi.fn();

vi.mock('../../services/storage', () => ({
  useStorage: () => ({
    listProjects: mockListProjects,
    listProcessHubs: mockListProcessHubs,
    saveProcessHub: mockSaveProcessHub,
    syncStatus: { status: 'synced', message: 'Synced' },
  }),
}));

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
      currentUnderstandingSummary: 'Nozzle replacement reduced variation.',
      nextMove: 'Review sustainment during the weekly hub cadence.',
    },
  };
}

function makeReadinessProject(): CloudProject {
  return {
    id: 'line-4-readiness',
    name: 'Frame missing process context',
    modified: '2026-04-26T01:00:00.000Z',
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
    expect(within(panel).getByText('Verification')).toBeInTheDocument();
    expect(within(panel).getAllByText('Post-action shift check').length).toBeGreaterThan(0);
    expect(within(panel).getByText('1 overdue action')).toBeInTheDocument();
    expect(
      within(panel).getAllByText('Compare post-action Cpk after the next batch.').length
    ).toBeGreaterThan(0);
    expect(within(panel).getByText('Sustainment')).toBeInTheDocument();
    expect(within(panel).getAllByText('Nozzle replacement verified').length).toBeGreaterThan(0);
    expect(
      within(panel).getByText('Review sustainment during the weekly hub cadence.')
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
    expect(within(panel).getByText('Readiness')).toBeInTheDocument();
    expect(within(panel).getAllByText('Frame missing process context').length).toBeGreaterThan(0);
    expect(within(panel).getByText('Complete process context')).toBeInTheDocument();
    expect(within(panel).getByText('Clarify customer requirement')).toBeInTheDocument();
    expect(within(panel).getByText('Survey needs input')).toBeInTheDocument();
    expect(within(panel).getByText('Map one customer-felt outcome.')).toBeInTheDocument();
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
    expect(within(panel).getByText('No latest signals yet')).toBeInTheDocument();
    expect(within(panel).getByText('No active investigations yet')).toBeInTheDocument();
    expect(within(panel).getByText('No active review items yet')).toBeInTheDocument();
  });
});
