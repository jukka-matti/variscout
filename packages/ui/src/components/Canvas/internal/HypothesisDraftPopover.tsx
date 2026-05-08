import React from 'react';
import FocusTrap from 'focus-trap-react';
import type { Point } from '@variscout/hooks';

const POPOVER_WIDTH = 320;
const POPOVER_OFFSET_Y = 12;
const VIEWPORT_MARGIN = 8;
const ESTIMATED_HEIGHT = 280;

export interface HypothesisDraftPayload {
  whyStatement: string;
  questionId: string | undefined;
}

export interface HypothesisDraftPopoverProps {
  sourceLabel: string;
  targetLabel: string;
  releaseAt: Point;
  questions: ReadonlyArray<{ id: string; text: string }>;
  onSave: (payload: HypothesisDraftPayload) => void;
  onCancel: () => void;
}

function computePosition(releaseAt: Point): { top: number; left: number } {
  if (typeof window === 'undefined') return { top: releaseAt.y, left: releaseAt.x };

  const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(releaseAt.x - POPOVER_WIDTH / 2, Math.max(VIEWPORT_MARGIN, maxLeft))
  );
  const below = releaseAt.y + POPOVER_OFFSET_Y;
  const top =
    below + ESTIMATED_HEIGHT <= window.innerHeight - VIEWPORT_MARGIN
      ? below
      : Math.max(VIEWPORT_MARGIN, releaseAt.y - ESTIMATED_HEIGHT - POPOVER_OFFSET_Y);

  return { top, left };
}

export function HypothesisDraftPopover({
  sourceLabel,
  targetLabel,
  releaseAt,
  questions,
  onSave,
  onCancel,
}: HypothesisDraftPopoverProps) {
  const [whyStatement, setWhyStatement] = React.useState('');
  const [questionId, setQuestionId] = React.useState('');
  const { top, left } = computePosition(releaseAt);
  const trimmed = whyStatement.trim();
  const canSave = trimmed.length > 0;

  const handleSave = (): void => {
    if (!canSave) return;
    onSave({ whyStatement: trimmed, questionId: questionId || undefined });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onCancel();
  };

  return (
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        fallbackFocus: '[data-testid="hypothesis-draft-popover"]',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hypothesis-draft-popover-title"
        data-testid="hypothesis-draft-popover"
        onKeyDown={handleKeyDown}
        style={{ position: 'absolute', top, left, width: POPOVER_WIDTH, zIndex: 50 }}
        className="rounded-md border border-edge bg-surface-primary p-3 shadow-lg"
      >
        <h3 id="hypothesis-draft-popover-title" className="mb-2 text-sm font-semibold text-content">
          New hypothesis
        </h3>
        <p className="mb-3 text-sm text-content-secondary">
          I suspect <span className="font-mono text-content">{sourceLabel}</span> affects{' '}
          <span className="font-mono text-content">{targetLabel}</span>
        </p>
        <label className="mb-3 block text-xs text-content-secondary">
          <span className="mb-1 block font-medium">because</span>
          <textarea
            className="w-full rounded border border-edge bg-surface-primary p-2 text-sm text-content"
            rows={3}
            maxLength={280}
            value={whyStatement}
            onChange={event => setWhyStatement(event.target.value)}
            autoFocus
            aria-label="because"
          />
        </label>
        {questions.length > 0 ? (
          <label className="mb-3 block text-xs text-content-secondary">
            <span className="mb-1 block font-medium">Link to question</span>
            <select
              className="w-full rounded border border-edge bg-surface-primary p-2 text-sm text-content"
              value={questionId}
              onChange={event => setQuestionId(event.target.value)}
              aria-label="Link to question"
            >
              <option value="">No question link</option>
              {questions.map(question => (
                <option key={question.id} value={question.id}>
                  {question.text}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-xs text-content-secondary hover:bg-surface-tertiary hover:text-content"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded border border-status-info bg-status-info-soft px-2 py-1 text-xs font-medium text-status-info disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </FocusTrap>
  );
}
