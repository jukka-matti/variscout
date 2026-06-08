import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Finding, Hypothesis } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';
import FindingComments from '../FindingsLog/FindingComments';
import { HypothesisComments } from './HypothesisComments';

export type ObjectDetailSelection = { kind: 'cause'; id: string } | { kind: 'finding'; id: string };

type DetailTab = 'evidence' | 'comments' | 'activity';

export interface ObjectDetailDrawerProps {
  selectedObject: ObjectDetailSelection | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  hubs: ReadonlyArray<Hypothesis>;
  findings: ReadonlyArray<Finding>;
  members: ReadonlyArray<ProjectMember>;
  currentUserId: string | null;
  onAddHubComment?: (hubId: string, text: string, attachment?: File) => void;
  onEditHubComment?: (hubId: string, commentId: string, text: string) => void;
  onDeleteHubComment?: (hubId: string, commentId: string) => void;
  onAddFindingComment?: (findingId: string, text: string, attachment?: File) => void;
  onEditFindingComment?: (findingId: string, commentId: string, text: string) => void;
  onDeleteFindingComment?: (findingId: string, commentId: string) => void;
  onAddFindingPhoto?: (findingId: string, commentId: string, file: File) => void;
  showAuthors?: boolean;
}

const noopAdd = () => {};
const noopEdit = () => {};
const noopDelete = () => {};

const findingEvidenceTypeLabel: Record<Finding['evidenceType'], string> = {
  data: 'Data',
  gemba: 'Gemba',
  expert: 'Expert',
};

const findingStatusLabel: Record<Finding['status'], string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  analyzed: 'Analyzed',
  improving: 'Improving',
  resolved: 'Resolved',
};

