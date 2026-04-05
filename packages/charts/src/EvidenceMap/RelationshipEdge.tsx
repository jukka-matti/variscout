/**
 * RelationshipEdge — Statistical relationship line between two factor nodes
 *
 * Styled by relationship type derived from R²adj comparison.
 */

import React from 'react';
import type { RelationshipEdgeData, RelationshipType } from './types';

interface RelationshipEdgeProps {
  edge: RelationshipEdgeData;
  isHighlighted: boolean;
  isDark: boolean;
  onClick?: (factorA: string, factorB: string) => void;
}

interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
}

function getEdgeStyle(type: RelationshipType, isDark: boolean): EdgeStyle {
  switch (type) {
    case 'interactive':
      return { stroke: '#8b5cf6', strokeWidth: 2.5, opacity: 0.7 };
    case 'synergistic':
      return { stroke: '#22c55e', strokeWidth: 2, opacity: 0.6 };
    case 'overlapping':
      return { stroke: '#ef4444', strokeWidth: 1.5, strokeDasharray: '6,4', opacity: 0.5 };
    case 'redundant':
      return {
        stroke: isDark ? '#475569' : '#94a3b8',
        strokeWidth: 1,
        strokeDasharray: '3,6',
        opacity: 0.3,
      };
    case 'independent':
    default:
      return {
        stroke: isDark ? '#334155' : '#cbd5e1',
        strokeWidth: 1,
        strokeDasharray: '2,6',
        opacity: 0.2,
      };
  }
}

function getTypeLabel(type: RelationshipType): string {
  switch (type) {
    case 'interactive':
      return 'INTERACTIVE';
    case 'synergistic':
      return 'SYNERGISTIC';
    case 'overlapping':
      return 'OVERLAPPING';
    case 'redundant':
      return 'REDUNDANT';
    case 'independent':
      return 'INDEPENDENT';
  }
}

function formatStrength(type: RelationshipType, strength: number): string {
  if (type === 'interactive') return `ΔR²=${(strength * 100).toFixed(0)}%`;
  if (type === 'overlapping') return `shared ${(strength * 100).toFixed(0)}%`;
  return '';
}

const RelationshipEdge: React.FC<RelationshipEdgeProps> = ({
  edge,
  isHighlighted,
  isDark,
  onClick,
}) => {
  const style = getEdgeStyle(edge.type, isDark);
  const midX = (edge.ax + edge.bx) / 2;
  const midY = (edge.ay + edge.by) / 2;
  const showLabel = edge.type !== 'independent' && edge.type !== 'redundant';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick?.(edge.factorA, edge.factorB)}
      role="img"
      aria-label={`${edge.factorA} and ${edge.factorB}: ${getTypeLabel(edge.type)}`}
    >
      {/* Edge line */}
      <line
        x1={edge.ax}
        y1={edge.ay}
        x2={edge.bx}
        y2={edge.by}
        stroke={isHighlighted ? '#3b82f6' : style.stroke}
        strokeWidth={isHighlighted ? style.strokeWidth + 1 : style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={isHighlighted ? 0.9 : style.opacity}
      />

      {/* Label badge (for non-trivial relationships) */}
      {showLabel && (
        <>
          <rect
            x={midX - 45}
            y={midY - 16}
            width={90}
            height={28}
            rx={5}
            fill={isDark ? '#1e293b' : '#f8fafc'}
            stroke={style.stroke}
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={midX}
            y={midY - 4}
            textAnchor="middle"
            fill={style.stroke}
            fontSize={7}
            fontWeight="bold"
          >
            {getTypeLabel(edge.type)}
          </text>
          {edge.strength > 0 && (
            <text x={midX} y={midY + 8} textAnchor="middle" fill={labelColor} fontSize={8}>
              {formatStrength(edge.type, edge.strength)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default RelationshipEdge;
