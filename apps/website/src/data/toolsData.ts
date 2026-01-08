// Tool page content and metadata
export interface ToolData {
  slug: string;
  name: string;
  pillar: 'CHANGE' | 'FLOW' | 'FAILURE' | 'VALUE' | null;
  color: string;
  colorClass: string;
  // Journey integration (only for pillar tools)
  journeySection?: number;
  journeyPrevTool?: string;
  journeyNextTool?: string;
  hero: {
    title: string;
    subtitle: string;
  };
  whenToUse: string[];
  dataRequirements: {
    minimum: { count: number; description: string };
    better: { count: number; description: string };
    sweet: { count: number; description: string };
  };
  howToRead: {
    description: string;
    elements: Array<{ name: string; description: string }>;
    quickCheck: string[];
  };
  patterns: Array<{
    name: string;
    description: string;
    action: string;
  }>;
  features: Array<{ name: string; description: string }>;
  sampleKey: string;
  nextTools: string[];
  relatedLearn: string[];
}

export const TOOLS: ToolData[] = [
  {
    slug: 'i-chart',
    name: 'I-Chart',
    pillar: 'CHANGE',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
    journeySection: 3,
    journeyPrevTool: 'capability',
    journeyNextTool: 'boxplot',
    hero: {
      title: 'See how your data changes over time',
      subtitle:
        'The I-Chart (Individuals Chart) reveals patterns, shifts, and special causes that averages hide.',
    },
    whenToUse: [
      'Monitoring a process over time',
      'Looking for shifts, trends, or cycles',
      'Detecting special causes of variation',
      'Before comparing factors (check stability first)',
    ],
    dataRequirements: {
      minimum: { count: 5, description: 'Enough to see your first pattern' },
      better: { count: 25, description: 'Control limits become meaningful' },
      sweet: { count: 30, description: 'Statistically "good enough"' },
    },
    howToRead: {
      description:
        'Points represent individual measurements over time. Control limits (UCL/LCL) show expected variation.',
      elements: [
        { name: 'Center Line', description: 'Average of all data points' },
        { name: 'UCL (Upper Control Limit)', description: 'Upper boundary of expected variation' },
        { name: 'LCL (Lower Control Limit)', description: 'Lower boundary of expected variation' },
        { name: 'Data Points', description: 'Individual measurements in time order' },
      ],
      quickCheck: [
        'Any points outside control limits?',
        'Any runs of 7+ points on one side?',
        'Any trends of 7+ points up or down?',
      ],
    },
    patterns: [
      {
        name: 'Point Outside Limits',
        description: 'A special cause occurred at this point',
        action: 'Investigate what happened at that time',
      },
      {
        name: 'Run of 7+',
        description: 'Process mean has shifted',
        action: 'Look for what changed before the run started',
      },
      {
        name: 'Trend of 7+',
        description: 'Process is drifting in one direction',
        action: 'Check for wear, degradation, or accumulation',
      },
      {
        name: 'Alternating Pattern',
        description: 'May indicate overcontrol or two streams',
        action: 'Check if someone is adjusting too frequently',
      },
    ],
    features: [
      { name: 'Auto-calculated limits', description: 'UCL and LCL computed from your data' },
      { name: 'Click to filter', description: 'Click any point to filter other charts' },
      { name: 'Two Voices', description: 'Show spec limits alongside control limits' },
      {
        name: 'Staged Analysis',
        description: 'Compare process phases with separate control limits per stage',
      },
    ],
    sampleKey: 'journey',
    nextTools: ['boxplot', 'capability'],
    relatedLearn: ['two-voices', 'four-pillars', 'staged-analysis'],
  },
  {
    slug: 'boxplot',
    name: 'Boxplot',
    pillar: 'FLOW',
    color: '#f97316',
    colorClass: 'text-orange-500',
    journeySection: 4,
    journeyPrevTool: 'i-chart',
    journeyNextTool: 'pareto',
    hero: {
      title: 'Compare groups to find where variation hides',
      subtitle: 'The Boxplot shows the spread and center of different groups side-by-side.',
    },
    whenToUse: [
      'Comparing machines, operators, or shifts',
      'Finding which factor has the most variation',
      'Before/after comparisons',
      'Investigating a factor identified in Pareto',
    ],
    dataRequirements: {
      minimum: { count: 5, description: 'Per group - enough to see spread' },
      better: { count: 10, description: 'Per group - quartiles meaningful' },
      sweet: { count: 20, description: 'Per group - robust comparison' },
    },
    howToRead: {
      description: 'Each box shows the distribution for one group. Compare heights and positions.',
      elements: [
        { name: 'Box Height', description: 'Interquartile range (middle 50% of data)' },
        { name: 'Middle Line', description: 'Median (middle value)' },
        { name: 'Whiskers', description: 'Range of typical values' },
        { name: 'Dots', description: 'Outliers beyond 1.5x IQR' },
      ],
      quickCheck: [
        'Which box is tallest? (most variation)',
        'Are the medians at different heights? (location shift)',
        'Any outliers that need investigation?',
      ],
    },
    patterns: [
      {
        name: 'One Tall Box',
        description: 'This factor has the most variation',
        action: 'Focus improvement efforts here first',
      },
      {
        name: 'Different Medians',
        description: 'Groups have different typical values',
        action: 'Investigate what makes them different',
      },
      {
        name: 'Many Outliers',
        description: 'Special causes are common in this group',
        action: 'Look for what these outliers have in common',
      },
    ],
    features: [
      { name: 'Click to filter', description: 'Click any box to filter the I-Chart' },
      { name: 'Factor selector', description: 'Switch between different grouping factors' },
      { name: 'Cross-chart sync', description: 'Stays in sync with Pareto factor selection' },
    ],
    sampleKey: 'bottleneck',
    nextTools: ['pareto', 'i-chart'],
    relatedLearn: ['four-pillars'],
  },
  {
    slug: 'pareto',
    name: 'Pareto Chart',
    pillar: 'FAILURE',
    color: '#ef4444',
    colorClass: 'text-red-500',
    journeySection: 5,
    journeyPrevTool: 'boxplot',
    journeyNextTool: undefined,
    hero: {
      title: 'Find where problems concentrate',
      subtitle: 'The Pareto Chart reveals which categories account for most of your issues.',
    },
    whenToUse: [
      'Prioritizing defect types or failure modes',
      '80/20 analysis',
      'Resource allocation decisions',
      'Communicating priorities to stakeholders',
    ],
    dataRequirements: {
      minimum: { count: 20, description: 'Enough for meaningful counts' },
      better: { count: 50, description: 'Stable percentages' },
      sweet: { count: 100, description: 'Reliable patterns' },
    },
    howToRead: {
      description: 'Bars show frequency. Cumulative line shows how quickly you reach 80%.',
      elements: [
        { name: 'Bars', description: 'Count or frequency of each category' },
        { name: 'Bar Order', description: 'Tallest to shortest (most to least)' },
        { name: 'Cumulative Line', description: 'Running total as percentage' },
        { name: '80% Line', description: 'Reference for the vital few' },
      ],
      quickCheck: [
        'Does the first bar dominate?',
        'How many categories to reach 80%?',
        'Are categories roughly equal? (no clear priority)',
      ],
    },
    patterns: [
      {
        name: 'Steep Cumulative',
        description: 'First category is the vital few - classic 80/20',
        action: 'Focus all resources on the first bar',
      },
      {
        name: 'Gradual Cumulative',
        description: 'No single dominant category',
        action: 'May need to look at different factor/grouping',
      },
      {
        name: 'Other is Largest',
        description: 'Categories need better definition',
        action: 'Break down "Other" into specific categories',
      },
    ],
    features: [
      { name: 'Click to drill down', description: 'Click any bar to filter all charts' },
      { name: 'Factor selector', description: 'Pareto by different grouping factors' },
      { name: 'Cumulative line', description: 'See the 80/20 at a glance' },
    ],
    sampleKey: 'packaging',
    nextTools: ['boxplot', 'i-chart'],
    relatedLearn: ['four-pillars'],
  },
  {
    slug: 'capability',
    name: 'Capability Analysis',
    pillar: 'VALUE',
    color: '#22c55e',
    colorClass: 'text-green-500',
    journeySection: 2,
    journeyPrevTool: undefined,
    journeyNextTool: 'i-chart',
    hero: {
      title: 'See if your process meets customer requirements',
      subtitle:
        'Capability analysis compares your process to specification limits and calculates Cp/Cpk.',
    },
    whenToUse: [
      'Comparing process to spec limits',
      'Calculating Cp and Cpk indices',
      'Before/after improvement verification',
      'Reporting process performance',
    ],
    dataRequirements: {
      minimum: { count: 25, description: 'Minimum for capability study' },
      better: { count: 50, description: 'More reliable indices' },
      sweet: { count: 100, description: 'Industry standard for Ppk' },
    },
    howToRead: {
      description: 'Histogram shows your data distribution. Spec limits show what customer needs.',
      elements: [
        { name: 'Histogram', description: 'Distribution of your data' },
        { name: 'USL/LSL', description: 'Customer specification limits' },
        { name: 'Cp', description: 'Process spread vs spec width (potential)' },
        { name: 'Cpk', description: 'Actual capability (accounts for centering)' },
      ],
      quickCheck: [
        'Is histogram within spec limits?',
        'Is it centered or shifted to one side?',
        'Cpk > 1.33 = capable, < 1.0 = not capable',
      ],
    },
    patterns: [
      {
        name: 'Cpk > 1.33',
        description: 'Process is capable - low defect rate',
        action: 'Maintain current process, monitor for change',
      },
      {
        name: 'Cp high, Cpk low',
        description: 'Process is capable but not centered',
        action: 'Adjust process to center the distribution',
      },
      {
        name: 'Cpk < 1.0',
        description: 'Process is not capable - expect defects',
        action: 'Reduce variation (find root cause)',
      },
    ],
    features: [
      { name: 'Auto Cp/Cpk', description: 'Calculated automatically from your data' },
      { name: 'Two Voices', description: 'See both process and customer voice' },
      { name: 'Pass/Fail colors', description: 'Green in-spec, red out-of-spec' },
    ],
    sampleKey: 'mango-export',
    nextTools: ['i-chart', 'boxplot'],
    relatedLearn: ['two-voices', 'four-pillars'],
  },
  {
    slug: 'regression',
    name: 'Regression Analysis',
    pillar: null,
    color: '#8b5cf6',
    colorClass: 'text-purple-500',
    hero: {
      title: 'Find the relationship between X and Y',
      subtitle: 'Regression reveals how one variable predicts or influences another.',
    },
    whenToUse: [
      'Understanding relationships between variables',
      'Predicting outcomes from inputs',
      'Optimizing process parameters',
      'Quantifying effect size (how much X affects Y)',
    ],
    dataRequirements: {
      minimum: { count: 10, description: 'Basic trend visible' },
      better: { count: 30, description: 'Reliable R-squared' },
      sweet: { count: 50, description: 'Robust predictions' },
    },
    howToRead: {
      description: 'Each point is an X-Y pair. The line shows the best fit relationship.',
      elements: [
        { name: 'Scatter Points', description: 'Individual X-Y observations' },
        { name: 'Trend Line', description: 'Best-fit linear relationship' },
        { name: 'R-squared', description: 'Percentage of Y explained by X' },
        { name: 'Slope', description: 'How much Y changes per unit of X' },
      ],
      quickCheck: [
        'Are points close to the line? (strong relationship)',
        'Is R-squared high? (> 0.7 is strong)',
        'Does the relationship make sense practically?',
      ],
    },
    patterns: [
      {
        name: 'High R-squared',
        description: 'X strongly predicts Y',
        action: 'Use this relationship for optimization',
      },
      {
        name: 'Low R-squared',
        description: 'Other factors are more important',
        action: 'Look for additional X variables',
      },
      {
        name: 'Curved Pattern',
        description: 'Relationship is not linear',
        action: 'May need polynomial or transformed model',
      },
    ],
    features: [
      { name: 'Auto trend line', description: 'Best-fit calculated automatically' },
      { name: 'R-squared display', description: 'See strength of relationship' },
      { name: 'Prediction', description: 'Estimate Y for new X values' },
    ],
    sampleKey: 'avocado',
    nextTools: ['i-chart', 'capability'],
    relatedLearn: ['eda-philosophy'],
  },
  {
    slug: 'gage-rr',
    name: 'Gage R&R',
    pillar: null,
    color: '#14b8a6',
    colorClass: 'text-teal-500',
    hero: {
      title: 'Is your measurement system trustworthy?',
      subtitle: 'Gage R&R separates measurement variation from process variation.',
    },
    whenToUse: [
      'Before any analysis (is the data valid?)',
      'Evaluating new measurement equipment',
      'Comparing operators measuring the same thing',
      'When you suspect measurement problems',
    ],
    dataRequirements: {
      minimum: { count: 30, description: '3 operators × 10 parts × 2-3 trials' },
      better: { count: 60, description: 'More parts or trials' },
      sweet: { count: 90, description: '3 operators × 10 parts × 3 trials' },
    },
    howToRead: {
      description: 'Charts show variation by part, operator, and their interaction.',
      elements: [
        { name: '%GRR', description: 'Measurement system variation as % of total' },
        { name: 'Repeatability', description: 'Same person, same part variation' },
        { name: 'Reproducibility', description: 'Between-operator variation' },
        { name: 'Part-to-Part', description: 'Actual process variation' },
      ],
      quickCheck: [
        '%GRR < 10% = excellent',
        '%GRR 10-30% = acceptable',
        '%GRR > 30% = needs improvement',
      ],
    },
    patterns: [
      {
        name: 'High Repeatability',
        description: 'Equipment has excessive variation',
        action: 'Calibrate or replace equipment',
      },
      {
        name: 'High Reproducibility',
        description: 'Operators measure differently',
        action: 'Standardize technique, train operators',
      },
      {
        name: 'Interaction',
        description: 'Some operators struggle with certain parts',
        action: 'Investigate specific combinations',
      },
    ],
    features: [
      { name: 'Variance components', description: 'See breakdown of all sources' },
      { name: 'Interaction plot', description: 'Operator × Part visualization' },
      { name: '%GRR calculation', description: 'Industry-standard metric' },
    ],
    sampleKey: 'journey',
    nextTools: ['i-chart', 'capability'],
    relatedLearn: ['eda-philosophy'],
  },
];

export function getToolBySlug(slug: string): ToolData | undefined {
  return TOOLS.find(t => t.slug === slug);
}

export function getAllToolSlugs(): string[] {
  return TOOLS.map(t => t.slug);
}
