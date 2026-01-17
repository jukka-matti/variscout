/**
 * Website glossary data - extends core glossary terms with website-specific content
 */

import type { GlossaryTerm, GlossaryCategory } from '@variscout/core';
import { glossaryTerms, getTerm } from '@variscout/core';

/**
 * Rich content section for glossary pages
 */
export interface GlossarySection {
  type: 'formula' | 'interpretation' | 'example' | 'diagram';
  title: string;
  content: string;
  items?: Array<{ value: string; label: string; description?: string }>;
}

/**
 * Extended glossary data for website pages
 */
export interface GlossaryPageData extends GlossaryTerm {
  seoTitle: string;
  seoDescription: string;
  sections?: GlossarySection[];
  relatedTools: string[];
  relatedLearn: string[];
  examples?: string[];
  practicalTip?: string;
}

/**
 * Category metadata for the glossary index page
 */
export interface CategoryMeta {
  name: string;
  description: string;
  icon: string;
  color: string;
  colorClass: string;
}

/**
 * Category metadata for index page display
 */
export const GLOSSARY_CATEGORIES: Record<GlossaryCategory, CategoryMeta> = {
  'control-limits': {
    name: 'Control Limits',
    description: 'Boundaries that define expected process behavior and customer requirements',
    icon: '🎯',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
  },
  capability: {
    name: 'Capability',
    description: 'Metrics that compare process performance to customer specifications',
    icon: '📊',
    color: '#22c55e',
    colorClass: 'text-green-500',
  },
  statistics: {
    name: 'Statistics',
    description: 'Fundamental measures and test results used in process analysis',
    icon: '📐',
    color: '#8b5cf6',
    colorClass: 'text-purple-500',
  },
  charts: {
    name: 'Charts',
    description: 'Visual tools for exploring and understanding process variation',
    icon: '📈',
    color: '#f97316',
    colorClass: 'text-orange-500',
  },
  methodology: {
    name: 'Methodology',
    description: 'Frameworks and approaches for systematic process improvement',
    icon: '🏛️',
    color: '#f59e0b',
    colorClass: 'text-amber-500',
  },
};

/**
 * Website-specific extensions for glossary terms
 * These extend the base terms from @variscout/core with rich content
 */
