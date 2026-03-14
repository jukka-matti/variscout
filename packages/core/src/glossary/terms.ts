/**
 * Glossary terms for the systemic help tooltip system
 * Contains definitions for statistical and quality terms used across VariScout
 */

import type { GlossaryTerm } from './types';

export const glossaryTerms: GlossaryTerm[] = [
  // Control Limits
  {
    id: 'ucl',
    label: 'UCL',
    definition:
      'Upper Control Limit. Statistical boundary showing process behavior, set at mean + 3 standard deviations.',
    description:
      'UCL represents the upper natural boundary of process variation. Points above UCL indicate special cause variation requiring investigation. Different from USL which is a customer requirement.',
    category: 'control-limits',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['lcl', 'mean', 'stdDev'],
  },
  {
    id: 'lcl',
    label: 'LCL',
    definition:
      'Lower Control Limit. Statistical boundary showing process behavior, set at mean - 3 standard deviations.',
    description:
      'LCL represents the lower natural boundary of process variation. Points below LCL indicate special cause variation requiring investigation. Different from LSL which is a customer requirement.',
    category: 'control-limits',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['ucl', 'mean', 'stdDev'],
  },
  {
    id: 'usl',
    label: 'USL',
    definition:
      'Upper Specification Limit. Customer-defined maximum acceptable value for the product.',
    description:
      "USL is the customer's voice - the maximum value they will accept. Products above USL are out of spec and rejected. Set by customer requirements, not process data.",
    category: 'control-limits',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['lsl', 'target', 'cp', 'cpk'],
  },
  {
    id: 'lsl',
    label: 'LSL',
    definition:
      'Lower Specification Limit. Customer-defined minimum acceptable value for the product.',
    description:
      "LSL is the customer's voice - the minimum value they will accept. Products below LSL are out of spec and rejected. Set by customer requirements, not process data.",
    category: 'control-limits',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['usl', 'target', 'cp', 'cpk'],
  },
  {
    id: 'target',
    label: 'Target',
    definition:
      'The ideal or nominal value for the measurement, typically the midpoint between LSL and USL.',
    description:
      'Target represents the ideal value customers want. Process centering is assessed by comparing the mean to the target.',
    category: 'control-limits',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['usl', 'lsl', 'cpk'],
  },

  // Capability Metrics
  {
    id: 'cp',
    label: 'Cp',
    definition: 'Process Capability. Measures how well your process fits within spec limits.',
    description:
      'Cp compares the width of specification limits to 6\u03c3_within of the process. Cp = (USL - LSL) / (6\u03c3_within), where \u03c3_within is estimated from the moving range (MR\u0304/d2). This captures short-term, inherent variation. Higher values mean the process has room to spare within specs. Does not account for centering.',
    category: 'capability',
    learnMorePath: '/tools/capability',
    relatedTerms: ['cpk', 'usl', 'lsl', 'stdDev'],
  },
  {
    id: 'cpk',
    label: 'Cpk',
    definition:
      'Process Capability Index. Like Cp, but accounts for how well centered the process is.',
    description:
      'Cpk considers both spread and centering using \u03c3_within (estimated from the moving range). Cpk = min(CPU, CPL) where CPU = (USL - mean) / (3\u03c3_within) and CPL = (mean - LSL) / (3\u03c3_within). A Cpk much lower than Cp indicates the process mean is shifted toward one spec limit.',
    category: 'capability',
    learnMorePath: '/tools/capability',
    relatedTerms: ['cp', 'usl', 'lsl', 'mean'],
  },
  {
    id: 'passRate',
    label: 'Pass Rate',
    definition: 'Percentage of measurements within specification limits (between LSL and USL).',
    description:
      'Pass Rate shows what proportion of products meet customer requirements. 100% means all products are in spec. Also known as yield or conformance rate.',
    category: 'capability',
    learnMorePath: '/tools/capability',
    relatedTerms: ['usl', 'lsl', 'rejected'],
  },
  {
    id: 'rejected',
    label: 'Rejected',
    definition: 'Percentage of measurements outside specification limits (above USL or below LSL).',
    description:
      'Rejected rate is the inverse of pass rate. These are products that fail to meet customer requirements and must be scrapped, reworked, or conceded.',
    category: 'capability',
    learnMorePath: '/tools/capability',
    relatedTerms: ['passRate', 'usl', 'lsl'],
  },

  // Basic Statistics
  {
    id: 'mean',
    label: 'Mean',
    definition: 'Average value. Sum of all measurements divided by the count.',
    description:
      'The arithmetic mean represents the center of the data distribution. Compare to target to assess centering. Also called X-bar in control charts.',
    category: 'statistics',
    learnMorePath: '/tools/i-chart',
    relatedTerms: ['stdDev', 'ucl', 'lcl'],
  },
  {
    id: 'stdDev',
    label: 'Std Dev',
    definition:
      'Standard Deviation. Measures the spread or variability of measurements around the mean.',
    description:
      'Standard deviation (\u03c3) quantifies how much values vary from the average. Smaller values indicate more consistent processes. Used to calculate control limits and capability indices.',
    category: 'statistics',
    learnMorePath: '/tools/i-chart',
    relatedTerms: ['mean', 'cp', 'ucl', 'lcl'],
  },

  // ANOVA Statistics
  {
    id: 'fStatistic',
    label: 'F-Statistic',
    definition: 'Measures the ratio of between-group variance to within-group variance in ANOVA.',
    description:
      'F-statistic compares variation between groups to variation within groups. Higher F values indicate larger differences between group means relative to variation within groups.',
    category: 'statistics',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['pValue', 'etaSquared'],
  },
  {
    id: 'pValue',
    label: 'p-value',
    definition:
      'Probability the observed difference happened by chance. p < 0.05 = statistically significant.',
    description:
      'The p-value tests the null hypothesis that all group means are equal. Small p-values (typically < 0.05) provide evidence that at least one group mean differs from the others.',
    category: 'statistics',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['fStatistic', 'etaSquared'],
  },
  {
    id: 'etaSquared',
    label: '\u03b7\u00b2',
    definition:
      'Effect size showing what proportion of variation is explained by the factor. Benchmarks (0.06 small, 0.14 large) are from behavioral science — in process data, focus on relative ranking rather than absolute thresholds.',
    description:
      'Eta-squared (\u03b7\u00b2) represents the proportion of total variance explained by the grouping factor. Unlike p-value, it indicates practical significance — how much the factor matters. Note: \u03b7\u00b2 is a positively biased estimator that tends to overstate the true effect for small samples. VariScout uses \u03b7\u00b2 for relative ranking, not absolute estimation.',
    category: 'statistics',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['fStatistic', 'pValue'],
  },

  // Methodology
  {
    id: 'specialCause',
    label: 'Special Cause',
    definition:
      'Variation due to unusual events or circumstances. Detected by points outside control limits or specific patterns (Nelson rules). Requires investigation.',
    description:
      'Special cause variation indicates something unusual happened in the process - a machine malfunction, operator error, material change, or other assignable cause. Unlike common cause variation (random, inherent), special causes are detectable, identifiable, and correctable. Red dots on control charts signal special cause - investigate and take action.',
    category: 'methodology',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['commonCause', 'ucl', 'lcl', 'nelsonRule2', 'inControl'],
  },
  {
    id: 'commonCause',
    label: 'Common Cause',
    definition:
      'Random variation inherent to a stable process. Points within control limits showing no special patterns. No action required.',
    description:
      'Common cause variation is the natural, random variation present in all stable processes. It results from many small, uncontrollable factors acting together. Points within control limits (blue dots) represent common cause - the process is predictable. Attempting to "fix" common cause leads to tampering and increased variation. Only special causes require action.',
    category: 'methodology',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['specialCause', 'ucl', 'lcl', 'inControl'],
  },
  {
    id: 'nelsonRule2',
    label: 'Nelson Rule 2',
    definition:
      'Nine or more consecutive points falling on the same side of the centerline. Indicates a persistent shift in process level.',
    description:
      'Nelson Rule 2 detects special cause variation in the form of a sustained process shift. When 9+ consecutive points fall on one side of the mean, the process has moved to a new level - not just random fluctuation. This pattern signals something systematic changed: new material batch, adjusted settings, different operator technique, etc. Investigate the timeline to identify what changed.',
    category: 'methodology',
    learnMorePath: '/tools/i-chart',
    relatedTerms: ['specialCause', 'mean', 'ucl', 'lcl'],
  },
  {
    id: 'inControl',
    label: 'In-Control',
    definition:
      'A stable process where all points fall within control limits and show random variation. Only common cause variation present.',
    description:
      'An in-control process is stable and predictable - all points within control limits (UCL/LCL), no special patterns detected. This means only common cause (random, inherent) variation is present. Important: In-control does NOT mean capable. A process can be in-control (stable) but still produce defects if control limits are wider than spec limits.',
    category: 'methodology',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['specialCause', 'commonCause', 'ucl', 'lcl'],
  },
  {
    id: 'stagedAnalysis',
    label: 'Staged Analysis',
    definition:
      'Analysis approach that calculates separate control limits for distinct process phases (e.g., before/after improvement).',
    description:
      'Staged analysis reveals improvements that combined data hides. Each stage gets its own mean and control limits calculated independently, letting you see shifts in both center and variation.',
    category: 'methodology',
    learnMorePath: '/learn/staged-analysis',
    relatedTerms: ['ucl', 'lcl', 'mean', 'stdDev'],
  },
  {
    id: 'totalSSContribution',
    label: 'Total SS Contribution',
    definition:
      "A category's share of total sum of squares. A VariScout-specific extension of standard ANOVA that captures both mean shift AND spread (within-group variation).",
    description:
      "Unlike standard between-group SS which only measures mean differences, Total SS contribution is a VariScout extension that shows a category's full impact on variation. A category with mean near overall mean but high spread now shows non-zero impact. Sum of all category contributions equals 100%.",
    category: 'methodology',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['etaSquared', 'stdDev'],
  },
  {
    id: 'characteristicType',
    label: 'Characteristic Type',
    definition:
      'Quality characteristic classification: nominal (target ideal), smaller-is-better, or larger-is-better.',
    description:
      'Determines how specification limits are interpreted. Nominal: both USL and LSL exist, target is ideal. Smaller-is-better: only USL exists, zero is ideal (e.g., defects). Larger-is-better: only LSL exists, higher is always better (e.g., yield). Automatically inferred from specs but can be overridden.',
    category: 'methodology',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['usl', 'lsl', 'target'],
  },
  {
    id: 'probabilityPlot',
    label: 'Probability Plot',
    definition:
      'Normal probability plot showing data points against expected normal percentiles. Points on the line indicate normal distribution.',
    description:
      "A graphical method for assessing whether data follows a normal distribution. Uses Benard's Median Rank formula to calculate expected percentiles. If data is normal, points fall close to the fitted line. Deviations reveal skewness, outliers, or multiple populations.",
    category: 'methodology',
    learnMorePath: '/tools/probability-plot',
    relatedTerms: ['mean', 'stdDev', 'cp', 'cpk'],
  },

  // Variation Decomposition
  {
    id: 'sumOfSquares',
    label: 'Sum of Squares',
    definition:
      'Measure of total variation: the sum of squared deviations from the mean. The foundation of ANOVA.',
    description:
      'ANOVA decomposes SS_Total into SS_Between (mean differences between groups) and SS_Within (spread within groups). This identity always holds exactly: SS_Total = SS_Between + SS_Within. At the category level, each category contributes both between-group and within-group variation to the total.',
    category: 'statistics',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['etaSquared', 'totalSSContribution', 'betweenWithinVariation'],
  },
  {
    id: 'betweenWithinVariation',
    label: 'Between/Within Variation',
    definition:
      'The two sources of variation in grouped data. Between: group mean differences. Within: spread inside each group.',
    description:
      "Between-group variation measures whether groups differ (do the means shift?). Within-group variation measures how consistent each group is internally (how much spread?). ANOVA's F-statistic is the ratio of between to within. A high F means group differences are large relative to internal spread.",
    category: 'statistics',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['etaSquared', 'totalSSContribution', 'sumOfSquares', 'fStatistic'],
  },

  // Charts
  {
    id: 'violinPlot',
    label: 'Violin Plot',
    definition:
      'Distribution visualization showing kernel density estimation alongside boxplot summary statistics.',
    description:
      'Reveals distribution shape, bimodality, and skewness. Toggle on boxplot charts to see the full density curve behind standard box-and-whisker elements.',
    category: 'charts',
    relatedTerms: ['boxplot', 'stdDev'],
  },

  // Investigation (5-status workflow + AI grounding)
  {
    id: 'controlVsSpec',
    label: 'Control vs Spec Limits',
    definition:
      'Control limits reflect process behavior (voice of the process); specification limits reflect customer requirements (voice of the customer).',
    description:
      'Control limits (UCL/LCL) are calculated from data and show what the process IS doing. Specification limits (USL/LSL) are set by the customer and show what the process SHOULD do. A process can be in-control but out-of-spec, or in-spec but out-of-control.',
    category: 'methodology',
    learnMorePath: '/learn/two-voices',
    relatedTerms: ['ucl', 'lcl', 'usl', 'lsl'],
  },
  {
    id: 'naturalVariation',
    label: 'Natural Variation',
    definition:
      'The inherent variation in a stable process, determined by common causes only. Represented by the spread between control limits.',
    category: 'methodology',
    relatedTerms: ['commonCause', 'ucl', 'lcl', 'stdDev'],
  },
  {
    id: 'processStability',
    label: 'Process Stability',
    definition:
      'Whether a process is in statistical control — all points within control limits with no special patterns detected.',
    description:
      'A stable process is predictable: future output will fall within the control limits. Stability is a prerequisite for meaningful capability analysis. An unstable process may produce good parts today but fail tomorrow.',
    category: 'methodology',
    relatedTerms: ['inControl', 'specialCause', 'commonCause'],
  },
  {
    id: 'outOfControl',
    label: 'Out of Control',
    definition:
      'A data point beyond control limits or exhibiting a Nelson rule pattern, signaling special cause variation.',
    description:
      'Out-of-control signals (red points on the I-Chart) mean something unusual happened. This requires investigation — identify the assignable cause and take corrective action to restore stability.',
    category: 'methodology',
    relatedTerms: ['specialCause', 'nelsonRule2', 'inControl'],
  },
  {
    id: 'rationalSubgrouping',
    label: 'Rational Subgrouping',
    definition:
      'Grouping data by meaningful time periods or sources so within-group variation represents only common cause.',
    description:
      'The foundation of effective stratification. Group data so that variation within each group is homogeneous (common cause only), and differences between groups can reveal special causes. Poor subgrouping masks real signals.',
    category: 'methodology',
    relatedTerms: ['stratification', 'commonCause', 'specialCause'],
  },
  {
    id: 'stratification',
    label: 'Stratification',
    definition:
      'Separating data by factors (machine, shift, operator) to reveal hidden sources of variation.',
    description:
      'Stratification is the core analytical technique in VariScout. By drilling down through factors, you decompose total variation into contributions from each source. The variation bar shows cumulative progress toward explaining total variation.',
    category: 'methodology',
    relatedTerms: ['rationalSubgrouping', 'etaSquared', 'totalSSContribution'],
  },
  {
    id: 'rootCauseAnalysis',
    label: 'Root Cause Analysis',
    definition:
      'Systematic method to identify the fundamental reason a defect or variation occurred, not just its symptoms.',
    description:
      'Root cause analysis goes beyond the immediate trigger to find the underlying system failure. In VariScout, the drill-down workflow and findings log support this process by capturing observations, suspected causes, and corrective actions.',
    category: 'investigation',
    relatedTerms: ['specialCause', 'finding', 'correctiveAction'],
  },
  {
    id: 'correctiveAction',
    label: 'Corrective Action',
    definition:
      'Action taken to eliminate the cause of a detected nonconformity or other undesirable situation.',
    description:
      'Corrective actions address existing problems. They should target the root cause, not just the symptom. In the 5-status workflow, corrective actions are tracked as action items on findings.',
    category: 'investigation',
    relatedTerms: ['preventiveAction', 'rootCauseAnalysis', 'actionItem'],
  },
  {
    id: 'preventiveAction',
    label: 'Preventive Action',
    definition:
      'Action taken to eliminate the cause of a potential nonconformity or other undesirable potential situation.',
    description:
      'Preventive actions address problems before they occur. They emerge from trend analysis and findings review — seeing a process drifting toward a limit before it actually fails.',
    category: 'investigation',
    relatedTerms: ['correctiveAction', 'rootCauseAnalysis'],
  },
  {
    id: 'finding',
    label: 'Finding',
    definition:
      'An analyst observation bookmarked for investigation — captures filter state, statistics, and context at a specific point in the analysis.',
    description:
      'Findings are the building blocks of investigation in VariScout. Each finding snapshots the dashboard state (filters, stats, variation context) so the analyst can return to it later. Findings progress through statuses: observed → investigating → analyzed → improving → resolved.',
    category: 'investigation',
    relatedTerms: ['investigationStatus', 'actionItem', 'keyDriver'],
  },
  {
    id: 'investigationStatus',
    label: 'Investigation Status',
    definition:
      'Lifecycle stage of a finding: observed, investigating, analyzed, improving, or resolved.',
    description:
      'The 5-status workflow tracks a finding from initial observation through root cause analysis to verified resolution. Observed: spotted but not yet explored. Investigating: actively being analyzed. Analyzed: root cause identified with suspected cause and tag. Improving: corrective actions in progress. Resolved: actions complete and effectiveness verified.',
    category: 'investigation',
    relatedTerms: ['finding', 'actionItem', 'correctiveAction'],
  },
  {
    id: 'keyDriver',
    label: 'Key Driver',
    definition:
      'A factor identified as a significant source of variation, worthy of corrective action.',
    description:
      'Key drivers are the factors that matter most. In VariScout, a finding tagged as "key-driver" indicates the analyst has confirmed this factor significantly contributes to process variation and should be addressed.',
    category: 'investigation',
    relatedTerms: ['finding', 'totalSSContribution', 'etaSquared'],
  },
  {
    id: 'actionItem',
    label: 'Action Item',
    definition:
      'A specific corrective or preventive task assigned to address a finding, with optional assignee and due date.',
    description:
      'Action items track the work needed to resolve a finding. Each item has a completion status. When the first action is added to an analyzed finding, it automatically transitions to "improving" status.',
    category: 'investigation',
    relatedTerms: ['finding', 'correctiveAction', 'investigationStatus'],
  },
  {
    id: 'findingOutcome',
    label: 'Finding Outcome',
    definition:
      'Assessment of whether corrective actions were effective: yes, no, or partially effective.',
    description:
      'The outcome closes the investigation loop. Compare Cpk before and after to quantify improvement. When all actions are complete and an outcome is recorded, the finding transitions to "resolved" status.',
    category: 'investigation',
    relatedTerms: ['finding', 'actionItem', 'investigationStatus', 'cpk'],
  },
  {
    id: 'processContext',
    label: 'Process Context',
    definition:
      'Background information about the manufacturing process (product, equipment, materials) that helps AI generate relevant analysis narratives.',
    description:
      'Process context grounds AI assistance in domain knowledge. Describing what you are measuring, what equipment produces it, and what factors matter helps the AI narrator explain statistical findings in terms meaningful to your specific process.',
    category: 'investigation',
    relatedTerms: ['finding', 'stratification'],
  },
];

/**
 * Lookup map for O(1) term access by ID
 */
export const glossaryMap = new Map<string, GlossaryTerm>(
  glossaryTerms.map(term => [term.id, term])
);

/**
 * Get a glossary term by ID
 */
export function getTerm(id: string): GlossaryTerm | undefined {
  return glossaryMap.get(id);
}

/**
 * Get all terms in a category
 */
export function getTermsByCategory(category: GlossaryTerm['category']): GlossaryTerm[] {
  return glossaryTerms.filter(term => term.category === category);
}

/**
 * Check if a term exists
 */
export function hasTerm(id: string): boolean {
  return glossaryMap.has(id);
}
