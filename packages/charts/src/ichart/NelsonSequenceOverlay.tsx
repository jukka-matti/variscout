/**
 * Nelson Rule 2 & 3 sequence highlighting overlay for I-Chart
 *
 * Rule 2: dashed red connector lines + bracket markers (9+ consecutive same side)
 * Rule 3: dotted red connector lines + directional arrow (6+ consecutive increasing/decreasing)
 */

import React from 'react';
import { LinePath, Line } from '@visx/shape';
import type { NelsonRule2Sequence, NelsonRule3Sequence } from '@variscout/core';
import { chartColors } from '../colors';

interface IChartDataPoint {
  x: number;
  y: number;
}

interface NelsonSequenceOverlayProps {
  data: IChartDataPoint[];
  rule2Sequences: NelsonRule2Sequence[];
  rule3Sequences: NelsonRule3Sequence[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

const NelsonSequenceOverlay: React.FC<NelsonSequenceOverlayProps> = ({
  data,
  rule2Sequences,
  rule3Sequences,
  xScale,
  yScale,
}) => (
  <>
    {/* Rule 2: dashed connector + bracket markers */}
    {rule2Sequences.map((seq, idx) => {
      const sequencePoints = data.slice(seq.startIndex, seq.endIndex + 1);
      if (sequencePoints.length < 2) return null;

      return (
        <g key={`nelson-r2-${idx}`}>
          {/* Highlight path connecting the sequence */}
          <LinePath
            data={sequencePoints}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={chartColors.fail}
            strokeWidth={3}
            strokeOpacity={0.2}
            strokeDasharray="4,2"
          />
          {/* Bracket markers at start/end to show sequence bounds */}
          <g opacity={0.4}>
            {/* Start marker */}
            <Line
              from={{ x: xScale(sequencePoints[0].x), y: yScale(sequencePoints[0].y) - 15 }}
              to={{ x: xScale(sequencePoints[0].x), y: yScale(sequencePoints[0].y) + 15 }}
              stroke={chartColors.fail}
              strokeWidth={2}
            />
            {/* End marker */}
            <Line
              from={{
                x: xScale(sequencePoints[sequencePoints.length - 1].x),
                y: yScale(sequencePoints[sequencePoints.length - 1].y) - 15,
              }}
              to={{
                x: xScale(sequencePoints[sequencePoints.length - 1].x),
                y: yScale(sequencePoints[sequencePoints.length - 1].y) + 15,
              }}
              stroke={chartColors.fail}
              strokeWidth={2}
            />
          </g>
        </g>
      );
    })}

    {/* Rule 3: dotted connector + directional arrow */}
    {rule3Sequences.map((seq, idx) => {
      const sequencePoints = data.slice(seq.startIndex, seq.endIndex + 1);
      if (sequencePoints.length < 2) return null;

      const lastPoint = sequencePoints[sequencePoints.length - 1];
      const lastX = xScale(lastPoint.x);
      const lastY = yScale(lastPoint.y);
      // Arrow direction: up for increasing, down for decreasing
      const arrowDy = seq.direction === 'increasing' ? -10 : 10;

      return (
        <g key={`nelson-r3-${idx}`}>
          {/* Dotted highlight path */}
          <LinePath
            data={sequencePoints}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={chartColors.fail}
            strokeWidth={2.5}
            strokeOpacity={0.2}
            strokeDasharray="2,2"
          />
          {/* Small directional arrow at sequence end */}
          <g opacity={0.5}>
            <Line
              from={{ x: lastX, y: lastY }}
              to={{ x: lastX, y: lastY + arrowDy }}
              stroke={chartColors.fail}
              strokeWidth={2}
            />
            {/* Arrow head */}
            <polygon
              points={
                seq.direction === 'increasing'
                  ? `${lastX},${lastY - 14} ${lastX - 4},${lastY - 8} ${lastX + 4},${lastY - 8}`
                  : `${lastX},${lastY + 14} ${lastX - 4},${lastY + 8} ${lastX + 4},${lastY + 8}`
              }
              fill={chartColors.fail}
            />
          </g>
        </g>
      );
    })}
  </>
);

export default NelsonSequenceOverlay;
