/**
 * CpkTrajectoryChart — shared Cpk-over-time / Cpk-per-subgroup trajectory.
 *
 * Used by Explore's capability lens and Control's production-line glance band.
 * It wraps IChartBase with Cpk-specific axis and target defaults so the two
 * surfaces do not fork capability trajectory rendering.
 */
import React from 'react';
import { withResponsiveSize } from './responsive/withResponsiveSize';
import { IChartBase } from './IChart';
import type { CpkTrajectoryChartProps } from './types';

export const CpkTrajectoryChartBase: React.FC<CpkTrajectoryChartProps> = ({
  parentWidth,
  parentHeight,
  data,
  stats,
  cpkTarget = 1.33,
  yAxisLabel = 'Cpk',
  xAxisLabel = 'Subgroup',
  targetLabel = 'Cpk target',
  fullPointCount,
  showBranding,
  brandingText,
}) => (
  <IChartBase
    parentWidth={parentWidth}
    parentHeight={parentHeight}
    data={[...data]}
    stats={stats}
    specs={{ target: cpkTarget }}
    yAxisLabel={yAxisLabel}
    xAxisLabel={xAxisLabel}
    targetLabel={targetLabel}
    fullPointCount={fullPointCount ?? data.length}
    showBranding={showBranding}
    brandingText={brandingText}
  />
);

const CpkTrajectoryChart = withResponsiveSize(CpkTrajectoryChartBase);
export default CpkTrajectoryChart;
export { CpkTrajectoryChart };
