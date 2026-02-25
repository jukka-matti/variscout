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
    colorClass: 'text-lens-change',
  },
  capability: {
    name: 'Capability',
    description: 'Metrics that compare process performance to customer specifications',
    icon: '📊',
    color: '#22c55e',
    colorClass: 'text-lens-value',
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
    colorClass: 'text-lens-flow',
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
    relatedLearn: ['two-voices', 'four-lenses'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content: 'UCL = x̄ + 3σ_within  (equivalently: x̄ + 2.66 × MR̄, since 3/d2 ≈ 2.66)',
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
    relatedLearn: ['two-voices', 'four-lenses'],
    sections: [
      {
        type: 'formula',
        title: 'Formula',
        content: 'LCL = x̄ - 3σ_within  (equivalently: x̄ - 2.66 × MR̄, since 3/d2 ≈ 2.66)',
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
        content:
          'Cp = (USL - LSL) / 6σ_within, where σ_within = MR̄/d2 (estimated from the moving range)',
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
          'Cpk = min(CPU, CPL)\nwhere: CPU = (USL - Mean) / 3σ_within\n       CPL = (Mean - LSL) / 3σ_within\n\nσ_within = MR̄/d2 (estimated from the moving range)',
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
    relatedLearn: ['four-lenses', 'eda-philosophy'],
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
    relatedLearn: ['two-voices', 'four-lenses'],
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
    relatedLearn: ['four-lenses', 'eda-philosophy'],
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
    relatedTools: ['boxplot'],
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
    relatedLearn: ['four-lenses', 'eda-philosophy'],
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

  // Special Cause and Common Cause Variation
  specialCause: {
    seoTitle: 'Special Cause Variation | VariScout Glossary',
    seoDescription:
      'Special cause variation in Statistical Process Control (SPC): Learn how to detect unusual events through control charts and Nelson rules, and why investigation is required.',
    relatedTools: ['i-chart', 'boxplot'],
    relatedLearn: ['control-charts', 'two-voices', 'four-lenses'],
    sections: [
      {
        type: 'interpretation',
        title: 'Detection Methods',
        content: 'Special cause variation is detected through specific patterns on control charts:',
        items: [
          {
            value: 'Above UCL',
            label: 'Point Above Upper Control Limit',
            description: 'Process shifted unusually high',
          },
          {
            value: 'Below LCL',
            label: 'Point Below Lower Control Limit',
            description: 'Process shifted unusually low',
          },
          {
            value: 'Nelson Rule 2',
            label: '9+ Consecutive Points on One Side',
            description: 'Persistent process shift detected',
          },
        ],
      },
      {
        type: 'example',
        title: 'Real-World Example',
        content:
          'A coffee roasting process shows 12 consecutive batches below the mean weight. Nelson Rule 2 triggers (special cause detected). Investigation reveals a new material supplier changed bean density. Corrective action: Adjust roasting time for new supplier.',
      },
    ],
    examples: [
      'Machine malfunction causing erratic output',
      'Operator error during shift change',
      'New material batch with different properties',
      'Environmental change (temperature spike)',
      'Measurement system drift',
    ],
    practicalTip:
      'When you see red dots (special cause), investigate the timeline: What was different when these points occurred? Look for changes in materials, methods, machines, measurements, or environment (5Ms).',
  },

  commonCause: {
    seoTitle: 'Common Cause Variation | VariScout Glossary',
    seoDescription:
      'Common cause variation in SPC: Understanding natural random variation inherent to stable processes, and why attempting to "fix" it leads to tampering.',
    relatedTools: ['i-chart', 'capability'],
    relatedLearn: ['control-charts', 'two-voices'],
    sections: [
      {
        type: 'interpretation',
        title: 'Characteristics',
        content: 'Common cause variation has these properties:',
        items: [
          {
            value: 'Random',
            label: 'Random Fluctuation',
            description: 'No discernible pattern, points scattered within limits',
          },
          {
            value: 'Stable',
            label: 'Predictable Range',
            description: 'Process is stable - future performance is predictable',
          },
          {
            value: 'Many Factors',
            label: 'Multiple Small Sources',
            description: 'Result of many small, uncontrollable factors',
          },
        ],
      },
      {
        type: 'example',
        title: 'Real-World Example',
        content:
          'A packaging line shows all points within control limits (blue dots). Variation is due to: slight material thickness differences, ambient temperature fluctuations, normal machine vibration, operator technique variations. No single factor dominates - this is common cause. To reduce it, you must improve the entire system (better materials, climate control, machine stability).',
      },
    ],
    examples: [
      'Natural material property variation',
      'Normal machine vibration',
      'Ambient temperature fluctuations',
      'Measurement precision limits',
      'Operator technique variations (within training)',
    ],
    practicalTip:
      '⚠️ Do NOT react to individual blue dots (common cause). Reacting to random variation as if it were special cause is called "tampering" and increases variation. Instead, focus on improving the entire system.',
  },

  nelsonRule2: {
    seoTitle: 'Nelson Rule 2 | VariScout Glossary',
    seoDescription:
      'Nelson Rule 2 in control charts: Detecting process shifts through 9 consecutive points on the same side of the mean. Learn what this pattern signals and how to investigate.',
    relatedTools: ['i-chart'],
    relatedLearn: ['control-charts', 'two-voices'],
    sections: [
      {
        type: 'interpretation',
        title: 'Rule Definition',
        content: 'Nelson Rule 2 detects a persistent shift in the process level:',
        items: [
          {
            value: '9+ Points',
            label: 'Nine or More Consecutive',
            description: 'All on the same side of centerline (mean)',
          },
          {
            value: 'Above/Below',
            label: 'Direction Matters',
            description: '9 above OR 9 below mean (not a mix)',
          },
          {
            value: 'Systematic',
            label: 'Indicates Shift',
            description: 'Process moved to new level - not random',
          },
        ],
      },
      {
        type: 'diagram',
        title: 'Visual Pattern',
        content:
          'VariScout highlights Nelson Rule 2 sequences with connector lines and markers, making the pattern immediately visible rather than requiring manual counting.',
      },
      {
        type: 'example',
        title: 'Real-World Example',
        content:
          'A pharmaceutical tablet press shows 11 consecutive weights above mean (Nelson Rule 2). Investigation timeline reveals settings were adjusted after the 15th batch. Corrective action: Return to original settings and update change control procedures.',
      },
    ],
    examples: [
      'Machine settings adjusted mid-production',
      'New material batch with higher/lower average',
      'Process drift over time (wear, temperature)',
      'Operator change with different technique',
      'Measurement system bias shift',
    ],
    practicalTip:
      'When Nelson Rule 2 triggers, check your timeline: What changed when the sequence started? Look at batch numbers, shift changes, material lots, maintenance events, and environmental conditions.',
  },

  violinPlot: {
    seoTitle: 'Violin Plot | VaRiScout Glossary',
    seoDescription:
      'Violin plot overlays a kernel density estimate on a boxplot, revealing distribution shape, bimodality, and skewness that box-and-whisker summaries alone can miss.',
    relatedTools: ['boxplot'],
    relatedLearn: ['four-lenses', 'eda-philosophy'],
    sections: [
      {
        type: 'interpretation',
        title: 'Reading the Shape',
        content:
          'The violin width shows data density — wider sections mean more data points at that level.',
        items: [
          {
            value: 'Symmetric',
            label: 'Symmetric Shape',
            description:
              'Data is evenly distributed around the median — typical of a stable, single-source process',
          },
          {
            value: 'Bimodal',
            label: 'Two Bumps',
            description:
              'Two distinct peaks — likely two populations mixed together (e.g., day vs night shift)',
          },
          {
            value: 'Skewed',
            label: 'Asymmetric Shape',
            description:
              'Data concentrated on one side — process may have a natural bound or constraint',
          },
        ],
      },
    ],
    practicalTip:
      'Toggle violin mode when a boxplot looks normal but you suspect hidden subgroups. Two bumps in the violin reveal mixed populations that the box summary hides.',
  },

  inControl: {
    seoTitle: 'In-Control Process | VariScout Glossary',
    seoDescription:
      'In-control process in SPC: A stable, predictable process with only common cause variation. Learn the difference between in-control and capable.',
    relatedTools: ['i-chart', 'capability'],
    relatedLearn: ['control-charts', 'two-voices', 'four-lenses'],
    sections: [
      {
        type: 'interpretation',
        title: 'In-Control Criteria',
        content: 'A process is in-control when:',
        items: [
          {
            value: 'Within Limits',
            label: 'All Points Inside UCL/LCL',
            description: 'No points outside control limits',
          },
          {
            value: 'No Patterns',
            label: 'Random Variation Only',
            description: 'No Nelson rules triggered (no trends, shifts, cycles)',
          },
          {
            value: 'Predictable',
            label: 'Stable Performance',
            description: 'Future output will fall within same limits',
          },
        ],
      },
      {
        type: 'example',
        title: 'In-Control ≠ Capable',
        content:
          'CRITICAL DISTINCTION: A process can be in-control (stable, predictable) but NOT capable (still producing defects). Example: Bolt diameter is stable with UCL=10.5mm, LCL=9.5mm (in-control). But customer spec is USL=10.2mm, LSL=9.8mm. The process is predictably making defects - it is in-control but not capable.',
      },
    ],
    examples: [
      'Packaging line running steadily with consistent output',
      'Stable but off-target (needs centering adjustment)',
      'In-control with high variation (needs variation reduction)',
      'Capable AND in-control (ideal state)',
    ],
    practicalTip:
      'First achieve in-control (eliminate special cause), THEN assess capability (compare control limits to spec limits). You cannot accurately calculate capability indices (Cp/Cpk) for an out-of-control process.',
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
