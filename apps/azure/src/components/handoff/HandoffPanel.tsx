import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HandoffForm, type HandoffChangePatch } from '@variscout/ui';
import { useTier } from '@variscout/hooks';
import type { ControlHandoff, ProcessHub, SustainmentRecord } from '@variscout/core';
import { azureHubRepository } from '../../persistence';

interface HandoffPanelProps {
  activeHub?: ProcessHub;
  targetId?: string;
  onBack: () => void;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `handoff-${Date.now()}`;
}

function liveConfirmedRecords(records: SustainmentRecord[] | undefined): SustainmentRecord[] {
  return (records ?? []).filter(
    record => record.deletedAt === null && record.status === 'confirmed-sustained'
  );
}

function selectRecord(records: SustainmentRecord[], targetId: string | undefined) {
  if (targetId) {
    const byId = records.find(record => record.id === targetId);
    if (byId) return byId;
    const byHandoff = records.find(record => record.controlHandoffId === targetId);
    if (byHandoff) return byHandoff;
  }
  return records[0] ?? null;
}

function selectHandoff(
  handoffs: ControlHandoff[],
  record: SustainmentRecord | null,
  targetId: string | undefined
) {
  if (targetId) {
    const byId = handoffs.find(handoff => handoff.id === targetId);
    if (byId) return byId;
  }
  if (!record) return null;
  return (
    handoffs.find(handoff => handoff.id === record.controlHandoffId) ??
    handoffs.find(handoff => handoff.investigationId === record.investigationId) ??
    null
  );
}

function buildDraftHandoff(hub: ProcessHub, record: SustainmentRecord): ControlHandoff {
  const now = Date.now();
  return {
    id: makeId(),
    investigationId: record.investigationId,
    hubId: hub.id,
    status: 'pending',
    surface: 'qms-procedure',
    systemName: '',
    operationalOwner: record.owner ?? hub.processOwner ?? { displayName: '' },
    handoffDate: now,
    description: record.targetSummary ?? '',
    retainSustainmentReview: true,
    recordedBy: { displayName: 'Azure user' },
    escalationPath: record.openConcerns,
    reactionPlan: '',
    createdAt: now,
    deletedAt: null,
  };
}

