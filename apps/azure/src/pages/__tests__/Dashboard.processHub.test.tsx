import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
});
