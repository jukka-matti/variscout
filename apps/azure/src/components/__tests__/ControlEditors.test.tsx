import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockSaveControlRecord = vi.fn();
const mockSaveControlReview = vi.fn();
const mockSaveControlHandoff = vi.fn();
const mockListControlRecords = vi.fn();

vi.mock('../../services/storage', () => ({
  useStorage: () => ({
    saveControlRecord: mockSaveControlRecord,
    saveControlReview: mockSaveControlReview,
    saveControlHandoff: mockSaveControlHandoff,
    listControlRecords: mockListControlRecords,
  }),
}));

import ControlRecordEditor from '../ControlRecordEditor';
import ControlReviewLogger from '../ControlReviewLogger';
import ControlHandoffEditor from '../ControlHandoffEditor';
import type { ControlRecord } from '@variscout/core';
import type { EasyAuthUser } from '../../auth/types';

const FIXTURE_USER: EasyAuthUser = {
  name: 'Alice Auditor',
  email: 'alice@variscout.test',
  userId: 'aad-alice-001',
  roles: ['VariScout.Reviewer'],
};

beforeEach(() => {
  mockSaveControlRecord.mockReset();
  mockSaveControlReview.mockReset();
  mockSaveControlHandoff.mockReset();
  mockListControlRecords.mockReset();
  mockSaveControlRecord.mockResolvedValue(undefined);
  mockSaveControlReview.mockResolvedValue(undefined);
  mockSaveControlHandoff.mockResolvedValue(undefined);
  mockListControlRecords.mockResolvedValue([]);
});

// ── ControlRecordEditor ───────────────────────────────────────────────

