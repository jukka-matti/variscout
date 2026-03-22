# VariScout

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
pnpm dev             # PWA dev server (localhost:5173)
pnpm --filter @variscout/azure-app dev  # Azure app dev server

pnpm build           # Build all packages and apps (runs turbo build)
pnpm test            # Run Vitest tests (all packages, runs turbo test)
pnpm --filter @variscout/core test      # Core package tests only
pnpm --filter @variscout/pwa test       # PWA tests only
pnpm --filter @variscout/azure-app test # Azure app tests only

claude --chrome              # Enable Chrome browser for E2E testing

pnpm storybook       # Component catalog (localhost:6006)
pnpm build-storybook # Build static Storybook

pnpm docs:dev        # Starlight doc site (localhost:4321)
pnpm docs:build      # Build static doc site
pnpm docs:check      # Diagram health check (export counts, type drift)

npx ruflo@latest security scan --depth full  # OWASP security scan
npx ruflo@latest security cve --check        # CVE check

# Swarm dev workflows (ADR-013)
# Parallel test: use Task agents to run vitest across all packages concurrently
# Security scan: targeted OWASP on Azure auth/storage modules
# Code review: multi-agent read-only review for cross-package changes
```

## Retrieval-Led Reasoning

**IMPORTANT**: Prefer retrieval-led reasoning over pre-training-led reasoning for VariScout tasks. Always read relevant docs before generating code.

## Documentation

| Directory               | Contents                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| docs/01-vision/         | Philosophy, Four Lenses, Two Voices, methodology, evaluations         |
| docs/02-journeys/       | 9 personas, user flows, 13 use cases                                  |
| docs/03-features/       | Analysis, workflows, data, navigation, learning                       |
| docs/04-cases/          | 8 case studies with demo data                                         |
| docs/05-technical/      | Architecture, implementation, integrations                            |
| docs/06-design-system/  | Colors, typography, components, charts, patterns                      |
| docs/07-decisions/      | ADR-001 through ADR-042                                               |
| docs/08-products/       | Azure, PWA, website specs, feature-parity matrix                      |
| docs/09-tutorials/      | Planned step-by-step guides                                           |
| docs/superpowers/specs/ | Design specs from brainstorming sessions (see index.md)               |
| docs/archive/           | HISTORICAL ONLY — removed features, do not reference for current work |

## Task → Documentation

| Domain                     | Read First                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statistics / Capability    | docs/03-features/analysis/, packages/core/src/stats/, docs/05-technical/statistics-reference.md                                                             |
| Charts                     | docs/06-design-system/charts/, .claude/rules/charts.md                                                                                                      |
| Azure app / Auth / Storage | docs/08-products/azure/                                                                                                                                     |
| Data input / Parser        | docs/03-features/data/, packages/core/src/parser/                                                                                                           |
| Design system / UI         | docs/06-design-system/                                                                                                                                      |
| Workflows / Analysis       | docs/03-features/workflows/                                                                                                                                 |
| Journey model / Phases     | docs/05-technical/architecture/mental-model-hierarchy.md, journey-phase-screen-mapping.md                                                                   |
| Investigation / Findings   | adr-015, adr-020, docs/03-features/workflows/investigation-to-action.md, hypothesis-investigation.md                                                        |
| AI integration             | adr-019, docs/05-technical/architecture/ai-journey-integration.md, ai-architecture.md, ai-context-engineering.md                                            |
| AI action tools            | adr-029, packages/core/src/ai/actionTools.ts, packages/ui/src/components/CoScoutPanel/ActionProposalCard.tsx                                                |
| Admin experience           | docs/02-journeys/personas/admin-aino.md, docs/02-journeys/flows/azure-admin-operations.md, docs/superpowers/specs/2026-03-19-admin-experience-design.md     |
| Deployment / CI            | docs/05-technical/implementation/deployment.md, .github/workflows/                                                                                          |
| Architecture / ADRs        | docs/07-decisions/, docs/05-technical/                                                                                                                      |
| Website                    | docs/08-products/website/, apps/website/                                                                                                                    |
| Methodology / Personas     | docs/01-vision/, docs/02-journeys/                                                                                                                          |
| Business strategy          | docs/01-vision/business-bible.md                                                                                                                            |
| Tier philosophy / Pricing  | docs/08-products/tier-philosophy.md, docs/08-products/feature-parity.md                                                                                     |
| AI user experience         | docs/05-technical/architecture/ai-journey-integration.md                                                                                                    |
| Journey traceability       | docs/02-journeys/traceability.md                                                                                                                            |
| Internationalization       | adr-025, packages/core/src/i18n/, packages/hooks/src/useLocaleState.ts, useTranslation.ts                                                                   |
| Testing                    | .claude/rules/testing.md, docs/05-technical/implementation/testing.md                                                                                       |
| File Picker / SP files     | adr-030, apps/azure/src/hooks/useFilePicker.ts, apps/azure/src/components/FileBrowseButton.tsx                                                              |
| Report View / Sharing      | adr-037, adr-030, adr-031, docs/superpowers/specs/2026-03-20-reporting-workspaces-design.md, docs/superpowers/specs/2026-03-22-mode-aware-reports-design.md |
| Verification / Staged      | adr-023, docs/03-features/analysis/staged-analysis.md                                                                                                       |
| Characteristic types       | docs/03-features/analysis/characteristic-types.md, packages/core/src/types.ts                                                                               |
| Subgroup capability        | adr-038, docs/03-features/analysis/subgroup-capability.md, packages/core/src/stats/subgroupCapability.ts                                                    |
| Data lifecycle / Append    | adr-023, apps/azure/src/hooks/useEditorDataFlow.ts                                                                                                          |
| Teams integration          | adr-016, docs/08-products/azure/authentication.md                                                                                                           |
| Platform comparison        | docs/08-products/feature-parity.md                                                                                                                          |
| Knowledge model / Glossary | docs/05-technical/architecture/knowledge-model.md, packages/core/src/glossary/                                                                              |
| Diagram health             | scripts/check-diagram-health.sh, docs/05-technical/architecture/component-map.md                                                                            |
| Documentation site         | apps/docs/ (Astro + Starlight)                                                                                                                              |
| IMPROVE Phase / Workspaces | docs/superpowers/specs/2026-03-19-improve-phase-ux-design.md, packages/ui/src/components/ImprovementPlan/                                                   |
| Improvement Prioritization | adr-035, docs/03-features/workflows/improvement-prioritization.md, docs/superpowers/specs/2026-03-20-improvement-prioritization-design.md                   |
| Yamazumi / Time Study      | adr-034, docs/03-features/analysis/yamazumi.md, packages/core/src/yamazumi/                                                                                 |
| Navigation / Views         | docs/06-design-system/patterns/navigation.md, apps/pwa/src/hooks/useAppPanels.ts, apps/azure/src/hooks/useEditorPanels.ts                                   |
| Performance / Mobile       | adr-039, docs/05-technical/implementation/system-limits.md, .claude/rules/charts.md                                                                         |
| State management / Stores  | adr-041, apps/azure/src/features/\*/ (stores co-located per feature)                                                                                        |
| Project Dashboard / Reopen | adr-042, docs/03-features/workflows/project-dashboard.md, apps/azure/src/components/ProjectDashboard.tsx                                                    |

## Repository Structure

pnpm workspaces monorepo:

```
variscout-lite/
├── .github/workflows/     # GitHub Actions CI/CD (staging deploy)
├── packages/
│   ├── core/          # @variscout/core - Stats, parser, tier, types, AI, glossary, simulation
│   ├── charts/        # @variscout/charts - Visx chart components
│   ├── data/          # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/         # @variscout/hooks - Shared React hooks
│   └── ui/            # @variscout/ui - Shared UI components
├── apps/
│   ├── pwa/           # PWA website (React + Vite)
│   ├── azure/         # Azure Team App (EasyAuth + OneDrive sync + Zustand stores + features/)
│   ├── website/       # Marketing website (Astro + React Islands)
│   └── docs/          # Documentation site (Astro + Starlight)
├── infra/             # Bicep modules + compiled ARM template + Azure Functions
└── docs/              # Documentation (see table above)
```

## Key Entry Points

| Package                                       | Key Files                                                                                                                  | Purpose                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `packages/core/src/`                          | stats/, parser/, types.ts, tier.ts, ai/, glossary/, variation/, yamazumi/                                                  | Stats engine (14 modules), parser, types, tier, AI context, glossary, simulation, yamazumi |
| `packages/charts/src/`                        | IChart, Boxplot, Pareto, Performance\*, colors.ts, useChartTheme                                                           | Chart components (see .claude/rules/charts.md)                                             |
| `packages/hooks/src/`                         | use\*.ts (see .claude/rules/monorepo.md for full list)                                                                     | 40+ shared React hooks                                                                     |
| `packages/ui/src/components/`                 | \*/ (see .claude/rules/monorepo.md for full list)                                                                          | 60+ shared UI components                                                                   |
| `packages/data/src/samples/`                  | coffee, journey, bottleneck, sachets                                                                                       | Sample datasets                                                                            |
| `apps/pwa/src/`                               | context/DataContext.tsx, components/Dashboard.tsx                                                                          | PWA state + main UI                                                                        |
| `apps/azure/src/`                             | context/DataContext.tsx, services/graphFetch.ts, auth/, hooks/useEditor\*.ts, features/\*/ (stores co-located per feature) | Azure state, storage, auth, Graph API wrapper, Zustand feature stores                      |
| `packages/ui/src/components/ImprovementPlan/` | ImprovementWorkspaceBase, SynthesisCard, IdeaGroupCard, ImprovementSummaryBar, RiskPopover, PrioritizationMatrix           | Improvement planning workspace (Azure only)                                                |
| `packages/ui/src/components/ReportView/`      | ReportViewBase, ReportSection, ReportCpkLearningLoop, ReportHypothesisSummary, ReportImprovementSummary                    | Report view with 3 workspace-aligned types + audience toggle                               |
| `infra/`                                      | main.bicep, modules/\*.bicep, mainTemplate.json, functions/                                                                | Bicep modules, compiled ARM template, Azure Functions                                      |

## Key Patterns

- **No Backend**: All processing in browser, data stays local
- **Shared Logic**: Statistics in `@variscout/core`, charts in `@variscout/charts`
- **Props-based Charts**: Chart components accept data via props (not context)
- **Persistence**: PWA = session-only (no persistence); Azure Standard = IndexedDB (local); Azure Team = IndexedDB + OneDrive sync
- **Offline-first**: PWA works without internet after first visit
- **Zustand Feature Stores**: Azure app uses Zustand stores per feature domain (panels, findings, investigation, improvement, AI), co-located in `features/*/` directories (Feature-Sliced Design). DataContext stays as React Context for the core data pipeline. Components use store selectors instead of prop drilling.

See `.claude/rules/` for code style, chart, testing, and monorepo conventions.

## Products & Pricing

| Product        | Distribution      | Pricing    | Features                                          | Status      |
| -------------- | ----------------- | ---------- | ------------------------------------------------- | ----------- |
| Azure Standard | Azure Marketplace | €79/month  | Full analysis with CoScout AI, local file storage | **PRIMARY** |
| Azure Team     | Azure Marketplace | €199/month | + Teams, OneDrive, SharePoint, Knowledge Base     | **PRIMARY** |
| PWA            | Public URL        | FREE       | Training & education (forever free)               | Production  |

See [ADR-007](docs/07-decisions/adr-007-azure-marketplace-distribution.md) and [ADR-033](docs/07-decisions/adr-033-pricing-simplification.md) for distribution and pricing strategy.
