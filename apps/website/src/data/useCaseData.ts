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
    product: 'pwa' | 'excel' | 'azure';
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
  {
    industry: 'Manufacturing',
    slugs: ['bottleneck-analysis', 'supplier-performance', 'supplier-ppap', 'batch-consistency'],
  },
  { industry: 'Automotive', slugs: ['supplier-ppap', 'supplier-performance'] },
  { industry: 'Healthcare', slugs: ['patient-wait-time'] },
  { industry: 'Education', slugs: ['university-spc'] },
  {
    industry: 'Service Operations',
    slugs: ['call-center-performance', 'on-time-delivery', 'lead-time-variation'],
  },
  {
    industry: 'Cross-industry',
    slugs: ['copq-drilldown', 'complaint-investigation'],
  },
];

// ─── Phase 1: 6 Use Cases (highest SEO score + data match) ─────────────────

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
    relatedLearn: ['four-pillars', 'eda-philosophy'],
    platformFit: [
      { stage: 'Quick check', product: 'pwa', reason: 'Paste data, see variation in 60 seconds' },
      {
        stage: 'Live in Excel',
        product: 'excel',
        reason: 'Connect directly to your process data sheet',
      },
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
        'Supplier C is trending toward the spec limit — Cpk dropping from 1.4 to 0.9 over 6 months',
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
        title: 'Calculate supplier Cpk',
        description: 'Quantify each supplier against your spec limits',
        insight: 'Supplier C: Cpk 0.92 (not capable). Others: 1.3+',
      },
    ],
    ahaQuote:
      'The scorecard said 95% pass rate. The I-Chart showed the trajectory — two months from systematic failures.',
    beforeAfter: [
      {
        before: 'Monthly pass/fail scorecard',
        after: 'Real-time Cpk tracking per supplier',
      },
      {
        before: 'React when lots fail',
        after: 'Intervene before capability drops below 1.0',
      },
      {
        before: 'All suppliers treated equally',
        after: 'Focused improvement on the drifting supplier',
      },
    ],
    relatedCases: ['coffee', 'bottleneck'],
    relatedTools: ['i-chart', 'capability', 'boxplot'],
    relatedLearn: ['two-voices', 'four-pillars'],
    platformFit: [
      {
        stage: 'Quick audit',
        product: 'pwa',
        reason: 'Paste incoming inspection data, assess in minutes',
      },
      {
        stage: 'In your spreadsheet',
        product: 'excel',
        reason: 'Analyze directly from your inspection log',
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
      'Monitor supplier quality with real-time Cpk tracking. See which suppliers are drifting before lots fail incoming inspection.',
  },

  // ── 3. University SPC (SEO 24, equal highest) ──
  {
    slug: 'university-spc',
    title: 'Teach SPC Without the Software Barrier',
    subtitle:
      'Your students should learn the methodology, not navigate complex menus. Free, instant, no signup.',
    industry: 'Education',
    role: 'University Lecturer / Lean Six Sigma Trainer',
    problem: {
      headline: 'Expensive software licenses are blocking your students.',
      description:
        'Statistical software costs thousands per seat. IT approval takes weeks. By the time students have access, the semester is half over. And then they spend more time learning the menu structure than the methodology.',
      misleadingMetric: '"Students completed the Minitab tutorial"',
      reality:
        'They learned to click buttons in a specific sequence. They cannot interpret a control chart from scratch.',
    },
    demo: {
      sampleKey: 'coffee',
      chartType: 'i-chart',
      caption:
        'I-Chart of coffee roasting data — a real case study your students can explore immediately',
    },
    journey: [
      {
        step: 1,
        tool: 'i-chart',
        title: 'See variation over time',
        description: 'Students paste coffee batch data, see the control chart instantly',
        insight: 'Some batches are outside control limits — why?',
      },
      {
        step: 2,
        tool: 'boxplot',
        title: 'Compare drying beds',
        description: 'Click to filter by drying bed, see which one has the problem',
        insight: 'Bed C has higher moisture AND more variation',
      },
      {
        step: 3,
        tool: 'capability',
        title: 'Assess against export spec',
        description: 'Add spec limits (10-12% moisture) to calculate Cpk',
        insight: 'Cpk < 1.0 for Bed C — it cannot reliably meet export requirements',
      },
    ],
    ahaQuote:
      'The methodology clicked when they could see the chart respond to their clicks. Not when they memorized a menu path.',
    beforeAfter: [
      {
        before: 'Wait weeks for software licenses',
        after: 'Students start analyzing in the first lecture',
      },
      {
        before: 'Teach software navigation',
        after: 'Teach variation thinking',
      },
      {
        before: 'Static textbook examples',
        after: '16 interactive case studies with real data',
      },
      {
        before: 'Students forget after the exam',
        after: 'Tool is always free — they keep using it in projects',
      },
    ],
    relatedCases: ['coffee', 'bottleneck', 'cookie-weight'],
    relatedTools: ['i-chart', 'boxplot', 'capability'],
    relatedLearn: ['four-pillars', 'two-voices', 'eda-philosophy'],
    platformFit: [
      {
        stage: 'Classroom',
        product: 'pwa',
        reason: 'Free forever. No signup. 16 sample datasets for teaching.',
      },
      {
        stage: 'Assignments',
        product: 'pwa',
        reason: 'Students paste their own project data',
      },
      {
        stage: 'Research teams',
        product: 'azure',
        reason: 'Save projects, collaborate, unlimited channels',
      },
    ],
    keywords: [
      'free SPC software education',
      'SPC teaching tool',
      'control chart software university',
      'Lean Six Sigma training tool',
      'statistical process control teaching',
    ],
    metaDescription:
      'Free SPC tool for universities and training. Students learn control charts, Cpk, and variation analysis instantly — no license, no signup, no barriers.',
  },

  // ── 4. Supplier PPAP (SEO 22, automotive high-intent) ──
  {
    slug: 'supplier-ppap',
    title: 'Verify Supplier Capability in Minutes',
    subtitle:
      'Your supplier says Cpk = 1.72. Your incoming data tells a different story. Find out in 60 seconds.',
    industry: 'Automotive',
    role: 'Supplier Quality Engineer',
    problem: {
      headline: "The supplier's PPAP report doesn't match your reality.",
      description:
        "PPAP submissions show impressive Cpk values. But those numbers come from the supplier's controlled study — cherry-picked samples, ideal conditions. Your incoming inspection data tells the real story about day-to-day capability.",
      misleadingMetric: '"Supplier PPAP shows Cpk = 1.72 across all characteristics"',
      reality:
        'Your incoming data shows Cpk = 0.98 on dimension B — below the 1.33 minimum for production approval',
    },
    demo: {
      sampleKey: 'mango-export',
      chartType: 'capability',
      caption:
        'Capability histogram with spec limits — see where the distribution falls relative to requirements',
    },
    journey: [
      {
        step: 1,
        tool: 'capability',
        title: 'Check actual Cpk',
        description: 'Enter your spec limits, see the real capability from incoming data',
        insight: "Cpk 0.98 — below the 1.33 minimum. The supplier's study didn't reflect reality.",
      },
      {
        step: 2,
        tool: 'i-chart',
        title: 'Check for stability',
        description: 'Is the process stable, or is it drifting?',
        insight: 'The I-Chart shows a gradual upward drift — capability is getting worse over time',
      },
      {
        step: 3,
        tool: 'performance',
        title: 'Compare all characteristics',
        description: 'For multi-characteristic PPAP, rank all dimensions by Cpk',
        insight: '3 of 25 characteristics fail the 1.33 threshold — focused corrective action',
      },
    ],
    ahaQuote:
      "The supplier's Cpk was from a controlled study. Ours was from 6 months of incoming data. Guess which one predicts next month's quality.",
    beforeAfter: [
      {
        before: "Trust supplier's PPAP numbers",
        after: 'Verify with your own incoming data',
      },
      {
        before: 'Review all 25 characteristics manually',
        after: 'Performance Mode ranks worst-first automatically',
      },
      {
        before: 'Discover problems at assembly',
        after: 'Catch capability drift at incoming inspection',
      },
    ],
    relatedCases: ['coffee', 'avocado'],
    relatedTools: ['capability', 'i-chart', 'performance'],
    relatedLearn: ['two-voices', 'methodology-capability'],
    platformFit: [
      {
        stage: 'Quick verification',
        product: 'pwa',
        reason: 'Paste incoming data, check Cpk in 60 seconds',
      },
      {
        stage: 'From your inspection sheet',
        product: 'excel',
        reason: 'Analyze directly in your Excel inspection log',
      },
      {
        stage: 'Full PPAP review',
        product: 'azure',
        reason: 'Performance Mode: 25+ characteristics, Cpk ranking, drill-down',
      },
    ],
    keywords: [
      'verify supplier Cpk',
      'PPAP capability verification',
      'supplier Cpk analysis',
      'incoming inspection Cpk',
      'PPAP capability study',
    ],
    metaDescription:
      "Verify supplier PPAP capability with your own incoming data. Compare the supplier's Cpk claims against real performance in 60 seconds.",
  },

  // ── 5. COPQ Drill-Down (SEO 21, universal manufacturing) ──
  {
    slug: 'copq-drilldown',
    title: 'Find Where Your Quality Costs Hide',
    subtitle:
      'Overall scrap rate looks manageable. But one product, one line, one shift holds 52% of the cost.',
    industry: 'Cross-industry',
    role: 'Quality Manager / Continuous Improvement Lead',
    problem: {
      headline: "Your COPQ report treats all waste equally. It shouldn't.",
      description:
        'The monthly quality report shows 3% scrap rate — within budget. But that 3% is not evenly distributed. Drill down by product, line, and shift, and you find massive concentration. A small number of combinations drive the majority of cost.',
      misleadingMetric: '"Overall scrap rate is 3.0% — within the 3.5% budget"',
      reality:
        'Product X on Line 2 during night shift = 52% of total COPQ. Fix this one combination and cut waste in half.',
    },
    demo: {
      sampleKey: 'packaging',
      chartType: 'pareto',
      caption: 'Pareto chart showing defect concentration — the vital few dominate',
    },
    journey: [
      {
        step: 1,
        tool: 'pareto',
        title: 'Find the vital few',
        description: 'Pareto by product type shows which products drive the most scrap',
        insight: 'One product accounts for 45% of total defects',
      },
      {
        step: 2,
        tool: 'boxplot',
        title: 'Drill into the worst product',
        description: 'Click the worst product, then compare lines and shifts',
        insight: 'Line 2 has 3x the variation of Line 1 for this product',
      },
      {
        step: 3,
        tool: 'i-chart',
        title: 'Find the time pattern',
        description: 'Within Line 2, look at the time pattern — when does it get worse?',
        insight:
          'Night shift shows systematic drift. Equipment calibration schedule misses the 2am handover.',
      },
    ],
    ahaQuote:
      "3% scrap rate sounded fine. But 52% of that cost came from one combination we'd never isolated before.",
    beforeAfter: [
      {
        before: 'Report overall scrap %',
        after: 'Report COPQ by product x line x shift',
      },
      {
        before: 'Spread improvement efforts thin',
        after: 'Focus on the one combination that is 52% of cost',
      },
      {
        before: 'Reactive — investigate after customer complaint',
        after: 'Proactive — catch the pattern before it reaches the customer',
      },
    ],
    relatedCases: ['packaging', 'weld-defects'],
    relatedTools: ['pareto', 'boxplot', 'i-chart'],
    relatedLearn: ['four-pillars', 'methodology-eta-squared'],
    platformFit: [
      {
        stage: 'Quick Pareto',
        product: 'pwa',
        reason: 'Paste defect data, see Pareto in seconds',
      },
      {
        stage: 'From your quality log',
        product: 'excel',
        reason: 'Analyze directly from your defect tracking sheet',
      },
      {
        stage: 'Full drill-down',
        product: 'azure',
        reason: 'Multi-level drill-down with saved analysis and team access',
      },
    ],
    keywords: [
      'cost of poor quality analysis',
      'COPQ drill-down',
      'scrap rate analysis',
      'defect Pareto analysis',
      'quality cost reduction',
    ],
    metaDescription:
      'Drill down into your Cost of Poor Quality. Find the specific product-line-shift combination that drives most of your scrap costs.',
  },

  // ── 6. Customer Complaint Investigation (SEO 21, universal) ──
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
        'A process shift occurred at batch 47. Lots after that point have Cpk 0.85 — below capability.',
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
        insight: 'Before: Cpk 1.45 (capable). After: Cpk 0.85 (not capable). Customer was right.',
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
        stage: 'From production log',
        product: 'excel',
        reason: 'Analyze directly from your production tracking sheet',
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
