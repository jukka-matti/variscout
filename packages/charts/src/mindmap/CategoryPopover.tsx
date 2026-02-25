import React, { useRef, useCallback, useEffect } from 'react';
import type { useChartTheme } from '../useChartTheme';
import type { MindmapNode } from './types';

export interface CategoryPopoverProps {
  node: MindmapNode;
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
  onSelect: (factor: string, value: string | number) => void;
  onClose: () => void;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
}

const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  node,
  x,
  y,
  svgWidth,
  svgHeight,
  onSelect,
  onClose,
  chrome,
}) => {
  const categories = node.categoryData ?? [];
  const [focusIndex, setFocusIndex] = React.useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset focus when node changes
  useEffect(() => {
    setFocusIndex(-1);
  }, [node.factor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex(prev => Math.min(prev + 1, categories.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && focusIndex >= 0 && focusIndex < categories.length) {
        e.preventDefault();
        onSelect(node.factor, categories[focusIndex].value);
        return;
      }
    },
    [categories, focusIndex, node.factor, onClose, onSelect]
  );

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const buttons = listRef.current.querySelectorAll('[role="option"]');
      buttons[focusIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex]);

  if (categories.length === 0) return null;

  // Position: prefer right side, flip if too close to edge
  const popoverWidth = 180;
  const popoverMaxHeight = 200;
  const offsetX = 50;
  const flipX = x + offsetX + popoverWidth > svgWidth;
  const flipY = y + popoverMaxHeight > svgHeight;

  const left = flipX ? x - offsetX - popoverWidth : x + offsetX;
  const top = flipY ? Math.max(4, y - popoverMaxHeight / 2) : y - 10;

  const hoverBg = chrome.gridLine;

  return (
    <foreignObject x={0} y={0} width={svgWidth} height={svgHeight}>
      {/* Click-away backdrop */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        ref={listRef}
        role="listbox"
        aria-label={`Categories for ${node.displayName || node.factor}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          position: 'absolute',
          left,
          top,
          width: popoverWidth,
          maxHeight: popoverMaxHeight,
          overflow: 'auto',
          background: chrome.tooltipBg,
          border: `1px solid ${chrome.gridLine}`,
          borderRadius: 8,
          padding: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 10,
          outline: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: chrome.labelPrimary,
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: `1px solid ${chrome.gridLine}`,
          }}
        >
          {node.displayName || node.factor}
        </div>
        {categories.map((cat, i) => (
          <button
            key={String(cat.value)}
            role="option"
            aria-selected={i === focusIndex}
            onClick={() => onSelect(node.factor, cat.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '4px 6px',
              fontSize: 11,
              color: chrome.tooltipText,
              background: i === focusIndex ? hoverBg : 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left',
              outline: i === focusIndex ? `2px solid ${chrome.axisPrimary}` : 'none',
              outlineOffset: -2,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = hoverBg;
              setFocusIndex(i);
            }}
            onMouseLeave={e => {
              if (i !== focusIndex) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 110,
              }}
            >
              {String(cat.value)}
            </span>
            <span
              style={{ color: chrome.labelSecondary, fontSize: 10, flexShrink: 0, marginLeft: 4 }}
            >
              {cat.contributionPct.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </foreignObject>
  );
};

export default CategoryPopover;
