import React, { useState } from 'react';
import type { ControlHandoff, ControlHandoffSurface, SustainmentRecord } from '@variscout/core';
import type { EasyAuthUser } from '../auth/types';
import { useStorage } from '../services/storage';

export interface ControlHandoffEditorProps {
  investigationId: string;
  hubId: string;
  currentUser: EasyAuthUser;
  existingHandoff?: ControlHandoff;
  recordedByDisplayName: string;
  relatedRecord?: SustainmentRecord;
  onSave: (handoff: ControlHandoff) => void;
  onCancel: () => void;
}

const SURFACE_OPTIONS: { value: ControlHandoffSurface; label: string }[] = [
  { value: 'mes-recipe', label: 'MES recipe' },
  { value: 'scada-alarm', label: 'SCADA alarm' },
  { value: 'qms-procedure', label: 'QMS procedure' },
  { value: 'work-instruction', label: 'Work instruction' },
  { value: 'training-record', label: 'Training record' },
  { value: 'audit-program', label: 'Audit program' },
  { value: 'dashboard-only', label: 'Dashboard only' },
  { value: 'ticket-queue', label: 'Ticket queue' },
  { value: 'other', label: 'Other' },
];

const todayString = (): string => new Date().toISOString().slice(0, 10);

const ControlHandoffEditor: React.FC<ControlHandoffEditorProps> = ({
  investigationId,
  hubId,
  currentUser,
  existingHandoff,
  recordedByDisplayName,
  relatedRecord,
  onSave,
  onCancel,
}) => {
  const storage = useStorage();

  const [surface, setSurface] = useState<ControlHandoffSurface>(
    existingHandoff?.surface ?? 'qms-procedure'
  );
  const [systemName, setSystemName] = useState(existingHandoff?.systemName ?? '');
  const [operationalOwnerName, setOperationalOwnerName] = useState(
    existingHandoff?.operationalOwner.displayName ?? ''
  );
  const [handoffDate, setHandoffDate] = useState(
    existingHandoff?.handoffDate ? existingHandoff.handoffDate.slice(0, 10) : todayString()
  );
  const [description, setDescription] = useState(existingHandoff?.description ?? '');
  const [referenceUri, setReferenceUri] = useState(existingHandoff?.referenceUri ?? '');
  const [retainSustainmentReview, setRetainSustainmentReview] = useState(
    existingHandoff?.retainSustainmentReview ?? true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();

    const handoff: ControlHandoff = {
      id: existingHandoff?.id ?? crypto.randomUUID(),
      investigationId,
      hubId,
      surface,
      systemName,
      operationalOwner: { userId: currentUser.userId, displayName: operationalOwnerName },
      handoffDate: new Date(handoffDate + 'T00:00:00.000Z').toISOString(),
      description,
      referenceUri: referenceUri || undefined,
      retainSustainmentReview,
      recordedAt: existingHandoff?.recordedAt ?? now,
      recordedBy: existingHandoff?.recordedBy ?? {
        userId: currentUser.userId,
        displayName: recordedByDisplayName,
      },
    };

    await storage.saveControlHandoff(handoff);

    if (relatedRecord && relatedRecord.controlHandoffId !== handoff.id) {
      await storage.saveSustainmentRecord({
        ...relatedRecord,
        controlHandoffId: handoff.id,
        updatedAt: new Date().toISOString(),
      });
    }

    onSave(handoff);
  };

  return (
    <form
      className="space-y-3 rounded-md border border-edge bg-surface p-4"
      onSubmit={handleSubmit}
    >
      <h4 className="text-sm font-semibold text-content">Control handoff</h4>

      <div>
        <label className="block text-xs font-medium text-content-secondary" htmlFor="che-surface">
          Surface
        </label>
        <select
          id="che-surface"
          aria-label="Surface"
          value={surface}
          onChange={e => setSurface(e.target.value as ControlHandoffSurface)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {SURFACE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="che-system-name"
        >
          System name
        </label>
        <input
          id="che-system-name"
          aria-label="System name"
          type="text"
          value={systemName}
          onChange={e => setSystemName(e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-content-secondary" htmlFor="che-op-owner">
          Operational owner
        </label>
        <input
          id="che-op-owner"
          aria-label="Operational owner"
          type="text"
          value={operationalOwnerName}
          onChange={e => setOperationalOwnerName(e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="che-handoff-date"
        >
          Handoff date
        </label>
        <input
          id="che-handoff-date"
          aria-label="Handoff date"
          type="date"
          value={handoffDate}
          onChange={e => setHandoffDate(e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="che-description"
        >
          Description
        </label>
        <textarea
          id="che-description"
          aria-label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-content-secondary"
          htmlFor="che-reference-uri"
        >
          Reference URI
        </label>
        <input
          id="che-reference-uri"
          aria-label="Reference URI"
          type="text"
          value={referenceUri}
          onChange={e => setReferenceUri(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-md border border-edge bg-surface-secondary px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="che-retain-review"
          aria-label="Retain sustainment review"
          type="checkbox"
          checked={retainSustainmentReview}
          onChange={e => setRetainSustainmentReview(e.target.checked)}
          className="h-4 w-4 rounded border-edge"
        />
        <label className="text-xs font-medium text-content-secondary" htmlFor="che-retain-review">
          Retain sustainment review after handoff
        </label>
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

export default ControlHandoffEditor;
