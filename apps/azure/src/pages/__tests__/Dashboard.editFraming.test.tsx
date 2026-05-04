/**
 * P4.5 — Verify that the "Add framing" CTA in ProcessHubView navigates
 * the user to the Editor paste flow by calling onOpenProject(undefined, hubId).
 *
 * Test-shape note: We test via the full pages/Dashboard render path (same as
 * Dashboard.processHub.test.tsx) rather than mocking ProcessHubView, because
 * the real navigation chain is: CTA click → onEditFraming(hubId) → onOpenProject.
 * Testing at the component mock boundary would only verify prop presence, not
 * the actual handler wiring.
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
const mockListSustainmentRecords = vi.fn(() => Promise.resolve([]));
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
    listSustainmentRecords: mockListSustainmentRecords,
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
  mockListSustainmentRecords.mockResolvedValue([]);
  mockListControlHandoffs.mockResolvedValue([]);
  mockSaveProcessHub.mockResolvedValue(undefined);
});

describe('Dashboard — onEditFraming wiring (P4.5)', () => {
  it('passes onEditFraming to ProcessHubView — framing prompt is visible for incomplete hub', async () => {
    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    // Hub has no processGoal → framing prompt should be visible
    await screen.findByTestId('hub-framing-prompt');
    expect(screen.getByTestId('hub-framing-prompt-cta')).toBeInTheDocument();
  });

  it('clicking Add framing CTA calls onOpenProject(undefined, hubId)', async () => {
    const onOpenProject = vi.fn();
    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByText('Line 4');
    fireEvent.click(screen.getByLabelText('Open Line 4'));

    const cta = await screen.findByTestId('hub-framing-prompt-cta');
    fireEvent.click(cta);

    await waitFor(() => expect(onOpenProject).toHaveBeenCalledWith(undefined, 'line-4'));
  });
});
