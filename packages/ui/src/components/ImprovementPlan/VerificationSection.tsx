import React from 'react';

export interface VerificationData {
  cpkBefore: number;
  cpkAfter: number;
  passRateBefore: number;
  passRateAfter: number;
  meanShift: number;
  sigmaRatio: number;
  dataDate: string;
}

export interface VerificationSectionProps {
  verification?: VerificationData;
  onAddVerificationData?: () => void;
  onViewStagedCharts?: () => void;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

export const VerificationSection: React.FC<VerificationSectionProps> = ({
  verification,
  onAddVerificationData,
  onViewStagedCharts,
}) => {
  return (
    <div data-testid="verification-section" className="space-y-3">
      <h3 className="text-sm font-semibold text-content">Verification</h3>

      {!verification ? (
        <div
          data-testid="verification-empty-state"
          className="rounded-lg border border-dashed border-edge bg-surface-secondary p-4 text-sm text-content/60"
        >
          <p className="mb-1">No verification data yet.</p>
          <p className="mb-3">Complete actions, then upload new data to check the improvement.</p>

          {onAddVerificationData && (
            <button
              data-testid="add-verification-btn"
              onClick={onAddVerificationData}
              className="mb-3 flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-content transition-colors hover:bg-surface-secondary"
            >
              <span>Add verification data</span>
            </button>
          )}

          <p className="text-xs text-content/40">
            Or upload data normally — system will ask if it&apos;s for verification.
          </p>
        </div>
      ) : (
        <div data-testid="verification-data" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-content/50">
            <span />
            <span data-testid="verification-data-date">
              {formatDate(verification.dataDate)} data
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Cpk */}
            <div
              data-testid="verification-cpk"
              className="rounded-lg border border-edge bg-surface-secondary p-3"
            >
              <div className="mb-1 text-xs text-content/50">Cpk</div>
              <div className="text-xs text-content/60">
                {Number.isFinite(verification.cpkBefore) ? verification.cpkBefore.toFixed(2) : '—'}
              </div>
              <div
                data-testid="verification-cpk-after"
                className={`text-base font-semibold ${
                  verification.cpkAfter > verification.cpkBefore ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {Number.isFinite(verification.cpkAfter) ? verification.cpkAfter.toFixed(2) : '—'}
              </div>
            </div>

            {/* Pass Rate */}
            <div
              data-testid="verification-pass-rate"
              className="rounded-lg border border-edge bg-surface-secondary p-3"
            >
              <div className="mb-1 text-xs text-content/50">Pass Rate</div>
              <div className="text-xs text-content/60">
                {Math.round(verification.passRateBefore)}%
              </div>
              <div
                data-testid="verification-pass-rate-after"
                className={`text-base font-semibold ${
                  verification.passRateAfter > verification.passRateBefore
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {Math.round(verification.passRateAfter)}%
              </div>
            </div>

            {/* Mean Shift */}
            <div
              data-testid="verification-mean-shift"
              className="rounded-lg border border-edge bg-surface-secondary p-3"
            >
              <div className="mb-1 text-xs text-content/50">Mean Shift</div>
              <div className="text-base font-semibold text-content">
                {verification.meanShift >= 0 ? '+' : ''}
                {Number.isFinite(verification.meanShift) ? verification.meanShift.toFixed(2) : '—'}
              </div>
            </div>

            {/* Sigma Ratio */}
            <div
              data-testid="verification-sigma-ratio"
              className="rounded-lg border border-edge bg-surface-secondary p-3"
            >
              <div className="mb-1 text-xs text-content/50">&sigma; Ratio</div>
              <div
                data-testid="verification-sigma-ratio-value"
                className={`text-base font-semibold ${
                  verification.sigmaRatio < 1 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {Number.isFinite(verification.sigmaRatio)
                  ? verification.sigmaRatio.toFixed(2)
                  : '—'}
              </div>
            </div>
          </div>

          {onViewStagedCharts && (
            <button
              data-testid="view-staged-charts-btn"
              onClick={onViewStagedCharts}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View staged charts in Analysis →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
