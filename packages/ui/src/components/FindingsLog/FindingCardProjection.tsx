import React from 'react';
import { TrendingDown } from 'lucide-react';
import type { FindingProjection } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { useTranslation } from '@variscout/hooks';

/** Format a numeric delta with arrow and sign */
export function formatDelta(
  from: number,
  to: number,
  decimals: number = 1,
  fmt?: (v: number, d?: number) => string
): string {
  const f = fmt
    ? (v: number) => fmt(v, decimals)
    : (v: number) => formatStatistic(v, 'en', decimals);
  return `${f(from)}\u2192${f(to)}`;
}

export interface ProjectionSectionProps {
  projection: FindingProjection;
  hasSpecs: boolean;
}

const ProjectionSection: React.FC<ProjectionSectionProps> = ({ projection, hasSpecs }) => {
  const { formatStat } = useTranslation();
  // eslint-disable-next-line react-hooks/purity -- Date.now() is intentional for relative time display
  const age = Math.round((Date.now() - new Date(projection.createdAt).getTime()) / 86400000);
  const ageText = age === 0 ? 'today' : age === 1 ? '1 day ago' : `${age} days ago`;

  return (
    <div className="mt-2 border-t border-edge/50 pt-2" data-testid="projection-section">
      <div className="flex items-center gap-1 text-[0.625rem] text-content-muted mb-1">
        <TrendingDown size={10} />
        <span>Projected improvement</span>
        <span className="ml-auto text-[0.5625rem]">{ageText}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6875rem]">
        <span className="text-content-secondary">
          Mean:{' '}
          <span className="text-green-400">
            {formatDelta(projection.baselineMean, projection.projectedMean, 1, formatStat)}
          </span>
        </span>
        <span className="text-content-secondary">
          \u03C3:{' '}
          <span className="text-green-400">
            {formatDelta(projection.baselineSigma, projection.projectedSigma, 2, formatStat)}
          </span>
        </span>
        {hasSpecs &&
          projection.projectedCpk !== undefined &&
          projection.baselineCpk !== undefined && (
            <span className="text-content-secondary">
              Cpk:{' '}
              <span className="text-green-400">
                {formatDelta(projection.baselineCpk, projection.projectedCpk, 2, formatStat)}
              </span>
            </span>
          )}
      </div>
    </div>
  );
};

export default ProjectionSection;
