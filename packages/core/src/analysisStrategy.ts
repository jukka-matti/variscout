import type { AnalysisMode } from './types';

export type ResolvedMode = 'standard' | 'capability' | 'performance' | 'yamazumi';

export interface QuestionStrategy {
  generator: 'bestSubsets' | 'bestSubsetsWithSpecs' | 'wasteComposition' | 'channelRanking';
  evidenceMetric: 'rSquaredAdj' | 'cpkImpact' | 'wasteContribution' | 'channelCpk';
  evidenceLabel: string;
  validationMethod: 'anova' | 'anovaWithSpecs' | 'taktCompliance';
  questionFocus: string;
}

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
  questionStrategy: QuestionStrategy;
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

/** Immutable strategy registry — one entry per resolved analysis mode. */
const strategies: Readonly<Record<ResolvedMode, AnalysisModeStrategy>> = {
  standard: {
    chartSlots: { slot1: 'ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'stats' },
    kpiComponent: 'standard',
    reportTitle: 'Variation Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: hasSpecs => (hasSpecs ? 'Cpk' : 'σ'),
    aiChartInsightKeys: ['ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
    questionStrategy: {
      generator: 'bestSubsets',
      evidenceMetric: 'rSquaredAdj',
      evidenceLabel: 'R²adj',
      validationMethod: 'anova',
      questionFocus: 'Which factor explains most variation?',
    },
  },
  capability: {
    chartSlots: { slot1: 'capability-ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'stats' },
    kpiComponent: 'capability',
    reportTitle: 'Capability Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'Mean Cpk',
    aiChartInsightKeys: ['capability-ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
    questionStrategy: {
      generator: 'bestSubsetsWithSpecs',
      evidenceMetric: 'cpkImpact',
      evidenceLabel: 'Cpk impact',
      validationMethod: 'anovaWithSpecs',
      questionFocus: 'Which factor most affects Cpk?',
    },
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
    questionStrategy: {
      generator: 'channelRanking',
      evidenceMetric: 'channelCpk',
      evidenceLabel: 'Channel Cpk',
      validationMethod: 'anova',
      questionFocus: 'Which channel performs worst?',
    },
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
    questionStrategy: {
      generator: 'wasteComposition',
      evidenceMetric: 'wasteContribution',
      evidenceLabel: 'Waste %',
      validationMethod: 'taktCompliance',
      questionFocus: 'Which step has the most waste?',
    },
  },
};

export function getStrategy(mode: ResolvedMode): AnalysisModeStrategy {
  return strategies[mode];
}
