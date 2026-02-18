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

<div class="grid cards" markdown>

- :material-source-branch:{ .lg .middle } **Architecture**

  ***

  Monorepo structure, offline-first design, shared packages

  [:octicons-arrow-right-24: Architecture](architecture/monorepo.md)

- :material-rocket-launch:{ .lg .middle } **Implementation**

  ***

  Deployment, testing strategy, data input handling, AI tooling

  [:octicons-arrow-right-24: Implementation](implementation/deployment.md)
  [:octicons-arrow-right-24: AI Tooling](implementation/claude-flow.md)

- :material-puzzle:{ .lg .middle } **Integrations**

  ***

  Embed messaging, shared UI strategy

  [:octicons-arrow-right-24: Integrations](integrations/embed-messaging.md)

</div>

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
npx claude-flow@v3alpha daemon status              # Check worker state
npx claude-flow@v3alpha memory search --query "..."  # Semantic search
npx claude-flow@v3alpha security scan --depth full   # OWASP scan
```
