import React, { useEffect, useState } from 'react';
import type { SustainmentRecord } from '@variscout/core';
import SustainmentRecordEditor from '../components/SustainmentRecordEditor';
import { getEasyAuthUser } from '../auth/easyAuth';
import type { EasyAuthUser } from '../auth/types';
import { useStorage } from '../services/storage';

export interface SustainmentEntryRowProps {
  investigationId: string | null;
  hubId: string;
}

export const SustainmentEntryRow: React.FC<SustainmentEntryRowProps> = ({
  investigationId,
  hubId,
}) => {
  const { listSustainmentRecords } = useStorage();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [existingRecord, setExistingRecord] = useState<SustainmentRecord | null>(null);
  const [currentUser, setCurrentUser] = useState<EasyAuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEasyAuthUser().then(user => {
      if (!cancelled) setCurrentUser(user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!investigationId) {
      setExistingRecord(null);
      return;
    }
    listSustainmentRecords(hubId).then(records => {
      if (cancelled) return;
      const live = records.find(r => r.investigationId === investigationId && !r.tombstoneAt);
      setExistingRecord(live ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [investigationId, hubId, listSustainmentRecords, confirmation]);

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

  if (isEditing && currentUser) {
    return (
      <div className="mt-3">
        <SustainmentRecordEditor
          investigationId={investigationId}
          hubId={hubId}
          currentUser={currentUser}
          existingRecord={existingRecord ?? undefined}
          onSave={() => {
            setIsEditing(false);
            setConfirmation(
              existingRecord ? 'Sustainment cadence updated.' : 'Sustainment cadence saved.'
            );
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const buttonLabel = existingRecord ? 'Edit sustainment cadence' : 'Set up sustainment cadence';
  const buttonDisabled = !currentUser;

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        disabled={buttonDisabled}
        className="rounded-md border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel}
      </button>
      {confirmation && <span className="text-xs text-green-700">{confirmation}</span>}
    </div>
  );
};
