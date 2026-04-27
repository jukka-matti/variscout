import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockSaveSustainmentRecord = vi.fn();
const mockSaveSustainmentReview = vi.fn();
const mockSaveControlHandoff = vi.fn();
const mockListSustainmentRecords = vi.fn();

vi.mock('../../services/storage', () => ({
  useStorage: () => ({
    saveSustainmentRecord: mockSaveSustainmentRecord,
    saveSustainmentReview: mockSaveSustainmentReview,
    saveControlHandoff: mockSaveControlHandoff,
    listSustainmentRecords: mockListSustainmentRecords,
  }),
}));

import SustainmentRecordEditor from '../SustainmentRecordEditor';
import SustainmentReviewLogger from '../SustainmentReviewLogger';
import ControlHandoffEditor from '../ControlHandoffEditor';
import type { SustainmentRecord } from '@variscout/core';
import type { EasyAuthUser } from '../../auth/types';

const FIXTURE_USER: EasyAuthUser = {
  name: 'Alice Auditor',
  email: 'alice@variscout.test',
  userId: 'aad-alice-001',
  roles: ['VariScout.Reviewer'],
};

beforeEach(() => {
  mockSaveSustainmentRecord.mockReset();
  mockSaveSustainmentReview.mockReset();
  mockSaveControlHandoff.mockReset();
  mockListSustainmentRecords.mockReset();
  mockSaveSustainmentRecord.mockResolvedValue(undefined);
  mockSaveSustainmentReview.mockResolvedValue(undefined);
  mockSaveControlHandoff.mockResolvedValue(undefined);
  mockListSustainmentRecords.mockResolvedValue([]);
});

// ── SustainmentRecordEditor ───────────────────────────────────────────────

describe('SustainmentRecordEditor', () => {
  it('fills form, submits, and calls saveSustainmentRecord + onSave with correct payload', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    fireEvent.change(screen.getByLabelText('Cadence'), { target: { value: 'monthly' } });
    fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Next review due'), {
      target: { value: '2026-05-27' },
    });
    fireEvent.change(screen.getByLabelText('Open concerns'), {
      target: { value: 'Watch the variance trend' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveSustainmentRecord).toHaveBeenCalledTimes(1));

    const saved = mockSaveSustainmentRecord.mock.calls[0][0];
    expect(saved.cadence).toBe('monthly');
    expect(saved.investigationId).toBe('inv-abc');
    expect(saved.hubId).toBe('hub-1');
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.owner?.displayName).toBe('Jane Doe');
    expect(saved.owner?.userId).toBe(FIXTURE_USER.userId);
    expect(saved.nextReviewDue).toMatch(/^2026-05-27T/);
    expect(saved.openConcerns).toBe('Watch the variance trend');
    expect(onSave).toHaveBeenCalledWith(saved);
  });

  it('prefills the owner field with currentUser.name when no existing record', () => {
    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Owner')).toHaveValue('Alice Auditor');
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('auto-suggests next-review-due from cadence on initial mount (no existing record)', () => {
    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next review due') as HTMLInputElement;
    // Default cadence is monthly → suggested ~30 days out, never empty
    expect(dateInput.value).not.toBe('');
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('updates next-review-due when cadence changes if user has not edited the date', () => {
    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next review due') as HTMLInputElement;
    const monthlyDate = dateInput.value;
    fireEvent.change(screen.getByLabelText('Cadence'), { target: { value: 'annual' } });
    expect(dateInput.value).not.toBe(monthlyDate);
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('preserves user-edited next-review-due when cadence changes after manual edit', () => {
    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next review due') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2027-01-15' } });
    fireEvent.change(screen.getByLabelText('Cadence'), { target: { value: 'annual' } });
    expect(dateInput.value).toBe('2027-01-15');
  });

  it('preserves an existing record’s next-review-due when cadence changes (treated as user-set)', () => {
    const existingRecord: SustainmentRecord = {
      id: 'rec-existing',
      investigationId: 'inv-abc',
      hubId: 'hub-1',
      cadence: 'monthly',
      nextReviewDue: '2026-12-01T00:00:00.000Z',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };
    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        existingRecord={existingRecord}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next review due') as HTMLInputElement;
    expect(dateInput.value).toBe('2026-12-01');
    fireEvent.change(screen.getByLabelText('Cadence'), { target: { value: 'quarterly' } });
    expect(dateInput.value).toBe('2026-12-01');
  });

  it('sets a min attribute equal to today on the next-review-due input', () => {
    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next review due') as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(dateInput.min).toBe(today);
  });

  it('disables Save during async submit and re-enables on completion', async () => {
    let resolveSave: (() => void) | undefined;
    mockSaveSustainmentRecord.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveSave = resolve;
        })
    );

    render(
      <SustainmentRecordEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    // While the save promise is pending, the button should reflect the in-flight state
    await waitFor(() => expect(saveBtn).toBeDisabled());
    expect(saveBtn).toHaveTextContent(/saving/i);

    resolveSave?.();
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    expect(saveBtn).toHaveTextContent(/^Save$/);
  });
});

// ── SustainmentReviewLogger ───────────────────────────────────────────────

