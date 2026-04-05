/**
 * FactorNode — Individual factor circle in the Evidence Map
 *
 * Shows factor name, R²adj metric, and strongest level effect.
 * Color indicates strength tier: green (>20%), amber (10-20%), grey (<10%).
 */

import React from 'react';
import { Group } from '@visx/group';
import type { FactorNodeData } from './types';

interface FactorNodeProps {
  node: FactorNodeData;
  isHighlighted: boolean;
  isDark: boolean;
  compact: boolean;
  onClick?: (factor: string) => void;
  onHover?: (factor: string | null) => void;
}

function getNodeColor(rSquaredAdj: number, isDark: boolean): string {
  if (rSquaredAdj >= 0.2) return '#22c55e'; // green — strong
  if (rSquaredAdj >= 0.1) return '#f59e0b'; // amber — moderate
  return isDark ? '#64748b' : '#94a3b8'; // grey — weak
}

const FactorNode: React.FC<FactorNodeProps> = ({
  node,
  isHighlighted,
  isDark,
  compact,
  onClick,
  onHover,
}) => {
  const color = getNodeColor(node.rSquaredAdj, isDark);
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const highlightStroke = isHighlighted ? '#3b82f6' : 'transparent';

  return (
    <Group
      top={node.y}
      left={node.x}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick?.(node.factor)}
      onMouseEnter={() => onHover?.(node.factor)}
      onMouseLeave={() => onHover?.(null)}
      role="button"
      aria-label={`Factor: ${node.factor}, ${node.metricLabel}`}
    >
      {/* Highlight ring */}
      {isHighlighted && (
        <circle
          r={node.radius + 4}
          fill="none"
          stroke={highlightStroke}
          strokeWidth={2}
          opacity={0.8}
        />
      )}

      {/* Main circle */}
      <circle
        r={node.radius}
        fill={color}
        opacity={isHighlighted ? 0.9 : 0.7}
        stroke={color}
        strokeWidth={1.5}
      />

      {/* Factor name */}
      <text
        textAnchor="middle"
        dy={compact ? 0 : -4}
        fill="white"
        fontSize={compact ? 8 : 11}
        fontWeight="bold"
        pointerEvents="none"
      >
        {node.factor.length > 12 ? node.factor.slice(0, 10) + '...' : node.factor}
      </text>

      {/* Metric label (R²adj value) */}
      {!compact && (
        <text textAnchor="middle" dy={10} fill={subtextColor} fontSize={9} pointerEvents="none">
          {node.metricLabel}
        </text>
      )}

      {/* Effect label (±value) */}
      {!compact && node.effectLabel && (
        <text
          textAnchor="middle"
          dy={22}
          fill={textColor}
          fontSize={8}
          opacity={0.7}
          pointerEvents="none"
        >
          {node.effectLabel}
        </text>
      )}
    </Group>
  );
};

export default FactorNode;
