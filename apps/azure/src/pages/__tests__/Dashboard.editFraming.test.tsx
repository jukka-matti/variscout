/**
 * P4.5 — Verify that the "Add framing" CTA in ProcessHubView navigates
 * the user to the Editor paste flow by calling onOpenProject(undefined, hubId, true).
 * The third argument (startPaste=true) ensures Editor opens directly into PasteScreen.
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

// CS-P1: the Status/Capability two-tab collapsed, so ProcessHubView now mounts
// ProcessHubCapabilityTab unconditionally. Its visx charts need ResizeObserver,
// which this integration suite doesn't polyfill — and the capability content is
// out of scope here (framing-prompt wiring). Mock it (mirrors the mocks in
// Dashboard.processHub.test.tsx + ProcessHubView.test.tsx).
vi.mock('../../components/ProcessHubCapabilityTab', () => ({
  ProcessHubCapabilityTab: () => <div data-testid="mock-process-hub-capability-tab" />,
  default: () => <div data-testid="mock-process-hub-capability-tab" />,
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

describe('Dashboard — onEditFraming wiring (P4.5)', () => {
  it('passes onEditFraming to ProcessHubView — framing prompt is visible for incomplete hub', async () => {
    render(<Dashboard onOpenProject={vi.fn()} />);

    await screen.findByLabelText('Select process hub');
    fireEvent.change(screen.getByLabelText('Select process hub'), { target: { value: 'line-4' } });

    // Hub has no processGoal → framing prompt should be visible
    await screen.findByTestId('hub-framing-prompt');
    expect(screen.getByTestId('hub-framing-prompt-cta')).toBeInTheDocument();
  });

  it('clicking Add framing CTA calls onOpenProject(undefined, hubId, true)', async () => {
    const onOpenProject = vi.fn();
    render(<Dashboard onOpenProject={onOpenProject} />);

    await screen.findByLabelText('Select process hub');
    fireEvent.change(screen.getByLabelText('Select process hub'), { target: { value: 'line-4' } });

    const cta = await screen.findByTestId('hub-framing-prompt-cta');
    fireEvent.click(cta);

    // startPaste=true so Editor opens directly into PasteScreen rather than EmptyState
    await waitFor(() => expect(onOpenProject).toHaveBeenCalledWith(undefined, 'line-4', true));
  });
});
