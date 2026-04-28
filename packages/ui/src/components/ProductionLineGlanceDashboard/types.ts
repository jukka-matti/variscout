import type {
  CapabilityBoxplotNode,
  StepErrorParetoStep,
  IChartDataPoint,
  SpecLimits,
} from '@variscout/charts';
import type { StatsResult } from '@variscout/core';
import type { SpecLookupContext } from '@variscout/core/types';

export interface ProductionLineGlanceDashboardProps {
  /** Top-left slot: line-level Cpk-vs-target time series. */
  cpkTrend: {
    data: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
    specs: SpecLimits;
  };
  /** Top-right slot: Δ(Cp-Cpk) gap over time. */
  cpkGapTrend: {
    series: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
  };
  /** Bottom-left slot: per-node Cpk distribution. */
  capabilityNodes: ReadonlyArray<CapabilityBoxplotNode>;
  /** Bottom-right slot: per-step error ranking. */
  errorSteps: ReadonlyArray<StepErrorParetoStep>;

  /** Filter strip data + state. Optional — strip hidden when omitted. */
  filter?: {
    availableContext: {
      hubColumns: string[];
      tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
    };
    contextValueOptions: Record<string, string[]>;
    value: SpecLookupContext;
    onChange: (next: SpecLookupContext) => void;
  };

  /** Click handler for a step bar in the bottom-right Pareto. */
  onStepClick?: (nodeId: string) => void;

  /** Optional title shown above the dashboard. */
  title?: string;
}
