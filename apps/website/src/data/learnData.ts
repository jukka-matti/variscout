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
  relatedCases?: string[];
}

export interface LearnSection {
  id: string;
  title: string;
  content: string;
  visual?: {
    type: 'comparison' | 'diagram' | 'list' | 'quote' | 'chart';
    data: any;
  };
}

// Chart visual data structure for type safety
export interface ChartVisualData {
  toolSlug: 'i-chart' | 'capability' | 'boxplot';
  sampleKey: string;
  height?: number;
  caption?: string;
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
    relatedCases: ['coffee', 'cookie-weight'],
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
    relatedCases: ['bottleneck', 'coffee'],
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
    relatedCases: ['bottleneck', 'avocado'],
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
    relatedCases: ['hospital-ward', 'coffee'],
  },

  // ===== METHODOLOGY PAGES =====
  // These pages explain HOW we calculate things and WHY we chose our approach
  {
    slug: 'methodology-control-limits',
    title: 'How We Calculate Control Limits',
    subtitle: 'The Math Behind UCL, Mean, and LCL',
    description:
      'Understand how VariScout calculates control limits and why we chose the standard 3-sigma approach.',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
    icon: '📐',
    sections: [
      {
        id: 'quick-answer',
        title: 'Quick Answer',
        content:
          'VariScout calculates UCL and LCL as ±3 standard deviations from the mean. This simple method works well for most quality data and is intuitive for users familiar with basic statistics.',
      },
      {
        id: 'formula',
        title: 'The Formula',
        content:
          'UCL = x̄ + 3σ, LCL = x̄ - 3σ. Where x̄ (x-bar) is the mean of all data points, and σ (sigma) is the standard deviation. The center line is simply the mean (x̄).',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'UCL', description: 'Mean + 3 × Standard Deviation' },
              { title: 'Center Line', description: 'Mean (average of all points)' },
              { title: 'LCL', description: 'Mean - 3 × Standard Deviation' },
            ],
          },
        },
      },
      {
        id: 'why-this-method',
        title: 'Why This Method?',
        content:
          "We chose the standard deviation method because it's intuitive (3σ covers 99.7% of normal data), it works with any sample size, and it matches what most spreadsheet users expect. For a stable, normally distributed process, about 3 in 1000 points will naturally fall outside these limits by chance alone.",
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Our Method (3σ)',
              subtitle: 'Standard Deviation Based',
              items: [
                'Intuitive: ±3σ from mean',
                'Works with any sample size',
                'Familiar to spreadsheet users',
                'Good for normally distributed data',
              ],
              color: 'blue',
            },
            right: {
              title: 'Alternative (MR̄)',
              subtitle: 'Moving Range Based',
              items: [
                'UCL = x̄ + 2.66 × MR̄',
                'More robust to outliers',
                'Preferred by some practitioners',
                'Common in Minitab/JMP',
              ],
              color: 'neutral',
            },
          },
        },
      },
      {
        id: 'worked-example',
        title: 'Worked Example',
        content:
          'Coffee fill weights: 250.1, 249.8, 250.3, 249.9, 250.2 grams. Step 1: Calculate mean (x̄) = 250.06g. Step 2: Calculate standard deviation (σ) = 0.19g. Step 3: UCL = 250.06 + (3 × 0.19) = 250.63g. LCL = 250.06 - (3 × 0.19) = 249.49g.',
        visual: {
          type: 'chart',
          data: {
            toolSlug: 'i-chart',
            sampleKey: 'coffee',
            height: 350,
            caption:
              'I-Chart showing control limits (UCL, Mean, LCL) calculated from coffee fill weight data',
          },
        },
      },
      {
        id: 'assumptions',
        title: 'Assumptions & Limitations',
        content:
          "Control limits assume: data is approximately normally distributed (check with probability plot), the process is stable (no trends or shifts during data collection), and measurements are independent (not autocorrelated). Violations don't invalidate the chart, but interpretation changes.",
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Normality',
                description: 'Check with probability plot; non-normal data still works',
              },
              {
                title: 'Stability',
                description: 'No trends or shifts during data collection period',
              },
              {
                title: 'Independence',
                description: 'Each measurement is independent of previous ones',
              },
            ],
          },
        },
      },
      {
        id: 'when-to-use-minitab',
        title: 'When to Use Specialized Tools',
        content:
          'VariScout is designed for exploration and teaching. For formal SPC with moving range calculations, Xbar-R charts, or CUSUM charts, consider Minitab, JMP, or similar statistical software. VariScout excels at quick visual exploration and hypothesis generation.',
      },
    ],
    relatedTools: ['i-chart'],
    relatedTopics: ['two-voices', 'staged-analysis'],
    relatedCases: ['coffee'],
  },
  {
    slug: 'methodology-capability',
    title: 'How We Calculate Capability',
    subtitle: 'Understanding Cp, Cpk, and Process Capability',
    description:
      'Learn how VariScout calculates process capability indices and when to trust them.',
    color: '#22c55e',
    colorClass: 'text-green-500',
    icon: '🎯',
    sections: [
      {
        id: 'quick-answer',
        title: 'Quick Answer',
        content:
          'Cp measures how well your process could fit within spec limits (potential capability). Cpk measures how well it actually fits, accounting for centering (actual capability). Both compare your process spread to the specification width.',
      },
      {
        id: 'cp-formula',
        title: 'Cp Formula',
        content:
          'Cp = (USL - LSL) / (6σ). This compares the specification width to 6 standard deviations of your process. A Cp of 1.0 means your process just fits within specs. Cp ≥ 1.33 is typically considered "capable".',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Cp = 1.0', description: 'Process width equals spec width (just fits)' },
              { title: 'Cp = 1.33', description: 'Spec is 33% wider than process (good)' },
              { title: 'Cp = 2.0', description: 'Spec is twice the process width (excellent)' },
            ],
          },
        },
      },
      {
        id: 'cpk-formula',
        title: 'Cpk Formula',
        content:
          'Cpk = min(CPU, CPL) where CPU = (USL - mean)/(3σ) and CPL = (mean - LSL)/(3σ). Cpk penalizes off-center processes. If Cpk is much lower than Cp, your process is shifted toward one spec limit.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Cp (Potential)',
              subtitle: 'Ignores centering',
              items: [
                'Compares spread to spec width',
                'Assumes perfect centering',
                '"What could be possible"',
                'Same for any mean position',
              ],
              color: 'green',
            },
            right: {
              title: 'Cpk (Actual)',
              subtitle: 'Accounts for centering',
              items: [
                'Considers where mean is located',
                'Penalizes off-center processes',
                '"What is actually happening"',
                'Cpk ≤ Cp always',
              ],
              color: 'blue',
            },
          },
        },
      },
      {
        id: 'worked-example',
        title: 'Worked Example',
        content:
          'Coffee fill: LSL=249g, USL=251g, mean=250.2g, σ=0.3g. Cp = (251-249)/(6×0.3) = 2/1.8 = 1.11. CPU = (251-250.2)/(3×0.3) = 0.8/0.9 = 0.89. CPL = (250.2-249)/(3×0.3) = 1.2/0.9 = 1.33. Cpk = min(0.89, 1.33) = 0.89. The process is shifted high, reducing capability.',
        visual: {
          type: 'chart',
          data: {
            toolSlug: 'capability',
            sampleKey: 'journey-before',
            height: 350,
            caption:
              'Capability histogram showing process distribution relative to specification limits (Cpk ~0.8)',
          },
        },
      },
      {
        id: 'assumptions',
        title: 'Critical Assumptions',
        content:
          'Capability indices assume your process is STABLE (in statistical control). If your I-Chart shows special causes, Cp/Cpk are meaningless—fix stability first. VariScout always shows I-Chart alongside capability for this reason.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Stability Required', description: 'Process must be in control first' },
              {
                title: 'Normal Distribution',
                description: 'Approximately normal data (check prob plot)',
              },
              {
                title: 'Short-term vs Long-term',
                description: 'Cp/Cpk are short-term; Pp/Ppk include more variation',
              },
            ],
          },
        },
      },
      {
        id: 'ppk-note',
        title: 'Note on Pp/Ppk',
        content:
          'VariScout calculates Cp/Cpk (within-group variation). For long-term performance indices (Pp/Ppk), which include all sources of variation, use specialized SPC software. The difference matters when your process has between-subgroup variation.',
      },
    ],
    relatedTools: ['capability', 'i-chart'],
    relatedTopics: ['two-voices', 'methodology-control-limits'],
    relatedCases: ['cookie-weight', 'coffee'],
  },
  {
    slug: 'methodology-eta-squared',
    title: 'Understanding Eta-Squared (η²)',
    subtitle: 'Effect Size and Cumulative Variation Explained',
    description:
      'How VariScout measures the strength of relationships and tracks cumulative variation through drill-down analysis.',
    color: '#f59e0b',
    colorClass: 'text-amber-500',
    icon: '📊',
    sections: [
      {
        id: 'quick-answer',
        title: 'Quick Answer',
        content:
          'Eta-squared (η²) tells you how much of the total variation is explained by a factor. If η² = 0.67 for "Machine", then 67% of the variation in your data can be attributed to differences between machines.',
      },
      {
        id: 'formula',
        title: 'The Formula',
        content:
          'η² = SS_between / SS_total. Where SS_between is the variation between groups (explained by the factor), and SS_total is the total variation in the data. The result is always between 0 and 1 (or 0% to 100%).',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'SS_between',
                description: 'Sum of squared differences between group means and overall mean',
              },
              {
                title: 'SS_total',
                description: 'Sum of squared differences between each point and overall mean',
              },
              { title: 'η²', description: 'Ratio of explained variation to total variation' },
            ],
          },
        },
      },
      {
        id: 'interpretation',
        title: 'How to Interpret η²',
        content:
          'Unlike p-values, η² tells you practical significance—how much the factor actually matters. Common thresholds: small effect (< 0.06), medium effect (0.06-0.14), large effect (> 0.14). In quality work, we often see effects > 0.20.',
        visual: {
          type: 'diagram',
          data: {
            steps: [
              { label: 'η² < 0.06', description: 'Small effect - factor explains little' },
              { label: '0.06 ≤ η² < 0.14', description: 'Medium effect - noticeable difference' },
              { label: 'η² ≥ 0.14', description: 'Large effect - factor is important' },
            ],
          },
        },
      },
      {
        id: 'cumulative-tracking',
        title: 'Cumulative Variation Tracking',
        content:
          'As you drill down through factors, VariScout shows cumulative variation explained. If Machine explains 67% and then Shift explains 89% of what remains, the cumulative is 67% × (1 - 0.89) = still tracking toward 100% explained.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Level 1: Machine', description: '67% explained, 33% unexplained' },
              {
                title: 'Level 2: Within Machine 3, Shift',
                description: '89% of remaining explained',
              },
              {
                title: 'Cumulative',
                description: 'Drilling down narrows the unexplained variation',
              },
            ],
          },
        },
      },
      {
        id: 'vs-pvalue',
        title: 'η² vs p-value',
        content:
          'P-value answers "is there a statistically significant difference?" η² answers "how big is that difference?" A tiny difference can be statistically significant with enough data. η² tells you if the difference is worth acting on.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'p-value',
              subtitle: 'Statistical significance',
              items: [
                '"Is the difference real?"',
                'Depends on sample size',
                'p < 0.05 = significant',
                "Doesn't tell you effect size",
              ],
              color: 'neutral',
            },
            right: {
              title: 'η² (eta-squared)',
              subtitle: 'Practical significance',
              items: [
                '"How big is the effect?"',
                'Independent of sample size',
                '> 0.14 = large effect',
                'Tells you if it matters',
              ],
              color: 'amber',
            },
          },
        },
      },
      {
        id: 'in-variscout',
        title: 'Where to See η² in VariScout',
        content:
          'η² appears in the ANOVA results below Boxplot charts. The Variation Funnel shows cumulative η² as you drill down. The Pareto chart ranking uses η² to order factors by explanatory power.',
        visual: {
          type: 'chart',
          data: {
            toolSlug: 'boxplot',
            sampleKey: 'coffee',
            height: 350,
            caption:
              'Boxplot comparing drying beds - the η² value shows how much variation is explained by the bed factor',
          },
        },
      },
    ],
    relatedTools: ['boxplot', 'pareto'],
    relatedTopics: ['four-pillars', 'eda-philosophy'],
    relatedCases: ['bottleneck', 'coffee'],
  },
  {
    slug: 'methodology-our-approach',
    title: 'Our Approach to Quality Analysis',
    subtitle: 'When to Use VariScout and When to Use Other Tools',
    description:
      'VariScout is designed for exploration and teaching. Learn when to use specialized tools instead.',
    color: '#8b5cf6',
    colorClass: 'text-purple-500',
    icon: '🧭',
    sections: [
      {
        id: 'quick-answer',
        title: 'Quick Answer',
        content:
          'VariScout excels at visual exploration, hypothesis generation, and teaching quality concepts. For formal SPC, certification requirements, or specialized control charts, use Minitab, JMP, or similar statistical software.',
      },
      {
        id: 'what-variscout-is',
        title: 'What VariScout Is For',
        content:
          'VariScout is an exploration and teaching tool. It makes quality analysis accessible without statistical software expertise. The Four Pillars framework helps users ask the right questions. Cross-chart filtering enables rapid hypothesis testing.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Quick Exploration', description: 'Paste data, see charts instantly' },
              { title: 'Hypothesis Generation', description: 'Find where to focus investigation' },
              { title: 'Teaching Tool', description: 'Learn Lean Six Sigma concepts visually' },
              { title: 'Communication', description: 'Share visual insights with stakeholders' },
            ],
          },
        },
      },
      {
        id: 'simpler-methods',
        title: 'Why Simpler Calculations?',
        content:
          "We chose simpler calculation methods (like 3σ for control limits instead of moving range) because they're easier to explain, match what spreadsheet users expect, and work well for the exploratory use case. When exact methodology matters, use specialized tools.",
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'VariScout Approach',
              subtitle: 'Simple & Accessible',
              items: [
                'Standard 3σ control limits',
                'Sample standard deviation',
                'Cp/Cpk (short-term)',
                'One-way ANOVA with η²',
              ],
              color: 'purple',
            },
            right: {
              title: 'Specialized SPC',
              subtitle: 'Industry Standard',
              items: [
                'Moving range (MR̄) based limits',
                'Xbar-R, Xbar-S charts',
                'Pp/Ppk (long-term)',
                'Multi-factor ANOVA, DOE',
              ],
              color: 'neutral',
            },
          },
        },
      },
      {
        id: 'when-specialized',
        title: 'When to Use Specialized Tools',
        content:
          "Use Minitab, JMP, or similar when: formal SPC documentation is required, you need specific control chart types (Xbar-R, CUSUM, EWMA), certification audits require standard methodology, or you're doing design of experiments (DOE).",
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Formal SPC',
                description: 'Automotive (AIAG), aerospace, medical device requirements',
              },
              {
                title: 'Specific Charts',
                description: 'Xbar-R, Xbar-S, CUSUM, EWMA, attribute charts',
              },
              { title: 'Long-term Studies', description: 'Pp/Ppk with rational subgroups' },
              { title: 'DOE', description: 'Design of experiments, full/fractional factorials' },
            ],
          },
        },
      },
      {
        id: 'two-voices-innovation',
        title: 'The Two Voices on One Chart',
        content:
          "Unlike most SPC software, VariScout shows both control limits (Voice of the Process) and spec limits (Voice of the Customer) on the same I-Chart. This is unconventional but helps learners understand the difference. It's teaching-first design.",
        visual: {
          type: 'quote',
          data: {
            quote:
              'Seeing both voices together helps users understand they\'re answering different questions: "Is my process stable?" and "Does my product pass?"',
            author: 'VariScout Design Philosophy',
          },
        },
      },
      {
        id: 'when-variscout-shines',
        title: 'When VariScout Shines',
        content:
          'VariScout is the right tool when you want to quickly explore data, teach quality concepts, share visual insights with non-statisticians, or prototype an analysis before formalizing it in statistical software.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Paste & Explore', description: 'No data import wizard, no setup' },
              { title: 'Train Teams', description: 'Visual learning, immediate feedback' },
              { title: 'Share Insights', description: 'Non-statisticians understand the visuals' },
              {
                title: 'Prototype Analysis',
                description: 'Find the story, then formalize in SPC software',
              },
            ],
          },
        },
      },
    ],
    relatedTools: ['i-chart', 'boxplot', 'pareto', 'capability'],
    relatedTopics: ['eda-philosophy', 'four-pillars', 'two-voices'],
    relatedCases: ['bottleneck', 'coffee'],
  },
  {
    slug: 'methodology-staged-analysis',
    title: 'How We Calculate Staged Control Limits',
    subtitle: 'Independent Statistics for Each Process Phase',
    description:
      'When you enable staged analysis, each phase gets its own control limits calculated independently, revealing improvements that combined analysis hides.',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
    icon: '📊',
    sections: [
      {
        id: 'quick-answer',
        title: 'Quick Answer',
        content:
          "Each stage gets its own mean and control limits (mean ± 3σ) calculated from only that stage's data. This reveals improvements that combined analysis hides.",
      },
      {
        id: 'formula',
        title: 'The Formulas',
        content:
          'For each stage independently: Mean_stage = Σ(values) / n, σ_stage = standard deviation of stage values, UCL_stage = Mean_stage + 3σ_stage, LCL_stage = Mean_stage - 3σ_stage. Each stage is treated as a separate process.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Mean per stage', description: 'Average of values within that stage only' },
              {
                title: 'σ per stage',
                description: "Standard deviation of that stage's values only",
              },
              {
                title: 'UCL/LCL per stage',
                description: "Mean ± 3σ using that stage's statistics",
              },
            ],
          },
        },
      },
      {
        id: 'worked-example',
        title: 'Worked Example: Before/After Maintenance',
        content:
          'Coffee fill weights. Before maintenance (40 samples): mean = 251.0g, σ = 3.2g, UCL = 260.6g, LCL = 241.4g. After maintenance (40 samples): mean = 250.0g, σ = 1.2g, UCL = 253.6g, LCL = 246.4g. Combined would show: mean = 250.5g, σ = 2.8g - hiding the 63% reduction in variation!',
        visual: {
          type: 'chart',
          data: {
            toolSlug: 'i-chart',
            sampleKey: 'journey-before',
            height: 350,
            caption:
              'I-Chart showing process variation before improvement (Cpk ~0.8) - with staged analysis, you could compare this directly to the improved state',
          },
        },
      },
      {
        id: 'why-matters',
        title: 'Why This Matters',
        content:
          'Combined control limits average the before and after performance. If your "after" data is much better, the combined limits won\'t show it. Staged limits let you see each phase independently - proving whether improvements actually worked.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Prove Improvements', description: 'Show reduced variation after a change' },
              { title: 'Detect Shifts', description: 'See when the process mean moved' },
              { title: 'Compare Batches', description: 'Different materials or suppliers' },
              { title: 'Track Progress', description: 'Before/after each improvement cycle' },
            ],
          },
        },
      },
      {
        id: 'in-variscout',
        title: 'Using Staged Analysis in VariScout',
        content:
          'In VariScout, staged analysis is activated by selecting a Stage column. The I-Chart then shows separate control limit bands for each stage value, with vertical dividers marking stage boundaries.',
        visual: {
          type: 'diagram',
          data: {
            steps: [
              {
                label: 'Add Stage Column',
                description: 'Your data needs a column like "Before"/"After"',
              },
              {
                label: 'Select in Dashboard',
                description: 'Choose the stage column from the dropdown',
              },
              {
                label: 'View Separate Limits',
                description: 'Each stage gets its own UCL, Mean, LCL',
              },
              { label: 'Compare Phases', description: 'Tighter limits = less variation' },
            ],
          },
        },
      },
      {
        id: 'assumptions',
        title: 'Assumptions & Best Practices',
        content:
          'Each stage should have enough data (10+ points) for meaningful control limits. Stages should represent real process changes, not arbitrary splits. Order matters - stages are displayed in the order they appear in your data.',
        visual: {
          type: 'list',
          data: {
            items: [
              { title: 'Minimum 10 points', description: 'Each stage needs sufficient data' },
              {
                title: 'Meaningful boundaries',
                description: 'Stages should represent real changes',
              },
              {
                title: 'Independence',
                description: 'Data within each stage should be independent',
              },
            ],
          },
        },
      },
    ],
    relatedTools: ['i-chart'],
    relatedTopics: ['staged-analysis', 'methodology-control-limits', 'two-voices'],
    relatedCases: ['hospital-ward'],
  },
  {
    slug: 'control-charts',
    title: 'Control Charts & Special Cause Detection',
    subtitle: 'Understanding the Voice of Process through Control Limits',
    description:
      'Learn how control charts distinguish special cause variation (unusual events) from common cause variation (random noise), enabling data-driven process improvement.',
    color: '#ef4444',
    colorClass: 'text-red-500',
    icon: '🎯',
    sections: [
      {
        id: 'intro',
        title: 'What Are Control Charts?',
        content:
          'Control charts are the primary tool for Statistical Process Control (SPC). They reveal whether your process is stable (predictable) or unstable (unpredictable), helping you focus improvement efforts where they matter most.',
        visual: {
          type: 'chart',
          data: {
            toolSlug: 'i-chart',
            sampleKey: 'coffee',
            height: 300,
            caption:
              'Example I-Chart showing control limits (dashed red), mean (solid blue), and data points',
          },
        },
      },
      {
        id: 'two-voices',
        title: 'Voice of Process vs Voice of Customer',
        content:
          'Control charts listen to the Voice of Process (what the process naturally does) through control limits. This is different from specification limits (Voice of Customer - what customers require). A stable process may still produce defects if control limits are wider than spec limits.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Control Limits',
              subtitle: 'Voice of Process',
              items: [
                'UCL/LCL calculated from data',
                'Show natural process variation',
                'Detect special cause (instability)',
                'σ-based (3 standard deviations)',
                'Red dashed lines on chart',
              ],
              color: 'blue',
            },
            right: {
              title: 'Spec Limits',
              subtitle: 'Voice of Customer',
              items: [
                'USL/LSL set by customer',
                'Define acceptable product',
                'Detect defects (non-conformance)',
                'Requirement-based',
                'Orange dashed lines on chart',
              ],
              color: 'green',
            },
          },
        },
      },
      {
        id: 'special-vs-common',
        title: 'Special Cause vs Common Cause Variation',
        content:
          'The fundamental distinction in SPC: Special cause variation signals something unusual that requires investigation. Common cause variation is the natural random noise inherent to all stable processes.',
        visual: {
          type: 'comparison',
          data: {
            left: {
              title: 'Special Cause',
              subtitle: '🔴 Red Dots = Investigate',
              items: [
                'Point above UCL or below LCL',
                'Nelson Rule 2: 9 consecutive points on one side',
                'Indicates process shift or unusual event',
                'Assignable cause - can be identified',
                'Action required: Find and fix',
              ],
              color: 'amber',
            },
            right: {
              title: 'Common Cause',
              subtitle: '🔵 Blue Dots = No Action',
              items: [
                'Points within control limits',
                'Random variation around mean',
                'Natural process behavior',
                'Many small factors',
                'Action: Accept or improve entire system',
              ],
              color: 'cyan',
            },
          },
        },
      },
      {
        id: 'point-colors',
        title: 'What Do Point Colors Mean?',
        content:
          'VariScout uses color coding to help you quickly identify process status and required actions.',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: '🔵 Blue Dots (Common Cause)',
                description:
                  'Points within control limits showing random variation. Process is stable and predictable. No action required - attempting to "fix" common cause leads to tampering (making things worse).',
              },
              {
                title: '🔴 Red Dots (Special Cause)',
                description:
                  'Points outside control limits (above UCL, below LCL) or showing special patterns (Nelson Rule 2). Process is unstable - something unusual happened. Investigation required to find the assignable cause.',
              },
              {
                title: '🟠 Orange Dots (Out-of-Spec)',
                description:
                  'Points outside specification limits (above USL, below LSL). Product does not meet customer requirements. These are defects that may need rework or scrap, regardless of process stability.',
              },
            ],
          },
        },
      },
      {
        id: 'nelson-rule-2',
        title: 'Nelson Rule 2: Detecting Process Shifts',
        content:
          'Nelson Rule 2 detects persistent shifts in the process: 9 or more consecutive points on the same side of the mean. This pattern signals that something systematic changed (new material, different operator, adjusted settings, etc.).',
        visual: {
          type: 'diagram',
          data: {
            steps: [
              {
                label: '1. Monitor',
                description: 'Chart tracks consecutive points relative to mean',
              },
              {
                label: '2. Detect',
                description: '9+ consecutive points all above (or all below) mean triggers alert',
              },
              {
                label: '3. Visualize',
                description: 'VariScout highlights sequence with connector line and markers',
              },
              {
                label: '4. Investigate',
                description: 'Check timeline: What changed when the sequence started?',
              },
            ],
          },
        },
      },
      {
        id: 'calculation',
        title: 'How Control Limits Are Calculated',
        content:
          'Control limits use 3-sigma bounds to capture 99.73% of normal process variation. If the process is stable (only common cause), ~99.7% of points fall within these limits.',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Mean (Center Line)',
                description: 'X̄ = Average of all data points. Shows process center.',
              },
              {
                title: 'Standard Deviation',
                description: 'σ = Measure of spread. Quantifies variation magnitude.',
              },
              {
                title: 'Upper Control Limit (UCL)',
                description: 'UCL = X̄ + 3σ. Upper boundary of natural variation.',
              },
              {
                title: 'Lower Control Limit (LCL)',
                description: 'LCL = X̄ - 3σ. Lower boundary of natural variation.',
              },
            ],
          },
        },
      },
      {
        id: 'key-insight',
        title: 'The Power of Control Charts',
        content:
          'Control charts prevent two costly mistakes: (1) Tampering - reacting to common cause as if it were special, introducing more variation. (2) Under-reaction - ignoring special cause, allowing problems to persist.',
        visual: {
          type: 'quote',
          data: {
            quote:
              'If I had to reduce all of quality improvement to just one word, it would be: variation. Understanding variation is the key to improvement.',
            author: 'W. Edwards Deming',
          },
        },
      },
      {
        id: 'next-steps',
        title: 'Applying Control Charts',
        content:
          'Start by charting your key process output. Look for special cause patterns. When you find red dots, investigate the timeline - what was different? When you see only blue dots (in-control), focus on improving the entire system rather than reacting to individual points.',
        visual: {
          type: 'list',
          data: {
            items: [
              {
                title: 'Step 1: Collect baseline data',
                description: '20-30 consecutive measurements to establish initial control limits',
              },
              {
                title: 'Step 2: Calculate control limits',
                description: 'Use VariScout to automatically compute UCL, mean, and LCL',
              },
              {
                title: 'Step 3: Monitor for special cause',
                description: 'Continue charting new data, looking for red dots or patterns',
              },
              {
                title: 'Step 4: Investigate and improve',
                description: 'When special cause appears, find the root cause and take action',
              },
            ],
          },
        },
      },
    ],
    relatedTools: ['i-chart', 'boxplot', 'capability'],
    relatedTopics: ['two-voices', 'four-pillars', 'eda-philosophy', 'staged-analysis'],
    relatedCases: ['coffee', 'bottleneck', 'cookie-weight'],
  },
];

export function getLearnTopicBySlug(slug: string): LearnTopic | undefined {
  return LEARN_TOPICS.find(t => t.slug === slug);
}

export function getAllLearnSlugs(): string[] {
  return LEARN_TOPICS.map(t => t.slug);
}
