import React from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import { chartColors } from '../colors';
import type { useChartTheme } from '../useChartTheme';
import { MARGIN } from './helpers';

export interface ProgressFooterProps {
  width: number;
  y: number;
  cumulativeVariationPct: number | null;
  targetPct: number;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
}

const ProgressFooter: React.FC<ProgressFooterProps> = ({
  width,
  y,
  cumulativeVariationPct,
  targetPct,
  chrome,
}) => {
  const barWidth = width - MARGIN.left - MARGIN.right;
  const barHeight = 8;
  const barX = MARGIN.left;
  const barY = y + 8;
  const pct = cumulativeVariationPct ?? 0;
  const fillWidth = Math.max(0, Math.min(barWidth, (pct / 100) * barWidth));
  const targetX = barX + (targetPct / 100) * barWidth;

  return (
    <Group>
      {/* Label */}
      <text x={barX} y={barY - 2} fontSize={10} fill={chrome.labelSecondary} textAnchor="start">
        Focused on {pct > 0 ? `${pct.toFixed(0)}%` : '—'} of variation
      </text>

      {/* Background bar */}
      <rect
        x={barX}
        y={barY + 2}
        width={barWidth}
        height={barHeight}
        rx={4}
        fill={chrome.gridLine}
      />

      {/* Fill bar */}
      {fillWidth > 0 && (
        <rect
          x={barX}
          y={barY + 2}
          width={fillWidth}
          height={barHeight}
          rx={4}
          fill={pct >= targetPct ? chartColors.pass : chartColors.mean}
        />
      )}

      {/* Target marker */}
      <Line
        from={{ x: targetX, y: barY + 1 }}
        to={{ x: targetX, y: barY + barHeight + 3 }}
        stroke={chrome.labelSecondary}
        strokeWidth={1.5}
        strokeDasharray="3,2"
      />
      <text
        x={targetX}
        y={barY + barHeight + 14}
        fontSize={9}
        fill={chrome.labelSecondary}
        textAnchor="middle"
      >
        {targetPct}% target
      </text>
    </Group>
  );
};

export default ProgressFooter;
