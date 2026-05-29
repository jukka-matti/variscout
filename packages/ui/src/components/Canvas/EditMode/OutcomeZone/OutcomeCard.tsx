import { useRef } from 'react';
import type { OutcomeSpec } from '@variscout/core';
import { ExploreJumpButton } from '../ExploreJumpButton';

export interface OutcomeCardProps {
  spec: OutcomeSpec;
  onSpecsClick: (anchor: { x: number; y: number }) => void;
  onExploreJumpClick?: () => void;
}

const DIRECTION_BY_TYPE: Record<OutcomeSpec['characteristicType'], string> = {
  nominalIsBest: '=',
  smallerIsBetter: '↓',
  largerIsBetter: '↑',
};

function formatPill(label: string, value: number | undefined): string {
  return `${label}: ${value !== undefined ? value : '—'}`;
}

export function OutcomeCard({ spec, onSpecsClick, onExploreJumpClick }: OutcomeCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const direction = DIRECTION_BY_TYPE[spec.characteristicType];

  const handleSpecsClick = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    onSpecsClick({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
  };

  return (
    <div className="group flex flex-col gap-1 rounded-md border border-edge bg-surface-primary p-3 text-content">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{spec.columnName}</span>
          <span aria-hidden="true" className="text-content-tertiary">
            {direction}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onExploreJumpClick && (
            <ExploreJumpButton label={spec.columnName} onClick={onExploreJumpClick} />
          )}
          <button
            ref={buttonRef}
            type="button"
            aria-label="Edit specs"
            onClick={handleSpecsClick}
            className="rounded p-1 text-content-tertiary hover:bg-surface-secondary"
          >
            ⚙
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 text-xs text-content-secondary">
        <span className="rounded bg-surface-secondary px-2 py-0.5">
          {formatPill('target', spec.target)}
        </span>
        <span className="rounded bg-surface-secondary px-2 py-0.5">
          {formatPill('LSL', spec.lsl)}
        </span>
        <span className="rounded bg-surface-secondary px-2 py-0.5">
          {formatPill('USL', spec.usl)}
        </span>
        <span className="rounded bg-surface-secondary px-2 py-0.5">
          {formatPill('Cpk', spec.cpkTarget)}
        </span>
      </div>
    </div>
  );
}
