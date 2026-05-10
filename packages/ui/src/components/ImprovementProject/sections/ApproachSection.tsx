import React, { useId } from 'react';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';

export interface ApproachSectionProps {
  improvementIdeas?: ImprovementIdea[];
  actionItems?: ActionItem[];
  narrative?: string;
  onNarrativeChange?: (value: string) => void;
  onNavigate?: (target: { kind: 'improvementIdea' | 'actionItem'; id: string }) => void;
}

const panelClassName = 'rounded-md border border-edge bg-surface-secondary p-4';
const cardClassName =
  'w-full rounded-md border border-edge bg-surface p-3 text-left text-sm text-content';
const interactiveCardClassName = `${cardClassName} transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring`;
const chipClassName =
  'rounded-full border border-edge bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content/80';
const textareaClassName =
  'min-h-28 w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

function formatCompleted(action: ActionItem): string | undefined {
  return action.completedAt ? 'completed' : undefined;
}

function ideaMetadata(idea: ImprovementIdea): string[] {
  return [idea.direction, idea.timeframe, idea.selected ? 'selected' : undefined].filter(
    (value): value is string => Boolean(value)
  );
}

function actionMetadata(action: ActionItem): string[] {
  return [
    action.assignee?.displayName,
    action.dueDate ? `Due ${action.dueDate}` : undefined,
    formatCompleted(action),
  ].filter((value): value is string => Boolean(value));
}

function MetadataChips({ values }: { values: string[] }) {
  if (values.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map(value => (
        <span key={value} className={chipClassName}>
          {value}
        </span>
      ))}
    </div>
  );
}

export const ApproachSection: React.FC<ApproachSectionProps> = ({
  improvementIdeas = [],
  actionItems = [],
  narrative = '',
  onNarrativeChange,
  onNavigate,
}) => {
  const generatedId = useId();
  const ideasHeadingId = `approach-ideas-heading-${generatedId}`;
  const actionsHeadingId = `approach-actions-heading-${generatedId}`;
  const narrativeHeadingId = `approach-narrative-heading-${generatedId}`;
  const narrativeTextareaId = `approach-narrative-textarea-${generatedId}`;

  return (
    <div className="space-y-4">
      <section className={panelClassName} aria-labelledby={ideasHeadingId}>
        <h3 id={ideasHeadingId} className="text-sm font-semibold text-content">
          Improvement ideas
        </h3>

        {improvementIdeas.length === 0 ? (
          <p className="mt-3 text-sm text-content/70">No improvement ideas linked yet.</p>
        ) : (
          <ul className="mt-3 space-y-2" aria-label="Improvement ideas">
            {improvementIdeas.map(idea => (
              <li key={idea.id}>
                {onNavigate ? (
                  <button
                    type="button"
                    className={interactiveCardClassName}
                    onClick={() => onNavigate({ kind: 'improvementIdea', id: idea.id })}
                  >
                    <span className="font-medium">{idea.text}</span>
                    <MetadataChips values={ideaMetadata(idea)} />
                  </button>
                ) : (
                  <div className={cardClassName}>
                    <p className="font-medium">{idea.text}</p>
                    <MetadataChips values={ideaMetadata(idea)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={panelClassName} aria-labelledby={actionsHeadingId}>
        <h3 id={actionsHeadingId} className="text-sm font-semibold text-content">
          Action items
        </h3>

        {actionItems.length === 0 ? (
          <p className="mt-3 text-sm text-content/70">No action items linked yet.</p>
        ) : (
          <ul className="mt-3 space-y-2" aria-label="Action items">
            {actionItems.map(action => (
              <li key={action.id}>
                {onNavigate ? (
                  <button
                    type="button"
                    className={interactiveCardClassName}
                    onClick={() => onNavigate({ kind: 'actionItem', id: action.id })}
                  >
                    <span className="font-medium">{action.text}</span>
                    <MetadataChips values={actionMetadata(action)} />
                  </button>
                ) : (
                  <div className={cardClassName}>
                    <p className="font-medium">{action.text}</p>
                    <MetadataChips values={actionMetadata(action)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={panelClassName} aria-labelledby={narrativeHeadingId}>
        <h3 id={narrativeHeadingId} className="text-sm font-semibold text-content">
          Narrative
        </h3>
        <label className="mt-3 block space-y-2" htmlFor={narrativeTextareaId}>
          <span className="text-sm font-medium text-content">Approach narrative</span>
          <textarea
            id={narrativeTextareaId}
            className={textareaClassName}
            value={narrative}
            onChange={event => onNarrativeChange?.(event.currentTarget.value)}
          />
        </label>
      </section>
    </div>
  );
};
