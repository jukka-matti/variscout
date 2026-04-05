/**
 * CausalEdge — Directed causal link arrow between factor nodes (Layer 2)
 *
 * Shows investigation "why?" chains with evidence badges and gap markers.
 */

import React from 'react';
import type { CausalEdgeData } from './types';

interface CausalEdgeProps {
  edge: CausalEdgeData;
  isHighlighted: boolean;
  isDark: boolean;
  onClick?: (id: string) => void;
}

function getEvidenceColor(evidenceType: CausalEdgeData['evidenceType']): string {
  switch (evidenceType) {
    case 'data':
      return '#22c55e'; // green
    case 'gemba':
      return '#3b82f6'; // blue
    case 'expert':
      return '#8b5cf6'; // purple
    case 'unvalidated':
      return '#ef4444'; // red
  }
}

function getEvidenceBadge(evidenceType: CausalEdgeData['evidenceType']): string {
  switch (evidenceType) {
    case 'data':
      return 'D';
    case 'gemba':
      return 'G';
    case 'expert':
      return 'E';
    case 'unvalidated':
      return '?';
  }
}

const CausalEdge: React.FC<CausalEdgeProps> = ({ edge, isHighlighted, isDark, onClick }) => {
  const evidenceColor = getEvidenceColor(edge.evidenceType);
  const isGap = edge.evidenceType === 'unvalidated';
  const strokeColor = isHighlighted ? '#3b82f6' : isGap ? '#ef4444' : '#3b82f6';
  const midX = (edge.fromX + edge.toX) / 2;
  const midY = (edge.fromY + edge.toY) / 2;

  // Compute arrow direction
  const dx = edge.toX - edge.fromX;
  const dy = edge.toY - edge.fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len;
  const ny = dy / len;

  // Arrow head at 80% of the way (not at the edge of the target node)
  const arrowX = edge.fromX + nx * len * 0.8;
  const arrowY = edge.fromY + ny * len * 0.8;
  const arrowSize = 6;
  const perpX = -ny * arrowSize;
  const perpY = nx * arrowSize;
  const arrowPoints = [
    `${arrowX + nx * arrowSize},${arrowY + ny * arrowSize}`,
    `${arrowX + perpX},${arrowY + perpY}`,
    `${arrowX - perpX},${arrowY - perpY}`,
  ].join(' ');

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick?.(edge.id)}
      role="img"
      aria-label={`Causal link: ${edge.fromFactor} ${edge.direction} ${edge.toFactor}`}
    >
      {/* Edge line */}
      <line
        x1={edge.fromX}
        y1={edge.fromY}
        x2={edge.toX}
        y2={edge.toY}
        stroke={strokeColor}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeDasharray={isGap ? '5,4' : undefined}
        opacity={isHighlighted ? 0.9 : 0.7}
      />

      {/* Arrow head */}
      <polygon points={arrowPoints} fill={strokeColor} opacity={0.8} />

      {/* Why statement label */}
      <rect
        x={midX - 50}
        y={midY - 10}
        width={100}
        height={20}
        rx={4}
        fill={isDark ? '#1e293b' : '#f8fafc'}
        stroke={strokeColor}
        strokeWidth={1}
        opacity={0.9}
      />
      <text
        x={midX}
        y={midY + 3}
        textAnchor="middle"
        fill={isDark ? '#93c5fd' : '#1e40af'}
        fontSize={8}
        pointerEvents="none"
      >
        {edge.whyStatement.length > 20 ? edge.whyStatement.slice(0, 18) + '...' : edge.whyStatement}
      </text>

      {/* Evidence badge */}
      <circle cx={midX + 55} cy={midY} r={7} fill={evidenceColor} opacity={0.9} />
      <text
        x={midX + 55}
        y={midY + 3}
        textAnchor="middle"
        fill="white"
        fontSize={7}
        fontWeight="bold"
        pointerEvents="none"
      >
        {getEvidenceBadge(edge.evidenceType)}
      </text>

      {/* Gap marker for unvalidated links */}
      {isGap && (
        <>
          <rect
            x={midX - 30}
            y={midY + 12}
            width={60}
            height={14}
            rx={3}
            fill={isDark ? '#7f1d1d' : '#fef2f2'}
            stroke="#ef4444"
            strokeWidth={1}
            opacity={0.9}
          />
          <text
            x={midX}
            y={midY + 22}
            textAnchor="middle"
            fill="#fca5a5"
            fontSize={7}
            pointerEvents="none"
          >
            NEEDS DATA
          </text>
        </>
      )}
    </g>
  );
};

export default CausalEdge;
