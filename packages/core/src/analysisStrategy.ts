import type { AnalysisMode } from './types';

export type ResolvedMode = 'standard' | 'capability' | 'performance' | 'yamazumi';

export type ChartSlotType =
  | 'ichart'
  | 'capability-ichart'
  | 'cpk-scatter'
  | 'yamazumi-chart'
  | 'boxplot'
  | 'distribution-boxplot'
  | 'yamazumi-ichart'
  | 'pareto'
  | 'cpk-pareto'
  | 'yamazumi-pareto'
  | 'stats'
  | 'histogram'
  | 'yamazumi-summary';

export interface AnalysisModeStrategy {
  chartSlots: {
    slot1: ChartSlotType;
    slot2: ChartSlotType;
    slot3: ChartSlotType;
    slot4: ChartSlotType;
  };
  kpiComponent: ResolvedMode;
  reportTitle: string;
  reportSections: string[];
  metricLabel: (hasSpecs: boolean) => string;
  formatMetricValue?: (v: number) => string;
  aiChartInsightKeys: string[];
  aiToolSet: 'standard' | 'performance' | 'yamazumi';
}

export function resolveMode(
  mode: AnalysisMode,
  opts?: { standardIChartMetric?: string }
): ResolvedMode {
  if (mode === 'performance') return 'performance';
  if (mode === 'yamazumi') return 'yamazumi';
  if (opts?.standardIChartMetric === 'capability') return 'capability';
  return 'standard';
}

const strategies: Record<ResolvedMode, AnalysisModeStrategy> = {
  standard: {
    chartSlots: { slot1: 'ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'stats' },
    kpiComponent: 'standard',
    reportTitle: 'Variation Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: hasSpecs => (hasSpecs ? 'Cpk' : 'σ'),
    aiChartInsightKeys: ['ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
  },
  capability: {
    chartSlots: { slot1: 'capability-ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'stats' },
    kpiComponent: 'capability',
    reportTitle: 'Capability Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'Mean Cpk',
    aiChartInsightKeys: ['capability-ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
  },
  performance: {
    chartSlots: {
      slot1: 'cpk-scatter',
      slot2: 'distribution-boxplot',
      slot3: 'cpk-pareto',
      slot4: 'histogram',
    },
    kpiComponent: 'performance',
    reportTitle: 'Performance Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'Worst Channel Cpk',
    aiChartInsightKeys: ['cpk-scatter', 'distribution-boxplot', 'cpk-pareto'],
    aiToolSet: 'performance',
  },
  yamazumi: {
    chartSlots: {
      slot1: 'yamazumi-chart',
      slot2: 'yamazumi-ichart',
      slot3: 'yamazumi-pareto',
      slot4: 'yamazumi-summary',
    },
    kpiComponent: 'yamazumi',
    reportTitle: 'Time Study Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'VA Ratio',
    formatMetricValue: (v: number) => `${Math.round(v * 100)}%`,
    aiChartInsightKeys: ['yamazumi', 'yamazumi-ichart', 'yamazumi-pareto'],
    aiToolSet: 'yamazumi',
  },
};

export function getStrategy(mode: ResolvedMode): AnalysisModeStrategy {
  return strategies[mode];
}