describe('ControlRecordEditor', () => {
  it('fills form, submits, and calls saveControlRecord + onSave with correct payload', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // The re-check suggestion input enforces min={today} via HTML5 constraint
    // validation, which blocks form submit (the submit event never fires) when
    // the chosen date is in the past. Compute a date safely in the future
    // relative to the current clock so this test never becomes a time bomb.
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    render(
      <ControlRecordEditor
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Next suggested re-check'), {
      target: { value: futureDate },
    });
    fireEvent.change(screen.getByLabelText('Open concerns'), {
      target: { value: 'Watch the variance trend' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveControlRecord).toHaveBeenCalledTimes(1));

    const saved = mockSaveControlRecord.mock.calls[0][0];
    expect(saved.status).toBe('verifying');
    expect(saved.projectId).toBe('inv-abc');
    expect(saved.hubId).toBe('hub-1');
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.owner?.displayName).toBe('Jane Doe');
    expect(saved.owner?.userId).toBe(FIXTURE_USER.userId);
    expect(saved.nextCheckSuggestedAt).toMatch(new RegExp(`^${futureDate}T`));
    expect(saved.baseline).toMatchObject({ measure: 'outcome', n: 0 });
    expect(saved.ladder).toEqual([7, 30, 90, 180]);
    expect(saved.openConcerns).toBe('Watch the variance trend');
    expect(onSave).toHaveBeenCalledWith(saved);
  });

  it('prefills the owner field with currentUser.name when no existing record', () => {
    render(
      <ControlRecordEditor
        projectId="inv-abc"
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
      <ControlRecordEditor
        projectId="inv-abc"
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

  it('auto-suggests next re-check on initial mount (no existing record)', () => {
    render(
      <ControlRecordEditor
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next suggested re-check') as HTMLInputElement;
    expect(dateInput.value).not.toBe('');
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('allows the suggested re-check date to be edited directly', () => {
    render(
      <ControlRecordEditor
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next suggested re-check') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2027-01-15' } });
    expect(dateInput.value).toBe('2027-01-15');
  });

  it("preserves an existing record's next suggested re-check", () => {
    const existingRecord: ControlRecord = {
      id: 'rec-existing',
      title: 'Control cadence',
      projectId: 'inv-abc',
      hubId: 'hub-1',
      status: 'verifying',
      improvementDate: '2026-04-01T00:00:00.000Z',
      baseline: {
        capturedAt: 1743465600000,
        window: {
          startISO: '2026-03-01T00:00:00.000Z',
          endISO: '2026-03-31T23:59:59.999Z',
        },
        measure: 'metric',
        n: 12,
        mean: 1,
        sigma: 0.1,
      },
      ladder: [7, 30, 90],
      ladderStep: 1,
      nextCheckSuggestedAt: '2026-12-01T00:00:00.000Z',
      lastEvaluatedSnapshotId: undefined,
      createdAt: 1743465600000, // 2026-04-01T00:00:00.000Z
      updatedAt: 1743465600000,
      deletedAt: null,
    };
    render(
      <ControlRecordEditor
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        existingRecord={existingRecord}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next suggested re-check') as HTMLInputElement;
    expect(dateInput.value).toBe('2026-12-01');
  });

  it('sets a min attribute equal to today on the next suggested re-check input', () => {
    render(
      <ControlRecordEditor
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const dateInput = screen.getByLabelText('Next suggested re-check') as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(dateInput.min).toBe(today);
  });

  it('disables Save during async submit and re-enables on completion', async () => {
    let resolveSave: (() => void) | undefined;
    mockSaveControlRecord.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveSave = resolve;
        })
    );

    render(
      <ControlRecordEditor
        projectId="inv-abc"
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

// ── ControlReviewLogger ───────────────────────────────────────────────

describe('ControlReviewLogger', () => {
  const baseRecord: ControlRecord = {
    id: 'rec-1',
    title: 'Control cadence',
    projectId: 'inv-abc',
    hubId: 'hub-1',
    status: 'verifying',
    improvementDate: '2026-03-01T00:00:00.000Z',
    baseline: {
      capturedAt: 1740787200000,
      window: {
        startISO: '2026-02-01T00:00:00.000Z',
        endISO: '2026-02-28T23:59:59.999Z',
      },
      measure: 'metric',
      n: 12,
      mean: 1,
      sigma: 0.1,
    },
    ladder: [7, 30, 90],
    ladderStep: 0,
    nextCheckSuggestedAt: '2026-04-27T00:00:00.000Z',
    lastEvaluatedSnapshotId: undefined,
    createdAt: 1740787200000, // 2026-03-01T00:00:00.000Z
    updatedAt: 1740787200000,
    deletedAt: null,
  };

  it('fills form with verdict=holding, submits, and updates the latest review pointer', async () => {
    mockListControlRecords.mockResolvedValue([baseRecord]);

    const onSave = vi.fn();
    render(
      <ControlReviewLogger
        recordId="rec-1"
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        reviewerDisplayName="Alice"
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

    await waitFor(() => expect(mockSaveControlReview).toHaveBeenCalledTimes(1));

    const savedReview = mockSaveControlReview.mock.calls[0][0];
    expect(savedReview.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(savedReview.recordId).toBe('rec-1');
    expect(savedReview.projectId).toBe('inv-abc');
    expect(savedReview.hubId).toBe('hub-1');
    expect(savedReview.verdict).toBe('holding');
    expect(savedReview.nowStats.n).toBe(0);
    expect(savedReview.dataStamp.rowCount).toBe(0);
    expect(savedReview.reviewer.displayName).toBe('Alice');
    expect(savedReview.reviewer.userId).toBe(FIXTURE_USER.userId);
    expect(typeof savedReview.reviewedAt).toBe('number');
    expect(savedReview.reviewedAt).toBeGreaterThan(0);

    // Record should be updated with the latest review pointer.
    await waitFor(() => expect(mockSaveControlRecord).toHaveBeenCalledTimes(1));
    const updatedRecord = mockSaveControlRecord.mock.calls[0][0];
    expect(updatedRecord.latestReviewId).toBe(savedReview.id);
    expect(updatedRecord.nextCheckSuggestedAt).toBe('2026-04-27T00:00:00.000Z');

    expect(onSave).toHaveBeenCalledWith(savedReview);
  });

  it('marks the record drifted when the analyst logs a drifted verdict', async () => {
    mockListControlRecords.mockResolvedValue([baseRecord]);

    const onSave = vi.fn();
    render(
      <ControlReviewLogger
        recordId="rec-1"
        projectId="inv-abc"
        hubId="hub-1"
        currentUser={FIXTURE_USER}
        reviewerDisplayName="Bob"
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Drifted'));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSaveControlRecord).toHaveBeenCalledTimes(1));
    const updatedRecord = mockSaveControlRecord.mock.calls[0][0];
    expect(updatedRecord.status).toBe('drifted');
  });
});

// ── ControlHandoffEditor ──────────────────────────────────────────────────

describe('ControlHandoffEditor', () => {
  it('fills form, submits, and calls saveControlHandoff with correct payload', async () => {
    const onSave = vi.fn();

    render(
      <ControlHandoffEditor
        projectId="inv-abc"
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
    expect(saved.projectId).toBe('inv-abc');
    expect(saved.hubId).toBe('hub-1');
    expect(saved.surface).toBe('qms-procedure');
    expect(saved.systemName).toBe('Veeva QMS');
    expect(saved.operationalOwner.displayName).toBe('Dave Smith');
    expect(typeof saved.handoffDate).toBe('number');
    // 2026-04-27T00:00:00.000Z = 1745712000000
    expect(new Date(saved.handoffDate).toISOString().startsWith('2026-04-27')).toBe(true);
    expect(saved.description).toBe('Procedure updated in QMS');
    expect(saved.recordedBy.displayName).toBe('Carol');
    expect(saved.recordedBy.userId).toBe(FIXTURE_USER.userId);
    // operationalOwner is a separate person; no people picker yet, so userId is omitted.
    expect(saved.operationalOwner.userId).toBeUndefined();

    expect(onSave).toHaveBeenCalledWith(saved);
  });

  it('updates relatedRecord.controlHandoffId after saving the handoff', async () => {
    const relatedRecord: ControlRecord = {
      id: 'rec-1',
      title: 'Control cadence',
      projectId: 'inv-abc',
      hubId: 'hub-1',
      status: 'verifying',
      improvementDate: '2026-03-01T00:00:00.000Z',
      baseline: {
        capturedAt: 1740787200000,
        window: {
          startISO: '2026-02-01T00:00:00.000Z',
          endISO: '2026-02-28T23:59:59.999Z',
        },
        measure: 'metric',
        n: 12,
        mean: 1,
        sigma: 0.1,
      },
      ladder: [7, 30, 90],
      ladderStep: 0,
      lastEvaluatedSnapshotId: undefined,
      createdAt: 1740787200000, // 2026-03-01T00:00:00.000Z
      updatedAt: 1740787200000,
      deletedAt: null,
    };

    const onSave = vi.fn();

    render(
      <ControlHandoffEditor
        projectId="inv-abc"
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
    await waitFor(() => expect(mockSaveControlRecord).toHaveBeenCalledTimes(1));

    const savedHandoff = mockSaveControlHandoff.mock.calls[0][0];
    const updatedRecord = mockSaveControlRecord.mock.calls[0][0];
    expect(updatedRecord.id).toBe('rec-1');
    expect(updatedRecord.controlHandoffId).toBe(savedHandoff.id);
  });
});
