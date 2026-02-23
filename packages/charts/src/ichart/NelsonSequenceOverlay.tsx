/**
 * Nelson Rule 2 sequence highlighting overlay for I-Chart
 *
 * Renders subtle connector lines and bracket markers behind data points
 * to visually indicate Nelson Rule 2 sequences (9+ consecutive points on same side of mean).
 */

import React from 'react';
import { LinePath, Line } from '@visx/shape';
import type { NelsonRule2Sequence } from '@variscout/core';
import { chartColors } from '../colors';

interface IChartDataPoint {
  x: number;
  y: number;
}

interface NelsonSequenceOverlayProps {
  data: IChartDataPoint[];
  sequences: NelsonRule2Sequence[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

const NelsonSequenceOverlay: React.FC<NelsonSequenceOverlayProps> = ({
  data,
  sequences,
  xScale,
  yScale,
}) => (
  <>
    {sequences.map((seq, idx) => {
      const sequencePoints = data.slice(seq.startIndex, seq.endIndex + 1);
      if (sequencePoints.length < 2) return null;

      return (
        <g key={`nelson-seq-${idx}`}>
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
  </>
);

export default NelsonSequenceOverlay;
