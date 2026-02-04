import React from 'react';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';

/**
 * Chart Legend Component
 *
 * Displays color-coded legend explaining point colors in control charts.
 * Supports two display modes:
 * - 'educational': Emphasizes Common Cause vs Special Cause distinction (SPC learning)
 * - 'practical': Focuses on actionable status (In-control vs needs action)
 */

export interface ChartLegendProps {
  /** Display mode: educational (SPC learning) or practical (action-oriented) */
  mode?: 'educational' | 'practical';
  /** Width of the legend area (typically matches chart width) */
  width: number;
  /** Y position from top of SVG */
  top: number;
  /** Show/hide the legend */
  show?: boolean;
}

const ChartLegend: React.FC<ChartLegendProps> = ({
  mode = 'educational',
  width,
  top,
  show = true,
}) => {
  const { chrome, fontScale } = useChartTheme();

  if (!show) return null;

  const fontSize = 11 * (fontScale || 1);
  const dotSize = 6;
  const spacing = Math.min(width / 3, 180); // Adaptive spacing

  // Legend items based on mode
  const items =
    mode === 'educational'
      ? [
          { color: chartColors.mean, label: 'Common Cause', description: 'Random variation' },
          {
            color: chartColors.fail,
            label: 'Special Cause',
            description: 'Requires investigation',
          },
          { color: chartColors.spec, label: 'Out-of-Spec', description: 'Customer defect' },
        ]
      : [
          { color: chartColors.mean, label: 'In-Control', description: 'Process stable' },
          { color: chartColors.fail, label: 'Special Cause', description: 'Investigate' },
          { color: chartColors.spec, label: 'Out-of-Spec', description: 'Defect' },
        ];

  return (
    <g transform={`translate(0, ${top})`}>
      {/* Legend background (optional subtle background) */}
      <rect x={0} y={0} width={width} height={24} fill="transparent" />

      {/* Legend items */}
      {items.map((item, idx) => {
        const x = (width - items.length * spacing) / 2 + idx * spacing;

        return (
          <g key={item.label} transform={`translate(${x}, 12)`}>
            {/* Color dot */}
            <circle cx={0} cy={0} r={dotSize} fill={item.color} />

            {/* Label text */}
            <text
              x={dotSize + 6}
              y={0}
              fill={chrome.labelPrimary}
              fontSize={fontSize}
              dominantBaseline="middle"
              fontWeight={500}
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default ChartLegend;
