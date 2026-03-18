---
title: 'Technical Documentation'
---

# Technical Documentation

Technical specifications for VariScout implementation. These documents are designed to be used by developers (human or AI) building the product.

---

## Architecture Overview

```
VARISCOUT ARCHITECTURE (Browser-Only)
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    REACT APPLICATION                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ I-Chart │  │ Boxplot │  │ Pareto  │  │Capability│      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  │                      │                                     │ │
│  │                      ↓                                     │ │
│  │              ┌───────────────┐                            │ │
│  │              │ Analysis Core │ (statistics, calculations)  │ │
│  │              └───────────────┘                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      IndexedDB                             │ │
│  │           ┌──────────┐  ┌──────────┐                      │ │
│  │           │ Projects │  │ Settings │                      │ │
│  │           └──────────┘  └──────────┘                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Service Worker                           │ │
│  │              (offline caching, PWA)                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

  No external payment or license services.
  Tier detection: Azure Marketplace (ARM template params / Graph API).
  See ADR-007 for distribution strategy.
```

---

## Sections

### Architecture

High-level architecture overview and detailed design documents:

| Document                                                  | Description                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| [Architecture Overview](architecture.md)                  | High-level system architecture                              |
| [Monorepo Structure](architecture/monorepo.md)            | pnpm workspaces, package boundaries                         |
| [Offline-First](architecture/offline-first.md)            | PWA, service worker, IndexedDB                              |
| [Shared Packages](architecture/shared-packages.md)        | Package extraction and reuse strategy                       |
| [Data Flow](architecture/data-flow.md)                    | Data pipeline from input to visualization                   |
| [Component Patterns](architecture/component-patterns.md)  | Hook integration, colorScheme, base patterns                |
| [AI Architecture](architecture/ai-architecture.md)        | AI integration, Azure AI Foundry, context pipeline          |
| [AIX Design System](architecture/aix-design-system.md)    | AI experience governance: tone, trust, interaction patterns |
| [AI Readiness Review](../archive/ai-readiness-review.md)  | Strategic assessment (archived — all gaps resolved)         |
| [Documentation Methodology](documentation-methodology.md) | Diataxis, C4, Docs-as-Code, journey spine                   |

### Implementation

Build, deploy, test, and operate:

| Document                                                 | Description                                |
| -------------------------------------------------------- | ------------------------------------------ |
| [Deployment](implementation/deployment.md)               | Build and deployment pipeline              |
| [Testing](implementation/testing.md)                     | Vitest, Playwright, verification protocols |
| [Data Input](implementation/data-input.md)               | Parser, paste flow, column detection       |
| [System Limits](implementation/system-limits.md)         | Row limits, factor limits, performance     |
| [Security Scanning](implementation/security-scanning.md) | OWASP scanning, CVE checks                 |
| [AI Tooling (ruflo)](implementation/ruflo.md)            | AI development workflow tooling            |
| [Statistics Reference](statistics-reference.md)          | Exact formulas, algorithms, implementation |

### Integrations

Cross-product and embedding:

| Document                                           | Description                   |
| -------------------------------------------------- | ----------------------------- |
| [Embed Messaging](integrations/embed-messaging.md) | postMessage API for embedding |
| [Shared UI](integrations/shared-ui.md)             | Shared UI component strategy  |

---

## Key Technical Decisions

| Decision                 | Choice            | Rationale                                       |
| ------------------------ | ----------------- | ----------------------------------------------- |
| No backend for user data | Client-only       | GDPR simplicity, no hosting costs               |
| IndexedDB for storage    | Dexie.js          | Large data support, async, persistent           |
| Tier detection           | Azure Marketplace | ARM template parameters, Graph API tenant check |
| Distribution             | Azure Marketplace | Per-seat SaaS subscriptions, Microsoft billing  |
| Hosting                  | Azure App Service | WEBSITE_RUN_FROM_PACKAGE, EasyAuth              |

See [Architecture Decision Records](../07-decisions/index.md) for detailed rationale.

---

## Development Setup

```bash
# Clone repo
git clone https://github.com/your-org/variscout-lite.git
cd variscout-lite

# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Quick Reference

```bash
pnpm dev             # PWA dev server (localhost:5173)
pnpm --filter @variscout/azure-app dev  # Azure app dev server

pnpm build           # Build all packages and apps
pnpm test            # Run Vitest tests (all packages)

# AI development tooling
npx ruflo@latest daemon status              # Check worker state
npx ruflo@latest memory search --query "..."  # Semantic search
npx ruflo@latest security scan --depth full   # OWASP scan
```