export const GLOSSARY_EXTENSIONS: Record<string, Partial<GlossaryPageData>> = {
  // Control Limits
  ucl: {
    seoTitle: 'UCL - Upper Control Limit | VaRiScout Glossary',
    seoDescription:
      'Upper Control Limit (UCL) is the statistical boundary showing the upper range of expected process behavior, calculated at mean + 3 standard deviations.',
    relatedTools: ['i-chart', 'capability'],
    relatedLearn: ['two-voices', 'four-pillars'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content: 'UCL = x̄ + 3σ  or  UCL = x̄ + 2.66 × MR̄ (for I-Charts)',
      },
      {
        type: 'interpretation',
        title: 'Interpretation',
        content: 'Points above UCL indicate special cause variation that requires investigation.',
        items: [
          { value: 'Inside', label: 'Common cause', description: 'Expected variation' },
          {
            value: 'Outside',
            label: 'Special cause',
            description: 'Something changed - investigate',
          },
        ],
      },
    ],
    practicalTip:
      "UCL is about what your process actually does, not what you want it to do. Don't confuse it with USL (specification limit).",
    examples: [
      'A coffee roaster with UCL at 94°C means temperatures above 94°C signal something changed.',
    ],
  },

  lcl: {
    seoTitle: 'LCL - Lower Control Limit | VaRiScout Glossary',
    seoDescription:
      'Lower Control Limit (LCL) is the statistical boundary showing the lower range of expected process behavior, calculated at mean - 3 standard deviations.',
    relatedTools: ['i-chart', 'capability'],
    relatedLearn: ['two-voices', 'four-pillars'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content: 'LCL = x̄ - 3σ  or  LCL = x̄ - 2.66 × MR̄ (for I-Charts)',
      },
    ],
    practicalTip:
      'LCL can be negative mathematically, but negative values often make no practical sense (e.g., negative weight). In such cases, treat LCL as 0.',
  },

  usl: {
    seoTitle: 'USL - Upper Specification Limit | VaRiScout Glossary',
    seoDescription:
      'Upper Specification Limit (USL) is the customer-defined maximum acceptable value for a product or process output.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    sections: [
      {
        type: 'interpretation',
        title: 'The Key Difference',
        content:
          'USL comes from the customer. UCL comes from your data. They answer different questions.',
        items: [
          {
            value: 'USL',
            label: 'Voice of Customer',
            description: 'What the customer will accept',
          },
          {
            value: 'UCL',
            label: 'Voice of Process',
            description: 'What your process naturally does',
          },
        ],
      },
    ],
    practicalTip:
      'If your UCL is above your USL, your process will produce defects - even when "in control."',
  },

  lsl: {
    seoTitle: 'LSL - Lower Specification Limit | VaRiScout Glossary',
    seoDescription:
      'Lower Specification Limit (LSL) is the customer-defined minimum acceptable value for a product or process output.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    practicalTip:
      'Products below LSL are defective regardless of process stability. LSL is a business boundary.',
  },

  target: {
    seoTitle: 'Target Value | VaRiScout Glossary',
    seoDescription:
      'The target value is the ideal or nominal value for a measurement, typically the midpoint between LSL and USL.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    practicalTip:
      'When comparing Cp and Cpk, the gap tells you how far from target your process is centered. Cpk = Cp means perfectly centered.',
  },

  // Capability Metrics
  cp: {
    seoTitle: 'Cp - Process Capability | VaRiScout Glossary',
    seoDescription:
      'Cp (Process Capability) measures how well your process spread fits within specification limits. A Cp of 1.33 or higher indicates good capability.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content: 'Cp = (USL - LSL) / 6σ',
      },
      {
        type: 'interpretation',
        title: 'Interpretation',
        content:
          'Cp measures potential capability - how capable your process could be if perfectly centered.',
        items: [
          { value: '≥ 1.67', label: 'Excellent', description: '6σ quality' },
          { value: '≥ 1.33', label: 'Good', description: 'Industry standard minimum' },
          { value: '≥ 1.00', label: 'Marginal', description: 'Process just fits' },
          { value: '< 1.00', label: 'Not Capable', description: 'Process wider than specs' },
        ],
      },
    ],
    practicalTip:
      'Cp ignores centering. A process can have Cp = 2.0 but still produce defects if shifted toward one spec limit. Always check Cpk too.',
  },

  cpk: {
    seoTitle: 'Cpk - Process Capability Index | VaRiScout Glossary',
    seoDescription:
      'Cpk (Process Capability Index) measures actual process capability, accounting for both spread and centering. Cpk ≥ 1.33 is the industry standard.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content:
          'Cpk = min(CPU, CPL)\nwhere: CPU = (USL - Mean) / 3σ\n       CPL = (Mean - LSL) / 3σ',
      },
      {
        type: 'interpretation',
        title: 'Cp vs Cpk',
        content: 'The gap between Cp and Cpk reveals centering problems.',
        items: [
          {
            value: 'Cpk ≈ Cp',
            label: 'Well centered',
            description: 'Process is balanced between specs',
          },
          {
            value: 'Cpk << Cp',
            label: 'Off-center',
            description: 'Process shifted toward one limit',
          },
        ],
      },
    ],
    practicalTip:
      'If Cpk is much lower than Cp, centering is your problem. If they are similar, variation is your problem.',
    examples: [
      'Coffee beans with Cpk = 1.45: Process is capable - beans consistently meet size requirements.',
      'Packaging seal with Cpk = 0.85: Process not capable - expect defects.',
    ],
  },

  passRate: {
    seoTitle: 'Pass Rate | VaRiScout Glossary',
    seoDescription:
      'Pass Rate is the percentage of measurements within specification limits, showing what proportion of products meet customer requirements.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    practicalTip:
      'Pass Rate is intuitive but can be misleading. A 99% pass rate sounds great, but with 1M units means 10,000 defects.',
  },

  rejected: {
    seoTitle: 'Rejected Rate | VaRiScout Glossary',
    seoDescription:
      'Rejected Rate is the percentage of measurements outside specification limits - products that fail customer requirements.',
    relatedTools: ['capability'],
    relatedLearn: ['two-voices'],
    practicalTip: 'Rejected = 100% - Pass Rate. Track both to understand the full picture.',
  },

  // Basic Statistics
  mean: {
    seoTitle: 'Mean (Average) | VaRiScout Glossary',
    seoDescription:
      'The mean is the arithmetic average - the sum of all measurements divided by the count. It represents the center of your data.',
    relatedTools: ['i-chart', 'capability', 'boxplot'],
    relatedLearn: ['four-pillars', 'eda-philosophy'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content: 'Mean (x̄) = Σx / n',
      },
    ],
    practicalTip:
      'Compare your mean to the target. The gap tells you about centering. Compare to UCL/LCL to understand natural variation.',
  },

  stdDev: {
    seoTitle: 'Standard Deviation | VaRiScout Glossary',
    seoDescription:
      'Standard Deviation (σ) measures the spread or variability of measurements around the mean. Smaller values indicate more consistent processes.',
    relatedTools: ['i-chart', 'capability'],
    relatedLearn: ['two-voices', 'four-pillars'],
    sections: [
      {
        type: 'interpretation',
        title: 'The 68-95-99.7 Rule',
        content: 'For normally distributed data:',
        items: [
          { value: '68%', label: 'Within ±1σ', description: 'About 2/3 of values' },
          { value: '95%', label: 'Within ±2σ', description: 'Almost all values' },
          { value: '99.7%', label: 'Within ±3σ', description: 'Nearly all values' },
        ],
      },
    ],
    practicalTip:
      'Reducing standard deviation improves capability. This is often harder than centering but more valuable.',
  },

  // ANOVA Statistics
  fStatistic: {
    seoTitle: 'F-Statistic | VaRiScout Glossary',
    seoDescription:
      'The F-Statistic measures the ratio of between-group variance to within-group variance in ANOVA, indicating whether groups differ significantly.',
    relatedTools: ['boxplot'],
    relatedLearn: ['four-pillars', 'eda-philosophy'],
    sections: [
      {
        type: 'interpretation',
        title: 'What F Tells You',
        content:
          'Higher F values indicate larger differences between groups relative to variation within groups.',
        items: [
          { value: 'F ≈ 1', label: 'No difference', description: 'Groups are similar' },
          { value: 'F >> 1', label: 'Groups differ', description: 'Factor matters' },
        ],
      },
    ],
    practicalTip:
      'F alone does not tell you how much the factor matters - use η² (eta-squared) for that.',
  },

  pValue: {
    seoTitle: 'p-value | VaRiScout Glossary',
    seoDescription:
      'The p-value is the probability that the observed difference happened by chance. p < 0.05 is typically considered statistically significant.',
    relatedTools: ['boxplot', 'regression'],
    relatedLearn: ['eda-philosophy'],
    sections: [
      {
        type: 'interpretation',
        title: 'Common Thresholds',
        content: 'Smaller p-values provide stronger evidence against the null hypothesis.',
        items: [
          { value: 'p < 0.001', label: 'Highly significant', description: 'Very strong evidence' },
          { value: 'p < 0.01', label: 'Significant', description: 'Strong evidence' },
          {
            value: 'p < 0.05',
            label: 'Significant',
            description: 'Sufficient evidence (common threshold)',
          },
          { value: 'p ≥ 0.05', label: 'Not significant', description: 'Insufficient evidence' },
        ],
      },
    ],
    practicalTip:
      'Statistical significance (p-value) is not the same as practical significance (effect size). A tiny difference can be statistically significant with enough data.',
  },

  etaSquared: {
    seoTitle: 'η² (Eta-Squared) - Effect Size | VaRiScout Glossary',
    seoDescription:
      'Eta-squared (η²) measures effect size - how much of the total variation is explained by the factor. Small < 0.06, medium 0.06-0.14, large > 0.14.',
    relatedTools: ['boxplot'],
    relatedLearn: ['four-pillars', 'eda-philosophy'],
    sections: [
      {
        type: 'interpretation',
        title: 'Effect Size Guidelines',
        content: 'η² tells you how much the factor matters in practical terms.',
        items: [
          {
            value: '> 0.14',
            label: 'Large effect',
            description: 'Factor explains significant variation',
          },
          {
            value: '0.06 - 0.14',
            label: 'Medium effect',
            description: 'Factor has moderate impact',
          },
          { value: '< 0.06', label: 'Small effect', description: 'Factor has limited impact' },
        ],
      },
    ],
    practicalTip:
      'η² is what matters for improvement. A factor with η² = 0.46 explains nearly half your variation - fix it first.',
  },

  // Regression Statistics
  rSquared: {
    seoTitle: 'R² (R-Squared) - Coefficient of Determination | VaRiScout Glossary',
    seoDescription:
      "R-squared shows how much of Y's variation is explained by X. Values closer to 1 indicate stronger relationships.",
    relatedTools: ['regression'],
    relatedLearn: ['eda-philosophy'],
    sections: [
      {
        type: 'interpretation',
        title: 'Interpretation Guidelines',
        content: 'R² ranges from 0 to 1.',
        items: [
          { value: '> 0.7', label: 'Strong', description: "X explains most of Y's variation" },
          { value: '0.4 - 0.7', label: 'Moderate', description: 'Useful relationship' },
          { value: '< 0.4', label: 'Weak', description: 'Other factors dominate' },
        ],
      },
    ],
    practicalTip:
      'R² of 0.5 means X explains 50% of Y - useful for EDA, but other factors explain the other 50%.',
  },

  slope: {
    seoTitle: 'Slope | VaRiScout Glossary',
    seoDescription:
      'The slope quantifies the rate of change - how much Y changes for each unit increase in X. Positive slope means Y increases with X.',
    relatedTools: ['regression'],
    relatedLearn: ['eda-philosophy'],
    practicalTip:
      'The slope tells you "how much" while R² tells you "how reliable." Both matter for decisions.',
  },

  intercept: {
    seoTitle: 'Intercept | VaRiScout Glossary',
    seoDescription:
      'The intercept is the predicted value of Y when X equals zero - where the regression line crosses the Y-axis.',
    relatedTools: ['regression'],
    relatedLearn: ['eda-philosophy'],
    practicalTip:
      'The intercept may not have practical meaning if X=0 is outside your data range. Focus on the slope for interpretation.',
  },

  // Gage R&R Statistics
  grr: {
    seoTitle: '%GRR - Gage Repeatability and Reproducibility | VaRiScout Glossary',
    seoDescription:
      'Gage R&R measures total measurement system variation as a percentage of study variation. <10% is excellent, 10-30% is acceptable, >30% needs improvement.',
    relatedTools: ['gage-rr'],
    relatedLearn: ['eda-philosophy'],
    sections: [
      {
        type: 'interpretation',
        title: 'Assessment Guidelines',
        content: '%GRR indicates measurement system capability.',
        items: [
          { value: '< 10%', label: 'Excellent', description: 'Measurement system is capable' },
          {
            value: '10-30%',
            label: 'Acceptable',
            description: 'May be acceptable depending on application',
          },
          {
            value: '> 30%',
            label: 'Unacceptable',
            description: 'Measurement system needs improvement',
          },
        ],
      },
    ],
    practicalTip:
      'Before analyzing process variation, verify %GRR < 30%. Otherwise, you might be chasing measurement noise.',
  },

  repeatability: {
    seoTitle: 'Repeatability (Equipment Variation) | VaRiScout Glossary',
    seoDescription:
      'Repeatability measures equipment variation - the variation when the same operator measures the same part multiple times.',
    relatedTools: ['gage-rr'],
    relatedLearn: ['eda-philosophy'],
    practicalTip:
      'High repeatability suggests equipment issues - calibration, maintenance, or replacement needed.',
  },

  reproducibility: {
    seoTitle: 'Reproducibility (Operator Variation) | VaRiScout Glossary',
    seoDescription:
      'Reproducibility measures operator variation - the variation when different operators measure the same parts.',
    relatedTools: ['gage-rr'],
    relatedLearn: ['eda-philosophy'],
    practicalTip:
      'High reproducibility suggests training issues - standardize procedures, train operators on technique.',
  },
};

