import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ImprovementIdea, IdeaTimeframe, IdeaDirection } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

export interface IdeaGroupCardProps {
  hypothesis: {
    id: string;
    text: string;
    causeRole?: 'primary' | 'contributing';
    factor?: string;
  };
  ideas: ImprovementIdea[];
  linkedFindingName?: string;
  onToggleSelect?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  onUpdateTimeframe?: (
    hypothesisId: string,
    ideaId: string,
    timeframe: IdeaTimeframe | undefined
  ) => void;
  onUpdateDirection?: (
    hypothesisId: string,
    ideaId: string,
    direction: IdeaDirection | undefined
  ) => void;
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  onOpenWhatIf?: (hypothesisId: string, ideaId: string) => void;
  onAddIdea?: (hypothesisId: string, text: string) => void;
  onAskCoScout?: (question: string) => void;
  /** Map of ideaId to whether it has been converted to an action */
  convertedIdeaIds?: Set<string>;
}

const TIMEFRAME_OPTIONS: Array<{
  value: IdeaTimeframe;
  labelKey: 'timeframe.justDo' | 'timeframe.days' | 'timeframe.weeks' | 'timeframe.months';
}> = [
  { value: 'just-do', labelKey: 'timeframe.justDo' },
  { value: 'days', labelKey: 'timeframe.days' },
  { value: 'weeks', labelKey: 'timeframe.weeks' },
  { value: 'months', labelKey: 'timeframe.months' },
];

const TIMEFRAME_COLORS: Record<IdeaTimeframe, string> = {
  'just-do': 'text-green-500',
  days: 'text-cyan-500',
  weeks: 'text-amber-500',
  months: 'text-red-400',
};

const TIMEFRAME_BG: Record<IdeaTimeframe, string> = {
  'just-do': 'bg-green-500/10',
  days: 'bg-cyan-500/10',
  weeks: 'bg-amber-500/10',
  months: 'bg-red-400/10',
};

