import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockListEvidenceSources = vi.fn();
const mockSaveEvidenceSource = vi.fn();
const mockListEvidenceSnapshots = vi.fn();
const mockSaveEvidenceSnapshot = vi.fn();

vi.mock('../../services/storage', () => ({
  useStorage: () => ({
    listEvidenceSources: mockListEvidenceSources,
    saveEvidenceSource: mockSaveEvidenceSource,
    listEvidenceSnapshots: mockListEvidenceSnapshots,
    saveEvidenceSnapshot: mockSaveEvidenceSnapshot,
  }),
}));

import ProcessHubEvidencePanel from '../ProcessHubEvidencePanel';

beforeEach(() => {
  mockListEvidenceSources.mockReset();
  mockSaveEvidenceSource.mockReset();
  mockListEvidenceSnapshots.mockReset();
  mockSaveEvidenceSnapshot.mockReset();
  mockListEvidenceSources.mockResolvedValue([]);
  mockListEvidenceSnapshots.mockResolvedValue([]);
  mockSaveEvidenceSource.mockResolvedValue(undefined);
  mockSaveEvidenceSnapshot.mockResolvedValue(undefined);
});

function makeCsvFile(text: string, name = 'agent-review.csv'): File {
  return new File([text], name, { type: 'text/csv' });
}

describe('ProcessHubEvidencePanel', () => {
  it('renders heading and create button when no sources exist', async () => {
    render(<ProcessHubEvidencePanel hubId="line-4" />);
    expect(await screen.findByText('Evidence Sources')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agent Review Log/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Source')).not.toBeInTheDocument();
  });

  it('creates an agent-review-log source for the hub when the button is clicked', async () => {
    render(<ProcessHubEvidencePanel hubId="line-4" />);
    fireEvent.click(await screen.findByRole('button', { name: /Agent Review Log/ }));
    await waitFor(() => expect(mockSaveEvidenceSource).toHaveBeenCalledTimes(1));
    const saved = mockSaveEvidenceSource.mock.calls[0][0];
    expect(saved.hubId).toBe('line-4');
    expect(saved.profileId).toBe('agent-review-log');
    expect(saved.cadence).toBe('weekly');
    expect(saved.name).toBe('Agent review log');
    expect(typeof saved.createdAt).toBe('string');
    expect(saved.createdAt).toBe(saved.updatedAt);
  });

  it('shows status confirmation after creating a source', async () => {
    const onChanged = vi.fn();
    mockSaveEvidenceSource.mockImplementation(async source => {
      mockListEvidenceSources.mockResolvedValue([source]);
    });
    render(<ProcessHubEvidencePanel hubId="line-4" onEvidenceChanged={onChanged} />);
    fireEvent.click(await screen.findByRole('button', { name: /Agent Review Log/ }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(await screen.findByText('Evidence Source created.')).toBeInTheDocument();
  });

  it('saves a snapshot tagged with red severity when an audit flags a false green', async () => {
    const source = {
      id: 'src-1',
      hubId: 'line-4',
      name: 'Agent review log',
      cadence: 'weekly' as const,
      profileId: 'agent-review-log',
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
    };
    mockListEvidenceSources.mockResolvedValue([source]);

    render(<ProcessHubEvidencePanel hubId="line-4" />);
    const fileInput = await screen.findByLabelText('Upload Snapshot');
    const csv = 'flagColor,auditResult\ngreen,incorrect\ngreen,correct\n';
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(csv)] } });

    await waitFor(() => expect(mockSaveEvidenceSnapshot).toHaveBeenCalledTimes(1));
    const [savedSnapshot, savedText] = mockSaveEvidenceSnapshot.mock.calls[0];
    expect(savedSnapshot.hubId).toBe('line-4');
    expect(savedSnapshot.sourceId).toBe('src-1');
    expect(savedSnapshot.rowCount).toBe(2);
    expect(savedText).toBe(csv);
    expect(savedSnapshot.latestSignals).toEqual([
      expect.objectContaining({
        id: 'src-1:false-green',
        label: 'False green',
        value: 1,
        severity: 'red',
      }),
    ]);
  });

  it('saves a snapshot tagged with green severity when no false greens are detected', async () => {
    const source = {
      id: 'src-1',
      hubId: 'line-4',
      name: 'Agent review log',
      cadence: 'weekly' as const,
      profileId: 'agent-review-log',
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
    };
    mockListEvidenceSources.mockResolvedValue([source]);

    render(<ProcessHubEvidencePanel hubId="line-4" />);
    const fileInput = await screen.findByLabelText('Upload Snapshot');
    const csv = 'flagColor,auditResult\ngreen,correct\ngreen,correct\n';
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(csv)] } });

    await waitFor(() => expect(mockSaveEvidenceSnapshot).toHaveBeenCalledTimes(1));
    const [savedSnapshot] = mockSaveEvidenceSnapshot.mock.calls[0];
    expect(savedSnapshot.latestSignals).toEqual([
      expect.objectContaining({
        id: 'src-1:safe-green',
        severity: 'green',
        value: 0,
      }),
    ]);
  });

  it('renders the validation error in status when the profile is missing required columns', async () => {
    const source = {
      id: 'src-1',
      hubId: 'line-4',
      name: 'Agent review log',
      cadence: 'weekly' as const,
      profileId: 'agent-review-log',
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
    };
    mockListEvidenceSources.mockResolvedValue([source]);

    render(<ProcessHubEvidencePanel hubId="line-4" />);
    const fileInput = await screen.findByLabelText('Upload Snapshot');
    const csv = 'unrelated\nfoo\nbar\n';
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(csv)] } });

    expect(
      await screen.findByText(/Agent Review Log profile requires a flag color column\./)
    ).toBeInTheDocument();
  });
});
