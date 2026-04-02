import React from 'react';
import { Camera, Link2, Plus } from 'lucide-react';
import type { Finding } from '@variscout/core/findings';

export interface ObservationsSectionProps {
  observations: Finding[];
  onLink?: (findingId: string) => void;
  onAddObservation?: () => void;
}

/**
 * ObservationsSection — shows unlinked findings (gemba/expert evidence not yet
 * connected to a question).
 *
 * Returns null when there are no observations and no add callback is provided.
 */
const ObservationsSection: React.FC<ObservationsSectionProps> = ({
  observations,
  onLink,
  onAddObservation,
}) => {
  if (observations.length === 0 && !onAddObservation) {
    return null;
  }

  return (
    <div
      className="border-t border-edge/60 pt-2 flex flex-col gap-1"
      data-testid="observations-section"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-[0.625rem] font-semibold text-content-muted uppercase tracking-wide">
          Observations
        </span>
        {observations.length > 0 && (
          <span
            className="text-[0.5625rem] bg-amber-500/15 text-amber-400 rounded px-1 leading-4"
            aria-label={`${observations.length} unlinked observation${observations.length !== 1 ? 's' : ''}`}
            data-testid="observations-count"
          >
            {observations.length}
          </span>
        )}
      </div>

      {/* Observation rows */}
      {observations.map(finding => (
        <div
          key={finding.id}
          className="flex items-start gap-1.5 px-2 py-1"
          data-testid={`observation-${finding.id}`}
        >
          <Camera size={12} className="mt-0.5 text-amber-500 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-xs text-content leading-snug line-clamp-2">
            {finding.text}
          </span>
          {onLink && (
            <button
              type="button"
              onClick={() => onLink(finding.id)}
              aria-label={`Link observation to a question`}
              className="shrink-0 p-0.5 rounded text-content-muted hover:text-blue-400 transition-colors"
              data-testid={`link-observation-${finding.id}`}
            >
              <Link2 size={11} />
            </button>
          )}
        </div>
      ))}

      {/* Add observation button */}
      {onAddObservation && (
        <button
          type="button"
          onClick={onAddObservation}
          className="flex items-center gap-1 px-2 py-1 text-xs text-content-muted hover:text-content transition-colors"
          data-testid="add-observation-button"
        >
          <Plus size={11} aria-hidden="true" />
          Add observation
        </button>
      )}
    </div>
  );
};

export default ObservationsSection;
