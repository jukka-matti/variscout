import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ChartAnnotation, HighlightColor } from './types';
import { annotationColors } from './types';

const MIN_WIDTH = 80;

const COLOR_OPTIONS: Array<HighlightColor | 'neutral'> = ['red', 'amber', 'green', 'neutral'];

interface AnnotationBoxProps {
  annotation: ChartAnnotation;
  /** Pixel position of the anchor (center-x of the category element) */
  anchorX: number;
  /** Pixel position above the category element (top whisker / bar top) */
  anchorY: number;
  /** Maximum width as fraction of chart width */
  maxWidth: number;
  /** Whether annotation mode is active (enables editing) */
  isActive: boolean;
  /** Text color from chart theme */
  textColor: string;
  /** Font size from chart layout */
  fontSize: number;
  onUpdate: (id: string, updates: Partial<ChartAnnotation>) => void;
  onDelete: (id: string) => void;
}

export const AnnotationBox: React.FC<AnnotationBoxProps> = ({
  annotation,
  anchorX,
  anchorY,
  maxWidth,
  isActive,
  textColor,
  fontSize,
  onUpdate,
  onDelete,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const resizeStart = useRef({ x: 0, width: 0 });

  const colorDef = annotationColors[annotation.color];

  // Position: anchor point minus half width (centered), plus offset
  const left = anchorX - annotation.width / 2 + annotation.offsetX;
  const top = anchorY - 40 + annotation.offsetY; // 40px above anchor by default

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: annotation.offsetX,
        offsetY: annotation.offsetY,
      };
    },
    [isActive, annotation.offsetX, annotation.offsetY]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onUpdate(annotation.id, {
        offsetX: dragStart.current.offsetX + dx,
        offsetY: dragStart.current.offsetY + dy,
      });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, annotation.id, onUpdate]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, width: annotation.width };
    },
    [isActive, annotation.width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x;
      const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, resizeStart.current.width + dx));
      onUpdate(annotation.id, { width: newWidth });
    };

    const handleUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, annotation.id, maxWidth, onUpdate]);

  // Text editing
  const handleTextBlur = useCallback(() => {
    const text = textRef.current?.textContent || '';
    if (text !== annotation.text) {
      onUpdate(annotation.id, { text });
    }
  }, [annotation.id, annotation.text, onUpdate]);

  // Auto-focus new empty annotations
  useEffect(() => {
    if (isActive && annotation.text === '' && textRef.current) {
      textRef.current.focus();
    }
  }, [isActive, annotation.text]);

  return (
    <div
      ref={boxRef}
      data-testid={`annotation-box-${annotation.id}`}
      style={{
        position: 'absolute',
        left,
        top,
        width: annotation.width,
        backgroundColor: colorDef.fill,
        border: `1px solid ${colorDef.border}`,
        borderRadius: 6,
        padding: '6px 8px',
        pointerEvents: isActive ? 'auto' : 'none',
        cursor: isActive && !isResizing ? 'grab' : 'default',
        userSelect: isActive ? 'text' : 'none',
        zIndex: isDragging ? 20 : 10,
        opacity: isDragging ? 0.85 : 1,
      }}
      onMouseDown={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Text content */}
      <div
        ref={textRef}
        contentEditable={isActive}
        suppressContentEditableWarning
        onBlur={handleTextBlur}
        onMouseDown={e => e.stopPropagation()} // Don't start drag when clicking text
        style={{
          color: textColor,
          fontSize,
          lineHeight: 1.3,
          outline: 'none',
          minHeight: '1.3em',
          wordBreak: 'break-word',
        }}
        data-placeholder="Add note..."
      >
        {annotation.text}
      </div>

      {/* Controls (visible on hover/focus when active) */}
      {isActive && isHovered && (
        <>
          {/* Delete button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete(annotation.id);
            }}
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: 'rgba(100,116,139,0.8)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Delete annotation"
          >
            <X size={10} color="#fff" />
          </button>

          {/* Color dots */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginTop: 4,
              justifyContent: 'center',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                onClick={e => {
                  e.stopPropagation();
                  onUpdate(annotation.id, { color: c });
                }}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: annotationColors[c].hex,
                  border:
                    annotation.color === c
                      ? `2px solid ${textColor}`
                      : '1px solid rgba(148,163,184,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title={c}
              />
            ))}
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              top: 0,
              right: -3,
              bottom: 0,
              width: 6,
              cursor: 'ew-resize',
            }}
          />
        </>
      )}
    </div>
  );
};

export default AnnotationBox;
