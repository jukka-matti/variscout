import React from 'react';
import type { MindmapNode } from './types';

export interface CategoryPopoverProps {
  node: MindmapNode;
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
  onSelect: (factor: string, value: string | number) => void;
  onClose: () => void;
}

const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  node,
  x,
  y,
  svgWidth,
  svgHeight,
  onSelect,
  onClose,
}) => {
  const categories = node.categoryData ?? [];
  if (categories.length === 0) return null;

  // Position: prefer right side, flip if too close to edge
  const popoverWidth = 180;
  const popoverMaxHeight = 200;
  const offsetX = 50;
  const flipX = x + offsetX + popoverWidth > svgWidth;
  const flipY = y + popoverMaxHeight > svgHeight;

  const left = flipX ? x - offsetX - popoverWidth : x + offsetX;
  const top = flipY ? Math.max(4, y - popoverMaxHeight / 2) : y - 10;

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
        style={{
          position: 'absolute',
          left,
          top,
          width: popoverWidth,
          maxHeight: popoverMaxHeight,
          overflow: 'auto',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: '1px solid #334155',
          }}
        >
          {node.displayName || node.factor}
        </div>
        {categories.map(cat => (
          <button
            key={String(cat.value)}
            onClick={() => onSelect(node.factor, cat.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '4px 6px',
              fontSize: 11,
              color: '#e2e8f0',
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.background = '#334155')}
            onMouseLeave={e => ((e.target as HTMLElement).style.background = 'transparent')}
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
            <span style={{ color: '#94a3b8', fontSize: 10, flexShrink: 0, marginLeft: 4 }}>
              {cat.contributionPct.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </foreignObject>
  );
};

export default CategoryPopover;
