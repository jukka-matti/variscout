import React from 'react';
import {
  coerceCanvasOverlays,
  enabledCanvasOverlays,
  type CanvasOverlayId,
} from '@variscout/hooks';

interface CanvasOverlayPickerProps {
  activeOverlays: CanvasOverlayId[];
  onToggle?: (overlay: CanvasOverlayId) => void;
}

export const CanvasOverlayPicker: React.FC<CanvasOverlayPickerProps> = ({
  activeOverlays,
  onToggle,
}) => {
  const active = coerceCanvasOverlays(activeOverlays);

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="canvas-overlay-picker">
      {enabledCanvasOverlays().map(overlay => {
        const pressed = active.includes(overlay.id);
        return (
          <button
            key={overlay.id}
            type="button"
            className={`rounded-md border px-2 py-1 text-xs font-medium ${
              pressed
                ? 'border-blue-500 bg-blue-500/10 text-blue-700'
                : 'border-edge bg-surface-primary text-content-secondary hover:bg-surface-secondary'
            }`}
            aria-pressed={pressed}
            aria-label={`${overlay.label} overlay`}
            title={overlay.description}
            onClick={() => onToggle?.(overlay.id)}
          >
            {overlay.label}
          </button>
        );
      })}
    </div>
  );
};
