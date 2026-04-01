/**
 * Hindi glossary translations
 */

import type { GlossaryLocale } from '../types';

export const hiGlossary: GlossaryLocale = {
  locale: 'hi',
  terms: {
    // Control Limits
    ucl: {
      label: 'UCL',
      definition:
        'Upper Control Limit. Statistical boundary showing process behavior, set at mean + 3 standard deviations.',
      description:
        'UCL represents the upper natural boundary of process variation. Points above UCL indicate special cause variation requiring investigation.',
    },
    lcl: {
      label: 'LCL',
      definition:
        'Lower Control Limit. Statistical boundary showing process behavior, set at mean - 3 standard deviations.',
      description:
        'LCL represents the lower natural boundary of process variation. Points below LCL indicate special cause variation requiring investigation.',
    },
    usl: {
      label: 'USL',
      definition:
        'Upper Specification Limit. Customer-defined maximum acceptable value for the product.',
      description:
        "USL is the customer's voice - the maximum value they will accept. Products above USL are out of spec and rejected.",
    },
    lsl: {
      label: 'LSL',
      definition:
        'Lower Specification Limit. Customer-defined minimum acceptable value for the product.',
      description:
        "LSL is the customer's voice - the minimum value they will accept. Products below LSL are out of spec and rejected.",
    },
    target: {
      label: 'Target',
      definition:
        'The ideal or nominal value for the measurement, typically the midpoint between LSL and USL.',
      description:
        'Target represents the ideal value customers want. Process centering is assessed by comparing the mean to the target.',
    },

    // Capability Metrics
    cp: {
      label: 'Cp',
      definition:
        'Process Capability. Measures how well your process fits within spec limits. \u22651.33 is good.',
      description:
        'Cp compares the width of specification limits to 6 standard deviations of the process. Higher values mean more room to spare. Does not account for centering.',
    },
    cpk: {
      label: 'Cpk',
      definition:
        'Process Capability Index. Like Cp, but accounts for how well centered the process is. \u22651.33 is good.',
      description:
        'Cpk considers both spread and centering. A Cpk much lower than Cp indicates the process mean is shifted toward one spec limit.',
    },
    passRate: {
      label: 'Pass Rate',
      definition: 'Percentage of measurements within specification limits (between LSL and USL).',
      description: 'Pass Rate shows what proportion of products meet customer requirements.',
    },
    rejected: {
      label: 'Rejected',
      definition:
        'Percentage of measurements outside specification limits (above USL or below LSL).',
      description:
        'Rejected rate is the inverse of pass rate. These are products that fail to meet customer requirements.',
    },

    // Basic Statistics
    mean: {
      label: 'Mean',
      definition: 'Average value. Sum of all measurements divided by the count.',
      description:
        'The arithmetic mean represents the center of the data distribution. Compare to target to assess centering.',
    },
    stdDev: {
      label: 'Std Dev',
      definition:
        'Standard Deviation. Measures the spread or variability of measurements around the mean.',
      description:
        'Standard deviation (\u03c3) quantifies how much values vary from the average. Smaller values indicate more consistent processes.',
    },

    // ANOVA Statistics
    fStatistic: {
      label: 'F-Statistic',
      definition: 'Measures the ratio of between-group variance to within-group variance in ANOVA.',
      description:
        'F-statistic compares variation between groups to variation within groups. Higher F values indicate larger differences between group means.',
    },
    pValue: {
      label: 'p-value',
      definition:
        'Probability that the observed difference occurred by chance. p < 0.05 = statistically significant.',
      description:
        'The p-value tests the null hypothesis that all group means are equal. Small p-values (< 0.05) provide evidence that at least one group mean differs.',
    },
    etaSquared: {
      label: '\u03b7\u00b2',
      definition:
        'Effect size showing what proportion of variation is explained by the factor. Small < 0.06, medium 0.06\u20130.14, large > 0.14.',
      description:
        'Eta-squared (\u03b7\u00b2) represents the proportion of total variance explained by the grouping factor. Unlike p-value, it indicates practical importance.',
    },

    // Regression Statistics
    rSquared: {
      label: 'R\u00b2',
      definition:
        'Coefficient of determination. Shows how much Y variation is explained by X. Closer to 1 = stronger.',
      description:
        'R\u00b2 ranges from 0 to 1. An R\u00b2 of 0.80 means 80% of the variation in Y can be explained by the relationship with X.',
    },
    slope: {
      label: 'Slope',
      definition: 'How much Y changes per unit increase in X. Positive = Y rises with X.',
      description:
        'The slope quantifies the rate of change. A slope of 2.5 means Y increases by 2.5 units for every 1-unit increase in X.',
    },
    intercept: {
      label: 'Intercept',
      definition: 'The predicted value of Y when X equals zero.',
      description: 'The y-intercept is where the regression line crosses the Y-axis.',
    },
  },
};
