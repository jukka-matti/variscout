import React from 'react';
import type { MessageCatalog } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import type { CanvasLevel } from '@variscout/core/canvas';
import { useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import { useWallLocale } from '../../AnalyzeWall/hooks/useWallLocale';

export interface MobileLevelPickerProps {
  hubId: ProcessHubId;
  currentLevel: CanvasLevel;
  focalStepId?: string;
  availableStepIds?: readonly string[];
  disabled?: boolean;
}

const LEVELS: ReadonlyArray<{ level: CanvasLevel; labelKey: keyof MessageCatalog }> = [
  { level: 'l1', labelKey: 'canvas.mobile.system' },
  { level: 'l2', labelKey: 'canvas.mobile.process' },
  { level: 'l3', labelKey: 'canvas.mobile.step' },
];

export const MobileLevelPicker: React.FC<MobileLevelPickerProps> = ({
  hubId,
  currentLevel,
  focalStepId,
  availableStepIds,
  disabled = false,
}) => {
  const locale = useWallLocale();
  const fitToContent = useCanvasViewportStore(s => s.fitToContent);
  const setLevel = useCanvasViewportStore(s => s.setLevel);
  const setZoom = useCanvasViewportStore(s => s.setZoom);
  const [rememberedFocalStepId, setRememberedFocalStepId] = React.useState(focalStepId);
  const previousHubIdRef = React.useRef(hubId);

  React.useEffect(() => {
    if (focalStepId && (!availableStepIds || availableStepIds.includes(focalStepId))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRememberedFocalStepId(focalStepId);
    }
  }, [availableStepIds, focalStepId]);

  React.useEffect(() => {
    if (previousHubIdRef.current === hubId) return;
    previousHubIdRef.current = hubId;
    setRememberedFocalStepId(undefined);
  }, [hubId]);

  const availableFocalStepId = React.useMemo(() => {
    const candidate = focalStepId ?? rememberedFocalStepId;
    if (!candidate) return undefined;
    if (availableStepIds && !availableStepIds.includes(candidate)) return undefined;
    return candidate;
  }, [availableStepIds, focalStepId, rememberedFocalStepId]);

  return (
    <div
      role="toolbar"
      aria-label={getMessage(locale, 'canvas.mobile.ariaLabel')}
      className="flex items-center gap-1 border-b border-edge bg-surface-secondary px-3 py-2"
      data-testid="mobile-level-picker"
    >
      {LEVELS.map(({ level, labelKey }) => {
        const label = getMessage(locale, labelKey);
        const isDisabled = disabled;
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
              } else if (level === 'l3') {
                // No focal step available — clear focalStepId via setLevel to l2
                // then immediately zoom to 2.5 (inferLevel → l3) so the final
                // committed state is l3 with no focalStepId. Canvas then renders
                // NoFocalStepPrompt (the step-list surface) at l3 per spec §7.
                setLevel(hubId, 'l2');
                setZoom(hubId, 2.5);
                return;
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