function statusLabel(status: string): string {
  return status
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function splitCauseFindings(hub: Hypothesis, findings: ReadonlyArray<Finding>) {
  const counterIds = new Set(hub.counterFindingIds ?? []);
  const byId = new Map(findings.map(finding => [finding.id, finding]));
  const linked = hub.findingIds.map(id => byId.get(id)).filter((f): f is Finding => Boolean(f));
  return {
    supporting: linked.filter(finding => !counterIds.has(finding.id)),
    counter: linked.filter(finding => counterIds.has(finding.id)),
  };
}

function renderFindingList(findings: ReadonlyArray<Finding>, emptyText: string) {
  if (findings.length === 0) {
    return <p className="text-xs text-content-tertiary">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {findings.map(finding => (
        <li key={finding.id} className="rounded border border-edge bg-surface-secondary px-2 py-2">
          <p className="text-sm font-medium text-content">{finding.text}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-content-tertiary">
            {findingEvidenceTypeLabel[finding.evidenceType]} · {findingStatusLabel[finding.status]}
          </p>
        </li>
      ))}
    </ul>
  );
}

export const ObjectDetailDrawer: React.FC<ObjectDetailDrawerProps> = ({
  selectedObject,
  isOpen,
  onOpenChange,
  hubs,
  findings,
  members,
  currentUserId,
  onAddHubComment = noopAdd,
  onEditHubComment = noopEdit,
  onDeleteHubComment = noopDelete,
  onAddFindingComment = noopAdd,
  onEditFindingComment = noopEdit,
  onDeleteFindingComment = noopDelete,
  onAddFindingPhoto,
  showAuthors,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('evidence');

  const selectedCause = useMemo(
    () =>
      selectedObject?.kind === 'cause' ? hubs.find(hub => hub.id === selectedObject.id) : undefined,
    [hubs, selectedObject]
  );
  const selectedFinding = useMemo(
    () =>
      selectedObject?.kind === 'finding'
        ? findings.find(finding => finding.id === selectedObject.id)
        : undefined,
    [findings, selectedObject]
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        data-testid="object-detail-handle"
        onClick={() => onOpenChange(true)}
        className="absolute left-3 top-16 z-30 inline-flex items-center gap-1 rounded border border-edge bg-surface/95 px-2 py-1 text-xs font-medium text-content shadow-sm hover:bg-surface-secondary"
        aria-label="Open object details"
      >
        <ChevronRight size={14} aria-hidden="true" />
        Details
      </button>
    );
  }

  const title = selectedCause?.name ?? selectedFinding?.text ?? 'No object selected';
  const kindLabel = selectedCause ? 'Suspected cause' : selectedFinding ? 'Finding' : 'Details';
  const actionRows = selectedCause?.actions ?? selectedFinding?.actions ?? [];
  const { supporting, counter } = selectedCause
    ? splitCauseFindings(selectedCause, findings)
    : { supporting: [], counter: [] };

  return (
    <aside
      data-testid="object-detail-drawer"
      className="absolute left-3 top-16 z-30 flex max-h-[calc(100%-5rem)] w-[min(360px,calc(100%-1.5rem))] flex-col overflow-hidden rounded border border-edge bg-surface shadow-xl"
      aria-label="Object details"
    >
      <div className="flex items-start gap-2 border-b border-edge px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
            {kindLabel}
          </p>
          <h2
            data-testid="object-detail-title"
            className="mt-0.5 line-clamp-2 text-sm font-semibold text-content"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded p-1 text-content-secondary hover:bg-surface-secondary hover:text-content"
          aria-label="Collapse object details"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="flex border-b border-edge px-2 pt-2" role="tablist" aria-label="Detail tabs">
        {(['evidence', 'comments', 'activity'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-t px-3 py-1.5 text-xs font-medium ${
              activeTab === tab
                ? 'bg-surface-secondary text-content'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {activeTab === 'evidence' ? (
          <div data-testid="object-detail-evidence" className="space-y-4">
            {selectedCause ? (
              <>
                {selectedCause.synthesis ? (
                  <p className="rounded border border-edge bg-surface-secondary px-2 py-2 text-sm text-content-secondary">
                    {selectedCause.synthesis}
                  </p>
                ) : null}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                    Supports
                  </h3>
                  {renderFindingList(supporting, 'No supporting findings linked yet.')}
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                    Counts against
                  </h3>
                  {renderFindingList(counter, 'No counter findings linked yet.')}
                </section>
              </>
            ) : selectedFinding ? (
              <div className="space-y-2">
                <p className="rounded border border-edge bg-surface-secondary px-2 py-2 text-sm text-content">
                  {selectedFinding.text}
                </p>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-edge px-2 py-2">
                    <dt className="text-content-tertiary">Evidence type</dt>
                    <dd className="mt-1 font-semibold text-content">
                      {findingEvidenceTypeLabel[selectedFinding.evidenceType]}
                    </dd>
                  </div>
                  <div className="rounded border border-edge px-2 py-2">
                    <dt className="text-content-tertiary">Status</dt>
                    <dd className="mt-1 font-semibold text-content">
                      {findingStatusLabel[selectedFinding.status]}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-content-secondary">Select a Wall object to inspect it.</p>
            )}
          </div>
        ) : null}

        {activeTab === 'comments' ? (
          <div data-testid="object-detail-comments">
            {selectedCause ? (
              <HypothesisComments
                hub={selectedCause}
                members={members}
                currentUserId={currentUserId}
                onAdd={onAddHubComment}
                onEdit={onEditHubComment}
                onDelete={onDeleteHubComment}
                showAuthors={showAuthors}
              />
            ) : selectedFinding ? (
              <FindingComments
                comments={selectedFinding.comments}
                findingId={selectedFinding.id}
                onAdd={onAddFindingComment}
                onEdit={onEditFindingComment}
                onDelete={onDeleteFindingComment}
                onAddPhoto={onAddFindingPhoto}
                showAuthors={showAuthors}
                canEdit
              />
            ) : (
              <p className="text-sm text-content-secondary">Select a Wall object to comment.</p>
            )}
          </div>
        ) : null}

        {activeTab === 'activity' ? (
          <div data-testid="object-detail-activity" className="space-y-3">
            {selectedCause ? (
              <p className="text-xs text-content-secondary">
                Status: <span className="font-semibold">{statusLabel(selectedCause.status)}</span>
              </p>
            ) : selectedFinding ? (
              <p className="text-xs text-content-secondary">
                Status:{' '}
                <span className="font-semibold">{findingStatusLabel[selectedFinding.status]}</span>
              </p>
            ) : null}
            {actionRows.length > 0 ? (
              <ul className="space-y-2">
                {actionRows.map(action => (
                  <li
                    key={action.id}
                    className="rounded border border-edge bg-surface-secondary px-2 py-2 text-sm text-content"
                  >
                    <span>{action.text}</span>
                    {action.status ? (
                      <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-[11px] uppercase text-content-tertiary">
                        {statusLabel(action.status)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-content-secondary">No active follow-up items yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
};
