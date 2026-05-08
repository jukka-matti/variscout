import React from 'react';
import {
  coerceCanvasOverlays,
  enabledCanvasOverlays,
  useTranslation,
  type CanvasOverlayId,
} from '@variscout/hooks';

interface CanvasOverlayPickerProps {
  activeOverlays: CanvasOverlayId[];
  availableOverlays?: CanvasOverlayId[];
  onToggle?: (overlay: CanvasOverlayId) => void;
}

export const CanvasOverlayPicker: React.FC<CanvasOverlayPickerProps> = ({
  activeOverlays,
  availableOverlays,
  onToggle,
}) => {
  const { t } = useTranslation();
  const active = coerceCanvasOverlays(activeOverlays);
  const allowed = availableOverlays ? new Set(availableOverlays) : undefined;
  const overlays = enabledCanvasOverlays().filter(overlay => !allowed || allowed.has(overlay.id));

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="canvas-overlay-picker">
      {overlays.map(overlay => {
        const pressed = active.includes(overlay.id);
        const label = overlay.id === 'wall' ? t('canvas.wall.overlayLabel') : overlay.label;
        const description =
          overlay.id === 'wall' ? t('canvas.wall.overlayDescription') : overlay.description;
        return (
          <button
            key={overlay.id}
            type="button"
            className={`rounded-md border px-2 py-1 text-xs font-medium ${
              pressed
                ? 'border-status-info bg-status-info-soft text-status-info'
                : 'border-edge bg-surface-primary text-content-secondary hover:bg-surface-secondary'
            }`}
            aria-pressed={pressed}
            aria-label={`${label} overlay`}
            title={description}
            onClick={() => onToggle?.(overlay.id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
