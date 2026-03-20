import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type {
  ImprovementIdea,
  IdeaTimeframe,
  IdeaDirection,
  IdeaCostCategory,
  IdeaRiskAssessment,
  ComputedRiskLevel,
  RiskAxisConfig,
} from '@variscout/core';
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
  riskAxisConfig?: RiskAxisConfig;
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
  onUpdateCost?: (
    hypothesisId: string,
    ideaId: string,
    cost: { category: IdeaCostCategory } | undefined
  ) => void;
  onUpdateRisk?: (
    hypothesisId: string,
    ideaId: string,
    risk: IdeaRiskAssessment | undefined
  ) => void;
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  onOpenWhatIf?: (hypothesisId: string, ideaId: string) => void;
  onOpenRisk?: (hypothesisId: string, ideaId: string) => void;
  onAddIdea?: (hypothesisId: string, text: string) => void;
  onAskCoScout?: (question: string) => void;
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

const COST_OPTIONS: Array<{
  value: IdeaCostCategory;
  labelKey: 'cost.none' | 'cost.low' | 'cost.medium' | 'cost.high';
}> = [
  { value: 'none', labelKey: 'cost.none' },
  { value: 'low', labelKey: 'cost.low' },
  { value: 'medium', labelKey: 'cost.medium' },
  { value: 'high', labelKey: 'cost.high' },
];

const COST_COLORS: Record<IdeaCostCategory, string> = {
  none: 'text-green-500',
  low: 'text-cyan-500',
  medium: 'text-amber-500',
  high: 'text-red-400',
};

const COST_BG: Record<IdeaCostCategory, string> = {
  none: 'bg-green-500/10',
  low: 'bg-cyan-500/10',
  medium: 'bg-amber-500/10',
  high: 'bg-red-400/10',
};

const RISK_DOT_COLORS: Record<ComputedRiskLevel, string> = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-red-400',
  'very-high': 'bg-red-700',
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

