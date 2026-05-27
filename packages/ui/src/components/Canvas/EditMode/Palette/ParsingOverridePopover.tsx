import React from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';

export interface ParsingOverridePopoverProps {
  columnName: string;
  profile: ColumnParsingProfile;
  anchor: { x: number; y: number };
  onChoose: (columnName: string, interpretation: ParsingInterpretation) => void;
  onApplyToSimilar: (columnName: string, interpretation: ParsingInterpretation) => void;
  onClose: () => void;
}

export const ParsingOverridePopover: React.FC<ParsingOverridePopoverProps> = ({
  columnName,
  profile,
  anchor,
  onChoose,
  onApplyToSimilar,
  onClose,
}) => {
  return (
    <>
      <div
        data-testid="parsing-override-popover-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        data-testid="parsing-override-popover"
        role="dialog"
        aria-label={`Parsing options for ${columnName}`}
        tabIndex={-1}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
        style={{ position: 'fixed', left: anchor.x, top: anchor.y, zIndex: 50 }}
        className="w-[20rem] rounded-md border border-edge bg-surface-primary p-3 text-xs shadow-md"
      >
        <header className="mb-2 flex items-baseline justify-between">
          <span className="font-medium text-content">{columnName}</span>
          {profile.primary ? (
            <span className="text-content-tertiary">
              {profile.primary.label} · {profile.confidence}%
            </span>
          ) : (
            <span className="text-red-700">parse failed</span>
          )}
        </header>

        {profile.transformedSamples.length > 0 && (
          <ul className="mb-2 space-y-0.5 font-mono text-[10px] text-content-secondary">
            {profile.transformedSamples.map((sample, i) => (
              <li key={i}>
                {sample.raw} → {sample.transformed}
              </li>
            ))}
          </ul>
        )}

        {profile.alternatives.length > 0 && (
          <section className="mb-2 border-t border-edge pt-2">
            <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
              Alternatives
            </h5>
            <ul className="space-y-0.5">
              {profile.alternatives.map(alt => (
                <li key={alt.interpretation.label}>
                  <button
                    type="button"
                    data-testid={`override-alternative-${alt.interpretation.label}`}
                    className="flex w-full items-baseline justify-between rounded px-1 py-0.5 text-left text-xs text-content hover:bg-surface-secondary"
                    onClick={() => {
                      onChoose(columnName, alt.interpretation);
                      onClose();
                    }}
                  >
                    <span>{alt.interpretation.label}</span>
                    <span className="text-[10px] text-content-tertiary">
                      {alt.parseCount} / {alt.totalCount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.primary && (
          <button
            type="button"
            className="w-full rounded-md border border-edge bg-surface-primary px-2 py-1 text-xs text-content hover:bg-surface-secondary"
            onClick={() => onApplyToSimilar(columnName, profile.primary!)}
          >
            Apply to similar columns →
          </button>
        )}
      </div>
    </>
  );
};

export default ParsingOverridePopover;
