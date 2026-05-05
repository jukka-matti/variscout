import React from 'react';
import {
  CANVAS_LENS_REGISTRY,
  type CanvasLensDefinition,
  type CanvasLensId,
} from '@variscout/hooks';

interface CanvasLensPickerProps {
  activeLens: CanvasLensId;
  onChange?: (next: CanvasLensId) => void;
}

const orderedLenses: CanvasLensDefinition[] = [
  CANVAS_LENS_REGISTRY.default,
  CANVAS_LENS_REGISTRY.capability,
  CANVAS_LENS_REGISTRY.defect,
  CANVAS_LENS_REGISTRY.performance,
  CANVAS_LENS_REGISTRY.yamazumi,
];

export const CanvasLensPicker: React.FC<CanvasLensPickerProps> = ({ activeLens, onChange }) => {
  return (
    <div
      role="toolbar"
      aria-label="Canvas lenses"
      className="flex flex-wrap items-center gap-1 rounded-md border border-edge bg-surface-secondary p-1"
      data-testid="canvas-lens-picker"
    >
      {orderedLenses.map(lens => (
        <button
          key={lens.id}
          type="button"
          aria-label={`${lens.label} lens`}
          aria-pressed={activeLens === lens.id}
          disabled={!lens.enabled}
          title={lens.description}
          onClick={() => {
            if (lens.enabled) onChange?.(lens.id);
          }}
          className={[
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            activeLens === lens.id
              ? 'bg-content text-surface-primary'
              : 'text-content-secondary hover:bg-surface-tertiary hover:text-content',
            !lens.enabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {lens.label}
        </button>
      ))}
    </div>
  );
};
