/**
 * SynthesisLayer — Layer 3 of the Evidence Map
 *
 * Renders convergence zones where multiple causal chains meet,
 * SuspectedCause hub labels, status indicators, and projected improvements.
 * Azure only — not rendered in PWA.
 */

import React from 'react';
import { Group } from '@visx/group';
import type { ConvergencePointData } from './types';

interface SynthesisLayerProps {
  convergencePoints: ConvergencePointData[];
  isDark: boolean;
  onConvergenceClick?: (factor: string) => void;
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'confirmed':
      return '#22c55e';
    case 'not-confirmed':
      return '#64748b';
    case 'suspected':
    default:
      return '#8b5cf6';
  }
}

const SynthesisLayer: React.FC<SynthesisLayerProps> = ({
  convergencePoints,
  isDark,
  onConvergenceClick,
}) => {
  if (convergencePoints.length === 0) return null;

  return (
    <Group>
      {convergencePoints.map(point => {
        const statusColor = getStatusColor(point.hubStatus);
        const zoneRadius = 40 + point.incomingCount * 10;

        return (
          <Group
            key={point.factor}
            top={point.y}
            left={point.x}
            style={{ cursor: onConvergenceClick ? 'pointer' : 'default' }}
            onClick={() => onConvergenceClick?.(point.factor)}
          >
            {/* Convergence zone (subtle glow behind the factor node) */}
            <circle
              r={zoneRadius}
              fill={statusColor}
              fillOpacity={0.08}
              stroke={statusColor}
              strokeWidth={1.5}
              strokeDasharray="4,3"
              strokeOpacity={0.3}
            />

            {/* Hub name label (below the convergence zone) */}
            {point.hubName && (
              <>
                <rect
                  x={-70}
                  y={zoneRadius + 4}
                  width={140}
                  height={32}
                  rx={6}
                  fill={statusColor}
                  opacity={0.15}
                  stroke={statusColor}
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={zoneRadius + 18}
                  textAnchor="middle"
                  fill={isDark ? '#c4b5fd' : '#6d28d9'}
                  fontSize={9}
                  fontWeight="bold"
                >
                  {point.hubName.length > 22 ? point.hubName.slice(0, 20) + '...' : point.hubName}
                </text>
                <text x={0} y={zoneRadius + 30} textAnchor="middle" fill={statusColor} fontSize={7}>
                  {point.hubStatus === 'confirmed'
                    ? 'CONFIRMED'
                    : point.hubStatus === 'not-confirmed'
                      ? 'NOT CONFIRMED'
                      : 'SUSPECTED ROOT CAUSE'}
                </text>
              </>
            )}

            {/* Projected improvement annotation */}
            {point.projectedImprovement && (
              <text
                x={0}
                y={-(zoneRadius + 8)}
                textAnchor="middle"
                fill={isDark ? '#86efac' : '#15803d'}
                fontSize={8}
                fontWeight="bold"
              >
                {point.projectedImprovement}
              </text>
            )}
          </Group>
        );
      })}
    </Group>
  );
};

export default SynthesisLayer;
