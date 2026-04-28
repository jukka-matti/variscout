/**
 * ProductionLineGlanceDashboard — 2×2 composition of capability slots.
 *
 * | Cpk vs target i-chart | Δ(Cp-Cpk) trend       |
 * | Per-step Cpk boxplot  | Per-step error Pareto |
 *
 * Pure props-based composition — Plan C owns the data wiring that produces
 * the four slot inputs. Top-left slot reuses `IChart` directly; the other
 * three use the W1'/W3 components from @variscout/charts.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * section "Single-hub production-line-glance dashboard".
 */
import React from 'react';
import {
  IChart,
  CapabilityGapTrendChart,
  CapabilityBoxplot,
  StepErrorPareto,
} from '@variscout/charts';
import { ProductionLineGlanceFilterStrip } from './ProductionLineGlanceFilterStrip';
import type { ProductionLineGlanceDashboardProps } from './types';

export const ProductionLineGlanceDashboard: React.FC<ProductionLineGlanceDashboardProps> = ({
  cpkTrend,
  cpkGapTrend,
  capabilityNodes,
  errorSteps,
  filter,
  onStepClick,
  title,
}) => {
  return (
    <div className="flex h-full w-full flex-col">
      {title ? (
        <div className="border-b border-edge bg-surface px-4 py-3">
          <h2 className="text-base font-semibold text-content">{title}</h2>
        </div>
      ) : null}

      {filter ? (
        <ProductionLineGlanceFilterStrip
          availableContext={filter.availableContext}
          contextValueOptions={filter.contextValueOptions}
          value={filter.value}
          onChange={filter.onChange}
        />
      ) : null}

      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-px bg-edge">
        <div data-testid="slot-cpk-trend" className="bg-surface p-3">
          <IChart
            data={[...cpkTrend.data]}
            stats={cpkTrend.stats}
            specs={cpkTrend.specs}
            yAxisLabel={cpkTrend.yAxisLabel ?? 'Cpk'}
          />
        </div>

        <div data-testid="slot-cpk-gap" className="bg-surface p-3">
          <CapabilityGapTrendChart gapSeries={cpkGapTrend.series} gapStats={cpkGapTrend.stats} />
        </div>

        <div data-testid="slot-capability-boxplot" className="relative bg-surface p-3">
          <CapabilityBoxplot nodes={capabilityNodes} />
          {capabilityNodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-content-muted">
              No mapped nodes — per-step capability unavailable.
            </div>
          ) : null}
        </div>

        <div data-testid="slot-step-pareto" className="bg-surface p-3">
          <StepErrorPareto steps={errorSteps} onStepClick={onStepClick} />
        </div>
      </div>
    </div>
  );
};

export default ProductionLineGlanceDashboard;
