import { useState } from 'react';
import type { AnalysisBrief } from '@variscout/core/findings';

export interface StageFiveModalProps {
  open: boolean;
  mode: 'mode-b' | 'mode-a-on-demand';
  onOpenInvestigation: (brief: AnalysisBrief) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function StageFiveModal({
  open,
  mode,
  onOpenInvestigation,
  onSkip,
  onClose,
}: StageFiveModalProps) {
  const [issue, setIssue] = useState('');
  const [question, setQuestion] = useState('');
  const [hypothesis, setHypothesis] = useState('');

  if (!open) return null;

  const submit = () => {
    const brief: AnalysisBrief = {};
    if (issue.trim()) brief.issueStatement = issue.trim();
    if (question.trim()) brief.questions = [{ text: question.trim() }];
    if (hypothesis.trim()) brief.hypothesisDraft = hypothesis.trim();
    onOpenInvestigation(brief);
  };

  return (
    <div
      data-testid="stage-five-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {mode === 'mode-b' ? 'Capture context for this analysis' : 'Start a new investigation'}
        </h2>

        <label className="block mb-3">
          <span className="text-sm font-medium">Issue — what&apos;s happening?</span>
          <textarea
            value={issue}
            onChange={e => setIssue(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            rows={2}
            data-testid="stage-five-issue-input"
            aria-label="Issue — what's happening?"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Question — what would tell us?</span>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            rows={2}
            data-testid="stage-five-question-input"
            aria-label="Question — what would tell us?"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium">
            Hypothesis (optional — pin on canvas later if skipped)
          </span>
          <textarea
            value={hypothesis}
            onChange={e => setHypothesis(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            rows={2}
            data-testid="stage-five-hypothesis-input"
            aria-label="Hypothesis (optional)"
          />
        </label>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            data-testid="stage-five-skip"
          >
            Skip — explore canvas instead
          </button>
          <button
            type="button"
            onClick={submit}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            data-testid="stage-five-open-investigation"
          >
            Open investigation &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
