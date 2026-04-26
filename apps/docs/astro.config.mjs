import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  integrations: [
    starlight({
      title: 'VariScout Docs',
      description: 'Lightweight, offline-first variation analysis for quality professionals',
      defaultLocale: 'en',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/variscout/variscout-lite',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        // ── Domain ──
        {
          label: 'Domain',
          items: [
            {
              label: 'Vision',
              items: [
                { label: 'Overview', slug: '01-vision' },
                { label: 'Philosophy', slug: '01-vision/philosophy' },
                {
                  label: 'Product Overview',
                  slug: '01-vision/product-overview',
                },
                {
                  label: 'Methodology',
                  slug: '01-vision/methodology',
                },
                {
                  label: 'Market Analysis',
                  slug: '01-vision/market-analysis',
                },
                {
                  label: 'Progressive Stratification',
                  slug: '01-vision/progressive-stratification',
                },
                {
                  label: 'Four Lenses',
                  items: [
                    { label: 'Overview', slug: '01-vision/four-lenses' },
                    { label: 'Change', slug: '01-vision/four-lenses/change' },
                    { label: 'Flow', slug: '01-vision/four-lenses/flow' },
                    {
                      label: 'Failure',
                      slug: '01-vision/four-lenses/failure',
                    },
                    { label: 'Value', slug: '01-vision/four-lenses/value' },
                    {
                      label: 'Drill-Down',
                      slug: '01-vision/four-lenses/drilldown',
                    },
                  ],
                },
                {
                  label: 'Two Voices',
                  items: [
                    { label: 'Overview', slug: '01-vision/two-voices' },
                    {
                      label: 'Control Limits',
                      slug: '01-vision/two-voices/control-limits',
                    },
                    {
                      label: 'Spec Limits',
                      slug: '01-vision/two-voices/spec-limits',
                    },
                    {
                      label: 'Variation Types',
                      slug: '01-vision/two-voices/variation-types',
                    },
                    {
                      label: 'Scenarios',
                      slug: '01-vision/two-voices/scenarios',
                    },
                  ],
                },
                {
                  label: 'Evaluations',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: '01-vision/evaluations' },
                    {
                      label: 'Investigation Flow Map',
                      slug: '01-vision/evaluations/investigation-flow-map',
                    },
                    {
                      label: 'Design Brief',
                      slug: '01-vision/evaluations/design-brief-guided-investigation',
                    },
                    {
                      label: 'Competitive',
                      collapsed: true,
                      items: [
                        {
                          label: 'Minitab',
                          slug: '01-vision/evaluations/competitive/minitab-benchmark',
                        },
                        {
                          label: 'JMP',
                          slug: '01-vision/evaluations/competitive/jmp-benchmark',
                        },
                        {
                          label: 'Tableau',
                          slug: '01-vision/evaluations/competitive/tableau-benchmark',
                        },
                        {
                          label: 'Power BI',
                          slug: '01-vision/evaluations/competitive/powerbi-benchmark',
                        },
                        {
                          label: 'EDAScout',
                          slug: '01-vision/evaluations/competitive/edascout-benchmark',
                        },
                        {
                          label: 'Other',
                          slug: '01-vision/evaluations/competitive/minor-competitors',
                        },
                      ],
                    },
                    // Patterns archived to docs/archive/evaluation-patterns/
                    {
                      label: 'Tensions',
                      collapsed: true,
                      items: [
                        {
                          label: 'Discoverability',
                          slug: '01-vision/evaluations/tensions/discoverability',
                        },
                        {
                          label: 'Factor Ordering',
                          slug: '01-vision/evaluations/tensions/factor-ordering',
                        },
                        {
                          label: 'Hierarchy Assumption',
                          slug: '01-vision/evaluations/tensions/hierarchy-assumption',
                        },
                        {
                          label: 'Mobile Screen',
                          slug: '01-vision/evaluations/tensions/mobile-screen-budget',
                        },
                        {
                          label: 'Path Dependency',
                          slug: '01-vision/evaluations/tensions/path-dependency',
                        },
                        {
                          label: 'When to Stop',
                          slug: '01-vision/evaluations/tensions/when-to-stop',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              label: 'Journeys',
              items: [
                {
                  label: 'Personas',
                  collapsed: true,
                  items: [
                    {
                      label: 'Green Belt Gary',
                      slug: '02-journeys/personas/green-belt-gary',
                    },
                    {
                      label: 'Curious Carlos',
                      slug: '02-journeys/personas/curious-carlos',
                    },
                    {
                      label: 'OpEx Olivia',
                      slug: '02-journeys/personas/opex-olivia',
                    },
                    {
                      label: 'Student Sara',
                      slug: '02-journeys/personas/student-sara',
                    },
                    {
                      label: 'Evaluator Erik',
                      slug: '02-journeys/personas/evaluator-erik',
                    },
                    {
                      label: 'Trainer Tina',
                      slug: '02-journeys/personas/trainer-tina',
                    },
                  ],
                },
                {
                  label: 'UX Research',
                  slug: '02-journeys/ux-research',
                },
                {
                  label: 'Use Cases',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: '02-journeys/use-cases' },
                    {
                      label: 'Batch Consistency',
                      slug: '02-journeys/use-cases/batch-consistency',
                    },
                    {
                      label: 'Bottleneck Analysis',
                      slug: '02-journeys/use-cases/bottleneck-analysis',
                    },
                    {
                      label: 'Call Center',
                      slug: '02-journeys/use-cases/call-center-performance',
                    },
                    {
                      label: 'Complaint Investigation',
                      slug: '02-journeys/use-cases/complaint-investigation',
                    },
                    {
                      label: 'Consultant Delivery',
                      slug: '02-journeys/use-cases/consultant-delivery',
                    },
                    {
                      label: 'COPQ Drilldown',
                      slug: '02-journeys/use-cases/copq-drilldown',
                    },
                    {
                      label: 'Lead Time',
                      slug: '02-journeys/use-cases/lead-time-variation',
                    },
                    {
                      label: 'On-Time Delivery',
                      slug: '02-journeys/use-cases/on-time-delivery',
                    },
                    {
                      label: 'Patient Wait Time',
                      slug: '02-journeys/use-cases/patient-wait-time',
                    },
                    {
                      label: 'Pharma OOS',
                      slug: '02-journeys/use-cases/pharma-oos',
                    },
                    {
                      label: 'Supplier PPAP',
                      slug: '02-journeys/use-cases/supplier-ppap',
                    },
                    {
                      label: 'Supplier Performance',
                      slug: '02-journeys/use-cases/supplier-performance',
                    },
                    {
                      label: 'University SPC',
                      slug: '02-journeys/use-cases/university-spc',
                    },
                  ],
                },
                {
                  label: 'User Flows',
                  collapsed: true,
                  items: [
                    {
                      label: 'SEO Learner',
                      slug: '02-journeys/flows/seo-learner',
                    },
                    {
                      label: 'Social Discovery',
                      slug: '02-journeys/flows/social-discovery',
                    },
                    {
                      label: 'Content & YouTube',
                      slug: '02-journeys/flows/content-youtube',
                    },
                    {
                      label: 'Enterprise',
                      slug: '02-journeys/flows/enterprise',
                    },
                    {
                      label: 'Return Visitor',
                      slug: '02-journeys/flows/return-visitor',
                    },
                    {
                      label: 'Azure First Analysis',
                      slug: '02-journeys/flows/azure-first-analysis',
                    },
                    {
                      label: 'Azure Daily Use',
                      slug: '02-journeys/flows/azure-daily-use',
                    },
                    {
                      label: 'Azure Team Collaboration',
                      slug: '02-journeys/flows/azure-team-collaboration',
                    },
                    {
                      label: 'Azure Teams Mobile',
                      slug: '02-journeys/flows/azure-teams-mobile',
                    },
                    {
                      label: 'Azure AI Setup',
                      slug: '02-journeys/flows/azure-ai-setup',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Case Studies',
              collapsed: true,
              items: [
                { label: 'Overview', slug: '04-cases' },
                { label: 'Bottleneck', slug: '04-cases/bottleneck' },
                { label: 'Hospital Ward', slug: '04-cases/hospital-ward' },
                { label: 'Coffee', slug: '04-cases/coffee' },
                { label: 'Packaging', slug: '04-cases/packaging' },
                { label: 'Avocado', slug: '04-cases/avocado' },
                {
                  label: 'Machine Utilization',
                  slug: '04-cases/machine-utilization',
                },
                { label: 'Oven Zones', slug: '04-cases/oven-zones' },
              ],
            },
          ],
        },

        // ── Features ──
        {
          label: 'Features',
          items: [
            { label: 'Overview', slug: '03-features' },
            { label: 'Specifications', slug: '03-features/specifications' },
            { label: 'User Guide', slug: '03-features/user-guide' },
            {
              label: 'Analysis',
              items: [
                { label: 'I-Chart', slug: '03-features/analysis/i-chart' },
                { label: 'Boxplot', slug: '03-features/analysis/boxplot' },
                { label: 'Pareto', slug: '03-features/analysis/pareto' },
                {
                  label: 'Capability',
                  slug: '03-features/analysis/capability',
                },
                {
                  label: 'Probability Plot',
                  slug: '03-features/analysis/probability-plot',
                },
                {
                  label: 'Performance Mode',
                  slug: '03-features/analysis/performance-mode',
                },
                {
                  label: 'Nelson Rules',
                  slug: '03-features/analysis/nelson-rules',
                },
                {
                  label: 'Staged Analysis',
                  slug: '03-features/analysis/staged-analysis',
                },
                {
                  label: 'Stats Panel',
                  slug: '03-features/analysis/stats-panel',
                },
                {
                  label: 'Characteristic Types',
                  slug: '03-features/analysis/characteristic-types',
                },
                {
                  label: 'Variation Decomposition',
                  slug: '03-features/analysis/variation-decomposition',
                },
              ],
            },
            {
              label: 'Workflows',
              items: [
                { label: 'Overview', slug: '03-features/workflows' },
                {
                  label: 'Process Maps',
                  slug: '03-features/workflows/process-maps',
                },
                {
                  label: 'Four Lenses',
                  slug: '03-features/workflows/four-lenses-workflow',
                },
                {
                  label: 'Drill-Down',
                  slug: '03-features/workflows/drill-down-workflow',
                },
                {
                  label: 'Performance Mode',
                  slug: '03-features/workflows/performance-mode-workflow',
                },
                {
                  label: 'Quick Check',
                  slug: '03-features/workflows/quick-check',
                },
                {
                  label: 'Deep Dive',
                  slug: '03-features/workflows/deep-dive',
                },
                {
                  label: 'Decision Trees',
                  slug: '03-features/workflows/decision-trees',
                },
                {
                  label: 'Investigation to Action',
                  slug: '03-features/workflows/investigation-to-action',
                },
                {
                  label: 'Question-Driven Investigation',
                  slug: '03-features/workflows/question-driven-investigation',
                },
                {
                  label: 'AI Journey Integration',
                  slug: '05-technical/architecture/ai-journey-integration',
                },
                {
                  label: 'Knowledge Base Search',
                  slug: '03-features/workflows/knowledge-base-search',
                },
              ],
            },
            {
              label: 'Navigation',
              items: [
                {
                  label: 'Progressive Filtering',
                  slug: '03-features/navigation/progressive-filtering',
                },
              ],
            },
            {
              label: 'Data',
              items: [
                {
                  label: 'Data Input',
                  slug: '03-features/data/data-input',
                },
                {
                  label: 'Validation',
                  slug: '03-features/data/validation',
                },
                { label: 'Storage', slug: '03-features/data/storage' },
              ],
            },
            {
              label: 'Learning',
              items: [
                {
                  label: 'Glossary Feature',
                  slug: '03-features/learning/glossary',
                },
                // Help Tooltips moved to 06-design-system/components/help-tooltip
                // Case-Based Learning moved to 02-journeys/case-based-learning
              ],
            },
          ],
        },

        // ── Architecture ──
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', slug: '05-technical' },
            { label: 'Architecture', slug: '05-technical/architecture' },
            {
              label: 'Structure',
              items: [
                {
                  label: 'Monorepo',
                  slug: '05-technical/architecture/monorepo',
                },
                {
                  label: 'Offline-First',
                  slug: '05-technical/architecture/offline-first',
                },
                {
                  label: 'Shared Packages',
                  slug: '05-technical/architecture/shared-packages',
                },
                {
                  label: 'Data Flow',
                  slug: '05-technical/architecture/data-flow',
                },
                {
                  label: 'Component Patterns',
                  slug: '05-technical/architecture/component-patterns',
                },
              ],
            },
            {
              label: 'AI Architecture',
              collapsed: true,
              items: [
                {
                  label: 'AI Integration',
                  slug: '05-technical/architecture/ai-architecture',
                },
                {
                  label: 'AI Collaborator Evolution',
                  slug: '07-decisions/adr-027-ai-collaborator-evolution',
                },
                {
                  label: 'AI Context Engineering',
                  slug: '05-technical/architecture/ai-context-engineering',
                },
                {
                  label: 'AIX Design System',
                  slug: '05-technical/architecture/aix-design-system',
                },
                // AI Readiness Review archived to docs/archive/
                {
                  label: 'Knowledge Model',
                  slug: '05-technical/architecture/knowledge-model',
                },
              ],
            },
            {
              label: 'Implementation',
              items: [
                {
                  label: 'Deployment',
                  slug: '05-technical/implementation/deployment',
                },
                {
                  label: 'Testing',
                  slug: '05-technical/implementation/testing',
                },
                {
                  label: 'Data Input',
                  slug: '05-technical/implementation/data-input',
                },
                {
                  label: 'System Limits',
                  slug: '05-technical/implementation/system-limits',
                },
                {
                  label: 'Security Scanning',
                  slug: '05-technical/implementation/security-scanning',
                },
                {
                  label: 'AI Tooling',
                  slug: '05-technical/implementation/ruflo',
                },
                {
                  label: 'Statistics Reference',
                  slug: '05-technical/statistics-reference',
                },
              ],
            },
            {
              label: 'Integrations',
              items: [
                {
                  label: 'Embed Messaging',
                  slug: '05-technical/integrations/embed-messaging',
                },
                {
                  label: 'Shared UI',
                  slug: '05-technical/integrations/shared-ui',
                },
              ],
            },
            {
              label: 'Design System',
              items: [
                { label: 'Overview', slug: '06-design-system' },
                {
                  label: 'Foundations',
                  collapsed: true,
                  items: [
                    {
                      label: 'Colors',
                      slug: '06-design-system/foundations/colors',
                    },
                    {
                      label: 'Typography',
                      slug: '06-design-system/foundations/typography',
                    },
                    {
                      label: 'Spacing',
                      slug: '06-design-system/foundations/spacing',
                    },
                    {
                      label: 'Accessibility',
                      slug: '06-design-system/foundations/accessibility',
                    },
                  ],
                },
                {
                  label: 'Charts',
                  collapsed: true,
                  items: [
                    {
                      label: 'Overview',
                      slug: '06-design-system/charts/overview',
                    },
                    {
                      label: 'I-Chart',
                      slug: '06-design-system/charts/ichart',
                    },
                    {
                      label: 'Boxplot',
                      slug: '06-design-system/charts/boxplot',
                    },
                    {
                      label: 'Pareto',
                      slug: '06-design-system/charts/pareto',
                    },
                    {
                      label: 'Capability',
                      slug: '06-design-system/charts/capability',
                    },
                    {
                      label: 'Probability Plot',
                      slug: '06-design-system/charts/probability-plot',
                    },
                    {
                      label: 'Performance Mode',
                      slug: '06-design-system/charts/performance-mode',
                    },
                    {
                      label: 'Colors',
                      slug: '06-design-system/charts/colors',
                    },
                    {
                      label: 'Responsive',
                      slug: '06-design-system/charts/responsive',
                    },
                    {
                      label: 'Hooks',
                      slug: '06-design-system/charts/hooks',
                    },
                    {
                      label: 'Shared Components',
                      slug: '06-design-system/charts/shared-components',
                    },
                  ],
                },
                {
                  label: 'Components',
                  collapsed: true,
                  items: [
                    {
                      label: 'Foundational Patterns',
                      slug: '06-design-system/components/foundational-patterns',
                    },
                    {
                      label: 'Help Tooltip',
                      slug: '06-design-system/components/help-tooltip',
                    },
                    {
                      label: 'Variation Funnel',
                      slug: '06-design-system/components/variation-funnel',
                    },
                    {
                      label: 'What-If Simulator',
                      slug: '06-design-system/components/what-if-simulator',
                    },
                    {
                      label: 'AI Components',
                      slug: '06-design-system/components/ai-components',
                    },
                    {
                      label: 'Findings',
                      slug: '06-design-system/components/findings',
                    },
                  ],
                },
                {
                  label: 'Patterns',
                  collapsed: true,
                  items: [
                    {
                      label: 'Layout',
                      slug: '06-design-system/patterns/layout',
                    },
                    {
                      label: 'Feedback',
                      slug: '06-design-system/patterns/feedback',
                    },
                    {
                      label: 'Navigation',
                      slug: '06-design-system/patterns/navigation',
                    },
                    {
                      label: 'Dashboard Design',
                      slug: '06-design-system/patterns/dashboard-design',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Products',
              items: [
                { label: 'Overview', slug: '08-products' },
                {
                  label: 'Feature Parity',
                  slug: '08-products/feature-parity',
                },
                {
                  label: 'PWA',
                  collapsed: true,
                  items: [{ label: 'Overview', slug: '08-products/pwa' }],
                },
                {
                  label: 'Azure',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: '08-products/azure' },
                    {
                      label: 'How It Works',
                      slug: '08-products/azure/how-it-works',
                    },
                    {
                      label: 'Authentication',
                      slug: '08-products/azure/authentication',
                    },
                    {
                      label: 'Blob Storage Sync',
                      slug: '08-products/azure/blob-storage-sync',
                    },
                    {
                      label: 'Marketplace',
                      slug: '08-products/azure/marketplace',
                    },
                    {
                      label: 'ARM Template',
                      slug: '08-products/azure/arm-template',
                    },
                    {
                      label: 'Pricing Tiers',
                      slug: '08-products/azure/pricing-tiers',
                    },
                    {
                      label: 'Submission Checklist',
                      slug: '08-products/azure/submission-checklist',
                    },
                    {
                      label: 'Storage',
                      slug: '08-products/azure/storage',
                    },
                  ],
                },
                {
                  label: 'Website',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: '08-products/website' },
                    {
                      label: 'Design Philosophy',
                      slug: '08-products/website/design-philosophy',
                    },
                    {
                      label: 'Content Architecture',
                      slug: '08-products/website/content-architecture',
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ── Decisions ──
        {
          label: 'Decisions',
          items: [
            { label: 'Overview', slug: '07-decisions' },
            { label: 'ADR-001 Monorepo', slug: '07-decisions/adr-001-monorepo' },
            {
              label: 'ADR-002 Visx Charts',
              slug: '07-decisions/adr-002-visx-charts',
            },
            {
              label: 'ADR-003 IndexedDB',
              slug: '07-decisions/adr-003-indexeddb',
            },
            {
              label: 'ADR-004 Offline-First',
              slug: '07-decisions/adr-004-offline-first',
            },
            {
              label: 'ADR-005 Props-Based Charts',
              slug: '07-decisions/adr-005-props-based-charts',
            },
            {
              label: 'ADR-007 Azure Distribution',
              slug: '07-decisions/adr-007-azure-marketplace-distribution',
            },
            {
              label: 'ADR-008 Website Content',
              slug: '07-decisions/adr-008-website-content-architecture',
            },
            {
              label: 'ADR-009 Violin Mode',
              slug: '07-decisions/adr-009-boxplot-violin-mode',
            },
            {
              label: 'ADR-010 Gage R&R',
              slug: '07-decisions/adr-010-gagerr-deferral',
            },
            {
              label: 'ADR-011 AI Tooling',
              slug: '07-decisions/adr-011-ai-development-tooling',
            },
            {
              label: 'ADR-012 PWA Browser',
              slug: '07-decisions/adr-012-pwa-browser-only',
            },
            {
              label: 'ADR-013 Architecture Eval',
              slug: '07-decisions/adr-013-architecture-evaluation-ddd-swarms',
            },
            {
              label: 'ADR-014 Regression Deferral',
              slug: '07-decisions/adr-014-regression-deferral',
            },
            {
              label: 'ADR-015 Investigation Board',
              slug: '07-decisions/adr-015-investigation-board',
            },
            {
              label: 'ADR-017 Fluent Design',
              slug: '07-decisions/adr-017-fluent-design-alignment',
            },
            {
              label: 'ADR-019 AI Integration',
              slug: '07-decisions/adr-019-ai-integration',
            },
            {
              label: 'ADR-020 Investigation Workflow',
              slug: '07-decisions/adr-020-investigation-workflow',
            },
            {
              label: 'ADR-023 Data Lifecycle',
              slug: '07-decisions/adr-023-data-lifecycle',
            },
            {
              label: 'ADR-025 Internationalization',
              slug: '07-decisions/adr-025-internationalization',
            },
            {
              label: 'ADR-028 Responses API',
              slug: '07-decisions/adr-028-responses-api-migration',
            },
            {
              label: 'ADR-029 AI Action Tools',
              slug: '07-decisions/adr-029-ai-action-tools',
            },
            {
              label: 'ADR-031 Report Export',
              slug: '07-decisions/adr-031-report-export',
            },
            {
              label: 'ADR-032 Evidence Communication',
              slug: '07-decisions/adr-032-evidence-communication',
            },
            {
              label: 'ADR-033 Pricing',
              slug: '07-decisions/adr-033-pricing-simplification',
            },
            {
              label: 'ADR-034 Yamazumi',
              slug: '07-decisions/adr-034-yamazumi-analysis-mode',
            },
            {
              label: 'ADR-035 Improvement Prioritization',
              slug: '07-decisions/adr-035-improvement-prioritization',
            },
            {
              label: 'ADR-036 No Russian',
              slug: '07-decisions/adr-036-no-russian-language',
            },
            {
              label: 'ADR-037 Reporting Workspaces',
              slug: '07-decisions/adr-037-reporting-workspaces',
            },
            {
              label: 'ADR-038 Subgroup Capability',
              slug: '07-decisions/adr-038-subgroup-capability',
            },
            {
              label: 'ADR-039 Mobile Performance',
              slug: '07-decisions/adr-039-mobile-performance-architecture',
            },
            {
              label: 'ADR-040 Bicep Migration',
              slug: '07-decisions/adr-040-bicep-migration',
            },
            {
              label: 'ADR-041 Zustand Stores',
              slug: '07-decisions/adr-041-zustand-feature-stores',
            },
            {
              label: 'ADR-042 Project Dashboard',
              slug: '07-decisions/adr-042-project-dashboard',
            },
            {
              label: 'ADR-044 Architectural Review',
              slug: '07-decisions/adr-044-architectural-review',
            },
            {
              label: 'ADR-045 Modular Architecture',
              slug: '07-decisions/adr-045-modular-architecture',
            },
            {
              label: 'ADR-046 Event-Driven',
              slug: '07-decisions/adr-046-event-driven-architecture',
            },
            {
              label: 'ADR-047 Strategy Pattern',
              slug: '07-decisions/adr-047-analysis-mode-strategy',
            },
            {
              label: 'ADR-048 ESLint Boundaries',
              slug: '07-decisions/adr-048-eslint-boundaries',
            },
            {
              label: 'ADR-049 Knowledge Catalyst',
              slug: '07-decisions/adr-049-coscout-context-and-memory',
            },
            {
              label: 'ADR-050 Wide-Form Stack',
              slug: '07-decisions/adr-050-wide-form-stack-columns',
            },
            {
              label: 'ADR-051 Many Categories',
              slug: '07-decisions/adr-051-chart-many-categories',
            },
            {
              label: 'ADR-052 Factor Intelligence',
              slug: '07-decisions/adr-052-factor-intelligence',
            },
            {
              label: 'ADR-053 Question-Driven EDA',
              slug: '07-decisions/adr-053-question-driven-investigation',
            },
            {
              label: 'ADR-054 Mode-Aware Questions',
              slug: '07-decisions/adr-054-mode-aware-question-strategy',
            },
            {
              label: 'ADR-059 Web-First Architecture',
              slug: '07-decisions/adr-059-web-first-deployment-architecture',
            },
            {
              label: 'ADR-072 Process Hub Storage',
              slug: '07-decisions/adr-072-process-hub-storage-and-coscout-context',
            },
            {
              label: 'Product Audit Feb 2026',
              slug: '07-decisions/audit-2026-02-state-of-product',
            },
          ],
        },

        // ── Tutorials ──
        {
          label: 'Tutorials',
          items: [{ label: 'Overview', slug: '09-tutorials' }],
        },

        // ── External Links ──
        {
          label: 'Tools',
          items: [
            {
              label: 'Storybook',
              link: 'http://localhost:6006',
              attrs: { target: '_blank' },
            },
          ],
        },
      ],
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['zod'],
    },
  },
  markdown: {
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'pre-mermaid',
        },
      ],
    ],
  },
});
