import { useRef } from 'react';
import type { OutcomeSpec } from '@variscout/core';
import { useAnalysisScopeStore } from '@variscout/stores';
import { ExploreJumpButton } from '../ExploreJumpButton';
import { useScopeIsEmpty } from '../hooks/useScopeIsEmpty';

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

  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const isInScope = yColumn === spec.columnName;
  const scopeIsEmpty = useScopeIsEmpty();
  const shouldDim = !scopeIsEmpty && !isInScope;

  const rootClasses = [
    'group flex flex-col gap-1 rounded-md border p-3 text-content',
    isInScope
      ? 'border-green-600 ring-1 ring-green-500/30 bg-green-50'
      : 'border-edge bg-surface-primary',
    shouldDim ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleSpecsClick = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    onSpecsClick({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
  };

  return (
    <div className={rootClasses}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isInScope && (
            <span aria-hidden="true" className="text-green-700">
              ✓
            </span>
          )}
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
