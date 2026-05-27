import { useEffect, useState } from 'react';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';

export interface FactorSpecsPopoverProps {
  control: ImprovementProjectFactorControl;
  anchor: { x: number; y: number };
  steps: { id: string; name: string }[];
  onApply: (updated: ImprovementProjectFactorControl) => void;
  onClose: () => void;
}

export function FactorSpecsPopover({
  control,
  anchor,
  steps,
  onApply,
  onClose,
}: FactorSpecsPopoverProps) {
  const [targetCondition, setTargetCondition] = useState(control.targetCondition);
  const [stepBinding, setStepBinding] = useState(control.stepId ?? '');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleApply = () => {
    onApply({
      ...control,
      targetCondition,
      stepId: stepBinding === '' ? undefined : stepBinding,
    });
  };

  return (
    <>
      <div
        data-testid="factor-specs-popover-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Edit factor"
        style={{ position: 'fixed', left: `${anchor.x}px`, top: `${anchor.y}px`, zIndex: 50 }}
        className="flex w-72 flex-col gap-3 rounded-md border border-edge bg-surface-primary p-4 shadow-lg"
      >
        <label className="flex flex-col gap-1 text-sm text-content">
          <span>Target condition</span>
          <input
            type="text"
            value={targetCondition}
            onChange={e => setTargetCondition(e.target.value)}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-content"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-content">
          <span>Step binding</span>
          <select
            value={stepBinding}
            onChange={e => setStepBinding(e.target.value)}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-content"
          >
            <option value="">Global (no step binding)</option>
            {steps.map(step => (
              <option key={step.id} value={step.id}>
                {step.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-sm text-content-secondary hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

export default FactorSpecsPopover;
