# VariScout

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
pnpm dev             # PWA dev server (localhost:5173)
pnpm --filter @variscout/azure-app dev  # Azure app dev server

pnpm build           # Build all packages and apps
pnpm test            # Run Vitest tests (all packages)
pnpm --filter @variscout/core test      # Core package tests only
pnpm --filter @variscout/pwa test       # PWA tests only
pnpm --filter @variscout/azure-app test # Azure app tests only

claude --chrome              # Enable Chrome browser for E2E testing

pnpm storybook       # Component catalog (localhost:6006)
pnpm build-storybook # Build static Storybook

pnpm docs:dev        # Starlight doc site (localhost:4321)
pnpm docs:build      # Build static doc site
pnpm docs:c4         # Export LikeC4 → Mermaid
pnpm docs:c4:serve   # Interactive C4 browser

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
| docs/02-journeys/       | Personas, user flows, 13 use cases                                    |
| docs/03-features/       | Analysis, workflows, data, navigation, learning                       |
| docs/04-cases/          | 7 case studies with demo data                                         |
| docs/05-technical/      | Architecture, implementation, integrations                            |
| docs/06-design-system/  | Colors, typography, components, charts, patterns                      |
| docs/07-decisions/      | ADR-001 through ADR-025                                               |
| docs/08-products/       | Azure, PWA, website specs, feature-parity matrix                      |
| docs/09-tutorials/      | Planned step-by-step guides                                           |
| docs/superpowers/specs/ | Design specs from brainstorming sessions (see index.md)               |
| docs/architecture/      | LikeC4 model (C4 L1-L3 source of truth)                               |
| docs/archive/           | HISTORICAL ONLY — removed features, do not reference for current work |

## Task → Documentation

