import type { AnalysisMode, SpecLookupContext } from './types';
import type { TimelineWindow } from './timeline';
import type { ParetoYMetric, ParetoYMetricId } from './pareto';
import { PARETO_Y_METRICS } from './pareto';

export type ResolvedMode = 'standard' | 'capability' | 'performance' | 'defect';

export interface QuestionStrategy {
  generator: 'bestSubsets' | 'bestSubsetsWithSpecs' | 'channelRanking' | 'defectAnalysis';
  evidenceMetric: 'rSquaredAdj' | 'cpkImpact' | 'channelCpk';
  evidenceLabel: string;
  validationMethod: 'anova' | 'anovaWithSpecs';
  questionFocus: string;
}

export type ChartSlotType =
  | 'ichart'
  | 'capability-ichart'
  | 'cpk-scatter'
  | 'boxplot'
  | 'distribution-boxplot'
  | 'pareto'
  | 'cpk-pareto'
  | 'stats'
  | 'histogram'
  | 'defect-summary';

/** Named alias for the four chart slots — used by RouterResult.chartVariants. */
export interface ChartSlots {
  slot1: ChartSlotType;
  slot2: ChartSlotType;
  slot3: ChartSlotType;
  slot4: ChartSlotType;
}

// ---------------------------------------------------------------------------
// Multi-level SCOUT V1 — dataRouter types
// ---------------------------------------------------------------------------

export type RouterScope = 'b0' | 'b1' | 'b2';
export type RouterPhase = 'investigation' | 'hub';

export interface RouterArgs {
  scope: RouterScope;
  phase: RouterPhase;
  window: TimelineWindow;
  context: SpecLookupContext;
}

export type RouterHook = 'useFilteredData' | 'useProductionLineGlanceData';

export interface RouterResult {
  hook: RouterHook;
  /** Names of transform functions to invoke (e.g. 'calculateNodeCapability'). */
  transforms?: ReadonlyArray<string>;
  /** Strategy-level chart-slot overrides; empty object means "use defaults". */
  chartVariants?: Partial<Record<keyof ChartSlots, ChartSlotType>>;
}

export interface AnalysisModeStrategy {
  chartSlots: ChartSlots;
  kpiComponent: ResolvedMode;
  reportTitle: string;
  reportSections: string[];
  metricLabel: (hasSpecs: boolean) => string;
  formatMetricValue?: (v: number) => string;
  aiChartInsightKeys: string[];
  aiToolSet: 'standard' | 'performance';
  questionStrategy: QuestionStrategy;
  /** V1 Multi-level SCOUT — optional for backward compat; all shipped strategies implement it. */
  dataRouter?: (args: RouterArgs) => RouterResult;
  /**
   * Ordered list of Pareto Y-axis metric options for this mode (D11).
   * The FIRST entry is the default Y for the mode; subsequent entries are
   * picker alternatives. When length === 1, the picker should be hidden in UI.
   */
  paretoYOptions: ParetoYMetric[];
}

/** Build an ordered `ParetoYMetric[]` from the registry by ID. Order is preserved. */
function paretoOptions(...ids: ParetoYMetricId[]): ParetoYMetric[] {
  return ids.map(id => PARETO_Y_METRICS[id]);
}

export function resolveMode(
  mode: AnalysisMode,
  opts?: { standardIChartMetric?: string }
): ResolvedMode {
  if (mode === 'defect') return 'defect';
  if (mode === 'performance') return 'performance';
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
    paretoYOptions: paretoOptions('count'),
    dataRouter: ({ phase }) => ({
      hook: phase === 'hub' ? 'useProductionLineGlanceData' : 'useFilteredData',
      transforms: phase === 'hub' ? ['calculateNodeCapability'] : [],
    }),
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
    paretoYOptions: paretoOptions('percent-out-of-spec', 'cpk-gap', 'mean-minus-target'),
    dataRouter: ({ phase }) => ({
      hook: phase === 'hub' ? 'useProductionLineGlanceData' : 'useFilteredData',
      transforms:
        phase === 'hub'
          ? ['calculateNodeCapability', 'computeOutputRate', 'computeBottleneck']
          : ['calculateStats'],
    }),
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
    paretoYOptions: paretoOptions('cpk', 'percent-out-of-spec'),
    dataRouter: ({ phase }) => ({
      hook: phase === 'hub' ? 'useProductionLineGlanceData' : 'useFilteredData',
      transforms:
        phase === 'hub'
          ? ['calculateChannelStats', 'calculateChannelPerformance']
          : ['calculateChannelStats'],
    }),
  },
  defect: {
    chartSlots: { slot1: 'ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'defect-summary' },
    kpiComponent: 'defect',
    reportTitle: 'Defect Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'Defect Rate',
    formatMetricValue: (v: number) => (Number.isFinite(v) ? `${Math.round(v * 10) / 10}` : '--'),
    aiChartInsightKeys: ['ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
    questionStrategy: {
      generator: 'defectAnalysis',
      evidenceMetric: 'rSquaredAdj',
      evidenceLabel: 'R²adj',
      validationMethod: 'anova',
      questionFocus: 'Which defect type dominates and which factor drives defect rate variation?',
    },
    paretoYOptions: paretoOptions('count', 'time', 'cost'),
    dataRouter: () => ({
      hook: 'useFilteredData',
      transforms: ['computeDefectRates'],
    }),
  },
};

export function getStrategy(mode: ResolvedMode): AnalysisModeStrategy {
  return strategies[mode];
}
