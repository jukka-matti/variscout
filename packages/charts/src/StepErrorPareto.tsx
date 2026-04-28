/**
 * StepErrorPareto — process steps ranked by error count.
 *
 * Bottom-right slot of the production-line-glance 2×2 dashboard. Bars are
 * one process step each, sorted by `errorCount` descending. Top-N + "Others"
 * aggregation is inherited from ParetoChartBase styling (ADR-051).
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * section "Bottom-right: Per-step error Pareto (W1')".
 */
import React, { useMemo } from 'react';
import { withParentSize } from '@visx/responsive';
import { ParetoChartBase } from './ParetoChart';
import type { StepErrorParetoProps, StepErrorParetoStep, ParetoDataPoint } from './types';

const PARETO_MAX_CATEGORIES = 20;
const OTHERS_KEY = 'Others';

function sortAndFilterSteps(steps: ReadonlyArray<StepErrorParetoStep>): StepErrorParetoStep[] {
  return [...steps]
    .filter(s => Number.isFinite(s.errorCount) && s.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount);
}

interface AggregateResult {
  points: ParetoDataPoint[];
  totalCount: number;
  labelToNodeId: Map<string, string>;
}

function aggregateAndCompute(sorted: StepErrorParetoStep[], maxBars: number): AggregateResult {
  const labelToNodeId = new Map<string, string>();
  const totalCount = sorted.reduce((sum, s) => sum + s.errorCount, 0);

  if (sorted.length === 0) {
    return { points: [], totalCount: 0, labelToNodeId };
  }

  let head: StepErrorParetoStep[];
  let othersSum = 0;
  if (sorted.length <= maxBars) {
    head = sorted;
  } else {
    head = sorted.slice(0, maxBars - 1);
    othersSum = sorted.slice(maxBars - 1).reduce((sum, s) => sum + s.errorCount, 0);
  }

  head.forEach(s => labelToNodeId.set(s.label, s.nodeId));

  let runningTotal = 0;
  const points: ParetoDataPoint[] = head.map(s => {
    runningTotal += s.errorCount;
    return {
      key: s.label,
      value: s.errorCount,
      cumulative: runningTotal,
      cumulativePercentage: totalCount > 0 ? (runningTotal / totalCount) * 100 : 0,
    };
  });

  if (othersSum > 0) {
    runningTotal += othersSum;
    points.push({
      key: OTHERS_KEY,
      value: othersSum,
      cumulative: runningTotal,
      cumulativePercentage: totalCount > 0 ? (runningTotal / totalCount) * 100 : 0,
    });
  }

  return { points, totalCount, labelToNodeId };
}

export const StepErrorParetoBase: React.FC<StepErrorParetoProps> = ({
  parentWidth,
  parentHeight,
  steps,
  yAxisLabel = 'Errors',
  maxBars = PARETO_MAX_CATEGORIES,
  onStepClick,
  showBranding,
  brandingText,
}) => {
  const sorted = useMemo(() => sortAndFilterSteps(steps), [steps]);
  const { points, totalCount, labelToNodeId } = useMemo(
    () => aggregateAndCompute(sorted, maxBars),
    [sorted, maxBars]
  );

  const handleBarClick = (key: string) => {
    if (!onStepClick) return;
    const nodeId = labelToNodeId.get(key);
    if (nodeId) onStepClick(nodeId);
  };

  return (
    <ParetoChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={points}
      totalCount={totalCount}
      yAxisLabel={yAxisLabel}
      othersKey={OTHERS_KEY}
      onBarClick={handleBarClick}
      showBranding={showBranding}
      brandingText={brandingText}
    />
  );
};

const StepErrorPareto = withParentSize(StepErrorParetoBase);
export default StepErrorPareto;
export { StepErrorPareto };
