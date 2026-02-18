// Use case page content and metadata — "Guided Problem Playground" model
// Each use case is a problem-first landing page with live demo, journey, and cross-links

export interface UseCase {
  slug: string;
  // Hero
  title: string;
  subtitle: string;
  industry: string;
  role: string;
  // Problem
  problem: {
    headline: string;
    description: string;
    misleadingMetric: string;
    reality: string;
  };
  // Demo
  demo: {
    sampleKey: string;
    chartType: 'i-chart' | 'boxplot' | 'capability' | 'pareto' | 'performance';
    caption: string;
  };
  // Journey
  journey: Array<{
    step: number;
    tool: string;
    title: string;
    description: string;
    insight: string;
  }>;
  ahaQuote: string;
  // Before/After
  beforeAfter: Array<{ before: string; after: string }>;
  // Cross-links
  relatedCases: string[];
  relatedTools: string[];
  relatedLearn: string[];
  // Platform fit
  platformFit: Array<{
    stage: string;
    product: 'pwa' | 'azure';
    reason: string;
  }>;
  // SEO
  keywords: string[];
  metaDescription: string;
}

// Industry badge colors
export const INDUSTRY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Manufacturing: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  Automotive: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/20' },
  'Cross-industry': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
  },
  Education: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' },
  Healthcare: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20' },
  'Service Operations': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20',
  },
  Logistics: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-500/20' },
  Pharma: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/20' },
  'Food / Chemical': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500/20',
  },
  'Professional Services': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600',
    border: 'border-indigo-500/20',
  },
  'Supply Chain': { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-500/20' },
};

// Industry groupings for navigation
export const INDUSTRY_GROUPS: Array<{
  industry: string;
  slugs: string[];
}> = [
  { industry: 'Manufacturing', slugs: ['bottleneck-analysis'] },
  { industry: 'Supply Chain', slugs: ['supplier-performance'] },
  { industry: 'Cross-industry', slugs: ['complaint-investigation'] },
];

// ─── 3 Use Cases: Manufacturing, Supply Chain, Cross-industry ──────────────