/** Overflow menu for secondary idea controls */
const IdeaOverflowMenu: React.FC<{
  idea: ImprovementIdea;
  hypothesisId: string;
  hypothesisText: string;
  isConverted: boolean;
  onUpdateDirection?: IdeaGroupCardProps['onUpdateDirection'];
  onOpenRisk?: IdeaGroupCardProps['onOpenRisk'];
  onOpenWhatIf?: IdeaGroupCardProps['onOpenWhatIf'];
  onAskCoScout?: IdeaGroupCardProps['onAskCoScout'];
  onRemoveIdea?: IdeaGroupCardProps['onRemoveIdea'];
}> = ({
  idea,
  hypothesisId,
  hypothesisText,
  isConverted,
  onUpdateDirection,
  onOpenRisk,
  onOpenWhatIf,
  onAskCoScout,
  onRemoveIdea,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const direction = idea.direction ?? idea.category;

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        data-testid={`idea-menu-${idea.id}`}
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-content-muted hover:text-content hover:bg-surface-secondary transition-colors"
        aria-label="More options"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-edge bg-surface shadow-lg py-1 text-sm">
          {/* Direction */}
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="text-content/50 text-xs">{t('idea.direction')}:</span>
            <select
              value={direction ?? ''}
              onChange={e => {
                const val = e.target.value as IdeaDirection | '';
                onUpdateDirection?.(hypothesisId, idea.id, val === '' ? undefined : val);
              }}
              className={`text-xs bg-transparent border-none focus:outline-none cursor-pointer ${
                direction ? DIRECTION_STYLES[direction].split(' ')[1] : 'text-content/50'
              }`}
            >
              <option value="">—</option>
              {DIRECTION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Risk */}
          {onOpenRisk && (
            <button
              onClick={() => {
                onOpenRisk(hypothesisId, idea.id);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-content hover:bg-surface-secondary flex items-center gap-2"
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  idea.risk ? RISK_DOT_COLORS[idea.risk.computed] : 'bg-content-muted'
                }`}
              />
              {t('risk.label')}:{' '}
              {idea.risk
                ? t(`risk.${idea.risk.computed === 'very-high' ? 'veryHigh' : idea.risk.computed}`)
                : t('risk.notSet')}
            </button>
          )}

          <div className="border-t border-edge my-1" />

          {/* What-If */}
          {onOpenWhatIf && !isConverted && (
            <button
              onClick={() => {
                onOpenWhatIf(hypothesisId, idea.id);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-content hover:bg-surface-secondary"
            >
              What-If Simulator
            </button>
          )}

          {/* Ask CoScout */}
          {onAskCoScout && (
            <button
              onClick={() => {
                onAskCoScout(`Suggest improvement ideas for: ${hypothesisText}`);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-content hover:bg-surface-secondary"
            >
              Ask CoScout
            </button>
          )}

          {/* Delete */}
          {onRemoveIdea && (
            <>
              <div className="border-t border-edge my-1" />
              <button
                onClick={() => {
                  onRemoveIdea(hypothesisId, idea.id);
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/10"
              >
                Delete idea
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const IdeaGroupCard: React.FC<IdeaGroupCardProps> = ({
  hypothesis,
  ideas,
  linkedFindingName,
  onToggleSelect,
  onUpdateTimeframe,
  onUpdateDirection,
  onUpdateCost,
  onOpenRisk,
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
              className="flex items-center gap-2 px-4 py-2.5"
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

              {/* Timeframe dropdown (inline) */}
              <select
                data-testid={`idea-timeframe-${idea.id}`}
                value={idea.timeframe ?? ''}
                onChange={e => {
                  const val = e.target.value as IdeaTimeframe | '';
                  onUpdateTimeframe?.(hypothesis.id, idea.id, val === '' ? undefined : val);
                }}
                className={`rounded border border-edge bg-surface px-1.5 py-0.5 text-[11px] shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
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

              {/* Cost dropdown (inline) */}
              <select
                data-testid={`idea-cost-${idea.id}`}
                value={idea.cost?.category ?? ''}
                onChange={e => {
                  const val = e.target.value as IdeaCostCategory | '';
                  onUpdateCost?.(
                    hypothesis.id,
                    idea.id,
                    val === '' ? undefined : { category: val }
                  );
                }}
                className={`rounded border border-edge bg-surface px-1.5 py-0.5 text-[11px] shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  idea.cost?.category
                    ? `${COST_COLORS[idea.cost.category]} ${COST_BG[idea.cost.category]}`
                    : 'text-content/50'
                }`}
              >
                <option value="">{t('cost.label')}</option>
                {COST_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>

              {/* Risk dot (clickable) */}
              <button
                data-testid={`idea-risk-${idea.id}`}
                onClick={() => onOpenRisk?.(hypothesis.id, idea.id)}
                className="shrink-0 p-0.5"
                title={
                  idea.risk
                    ? `${t('risk.label')}: ${t(`risk.${idea.risk.computed === 'very-high' ? 'veryHigh' : idea.risk.computed}`)}`
                    : t('risk.notSet')
                }
                aria-label="Risk assessment"
              >
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    idea.risk ? RISK_DOT_COLORS[idea.risk.computed] : 'bg-content-muted'
                  }`}
                />
              </button>

              {/* Projection badge */}
              {idea.projection?.projectedCpk != null && (
                <span
                  data-testid={`idea-projection-${idea.id}`}
                  className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500 shrink-0"
                >
                  {idea.projection.projectedCpk.toFixed(2)}
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

              {/* Overflow menu */}
              <IdeaOverflowMenu
                idea={idea}
                hypothesisId={hypothesis.id}
                hypothesisText={hypothesis.text}
                isConverted={isConverted}
                onUpdateDirection={onUpdateDirection}
                onOpenRisk={onOpenRisk}
                onOpenWhatIf={onOpenWhatIf}
                onAskCoScout={onAskCoScout}
                onRemoveIdea={onRemoveIdea}
              />
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