| Domain                     | Read First                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Statistics / Capability    | docs/03-features/analysis/, packages/core/src/stats/, docs/05-technical/statistics-reference.md             |
| Charts                     | docs/06-design-system/charts/, .claude/rules/charts.md                                                      |
| Azure app / Auth / Storage | docs/08-products/azure/                                                                                     |
| Data input / Parser        | docs/03-features/data/, packages/core/src/parser/                                                           |
| Design system / UI         | docs/06-design-system/                                                                                      |
| Workflows / Analysis       | docs/03-features/workflows/                                                                                 |
| Mental models / Hierarchy  | docs/05-technical/architecture/mental-model-hierarchy.md, journey-phase-screen-mapping.md                   |
| Investigation / Findings   | adr-015, adr-020, docs/03-features/workflows/investigation-to-action.md, hypothesis-investigation.md        |
| AI integration             | adr-019, docs/05-technical/architecture/ai-architecture.md, ai-data-flow.md, ai-context-engineering.md      |
| Deployment / CI            | docs/05-technical/implementation/deployment.md, .github/workflows/                                          |
| Architecture / ADRs        | docs/07-decisions/, docs/05-technical/                                                                      |
| Website                    | docs/08-products/website/, apps/website/                                                                    |
| Methodology / Personas     | docs/01-vision/, docs/02-journeys/                                                                          |
| Business strategy          | docs/01-vision/business-bible.md                                                                            |
| Tier philosophy / Pricing  | docs/08-products/tier-philosophy.md, docs/08-products/feature-parity.md                                     |
| AI user experience         | docs/03-features/workflows/ai-experience-narrative.md                                                       |
| Journey traceability       | docs/02-journeys/traceability.md                                                                            |
| Internationalization       | adr-025, packages/core/src/i18n/, packages/hooks/src/useLocaleState.ts, useTranslation.ts                   |
| Testing                    | .claude/rules/testing.md, docs/05-technical/implementation/testing.md                                       |
| Report View / Sharing      | adr-024, docs/superpowers/specs/2026-03-16-scouting-report-design.md                                        |
| Verification / Staged      | adr-023, docs/03-features/analysis/staged-analysis.md                                                       |
| Characteristic types       | docs/03-features/analysis/characteristic-types.md, packages/core/src/types.ts                               |
| Data lifecycle / Append    | adr-023, apps/azure/src/hooks/useEditorDataFlow.ts                                                          |
| Teams integration          | adr-016, docs/08-products/azure/authentication.md                                                           |
| Platform comparison        | docs/08-products/feature-parity.md                                                                          |
| Knowledge model / Glossary | docs/05-technical/architecture/knowledge-model.md, packages/core/src/glossary/                              |
| C4 architecture model      | docs/architecture/likec4/                                                                                   |
| Documentation site         | apps/docs/ (Astro + Starlight)                                                                              |
| Methodology Coach          | docs/superpowers/specs/2026-03-18-methodology-coach-design.md, packages/ui/src/components/MethodologyCoach/ |

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
│   ├── azure/         # Azure Team App (EasyAuth + OneDrive sync)
│   ├── website/       # Marketing website (Astro + React Islands)
│   └── docs/          # Documentation site (Astro + Starlight)
├── infra/             # ARM template + Azure Functions
└── docs/              # Documentation (see table above)
```

## Key Entry Points

| Package                                        | Key Files                                                                        | Purpose                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/core/src/`                           | stats/, parser/, types.ts, tier.ts, ai/, glossary/, variation/                   | Stats engine (13 modules), parser, types, tier, AI context, glossary, simulation |
| `packages/charts/src/`                         | IChart, Boxplot, Pareto, Performance\*, colors.ts, useChartTheme                 | Chart components (see .claude/rules/charts.md)                                   |
| `packages/hooks/src/`                          | use\*.ts (see .claude/rules/monorepo.md for full list)                           | 40+ shared React hooks                                                           |
| `packages/ui/src/components/`                  | \*/ (see .claude/rules/monorepo.md for full list)                                | 60+ shared UI components                                                         |
| `packages/data/src/samples/`                   | coffee, journey, bottleneck, sachets                                             | Sample datasets                                                                  |
| `apps/pwa/src/`                                | context/DataContext.tsx, components/Dashboard.tsx                                | PWA state + main UI                                                              |
| `apps/azure/src/`                              | context/DataContext.tsx, services/, auth/, hooks/useEditor\*.ts                  | Azure state, storage, auth, AI                                                   |
| `packages/ui/src/components/MethodologyCoach/` | JourneyPhaseStrip, CoachPopover, MobileCoachSheet, DiamondPhaseMap, PDCAProgress | Phase strip in header + popover coaching                                         |
| `infra/`                                       | mainTemplate.json, functions/                                                    | ARM template, Azure Functions                                                    |

## Key Patterns

- **No Backend**: All processing in browser, data stays local
- **Shared Logic**: Statistics in `@variscout/core`, charts in `@variscout/charts`
- **Props-based Charts**: Chart components accept data via props (not context)
- **Persistence**: PWA = session-only (no persistence); Azure Standard = IndexedDB (local); Azure Team = IndexedDB + OneDrive sync
- **Offline-first**: PWA works without internet after first visit

See `.claude/rules/` for code style, chart, testing, and monorepo conventions.

## Products & Pricing

| Product        | Distribution      | Pricing    | Features                                               | Status      |
| -------------- | ----------------- | ---------- | ------------------------------------------------------ | ----------- |
| Azure Standard | Azure Marketplace | €99/month  | Full analysis, local file storage                      | **PRIMARY** |
| Azure Team     | Azure Marketplace | €199/month | + Teams, OneDrive, SharePoint, mobile, photos          | **PRIMARY** |
| Azure Team AI  | Azure Marketplace | €279/month | + AI Knowledge Base, AI-enhanced CoScout, org learning | **PRIMARY** |
| PWA            | Public URL        | FREE       | Training & education (forever free)                    | Production  |

See [ADR-007](docs/07-decisions/adr-007-azure-marketplace-distribution.md) for the distribution strategy.
