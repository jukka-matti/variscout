import React from 'react';
import type { CanvasLevel } from '@variscout/core/canvas';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';

export interface MobileLevelPickerProps {
  hubId: ProcessHubId;
  currentLevel: CanvasLevel;
  focalStepId?: string;
  disabled?: boolean;
}

const LEVELS: ReadonlyArray<{ level: CanvasLevel; label: string }> = [
  { level: 'l1', label: 'System' },
  { level: 'l2', label: 'Process' },
  { level: 'l3', label: 'Step' },
];

export const MobileLevelPicker: React.FC<MobileLevelPickerProps> = ({
  hubId,
  currentLevel,
  focalStepId,
  disabled = false,
}) => {
  const fitToContent = useCanvasViewportStore(s => s.fitToContent);
  const setLevel = useCanvasViewportStore(s => s.setLevel);
  const [rememberedFocalStepId, setRememberedFocalStepId] = React.useState(focalStepId);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (focalStepId) setRememberedFocalStepId(focalStepId);
  }, [focalStepId]);

  const availableFocalStepId = focalStepId ?? rememberedFocalStepId;

  return (
    <div
      role="toolbar"
      aria-label="Canvas levels"
      className="flex items-center gap-1 border-b border-edge bg-surface-secondary px-3 py-2"
      data-testid="mobile-level-picker"
    >
      {LEVELS.map(({ level, label }) => {
        const isStepWithoutFocus = level === 'l3' && !availableFocalStepId;
        const isDisabled = disabled || isStepWithoutFocus;
        return (
          <button
            key={level}
            type="button"
            aria-pressed={currentLevel === level}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              if (level === 'l3' && availableFocalStepId) {
                setLevel(hubId, level, availableFocalStepId);
              }
              fitToContent(hubId, level);
            }}
            className={[
              'rounded px-3 py-1.5 text-sm font-medium transition-colors',
              currentLevel === level
                ? 'bg-content text-surface-primary'
                : 'text-content-secondary hover:bg-surface-tertiary hover:text-content',
              isDisabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
