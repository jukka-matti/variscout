import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import type { FindingStatus } from '@variscout/core';
import { annotationColors } from './types';

const MIN_WIDTH = 80;

/** Status colors for the indicator dot */
const STATUS_DOT_COLORS: Record<FindingStatus, string> = {
  observed: '#f59e0b', // amber
  investigating: '#3b82f6', // blue
  analyzed: '#a855f7', // purple
  improving: '#06b6d4', // cyan
  resolved: '#22c55e', // green
};

interface AnnotationBoxProps {
  findingId: string;
  findingStatus: FindingStatus;
  text: string;
  /** Pixel offset from anchor default position */
  offsetX: number;
  offsetY: number;
  /** Width of the text box in pixels */
  width: number;
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
  onUpdateOffset: (
    id: string,
    updates: { offsetX?: number; offsetY?: number; width?: number }
  ) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export const AnnotationBox: React.FC<AnnotationBoxProps> = ({
  findingId,
  findingStatus,
  text,
  offsetX,
  offsetY,
  width,
  anchorX,
  anchorY,
  maxWidth,
  isActive,
  textColor,
  fontSize,
  onUpdateOffset,
  onTextChange,
  onDelete,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const resizeStart = useRef({ x: 0, width: 0 });

  const colorDef = annotationColors['neutral'];

  // Position: anchor point minus half width (centered), plus offset
  const left = anchorX - width / 2 + offsetX;
  const top = anchorY - 40 + offsetY; // 40px above anchor by default

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
        offsetX,
        offsetY,
      };
    },
    [isActive, offsetX, offsetY]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onUpdateOffset(findingId, {
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
  }, [isDragging, findingId, onUpdateOffset]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, width };
    },
    [isActive, width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x;
      const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, resizeStart.current.width + dx));
      onUpdateOffset(findingId, { width: newWidth });
    };

    const handleUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, findingId, maxWidth, onUpdateOffset]);

  // Text editing
  const handleTextBlur = useCallback(() => {
    const newText = textRef.current?.textContent || '';
    if (newText !== text) {
      onTextChange(findingId, newText);
    }
  }, [findingId, text, onTextChange]);

  // Auto-focus new empty annotations
  useEffect(() => {
    if (isActive && text === '' && textRef.current) {
      textRef.current.focus();
    }
  }, [isActive, text]);

  return (
    <div
      ref={boxRef}
      data-testid={`annotation-box-${findingId}`}
      style={{
        position: 'absolute',
        left,
        top,
        width,
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
      {/* Status indicator dot */}
      <span
        data-testid={`annotation-status-${findingId}`}
        style={{
          position: 'absolute',
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: STATUS_DOT_COLORS[findingStatus],
        }}
      />

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
        {text}
      </div>

      {/* Controls (visible on hover/focus when active) */}
      {isActive && isHovered && (
        <>
          {/* Delete button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete(findingId);
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
            title="Delete observation"
          >
            <X size={10} color="#fff" />
          </button>

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
