import React, { useCallback } from 'react';
import { AnnotationBox } from './AnnotationBox';
import type { ChartAnnotation } from './types';

export interface ChartAnnotationLayerProps {
  /** Annotations to render */
  annotations: ChartAnnotation[];
  /** Update handler */
  onAnnotationsChange: (annotations: ChartAnnotation[]) => void;
  /** Whether annotation mode is active */
  isActive: boolean;
  /** Map from category key to pixel x-center position */
  categoryPositions: Map<string, { x: number; y: number }>;
  /** Maximum width for annotation boxes */
  maxWidth: number;
  /** Text color from chart theme */
  textColor: string;
  /** Font size for annotation text */
  fontSize: number;
}

/**
 * ChartAnnotationLayer — HTML overlay for draggable text annotations
 *
 * Positioned absolutely over the chart SVG. Each annotation is anchored
 * to a category via categoryPositions map. Offsets are pixel deltas from
 * the default anchor position.
 */
export const ChartAnnotationLayer: React.FC<ChartAnnotationLayerProps> = ({
  annotations,
  onAnnotationsChange,
  isActive,
  categoryPositions,
  maxWidth,
  textColor,
  fontSize,
}) => {
  const handleUpdate = useCallback(
    (id: string, updates: Partial<ChartAnnotation>) => {
      onAnnotationsChange(annotations.map(a => (a.id === id ? { ...a, ...updates } : a)));
    },
    [annotations, onAnnotationsChange]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onAnnotationsChange(annotations.filter(a => a.id !== id));
    },
    [annotations, onAnnotationsChange]
  );

  // Only render visible annotations (those whose anchor category exists)
  const visibleAnnotations = annotations.filter(a => categoryPositions.has(a.anchorCategory));

  if (visibleAnnotations.length === 0) return null;

  return (
    <div
      data-testid="annotation-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {visibleAnnotations.map(annotation => {
        const pos = categoryPositions.get(annotation.anchorCategory);
        if (!pos) return null;

        return (
          <AnnotationBox
            key={annotation.id}
            annotation={annotation}
            anchorX={pos.x}
            anchorY={pos.y}
            maxWidth={maxWidth}
            isActive={isActive}
            textColor={textColor}
            fontSize={fontSize}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        );
      })}
    </div>
  );
};

export default ChartAnnotationLayer;