describe('SustainmentReviewLogger', () => {
  const baseRecord: SustainmentRecord = {
    id: 'rec-1',
    investigationId: 'inv-abc',
    hubId: 'hub-1',
    cadence: 'monthly',
    nextReviewDue: '2026-04-27T00:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  it('fills form with verdict=holding, submits, updates record with latestVerdict and nextReviewDue', async () => {
    mockListSustainmentRecords.mockResolvedValue([baseRecord]);

    const onSave = vi.fn();
    render(
      <SustainmentReviewLogger
        recordId="rec-1"
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        reviewerDisplayName="Alice"
        cadence="monthly"
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    // Select holding verdict (it may already be default — use fireEvent to be explicit)
    const holdingRadio = screen.getByLabelText('Holding');
    fireEvent.click(holdingRadio);

    fireEvent.change(screen.getByLabelText('Observation'), {
      target: { value: 'Process remains stable' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveSustainmentReview).toHaveBeenCalledTimes(1));

    const savedReview = mockSaveSustainmentReview.mock.calls[0][0];
    expect(savedReview.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(savedReview.recordId).toBe('rec-1');
    expect(savedReview.investigationId).toBe('inv-abc');
    expect(savedReview.hubId).toBe('hub-1');
    expect(savedReview.verdict).toBe('holding');
    expect(savedReview.reviewer.displayName).toBe('Alice');
    expect(savedReview.reviewer.userId).toBe(FIXTURE_USER.userId);
    expect(savedReview.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Record should be updated with latestVerdict and nextReviewDue
    await waitFor(() => expect(mockSaveSustainmentRecord).toHaveBeenCalledTimes(1));
    const updatedRecord = mockSaveSustainmentRecord.mock.calls[0][0];
    expect(updatedRecord.latestVerdict).toBe('holding');
    expect(updatedRecord.latestReviewId).toBe(savedReview.id);
    expect(updatedRecord.nextReviewDue).toBeDefined();
    expect(updatedRecord.nextReviewDue).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(onSave).toHaveBeenCalledWith(savedReview);
  });

  it('does not set nextReviewDue on the updated record when cadence is on-demand', async () => {
    const onDemandRecord: SustainmentRecord = { ...baseRecord, cadence: 'on-demand' };
    mockListSustainmentRecords.mockResolvedValue([onDemandRecord]);

    const onSave = vi.fn();
    render(
      <SustainmentReviewLogger
        recordId="rec-1"
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        reviewerDisplayName="Bob"
        cadence="on-demand"
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Holding'));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveSustainmentRecord).toHaveBeenCalledTimes(1));
    const updatedRecord = mockSaveSustainmentRecord.mock.calls[0][0];
    expect(updatedRecord.nextReviewDue).toBeUndefined();
  });
});

// ── ControlHandoffEditor ──────────────────────────────────────────────────

describe('ControlHandoffEditor', () => {
  it('fills form, submits, and calls saveControlHandoff with correct payload', async () => {
    const onSave = vi.fn();

    render(
      <ControlHandoffEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        recordedByDisplayName="Carol"
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Surface'), { target: { value: 'qms-procedure' } });
    fireEvent.change(screen.getByLabelText('System name'), { target: { value: 'Veeva QMS' } });
    fireEvent.change(screen.getByLabelText('Operational owner'), {
      target: { value: 'Dave Smith' },
    });
    fireEvent.change(screen.getByLabelText('Handoff date'), { target: { value: '2026-04-27' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Procedure updated in QMS' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveControlHandoff).toHaveBeenCalledTimes(1));

    const saved = mockSaveControlHandoff.mock.calls[0][0];
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.investigationId).toBe('inv-abc');
    expect(saved.hubId).toBe('hub-1');
    expect(saved.surface).toBe('qms-procedure');
    expect(saved.systemName).toBe('Veeva QMS');
    expect(saved.operationalOwner.displayName).toBe('Dave Smith');
    expect(saved.handoffDate).toMatch(/^2026-04-27T/);
    expect(saved.description).toBe('Procedure updated in QMS');
    expect(saved.recordedBy.displayName).toBe('Carol');
    expect(saved.recordedBy.userId).toBe(FIXTURE_USER.userId);
    // operationalOwner is a separate person; no people picker yet, so userId is omitted.
    expect(saved.operationalOwner.userId).toBeUndefined();

    expect(onSave).toHaveBeenCalledWith(saved);
  });

  it('updates relatedRecord.controlHandoffId after saving the handoff', async () => {
    const relatedRecord: SustainmentRecord = {
      id: 'rec-1',
      investigationId: 'inv-abc',
      hubId: 'hub-1',
      cadence: 'monthly',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    };

    const onSave = vi.fn();

    render(
      <ControlHandoffEditor
        investigationId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        recordedByDisplayName="Carol"
        relatedRecord={relatedRecord}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Surface'), { target: { value: 'scada-alarm' } });
    fireEvent.change(screen.getByLabelText('System name'), { target: { value: 'SCADA' } });
    fireEvent.change(screen.getByLabelText('Operational owner'), { target: { value: 'Eve' } });
    fireEvent.change(screen.getByLabelText('Handoff date'), { target: { value: '2026-04-27' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Alarm set in SCADA' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveControlHandoff).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockSaveSustainmentRecord).toHaveBeenCalledTimes(1));

    const savedHandoff = mockSaveControlHandoff.mock.calls[0][0];
    const updatedRecord = mockSaveSustainmentRecord.mock.calls[0][0];
    expect(updatedRecord.id).toBe('rec-1');
    expect(updatedRecord.controlHandoffId).toBe(savedHandoff.id);
  });
});
