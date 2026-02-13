// Case study content and metadata — single source of truth
// Used by: [slug].astro, RelatedCases.astro, WhatsNext.astro, CaseProgress.astro

export type ChartId = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CaseStep {
  title: string;
  content: string;
  interactive: boolean;
  targetChart?: ChartId;
}

export interface CaseStudy {
  slug: string;
  week: number;
  phase: number;
  sampleKey: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  time: string;
  tools: ChartId[];
  /** Display-friendly tool names for cross-linking (e.g. RelatedCases chips) */
  toolNames: string[];
  problem: {
    lead: string;
    context: string;
  };
  objectives: string[];
  steps: CaseStep[];
  insight: string;
  nextCase: string | null;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'bottleneck',
    week: 1,
    phase: 1,
    sampleKey: 'bottleneck',
    title: 'The Bottleneck',
    subtitle: 'Finding the Hidden Constraint',
    description: 'A process with 5 steps. Step 3 was blamed. But what did the data show?',
    difficulty: 'beginner',
    time: '5 min',
    tools: ['ichart', 'boxplot'],
    toolNames: ['I-Chart', 'Boxplot'],
    problem: {
      lead: 'Which step is actually the bottleneck?',
      context:
        'A manufacturing process had 5 sequential steps. Whenever delays occurred, Step 3 was blamed. The manager wanted to invest in new equipment for Step 3. But nobody had actually looked at the data...',
    },
    objectives: [
      'Use I-Chart to see variation over time',
      'Compare process steps with Boxplot',
      'Identify the step with the most variation',
    ],
    steps: [
      {
        title: 'Look at the Boxplot',
        content:
          'Notice how the boxes have different sizes. A wider box means more variation. Which step has the widest spread?',
        interactive: false,
        targetChart: 'boxplot',
      },
      {
        title: 'Check Step 2',
        content:
          'Step 2 has 3x the variation of the others. This is where the real constraint is hiding.',
        interactive: false,
        targetChart: 'boxplot',
      },
      {
        title: 'Click on Step 2',
        content:
          "Click the Step 2 box in the Boxplot. Watch how the I-Chart updates to show only Step 2's data. Now you can see the time pattern.",
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'The Insight',
        content:
          "Step 3 wasn't the bottleneck. Step 2 was. The manager almost invested in the wrong equipment.",
        interactive: false,
        targetChart: 'ichart',
      },
    ],
    insight: "What's hiding in YOUR process?",
    nextCase: 'hospital-ward',
  },
  {
    slug: 'hospital-ward',
    week: 5,
    phase: 2,
    sampleKey: 'hospital-ward',
    title: 'Hospital Ward',
    subtitle: 'The Aggregation Trap',
    description: 'The dashboard showed 75% occupancy. Everything looked fine. But was it?',
    difficulty: 'beginner',
    time: '5 min',
    tools: ['ichart', 'boxplot', 'stats'],
    toolNames: ['I-Chart', 'Boxplot', 'Stats'],
    problem: {
      lead: 'What is your daily average hiding?',
      context:
        "A hospital ward dashboard showed 75% average occupancy. Management was satisfied - plenty of capacity. But nurses complained about being overwhelmed. The numbers didn't match the reality...",
    },
    objectives: [
      'Understand how averages can hide patterns',
      'Use I-Chart to see hourly variation',
      'Identify time-based patterns',
    ],
    steps: [
      {
        title: 'The Average Looks Fine',
        content:
          "75% occupancy sounds reasonable. There's capacity to spare. But averages hide the story within.",
        interactive: false,
        targetChart: 'stats',
      },
      {
        title: 'Look at the Hourly Data',
        content:
          'The I-Chart shows occupancy by hour. Notice how it swings dramatically throughout the day.',
        interactive: false,
        targetChart: 'ichart',
      },
      {
        title: 'Filter by Time of Day',
        content:
          "Click on the high points in the I-Chart. You'll see: 95% at night (crisis), 50% in the afternoon (waste).",
        interactive: true,
        targetChart: 'ichart',
      },
      {
        title: 'The Hidden Pattern',
        content:
          'The 75% average hid two problems: night shift understaffing AND afternoon overcapacity. Different solutions for different times.',
        interactive: false,
        targetChart: 'boxplot',
      },
    ],
    insight: 'Your dashboard average might be lying to you.',
    nextCase: 'coffee',
  },
  {
    slug: 'coffee',
    week: 9,
    phase: 3,
    sampleKey: 'coffee',
    title: 'Coffee Quality',
    subtitle: 'East Africa Washing Station',
    description:
      'Drying Bed C consistently fails export spec. Is it the bed, the operator, or the measurement?',
    difficulty: 'intermediate',
    time: '7 min',
    tools: ['boxplot', 'ichart', 'gagerr'],
    toolNames: ['Boxplot', 'I-Chart', 'Gage R&R'],
    problem: {
      lead: 'Which drying bed is causing the moisture problems?',
      context:
        "A coffee washing station in East Africa exports specialty coffee. Moisture content must be 10-12% for export. Bed C's batches keep failing. The manager blames the bed location. But is that the real cause?",
    },
    objectives: [
      'Compare factors using Boxplot',
      'Identify the outlier group',
      'Consider measurement system validity',
    ],
    steps: [
      {
        title: 'Compare the Drying Beds',
        content:
          'The Boxplot shows moisture by drying bed. Bed C has a higher median and more spread. But why?',
        interactive: false,
        targetChart: 'boxplot',
      },
      {
        title: 'Check for Patterns',
        content:
          'Click on Bed C to see its time pattern. Is it consistently high, or are there spikes?',
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'The Operator Question',
        content:
          'Notice that Bed C is always measured by the same operator. Is it the bed, or is it how they measure?',
        interactive: false,
        targetChart: 'ichart',
      },
      {
        title: 'The MSA Connection',
        content:
          "Before blaming the bed, check the measurement system. A Gage R&R study reveals the moisture meter has ~8% variation - that's acceptable. The problem IS the bed.",
        interactive: false,
        targetChart: 'gagerr',
      },
    ],
    insight: 'Before you blame the process, verify your measurement.',
    nextCase: 'packaging',
  },
  {
    slug: 'packaging',
    week: 9,
    phase: 3,
    sampleKey: 'packaging',
    title: 'Packaging Defects',
    subtitle: 'Africa Manufacturing',
    description:
      'Night shift is systematically underfilling. Is it the operators, the equipment, or something else?',
    difficulty: 'intermediate',
    time: '8 min',
    tools: ['pareto', 'boxplot', 'ichart'],
    toolNames: ['Pareto', 'Boxplot', 'I-Chart'],
    problem: {
      lead: "What's causing the fill weight problems on night shift?",
      context:
        'A packaging facility runs two shifts. The night shift has higher defect rates and more underfilling complaints. Management wants to retrain the night operators. But is training really the answer?',
    },
    objectives: [
      'Use Pareto to prioritize defect types',
      'Compare shifts using Boxplot',
      'Connect defects to process measurements',
    ],
    steps: [
      {
        title: 'Prioritize with Pareto',
        content:
          "The Pareto chart shows defect types. 'Underfill' dominates at 60%. Focus here first.",
        interactive: false,
        targetChart: 'pareto',
      },
      {
        title: 'Compare the Shifts',
        content:
          "The Boxplot by shift shows night shift has lower median fill weight. It's systematic, not random.",
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'Check the Equipment',
        content:
          'Night shift uses the older filling machine. The I-Chart shows it drifts low over time.',
        interactive: false,
        targetChart: 'ichart',
      },
      {
        title: 'The Real Cause',
        content:
          "It's not the operators - it's the equipment. Retraining won't fix a machine that needs calibration.",
        interactive: false,
        targetChart: 'stats',
      },
    ],
    insight: "Don't blame people for equipment problems.",
    nextCase: 'avocado',
  },
  {
    slug: 'avocado',
    week: 12,
    phase: 3,
    sampleKey: 'avocado',
    title: 'Avocado Coating',
    subtitle: 'Post-Harvest Optimization',
    description: 'More coating means longer shelf life. But can operators apply it consistently?',
    difficulty: 'advanced',
    time: '10 min',
    tools: ['regression', 'gagerr', 'stats'],
    toolNames: ['Regression', 'Gage R&R', 'Stats'],
    problem: {
      lead: "What's the optimal coating level for maximum shelf life?",
      context:
        "A post-harvest facility coats avocados with wax to extend shelf life. Research suggests more coating = longer shelf life. But there's 28% unexplained variation in the results. Why?",
    },
    objectives: [
      'Understand regression relationships',
      'Interpret R-squared values',
      'Connect MSA to unexplained variation',
    ],
    steps: [
      {
        title: 'The Regression',
        content:
          'Coating amount explains 72% of shelf life variation (R\u00B2 = 0.72). Each ml/kg adds ~3 days.',
        interactive: false,
        targetChart: 'regression',
      },
      {
        title: 'But 28% is Unexplained',
        content:
          'What accounts for the remaining variation? Look at the residuals - some operators have systematic patterns.',
        interactive: true,
        targetChart: 'regression',
      },
      {
        title: 'The MSA Reveals',
        content:
          'A Gage R&R study shows operator reproducibility is ~22%. Joseph consistently under-applies by 20%.',
        interactive: false,
        targetChart: 'gagerr',
      },
      {
        title: 'The Business Decision',
        content:
          'Fix operator technique first, then re-run the regression. The coating formula might be fine when applied consistently.',
        interactive: false,
        targetChart: 'stats',
      },
    ],
    insight: 'Before optimizing the formula, verify you can apply it consistently.',
    nextCase: 'cookie-weight',
  },
  {
    slug: 'cookie-weight',
    week: 2,
    phase: 1,
    sampleKey: 'cookie-weight',
    title: 'Cookie Weight',
    subtitle: 'Classic SPC in Action',
    description:
      'Which oven is causing weight variation? And why does night shift have more problems?',
    difficulty: 'beginner',
    time: '5 min',
    tools: ['ichart', 'boxplot', 'stats'],
    toolNames: ['I-Chart', 'Boxplot', 'Stats'],
    problem: {
      lead: 'Why are cookies coming out inconsistent?',
      context:
        "A bakery produces cookies with a target weight of 30g (spec: 27-33g). Quality complaints have increased. The production manager suspects the ovens, but the night shift supervisor blames tired operators. Who's right?",
    },
    objectives: [
      'Use I-Chart to spot patterns over time',
      'Compare ovens using Boxplot',
      'Identify both location and variation problems',
    ],
    steps: [
      {
        title: 'Check the Overall Pattern',
        content:
          "The I-Chart shows cookie weights over time. Notice some points are consistently above the center line. There's a pattern here.",
        interactive: false,
        targetChart: 'ichart',
      },
      {
        title: 'Compare the Ovens',
        content:
          "The Boxplot by oven reveals the truth: Oven 2 has a higher median (32g vs 30g). It's running heavy.",
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'Check the Shifts',
        content:
          'Now filter by shift. Night shift has a wider box - more variation. But the median is the same. Different problem, different cause.',
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'Two Problems, Two Solutions',
        content:
          'Oven 2 needs recalibration (location problem). Night shift needs process discipline (variation problem). Both matter, but they need different fixes.',
        interactive: false,
        targetChart: 'stats',
      },
    ],
    insight: 'Location problems and variation problems need different solutions.',
    nextCase: 'weld-defects',
  },
  {
    slug: 'weld-defects',
    week: 3,
    phase: 1,
    sampleKey: 'weld-defects',
    title: 'Weld Defects',
    subtitle: 'Robot Cell Investigation',
    description:
      'One robot cell has 4x the defects. Find the root cause before management buys new equipment.',
    difficulty: 'intermediate',
    time: '7 min',
    tools: ['pareto', 'boxplot', 'ichart'],
    toolNames: ['Pareto', 'Boxplot', 'I-Chart'],
    problem: {
      lead: 'Why does Cell B have so many more defects?',
      context:
        "A welding line has three robot cells. Cell B consistently produces 4x more defects than Cells A and C. The engineering manager wants to replace Cell B's robot. But at \u20AC200,000, is that the right call?",
    },
    objectives: [
      'Use Pareto to identify the dominant defect type',
      'Compare cells using Boxplot',
      'Connect defect type to root cause',
    ],
    steps: [
      {
        title: 'Prioritize with Pareto',
        content:
          "The Pareto chart by cell shows Cell B dominates. But look at the defect types - Cell B's defects are almost all 'Porosity'.",
        interactive: false,
        targetChart: 'pareto',
      },
      {
        title: 'Focus on Porosity',
        content:
          "Porosity in welds typically comes from gas entrapment. This isn't a robot accuracy problem - it's a shielding gas problem.",
        interactive: true,
        targetChart: 'pareto',
      },
      {
        title: 'Check the Time Pattern',
        content:
          'The I-Chart for Cell B shows consistent high defects - not random spikes. This is a systematic issue, not intermittent.',
        interactive: false,
        targetChart: 'ichart',
      },
      {
        title: 'The Root Cause',
        content:
          "Investigation revealed: Cell B's fixture has a misaligned clamp that disrupts gas flow. A \u20AC50 fixture adjustment, not a \u20AC200,000 robot replacement.",
        interactive: false,
        targetChart: 'boxplot',
      },
    ],
    insight: 'The defect TYPE tells you more than the defect COUNT.',
    nextCase: 'call-wait',
  },
  {
    slug: 'call-wait',
    week: 6,
    phase: 2,
    sampleKey: 'call-wait',
    title: 'Call Wait Time',
    subtitle: 'Service Center Analysis',
    description:
      'Technical support queue has 3x the wait time. Is it understaffing or something else?',
    difficulty: 'beginner',
    time: '5 min',
    tools: ['boxplot', 'ichart', 'stats'],
    toolNames: ['Boxplot', 'I-Chart', 'Stats'],
    problem: {
      lead: 'Why are Technical queue customers waiting so long?',
      context:
        'A service center tracks wait times across four queues: Sales, Billing, General, and Technical. The Technical queue averages 12 minutes - triple the others. HR wants to hire more technical agents. But is staffing the real issue?',
    },
    objectives: [
      'Compare queues using Boxplot',
      'Identify time-of-day patterns',
      'Distinguish staffing from demand issues',
    ],
    steps: [
      {
        title: 'Compare the Queues',
        content:
          'The Boxplot by queue shows Technical is clearly different - higher median AND more variation. Something systematic is happening.',
        interactive: false,
        targetChart: 'boxplot',
      },
      {
        title: 'Check the Time Pattern',
        content:
          "Filter by hour. Notice the lunch hour spike (12-1pm) - but it affects ALL queues equally. That's not the Technical problem.",
        interactive: true,
        targetChart: 'ichart',
      },
      {
        title: 'The Real Pattern',
        content:
          'Technical calls take 3x longer to resolve - the average handle time is 15 min vs 5 min. Same staffing ratio, but calls take longer.',
        interactive: false,
        targetChart: 'stats',
      },
      {
        title: 'The Staffing Math',
        content:
          'With 3x handle time, you need 3x agents for the same wait time. It IS a staffing issue, but now you can calculate exactly how many agents you need.',
        interactive: false,
        targetChart: 'boxplot',
      },
    ],
    insight: "Before hiring, understand whether it's a demand problem or a capacity problem.",
    nextCase: 'delivery',
  },
  {
    slug: 'delivery',
    week: 7,
    phase: 2,
    sampleKey: 'delivery',
    title: 'Delivery Performance',
    subtitle: 'Logistics Route Analysis',
    description:
      'One route consistently misses the delivery window. Is it the driver, the route, or the traffic?',
    difficulty: 'intermediate',
    time: '6 min',
    tools: ['boxplot', 'ichart', 'stats'],
    toolNames: ['Boxplot', 'I-Chart', 'Stats'],
    problem: {
      lead: 'Why does Route C always run late?',
      context:
        'A delivery company tracks on-time performance across four routes. Route C (Mountain region) averages 45 minutes per delivery vs 25 minutes target. Customers are complaining. Management blames the drivers assigned to Route C.',
    },
    objectives: [
      'Compare routes using Boxplot',
      'Check for driver effects',
      'Separate route difficulty from driver performance',
    ],
    steps: [
      {
        title: 'Compare the Routes',
        content:
          'The Boxplot shows Route C is clearly different - higher median AND much more variation. The mountain terrain creates unpredictable delays.',
        interactive: false,
        targetChart: 'boxplot',
      },
      {
        title: 'Check the Drivers',
        content:
          "Filter by driver. All drivers show similar patterns on Route C - it's not about WHO drives, it's about WHERE they drive.",
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'Look at the Time Pattern',
        content:
          'The I-Chart shows no trend over time - Route C is consistently slow, not getting worse. This is a route characteristic, not a degradation.',
        interactive: false,
        targetChart: 'ichart',
      },
      {
        title: 'The Business Decision',
        content:
          'Route C needs a different SLA (40 min, not 25 min) or a different delivery model (consolidation points). Blaming drivers solves nothing.',
        interactive: false,
        targetChart: 'stats',
      },
    ],
    insight: 'Sometimes the standard is wrong, not the performance.',
    nextCase: 'sock-mystery',
  },
  {
    slug: 'sock-mystery',
    week: 4,
    phase: 1,
    sampleKey: 'sock-mystery',
    title: 'The Sock Mystery',
    subtitle: 'Classic Training Case',
    description:
      'Socks keep disappearing in the laundry. Everyone has a theory. Can data find the truth?',
    difficulty: 'beginner',
    time: '5 min',
    tools: ['boxplot', 'pareto', 'ichart'],
    toolNames: ['Boxplot', 'Pareto', 'I-Chart'],
    problem: {
      lead: 'Where do the missing socks go?',
      context:
        "A laundromat tracks missing socks per load. Theories abound: large loads lose more socks, Washer B has a hidden compartment, or maybe it's just randomness. Time to let the data speak.",
    },
    objectives: [
      'Test multiple hypotheses with Boxplot',
      'Avoid confirmation bias',
      'Let unexpected patterns emerge',
    ],
    steps: [
      {
        title: 'Test the Load Size Theory',
        content:
          'The Boxplot by load size shows... almost no difference! Large loads lose slightly more, but not significantly. Theory busted.',
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'Test the Washer Theory',
        content:
          'The Boxplot by washer shows Washer A and B are nearly identical. No hidden compartment here. Another theory busted.',
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'Check the Dryers',
        content:
          'Wait - what about the dryers? The Boxplot by dryer shows Dryer 2 has 3x the sock loss! We were looking in the wrong place.',
        interactive: true,
        targetChart: 'boxplot',
      },
      {
        title: 'The Drum Seal Gap',
        content:
          'Investigation revealed: Dryer 2 has a gap in the drum seal. Small items slip through during tumbling. Mystery solved!',
        interactive: false,
        targetChart: 'ichart',
      },
    ],
    insight: "The obvious suspect isn't always the culprit. Test all factors.",
    nextCase: null,
  },
];

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find(c => c.slug === slug);
}

export function getAllCaseSlugs(): string[] {
  return CASE_STUDIES.map(c => c.slug);
}
