import React, { useState } from 'react';
import SustainmentRecordEditor from '../components/SustainmentRecordEditor';

export interface SustainmentEntryRowProps {
  investigationId: string | null;
  hubId: string;
}

export const SustainmentEntryRow: React.FC<SustainmentEntryRowProps> = ({
  investigationId,
  hubId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  if (!investigationId) {
    return (
      <div className="mt-3">
        <button
          type="button"
          disabled
          className="rounded-md border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-content-secondary opacity-50 cursor-not-allowed"
        >
          Set up sustainment cadence
        </button>
        <span className="ml-3 text-xs text-content-secondary">
          Save the investigation first to set up sustainment cadence.
        </span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="mt-3">
        <SustainmentRecordEditor
          investigationId={investigationId}
          hubId={hubId}
          onSave={() => {
            setIsEditing(false);
            setConfirmation('Sustainment cadence saved.');
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-md border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-secondary"
      >
        Set up sustainment cadence
      </button>
      {confirmation && <span className="text-xs text-green-700">{confirmation}</span>}
    </div>
  );
};