/**
 * Get a glossary term with website extensions merged in
 */
export function getGlossaryPageData(termId: string): GlossaryPageData | undefined {
  const baseTerm = getTerm(termId);
  if (!baseTerm) return undefined;

  const extensions = GLOSSARY_EXTENSIONS[termId] || {};

  // Build default SEO values if not provided
  const defaultSeoTitle = `${baseTerm.label} | VaRiScout Glossary`;
  const defaultSeoDescription = baseTerm.definition;

  return {
    ...baseTerm,
    seoTitle: extensions.seoTitle || defaultSeoTitle,
    seoDescription: extensions.seoDescription || defaultSeoDescription,
    relatedTools: extensions.relatedTools || [],
    relatedLearn: extensions.relatedLearn || [],
    ...extensions,
  };
}

/**
 * Get all terms organized by category for the index page
 */
export function getGlossaryByCategory(): Record<GlossaryCategory, GlossaryTerm[]> {
  const result: Record<GlossaryCategory, GlossaryTerm[]> = {
    'control-limits': [],
    capability: [],
    statistics: [],
    charts: [],
    methodology: [],
  };

  for (const term of glossaryTerms) {
    result[term.category].push(term);
  }

  return result;
}

/**
 * Get all term IDs for static path generation
 */
export function getAllGlossaryTermIds(): string[] {
  return glossaryTerms.map(t => t.id);
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return glossaryTerms.filter(t => t.category === category);
}
