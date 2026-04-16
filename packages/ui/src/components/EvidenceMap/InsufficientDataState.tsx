import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface InsufficientDataStateProps {
  typeName: string;
  have: number;
  need: number;
}

export const InsufficientDataState: React.FC<InsufficientDataStateProps> = ({
  typeName,
  have,
  need,
}) => {
  const factorsEstimate = Math.floor(need / 10);

  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[200px] px-6 py-8 text-center"
      data-testid="insufficient-data-state"
    >
      {/* Warning icon with dashed border */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-dashed border-amber-500 mb-4">
        <AlertCircle size={28} className="text-amber-500" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-content mb-1">
        Insufficient data for {typeName}
      </h3>

      {/* Subtitle */}
      <p className="text-sm text-content-secondary mb-3">
        {have} aggregated rows, need at least {need} for {factorsEstimate} factors.
      </p>

      {/* Suggestion */}
      <p className="text-xs text-content-secondary italic max-w-sm">
        Try a coarser aggregation unit (e.g., per day instead of per shift).
      </p>
    </div>
  );
};
