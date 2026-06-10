import React, { useState } from 'react';
import type { ControlRecord } from '@variscout/core';
import type { EasyAuthUser } from '../auth/types';
import { useStorage } from '../services/storage';

export interface ControlRecordEditorProps {
  projectId: string;
  hubId: string;
  currentUser: EasyAuthUser;
  existingRecord?: ControlRecord;
  onSave: (record: ControlRecord) => void;
  onCancel: () => void;
}

const todayDateString = (): string => new Date().toISOString().slice(0, 10);

const ControlRecordEditor: React.FC<ControlRecordEditorProps> = ({
  projectId,
  hubId,
  currentUser,
  existingRecord,
  onSave,
  onCancel,
}) => {
  const storage = useStorage();

  const [owner, setOwner] = useState(existingRecord?.owner?.displayName ?? currentUser.name ?? '');
  const [improvementDate, setImprovementDate] = useState(
    existingRecord?.improvementDate
      ? existingRecord.improvementDate.slice(0, 10)
      : todayDateString()
  );
  const [nextCheckSuggestedAt, setNextCheckSuggestedAt] = useState(
    existingRecord?.nextCheckSuggestedAt
      ? existingRecord.nextCheckSuggestedAt.slice(0, 10)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [openConcerns, setOpenConcerns] = useState(existingRecord?.openConcerns ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const nowMs = Date.now();
    const record: ControlRecord = {
      id: existingRecord?.id ?? crypto.randomUUID(),
      title: existingRecord?.title ?? 'Control cadence',
      projectId,
      hubId,
      status: existingRecord?.status ?? 'verifying',
      improvementDate: new Date(improvementDate + 'T00:00:00.000Z').toISOString(),
      baseline: existingRecord?.baseline ?? {
        capturedAt: nowMs,
        window: {
          startISO: new Date(improvementDate + 'T00:00:00.000Z').toISOString(),
          endISO: new Date(improvementDate + 'T00:00:00.000Z').toISOString(),
        },
        measure: 'outcome',
        n: 0,
        mean: 0,
        sigma: 0,
      },
      ladder: existingRecord?.ladder ?? [7, 30, 90, 180],
      ladderStep: existingRecord?.ladderStep ?? 0,
      nextCheckSuggestedAt: nextCheckSuggestedAt
        ? new Date(nextCheckSuggestedAt + 'T00:00:00.000Z').toISOString()
        : undefined,
      lastEvaluatedSnapshotId: existingRecord?.lastEvaluatedSnapshotId,
      owner: owner
        ? {
            userId: existingRecord?.owner?.userId ?? currentUser.userId,
            displayName: owner,
          }
        : undefined,
      openConcerns: openConcerns || undefined,
      latestReviewAt: existingRecord?.latestReviewAt,
      latestReviewId: existingRecord?.latestReviewId,
      controlHandoffId: existingRecord?.controlHandoffId,
      deletedAt: existingRecord?.deletedAt ?? null,
      createdAt: existingRecord?.createdAt ?? nowMs,
      updatedAt: nowMs,
    };

    try {
      await storage.saveControlRecord(record);
      onSave(record);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-3 rounded-md border border-edge bg-surface p-4"
      onSubmit={handleSubmit}
    >
      <h4 className="text-sm font-semibold text-content">Control record</h4>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="sre-improvement-date"
        >
          Improvement date
        </label>
        <input
          id="sre-improvement-date"
          aria-label="Improvement date"
          type="date"
          value={improvementDate}
          onChange={e => setImprovementDate(e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-content-secondary" htmlFor="sre-owner">
          Owner
        </label>
        <input
          id="sre-owner"
          aria-label="Owner"
          type="text"
          value={owner}
          onChange={e => setOwner(e.target.value)}
          placeholder="Display name"
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="sre-next-check"
        >
          Next suggested re-check
        </label>
        <input
          id="sre-next-check"
          aria-label="Next suggested re-check"
          type="date"
          value={nextCheckSuggestedAt}
          min={todayDateString()}
          onChange={e => setNextCheckSuggestedAt(e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="sre-open-concerns"
        >
          Open concerns
        </label>
        <textarea
          id="sre-open-concerns"
          aria-label="Open concerns"
          value={openConcerns}
          onChange={e => setOpenConcerns(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-edge px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default ControlRecordEditor;
