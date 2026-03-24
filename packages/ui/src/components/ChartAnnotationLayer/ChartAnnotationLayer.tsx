import React, { useCallback, useState, useRef, useEffect } from 'react';
import { AnnotationBox } from './AnnotationBox';
import type { Finding } from '@variscout/core';

/** Local visual state for a finding's annotation box (not persisted) */
interface AnnotationOffset {
  offsetX: number;
  offsetY: number;
  width: number;
}

const DEFAULT_OFFSET: AnnotationOffset = { offsetX: 0, offsetY: 0, width: 140 };

export interface ChartAnnotationLayerProps {
  /** Findings to render as annotation boxes */
  findings: Finding[];
  /** Edit a finding's text */
  onEditFinding: (id: string, text: string) => void;
  /** Delete a finding */
  onDeleteFinding: (id: string) => void;
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
 * to a category via categoryPositions map. Position offsets are local state
 * (not persisted in Finding). Offsets reset when category keys change.
 */
export const ChartAnnotationLayer: React.FC<ChartAnnotationLayerProps> = ({
  findings,
  onEditFinding,
  onDeleteFinding,
  isActive,
  categoryPositions,
  maxWidth,
  textColor,
  fontSize,
}) => {
  // Local visual offsets (not persisted) — keyed by finding ID
  const [offsets, setOffsets] = useState<Map<string, AnnotationOffset>>(new Map());
  const prevKeysRef = useRef<string>('');

  // Reset offsets when category positions change (data change, filter, sort)
  useEffect(() => {
    const keys = Array.from(categoryPositions.keys()).sort().join(',');
    if (prevKeysRef.current !== '' && prevKeysRef.current !== keys) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting visual offsets when chart categories change (external data change)
      setOffsets(new Map());
    }
    prevKeysRef.current = keys;
  }, [categoryPositions]);

  const getOffset = useCallback(
    (findingId: string): AnnotationOffset => {
      return offsets.get(findingId) ?? DEFAULT_OFFSET;
    },
    [offsets]
  );

  const handleUpdateOffset = useCallback((id: string, updates: Partial<AnnotationOffset>) => {
    setOffsets(prev => {
      const next = new Map(prev);
      const current = prev.get(id) ?? { ...DEFAULT_OFFSET };
      next.set(id, { ...current, ...updates });
      return next;
    });
  }, []);

  const handleTextChange = useCallback(
    (id: string, text: string) => {
      onEditFinding(id, text);
    },
    [onEditFinding]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteFinding(id);
      setOffsets(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [onDeleteFinding]
  );

  // Determine anchor key for a finding
  const getAnchorKey = (finding: Finding): string | null => {
    if (!finding.source) return null;
    if (finding.source.chart === 'ichart') {
      // I-Chart findings use their ID as anchor key (free-floating)
      return finding.id;
    }
    if (finding.source.chart === 'coscout') {
      // CoScout findings are not tied to a chart position — exclude from annotation layer
      return null;
    }
    return finding.source.category;
  };

  // Only render visible findings (those whose anchor category exists in positions)
  const visibleFindings = findings.filter(f => {
    const key = getAnchorKey(f);
    return key !== null && categoryPositions.has(key);
  });

  if (visibleFindings.length === 0) return null;

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
      {visibleFindings.map(finding => {
        const anchorKey = getAnchorKey(finding)!;
        const pos = categoryPositions.get(anchorKey);
        if (!pos) return null;

        const offset = getOffset(finding.id);

        return (
          <AnnotationBox
            key={finding.id}
            findingId={finding.id}
            findingStatus={finding.status}
            text={finding.text}
            offsetX={offset.offsetX}
            offsetY={offset.offsetY}
            width={offset.width}
            anchorX={pos.x}
            anchorY={pos.y}
            maxWidth={maxWidth}
            isActive={isActive}
            textColor={textColor}
            fontSize={fontSize}
            onUpdateOffset={handleUpdateOffset}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
          />
        );
      })}
    </div>
  );
};

export default ChartAnnotationLayer;
