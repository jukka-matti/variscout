/**
 * FactorNode — Individual factor circle in the Evidence Map
 *
 * Shows factor name, R²adj metric, and strongest level effect.
 * Color indicates strength tier: green (>20%), amber (10-20%), grey (<10%).
 */

import React from 'react';
import { Group } from '@visx/group';
import { chartColors, getChromeColors } from '../colors';
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
  if (rSquaredAdj >= 0.2) return chartColors.pass; // green — strong
  if (rSquaredAdj >= 0.1) return chartColors.warning; // amber — moderate
  const chrome = getChromeColors(isDark);
  return chrome.labelMuted; // grey — weak
}

const FactorNode: React.FC<FactorNodeProps> = ({
  node,
  isHighlighted,
  isDark,
  compact,
  onClick,
  onHover,
}) => {
  const chrome = getChromeColors(isDark);
  const color = getNodeColor(node.rSquaredAdj, isDark);
  const textColor = chrome.labelPrimary;
  const subtextColor = chrome.labelSecondary;
  const highlightStroke = isHighlighted ? chartColors.mean : 'transparent';

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
