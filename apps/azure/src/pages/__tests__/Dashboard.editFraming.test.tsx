/**
 * CS-P2 — Dashboard no longer owns the retired portfolio framing prompt.
 * Framing edits live on the shared editor Process tab; the portfolio Dashboard
 * keeps the hub selector and evidence panel only.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

const mockListProjects = vi.fn();
const mockListProcessHubs = vi.fn();
const mockSaveProcessHub = vi.fn();
const mockListEvidenceSources = vi.fn(() => Promise.resolve([]));
const mockListEvidenceSnapshots = vi.fn(() => Promise.resolve([]));
const mockListControlRecords = vi.fn(() => Promise.resolve([]));
const mockListControlHandoffs = vi.fn(() => Promise.resolve([]));

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

vi.mock('../../auth/easyAuth', () => ({
  getEasyAuthUser: vi.fn(() => Promise.resolve({ userId: 'local' })),
}));

vi.mock('../../components/SampleDataPicker', () => ({
  default: () => null,
}));

beforeEach(() => {
  mockListProjects.mockResolvedValue([]);
  mockListProcessHubs.mockResolvedValue([
    { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
  ]);
  mockListEvidenceSources.mockResolvedValue([]);
  mockListEvidenceSnapshots.mockResolvedValue([]);
  mockListControlRecords.mockResolvedValue([]);
  mockListControlHandoffs.mockResolvedValue([]);
  mockSaveProcessHub.mockResolvedValue(undefined);
});

describe('Dashboard — retired framing prompt', () => {
  it('does not render the retired Dashboard Add framing prompt for an incomplete hub', async () => {
    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub');
    fireEvent.change(screen.getByLabelText('Select process hub'), { target: { value: 'line-4' } });

    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalledWith('line-4'));
    expect(screen.queryByTestId('hub-framing-prompt')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hub-framing-prompt-cta')).not.toBeInTheDocument();
  });

  it('selecting an incomplete hub does not navigate through the retired CTA path', async () => {
    const onOpenProject = vi.fn();
    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByLabelText('Select process hub');
    fireEvent.change(screen.getByLabelText('Select process hub'), { target: { value: 'line-4' } });

    await waitFor(() => expect(mockListEvidenceSources).toHaveBeenCalledWith('line-4'));
    expect(onOpenProject).not.toHaveBeenCalled();
  });
});
