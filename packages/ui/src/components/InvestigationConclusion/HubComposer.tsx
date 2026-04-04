import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import type { Question, Finding, SuspectedCause, SuspectedCauseEvidence } from '@variscout/core';
import type { HubProjection } from '@variscout/core/findings';

export interface HubComposerProps {
  /** Pre-populated question IDs (from synthesis prompt or CoScout) */
  prefilledQuestionIds?: string[];
  /** Pre-populated finding IDs */
  prefilledFindingIds?: string[];
  /** All available questions for connection */
  questions: Question[];
  /** All available findings for connection */
  findings: Finding[];
  /** Existing hub to edit (undefined = creating new) */
  editingHub?: SuspectedCause;
  /** Evidence from computeHubEvidence */
  evidence?: SuspectedCauseEvidence;
  /** Projection from computeHubProjection */
  projection?: HubProjection;
  /** Called when hub is created/saved */
  onSave: (name: string, synthesis: string, questionIds: string[], findingIds: string[]) => void;
  /** Called when cancelled */
  onCancel: () => void;
}

/** Sort by R²adj or η² descending */
function evidenceValue(q: Question): number {
  return q.evidence?.rSquaredAdj ?? q.evidence?.etaSquared ?? 0;
}

const HubComposer: React.FC<HubComposerProps> = ({
  prefilledQuestionIds = [],
  prefilledFindingIds = [],
  questions,
  findings,
  editingHub,
  evidence,
  projection,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(editingHub?.name ?? '');
  const [synthesis, setSynthesis] = useState(editingHub?.synthesis ?? '');
  const [questionIds, setQuestionIds] = useState<string[]>(
    editingHub?.questionIds ?? prefilledQuestionIds
  );
  const [findingIds, setFindingIds] = useState<string[]>(
    editingHub?.findingIds ?? prefilledFindingIds
  );
  const [connectExpanded, setConnectExpanded] = useState(false);

  const connectedQuestions = questions.filter(q => questionIds.includes(q.id));
  const connectedFindings = findings.filter(f => findingIds.includes(f.id));

  const unconnectedQuestions = questions
    .filter(
      q => !questionIds.includes(q.id) && (q.status === 'answered' || q.status === 'investigating')
    )
    .sort((a, b) => evidenceValue(b) - evidenceValue(a));

  const unconnectedFindings = findings
    .filter(f => !findingIds.includes(f.id))
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), synthesis.trim(), questionIds, findingIds);
  };

  const removeQuestion = (id: string) => setQuestionIds(prev => prev.filter(x => x !== id));
  const removeFinding = (id: string) => setFindingIds(prev => prev.filter(x => x !== id));
  const toggleQuestion = (id: string) =>
    setQuestionIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleFinding = (id: string) =>
    setFindingIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const evidenceBadge = evidence
    ? `${evidence.contribution.label} ${Math.round(evidence.contribution.value * 100)}%`
    : null;

  const projectionLabel = projection
    ? `${projection.label} ${projection.predictedMeanDelta > 0 ? '+' : ''}${projection.predictedMeanDelta.toFixed(1)}`
    : null;

  return (
    <div
      className="rounded-lg border border-edge bg-surface-secondary p-4 space-y-3"
      data-testid="hub-composer"
    >
      {/* Name field */}
      <input
        autoFocus
        type="text"
        className="w-full text-sm font-medium bg-transparent border-b border-edge pb-1 text-content placeholder:text-content-muted focus:outline-none focus:border-purple-500"
        placeholder="Name the mechanism..."
        value={name}
        onChange={e => setName(e.target.value)}
        data-testid="hub-composer-name"
      />

      {/* Synthesis field */}
      <textarea
        className="w-full text-xs text-content-secondary bg-transparent border border-edge rounded px-2 py-1.5 resize-y placeholder:text-content-muted focus:outline-none focus:border-purple-500"
        placeholder="How does the evidence connect? (optional)"
        rows={2}
        value={synthesis}
        onChange={e => setSynthesis(e.target.value)}
        data-testid="hub-composer-synthesis"
      />

      {/* Connected evidence */}
      {(connectedQuestions.length > 0 || connectedFindings.length > 0) && (
        <div className="space-y-1">
          {connectedQuestions.map(q => (
            <div key={q.id} className="flex items-center gap-1.5 text-xs text-content-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="flex-1 min-w-0 truncate">{q.text}</span>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-content-muted hover:text-content shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {connectedFindings.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 text-xs text-content-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="flex-1 min-w-0 truncate">{f.text}</span>
              <button
                onClick={() => removeFinding(f.id)}
                className="text-content-muted hover:text-content shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connect more expandable */}
      {(unconnectedQuestions.length > 0 || unconnectedFindings.length > 0) && (
        <div>
          <button
            onClick={() => setConnectExpanded(!connectExpanded)}
            className="flex items-center gap-1 text-[11px] text-content-muted hover:text-content transition-colors"
          >
            {connectExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}+ Connect
            more...
          </button>
          {connectExpanded && (
            <div className="mt-1.5 max-h-32 overflow-y-auto space-y-0.5">
              {unconnectedQuestions.map(q => (
                <label
                  key={q.id}
                  className="flex items-center gap-1.5 text-xs text-content-secondary cursor-pointer hover:bg-surface rounded px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={questionIds.includes(q.id)}
                    onChange={() => toggleQuestion(q.id)}
                    className="rounded border-edge"
                  />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{q.text}</span>
                  {q.evidence?.rSquaredAdj != null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-content-muted shrink-0">
                      R²adj {Math.round(q.evidence.rSquaredAdj * 100)}%
                    </span>
                  )}
                </label>
              ))}
              {unconnectedFindings.map(f => (
                <label
                  key={f.id}
                  className="flex items-center gap-1.5 text-xs text-content-secondary cursor-pointer hover:bg-surface rounded px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={findingIds.includes(f.id)}
                    onChange={() => toggleFinding(f.id)}
                    className="rounded border-edge"
                  />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{f.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-edge">
        <div className="flex items-center gap-2">
          {evidenceBadge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
              {evidenceBadge}
            </span>
          )}
          {projectionLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
              {projectionLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="text-xs text-content-muted hover:text-content transition-colors px-2 py-1"
            data-testid="hub-composer-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="text-xs font-medium px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="hub-composer-save"
          >
            {editingHub ? 'Save' : 'Create Hub'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { HubComposer };
