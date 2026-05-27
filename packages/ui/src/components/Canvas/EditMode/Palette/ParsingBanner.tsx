import React from 'react';

export interface ParsingBannerProps {
  warningCount: number;
  onReviewAll: () => void;
}

export const ParsingBanner: React.FC<ParsingBannerProps> = ({ warningCount, onReviewAll }) => {
  return (
    <div
      data-testid="parsing-banner"
      role="status"
      className="flex items-center justify-between gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700"
    >
      <span>⚠ {warningCount} columns need attention</span>
      <button
        type="button"
        className="rounded border border-amber-700/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100"
        onClick={onReviewAll}
      >
        Review
      </button>
    </div>
  );
};

export default ParsingBanner;
