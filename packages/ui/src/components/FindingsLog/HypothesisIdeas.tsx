import React, { useState, useCallback } from 'react';
import type { ImprovementIdea, IdeaImpact, IdeaTimeframe } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

const IMPACT_COLORS: Record<IdeaImpact, string> = {
  high: 'bg-green-500/15 text-green-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-gray-500/15 text-gray-400',
};

const TIMEFRAME_COLORS: Record<IdeaTimeframe, string> = {
  'just-do': 'text-green-400',
  days: 'text-cyan-400',
  weeks: 'text-amber-400',
  months: 'text-red-400',
};

const DIRECTION_BADGE_COLORS: Record<string, string> = {
  prevent: 'bg-purple-500/15 text-purple-400',
  detect: 'bg-blue-500/15 text-blue-400',
  simplify: 'bg-green-500/15 text-green-400',
  eliminate: 'bg-amber-500/15 text-amber-400',
};

export interface ImprovementIdeasSectionProps {
  hypothesisId: string;
  ideas: ImprovementIdea[];
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  onAddIdea?: (hypothesisId: string, text: string) => void;
  onUpdateIdea?: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  onAskCoScout?: (question: string) => void;
  hypothesisText: string;
}

const ImprovementIdeasSection: React.FC<ImprovementIdeasSectionProps> = ({
  hypothesisId,
  ideas,
  ideaImpacts,
  onAddIdea,
  onUpdateIdea,
  onRemoveIdea,
  onSelectIdea,
  onProjectIdea,
  onAskCoScout,
  hypothesisText,
}) => {
  const { formatStat } = useTranslation();
  const [isOpen, setIsOpen] = useState(ideas.length > 0);
  const [newIdeaText, setNewIdeaText] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = newIdeaText.trim();
    if (!trimmed || !onAddIdea) return;
    onAddIdea(hypothesisId, trimmed);
    setNewIdeaText('');
  }, [hypothesisId, newIdeaText, onAddIdea]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className="ml-6 mt-1.5" data-testid={`ideas-section-${hypothesisId}`}>
      <button
        className="text-[11px] text-content-muted hover:text-content flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[9px]">{isOpen ? '\u25BC' : '\u25B6'}</span>
        Improvement Ideas{ideas.length > 0 ? ` (${ideas.length})` : ''}
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1.5">
          {ideas.map(idea => {
            const impact = ideaImpacts?.[idea.id];
            return (
              <div
                key={idea.id}
                className="flex items-start gap-1.5 py-1 px-1.5 rounded text-xs group/idea"
                data-testid={`idea-${idea.id}`}
              >
                {/* Selected toggle */}
                <button
                  className="mt-0.5 flex-shrink-0 text-content-muted hover:text-content"
                  onClick={() => onSelectIdea?.(hypothesisId, idea.id, !idea.selected)}
                  title={idea.selected ? 'Deselect' : 'Select to try'}
                  aria-label={idea.selected ? 'Deselect idea' : 'Select idea'}
                >
                  {idea.selected ? '\u2605' : '\u25CB'}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className={`text-content ${idea.selected ? 'font-medium' : ''}`}>
                    {idea.text}
                  </span>

                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {/* Impact badge */}
                    {impact && (
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded ${IMPACT_COLORS[impact]}`}
                        data-testid={`idea-impact-${idea.id}`}
                      >
                        {impact.toUpperCase()} \u2191
                      </span>
                    )}

                    {/* Direction badge */}
                    {(idea.direction ?? idea.category) && (
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded ${DIRECTION_BADGE_COLORS[idea.direction ?? idea.category!] ?? ''}`}
                        data-testid={`idea-direction-${idea.id}`}
                      >
                        {(idea.direction ?? idea.category) === 'prevent'
                          ? 'Prevent'
                          : (idea.direction ?? idea.category) === 'detect'
                            ? 'Detect'
                            : (idea.direction ?? idea.category) === 'simplify'
                              ? 'Simplify'
                              : 'Eliminate'}
                      </span>
                    )}

                    {/* Timeframe dropdown (always visible, color-coded) */}
                    <select
                      className={`text-[10px] bg-transparent border border-edge rounded px-1 py-0.5 focus:outline-none focus:border-blue-400 cursor-pointer ${
                        idea.timeframe ? TIMEFRAME_COLORS[idea.timeframe] : 'text-content-muted'
                      }`}
                      value={idea.timeframe ?? ''}
                      onChange={e => {
                        const val = e.target.value as IdeaTimeframe | '';
                        onUpdateIdea?.(hypothesisId, idea.id, { timeframe: val || undefined });
                      }}
                      onClick={e => e.stopPropagation()}
                      data-testid={`idea-timeframe-${idea.id}`}
                      aria-label="Timeframe"
                    >
                      <option value="">Timeframe</option>
                      <option value="just-do">Just Do</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>

                    {/* Projection summary */}
                    {idea.projection && (
                      <span className="text-[10px] text-content-muted">
                        Mean: {formatStat(idea.projection.baselineMean, 1)}&rarr;
                        {formatStat(idea.projection.projectedMean, 1)} &sigma;:{' '}
                        {formatStat(idea.projection.baselineSigma, 1)}&rarr;
                        {formatStat(idea.projection.projectedSigma, 1)}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {idea.notes && (
                    <p className="text-[10px] text-content-muted mt-0.5 italic">{idea.notes}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover/idea:opacity-100 touch-show transition-opacity flex-shrink-0">
                  {/* Project button */}
                  {onProjectIdea && (
                    <button
                      className="text-[10px] text-content-muted hover:text-content"
                      onClick={() => onProjectIdea(hypothesisId, idea.id)}
                      title="Project with What-If"
                      aria-label="Project idea with What-If simulator"
                    >
                      P
                    </button>
                  )}
                  {/* Remove button */}
                  <button
                    className="text-[10px] text-content-muted hover:text-red-400"
                    onClick={() => onRemoveIdea?.(hypothesisId, idea.id)}
                    title="Remove idea"
                    aria-label="Remove idea"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add idea input */}
          {onAddIdea && (
            <div className="flex items-center gap-1 min-w-0">
              <input
                type="text"
                className="flex-1 min-w-0 text-xs bg-transparent border-b border-edge text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 py-0.5"
                placeholder="Add improvement idea..."
                value={newIdeaText}
                onChange={e => setNewIdeaText(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid={`add-idea-input-${hypothesisId}`}
              />
              {newIdeaText.trim() && (
                <button className="text-xs text-blue-400 hover:text-blue-300" onClick={handleAdd}>
                  Add
                </button>
              )}
            </div>
          )}

          {/* Ask CoScout */}
          {onAskCoScout && (
            <button
              className="text-[11px] text-blue-400 hover:text-blue-300 mt-0.5"
              onClick={() =>
                onAskCoScout(`What improvement options could address "${hypothesisText}"?`)
              }
              data-testid={`ask-coscout-ideas-${hypothesisId}`}
            >
              Ask CoScout
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovementIdeasSection;
