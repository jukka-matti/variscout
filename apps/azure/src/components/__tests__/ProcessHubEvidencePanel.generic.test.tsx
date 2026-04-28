import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// vi.mock BEFORE component imports per writing-tests rule
vi.mock('../../services/storage', () => ({
  useStorage: vi.fn(() => ({
    listEvidenceSources: vi.fn(async () => []),
    saveEvidenceSource: vi.fn(async () => undefined),
    listEvidenceSnapshots: vi.fn(async () => []),
    saveEvidenceSnapshot: vi.fn(async () => undefined),
  })),
}));
vi.mock('../../lib/appInsights', () => ({
  safeTrackEvent: vi.fn(),
}));

import ProcessHubEvidencePanel from '../ProcessHubEvidencePanel';
import { useStorage } from '../../services/storage';
import { safeTrackEvent } from '../../lib/appInsights';

// Helper: build a CSV file with given content
function makeCsvFile(content: string, name = 'data.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

const PURE_NUMERIC_CSV = `A,B,C
1,2,3
4,5,6
7,8,9`;

const REVIEW_LOG_CSV = `id,flagColor,decision,confidence
abc,green,correct,0.95
def,green,incorrect,0.6
ghi,red,correct,0.8`;

describe('ProcessHubEvidencePanel — Generic Tabular flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a "New Source" button to start the generic flow', () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    expect(screen.getByRole('button', { name: /new source/i })).toBeInTheDocument();
  });

  it('uploading a non-review-log CSV advances to mapping confirmation (single profile match → no picker)', async () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(PURE_NUMERIC_CSV)] } });
    await waitFor(() => {
      expect(screen.getByTestId('mapping-confirmation-form')).toBeInTheDocument();
    });
    // Generic Tabular suggests outcome from first numeric column
    expect(screen.getByLabelText(/outcome/i)).toHaveValue('A');
  });

  it('uploading a review-log CSV with both profiles matching renders a picker', async () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(REVIEW_LOG_CSV)] } });
    await waitFor(() => {
      expect(screen.getByTestId('profile-picker')).toBeInTheDocument();
    });
    // Both profile labels should be selectable options
    expect(screen.getByText(/agent review log/i)).toBeInTheDocument();
    expect(screen.getByText(/generic tabular/i)).toBeInTheDocument();
  });

  it('user can edit the outcome mapping field', async () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(PURE_NUMERIC_CSV)] } });
    await waitFor(() => screen.getByTestId('mapping-confirmation-form'));
    const outcomeSelect = screen.getByLabelText(/outcome/i);
    fireEvent.change(outcomeSelect, { target: { value: 'B' } });
    expect(outcomeSelect).toHaveValue('B');
  });

  it('cadence selector has 5 options matching EvidenceCadence enum (no monthly)', async () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(PURE_NUMERIC_CSV)] } });
    await waitFor(() => screen.getByTestId('mapping-confirmation-form'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByTestId('cadence-selector'));
    expect(screen.getByLabelText(/manual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hourly/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shiftly/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weekly/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/monthly/i)).not.toBeInTheDocument();
  });

  it('cadence defaults to manual', async () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(PURE_NUMERIC_CSV)] } });
    await waitFor(() => screen.getByTestId('mapping-confirmation-form'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByTestId('cadence-selector'));
    expect((screen.getByLabelText(/manual/i) as HTMLInputElement).checked).toBe(true);
  });

  it('Save calls saveEvidenceSource and saveEvidenceSnapshot in order', async () => {
    const mockSaveSource = vi.fn(async () => undefined);
    const mockSaveSnapshot = vi.fn(async () => undefined);
    vi.mocked(useStorage).mockReturnValue({
      listEvidenceSources: vi.fn(async () => []),
      saveEvidenceSource: mockSaveSource,
      listEvidenceSnapshots: vi.fn(async () => []),
      saveEvidenceSnapshot: mockSaveSnapshot,
    } as unknown as ReturnType<typeof useStorage>);

    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(PURE_NUMERIC_CSV)] } });
    await waitFor(() => screen.getByTestId('mapping-confirmation-form'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByTestId('cadence-selector'));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockSaveSource).toHaveBeenCalled();
      expect(mockSaveSnapshot).toHaveBeenCalled();
    });
    // Order check: source before snapshot
    const sourceOrder = mockSaveSource.mock.invocationCallOrder[0];
    const snapshotOrder = mockSaveSnapshot.mock.invocationCallOrder[0];
    expect(sourceOrder).toBeLessThan(snapshotOrder);
  });

  it('emits process_hub.evidence_source_created telemetry on successful save', async () => {
    render(<ProcessHubEvidencePanel hubId="h-1" />);
    fireEvent.click(screen.getByRole('button', { name: /new source/i }));
    const fileInput = screen.getByTestId('evidence-source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeCsvFile(PURE_NUMERIC_CSV)] } });
    await waitFor(() => screen.getByTestId('mapping-confirmation-form'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByTestId('cadence-selector'));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(safeTrackEvent).toHaveBeenCalledWith(
        'process_hub.evidence_source_created',
        expect.objectContaining({
          hubId: 'h-1',
          profileId: 'generic-tabular',
          rowCount: expect.any(Number),
          cadence: 'manual',
        })
      );
    });
    // Verify NO PII fields in payload
    const call = (safeTrackEvent as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: unknown[]) => c[0] === 'process_hub.evidence_source_created'
    );
    if (call) {
      const payload = call[1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('label');
      expect(payload).not.toHaveProperty('name');
      expect(payload).not.toHaveProperty('text');
    }
  });
});