export const USE_CASES: UseCase[] = [
  // ── 1. Assembly Bottleneck (SEO 22, has case study + dataset) ──
  {
    slug: 'bottleneck-analysis',
    title: 'Find the Real Bottleneck',
    subtitle:
      'Stop guessing which station is the constraint. Let the data show you where variation hides.',
    industry: 'Manufacturing',
    role: 'Process Engineer',
    problem: {
      headline: "You're investing in the wrong station.",
      description:
        'When cycle times spike, the loudest station gets the blame. But variation — not average — reveals the true constraint. The station with the highest average may not be the one causing unpredictable delays.',
      misleadingMetric: '"Station 3 has the highest average cycle time"',
      reality:
        'Station 2 has 3x the variation — its unpredictability is what creates the bottleneck',
    },
    demo: {
      sampleKey: 'bottleneck',
      chartType: 'boxplot',
      caption:
        'Boxplot comparing five process stations — notice which box is tallest (most variation)',
    },
    journey: [
      {
        step: 1,
        tool: 'boxplot',
        title: 'Compare the stations',
        description: 'Boxplot reveals which station has the most spread',
        insight: 'Station 2 has 3x the variation of others',
      },
      {
        step: 2,
        tool: 'i-chart',
        title: 'Check the time pattern',
        description: "Click Station 2's box to see its behavior over time",
        insight: 'I-Chart shows the variation is consistent, not caused by occasional spikes',
      },
      {
        step: 3,
        tool: 'pareto',
        title: 'Prioritize the factors',
        description: 'Within Station 2, which factor drives the most variation?',
        insight: 'One specific sub-process accounts for 60% of the spread',
      },
    ],
    ahaQuote:
      'The station with the highest average was stable. The one nobody suspected was causing all the unpredictability.',
    beforeAfter: [
      {
        before: 'Blamed Station 3 (highest average)',
        after: 'Found Station 2 (highest variation)',
      },
      { before: 'Planned equipment upgrade', after: 'Fixed a sub-process adjustment' },
      {
        before: 'Months of planned downtime',
        after: 'Resolved in one shift',
      },
    ],
    relatedCases: ['bottleneck'],
    relatedTools: ['boxplot', 'i-chart', 'pareto'],
    relatedLearn: ['four-lenses', 'eda-philosophy'],
    platformFit: [
      { stage: 'Quick check', product: 'pwa', reason: 'Paste data, see variation in 60 seconds' },
      {
        stage: 'Team analysis',
        product: 'azure',
        reason: 'Share findings, save projects, unlimited channels',
      },
    ],
    keywords: [
      'assembly bottleneck analysis',
      'find bottleneck manufacturing',
      'process variation analysis',
      'station comparison SPC',
      'cycle time variation',
    ],
    metaDescription:
      'Find the real bottleneck in your assembly process. Variation analysis reveals which station causes unpredictable delays — not just the one with the highest average.',
  },

  // ── 2. Supplier Performance (SEO 24, highest score) ──
  {
    slug: 'supplier-performance',
    title: 'See Which Suppliers Actually Deliver',
    subtitle:
      'Your incoming inspection data holds the answer. Stop reacting to individual lots — see the pattern.',
    industry: 'Supply Chain',
    role: 'Supplier Quality Engineer',
    problem: {
      headline: "Your supplier scorecard isn't telling the full story.",
      description:
        'Monthly pass rates look fine. But averages across suppliers hide the ones that are slowly drifting out of spec. By the time a lot fails incoming inspection, the damage is already done.',
      misleadingMetric: '"All suppliers maintain 95%+ pass rate"',
      reality:
        'Supplier C is drifting toward the spec limit — six months from comfortable margin to barely passing',
    },
    demo: {
      sampleKey: 'journey',
      chartType: 'i-chart',
      caption:
        'I-Chart of incoming inspection data — watch for the drift pattern in the second half',
    },
    journey: [
      {
        step: 1,
        tool: 'i-chart',
        title: 'Check stability over time',
        description: "Plot incoming measurements chronologically to see each supplier's trajectory",
        insight: 'One supplier shows a clear upward drift starting at batch 30',
      },
      {
        step: 2,
        tool: 'boxplot',
        title: 'Compare suppliers head-to-head',
        description: 'Group by supplier to compare spread and centering',
        insight: 'Supplier C has the widest spread AND is shifted closest to the upper spec limit',
      },
      {
        step: 3,
        tool: 'capability',
        title: 'Assess supplier capability',
        description: 'Quantify each supplier against your spec limits',
        insight:
          'Supplier C barely meets spec. Others have comfortable margin. Now you know where to focus.',
      },
    ],
    ahaQuote:
      'The scorecard said 95% pass rate. The I-Chart showed the trajectory — two months from systematic failures.',
    beforeAfter: [
      {
        before: 'Monthly pass/fail scorecard',
        after: 'See which suppliers are drifting — before lots fail',
      },
      {
        before: 'React when lots fail',
        after: 'Intervene while there is still margin',
      },
      {
        before: 'All suppliers treated equally',
        after: 'Focused improvement on the drifting supplier',
      },
    ],
    relatedCases: ['coffee', 'bottleneck'],
    relatedTools: ['i-chart', 'capability', 'boxplot'],
    relatedLearn: ['two-voices', 'four-lenses'],
    platformFit: [
      {
        stage: 'Quick audit',
        product: 'pwa',
        reason: 'Paste incoming inspection data, assess in minutes',
      },
      {
        stage: 'Supplier monitoring',
        product: 'azure',
        reason: 'Track all suppliers, save baselines, share with team',
      },
    ],
    keywords: [
      'supplier quality analysis',
      'incoming inspection SPC',
      'supplier capability Cpk',
      'supplier performance monitoring',
      'supplier comparison chart',
    ],
    metaDescription:
      'Compare supplier quality from your incoming inspection data. See which suppliers are drifting before lots start failing.',
  },

  // ── 3. Customer Complaint Investigation (SEO 21, universal) ──
  {
    slug: 'complaint-investigation',
    title: 'Investigate Customer Complaints With Data',
    subtitle: 'The customer says quality dropped. Your averages look the same. What changed?',
    industry: 'Cross-industry',
    role: 'Quality Engineer / Customer Quality Manager',
    problem: {
      headline: "The customer sees a problem your dashboard doesn't.",
      description:
        'A key customer reports increasing defects in recent shipments. Your monthly quality metrics show no change. But the customer is comparing specific lots to their earlier experience — and they are right. Something shifted.',
      misleadingMetric: '"Monthly average within spec. No trend detected."',
      reality:
        'A process shift occurred at batch 47. Everything shipped after that point fails to meet spec.',
    },
    demo: {
      sampleKey: 'cookie-weight',
      chartType: 'i-chart',
      caption:
        'I-Chart showing a process shift mid-production — the dashboard average hid this change',
    },
    journey: [
      {
        step: 1,
        tool: 'i-chart',
        title: 'Plot the complaint period',
        description: 'Chart the data from the complaint timeframe. Look for shifts or trends.',
        insight: 'Clear shift at batch 47 — mean moved from 30.1g to 31.8g',
      },
      {
        step: 2,
        tool: 'boxplot',
        title: 'Compare before vs after',
        description: 'Split data at the shift point. Compare the two periods.',
        insight: 'After-period has both higher mean AND wider spread',
      },
      {
        step: 3,
        tool: 'capability',
        title: 'Quantify the impact',
        description: 'Calculate Cpk for the complaint period specifically',
        insight:
          'Before the shift: meeting spec comfortably. After: not capable. The customer was right.',
      },
    ],
    ahaQuote:
      "The monthly average didn't move because good and bad periods averaged each other out. Staged analysis made the shift impossible to miss.",
    beforeAfter: [
      {
        before: '"No significant change detected"',
        after: 'Process shift identified at batch 47',
      },
      {
        before: 'Defensive response to customer',
        after: 'Data-backed root cause and corrective action',
      },
      {
        before: 'Weeks of investigation',
        after: '15-minute visual analysis pinpoints the change',
      },
    ],
    relatedCases: ['cookie-weight', 'hospital-ward'],
    relatedTools: ['i-chart', 'capability', 'boxplot'],
    relatedLearn: ['two-voices', 'staged-analysis', 'control-charts'],
    platformFit: [
      {
        stage: 'Quick investigation',
        product: 'pwa',
        reason: 'Paste complaint-period data, see the pattern instantly',
      },
      {
        stage: 'Customer response',
        product: 'azure',
        reason: 'Save the analysis, export charts for the 8D report',
      },
    ],
    keywords: [
      'customer complaint investigation SPC',
      'quality complaint root cause',
      'process shift detection',
      'complaint data analysis',
      'quality investigation tool',
    ],
    metaDescription:
      'Investigate customer quality complaints with data. Find process shifts your dashboard missed and respond with evidence, not excuses.',
  },
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return USE_CASES.find(uc => uc.slug === slug);
}

export function getAllUseCaseSlugs(): string[] {
  return USE_CASES.map(uc => uc.slug);
}
