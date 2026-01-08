// Learn page content and metadata
export interface LearnTopic {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  colorClass: string;
  icon: string;
  sections: LearnSection[];
  relatedTools: string[];
  relatedTopics: string[];
}

export interface LearnSection {
  id: string;
  title: string;
  content: string;
  visual?: {
    type: 'comparison' | 'diagram' | 'list' | 'quote';
    data: any;
  };
}

export const LEARN_TOPICS: LearnTopic[] = [
  {
    slug: 'two-voices',
    title: 'The Two Voices',
    subtitle: 'Voice of the Process vs Voice of the Customer',
    description:
      'Understanding the difference between what your process delivers and what your customer needs.',
    color: '#8b5cf6',
    colorClass: 'text-purple-500',
    icon: '🎭',
    sections: [
      {
        id: 'intro',
        title: 'Two Different Questions',
        content:
          'Every process has two perspectives: what it naturally produces (Voice of the Process) and what the customer requires (Voice of the Customer). Confusing these leads to wrong decisions.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Voice of the Process',
              subtitle: 'What does my process naturally do?',
              items: [
                'Control limits (UCL/LCL)',
                'Calculated from your data',
                'Shows natural variation',
                'Statistical boundaries',
              ],
              color: 'blue',
            },
            right: {
              title: 'Voice of the Customer',
              subtitle: 'What does the customer need?',
              items: [
                'Specification limits (USL/LSL)',
                'Set by customer requirements',
                'Shows acceptable range',
                'Business boundaries',
              ],
              color: 'green',
            },
          },
        },
      },
      {
        id: 'control-vs-spec',
        title: 'Control Limits vs Specification Limits',
        content:
          "Control limits tell you what your process IS doing. Spec limits tell you what it SHOULD do. They're completely different things, calculated completely differently.",
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Control Limits',
                description:
                  'Mean ± 3σ, calculated from your data. If a point goes outside, something changed.',
              },
              {
                title: 'Spec Limits',
                description:
                  'Set by engineering, customer, or regulation. If a point goes outside, the product fails.',
              },
            ],
          },
        },
      },
      {
        id: 'common-mistake',
        title: 'The Common Mistake',
        content:
          "Many people put spec limits on control charts. This confuses two questions: 'Is my process stable?' (control limits) and 'Does my product pass?' (spec limits). VaRiScout shows both, but separately labeled.",
        visual: {
          type: 'quote',
          data: {
            quote:
              'A process can be in statistical control and still produce 100% defective product. Or it can be out of control and produce 100% good product. Stability and capability are different questions.',
            author: 'Donald Wheeler',
          },
        },
      },
      {
        id: 'when-matters',
        title: 'When Each Voice Matters',
        content:
          'Use control limits first to check if your process is stable. Only then use spec limits to assess capability. A process must be stable before capability metrics (Cp, Cpk) are meaningful.',
        visual: {
          type: 'diagram',
          data: {
            steps: [
              { label: 'Check stability', tool: 'I-Chart with Control Limits' },
              { label: 'If stable, assess capability', tool: 'Capability with Spec Limits' },
              {
                label: 'If not stable, find the special cause first',
                tool: 'Investigate before specs',
              },
            ],
          },
        },
      },
    ],
    relatedTools: ['i-chart', 'capability'],
    relatedTopics: ['four-pillars', 'eda-philosophy'],
  },
  {
    slug: 'four-pillars',
    title: 'The Four Pillars',
    subtitle: "Watson's Framework for Variation Analysis",
    description:
      'A systematic approach to understanding variation: CHANGE over time, FLOW through factors, FAILURE concentration, and VALUE delivery.',
    color: '#f59e0b',
    colorClass: 'text-amber-500',
    icon: '🏛️',
    sections: [
      {
        id: 'intro',
        title: 'Why Four Pillars?',
        content:
          "Different questions require different tools. The Four Pillars framework helps you pick the right visualization for your question. It's not about which tool is 'best' - it's about which question you're asking.",
      },
      {
        id: 'change',
        title: 'CHANGE: Time Patterns',
        content:
          'The first pillar looks at how your data changes over time. This reveals trends, shifts, cycles, and special causes that averages hide.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Tool', description: 'I-Chart (Individuals Chart)' },
              { title: 'Question', description: 'What patterns exist over time?' },
              { title: 'Reveals', description: 'Shifts, trends, cycles, special causes' },
              { title: 'Color', description: 'Blue' },
            ],
          },
        },
      },
      {
        id: 'flow',
        title: 'FLOW: Factor Comparison',
        content:
          'The second pillar compares groups to find where variation hides. Which machine, operator, shift, or material has the most spread?',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Tool', description: 'Boxplot' },
              { title: 'Question', description: 'Which factor has the most variation?' },
              { title: 'Reveals', description: 'Hidden sources of variation' },
              { title: 'Color', description: 'Orange' },
            ],
          },
        },
      },
      {
        id: 'failure',
        title: 'FAILURE: Problem Concentration',
        content:
          'The third pillar prioritizes where problems concentrate. The 80/20 rule: a vital few categories often cause most issues. Find them first.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Tool', description: 'Pareto Chart' },
              { title: 'Question', description: 'Where do problems concentrate?' },
              { title: 'Reveals', description: 'The vital few vs trivial many' },
              { title: 'Color', description: 'Red' },
            ],
          },
        },
      },
      {
        id: 'value',
        title: 'VALUE: Customer Requirements',
        content:
          'The fourth pillar connects process performance to customer needs. Capability analysis answers: does my process meet spec?',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Tool', description: 'Capability Analysis (Cp/Cpk)' },
              { title: 'Question', description: 'Does the process meet customer specs?' },
              { title: 'Reveals', description: 'Process capability and centering' },
              { title: 'Color', description: 'Green' },
            ],
          },
        },
      },
      {
        id: 'sequence',
        title: 'The Typical Sequence',
        content:
          "While you can start anywhere, a typical analysis flows: CHANGE (is it stable?) → FLOW (which factor?) → FAILURE (which category?) → VALUE (does it meet spec?). VaRiScout's cross-chart filtering supports this flow.",
        visual: {
          type: 'diagram',
          data: {
            steps: [
              { label: 'CHANGE', description: 'Check stability first' },
              { label: 'FLOW', description: 'Find the factor' },
              { label: 'FAILURE', description: 'Prioritize the category' },
              { label: 'VALUE', description: 'Prove the improvement' },
            ],
          },
        },
      },
    ],
    relatedTools: ['i-chart', 'boxplot', 'pareto', 'capability'],
    relatedTopics: ['two-voices', 'eda-philosophy'],
  },
  {
    slug: 'eda-philosophy',
    title: 'EDA Philosophy',
    subtitle: 'Exploratory Data Analysis: Let the Data Speak',
    description:
      'The VaRiScout approach to data analysis: explore first, hypothesize later. Visual discovery before statistical confirmation.',
    color: '#06b6d4',
    colorClass: 'text-cyan-500',
    icon: '🔬',
    sections: [
      {
        id: 'intro',
        title: 'What is EDA?',
        content:
          "Exploratory Data Analysis (EDA) is an approach to data analysis that emphasizes visual exploration and pattern discovery before formal statistical testing. It's about letting the data speak rather than forcing it to answer predetermined questions.",
        visual: {
          type: 'quote',
          data: {
            quote:
              'Exploratory data analysis can never be the whole story, but nothing else can serve as the foundation stone.',
            author: 'John Tukey, Pioneer of EDA',
          },
        },
      },
      {
        id: 'two-approaches',
        title: 'Two Approaches to Data',
        content:
          'Traditional statistics starts with a hypothesis and tests it. EDA starts with curiosity and discovers patterns. Both have their place, but EDA often comes first.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Traditional Statistics',
              subtitle: 'Hypothesis Testing',
              items: [
                'Start with a hypothesis',
                'Design experiment to test it',
                'Calculate p-values',
                'Accept or reject',
              ],
              color: 'neutral',
            },
            right: {
              title: 'EDA (VaRiScout)',
              subtitle: 'Visual Exploration',
              items: [
                'Start with curiosity',
                'Visualize patterns',
                'Generate hypotheses',
                'Then test formally',
              ],
              color: 'cyan',
            },
          },
        },
      },
      {
        id: 'why-eda-first',
        title: 'Why EDA First?',
        content:
          "If you test a hypothesis without exploring first, you might miss the real story. The data might have patterns you didn't expect. EDA helps you ask better questions before you start testing answers.",
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Find unexpected patterns', description: 'The data often surprises you' },
              { title: 'Generate better hypotheses', description: 'Test questions that matter' },
              {
                title: 'Catch data quality issues',
                description: 'Outliers, missing values, errors',
              },
              { title: 'Build intuition', description: 'Understand your process deeply' },
            ],
          },
        },
      },
      {
        id: 'variscout-eda',
        title: 'VaRiScout is EDA',
        content:
          'VaRiScout is designed for EDA. Click to filter, drag to explore, hover to investigate. The Four Pillars give you multiple views of the same data. Cross-chart filtering lets you follow hunches instantly.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Click to filter', description: 'Instantly see subsets' },
              { title: 'Drag to zoom', description: 'Focus on regions of interest' },
              { title: 'Cross-chart sync', description: 'All views update together' },
              { title: 'No coding required', description: 'Visual interaction, not syntax' },
            ],
          },
        },
      },
      {
        id: 'after-eda',
        title: 'After EDA: Confirm',
        content:
          "EDA generates hypotheses. Then you need to confirm them. VaRiScout's statistics panel provides the numbers. Export your findings to reports. Share the visual story with stakeholders.",
        visual: {
          type: 'diagram',
          data: {
            steps: [
              { label: 'Explore', description: 'Use VaRiScout visuals' },
              { label: 'Hypothesize', description: 'Form specific questions' },
              { label: 'Confirm', description: 'Check the statistics' },
              { label: 'Act', description: 'Apply Lean thinking' },
            ],
          },
        },
      },
      {
        id: 'lean-connection',
        title: 'EDA + Lean Thinking',
        content:
          "VaRiScout finds WHERE to focus. Lean thinking (5 Whys, fishbone diagrams, etc.) finds WHY it happens. EDA is the compass. Lean is the toolkit. Together, they're powerful.",
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'VaRiScout (EDA)',
              subtitle: 'WHERE to focus',
              items: [
                'Find the pattern',
                'Identify the factor',
                'Prioritize the category',
                'Quantify the gap',
              ],
              color: 'cyan',
            },
            right: {
              title: 'Lean Thinking',
              subtitle: 'WHY it happens',
              items: [
                '5 Whys analysis',
                'Fishbone diagrams',
                'Root cause investigation',
                'Countermeasures',
              ],
              color: 'amber',
            },
          },
        },
      },
    ],
    relatedTools: ['i-chart', 'boxplot', 'regression'],
    relatedTopics: ['four-pillars', 'two-voices'],
  },
  {
    slug: 'staged-analysis',
    title: 'Staged Analysis',
    subtitle: 'Compare Process Phases with Separate Control Limits',
    description:
      'When your process changes, your control limits should too. Staged analysis reveals improvements that combined data hides.',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
    icon: '📊',
    sections: [
      {
        id: 'intro',
        title: 'The Problem with Combined Data',
        content:
          'When you implement a process improvement, your I-Chart calculates control limits from ALL the data—before and after. This masks real improvements and hides true process shifts. The "after" data gets averaged with the "before" data, making your improvement invisible.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Combined Limits',
              subtitle: 'What most tools show',
              items: [
                'Single set of control limits',
                'Calculated from all data',
                'Improvements hidden',
                'Process shifts masked',
              ],
              color: 'neutral',
            },
            right: {
              title: 'Staged Limits',
              subtitle: 'What VaRiScout reveals',
              items: [
                'Separate limits per phase',
                'Each stage calculated independently',
                'Improvements clearly visible',
                'Process shifts revealed',
              ],
              color: 'blue',
            },
          },
        },
      },
      {
        id: 'when-to-use',
        title: 'When to Use Staged Analysis',
        content:
          'Use staged analysis whenever your process has distinct phases. The key question: did something fundamentally change between data collection periods?',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Before/After Improvement',
                description: 'Compare process performance before and after implementing a change',
              },
              {
                title: 'Batch Comparison',
                description:
                  'Different production batches or material lots may have different baselines',
              },
              {
                title: 'Equipment Changes',
                description: 'Before/after maintenance, equipment replacement, or calibration',
              },
              {
                title: 'Shift or Time Periods',
                description: 'Compare day vs night shift, or week-over-week performance',
              },
            ],
          },
        },
      },
      {
        id: 'how-it-works',
        title: 'How It Works in VaRiScout',
        content:
          'VaRiScout makes staged analysis simple: select your stage column, and the I-Chart instantly shows separate control limits for each phase. No complex setup required.',
        visual: {
          type: 'diagram',
          data: {
            steps: [
              {
                label: 'Add a Stage Column',
                description:
                  'Your data needs a column identifying each phase (e.g., "Before", "After")',
              },
              {
                label: 'Select Stage in Dashboard',
                description: 'Choose your stage column from the Stage dropdown',
              },
              {
                label: 'See Separate Limits',
                description: 'I-Chart shows UCL, Mean, LCL calculated independently for each stage',
              },
              {
                label: 'Compare Phases',
                description: 'Vertical dividers and labels make comparison instant',
              },
            ],
          },
        },
      },
      {
        id: 'interpreting',
        title: 'Interpreting Staged Charts',
        content:
          'With staged analysis, you can immediately see how each phase differs. Look for changes in the center line (mean shifted?) and control limits (variation changed?).',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Tighter Control Limits',
                description: 'Variation reduced—process improved',
              },
              {
                title: 'Shifted Mean',
                description: 'Process centered differently—check if intentional',
              },
              {
                title: 'Fewer Out-of-Control Points',
                description: 'More stable process in that phase',
              },
              {
                title: 'Similar Limits Across Stages',
                description: 'No real change between phases—investigate other factors',
              },
            ],
          },
        },
      },
      {
        id: 'best-practices',
        title: 'Best Practices',
        content:
          'For reliable staged analysis, ensure each stage has enough data points. VaRiScout works best with stages that have 10+ points each.',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Minimum 10 Points Per Stage',
                description: 'Control limits need data to be meaningful',
              },
              {
                title: '2-10 Stages Maximum',
                description: 'More stages become visually crowded',
              },
              {
                title: 'Meaningful Stage Definitions',
                description: 'Stages should represent real process changes, not arbitrary splits',
              },
              {
                title: 'Check Stage Order',
                description: 'Use Auto-detect or set order manually if needed',
              },
            ],
          },
        },
      },
    ],
    relatedTools: ['i-chart', 'capability'],
    relatedTopics: ['two-voices', 'four-pillars'],
  },
];

export function getLearnTopicBySlug(slug: string): LearnTopic | undefined {
  return LEARN_TOPICS.find(t => t.slug === slug);
}

export function getAllLearnSlugs(): string[] {
  return LEARN_TOPICS.map(t => t.slug);
}
