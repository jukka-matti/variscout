import { useRef } from 'react';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';
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

  return (
    <div className="group flex flex-col gap-1 rounded-md border border-edge bg-surface-primary p-3 text-content">
      <div className="flex items-center justify-between gap-2">
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
      </div>
    </div>
  );
}