const HandoffPanel: React.FC<HandoffPanelProps> = ({ activeHub, targetId, onBack }) => {
  const { isPaid } = useTier();
  const [records, setRecords] = useState<SustainmentRecord[]>([]);
  const [handoffs, setHandoffs] = useState<ControlHandoff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(activeHub));
  const creatingForRecordRef = useRef<string | null>(null);

  useEffect(() => {
    setRecords(liveConfirmedRecords(activeHub?.sustainmentRecords));
    setHandoffs((activeHub?.controlHandoffs ?? []).filter(handoff => handoff.deletedAt === null));
    setError(null);
    setIsLoading(Boolean(activeHub));

    if (!activeHub) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    void Promise.all([
      azureHubRepository.sustainmentRecords.listByHub(activeHub.id),
      azureHubRepository.controlHandoffs.listByHub(activeHub.id),
    ])
      .then(([loadedRecords, loadedHandoffs]) => {
        if (cancelled) return;
        setRecords(liveConfirmedRecords(loadedRecords));
        setHandoffs(loadedHandoffs.filter(handoff => handoff.deletedAt === null));
      })
      .catch(() => {
        if (cancelled) return;
        setRecords(liveConfirmedRecords(activeHub.sustainmentRecords));
        setHandoffs(
          (activeHub.controlHandoffs ?? []).filter(handoff => handoff.deletedAt === null)
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub]);

  const selectedRecord = useMemo(() => selectRecord(records, targetId), [records, targetId]);
  const selectedHandoff = useMemo(
    () => selectHandoff(handoffs, selectedRecord, targetId),
    [handoffs, selectedRecord, targetId]
  );

  useEffect(() => {
    if (!activeHub || isLoading || !selectedRecord || selectedHandoff) return;
    if (creatingForRecordRef.current === selectedRecord.id) return;

    const draft = buildDraftHandoff(activeHub, selectedRecord);
    creatingForRecordRef.current = selectedRecord.id;
    setError(null);
    let cancelled = false;

    void (async () => {
      await azureHubRepository.dispatch({
        kind: 'CONTROL_HANDOFF_CREATE',
        hubId: activeHub.id,
        handoff: draft,
      });
      if (!selectedRecord.controlHandoffId) {
        await azureHubRepository.dispatch({
          kind: 'SUSTAINMENT_RECORD_UPDATE',
          recordId: selectedRecord.id,
          patch: { controlHandoffId: draft.id },
        });
      }
    })()
      .then(() => {
        if (cancelled) return;
        setHandoffs(current => [...current, draft]);
        setRecords(current =>
          current.map(record =>
            record.id === selectedRecord.id ? { ...record, controlHandoffId: draft.id } : record
          )
        );
      })
      .catch(() => {
        if (!cancelled) setError('Could not create a handoff.');
      })
      .finally(() => {
        if (creatingForRecordRef.current === selectedRecord.id) creatingForRecordRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub, isLoading, selectedHandoff, selectedRecord]);

  const patchHandoff = useCallback(
    (patch: HandoffChangePatch) => {
      if (!selectedHandoff) return;
      const next = { ...selectedHandoff, ...patch };
      setHandoffs(current =>
        current.map(handoff => (handoff.id === selectedHandoff.id ? next : handoff))
      );
      void azureHubRepository
        .dispatch({ kind: 'CONTROL_HANDOFF_UPDATE', handoffId: selectedHandoff.id, patch })
        .catch(() => setError('Could not save handoff changes.'));
    },
    [selectedHandoff]
  );

  const acknowledge = useCallback(() => {
    if (!selectedHandoff) return;
    const acknowledgedAt = Date.now();
    const acknowledgedBy = selectedHandoff.operationalOwner;
    setHandoffs(current =>
      current.map(handoff =>
        handoff.id === selectedHandoff.id
          ? {
              ...handoff,
              status: 'acknowledged',
              acknowledgedAt,
              ownerAcknowledgement: { acknowledgedBy },
            }
          : handoff
      )
    );
    void azureHubRepository.dispatch({
      kind: 'CONTROL_HANDOFF_ACKNOWLEDGE',
      handoffId: selectedHandoff.id,
      acknowledgedAt,
      acknowledgedBy,
    });
  }, [selectedHandoff]);

  const markOperational = useCallback(() => {
    if (!selectedHandoff) return;
    const operationalAt = Date.now();
    setHandoffs(current =>
      current.map(handoff =>
        handoff.id === selectedHandoff.id
          ? { ...handoff, status: 'operational', operationalAt }
          : handoff
      )
    );
    void azureHubRepository.dispatch({
      kind: 'CONTROL_HANDOFF_MARK_OPERATIONAL',
      handoffId: selectedHandoff.id,
      operationalAt,
    });
  }, [selectedHandoff]);

  const sponsorSignoff = useCallback(() => {
    if (!selectedHandoff) return;
    const signoff = { approvedAt: Date.now(), approvedBy: { displayName: 'Sponsor' } };
    setHandoffs(current =>
      current.map(handoff =>
        handoff.id === selectedHandoff.id
          ? {
              ...handoff,
              status: 'operational',
              operationalAt: handoff.operationalAt ?? signoff.approvedAt,
              signoff: { ...(handoff.signoff ?? {}), ...signoff },
            }
          : handoff
      )
    );
    void azureHubRepository.dispatch({
      kind: 'CONTROL_HANDOFF_SIGNOFF',
      handoffId: selectedHandoff.id,
      signoff,
    });
  }, [selectedHandoff]);

  const heading = activeHub?.name ?? 'No active hub';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-surface-primary p-4 text-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Handoff</h2>
          <p className="text-sm text-content-secondary">{heading}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Back to FRAME
        </button>
      </div>

      {!activeHub ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Create or select a Process Hub before opening handoff.
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm">
          {error}
        </p>
      ) : isLoading ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Loading handoff...
        </p>
      ) : selectedHandoff ? (
        <HandoffForm
          handoff={selectedHandoff}
          sustainmentRecord={selectedRecord ?? undefined}
          isPaidTier={isPaid}
          onHandoffChange={patchHandoff}
          onAcknowledge={acknowledge}
          onMarkOperational={markOperational}
          onSponsorSignoff={sponsorSignoff}
        />
      ) : selectedRecord ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Creating handoff...
        </p>
      ) : (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Confirm sustainment before recording handoff.
        </p>
      )}
    </div>
  );
};

export default HandoffPanel;