const DIRECTION_STYLES: Record<IdeaDirection, string> = {
  prevent: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  detect: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  simplify: 'bg-green-500/15 text-green-600 dark:text-green-400',
  eliminate: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const DIRECTION_OPTIONS: Array<{
  value: IdeaDirection;
  labelKey: 'idea.prevent' | 'idea.detect' | 'idea.simplify' | 'idea.eliminate';
}> = [
  { value: 'prevent', labelKey: 'idea.prevent' },
  { value: 'detect', labelKey: 'idea.detect' },
  { value: 'simplify', labelKey: 'idea.simplify' },
  { value: 'eliminate', labelKey: 'idea.eliminate' },
];

export const IdeaGroupCard: React.FC<IdeaGroupCardProps> = ({
  hypothesis,
  ideas,
  linkedFindingName,
  onToggleSelect,
  onUpdateTimeframe,
  onUpdateDirection,
  onRemoveIdea,
  onOpenWhatIf,
  onAddIdea,
  onAskCoScout,
  convertedIdeaIds,
}) => {
  const { t } = useTranslation();
  const [newIdeaText, setNewIdeaText] = useState('');

  const handleAddIdea = () => {
    const trimmed = newIdeaText.trim();
    if (trimmed && onAddIdea) {
      onAddIdea(hypothesis.id, trimmed);
      setNewIdeaText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddIdea();
    }
  };

  return (
    <div
      data-testid={`idea-group-${hypothesis.id}`}
      className="rounded-lg border border-edge bg-surface-secondary"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-content">{hypothesis.text}</span>
          {hypothesis.causeRole === 'primary' && (
            <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
              Primary
            </span>
          )}
          {hypothesis.causeRole === 'contributing' && (
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
              Contributing
            </span>
          )}
          {hypothesis.factor && (
            <span className="text-xs text-content/50">({hypothesis.factor})</span>
          )}
        </div>
        {linkedFindingName && <p className="text-xs text-content/50 mt-1">{linkedFindingName}</p>}
      </div>

      {/* Idea rows */}
      <div className="divide-y divide-edge">
        {ideas.map(idea => {
          const isConverted = convertedIdeaIds?.has(idea.id) ?? false;

          return (
            <div
              key={idea.id}
              data-testid={`idea-row-${idea.id}`}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                data-testid={`idea-select-${idea.id}`}
                checked={idea.selected ?? false}
                onChange={e => onToggleSelect?.(hypothesis.id, idea.id, e.target.checked)}
                className="h-4 w-4 rounded border-edge text-blue-500 focus:ring-blue-500 shrink-0"
              />

              {/* Text */}
              <span className="text-sm text-content flex-1 min-w-0 line-clamp-2">{idea.text}</span>

              {/* Direction dropdown */}
              <select
                data-testid={`idea-direction-${idea.id}`}
                value={idea.direction ?? idea.category ?? ''}
                onChange={e => {
                  const val = e.target.value as IdeaDirection | '';
                  onUpdateDirection?.(hypothesis.id, idea.id, val === '' ? undefined : val);
                }}
                className={`rounded border border-edge bg-surface px-2 py-1 text-xs shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  (idea.direction ?? idea.category)
                    ? DIRECTION_STYLES[idea.direction ?? idea.category!]
                    : 'text-content/50'
                }`}
              >
                <option value="">{t('idea.direction')}</option>
                {DIRECTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>

              {/* Timeframe dropdown */}
              <select
                data-testid={`idea-timeframe-${idea.id}`}
                value={idea.timeframe ?? ''}
                onChange={e => {
                  const val = e.target.value as IdeaTimeframe | '';
                  onUpdateTimeframe?.(hypothesis.id, idea.id, val === '' ? undefined : val);
                }}
                className={`rounded border border-edge bg-surface px-2 py-1 text-xs shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  idea.timeframe
                    ? `${TIMEFRAME_COLORS[idea.timeframe]} ${TIMEFRAME_BG[idea.timeframe]}`
                    : 'text-content/50'
                }`}
              >
                <option value="">{t('timeframe.label')}</option>
                {TIMEFRAME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>

              {/* Projection badge */}
              {idea.projection?.projectedCpk != null && (
                <span
                  data-testid={`idea-projection-${idea.id}`}
                  className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500 shrink-0"
                >
                  Cpk {idea.projection.projectedCpk.toFixed(2)}
                </span>
              )}

              {/* Converted indicator */}
              {isConverted && (
                <span
                  data-testid={`idea-converted-${idea.id}`}
                  className="text-[10px] text-green-500 font-medium shrink-0"
                >
                  {t('improve.convertedToAction')}
                </span>
              )}

              {/* What-If button */}
              {onOpenWhatIf && !isConverted && (
                <button
                  data-testid={`idea-whatif-${idea.id}`}
                  onClick={() => onOpenWhatIf(hypothesis.id, idea.id)}
                  className="rounded px-2 py-1 text-xs text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0"
                >
                  What-If
                </button>
              )}

              {/* Delete button */}
              {onRemoveIdea && (
                <button
                  data-testid={`idea-remove-${idea.id}`}
                  onClick={() => onRemoveIdea(hypothesis.id, idea.id)}
                  className="rounded p-1 text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Remove idea"
                  aria-label="Remove idea"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add idea input */}
      {onAddIdea && (
        <div className="px-4 py-2.5 border-t border-edge flex items-center gap-2">
          <input
            data-testid={`idea-add-input-${hypothesis.id}`}
            type="text"
            className="flex-1 rounded border border-edge bg-surface px-2 py-1.5 text-sm text-content placeholder:text-content/40 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add improvement idea..."
            value={newIdeaText}
            onChange={e => setNewIdeaText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            data-testid={`idea-add-btn-${hypothesis.id}`}
            onClick={handleAddIdea}
            disabled={!newIdeaText.trim()}
            className="rounded px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Ask CoScout */}
      {onAskCoScout && (
        <div className="px-4 py-2 border-t border-edge">
          <button
            data-testid={`idea-ask-coscout-${hypothesis.id}`}
            onClick={() => onAskCoScout(`Suggest improvement ideas for: ${hypothesis.text}`)}
            className="text-xs text-blue-500 hover:underline"
          >
            Ask CoScout for ideas
          </button>
        </div>
      )}
    </div>
  );
};
