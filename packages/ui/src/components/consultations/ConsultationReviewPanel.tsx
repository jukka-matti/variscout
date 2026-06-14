/**
 * CL-4: ConsultationReviewPanel
 *
 * Review queue for proposed insights from a consultation response.
 * Shows pending insights with Accept / Edit / Reject controls;
 * accepted/rejected insights show their settled state.
 *
 * Mirrors FindingsPanelBase in how it reads from the store via useAnalyzeStore,
 * but is props-based on consultationId (not findings-based).
 *
 * Not yet mounted into the Analyze tab — that integration is CL-5.
 * This component is self-contained and story-mountable.
 */

import React, { useState } from 'react';
import { useAnalyzeStore } from '@variscout/stores';
import { useTranslation } from '@variscout/hooks';
import type { Consultation, ProposedInsight, ProposedInsightKind } from '@variscout/core/consultations';
import type { Hypothesis } from '@variscout/core';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConsultationReviewPanelProps {
  consultationId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import type { MessageCatalog } from '@variscout/core/i18n';

function kindKey(kind: ProposedInsightKind): keyof MessageCatalog {
  switch (kind) {
    case 'answer':
      return 'consultation.review.kind.answer';
    case 'context':
      return 'consultation.review.kind.context';
    case 'new-hypothesis-proposal':
      return 'consultation.review.kind.newHypothesisProposal';
    case 'contradiction':
      return 'consultation.review.kind.contradiction';
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return 'consultation.review.kind.answer';
    }
  }
}

function resolveAnchorLabel(
  consultation: Consultation,
  insight: ProposedInsight,
  hypotheses: Hypothesis[]
): string | undefined {
  if (!insight.questionId) return undefined;
  const question = consultation.questions.find(q => q.id === insight.questionId);
  if (!question?.anchor) return undefined;

  const { kind, id } = question.anchor;
  if (kind === 'hypothesis') {
    const hyp = hypotheses.find(h => h.id === id);
    return hyp?.name ?? id;
  }
  // For 'finding' or 'scope' anchors in future: fall back to the id
  return id;
}

// ---------------------------------------------------------------------------
// Insight row sub-component
// ---------------------------------------------------------------------------

interface InsightRowProps {
  consultationId: string;
  insight: ProposedInsight;
  anchorLabel: string | undefined;
}

const InsightRow: React.FC<InsightRowProps> = ({ consultationId, insight, anchorLabel }) => {
  const { t } = useTranslation();
  const acceptInsight = useAnalyzeStore(s => s.acceptInsight);
  const rejectInsight = useAnalyzeStore(s => s.rejectInsight);
  const editInsight = useAnalyzeStore(s => s.editInsight);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(insight.text);

  const handleAccept = () => {
    acceptInsight(consultationId, insight.id);
  };

  const handleReject = () => {
    rejectInsight(consultationId, insight.id);
  };

  const handleEditStart = () => {
    setEditText(insight.text);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    editInsight(consultationId, insight.id, editText);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(insight.text);
    setIsEditing(false);
  };

  const isPending = insight.status === 'pending';

  return (
    <div className="border border-edge rounded p-3 mb-2 bg-surface">
      {/* Header: "Proposed insight" label + kind badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-content-secondary">
          {t('consultation.review.proposedInsight')}
        </span>
        <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">
          {t(kindKey(insight.kind))}
        </span>
      </div>

      {/* Insight text or edit textarea */}
      {isEditing ? (
        <textarea
          className="w-full text-sm text-content bg-surface-tertiary border border-edge rounded p-2 mb-2 resize-none"
          rows={3}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          autoFocus
        />
      ) : (
        <p className="text-sm text-content mb-1">{insight.text}</p>
      )}

      {/* Anchor label */}
      {anchorLabel && !isEditing && (
        <p className="text-xs text-content-muted mb-2">
          <span>{t('consultation.review.anchoredTo').replace('{label}', '')}</span>
          <span data-testid="anchor-label">{anchorLabel}</span>
        </p>
      )}

      {/* Controls */}
      {isPending && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            {t('consultation.review.accept')}
          </button>
          <button
            type="button"
            onClick={handleEditStart}
            className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:text-content"
          >
            {t('consultation.review.edit')}
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:text-red-400"
          >
            {t('consultation.review.reject')}
          </button>
        </div>
      )}

      {/* Edit save/cancel */}
      {isEditing && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEditSave}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            {t('consultation.review.save')}
          </button>
          <button
            type="button"
            onClick={handleEditCancel}
            className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:text-content"
          >
            {t('consultation.review.cancelEdit')}
          </button>
        </div>
      )}

      {/* Settled states */}
      {insight.status === 'accepted' && !isEditing && (
        <div className="mt-2 text-xs text-green-400 font-medium">
          {t('consultation.review.accepted')}
        </div>
      )}
      {insight.status === 'rejected' && !isEditing && (
        <div className="mt-2 text-xs text-content-muted line-through">
          {t('consultation.review.rejected')}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ConsultationReviewPanel
// ---------------------------------------------------------------------------

export const ConsultationReviewPanel: React.FC<ConsultationReviewPanelProps> = ({
  consultationId,
}) => {
  const { t } = useTranslation();

  const consultation = useAnalyzeStore(s =>
    s.consultations.find(c => c.id === consultationId)
  ) as Consultation | undefined;

  const hypotheses = useAnalyzeStore(s => s.hypotheses) as Hypothesis[];

  if (!consultation) return null;

  const insights = consultation.proposedInsights;

  return (
    <div
      className="flex flex-col bg-surface-secondary border-l border-edge overflow-y-auto"
      data-testid="consultation-review-panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <h2 className="text-sm font-semibold text-content">
          {t('consultation.review.title').replace('{title}', consultation.title)}
          {consultation.responses.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[0.625rem] bg-blue-500/20 text-blue-400 rounded">
              {t('consultation.review.responses').replace(
                '{count}',
                String(consultation.responses.length)
              )}
            </span>
          )}
        </h2>

        {/* Respondent info from the first response */}
        {consultation.responses[0] && (
          <p className="text-xs text-content-muted mt-1">
            {t('consultation.review.respondent')
              .replace('{name}', consultation.responses[0].respondentLabel)
              .replace(
                '{date}',
                new Date(consultation.responses[0].importedAt).toLocaleDateString()
              )}
          </p>
        )}
      </div>

      {/* Insight list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {insights.length === 0 ? (
          <p className="text-xs text-content-muted">{t('consultation.review.empty')}</p>
        ) : (
          insights.map(insight => (
            <InsightRow
              key={insight.id}
              consultationId={consultationId}
              insight={insight}
              anchorLabel={resolveAnchorLabel(consultation, insight, hypotheses)}
            />
          ))
        )}
      </div>
    </div>
  );
};
