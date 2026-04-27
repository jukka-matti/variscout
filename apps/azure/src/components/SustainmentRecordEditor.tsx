import React, { useState } from 'react';
import type { SustainmentCadence, SustainmentRecord } from '@variscout/core';
import { useStorage } from '../services/storage';

export interface SustainmentRecordEditorProps {
  investigationId: string;
  hubId: string;
  existingRecord?: SustainmentRecord;
  onSave: (record: SustainmentRecord) => void;
  onCancel: () => void;
}

const CADENCE_OPTIONS: { value: SustainmentCadence; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semiannual', label: 'Semiannual' },
  { value: 'annual', label: 'Annual' },
  { value: 'on-demand', label: 'On-demand' },
];

const SustainmentRecordEditor: React.FC<SustainmentRecordEditorProps> = ({
  investigationId,
  hubId,
  existingRecord,
  onSave,
  onCancel,
}) => {
  const storage = useStorage();

  const [cadence, setCadence] = useState<SustainmentCadence>(existingRecord?.cadence ?? 'monthly');
  const [owner, setOwner] = useState(existingRecord?.owner?.displayName ?? '');
  const [nextReviewDue, setNextReviewDue] = useState(
    existingRecord?.nextReviewDue ? existingRecord.nextReviewDue.slice(0, 10) : ''
  );
  const [openConcerns, setOpenConcerns] = useState(existingRecord?.openConcerns ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const record: SustainmentRecord = {
      id: existingRecord?.id ?? crypto.randomUUID(),
      investigationId,
      hubId,
      cadence,
      nextReviewDue: nextReviewDue
        ? new Date(nextReviewDue + 'T00:00:00.000Z').toISOString()
        : undefined,
      owner: owner
        ? {
            userId: existingRecord?.owner?.userId ?? crypto.randomUUID(),
            displayName: owner,
          }
        : undefined,
      openConcerns: openConcerns || undefined,
      latestVerdict: existingRecord?.latestVerdict,
      latestReviewAt: existingRecord?.latestReviewAt,
      latestReviewId: existingRecord?.latestReviewId,
      controlHandoffId: existingRecord?.controlHandoffId,
      tombstoneAt: existingRecord?.tombstoneAt,
      createdAt: existingRecord?.createdAt ?? now,
      updatedAt: now,
    };

    await storage.saveSustainmentRecord(record);
    onSave(record);
  };

  return (
    <form
      className="space-y-3 rounded-md border border-edge bg-surface p-4"
      onSubmit={handleSubmit}
    >
      <h4 className="text-sm font-semibold text-content">Sustainment record</h4>

      <div>
        <label className="block text-xs font-medium text-content-secondary" htmlFor="sre-cadence">
          Cadence
        </label>
        <select
          id="sre-cadence"
          aria-label="Cadence"
          value={cadence}
          onChange={e => setCadence(e.target.value as SustainmentCadence)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {CADENCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
          htmlFor="sre-next-review"
        >
          Next review due
        </label>
        <input
          id="sre-next-review"
          aria-label="Next review due"
          type="date"
          value={nextReviewDue}
          onChange={e => setNextReviewDue(e.target.value)}
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

export default SustainmentRecordEditor;
