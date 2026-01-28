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
    definition:
      'Process Capability. Measures how well your process fits within spec limits. \u22651.33 is good.',
    description:
      'Cp compares the width of specification limits to 6 standard deviations of the process. Cp = (USL - LSL) / (6\u03c3). Higher values mean the process has room to spare within specs. Does not account for centering.',
    category: 'capability',
    learnMorePath: '/tools/capability',
    relatedTerms: ['cpk', 'usl', 'lsl', 'stdDev'],
  },
  {
    id: 'cpk',
    label: 'Cpk',
    definition:
      'Process Capability Index. Like Cp, but accounts for how well centered the process is. \u22651.33 is good.',
    description:
      'Cpk considers both spread and centering. It takes the minimum of CPU and CPL. A Cpk much lower than Cp indicates the process mean is shifted toward one spec limit.',
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
      'Effect size showing how much variation is explained by the factor. Small < 0.06, medium 0.06-0.14, large > 0.14.',
    description:
      'Eta-squared (\u03b7\u00b2) represents the proportion of total variance explained by the grouping factor. Unlike p-value, it indicates practical significance - how much the factor matters.',
    category: 'statistics',
    learnMorePath: '/tools/boxplot',
    relatedTerms: ['fStatistic', 'pValue'],
  },

  // Regression Statistics
  {
    id: 'rSquared',
    label: 'R\u00b2',
    definition:
      "Coefficient of determination. Shows how much of Y's variation is explained by X. Closer to 1 = stronger.",
    description:
      'R-squared ranges from 0 to 1. An R\u00b2 of 0.80 means 80% of the variation in Y can be explained by the relationship with X. The remaining 20% is due to other factors or random variation.',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['slope', 'pValue'],
  },
  {
    id: 'slope',
    label: 'Slope',
    definition: 'How much Y changes for each unit increase in X. Positive = Y increases with X.',
    description:
      'The slope quantifies the rate of change in the relationship. A slope of 2.5 means Y increases by 2.5 units for every 1 unit increase in X.',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['rSquared', 'intercept'],
  },
  {
    id: 'intercept',
    label: 'Intercept',
    definition: 'The predicted value of Y when X equals zero.',
    description:
      'The y-intercept is where the regression line crosses the Y-axis. May not have practical meaning if X=0 is outside the range of observed data.',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['slope', 'rSquared'],
  },

  // Gage R&R Statistics
  {
    id: 'grr',
    label: '%GRR',
    definition:
      'Total measurement system variation as percentage of study variation. <10% excellent, 10-30% marginal, >30% unacceptable.',
    description:
      'Gage R&R (Repeatability & Reproducibility) assesses measurement system capability. It combines variation from the equipment (repeatability) and operators (reproducibility).',
    category: 'statistics',
    learnMorePath: '/tools/gage-rr',
    relatedTerms: ['repeatability', 'reproducibility'],
  },
  {
    id: 'repeatability',
    label: 'Repeatability',
    definition:
      'Equipment variation. The variation when the same operator measures the same part multiple times.',
    description:
      'Repeatability (EV) measures precision of the measurement equipment. High repeatability variation suggests the gage needs calibration or replacement.',
    category: 'statistics',
    learnMorePath: '/tools/gage-rr',
    relatedTerms: ['grr', 'reproducibility'],
  },
  {
    id: 'reproducibility',
    label: 'Reproducibility',
    definition:
      'Operator variation. The variation when different operators measure the same parts.',
    description:
      'Reproducibility (AV) measures consistency between operators. High reproducibility variation suggests a need for operator training or clearer measurement procedures.',
    category: 'statistics',
    learnMorePath: '/tools/gage-rr',
    relatedTerms: ['grr', 'repeatability'],
  },

  // Multiple Regression Statistics
  {
    id: 'adjustedRSquared',
    label: 'Adjusted R²',
    definition:
      'A modified R² that adjusts for the number of predictors. Only increases if a new predictor improves the model more than expected by chance.',
    description:
      'Unlike regular R², adjusted R² penalizes adding predictors that do not meaningfully improve the model. Use it to compare models with different numbers of predictors. Formula: 1 - [(1 - R²)(n - 1) / (n - p - 1)].',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['rSquared', 'multipleRegression'],
  },
  {
    id: 'vif',
    label: 'VIF',
    definition:
      'Variance Inflation Factor. Measures how much a coefficient variance is inflated due to correlation with other predictors.',
    description:
      'VIF = 1 means no correlation with other predictors. VIF 1-5 is acceptable. VIF 5-10 indicates moderate multicollinearity. VIF > 10 suggests serious multicollinearity requiring action. High VIF makes coefficient estimates unreliable.',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['multipleRegression', 'adjustedRSquared'],
  },
  {
    id: 'interactionEffect',
    label: 'Interaction',
    definition:
      'When the effect of one predictor depends on the value of another predictor. The combined effect differs from the sum of individual effects.',
    description:
      'A significant interaction means you cannot interpret main effects in isolation. Example: Temperature effect might be 2.0 units/degree for Machine A but 3.5 for Machine B, indicating a Temp × Machine interaction.',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['multipleRegression', 'slope'],
  },
  {
    id: 'multipleRegression',
    label: 'Multiple Regression',
    definition:
      'Models the relationship between a response and two or more predictors. Predictors can be continuous (numeric) or categorical (groups).',
    description:
      'Each coefficient shows the effect of that predictor while holding others constant. Use adjusted R² to assess overall fit and VIF to check for multicollinearity. Example: Yield = 45 + 2.3×Temp + 5×Machine_B means each degree raises Yield by 2.3 units, and Machine B produces 5 units more than the reference.',
    category: 'statistics',
    learnMorePath: '/tools/regression',
    relatedTerms: ['adjustedRSquared', 'vif', 'interactionEffect', 'rSquared'],
  },

  // Methodology
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
