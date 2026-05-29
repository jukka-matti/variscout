import { useRef } from 'react';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';
import { useAnalysisScopeStore } from '@variscout/stores';
import { useScopeIsEmpty } from '../hooks/useScopeIsEmpty';
import { ExploreJumpButton } from '../ExploreJumpButton';

export interface FactorChipProps {
  control: ImprovementProjectFactorControl;
  onSpecsClick: (anchor: { x: number; y: number }) => void;
  onExploreJumpClick?: () => void;
}

function formatTargetCondition(value: string): string {
  return value.trim().length > 0 ? value : '—';
}

export function FactorChip({ control, onSpecsClick, onExploreJumpClick }: FactorChipProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isStepBound = control.stepId !== undefined && control.stepId.length > 0;

  const handleSpecsClick = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    onSpecsClick({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
  };

  const bindingPillClasses = isStepBound
    ? 'bg-surface-secondary text-content-secondary'
    : 'bg-blue-50 text-blue-700';

  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const matchingFilter = categoricalFilters.find(f => f.column === control.factor);
  const isYMatch = boxplotFactor === control.factor;
  const isInScope = isYMatch || matchingFilter !== undefined;
  const scopeIsEmpty = useScopeIsEmpty();
  const shouldDim = !scopeIsEmpty && !isInScope;

  const rootClasses = [
    'group flex flex-col gap-1 rounded-md border p-3 text-content',
    isYMatch
      ? 'border-blue-600 ring-1 ring-blue-500/30 bg-blue-50'
      : 'border-edge bg-surface-primary',
    shouldDim ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <div className="flex items-center justify-between gap-2">
        {isYMatch && (
          <span aria-hidden="true" className="text-blue-700">
            ✓
          </span>
        )}
        <span className="text-base font-semibold">{control.factor}</span>
        <div className="flex items-center gap-1">
          {onExploreJumpClick && (
            <ExploreJumpButton label={control.factor} onClick={onExploreJumpClick} />
          )}
          <button
            ref={buttonRef}
            type="button"
            aria-label="Edit factor"
            onClick={handleSpecsClick}
            className="rounded p-1 text-content-tertiary hover:bg-surface-secondary"
          >
            ⚙
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 text-xs text-content-secondary">
        <span className="rounded bg-surface-secondary px-2 py-0.5">
          {formatTargetCondition(control.targetCondition)}
        </span>
        <span className={`rounded px-2 py-0.5 ${bindingPillClasses}`}>
          {isStepBound ? `step ${control.stepId}` : 'global'}
        </span>
        {matchingFilter && (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700">
            {control.factor} = {matchingFilter.values.join(', ')} only
          </span>
        )}
      </div>
    </div>
  );
}
