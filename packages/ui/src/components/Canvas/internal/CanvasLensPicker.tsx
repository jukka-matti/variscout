import React from 'react';
import type { MessageCatalog } from '@variscout/core';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import {
  CANVAS_LENS_REGISTRY,
  type CanvasLensDefinition,
  type CanvasLensId,
} from '@variscout/hooks';
import { useWallLocale } from '../../InvestigationWall/hooks/useWallLocale';

interface CanvasLensPickerProps {
  activeLens: CanvasLensId;
  onChange?: (next: CanvasLensId) => void;
}

const orderedLenses: CanvasLensDefinition[] = [
  CANVAS_LENS_REGISTRY.default,
  CANVAS_LENS_REGISTRY.capability,
  CANVAS_LENS_REGISTRY.defect,
  CANVAS_LENS_REGISTRY['process-flow'],
  CANVAS_LENS_REGISTRY.performance,
  CANVAS_LENS_REGISTRY.yamazumi,
];

const LENS_LABEL_KEY: Record<CanvasLensId, keyof MessageCatalog> = {
  default: 'canvas.lens.default.label',
  capability: 'canvas.lens.capability.label',
  defect: 'canvas.lens.defect.label',
  performance: 'canvas.lens.performance.label',
  yamazumi: 'canvas.lens.yamazumi.label',
  'process-flow': 'canvas.lens.processFlow.label',
};

const LENS_DESC_KEY: Record<CanvasLensId, keyof MessageCatalog> = {
  default: 'canvas.lens.default.description',
  capability: 'canvas.lens.capability.description',
  defect: 'canvas.lens.defect.description',
  performance: 'canvas.lens.performance.description',
  yamazumi: 'canvas.lens.yamazumi.description',
  'process-flow': 'canvas.lens.processFlow.description',
};

export const CanvasLensPicker: React.FC<CanvasLensPickerProps> = ({ activeLens, onChange }) => {
  const locale = useWallLocale();
  return (
    <div
      role="toolbar"
      aria-label={getMessage(locale, 'canvas.lensPicker.ariaLabel')}
      className="flex flex-wrap items-center gap-1 rounded-md border border-edge bg-surface-secondary p-1"
      data-testid="canvas-lens-picker"
    >
      {orderedLenses.map(lens => {
        const label = getMessage(locale, LENS_LABEL_KEY[lens.id]);
        return (
          <button
            key={lens.id}
            type="button"
            aria-label={formatMessage(locale, 'canvas.lensPicker.lensAriaLabel', { label })}
            aria-pressed={activeLens === lens.id}
            disabled={!lens.enabled}
            title={getMessage(locale, LENS_DESC_KEY[lens.id])}
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
            {label}
          </button>
        );
      })}
    </div>
  );
};
