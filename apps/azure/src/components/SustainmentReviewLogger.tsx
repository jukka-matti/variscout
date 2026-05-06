import React, { useState } from 'react';
import type { SustainmentCadence, SustainmentReview, SustainmentVerdict } from '@variscout/core';
import { nextDueFromCadence } from '@variscout/core';
import type { EasyAuthUser } from '../auth/types';
import { useStorage } from '../services/storage';

export interface SustainmentReviewLoggerProps {
  recordId: string;
  investigationId: string;
  hubId: string;
  currentUser: EasyAuthUser;
  reviewerDisplayName: string;
  latestSnapshotId?: string;
  cadence: SustainmentCadence;
  onSave: (review: SustainmentReview) => void;
  onCancel: () => void;
}

const VERDICTS: { value: SustainmentVerdict; label: string }[] = [
  { value: 'holding', label: 'Holding' },
  { value: 'drifting', label: 'Drifting' },
  { value: 'broken', label: 'Broken' },
  { value: 'inconclusive', label: 'Inconclusive' },
];

const SustainmentReviewLogger: React.FC<SustainmentReviewLoggerProps> = ({
  recordId,
  investigationId,
  hubId,
  currentUser,
  reviewerDisplayName,
  latestSnapshotId,
  cadence,
  onSave,
  onCancel,
}) => {
  const storage = useStorage();

  const [verdict, setVerdict] = useState<SustainmentVerdict>('holding');
  const [observation, setObservation] = useState('');
  const [snapshotId, setSnapshotId] = useState(latestSnapshotId ?? '');
  const [escalatedInvestigationId, setEscalatedInvestigationId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nowMs = Date.now();

    const review: SustainmentReview = {
      id: crypto.randomUUID(),
      recordId,
      investigationId,
      hubId,
      reviewedAt: nowMs,
      createdAt: nowMs,
      deletedAt: null,
      reviewer: { userId: currentUser.userId, displayName: reviewerDisplayName },
      verdict,
      snapshotId: snapshotId || undefined,
      observation: observation || undefined,
      escalatedInvestigationId: escalatedInvestigationId || undefined,
    };

    await storage.saveSustainmentReview(review);

    // Update parent record with latest verdict + recomputed next due
    const records = await storage.listSustainmentRecords(hubId);
    const parentRecord = records.find(r => r.id === recordId);
    if (parentRecord) {
      const nextDue = nextDueFromCadence(cadence, new Date(nowMs));
      const updatedRecord = {
        ...parentRecord,
        latestVerdict: verdict,
        latestReviewAt: new Date(nowMs).toISOString(),
        latestReviewId: review.id,
        updatedAt: nowMs,
      };
      if (nextDue !== undefined) {
        updatedRecord.nextReviewDue = nextDue;
      } else {
        delete updatedRecord.nextReviewDue;
      }
      await storage.saveSustainmentRecord(updatedRecord);
    }

    onSave(review);
  };

  return (
    <form
      className="space-y-3 rounded-md border border-edge bg-surface p-4"
      onSubmit={handleSubmit}
    >
      <h4 className="text-sm font-semibold text-content">Log sustainment review</h4>

      <div>
        <p className="mb-1 text-xs font-medium text-content-secondary">Verdict</p>
        <div className="flex flex-wrap gap-3">
          {VERDICTS.map(v => (
            <label
              key={v.value}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-content"
            >
              <input
                type="radio"
                name="srl-verdict"
                value={v.value}
                checked={verdict === v.value}
                onChange={() => setVerdict(v.value)}
                aria-label={v.label}
              />
              {v.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="srl-observation"
        >
          Observation
        </label>
        <textarea
          id="srl-observation"
          aria-label="Observation"
          value={observation}
          onChange={e => setObservation(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-content-secondary" htmlFor="srl-snapshot">
          Snapshot ID
        </label>
        <input
          id="srl-snapshot"
          aria-label="Snapshot ID"
          type="text"
          value={snapshotId}
          onChange={e => setSnapshotId(e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-content-secondary" htmlFor="srl-escalated">
          Escalated investigation ID
        </label>
        <input
          id="srl-escalated"
          aria-label="Escalated investigation ID"
          type="text"
          value={escalatedInvestigationId}
          onChange={e => setEscalatedInvestigationId(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-edge px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-surface-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default SustainmentReviewLogger;
