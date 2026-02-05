# VariScout

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)
[![PWA](https://img.shields.io/badge/PWA-ready-purple.svg)](#install-as-app)

A lightweight, offline-first variation analysis tool for quality professionals. No AI, no subscriptions, no API keys — just fast, linked charts that reveal hidden variation.

> _"Cut through your watermelons — without the cloud."_

## Quick Start

```bash
# Prerequisites: Node.js v18+, pnpm v8+
pnpm install
pnpm dev             # PWA dev server (localhost:5173)
pnpm dev:excel       # Excel Add-in (localhost:3000)
pnpm test            # Run all tests
pnpm build           # Build all packages
```

## Documentation

| I want to...                      | Start here                                       |
| --------------------------------- | ------------------------------------------------ |
| Understand the product vision     | [docs/01-vision/](docs/01-vision/)               |
| Learn about target users          | [docs/02-journeys/](docs/02-journeys/)           |
| See feature documentation         | [docs/03-features/](docs/03-features/)           |
| Work through case studies         | [docs/04-cases/](docs/04-cases/)                 |
| Understand technical architecture | [docs/05-technical/](docs/05-technical/)         |
| Follow design system guidelines   | [docs/06-design-system/](docs/06-design-system/) |
| Review architecture decisions     | [docs/07-decisions/](docs/07-decisions/)         |
| See product-specific specs        | [docs/08-products/](docs/08-products/)           |

**Key documents:**

- [Architecture](docs/05-technical/architecture.md) — Technical details
- [Specifications](docs/03-features/specifications.md) — Detailed functional requirements
- [Product Overview](docs/01-vision/product-overview.md) — Philosophy and what we built
- [UX Research](docs/02-journeys/ux-research.md) — User personas and use cases

## Repository Structure

```
variscout-lite/
├── packages/
│   ├── core/          # @variscout/core - Stats, parser, license (pure TypeScript)
│   ├── charts/        # @variscout/charts - Props-based Visx chart components
│   ├── data/          # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/         # @variscout/hooks - Shared React hooks
│   └── ui/            # @variscout/ui - Shared UI utilities and components
├── apps/
│   ├── pwa/           # PWA website (mobile + desktop)
│   ├── website/       # Marketing website (Astro + React Islands)
│   ├── azure/         # Azure Team App (SharePoint, SSO)
│   └── excel-addin/   # Excel Add-in (Task Pane + Content Add-in)
└── docs/              # Documentation (see table above)
```

## Features at a Glance

- **Three-Chart Dashboard**: I-Chart, Boxplot, and Pareto with linked filtering
- **Capability Analysis**: Cp, Cpk, and conformance metrics
- **Offline-First**: Full PWA support, works without internet
- **Multi-Platform**: PWA, Excel Add-in, Azure Team App
- **Privacy-First**: 100% browser-based, no data leaves your device

## Editions

| Edition       | Price    | Features                                      |
| ------------- | -------- | --------------------------------------------- |
| **Community** | Free     | Full features, "VariScout" branding on charts |
| **Licensed**  | €99/year | No branding, theme customization (PWA only)   |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## For AI Agents

See [CLAUDE.md](CLAUDE.md) for codebase reference and AI agent instructions.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built for quality professionals who need answers, not dashboards.</sub>
</p>
