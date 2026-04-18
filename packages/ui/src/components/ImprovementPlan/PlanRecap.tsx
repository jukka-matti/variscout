import React from 'react';

export interface SelectedIdea {
  id: string;
  text: string;
  causeColor?: string;
  projectedCpk?: number;
}

export interface PlanRecapProps {
  selectedIdeas: SelectedIdea[];
  onEditSelection?: () => void;
}

export const PlanRecap: React.FC<PlanRecapProps> = ({ selectedIdeas, onEditSelection }) => {
  return (
    <div
      data-testid="plan-recap"
      className="bg-surface-secondary rounded-xl border border-edge p-4 mb-5"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-content">Selected Improvements</h3>
        {onEditSelection && (
          <button
            data-testid="plan-recap-edit-btn"
            onClick={onEditSelection}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Edit selection →
          </button>
        )}
      </div>

      {selectedIdeas.length === 0 ? (
        <p data-testid="plan-recap-empty" className="text-sm text-content-muted italic">
          No improvements selected.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" data-testid="plan-recap-badges">
          {selectedIdeas.map(idea => (
            <div
              key={idea.id}
              data-testid={`plan-recap-badge-${idea.id}`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-md text-xs"
            >
              {idea.causeColor && (
                <span
                  data-testid={`plan-recap-dot-${idea.id}`}
                  className="shrink-0 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: idea.causeColor,
                    display: 'inline-block',
                  }}
                />
              )}
              <span
                data-testid={`plan-recap-text-${idea.id}`}
                className="text-content max-w-[140px] truncate"
              >
                {idea.text}
              </span>
              {idea.projectedCpk != null && (
                <span
                  data-testid={`plan-recap-cpk-${idea.id}`}
                  className="text-green-700 dark:text-green-400 text-[10px] shrink-0"
                >
                  Cpk {Number.isFinite(idea.projectedCpk) ? idea.projectedCpk.toFixed(2) : '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
