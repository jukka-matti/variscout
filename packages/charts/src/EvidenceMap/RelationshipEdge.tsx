/**
 * RelationshipEdge — Statistical relationship line between two factor nodes
 *
 * Styled by relationship type derived from R²adj comparison.
 */

import React from 'react';
import { chartColors, getChromeColors } from '../colors';
import type { RelationshipEdgeData, RelationshipType } from './types';

interface RelationshipEdgeProps {
  edge: RelationshipEdgeData;
  isHighlighted: boolean;
  isDark: boolean;
  hideLabels?: boolean;
  onClick?: (factorA: string, factorB: string) => void;
}

interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
}

function getEdgeStyle(type: RelationshipType, isDark: boolean): EdgeStyle {
  const chrome = getChromeColors(isDark);
  switch (type) {
    case 'interactive':
      return { stroke: chartColors.cpPotential, strokeWidth: 2.5, opacity: 0.7 };
    case 'synergistic':
      return { stroke: chartColors.pass, strokeWidth: 2, opacity: 0.6 };
    case 'overlapping':
      return { stroke: chartColors.fail, strokeWidth: 1.5, strokeDasharray: '6,4', opacity: 0.5 };
    case 'redundant':
      return {
        stroke: chrome.stageDivider,
        strokeWidth: 1,
        strokeDasharray: '3,6',
        opacity: 0.3,
      };
    case 'independent':
    default:
      return {
        stroke: chrome.gridLine,
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
  hideLabels = false,
  onClick,
}) => {
  const style = getEdgeStyle(edge.type, isDark);
  const midX = (edge.ax + edge.bx) / 2;
  const midY = (edge.ay + edge.by) / 2;
  const chrome = getChromeColors(isDark);
  const showLabel = edge.type !== 'independent' && edge.type !== 'redundant';
  const labelColor = chrome.labelSecondary;

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
        stroke={isHighlighted ? chartColors.mean : style.stroke}
        strokeWidth={isHighlighted ? style.strokeWidth + 1 : style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={isHighlighted ? 0.9 : style.opacity}
      />

      {/* Label badge (for non-trivial relationships) */}
      {showLabel && !hideLabels && (
        <>
          <rect
            x={midX - 45}
            y={midY - 16}
            width={90}
            height={28}
            rx={5}
            fill={chrome.tooltipBg}
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
